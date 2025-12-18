import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth-token";
import PredictionSlot from "@/lib/models/PredictionSlot";
import User from "@/lib/models/User";
import Bet from "@/lib/models/Bet";
import Transaction from "@/lib/models/Transaction";

const getAdmin = async (request: NextRequest) => {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split(" ")[1];
  const decoded = token ? verifyToken(token) : null;
  if (
    !decoded ||
    typeof decoded !== "object" ||
    (decoded as any).role !== "admin"
  ) {
    return null;
  }
  await connectDB();
  const admin = await User.findById((decoded as any).id);
  if (!admin || admin.role !== "admin") return null;
  return admin;
};

const createApprovedTransaction = async (params: {
  userId: string;
  userName: string;
  amount: number;
  description: string;
}) => {
  await Transaction.create({
    userId: params.userId,
    userName: params.userName,
    amount: params.amount,
    description: params.description,
    status: "approved",
  });
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slotId: string }> | { slotId: string } }
) {
  try {
    const { slotId } = await Promise.resolve(params);
    const admin = await getAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { winningIcon } = await request.json();
    if (!winningIcon) {
      return NextResponse.json(
        { error: "Winning icon required" },
        { status: 400 }
      );
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
      // Update slot status first to prevent duplicate processing
      const totalRefundedAmount = slot.totalAmount;
      slot.status = "closed";
      slot.winningIcon = null;
      slot.companyCommission = 0;
      await slot.save();

      // Only process bets that are still pending (not already cancelled)
      const pendingBets = await Bet.find({
        slotId: slot._id,
        status: "pending",
      });
      for (const bet of pendingBets) {
        // Double-check bet is still pending before processing
        const currentBet = await Bet.findById(bet._id);
        if (currentBet && currentBet.status === "pending") {
          currentBet.status = "cancelled";
          await currentBet.save();
          await User.findByIdAndUpdate(bet.userId, {
            $inc: { walletBalance: bet.amount },
          });
          await createApprovedTransaction({
            userId: bet.userId.toString(),
            userName: bet.userName,
            amount: bet.amount,
            description: `Bet refund for Slot #${slot.slotNumber} (insufficient players)`,
          });
        }
      }
      slot.totalAmount = 0;
      await slot.save();

      return NextResponse.json(
        {
          error: "Minimum 2 users required. All bets have been refunded.",
          refunded: pendingBets.length,
          totalRefunded: totalRefundedAmount,
        },
        { status: 400 }
      );
    }

    slot.winningIcon = winningIcon;
    slot.status = "completed";

    const winningBets = await Bet.find({
      slotId: slot._id,
      icon: winningIcon,
      status: "pending",
    });
    const totalSlotAmount = slot.totalAmount; // Total pool from all bets

    // Updated logic: Take 20% commission from total pool, distribute remaining 80% equally among winners
    const companyCommission = totalSlotAmount * 0.2;
    const totalPayoutToWinners = totalSlotAmount * 0.8;
    const payoutPerWinner =
      winningBets.length > 0 ? totalPayoutToWinners / winningBets.length : 0;

    slot.companyCommission = companyCommission;
    await slot.save();

    for (const bet of winningBets) {
      // Double-check bet is still pending before processing
      const currentBet = await Bet.findById(bet._id);
      if (currentBet && currentBet.status === "pending") {
        // Each winner gets equal share of 90% of winners' total
        const payout = payoutPerWinner;
        currentBet.payout = payout;
        currentBet.status = "won";
        await currentBet.save();

        await User.findByIdAndUpdate(bet.userId, {
          $inc: { walletBalance: payout },
        });
        await createApprovedTransaction({
          userId: bet.userId.toString(),
          userName: bet.userName,
          amount: payout,
          description: `Bet winning for Slot #${slot.slotNumber}`,
        });
      }
    }

    const losingBets = await Bet.find({
      slotId: slot._id,
      icon: { $ne: winningIcon },
      status: "pending",
    });
    for (const bet of losingBets) {
      const currentBet = await Bet.findById(bet._id);
      if (currentBet && currentBet.status === "pending") {
        currentBet.status = "lost";
        await currentBet.save();
      }
    }

    if (companyCommission > 0) {
      await User.findByIdAndUpdate(admin._id, {
        $inc: { walletBalance: companyCommission },
      });
      await createApprovedTransaction({
        userId: admin._id.toString(),
        userName: admin.name,
        amount: companyCommission,
        description: `Commission earned from Slot #${slot.slotNumber}`,
      });
    }

    return NextResponse.json({
      message: "Slot completed",
      winningIcon,
      totalWinners: winningBets.length,
      totalPayout: totalPayoutToWinners,
      companyCommission,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
