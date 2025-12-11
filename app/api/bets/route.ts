import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth-token";
import Bet from "@/lib/models/Bet";
import PredictionSlot from "@/lib/models/PredictionSlot";
import User from "@/lib/models/User";

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

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const url = new URL(request.url);
    const slotId = url.searchParams.get("slotId");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "10"), 50);
    const skip = parseInt(url.searchParams.get("skip") || "0");

    const query: any = { userId: user._id };
    if (slotId) {
      query.slotId = slotId;
    }

    const [bets, total] = await Promise.all([
      Bet.find(query)
        .select(
          "_id userId userName slotId icon amount payout status createdAt"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("slotId", "slotNumber startTime endTime winningIcon status")
        .lean(),
      Bet.countDocuments(query),
    ]);

    const formatted = bets.map((b: any) => {
      const slotId = b.slotId;
      const isPopulated = slotId && typeof slotId === 'object' && slotId._id;
      
      return {
        id: b._id.toString(),
        userId: b.userId.toString(),
        userName: b.userName,
        slotId: isPopulated ? slotId._id.toString() : (slotId?.toString() || null),
        slotNumber: isPopulated ? slotId.slotNumber : null,
        icon: b.icon,
        amount: b.amount,
        payout: b.payout,
        status: b.status,
        createdAt: b.createdAt,
        slot: isPopulated ? {
          slotNumber: slotId.slotNumber,
          startTime: slotId.startTime,
          endTime: slotId.endTime,
          winningIcon: slotId.winningIcon,
          status: slotId.status,
        } : null,
      };
    });

    return NextResponse.json({
      data: formatted,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slotId, icon, amount } = await request.json();

    if (!slotId || !icon || !amount) {
      return NextResponse.json(
        { error: "Slot ID, icon, and amount are required" },
        { status: 400 }
      );
    }

    if (amount < 50) {
      return NextResponse.json(
        { error: "Minimum bet amount is 50 rupees" },
        { status: 400 }
      );
    }

    if (user.walletBalance < amount) {
      return NextResponse.json(
        { error: "Insufficient wallet balance" },
        { status: 400 }
      );
    }

    await connectDB();

    const existingBet = await Bet.findOne({
      userId: user._id,
      slotId,
      status: { $in: ["pending", "won", "lost", "cancelled"] },
    });
    if (existingBet) {
      return NextResponse.json(
        {
          error:
            "You already placed a bet on this slot. Please wait for the result.",
        },
        { status: 400 }
      );
    }

    const slot = await PredictionSlot.findById(slotId);
    if (!slot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    const now = new Date();
    if (now < slot.startTime || now > slot.endTime) {
      return NextResponse.json(
        { error: "Slot is not active" },
        { status: 400 }
      );
    }

    if (slot.status !== "open") {
      return NextResponse.json(
        { error: "Slot is not open for betting" },
        { status: 400 }
      );
    }

    const validIcons = [
      "umbrella",
      "fish",
      "hen",
      "coin",
      "star",
      "heart",
      "diamond",
      "spade",
      "club",
      "trophy",
      "crown",
      "gem",
    ];
    if (!validIcons.includes(icon)) {
      return NextResponse.json({ error: "Invalid icon" }, { status: 400 });
    }

    user.walletBalance -= amount;
    await user.save();

    const bet = await Bet.create({
      userId: user._id,
      userName: user.name,
      slotId: slot._id,
      icon,
      amount,
      status: "pending",
    });

    slot.totalBets += 1;
    slot.totalAmount += amount;

    const betsByIcon = slot.betsByIcon || new Map();
    const existingData = betsByIcon.get(icon);
    const iconData =
      existingData && typeof existingData.totalBets === "number"
        ? {
            totalBets: existingData.totalBets + 1,
            totalAmount: (existingData.totalAmount || 0) + amount,
          }
        : { totalBets: 1, totalAmount: amount };
    betsByIcon.set(icon, iconData);
    slot.betsByIcon = betsByIcon;

    await slot.save();

    return NextResponse.json(
      {
        id: bet._id.toString(),
        slotId: slot._id.toString(),
        icon: bet.icon,
        amount: bet.amount,
        status: bet.status,
        walletBalance: user.walletBalance,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
