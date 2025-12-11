import mongoose from "mongoose";

const settingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
});

if (mongoose.models.Setting) {
  delete mongoose.models.Setting;
}

export default mongoose.model("Setting", settingSchema);

