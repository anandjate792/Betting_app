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

    // Use findOneAndUpdate with atomic check to prevent race conditions
    const slot = await PredictionSlot.findOneAndUpdate(
      { _id: slotId, status: "open" },
      { $set: { status: "processing" } },
      { new: true }
    );
    
    if (!slot) {
      // Check if slot exists but is already completed/processing
      const existingSlot = await PredictionSlot.findById(slotId);
      if (existingSlot && existingSlot.status !== "open") {
        return NextResponse.json(
          { error: "Slot is already completed or being processed" },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    const allBets = await Bet.find({
      slotId: slot._id,
      status: "pending",
    });

    const winningBets = allBets.filter((bet) => bet.icon === winningIcon);
    const totalSlotAmount = slot.totalAmount; // Total pool from all bets

    // Profit only when more than 1 unique user participated
    const uniqueUsersCount = new Set(
      allBets.map((bet) => bet.userId.toString()),
    ).size;
    const commissionRate = uniqueUsersCount > 1 ? 0.2 : 0;

    // Updated logic:
    // - Take 20% commission only if >1 user
    // - Distribute remaining (100% or 80%) to winners PROPORTIONAL to coins
    const companyCommission = totalSlotAmount * commissionRate;
    const totalPayoutToWinners = totalSlotAmount - companyCommission;

    const totalWinningAmount = winningBets.reduce(
      (sum, bet) => sum + bet.amount,
      0
    );

    // Atomically update slot status to completed
    slot.winningIcon = winningIcon;
    slot.companyCommission = companyCommission;
    slot.status = "completed";
    await slot.save();

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

    // Atomically update all losing bets
    await Bet.updateMany(
      {
        slotId: slot._id,
        icon: { $ne: winningIcon },
        status: "pending",
      },
      { $set: { status: "lost" } }
    );

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
