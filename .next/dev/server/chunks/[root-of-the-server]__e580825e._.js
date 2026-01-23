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
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
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
"[project]/app/api/prediction-slots/auto-complete/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db.ts [app-route] (ecmascript)");
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
const createApprovedTransaction = async (params)=>{
    await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$Transaction$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].create({
        userId: params.userId,
        userName: params.userName,
        amount: params.amount,
        description: params.description,
        status: "approved"
    });
};
async function POST(request) {
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["connectDB"])();
        const now = new Date();
        // Only process slots where endTime has definitely passed (with 1 second buffer for safety)
        const expiredSlots = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$PredictionSlot$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].find({
            endTime: {
                $gte: new Date(now.getTime() - 1000)
            },
            status: "open"
        });
        const results = [];
        const adminUser = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].findOne({
            role: "admin"
        });
        for (const slot of expiredSlots){
            // Atomically mark slot as processing to prevent race conditions
            const currentSlot = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$PredictionSlot$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].findOneAndUpdate({
                _id: slot._id,
                status: "open"
            }, {
                $set: {
                    status: "processing"
                }
            }, {
                new: true
            });
            if (!currentSlot) {
                continue; // Slot already processed or not found
            }
            const allBets = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$Bet$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].find({
                slotId: currentSlot._id,
                status: "pending"
            });
            if (!allBets.length) {
                currentSlot.status = "closed";
                await currentSlot.save();
                results.push({
                    slotId: currentSlot._id.toString(),
                    slotNumber: currentSlot.slotNumber,
                    action: "closed",
                    reason: "No bets found"
                });
                continue;
            }
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
                    slotId: currentSlot._id,
                    status: "pending"
                }, {
                    $set: {
                        status: "cancelled"
                    }
                });
                // Mark slot as cancelled
                currentSlot.status = "cancelled";
                currentSlot.winningIcon = null;
                currentSlot.companyCommission = 0;
                await currentSlot.save();
                results.push({
                    slotId: currentSlot._id.toString(),
                    slotNumber: currentSlot.slotNumber,
                    action: "cancelled",
                    reason: "Only one user participated",
                    refunded: totalRefund
                });
                continue;
            }
            // Multiple users - select random winning icon
            const iconsWithBets = [
                ...new Set(allBets.map((bet)=>bet.icon))
            ];
            const randomWinningIcon = iconsWithBets[Math.floor(Math.random() * iconsWithBets.length)];
            const winningBets = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$Bet$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].find({
                slotId: currentSlot._id,
                icon: randomWinningIcon,
                status: "pending"
            });
            const totalSlotAmount = currentSlot.totalAmount;
            // Always take 25% commission
            const companyCommission = totalSlotAmount * 0.25;
            const totalPayoutToWinners = totalSlotAmount - companyCommission;
            // Equal distribution: divide equally among all winners
            const payoutPerWinner = winningBets.length > 0 ? totalPayoutToWinners / winningBets.length : 0;
            // Atomically update slot to completed
            currentSlot.winningIcon = randomWinningIcon;
            currentSlot.companyCommission = companyCommission;
            currentSlot.status = "completed";
            await currentSlot.save();
            for (const bet of winningBets){
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
                        description: `Bet winning for Slot #${currentSlot.slotNumber}`
                    });
                }
            }
            // Atomically update all losing bets (only update pending bets to avoid overwriting already processed bets)
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$Bet$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].updateMany({
                slotId: currentSlot._id,
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
                slotId: currentSlot._id,
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
            if (adminUser) {
                await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].findByIdAndUpdate(adminUser._id, {
                    $inc: {
                        walletBalance: companyCommission
                    }
                });
                await createApprovedTransaction({
                    userId: adminUser._id.toString(),
                    userName: adminUser.name,
                    amount: companyCommission,
                    description: `Commission earned from Slot #${currentSlot.slotNumber}`
                });
            }
            results.push({
                slotId: currentSlot._id.toString(),
                slotNumber: currentSlot.slotNumber,
                action: "completed",
                winningIcon: randomWinningIcon,
                totalWinners: winningBets.length,
                totalPayout: totalPayoutToWinners,
                companyCommission
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            message: `Processed ${expiredSlots.length} expired slot(s)`,
            results
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

//# sourceMappingURL=%5Broot-of-the-server%5D__e580825e._.js.map