import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  walletBalance: {
    type: Number,
    default: 0,
  },
  // Referral & earnings
  referralCode: {
    type: String,
    unique: true,
    sparse: true,
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  referralCount: {
    type: Number,
    default: 0,
  },
  referralEarnings: {
    type: Number,
    default: 0,
  },
  // Bank details for withdrawals
  bankDetails: {
    accountHolderName: { type: String },
    bankName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    upiId: { type: String },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving. Use promise style to avoid next-callback issues.
userSchema.pre("save", async function () {
  // Hash password if changed
  if (this.isModified("password")) {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
  }

  // Ensure referral code exists
  if (!this.referralCode) {
    // Simple deterministic code based on ObjectId tail to avoid heavy random logic
    const idPart =
      typeof this._id === "string"
        ? this._id.slice(-6)
        : this._id.toString().slice(-6);
    const namePart =
      typeof this.name === "string" && this.name.length > 0
        ? this.name.replace(/\s+/g, "").slice(0, 4).toUpperCase()
        : "USER";
    this.referralCode = `${namePart}${idPart}`.toUpperCase();
  }
});

userSchema.methods.comparePassword = async function (password: string) {
  return await bcryptjs.compare(password, this.password);
};

// Ensure we refresh the model in dev to pick up hook changes
// (avoid stale schema with old pre-save definitions).
if (mongoose.models.User) {
  delete mongoose.models.User;
}

export default mongoose.model("User", userSchema);
