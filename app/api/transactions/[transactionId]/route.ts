import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { verifyToken } from "@/lib/auth-token"
import Transaction from "@/lib/models/Transaction"
import User from "@/lib/models/User"

const getAdmin = async (request: NextRequest) => {
  const authHeader = request.headers.get("authorization")
  const token = authHeader?.split(" ")[1]
  const decoded = token ? verifyToken(token) : null
  if (!decoded || typeof decoded !== "object" || (decoded as any).role !== "admin") {
    return null
  }

  await connectDB()
  const admin = await User.findById((decoded as any).id)
  if (!admin || admin.role !== "admin") return null
  return admin
}

const formatTransaction = (transaction: any) => ({
  id: transaction._id.toString(),
  userId: transaction.userId.toString(),
  userName: transaction.userName,
  amount: transaction.amount,
  description: transaction.description,
  status: transaction.status,
  screenshotImage: transaction.screenshotImage,
  createdAt: transaction.createdAt,
  approvedAt: transaction.approvedAt,
  approvedBy: transaction.approvedBy ? transaction.approvedBy.toString() : undefined,
})

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ transactionId: string }> } | { params: { transactionId: string } },
) {
  try {
    const admin = await getAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const url = new URL(request.url)
    const action = url.searchParams.get("action")

    const resolvedParams = "then" in (context.params as any) ? await (context.params as Promise<{ transactionId: string }>) : (context.params as { transactionId: string })

    await connectDB()
    const transaction = await Transaction.findById(resolvedParams.transactionId)
    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    if (action === "approve") {
      if (transaction.status === "approved") {
        return NextResponse.json({ error: "Transaction already approved" }, { status: 400 })
      }
      
      transaction.status = "approved"
      transaction.approvedAt = new Date()
      transaction.approvedBy = admin._id
      await transaction.save()
      
      await User.findByIdAndUpdate(transaction.userId, { $inc: { walletBalance: transaction.amount } })
      
      return NextResponse.json(formatTransaction(transaction))
    }

    if (action === "reject") {
      transaction.status = "rejected"
      await transaction.save()
      return NextResponse.json(formatTransaction(transaction))
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 })
  }
}
