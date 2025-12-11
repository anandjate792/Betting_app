import mongoose from "mongoose"

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  screenshotImage: {
    type: String,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  approvedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Add indexes for better query performance
transactionSchema.index({ userId: 1, createdAt: -1 })
transactionSchema.index({ status: 1, createdAt: -1 })
transactionSchema.index({ createdAt: -1 })

export default mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema)
