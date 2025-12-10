import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth-token";
import Withdrawal from "@/lib/models/Withdrawal";
import User from "@/lib/models/User";

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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ withdrawalId: string }> } | { params: { withdrawalId: string } },
) {
  try {
    const admin = await getAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get("action");

    const resolvedParams =
      "then" in (context.params as any)
        ? await (context.params as Promise<{ withdrawalId: string }>)
        : (context.params as { withdrawalId: string });

    await connectDB();

    const withdrawal = await Withdrawal.findById(resolvedParams.withdrawalId);
    if (!withdrawal) {
      return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 });
    }

    if (action === "approve") {
      if (withdrawal.status === "approved") {
        return NextResponse.json({ error: "Withdrawal already approved" }, { status: 400 });
      }

      withdrawal.status = "approved";
      withdrawal.approvedAt = new Date();
      withdrawal.approvedBy = admin._id;
      await withdrawal.save();

      return NextResponse.json({
        id: withdrawal._id.toString(),
        amount: withdrawal.amount,
        status: withdrawal.status,
        message: "Withdrawal approved",
      });
    }

    if (action === "reject") {
      if (withdrawal.status === "approved") {
        return NextResponse.json({ error: "Cannot reject an approved withdrawal" }, { status: 400 });
      }

      if (withdrawal.status === "rejected") {
        return NextResponse.json({ error: "Withdrawal already rejected" }, { status: 400 });
      }

      withdrawal.status = "rejected";
      await withdrawal.save();

      const user = await User.findById(withdrawal.userId);
      if (user) {
        user.walletBalance += withdrawal.amount;
        await user.save();
      }

      return NextResponse.json({
        id: withdrawal._id.toString(),
        amount: withdrawal.amount,
        status: withdrawal.status,
        message: "Withdrawal rejected and amount refunded",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}

