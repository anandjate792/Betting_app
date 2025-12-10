import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import PredictionSlot from "@/lib/models/PredictionSlot";
import User from "@/lib/models/User";
import Bet from "@/lib/models/Bet";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const now = new Date();
    const expiredSlots = await PredictionSlot.find({
      endTime: { $lt: now },
      status: "open",
    });

    const results = [];

    for (const slot of expiredSlots) {
      const allBets = await Bet.find({ slotId: slot._id, status: "pending" });
      const uniqueUsers = new Set(allBets.map((bet) => bet.userId.toString()));

      if (uniqueUsers.size < 2) {
        for (const bet of allBets) {
          bet.status = "cancelled";
          await bet.save();
          await User.findByIdAndUpdate(bet.userId, { $inc: { walletBalance: bet.amount } });
        }
        slot.status = "closed";
        slot.winningIcon = null;
        await slot.save();
        results.push({
          slotId: slot._id.toString(),
          slotNumber: slot.slotNumber,
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
        slot.status = "closed";
        await slot.save();
        results.push({
          slotId: slot._id.toString(),
          slotNumber: slot.slotNumber,
          action: "closed",
          reason: "No bets found",
        });
        continue;
      }

      slot.winningIcon = leastBetIcon;
      slot.status = "completed";
      await slot.save();

      const winningBets = await Bet.find({ slotId: slot._id, icon: leastBetIcon, status: "pending" });
      const totalWinningAmount = winningBets.reduce((sum, bet) => sum + bet.amount, 0);
      const totalSlotAmount = slot.totalAmount;
      const companyCommission = Math.max(10, totalSlotAmount * 0.05);
      const availablePayout = totalSlotAmount - companyCommission;

      let payoutMultiplier = 1;
      if (totalWinningAmount > 0) {
        payoutMultiplier = Math.min(availablePayout / totalWinningAmount, 2);
      }

      for (const bet of winningBets) {
        const payout = bet.amount * payoutMultiplier;
        bet.payout = payout;
        bet.status = "won";
        await bet.save();
        await User.findByIdAndUpdate(bet.userId, { $inc: { walletBalance: payout } });
      }

      const losingBets = await Bet.find({ slotId: slot._id, icon: { $ne: leastBetIcon }, status: "pending" });
      for (const bet of losingBets) {
        bet.status = "lost";
        await bet.save();
      }

      results.push({
        slotId: slot._id.toString(),
        slotNumber: slot.slotNumber,
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

