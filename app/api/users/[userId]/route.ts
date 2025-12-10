import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import User from "@/lib/models/User"
import { verifyToken } from "@/lib/auth-token"

const requireAdmin = (request: NextRequest) => {
  const authHeader = request.headers.get("authorization")
  const token = authHeader?.split(" ")[1]
  const decoded = token ? verifyToken(token) : null
  return decoded && typeof decoded === "object" && (decoded as any).role === "admin"
}

export async function DELETE(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    await connectDB()
    await User.findByIdAndDelete(params.userId)
    return NextResponse.json({ message: "User deleted" })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { amount } = await request.json()
    if (typeof amount !== "number") {
      return NextResponse.json({ error: "Amount is required" }, { status: 400 })
    }

    await connectDB()
    const user = await User.findByIdAndUpdate(
      params.userId,
      { $inc: { walletBalance: amount } },
      { new: true },
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: user._id.toString(),
      name: user.name,
      walletBalance: user.walletBalance,
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 })
  }
}
