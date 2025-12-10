import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth-token";
import PredictionSlot from "@/lib/models/PredictionSlot";
import User from "@/lib/models/User";
import Bet from "@/lib/models/Bet";

const getAdmin = async (request: NextRequest) => {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split(" ")[1];
  const decoded = token ? verifyToken(token) : null;
  if (!decoded || typeof decoded !== "object" || (decoded as any).role !== "admin") {
    return null;
  }
  await connectDB();
  const admin = await User.findById((decoded as any).id);
  if (!admin || admin.role !== "admin") return null;
  return admin;
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ slotId: string }> | { slotId: string } }) {
  try {
    const { slotId } = await Promise.resolve(params);
    const admin = await getAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { winningIcon } = await request.json();
    if (!winningIcon) {
      return NextResponse.json({ error: "Winning icon required" }, { status: 400 });
    }

    await connectDB();

    const slot = await PredictionSlot.findById(slotId);
    if (!slot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    if (slot.status !== "open") {
      return NextResponse.json({ error: "Slot is not open" }, { status: 400 });
    }

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
      
      return NextResponse.json({
        error: "Minimum 2 users required. All bets have been refunded.",
        refunded: allBets.length,
        totalRefunded: slot.totalAmount,
      }, { status: 400 });
    }

    slot.winningIcon = winningIcon;
    slot.status = "completed";
    await slot.save();

    const winningBets = await Bet.find({ slotId: slot._id, icon: winningIcon, status: "pending" });
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

    const losingBets = await Bet.find({ slotId: slot._id, icon: { $ne: winningIcon }, status: "pending" });
    for (const bet of losingBets) {
      bet.status = "lost";
      await bet.save();
    }

    return NextResponse.json({
      message: "Slot completed",
      winningIcon,
      totalWinners: winningBets.length,
      totalPayout: winningBets.reduce((sum, bet) => sum + bet.payout, 0),
      companyCommission,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}

