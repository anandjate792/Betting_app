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

    // Winning icon is now randomly selected, but we still accept it for manual override
    const { winningIcon } = await request.json();

    await connectDB();

    // First check if slot exists and get it
    const existingSlot = await PredictionSlot.findById(slotId);
    if (!existingSlot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    // CRITICAL: Prevent manual completion before endTime
    const now = new Date();
    if (existingSlot.status === "open" && now < existingSlot.endTime) {
      return NextResponse.json(
        { 
          error: `Slot cannot be completed before end time. Slot ends at ${new Date(existingSlot.endTime).toLocaleString()}. Please wait for the full 45 seconds.` 
        },
        { status: 400 }
      );
    }

    // Use findOneAndUpdate with atomic check to prevent race conditions
    const slot = await PredictionSlot.findOneAndUpdate(
      { _id: slotId, status: "open" },
      { $set: { status: "processing" } },
      { new: true }
    );
    
    if (!slot) {
      // Check if slot exists but is already completed/processing
      if (existingSlot.status !== "open") {
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

    // Check if only single user bet - cancel and refund
    const uniqueUsersCount = new Set(
      allBets.map((bet) => bet.userId.toString()),
    ).size;

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
        { slotId: slot._id, status: "pending" },
        { $set: { status: "cancelled" } }
      );
      
      // Mark slot as cancelled
      slot.status = "cancelled";
      slot.winningIcon = "";
      slot.companyCommission = 0;
      await slot.save();

      return NextResponse.json({
        message: "Slot cancelled - only one user participated",
        refunded: totalRefund,
      });
    }

    // Multiple users - proceed with normal flow
    // Select winning icon with lowest total bet amount for company profit
    const iconsWithBets = [...new Set(allBets.map((bet) => bet.icon))];
    
    // Calculate total bet amount for each icon
    const iconTotals: Record<string, number> = {};
    for (const icon of iconsWithBets) {
      iconTotals[icon] = allBets
        .filter(bet => bet.icon === icon)
        .reduce((sum, bet) => sum + bet.amount, 0);
    }
    
    // Find icon with lowest total bet amount
    const lowestTotalBet = Math.min(...Object.values(iconTotals));
    const lowestBetIcons = Object.keys(iconTotals).filter(icon => iconTotals[icon] === lowestTotalBet);
    
    // If multiple icons have same lowest amount, select default one, otherwise select the lowest
    const randomWinningIcon = lowestBetIcons.length > 1 
      ? iconsWithBets[0] // Default to first icon in list
      : lowestBetIcons[0]; // Select the single lowest icon

    const winningBets = allBets.filter((bet) => bet.icon === randomWinningIcon);
    const totalSlotAmount = slot.totalAmount;

    // Calculate total payout to winners (10x each winner's bet)
    const totalPayoutToWinners = winningBets.reduce((sum, bet) => sum + (bet.amount * 10), 0);
    const companyCommission = totalSlotAmount - totalPayoutToWinners; // Remaining goes to platform

    // Atomically update slot status to completed
    slot.winningIcon = randomWinningIcon;
    slot.companyCommission = companyCommission;
    slot.status = "completed";
    await slot.save();

    for (const bet of winningBets) {
      // Calculate 10x payout for this winner
      const payoutPerWinner = bet.amount * 10;
      
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
        await User.findByIdAndUpdate(bet.userId, {
          $inc: { walletBalance: payoutPerWinner },
        });
        await createApprovedTransaction({
          userId: bet.userId.toString(),
          userName: bet.userName,
          amount: payoutPerWinner,
          description: `Bet winning for Slot #${slot.slotNumber}`,
        });
      }
    }

    // Atomically update all losing bets (only update pending bets to avoid overwriting already processed bets)
    await Bet.updateMany(
      {
        slotId: slot._id,
        icon: { $ne: randomWinningIcon },
        status: "pending",
      },
      { $set: { status: "lost" } }
    );
    
    // Also update any bets that might have been missed (safety check)
    await Bet.updateMany(
      {
        slotId: slot._id,
        icon: { $ne: randomWinningIcon },
        status: { $nin: ["won", "lost", "cancelled"] },
      },
      { $set: { status: "lost" } }
    );

    // Add commission to admin
    await User.findByIdAndUpdate(admin._id, {
      $inc: { walletBalance: companyCommission },
    });
    await createApprovedTransaction({
      userId: admin._id.toString(),
      userName: admin.name,
      amount: companyCommission,
      description: `Commission earned from Slot #${slot.slotNumber}`,
    });

    return NextResponse.json({
      message: "Slot completed",
      winningIcon: randomWinningIcon,
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

// Get a single prediction slot by id (public – no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slotId: string }> | { slotId: string } }
) {
  try {
    const { slotId } = await Promise.resolve(params);
    await connectDB();

    const slot = await PredictionSlot.findById(slotId).lean();
    if (!slot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    const betsByIconObj: Record<string, { totalBets: number; totalAmount: number }> = {};
    if (slot.betsByIcon && slot.betsByIcon instanceof Map) {
      slot.betsByIcon.forEach((value: any, key: string) => {
        betsByIconObj[key] = value;
      });
    } else if (slot.betsByIcon && typeof slot.betsByIcon === "object") {
      Object.assign(betsByIconObj, slot.betsByIcon);
    }

    return NextResponse.json({
      id: slot._id.toString(),
      slotNumber: slot.slotNumber,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: slot.status,
      winningIcon: slot.winningIcon,
      totalBets: slot.totalBets,
      totalAmount: slot.totalAmount,
      betsByIcon: betsByIconObj,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
