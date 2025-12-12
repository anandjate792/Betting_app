module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/mongoose [external] (mongoose, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("mongoose", () => require("mongoose"));

module.exports = mod;
}),
"[project]/lib/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "connectDB",
    ()=>connectDB
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
;
let isConnected = false;
async function connectDB() {
    if (isConnected) {
        return __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].connection;
    }
    try {
        await __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].connect(process.env.MONGODB_URI || "mongodb://localhost:27017/wallet-app");
        isConnected = true;
        console.log("[v0] MongoDB connected");
        return __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].connection;
    } catch (error) {
        console.error("[v0] MongoDB connection error:", error);
        throw error;
    }
}
}),
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/lib/auth-token.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateToken",
    ()=>generateToken,
    "verifyToken",
    ()=>verifyToken
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jsonwebtoken/index.js [app-route] (ecmascript)");
;
function generateToken(userId, email, role) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].sign({
        id: userId,
        email,
        role
    }, process.env.JWT_SECRET || "your-secret-key", {
        expiresIn: "7d"
    });
}
function verifyToken(token) {
    try {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].verify(token, process.env.JWT_SECRET || "your-secret-key");
    } catch  {
        return null;
    }
}
}),
"[project]/lib/models/PredictionSlot.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
;
const predictionSlotSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].Schema({
    slotNumber: {
        type: Number,
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: [
            "open",
            "closed",
            "completed"
        ],
        default: "open"
    },
    winningIcon: {
        type: String,
        default: null
    },
    totalBets: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        default: 0
    },
    betsByIcon: {
        type: Map,
        of: {
            totalBets: Number,
            totalAmount: Number
        },
        default: {}
    },
    companyCommission: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
if (__TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].models.PredictionSlot) {
    delete __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].models.PredictionSlot;
}
const __TURBOPACK__default__export__ = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].model("PredictionSlot", predictionSlotSchema);
}),
"[project]/lib/models/User.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/bcryptjs/index.js [app-route] (ecmascript)");
;
;
const userSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: [
            "admin",
            "user"
        ],
        default: "user"
    },
    walletBalance: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
