import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth-token";
import Setting from "@/lib/models/Setting";
import User from "@/lib/models/User";

const UPI_ID_KEY = "upi_id";
const QR_CODE_KEY = "qr_code";

async function getSetting(key: string, defaultValue = ""): Promise<string> {
  await connectDB();
  const doc = await Setting.findOne({ key });
  return doc ? String(doc.value) : defaultValue;
}

async function setSetting(key: string, value: string): Promise<void> {
  await connectDB();
  await Setting.findOneAndUpdate(
    { key },
    { key, value },
    { upsert: true, new: true },
  );
}

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split(" ")[1];
  const decoded = token ? verifyToken(token) : null;
  if (!decoded || typeof decoded !== "object" || !("id" in decoded)) {
    return null;
  }
  await connectDB();
  const user = await User.findById((decoded as { id: string }).id);
  return user;
}

export async function GET() {
  try {
    const [upiId, qrCode] = await Promise.all([
      getSetting(UPI_ID_KEY, ""),
      getSetting(QR_CODE_KEY, ""),
    ]);
    return NextResponse.json({ upiId, qrCode });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { upiId, qrCode } = body;

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

    return NextResponse.json({
      message: "UPI settings updated",
      upiId: newUpiId,
      qrCode: newQrCode,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}
