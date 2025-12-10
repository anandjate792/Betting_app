import express from "express"
import jwt from "jsonwebtoken"
import User from "../models/User.js"
import { authenticate } from "../middleware/auth.js"

const router = express.Router()

// Login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    })

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post("/change-password", authenticate, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body
    const userId = req.user.id

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Old and new password required" })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    const isPasswordValid = await user.comparePassword(oldPassword)
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Current password is incorrect" })
    }

    user.password = newPassword
    await user.save()

    res.json({ message: "Password changed successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
