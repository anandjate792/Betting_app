"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { authApi } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Umbrella,
  Egg,
  Coins,
  Star,
  Heart,
  Diamond,
  Spade,
  Club,
  Trophy,
  Crown,
  Gem,
  Fish,
  Upload,
} from "lucide-react";
import {
  betApi,
  predictionApi,
  transactionApi,
  withdrawalApi,
} from "@/lib/api";

const ICONS = [
  { id: "umbrella", name: "Umbrella", Icon: Umbrella, color: "text-blue-500" },
  { id: "fish", name: "Fish", Icon: Fish, color: "text-yellow-500" },
  { id: "hen", name: "Hen", Icon: Egg, color: "text-orange-500" },
  { id: "coin", name: "Coin", Icon: Coins, color: "text-amber-500" },
  { id: "star", name: "Star", Icon: Star, color: "text-yellow-400" },
  { id: "heart", name: "Heart", Icon: Heart, color: "text-red-500" },
  { id: "diamond", name: "Diamond", Icon: Diamond, color: "text-cyan-500" },
  { id: "spade", name: "Spade", Icon: Spade, color: "text-slate-700" },
  { id: "club", name: "Club", Icon: Club, color: "text-green-600" },
  { id: "trophy", name: "Trophy", Icon: Trophy, color: "text-yellow-600" },
  { id: "crown", name: "Crown", Icon: Crown, color: "text-purple-500" },
  { id: "gem", name: "Gem", Icon: Gem, color: "text-pink-500" },
];

