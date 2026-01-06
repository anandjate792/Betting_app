import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth-token";
import PredictionSlot from "@/lib/models/PredictionSlot";
import User from "@/lib/models/User";
import Setting from "@/lib/models/Setting";
import Bet from "@/lib/models/Bet";
import Transaction from "@/lib/models/Transaction";

const getAuthUser = async (request: NextRequest) => {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split(" ")[1];
  const decoded = token ? verifyToken(token) : null;
  if (!decoded || typeof decoded !== "object" || !("id" in decoded)) {
    return null;
  }
  await connectDB();
  const user = await User.findById((decoded as any).id);
  return user;
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

// Failsafe: finalize any expired slots that are still open.
// IMPORTANT: Only process slots where endTime has definitely passed (with small buffer for safety)
const finalizeExpiredOpenSlots = async () => {
  const now = new Date();
  // Only process slots where endTime has passed (with 1 second buffer to avoid race conditions)
  const expiredSlots = await PredictionSlot.find({
    endTime: { $lt: new Date(now.getTime() - 1000) }, // 1 second buffer to ensure time has truly passed
    status: "open",
  });

  if (!expiredSlots.length) return;

  const adminUser = await User.findOne({ role: "admin" });

  for (const slot of expiredSlots) {
    // Atomically mark slot as processing to prevent race conditions
    const currentSlot = await PredictionSlot.findOneAndUpdate(
      { _id: slot._id, status: "open" },
      { $set: { status: "processing" } },
      { new: true }
    );
    
    if (!currentSlot) continue; // Slot already processed or not found

    const allBets = await Bet.find({
      slotId: currentSlot._id,
      status: "pending",
    });

    if (!allBets.length) {
      currentSlot.status = "closed";
      currentSlot.winningIcon = null;
      currentSlot.companyCommission = 0;
      await currentSlot.save();
      continue;
    }

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
        { slotId: currentSlot._id, status: "pending" },
        { $set: { status: "cancelled" } }
      );
      
      // Mark slot as cancelled
      currentSlot.status = "cancelled";
      currentSlot.winningIcon = null;
      currentSlot.companyCommission = 0;
      await currentSlot.save();
      continue;
    }

    // Multiple users - select random winning icon
    const iconsWithBets = [...new Set(allBets.map((bet) => bet.icon))];
    const randomWinningIcon = iconsWithBets[Math.floor(Math.random() * iconsWithBets.length)];

    const winningBets = await Bet.find({
      slotId: currentSlot._id,
      icon: randomWinningIcon,
      status: "pending",
    });
    const totalSlotAmount = currentSlot.totalAmount;

    // Always take 25% commission
    const companyCommission = totalSlotAmount * 0.25;
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
        await User.findByIdAndUpdate(bet.userId, {
          $inc: { walletBalance: payoutPerWinner },
        });
        await createApprovedTransaction({
          userId: bet.userId.toString(),
          userName: bet.userName,
          amount: payoutPerWinner,
          description: `Bet winning for Slot #${currentSlot.slotNumber}`,
        });
      }
    }

    // Atomically update all losing bets (only update pending bets to avoid overwriting already processed bets)
    await Bet.updateMany(
      {
        slotId: currentSlot._id,
        icon: { $ne: randomWinningIcon },
        status: "pending",
      },
      { $set: { status: "lost" } }
    );
    
    // Also update any bets that might have been missed (safety check)
    await Bet.updateMany(
      {
        slotId: currentSlot._id,
        icon: { $ne: randomWinningIcon },
        status: { $nin: ["won", "lost", "cancelled"] },
      },
      { $set: { status: "lost" } }
    );

    if (adminUser) {
      await User.findByIdAndUpdate(adminUser._id, {
        $inc: { walletBalance: companyCommission },
      });
      await createApprovedTransaction({
        userId: adminUser._id.toString(),
        userName: adminUser.name,
        amount: companyCommission,
        description: `Commission earned from Slot #${currentSlot.slotNumber}`,
      });
    }
  }
};

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    // Only finalize slots that have truly expired (endTime has passed)
    // This ensures slots stay open for the full 45 seconds regardless of bet count
    await finalizeExpiredOpenSlots();
    const url = new URL(request.url);
    const current = url.searchParams.get("current") === "true";

    if (current) {
      const autoCreateSetting = await Setting.findOne({ key: "autoCreateSlots" });
      const autoCreateEnabled = Boolean(autoCreateSetting?.value);
      const now = new Date();
      // Find active slot: must have started (startTime <= now) and not expired (endTime >= now)
      // IMPORTANT: Slots remain open for the FULL 45 seconds regardless of user count or bets
      let slot = await PredictionSlot.findOne({
        startTime: { $lte: now },
        endTime: { $gte: now }, // endTime >= now means slot is still active
        status: "open",
      }).sort({ startTime: -1 });

      if (!slot && autoCreateEnabled) {
        // create an on-demand 45-second slot so users aren't blocked when admin is offline
        const nextSlotStart = new Date(now);
        const nextSlotEnd = new Date(nextSlotStart.getTime() + 45 * 1000);

        const lastSlot = await PredictionSlot.findOne().sort({ slotNumber: -1 });
        const slotNumber = lastSlot ? lastSlot.slotNumber + 1 : 1;

        slot = await PredictionSlot.create({
          slotNumber,
          startTime: nextSlotStart,
          endTime: nextSlotEnd,
          status: "open",
          betsByIcon: new Map(),
        });
      }

      if (!slot) {
        return NextResponse.json({ error: "No active slot found" }, { status: 404 });
      }

      const betsByIconObj: Record<string, { totalBets: number; totalAmount: number }> = {};
      if (slot.betsByIcon && slot.betsByIcon instanceof Map) {
        slot.betsByIcon.forEach((value, key) => {
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
        totalBets: slot.totalBets,
        totalAmount: slot.totalAmount,
        betsByIcon: betsByIconObj,
      });
    }

    const slots = await PredictionSlot.find().sort({ startTime: -1 }).limit(20);
    const formatted = slots.map((s) => ({
      id: s._id.toString(),
      slotNumber: s.slotNumber,
      startTime: s.startTime,
      endTime: s.endTime,
      status: s.status,
      winningIcon: s.winningIcon,
      totalBets: s.totalBets,
      totalAmount: s.totalAmount,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { startTime, endTime } = await request.json();
    if (!startTime || !endTime) {
      return NextResponse.json({ error: "Start time and end time required" }, { status: 400 });
    }

    await connectDB();

    const lastSlot = await PredictionSlot.findOne().sort({ slotNumber: -1 });
    const slotNumber = lastSlot ? lastSlot.slotNumber + 1 : 1;

    const newSlot = await PredictionSlot.create({
      slotNumber,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      status: "open",
      betsByIcon: new Map(),
    });

    return NextResponse.json(
      {
        id: newSlot._id.toString(),
        slotNumber: newSlot.slotNumber,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
        status: newSlot.status,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}

