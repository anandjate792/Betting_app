import express from "express";
import Setting from "../models/Setting.js";
import { authenticate, adminOnly } from "../middleware/auth.js";

const router = express.Router();

const UPI_ID_KEY = "upi_id";
const QR_CODE_KEY = "qr_code";

async function getSetting(key, defaultValue = "") {
  const doc = await Setting.findOne({ key });
  return doc ? doc.value : defaultValue;
}

async function setSetting(key, value) {
  await Setting.findOneAndUpdate(
    { key },
    { key, value },
    { upsert: true, new: true },
  );
}

// GET /api/upi-settings — public, no auth (for wallet page and app)
router.get("/", async (req, res) => {
  try {
    const [upiId, qrCode] = await Promise.all([
      getSetting(UPI_ID_KEY, ""),
      getSetting(QR_CODE_KEY, ""),
    ]);
    res.json({ upiId, qrCode });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/upi-settings — admin only (update UPI ID and/or QR code)
router.put("/", authenticate, adminOnly, async (req, res) => {
  try {
    const { upiId, qrCode } = req.body;

    if (typeof upiId !== "undefined") {
      await setSetting(UPI_ID_KEY, String(upiId || ""));
    }
    if (typeof qrCode !== "undefined") {
      await setSetting(QR_CODE_KEY, String(qrCode || ""));
    }

    const [newUpiId, newQrCode] = await Promise.all([
      getSetting(UPI_ID_KEY),
      getSetting(QR_CODE_KEY),
    ]);

    res.json({
      message: "UPI settings updated",
      upiId: newUpiId,
      qrCode: newQrCode,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
