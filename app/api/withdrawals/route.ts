import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth-token";
import Withdrawal from "@/lib/models/Withdrawal";
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

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdmin(request);
    if (admin) {
      await connectDB();
      const withdrawals = await Withdrawal.find().sort({ createdAt: -1 }).populate("userId", "name email");
      const formatted = withdrawals.map((w) => ({
        id: w._id.toString(),
        userId: w.userId.toString(),
        userName: w.userName,
        amount: w.amount,
        status: w.status,
        approvedBy: w.approvedBy ? w.approvedBy.toString() : undefined,
        approvedAt: w.approvedAt,
        createdAt: w.createdAt,
      }));
      return NextResponse.json(formatted);
    }

    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const withdrawals = await Withdrawal.find({ userId: user._id }).sort({ createdAt: -1 });
    const formatted = withdrawals.map((w) => ({
      id: w._id.toString(),
      amount: w.amount,
      status: w.status,
      approvedAt: w.approvedAt,
      createdAt: w.createdAt,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount } = await request.json();

    if (!amount || typeof amount !== "number") {
      return NextResponse.json({ error: "Amount is required" }, { status: 400 });
    }

    if (amount < 1000) {
      return NextResponse.json({ error: "Minimum withdrawal amount is ₹1000" }, { status: 400 });
    }

    if (user.walletBalance < amount) {
      return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 400 });
    }

    await connectDB();

    user.walletBalance -= amount;
    await user.save();

    const withdrawal = await Withdrawal.create({
      userId: user._id,
      userName: user.name,
      amount,
      status: "pending",
    });

    return NextResponse.json(
      {
        id: withdrawal._id.toString(),
        amount: withdrawal.amount,
        status: withdrawal.status,
        walletBalance: user.walletBalance,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}