export default function PredictionDashboard() {
  const { user, logout, addTransaction, transactions, fetchTransactions } =
    useAppStore();
  const [currentSlot, setCurrentSlot] = useState<any>(null);
  const [selectedIcon, setSelectedIcon] = useState<string>("");
  const [betAmount, setBetAmount] = useState<string>("50");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [betsByIcon, setBetsByIcon] = useState<
    Record<string, { totalBets: number; totalAmount: number }>
  >({});
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [activeTab, setActiveTab] = useState("prediction");
  const [myBets, setMyBets] = useState<any[]>([]);
  const [transactionAmount, setTransactionAmount] = useState<string>("");
  const [transactionDescription, setTransactionDescription] =
    useState<string>("");
  const [screenshotImage, setScreenshotImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>("");
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [myWithdrawals, setMyWithdrawals] = useState<any[]>([]);

  useEffect(() => {
    loadCurrentSlot();
    const interval = setInterval(() => {
      loadCurrentSlot();
      updateTimeRemaining();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentSlot) {
      updateTimeRemaining();
      const timer = setInterval(updateTimeRemaining, 1000);
      return () => clearInterval(timer);
    }
  }, [currentSlot]);

  const loadCurrentSlot = async () => {
    try {
      const slot = (await predictionApi.getCurrentSlot()) as any;
      if (slot) {
        setCurrentSlot(slot);
        setBetsByIcon(
          (slot?.betsByIcon || {}) as Record<
            string,
            { totalBets: number; totalAmount: number }
          >
        );
      } else {
        setCurrentSlot(null);
      }
    } catch (error: any) {
      setCurrentSlot(null);
    }
  };

  const loadMyBets = async () => {
    try {
      const bets = await betApi.getBets();
      setMyBets(bets as any[]);
    } catch (error) {
      console.error("Failed to load bets:", error);
    }
  };

  useEffect(() => {
    if (activeTab === "dashboard") {
      loadMyBets();
      fetchTransactions();
      loadWithdrawals();
    }
  }, [activeTab]);

  const loadWithdrawals = async () => {
    try {
      const withdrawals = await withdrawalApi.getWithdrawals();
      setMyWithdrawals(withdrawals as any[]);
    } catch (error) {
      console.error("Failed to load withdrawals:", error);
    }
  };

  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawalLoading(true);
    setError("");

    try {
      const amount = Number.parseFloat(withdrawalAmount);
      if (amount < 1000) {
        setError("Minimum withdrawal amount is ₹1000");
        setWithdrawalLoading(false);
        return;
      }

      if (!user || user.walletBalance < amount) {
        setError("Insufficient wallet balance");
        setWithdrawalLoading(false);
        return;
      }

      await withdrawalApi.requestWithdrawal(amount);
      setWithdrawalAmount("");
      const profile = (await authApi.getProfile()) as any;
      useAppStore.setState({ user: profile });
      await loadWithdrawals();
    } catch (err: any) {
      setError(err.message || "Failed to request withdrawal");
    } finally {
      setWithdrawalLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setScreenshotImage(base64);
        setImagePreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransactionLoading(true);
    setError("");

    try {
      if (!transactionAmount || !transactionDescription || !screenshotImage) {
        setError("Please fill all fields and upload a screenshot");
        setTransactionLoading(false);
        return;
      }

      await addTransaction(
        Number.parseFloat(transactionAmount),
        transactionDescription,
        screenshotImage
      );
      setTransactionAmount("");
      setTransactionDescription("");
      setScreenshotImage(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      const profile = (await authApi.getProfile()) as any;
      useAppStore.setState({ user: profile });
    } catch (err: any) {
      setError(err.message || "Failed to submit transaction");
    } finally {
      setTransactionLoading(false);
    }
  };

  const userTransactions = transactions.filter((t) => t.userId === user?.id);

  const updateTimeRemaining = () => {
    if (!currentSlot) return;
    const now = new Date();
    const end = new Date(currentSlot.endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeRemaining("Slot Closed");
      return;
    }

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`);
  };

  const handlePlaceBet = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const amount = Number.parseFloat(betAmount);
      if (amount < 50) {
        setError("Minimum bet amount is 50 rupees");
        setLoading(false);
        return;
      }

      if (!selectedIcon) {
        setError("Please select an icon");
        setLoading(false);
        return;
      }

      if (!currentSlot) {
        setError("No active slot found");
        setLoading(false);
        return;
      }

      const result = await betApi.placeBet(
        currentSlot.id,
        selectedIcon,
        amount
      );
      setBetAmount("50");
      setSelectedIcon("");

      const profile = (await authApi.getProfile()) as any;
      useAppStore.setState({ user: profile });

      await loadCurrentSlot();
    } catch (err: any) {
      setError(err.message || "Failed to place bet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="border-b border-slate-700 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Prediction Game</h1>
            <p className="text-slate-400 text-sm">
              {currentSlot
                ? `Slot #${currentSlot.slotNumber}`
                : "Waiting for next slot..."}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-slate-400">Wallet Balance</p>
              <p className="text-2xl font-bold text-green-400">
                ₹{user?.walletBalance.toFixed(2) || "0.00"}
              </p>
            </div>
            <Button
              onClick={logout}
              variant="ghost"
              className="text-slate-400 hover:text-red-400"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-700">
            <TabsTrigger value="prediction">Prediction Game</TabsTrigger>
            <TabsTrigger value="dashboard">My Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="prediction" className="mt-6 space-y-6">
            {!currentSlot ? (
              <Card className="border-slate-700 bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">No Active Slot</CardTitle>
                  <CardDescription className="text-slate-400">
                    Waiting for the next prediction slot to be created. Please
                    check back soon!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400 text-center py-8">
                    The next slot will be created automatically every 10
                    minutes.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="border-slate-700 bg-slate-800">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-white">
                          Current Slot
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          Slot #{currentSlot.slotNumber} • Time Remaining:{" "}
                          {timeRemaining}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-400">Total Bets</p>
                        <p className="text-xl font-bold text-blue-400">
                          {currentSlot.totalBets}
                        </p>
                        <p className="text-sm text-slate-400">Total Amount</p>
                        <p className="text-xl font-bold text-green-400">
                          ₹{currentSlot.totalAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card className="border-slate-700 bg-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Select Icon & Place Bet
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Minimum bet: ₹50
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePlaceBet} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-slate-300 mb-2 block">
                          Choose Icon
                        </label>
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                          {ICONS.map(({ id, name, Icon, color }) => {
                            const iconData = betsByIcon[id] || {
                              totalBets: 0,
                              totalAmount: 0,
                            };
                            return (
                              <button
                                key={id}
                                type="button"
                                onClick={() => setSelectedIcon(id)}
                                className={`p-4 rounded-lg border-2 transition-all ${
                                  selectedIcon === id
                                    ? "border-blue-500 bg-blue-500/20"
                                    : "border-slate-600 bg-slate-700 hover:border-slate-500"
                                }`}
                              >
                                <Icon
                                  className={`w-8 h-8 mx-auto mb-2 ${color}`}
                                />
                                <p className="text-xs text-slate-300">{name}</p>
                                <p className="text-xs text-slate-400 mt-1">
                                  {iconData.totalBets} bets • ₹
                                  {iconData.totalAmount.toFixed(0)}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-300">
                          Bet Amount (₹)
                        </label>
                        <Input
                          type="number"
                          min="50"
                          step="10"
                          placeholder="50"
                          value={betAmount}
                          onChange={(e) => setBetAmount(e.target.value)}
                          className="mt-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                        />
                      </div>

                      {error && <p className="text-sm text-red-400">{error}</p>}

                      <Button
                        type="submit"
                        disabled={
                          loading ||
                          !selectedIcon ||
                          Number.parseFloat(betAmount) < 50
                        }
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                      >
                        {loading
                          ? "Placing Bet..."
                          : `Place Bet (₹${betAmount})`}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="dashboard" className="mt-6 space-y-6">
            <Card className="border-slate-700 bg-slate-800">
              <CardHeader>
                <CardTitle className="text-white">My Betting History</CardTitle>
                <CardDescription className="text-slate-400">
                  View all your bets and their results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {myBets.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">
                    No bets placed yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {myBets.map((bet) => (
                      <div
                        key={bet.id}
                        className="p-4 bg-slate-700 rounded-lg border border-slate-600"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-white">
                              Slot #{bet.slotNumber || "N/A"}
                            </p>
                            <p className="text-sm text-slate-400">
                              Icon: {bet.icon} • Amount: ₹
                              {bet.amount.toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {new Date(bet.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`text-xs px-3 py-1 rounded-full ${
                                bet.status === "won"
                                  ? "bg-green-600 text-white"
                                  : bet.status === "lost"
                                  ? "bg-red-600 text-white"
                                  : "bg-yellow-600 text-white"
                              }`}
                            >
                              {bet.status.charAt(0).toUpperCase() +
                                bet.status.slice(1)}
                            </span>
                            {bet.status === "won" && bet.payout > 0 && (
                              <p className="text-sm text-green-400 mt-2">
                                Won: ₹{bet.payout.toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-800">
              <CardHeader>
                <CardTitle className="text-white">
                  Add Money to Wallet
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Upload payment screenshot for admin approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitTransaction} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-300">
                      Amount (₹)
                    </label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={transactionAmount}
                      onChange={(e) => setTransactionAmount(e.target.value)}
                      className="mt-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300">
                      Description
                    </label>
                    <Input
                      type="text"
                      placeholder="GPay payment for..."
                      value={transactionDescription}
                      onChange={(e) =>
                        setTransactionDescription(e.target.value)
                      }
                      className="mt-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300">
                      Upload Screenshot
                    </label>
                    <div className="mt-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full bg-slate-700 hover:bg-slate-600 text-white border border-slate-600"
                        variant="outline"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {imagePreview ? "Change Image" : "Choose Image"}
                      </Button>
                    </div>
                  </div>
                  {imagePreview && (
                    <div className="mt-4">
                      <p className="text-sm text-slate-300 mb-2">Preview:</p>
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Screenshot preview"
                        className="w-full max-h-48 object-cover rounded-lg border border-slate-600"
                      />
                    </div>
                  )}
                  {error && <p className="text-sm text-red-400">{error}</p>}
                  <Button
                    type="submit"
                    disabled={!screenshotImage || transactionLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  >
                    {transactionLoading
                      ? "Submitting..."
                      : "Submit for Approval"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Wallet Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-slate-700 rounded-lg">
                    <div>
                      <p className="text-sm text-slate-400">Current Balance</p>
                      <p className="text-3xl font-bold text-green-400">
                        ₹{user?.walletBalance.toFixed(2) || "0.00"}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-400">
                    <p>• Minimum bet amount: ₹50</p>
                    <p>• Winnings are automatically added to your wallet</p>
                    <p>
                      • Upload payment screenshot to add funds (admin approval
                      required)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-700 bg-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Withdraw Money</CardTitle>
                <CardDescription className="text-slate-400">
                  {user && user.walletBalance >= 1000
                    ? "Request withdrawal (Minimum: ₹1000)"
                    : "Minimum wallet balance of ₹1000 required for withdrawal"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user && user.walletBalance >= 1000 ? (
                  <form
                    onSubmit={handleRequestWithdrawal}
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-sm font-medium text-slate-300">
                        Withdrawal Amount (₹)
                      </label>
                      <Input
                        type="number"
                        min="1000"
                        step="100"
                        placeholder="1000"
                        value={withdrawalAmount}
                        onChange={(e) => setWithdrawalAmount(e.target.value)}
                        className="mt-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Available balance: ₹{user.walletBalance.toFixed(2)}
                      </p>
                    </div>
                    {error && <p className="text-sm text-red-400">{error}</p>}
                    <Button
                      type="submit"
                      disabled={
                        withdrawalLoading ||
                        Number.parseFloat(withdrawalAmount) < 1000 ||
                        Number.parseFloat(withdrawalAmount) > user.walletBalance
                      }
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                    >
                      {withdrawalLoading
                        ? "Processing..."
                        : `Request Withdrawal (₹${withdrawalAmount || "0"})`}
                    </Button>
                  </form>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-400 mb-4">
                      Your current balance: ₹
                      {user?.walletBalance.toFixed(2) || "0.00"}
                    </p>
                    <p className="text-slate-500 text-sm">
                      You need at least ₹1000 in your wallet to request a
                      withdrawal. Add more funds to enable this feature.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Withdrawal History</CardTitle>
                <CardDescription className="text-slate-400">
                  Your withdrawal requests and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {myWithdrawals.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">
                    No withdrawal requests yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {myWithdrawals.map((withdrawal) => (
                      <div
                        key={withdrawal.id}
                        className="p-4 bg-slate-700 rounded-lg border border-slate-600"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-white">
                              ₹{withdrawal.amount.toFixed(2)}
                            </p>
                            <p className="text-sm text-slate-400">
                              {new Date(withdrawal.createdAt).toLocaleString()}
                            </p>
                            {withdrawal.approvedAt && (
                              <p className="text-xs text-green-400 mt-1">
                                Approved:{" "}
                                {new Date(
                                  withdrawal.approvedAt
                                ).toLocaleString()}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <span
                              className={`text-xs px-3 py-1 rounded-full ${
                                withdrawal.status === "approved"
                                  ? "bg-green-600 text-white"
                                  : withdrawal.status === "rejected"
                                  ? "bg-red-600 text-white"
                                  : "bg-yellow-600 text-white"
                              }`}
                            >
                              {withdrawal.status.charAt(0).toUpperCase() +
                                withdrawal.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-800">
              <CardHeader>
                <CardTitle className="text-white">
                  Transaction History
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Your payment requests and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userTransactions.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">
                    No transactions yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {userTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="p-4 bg-slate-700 rounded-lg border border-slate-600"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-white">
                              {transaction.description}
                            </p>
                            <p className="text-sm text-slate-400">
                              {new Date(transaction.createdAt).toLocaleString()}
                            </p>
                            {transaction.status === "approved" && (
                              <p className="text-xs text-green-400 mt-1">
                                ✓ Approved
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-400">
                              ₹{transaction.amount.toFixed(2)}
                            </p>
                            <span
                              className={`text-xs px-3 py-1 rounded-full ${
                                transaction.status === "pending"
                                  ? "bg-yellow-600 text-white"
                                  : transaction.status === "approved"
                                  ? "bg-green-600 text-white"
                                  : "bg-red-600 text-white"
                              }`}
                            >
                              {transaction.status.charAt(0).toUpperCase() +
                                transaction.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
