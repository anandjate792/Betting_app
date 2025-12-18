import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import User from "@/lib/models/User"
import { verifyToken } from "@/lib/auth-token"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || typeof decoded !== "object" || !("id" in decoded)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const user = await User.findById((decoded as any).id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      walletBalance: user.walletBalance,
      createdAt: user.createdAt,
      referralCode: user.referralCode,
      referralCount: user.referralCount || 0,
      referralEarnings: user.referralEarnings || 0,
      bankDetails: user.bankDetails || null,
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 })
  }
}

