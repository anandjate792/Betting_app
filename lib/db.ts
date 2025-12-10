import mongoose from "mongoose"

let isConnected = false

export async function connectDB() {
  if (isConnected) {
    return mongoose.connection
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/wallet-app")
    isConnected = true
    console.log("[v0] MongoDB connected")
    return mongoose.connection
  } catch (error) {
    console.error("[v0] MongoDB connection error:", error)
    throw error
  }
}
