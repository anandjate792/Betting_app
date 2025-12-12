import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth-token";
import Transaction from "@/lib/models/Transaction";
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

    const url = new URL(request.url);
    const isAdmin = url.searchParams.get("admin") === "true";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "10"), 50); // Max 50 per page
    const skip = parseInt(url.searchParams.get("skip") || "0");

    if (isAdmin && user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const query = isAdmin ? {} : { userId: user._id };

    // Use lean() for better performance and select only needed fields
    // Include screenshotImage for admin requests (needed for approvals)
    // Exclude screenshotImage for regular users to optimize performance
    const selectFields = isAdmin
      ? "_id userId userName amount status description screenshotImage createdAt approvedAt approvedBy"
      : "_id userId userName amount status description createdAt approvedAt approvedBy";

    const [results, total] = await Promise.all([
      Transaction.find(query)
        .select(selectFields)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(query),
    ]);

    const formatted = results.map((t: any) => ({
      id: t._id.toString(),
      userId: t.userId.toString(),
      userName: t.userName,
      amount: t.amount,
      status: t.status,
      screenshotImage: t.screenshotImage || undefined,
      description: t.description,
      createdAt: t.createdAt,
      approvedAt: t.approvedAt || undefined,
      approvedBy: t.approvedBy ? t.approvedBy.toString() : undefined,
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

    const { amount, description, screenshotImage } = await request.json();
    if (typeof amount !== "number" || !description || !screenshotImage) {
      return NextResponse.json(
        { error: "Amount, description and screenshot are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const newTransaction = await Transaction.create({
      userId: user._id,
      userName: user.name,
      amount,
      description,
      screenshotImage,
      status: "pending",
    });

    return NextResponse.json(
      {
        id: newTransaction._id.toString(),
        userId: user._id.toString(),
        userName: user.name,
        amount: newTransaction.amount,
        description: newTransaction.description,
        screenshotImage: newTransaction.screenshotImage,
        status: newTransaction.status,
        createdAt: newTransaction.createdAt,
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
