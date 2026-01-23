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
            "completed",
            "cancelled",
            "processing"
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
    // Referral & earnings
    referralCode: {
        type: String,
        unique: true,
        sparse: true
    },
    referredBy: {
        type: __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    referralCount: {
        type: Number,
        default: 0
    },
    referralEarnings: {
        type: Number,
        default: 0
    },
    // Bank details for withdrawals
    bankDetails: {
        accountHolderName: {
            type: String
        },
        bankName: {
            type: String
        },
        accountNumber: {
            type: String
        },
        ifscCode: {
            type: String
        },
        upiId: {
            type: String
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
// Hash password before saving. Use promise style to avoid next-callback issues.
userSchema.pre("save", async function() {
    // Hash password if changed
    if (this.isModified("password")) {
        const salt = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].genSalt(10);
        this.password = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].hash(this.password, salt);
    }
    // Ensure referral code exists
    if (!this.referralCode) {
        // Simple deterministic code based on ObjectId tail to avoid heavy random logic
        const idPart = typeof this._id === "string" ? this._id.slice(-6) : this._id.toString().slice(-6);
        const namePart = typeof this.name === "string" && this.name.length > 0 ? this.name.replace(/\s+/g, "").slice(0, 4).toUpperCase() : "USER";
        this.referralCode = `${namePart}${idPart}`.toUpperCase();
    }
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
        min: 10
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
    "GET",
    ()=>GET,
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
        // Winning icon is now randomly selected, but we still accept it for manual override
        const { winningIcon } = await request.json();
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["connectDB"])();
        // First check if slot exists and get it
        const existingSlot = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$PredictionSlot$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].findById(slotId);
        if (!existingSlot) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Slot not found"
            }, {
                status: 404
            });
        }
        // CRITICAL: Prevent manual completion before endTime
        const now = new Date();
        if (existingSlot.status === "open" && now < existingSlot.endTime) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: `Slot cannot be completed before end time. Slot ends at ${new Date(existingSlot.endTime).toLocaleString()}. Please wait for the full 45 seconds.`
            }, {
                status: 400
            });
        }
        // Use findOneAndUpdate with atomic check to prevent race conditions
        const slot = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$PredictionSlot$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].findOneAndUpdate({
            _id: slotId,
            status: "open"
        }, {
            $set: {
                status: "processing"
            }
        }, {
            new: true
        });
        if (!slot) {
            // Check if slot exists but is already completed/processing
            if (existingSlot.status !== "open") {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: "Slot is already completed or being processed"
                }, {
                    status: 400
                });
            }
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Slot not found"
            }, {
                status: 404
            });
        }
        const allBets = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$Bet$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].find({
            slotId: slot._id,
            status: "pending"
        });
        // Check if only single user bet - cancel and refund
        const uniqueUsersCount = new Set(allBets.map((bet)=>bet.userId.toString())).size;
        if (uniqueUsersCount === 1) {
            // Only one user bet - cancel all bets and refund
            const userId = allBets[0].userId;
            const totalRefund = allBets.reduce((sum, bet)=>sum + bet.amount, 0);
            // Refund to user
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].findByIdAndUpdate(userId, {
                $inc: {
                    walletBalance: totalRefund
                }
            });
            // Mark all bets as cancelled
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$Bet$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].updateMany({
                slotId: slot._id,
                status: "pending"
            }, {
                $set: {
                    status: "cancelled"
                }
            });
            // Mark slot as cancelled
            slot.status = "cancelled";
            slot.winningIcon = "";
            slot.companyCommission = 0;
            await slot.save();
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                message: "Slot cancelled - only one user participated",
                refunded: totalRefund
            });
        }
        // Multiple users - proceed with normal flow
        // Select winning icon with lowest total bet amount for company profit
        const iconsWithBets = [
            ...new Set(allBets.map((bet)=>bet.icon))
        ];
        // Calculate total bet amount for each icon
        const iconTotals = {};
        for (const icon of iconsWithBets){
            iconTotals[icon] = allBets.filter((bet)=>bet.icon === icon).reduce((sum, bet)=>sum + bet.amount, 0);
        }
        // Find icon with lowest total bet amount
        const lowestTotalBet = Math.min(...Object.values(iconTotals));
        const lowestBetIcons = Object.keys(iconTotals).filter((icon)=>iconTotals[icon] === lowestTotalBet);
        // If multiple icons have same lowest amount, select default one, otherwise select the lowest
        const randomWinningIcon = lowestBetIcons.length > 1 ? iconsWithBets[0] // Default to first icon in list
         : lowestBetIcons[0]; // Select the single lowest icon
        const winningBets = allBets.filter((bet)=>bet.icon === randomWinningIcon);
        const totalSlotAmount = slot.totalAmount;
        // Calculate total payout to winners (10x each winner's bet)
        const totalPayoutToWinners = winningBets.reduce((sum, bet)=>sum + bet.amount * 10, 0);
        const companyCommission = totalSlotAmount - totalPayoutToWinners; // Remaining goes to platform
        // Atomically update slot status to completed
        slot.winningIcon = randomWinningIcon;
        slot.companyCommission = companyCommission;
        slot.status = "completed";
        await slot.save();
        for (const bet of winningBets){
            // Calculate 10x payout for this winner
            const payoutPerWinner = bet.amount * 10;
            // Use atomic update to prevent double-processing
            const updatedBet = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$Bet$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].findOneAndUpdate({
                _id: bet._id,
                status: "pending"
            }, {
                $set: {
                    status: "won",
                    payout: payoutPerWinner
                }
            }, {
                new: true
            });
            if (updatedBet) {
                await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].findByIdAndUpdate(bet.userId, {
                    $inc: {
                        walletBalance: payoutPerWinner
                    }
                });
                await createApprovedTransaction({
                    userId: bet.userId.toString(),
                    userName: bet.userName,
                    amount: payoutPerWinner,
                    description: `Bet winning for Slot #${slot.slotNumber}`
                });
            }
        }
        // Atomically update all losing bets (only update pending bets to avoid overwriting already processed bets)
        await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$Bet$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].updateMany({
            slotId: slot._id,
            icon: {
                $ne: randomWinningIcon
            },
            status: "pending"
        }, {
            $set: {
                status: "lost"
            }
        });
        // Also update any bets that might have been missed (safety check)
        await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$Bet$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].updateMany({
            slotId: slot._id,
            icon: {
                $ne: randomWinningIcon
            },
            status: {
                $nin: [
                    "won",
                    "lost",
                    "cancelled"
                ]
            }
        }, {
            $set: {
                status: "lost"
            }
        });
        // Add commission to admin
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
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: "Slot completed",
            winningIcon: randomWinningIcon,
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
async function GET(request, { params }) {
    try {
        const { slotId } = await Promise.resolve(params);
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["connectDB"])();
        const slot = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$PredictionSlot$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].findById(slotId).lean();
        if (!slot) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Slot not found"
            }, {
                status: 404
            });
        }
        const betsByIconObj = {};
        if (slot.betsByIcon && slot.betsByIcon instanceof Map) {
            slot.betsByIcon.forEach((value, key)=>{
                betsByIconObj[key] = value;
            });
        } else if (slot.betsByIcon && typeof slot.betsByIcon === "object") {
            Object.assign(betsByIconObj, slot.betsByIcon);
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            id: slot._id.toString(),
            slotNumber: slot.slotNumber,
            startTime: slot.startTime,
            endTime: slot.endTime,
            status: slot.status,
            winningIcon: slot.winningIcon,
            totalBets: slot.totalBets,
            totalAmount: slot.totalAmount,
            betsByIcon: betsByIconObj
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