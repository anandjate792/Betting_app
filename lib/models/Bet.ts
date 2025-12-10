import mongoose from "mongoose";

const betSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PredictionSlot",
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 50,
  },
  payout: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["pending", "won", "lost", "cancelled"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

if (mongoose.models.Bet) {
  delete mongoose.models.Bet;
}

export default mongoose.model("Bet", betSchema);

