import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import PredictionSlot from "@/lib/models/PredictionSlot";
import User from "@/lib/models/User";
import Bet from "@/lib/models/Bet";
import Transaction from "@/lib/models/Transaction";

const createApprovedTransaction = async (params: { userId: string; userName: string; amount: number; description: string }) => {
  await Transaction.create({
    userId: params.userId,
    userName: params.userName,
    amount: params.amount,
    description: params.description,
    status: "approved",
  });
};

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const now = new Date();
    // Only process slots where endTime has definitely passed (with 1 second buffer for safety)
    const expiredSlots = await PredictionSlot.find({
      endTime: { $lt: new Date(now.getTime() - 1000) }, // 1 second buffer to ensure time has truly passed
      status: "open",
    });

    const results = [];

    const adminUser = await User.findOne({ role: "admin" });

    for (const slot of expiredSlots) {
      // Atomically mark slot as processing to prevent race conditions
      const currentSlot = await PredictionSlot.findOneAndUpdate(
        { _id: slot._id, status: "open" },
        { $set: { status: "processing" } },
        { new: true }
      );
      
      if (!currentSlot) {
        continue; // Slot already processed or not found
      }

      const allBets = await Bet.find({ slotId: currentSlot._id, status: "pending" });

      const betsByIconMap = new Map<string, { totalBets: number; totalAmount: number }>();
      allBets.forEach((bet) => {
        const existing = betsByIconMap.get(bet.icon) || { totalBets: 0, totalAmount: 0 };
        existing.totalBets += 1;
        existing.totalAmount += bet.amount;
        betsByIconMap.set(bet.icon, existing);
      });

      let leastBetIcon = "";
      let leastBetAmount = Infinity;
      let leastBetCount = Infinity;

      betsByIconMap.forEach((data, icon) => {
        if (data.totalAmount < leastBetAmount || (data.totalAmount === leastBetAmount && data.totalBets < leastBetCount)) {
          leastBetAmount = data.totalAmount;
          leastBetCount = data.totalBets;
          leastBetIcon = icon;
        }
      });

      if (!leastBetIcon) {
        currentSlot.status = "closed";
        await currentSlot.save();
        results.push({
          slotId: currentSlot._id.toString(),
          slotNumber: currentSlot.slotNumber,
          action: "closed",
          reason: "No bets found",
        });
        continue;
      }

      const winningBets = await Bet.find({ slotId: currentSlot._id, icon: leastBetIcon, status: "pending" });
      const totalSlotAmount = currentSlot.totalAmount; // Total pool from all bets

      // Profit only when more than 1 unique user participated
      const uniqueUsersCount = new Set(allBets.map((bet) => bet.userId.toString())).size;
      const commissionRate = uniqueUsersCount > 1 ? 0.20 : 0;

      // Updated logic:
      // - Take 20% commission only if >1 user
      // - Distribute remaining (100% or 80%) to winners PROPORTIONAL to the coins they bet
      const companyCommission = totalSlotAmount * commissionRate;
      const totalPayoutToWinners = totalSlotAmount - companyCommission;
      const totalWinningAmount = winningBets.reduce(
        (sum, bet) => sum + bet.amount,
        0
      );
      
      // Atomically update slot to completed
      currentSlot.winningIcon = leastBetIcon;
      currentSlot.companyCommission = companyCommission;
      currentSlot.status = "completed";
      await currentSlot.save();

      for (const bet of winningBets) {
        // Use atomic update to prevent double-processing
        const updatedBet = await Bet.findOneAndUpdate(
          { _id: bet._id, status: "pending" },
          {
            $set: {
              status: "won",
              payout: totalWinningAmount > 0
                ? (totalPayoutToWinners * bet.amount) / totalWinningAmount
                : 0,
            },
          },
          { new: true }
        );

        if (updatedBet) {
          const payout = updatedBet.payout || 0;
          await User.findByIdAndUpdate(bet.userId, { $inc: { walletBalance: payout } });
          await createApprovedTransaction({
            userId: bet.userId.toString(),
            userName: bet.userName,
            amount: payout,
            description: `Bet winning for Slot #${currentSlot.slotNumber}`,
          });
        }
      }

      // Atomically update all losing bets
      await Bet.updateMany(
        {
          slotId: currentSlot._id,
          icon: { $ne: leastBetIcon },
          status: "pending",
        },
        { $set: { status: "lost" } }
      );

      if (companyCommission > 0 && adminUser) {
        await User.findByIdAndUpdate(adminUser._id, { $inc: { walletBalance: companyCommission } });
        await createApprovedTransaction({
          userId: adminUser._id.toString(),
          userName: adminUser.name,
          amount: companyCommission,
          description: `Commission earned from Slot #${currentSlot.slotNumber}`,
        });
      }

      results.push({
        slotId: currentSlot._id.toString(),
        slotNumber: currentSlot.slotNumber,
        action: "completed",
        winningIcon: leastBetIcon,
        totalWinners: winningBets.length,
        totalPayout: totalPayoutToWinners,
        companyCommission,
      });
    }

    return NextResponse.json({
      message: `Processed ${expiredSlots.length} expired slot(s)`,
      results,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}

