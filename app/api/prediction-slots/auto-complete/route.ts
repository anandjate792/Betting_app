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

      if (!allBets.length) {
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

      // Check if only single user bet - cancel and refund
      const uniqueUsersCount = new Set(allBets.map((bet) => bet.userId.toString())).size;

      if (uniqueUsersCount === 1) {
        // Only one user bet - cancel all bets and refund
        const userId = allBets[0].userId;
        const totalRefund = allBets.reduce((sum, bet) => sum + bet.amount, 0);
        
        // Refund to user
        await User.findByIdAndUpdate(userId, {
          $inc: { walletBalance: totalRefund },
        });
        
        // Mark all bets as cancelled
        await Bet.updateMany(
          { slotId: currentSlot._id, status: "pending" },
          { $set: { status: "cancelled" } }
        );
        
        // Mark slot as cancelled
        currentSlot.status = "cancelled";
        currentSlot.winningIcon = null;
        currentSlot.companyCommission = 0;
        await currentSlot.save();

        results.push({
          slotId: currentSlot._id.toString(),
          slotNumber: currentSlot.slotNumber,
          action: "cancelled",
          reason: "Only one user participated",
          refunded: totalRefund,
        });
        continue;
      }

      // Multiple users - select random winning icon
      const iconsWithBets = [...new Set(allBets.map((bet) => bet.icon))];
      const randomWinningIcon = iconsWithBets[Math.floor(Math.random() * iconsWithBets.length)];

      const winningBets = await Bet.find({ slotId: currentSlot._id, icon: randomWinningIcon, status: "pending" });
      const totalSlotAmount = currentSlot.totalAmount;

      // Always take 20% commission
      const companyCommission = totalSlotAmount * 0.2;
      const totalPayoutToWinners = totalSlotAmount - companyCommission;

      // Equal distribution: divide equally among all winners
      const payoutPerWinner = winningBets.length > 0 
        ? totalPayoutToWinners / winningBets.length 
        : 0;
      
      // Atomically update slot to completed
      currentSlot.winningIcon = randomWinningIcon;
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
              payout: payoutPerWinner,
            },
          },
          { new: true }
        );

        if (updatedBet) {
          await User.findByIdAndUpdate(bet.userId, { $inc: { walletBalance: payoutPerWinner } });
          await createApprovedTransaction({
            userId: bet.userId.toString(),
            userName: bet.userName,
            amount: payoutPerWinner,
            description: `Bet winning for Slot #${currentSlot.slotNumber}`,
          });
        }
      }

      // Atomically update all losing bets
      await Bet.updateMany(
        {
          slotId: currentSlot._id,
          icon: { $ne: randomWinningIcon },
          status: "pending",
        },
        { $set: { status: "lost" } }
      );

      if (adminUser) {
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
        winningIcon: randomWinningIcon,
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

