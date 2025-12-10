import express from "express"
import Transaction from "../models/Transaction.js"
import User from "../models/User.js"
import { authenticate, adminOnly } from "../middleware/auth.js"

const router = express.Router()

// Get all transactions (admin only)
router.get("/admin/all", authenticate, adminOnly, async (req, res) => {
  try {
    const transactions = await Transaction.find().populate("userId", "-password").populate("approvedBy", "-password")
    res.json(transactions)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get user's transactions
router.get("/user", authenticate, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId }).populate("userId", "-password")
    res.json(transactions)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create transaction (user)
router.post("/create", authenticate, async (req, res) => {
  try {
    const { amount, description, screenshotImage } = req.body

    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    const newTransaction = new Transaction({
      userId: req.userId,
      userName: user.name,
      amount,
      description,
      screenshotImage,
      status: "pending",
    })

    await newTransaction.save()

    res.status(201).json({
      id: newTransaction._id,
      userId: newTransaction.userId,
      userName: newTransaction.userName,
      amount: newTransaction.amount,
      description: newTransaction.description,
      status: newTransaction.status,
      screenshotImage: newTransaction.screenshotImage,
      createdAt: newTransaction.createdAt,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Approve transaction (admin only)
router.post("/:transactionId/approve", authenticate, adminOnly, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId)
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" })
    }

    transaction.status = "approved"
    transaction.approvedBy = req.userId
    transaction.approvedAt = new Date()
    await transaction.save()

    // Add money to user's wallet
    await User.findByIdAndUpdate(transaction.userId, { $inc: { walletBalance: transaction.amount } })

    res.json({
      id: transaction._id,
      status: transaction.status,
      approvedAt: transaction.approvedAt,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Reject transaction (admin only)
router.post("/:transactionId/reject", authenticate, adminOnly, async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.transactionId,
      { status: "rejected" },
      { new: true },
    )

    res.json({
      id: transaction._id,
      status: transaction.status,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
