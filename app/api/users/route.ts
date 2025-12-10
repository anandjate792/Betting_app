import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import User from "@/lib/models/User"
import { verifyToken } from "@/lib/auth-token"

const isAdmin = (token: string | null) => {
  if (!token) return false
  const decoded = verifyToken(token)
  return decoded && typeof decoded === "object" && (decoded as any).role === "admin"
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.split(" ")[1]
    if (!isAdmin(token)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    await connectDB()
    const users = await User.find({}, "-password").sort({ createdAt: -1 })

    const formatted = users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      walletBalance: u.walletBalance,
      createdAt: u.createdAt,
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.split(" ")[1]
    if (!isAdmin(token)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { name, email, password } = await request.json()
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 })
    }

    await connectDB()

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }

    const newUser = new User({
      name,
      email,
      password,
      role: "user",
    })

    await newUser.save()

    return NextResponse.json(
      {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        walletBalance: newUser.walletBalance,
        createdAt: newUser.createdAt,
      },
      { status: 201 },
    )
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 })
  }
}
