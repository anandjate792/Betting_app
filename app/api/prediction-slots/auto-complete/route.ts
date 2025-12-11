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
    const expiredSlots = await PredictionSlot.find({
      endTime: { $lt: now },
      status: "open",
    });

    const results = [];

    const adminUser = await User.findOne({ role: "admin" });

    for (const slot of expiredSlots) {
      // Skip if slot is already processed (race condition protection)
      const currentSlot = await PredictionSlot.findById(slot._id);
      if (!currentSlot || currentSlot.status !== "open") {
        continue;
      }

      const allBets = await Bet.find({ slotId: currentSlot._id, status: "pending" });
      const uniqueUsers = new Set(allBets.map((bet) => bet.userId.toString()));

      if (uniqueUsers.size < 2) {
        // Update slot status first to prevent duplicate processing
        currentSlot.status = "closed";
        currentSlot.winningIcon = null;
        currentSlot.companyCommission = 0;
        await currentSlot.save();
        
        // Re-fetch bets to ensure we only process pending ones
        const pendingBets = await Bet.find({ slotId: currentSlot._id, status: "pending" });
        for (const bet of pendingBets) {
          // Double-check bet is still pending before processing
          const currentBet = await Bet.findById(bet._id);
          if (currentBet && currentBet.status === "pending") {
            currentBet.status = "cancelled";
            await currentBet.save();
            await User.findByIdAndUpdate(bet.userId, { $inc: { walletBalance: bet.amount } });
            await createApprovedTransaction({
              userId: bet.userId.toString(),
              userName: bet.userName,
              amount: bet.amount,
              description: `Bet refund for Slot #${slot.slotNumber} (insufficient players)`,
            });
          }
        }
        currentSlot.totalAmount = 0;
        await currentSlot.save();
        results.push({
          slotId: currentSlot._id.toString(),
          slotNumber: currentSlot.slotNumber,
          action: "refunded",
          reason: "Less than 2 users",
        });
        continue;
      }

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

      currentSlot.winningIcon = leastBetIcon;
      currentSlot.status = "completed";

      const winningBets = await Bet.find({ slotId: currentSlot._id, icon: leastBetIcon, status: "pending" });
      const totalWinningAmount = winningBets.reduce((sum, bet) => sum + bet.amount, 0);
      const totalSlotAmount = currentSlot.totalAmount;
      const companyCommission = Math.max(10, totalSlotAmount * 0.05);
      const availablePayout = totalSlotAmount - companyCommission;
      currentSlot.companyCommission = companyCommission;
      await currentSlot.save();

      let payoutMultiplier = 1;
      if (totalWinningAmount > 0) {
        payoutMultiplier = Math.min(availablePayout / totalWinningAmount, 2);
      }

      for (const bet of winningBets) {
        // Double-check bet is still pending before processing
        const currentBet = await Bet.findById(bet._id);
        if (currentBet && currentBet.status === "pending") {
          const payout = bet.amount * payoutMultiplier;
          currentBet.payout = payout;
          currentBet.status = "won";
          await currentBet.save();
          await User.findByIdAndUpdate(bet.userId, { $inc: { walletBalance: payout } });
          await createApprovedTransaction({
            userId: bet.userId.toString(),
            userName: bet.userName,
            amount: payout,
            description: `Bet winning for Slot #${currentSlot.slotNumber}`,
          });
        }
      }

      const losingBets = await Bet.find({ slotId: currentSlot._id, icon: { $ne: leastBetIcon }, status: "pending" });
      for (const bet of losingBets) {
        const currentBet = await Bet.findById(bet._id);
        if (currentBet && currentBet.status === "pending") {
          currentBet.status = "lost";
          await currentBet.save();
        }
      }

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
        totalPayout: winningBets.reduce((sum, bet) => sum + bet.payout, 0),
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

