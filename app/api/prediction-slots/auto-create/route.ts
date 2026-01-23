import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import PredictionSlot from "@/lib/models/PredictionSlot";
import Setting from "@/lib/models/Setting";

export async function GET() {
  await connectDB();
  const setting = await Setting.findOne({ key: "autoCreateSlots" });
  return NextResponse.json({ enabled: Boolean(setting?.value) });
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Toggle auto-create flag when called with ?toggle=true&enabled=1|0
    const url = new URL(request.url);
    if (url.searchParams.get("toggle") === "true") {
      const enabled = url.searchParams.get("enabled") === "1";
      await Setting.findOneAndUpdate(
        { key: "autoCreateSlots" },
        { value: enabled },
        { upsert: true, new: true }
      );
      return NextResponse.json({
        message: `Auto-create ${enabled ? "enabled" : "disabled"}`,
      });
    }

    const now = new Date();
    // Create a 45-second slot starting now
    const nextSlotStart = new Date(now);
    const nextSlotEnd = new Date(nextSlotStart.getTime() + 45 * 200);

    const existingSlot = await PredictionSlot.findOne({
      startTime: nextSlotStart,
      endTime: nextSlotEnd,
    });

    if (existingSlot) {
      return NextResponse.json({
        message: "Slot already exists",
        slotId: existingSlot._id.toString(),
      });
    }

    let slotNumber = 1;
    const lastSlot = await PredictionSlot.findOne().sort({ slotNumber: -1 });
    if (lastSlot) {
      slotNumber = lastSlot.slotNumber + 1;
    }

    let newSlot;
    let attempts = 0;
    while (attempts < 100) {
      try {
        const existingWithNumber = await PredictionSlot.findOne({ slotNumber });
        if (existingWithNumber) {
          slotNumber++;
          attempts++;
          continue;
        }

        newSlot = await PredictionSlot.create({
          slotNumber,
          startTime: nextSlotStart,
          endTime: nextSlotEnd,
          status: "open",
          betsByIcon: new Map(),
        });
        break;
      } catch (error: any) {
        if (error.code === 11000 || error.message?.includes("duplicate")) {
          slotNumber++;
          attempts++;
          continue;
        }
        throw error;
      }
    }

    if (!newSlot) {
      return NextResponse.json(
        { error: "Failed to create slot after multiple attempts" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        id: newSlot._id.toString(),
        slotNumber: newSlot.slotNumber,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
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
