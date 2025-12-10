import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth-token";
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
    await connectDB();
    const url = new URL(request.url);
    const current = url.searchParams.get("current") === "true";

    if (current) {
      const now = new Date();
      const slot = await PredictionSlot.findOne({
        startTime: { $lte: now },
        endTime: { $gte: now },
        status: "open",
      }).sort({ startTime: -1 });

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

