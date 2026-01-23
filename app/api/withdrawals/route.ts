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
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "10"), 50);
    const skip = parseInt(url.searchParams.get("skip") || "0");

    const admin = await getAdmin(request);
    if (admin) {
      await connectDB();
      const query = {};
      const withdrawals = await Withdrawal.find(query)
        .select("_id userId userName amount status approvedBy approvedAt createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Get user bank details for each withdrawal
      const userIds = withdrawals.map((w: any) => w.userId);
      const users = await User.find({ _id: { $in: userIds } })
        .select("_id bankDetails")
        .lean();
      
      const userBankMap = new Map(
        users.map((u: any) => [u._id.toString(), u.bankDetails || {}])
      );

      const total = await Withdrawal.countDocuments(query);

      const formatted = withdrawals.map((w: any) => ({
        id: w._id.toString(),
        userId: w.userId.toString(),
        userName: w.userName,
        amount: w.amount,
        status: w.status,
        approvedBy: w.approvedBy ? w.approvedBy.toString() : undefined,
        approvedAt: w.approvedAt,
        createdAt: w.createdAt,
        bankDetails: userBankMap.get(w.userId.toString()) || {},
      }));

      return NextResponse.json({
        data: formatted,
        pagination: {
          total,
          limit,
          skip,
          hasMore: skip + limit < total,
        },
      });
    }

    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const query = { userId: user._id };
    const [withdrawals, total] = await Promise.all([
      Withdrawal.find(query)
        .select("_id amount status approvedAt createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Withdrawal.countDocuments(query),
    ]);

    const formatted = withdrawals.map((w: any) => ({
      id: w._id.toString(),
      amount: w.amount,
      status: w.status,
      approvedAt: w.approvedAt,
      createdAt: w.createdAt,
    }));

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

    if (amount < 200) {
      return NextResponse.json({ error: "Minimum withdrawal amount is ₹200" }, { status: 400 });
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

