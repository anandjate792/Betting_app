import mongoose from "mongoose";

const predictionSlotSchema = new mongoose.Schema({
  slotNumber: {
    type: Number,
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["open", "closed", "completed"],
    default: "open",
  },
  winningIcon: {
    type: String,
    default: null,
  },
  totalBets: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    default: 0,
  },
  betsByIcon: {
    type: Map,
    of: {
      totalBets: Number,
      totalAmount: Number,
    },
    default: {},
  },
  companyCommission: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

if (mongoose.models.PredictionSlot) {
  delete mongoose.models.PredictionSlot;
}

export default mongoose.model("PredictionSlot", predictionSlotSchema);
