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
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
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
        
        // Give 5 rupees per referral, up to 200 rupees (max 200 referrals)
        const referralReward = 5;
        const maxReferralEarnings = 200; // Maximum total referral earnings
        
        const currentReferralEarnings = referrer.referralEarnings || 0;
        if (currentReferralEarnings < maxReferralEarnings) {
          // Calculate how much more can be earned (remaining amount)
          const remainingEarnings = maxReferralEarnings - currentReferralEarnings;
          const rewardAmount = Math.min(referralReward, remainingEarnings);
          
          // Add reward to wallet and update referral earnings
          referrer.walletBalance = (referrer.walletBalance || 0) + rewardAmount;
          referrer.referralEarnings = currentReferralEarnings + rewardAmount;
          
          // Create transaction record
          await Transaction.create({
            userId: referrer._id,
            userName: referrer.name,
            amount: rewardAmount,
            description: `Referral reward for referring a new user`,
            status: "approved",
          });
        }
        
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
      newUser.role
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
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Server error",
      },
      { status: 500 }
    );
  }
}