// Hash password before saving. Use promise style to avoid next-callback issues.
userSchema.pre("save", async function() {
    if (!this.isModified("password")) return;
    const salt = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].genSalt(10);
    this.password = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].hash(this.password, salt);
});
userSchema.methods.comparePassword = async function(password) {
    return await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].compare(password, this.password);
};
// Ensure we refresh the model in dev to pick up hook changes
// (avoid stale schema with old pre-save definitions).
if (__TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].models.User) {
    delete __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].models.User;
}
const __TURBOPACK__default__export__ = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].model("User", userSchema);
}),
"[project]/lib/models/Bet.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
;
const betSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].Schema({
    userId: {
        type: __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    slotId: {
        type: __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].Schema.Types.ObjectId,
        ref: "PredictionSlot",
        required: true
    },
    icon: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 50
    },
    payout: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: [
            "pending",
            "won",
            "lost",
            "cancelled"
        ],
        default: "pending"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
// Add indexes for better query performance
betSchema.index({
    userId: 1,
    createdAt: -1
});
betSchema.index({
    slotId: 1,
    userId: 1
});
betSchema.index({
    createdAt: -1
});
if (__TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].models.Bet) {
    delete __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].models.Bet;
}
const __TURBOPACK__default__export__ = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].model("Bet", betSchema);
}),
"[project]/lib/models/Transaction.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
;
const transactionSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].Schema({
    userId: {
        type: __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: [
            "pending",
            "approved",
            "rejected"
        ],
        default: "pending"
    },
    screenshotImage: {
        type: String
    },
    approvedBy: {
        type: __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    approvedAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
// Add indexes for better query performance
transactionSchema.index({
    userId: 1,
    createdAt: -1
});
transactionSchema.index({
    status: 1,
    createdAt: -1
});
transactionSchema.index({
    createdAt: -1
});
const __TURBOPACK__default__export__ = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].models.Transaction || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].model("Transaction", transactionSchema);
}),
"[project]/app/api/prediction-slots/[slotId]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$token$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth-token.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$PredictionSlot$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/models/PredictionSlot.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/models/User.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$Bet$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/models/Bet.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$Transaction$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/models/Transaction.ts [app-route] (ecmascript)");
;
;
;
;
;
;
;
const getAdmin = async (request)=>{
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    const decoded = token ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$token$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["verifyToken"])(token) : null;
    if (!decoded || typeof decoded !== "object" || decoded.role !== "admin") {
        return null;
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["connectDB"])();
    const admin = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].findById(decoded.id);
    if (!admin || admin.role !== "admin") return null;
    return admin;
};
const createApprovedTransaction = async (params)=>{
    await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$Transaction$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].create({
        userId: params.userId,
        userName: params.userName,
        amount: params.amount,
        description: params.description,
        status: "approved"
    });
};
async function POST(request, { params }) {
    try {
        const { slotId } = await Promise.resolve(params);
        const admin = await getAdmin(request);
        if (!admin) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Admin access required"
            }, {
                status: 403
            });
        }
        const { winningIcon } = await request.json();
        if (!winningIcon) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Winning icon required"
            }, {
                status: 400
            });
        }
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["connectDB"])();
        const slot = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$PredictionSlot$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].findById(slotId);
        if (!slot) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Slot not found"
            }, {
                status: 404
            });
        }
        if (slot.status !== "open") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Slot is not open"
            }, {
                status: 400
            });
        }
        const allBets = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$Bet$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].find({
            slotId: slot._id,
            status: "pending"
        });
        const uniqueUsers = new Set(allBets.map((bet)=>bet.userId.toString()));
        if (uniqueUsers.size < 2) {
            // Update slot status first to prevent duplicate processing
            const totalRefundedAmount = slot.totalAmount;
            slot.status = "closed";
            slot.winningIcon = null;
            slot.companyCommission = 0;
            await slot.save();
            // Only process bets that are still pending (not already cancelled)
            const pendingBets = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$Bet$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].find({
                slotId: slot._id,
                status: "pending"
            });
            for (const bet of pendingBets){
                // Double-check bet is still pending before processing
                const currentBet = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$Bet$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].findById(bet._id);
                if (currentBet && currentBet.status === "pending") {
                    currentBet.status = "cancelled";
                    await currentBet.save();
                    await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].findByIdAndUpdate(bet.userId, {
                        $inc: {
                            walletBalance: bet.amount
                        }
                    });
                    await createApprovedTransaction({
                        userId: bet.userId.toString(),
                        userName: bet.userName,
                        amount: bet.amount,
                        description: `Bet refund for Slot #${slot.slotNumber} (insufficient players)`
                    });
                }
            }
            slot.totalAmount = 0;
            await slot.save();
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Minimum 2 users required. All bets have been refunded.",
                refunded: pendingBets.length,
                totalRefunded: totalRefundedAmount
            }, {
                status: 400
            });
        }
        slot.winningIcon = winningIcon;
        slot.status = "completed";
        const winningBets = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$Bet$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].find({
            slotId: slot._id,
            icon: winningIcon,
            status: "pending"
        });
        const totalSlotAmount = slot.totalAmount; // Total pool from all bets
        // New logic: Take 10% commission from total pool, distribute remaining 90% equally among winners
        const companyCommission = totalSlotAmount * 0.10;
        const totalPayoutToWinners = totalSlotAmount * 0.90;
        const payoutPerWinner = winningBets.length > 0 ? totalPayoutToWinners / winningBets.length : 0;
        slot.companyCommission = companyCommission;
        await slot.save();
        for (const bet of winningBets){
            // Double-check bet is still pending before processing
            const currentBet = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$Bet$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].findById(bet._id);
            if (currentBet && currentBet.status === "pending") {
                // Each winner gets equal share of 90% of winners' total
                const payout = payoutPerWinner;
                currentBet.payout = payout;
                currentBet.status = "won";
                await currentBet.save();
                await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].findByIdAndUpdate(bet.userId, {
                    $inc: {
                        walletBalance: payout
                    }
                });
                await createApprovedTransaction({
                    userId: bet.userId.toString(),
                    userName: bet.userName,
                    amount: payout,
                    description: `Bet winning for Slot #${slot.slotNumber}`
                });
            }
        }
        const losingBets = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$Bet$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].find({
            slotId: slot._id,
            icon: {
                $ne: winningIcon
            },
            status: "pending"
        });
        for (const bet of losingBets){
            const currentBet = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$Bet$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].findById(bet._id);
            if (currentBet && currentBet.status === "pending") {
                currentBet.status = "lost";
                await currentBet.save();
            }
        }
        if (companyCommission > 0) {
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].findByIdAndUpdate(admin._id, {
                $inc: {
                    walletBalance: companyCommission
                }
            });
            await createApprovedTransaction({
                userId: admin._id.toString(),
                userName: admin.name,
                amount: companyCommission,
                description: `Commission earned from Slot #${slot.slotNumber}`
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: "Slot completed",
            winningIcon,
            totalWinners: winningBets.length,
            totalPayout: totalPayoutToWinners,
            companyCommission
        });
    } catch (error) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error instanceof Error ? error.message : "Server error"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__d347c7e5._.js.map