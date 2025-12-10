import express from "express"
import User from "../models/User.js"
import { authenticate, adminOnly } from "../middleware/auth.js"

const router = express.Router()

// Get all users (admin only)
router.get("/", authenticate, adminOnly, async (req, res) => {
  try {
    const users = await User.find({}, "-password")
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create new user (admin only)
router.post("/create", authenticate, adminOnly, async (req, res) => {
  try {
    const { name, email, password } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" })
    }

    const newUser = new User({
      name,
      email,
      password,
      role: "user",
    })

    await newUser.save()

    res.status(201).json({
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      walletBalance: newUser.walletBalance,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete user (admin only)
router.delete("/:userId", authenticate, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.userId)
    res.json({ message: "User deleted" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Add money to wallet (admin only)
router.post("/:userId/add-money", authenticate, adminOnly, async (req, res) => {
  try {
    const { amount } = req.body
    const user = await User.findByIdAndUpdate(req.params.userId, { $inc: { walletBalance: amount } }, { new: true })
    res.json({
      id: user._id,
      name: user.name,
      walletBalance: user.walletBalance,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
