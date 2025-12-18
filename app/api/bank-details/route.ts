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

    const bankDetails = user.bankDetails || {};

    return NextResponse.json({
      accountHolderName: bankDetails.accountHolderName || "",
      bankName: bankDetails.bankName || "",
      accountNumber: bankDetails.accountNumber || "",
      ifscCode: bankDetails.ifscCode || "",
      upiId: bankDetails.upiId || "",
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

    const body = await request.json();
    const {
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      upiId,
    } = body;

    await connectDB();

    user.bankDetails = {
      accountHolderName: accountHolderName || "",
      bankName: bankName || "",
      accountNumber: accountNumber || "",
      ifscCode: ifscCode || "",
      upiId: upiId || "",
    };

    await user.save();

    return NextResponse.json(
      {
        message: "Bank details updated",
        bankDetails: user.bankDetails,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}


