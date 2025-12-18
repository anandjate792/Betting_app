import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth-token";
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

    const referrals = await User.find({ referredBy: user._id }).select(
      "_id name email createdAt"
    );

    const referredUsers = referrals.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      createdAt: u.createdAt,
    }));

    return NextResponse.json({
      referralCode: user.referralCode,
      referralCount: referrals.length,
      referralEarnings: user.referralEarnings || 0,
      referredUsers,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}


