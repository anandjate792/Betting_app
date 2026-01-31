import mongoose from "mongoose";

const upiSettingsSchema = new mongoose.Schema({
  upiId: {
    type: String,
    required: true,
    trim: true,
  },
  qrCode: {
    type: String, // This will store the URL/path to the QR code image
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
upiSettingsSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("UpiSettings", upiSettingsSchema);
