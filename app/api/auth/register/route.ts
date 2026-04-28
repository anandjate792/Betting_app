import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import Transaction from "@/lib/models/Transaction";
import { generateToken } from "@/lib/auth-token";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, referralCode } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 },
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 },
      );
    }

    // Handle referral code if provided
    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        referredBy = referrer._id;
        // Increment referrer's referral count
        const currentReferralCount = referrer.referralCount || 0;
        referrer.referralCount = currentReferralCount + 1;

        // Give ₹25 per referral (no cap on total earnings)
        const referralReward = 25;
        const currentReferralEarnings = referrer.referralEarnings || 0;

        // Add reward to wallet and update referral earnings
        referrer.walletBalance = (referrer.walletBalance || 0) + referralReward;
        referrer.referralEarnings = currentReferralEarnings + referralReward;

        // Create transaction record
        await Transaction.create({
          userId: referrer._id,
          userName: referrer.name,
          amount: referralReward,
          description: `Referral bonus: ₹25 for referring ${name}`,
          status: "approved",
        });

        await referrer.save();
      }
    }

    const newUser = new User({
      name,
      email,
      password,
      role: "user",
      referredBy,
    });

    await newUser.save();

    const token = generateToken(
      newUser._id.toString(),
      newUser.email,
      newUser.role,
    );

    return NextResponse.json(
      {
        token,
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          walletBalance: newUser.walletBalance,
          referralCode: newUser.referralCode,
          createdAt: newUser.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 },
    );
  }
}
