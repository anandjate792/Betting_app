"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Wallet,
  Gamepad2,
  ArrowUpDown,
  CreditCard,
  RefreshCw,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
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
} from "lucide-react";
import { betApi, predictionApi, referralApi } from "@/lib/api";
import { authApi } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

export default function DashboardPage() {
  const { user } = useAppStore();
  const [currentSlot, setCurrentSlot] = useState<any>(null);
  const [selectedIcon, setSelectedIcon] = useState<string>("");
  const [betAmount, setBetAmount] = useState<string>("50");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [betsByIcon, setBetsByIcon] = useState<
    Record<string, { totalBets: number; totalAmount: number }>
  >({});
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [slotLoading, setSlotLoading] = useState(true);
  const [lastWin, setLastWin] = useState<any | null>(null);
  const [currentSlotBets, setCurrentSlotBets] = useState<
    { icon: string; amount: number }[]
  >([]);
  const [myBets, setMyBets] = useState<any[]>([]);
  const [betsLoading, setBetsLoading] = useState(false);
  const [betsSkip, setBetsSkip] = useState(10);
  const [betsHasMore, setBetsHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralInfo, setReferralInfo] = useState<{
    referralCode?: string;
    referralCount?: number;
    referralEarnings?: number;
  }>({});
  const [resultPopup, setResultPopup] = useState<{
    show: boolean;
    type: "win" | "loss" | null;
    slotNumber?: number;
    winningIcon?: string;
    payout?: number;
    betAmount?: number;
  }>({ show: false, type: null });
  const [previousSlotId, setPreviousSlotId] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentSlot();
    loadMyBets(true);
    loadReferralInfo();
    const interval = setInterval(loadCurrentSlot, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadReferralInfo = async () => {
    setReferralLoading(true);
    try {
      const data = await referralApi.getMyReferrals();
      setReferralInfo({
        referralCode: (data as any).referralCode,
        referralCount: (data as any).referralCount,
        referralEarnings: (data as any).referralEarnings,
      });
    } catch (error) {
      console.error("Failed to load referral info:", error);
    } finally {
      setReferralLoading(false);
    }
  };

  useEffect(() => {
    if (currentSlot) {
      updateTimeRemaining();
      const timer = setInterval(updateTimeRemaining, 1000);
      return () => clearInterval(timer);
    }
  }, [currentSlot]);

  const loadCurrentSlot = async () => {
    try {
      const slot = await predictionApi.getCurrentSlot().catch(() => null);

      // Detect slot completion: if previous slot ID exists and current slot has different ID (or is null)
      if (previousSlotId && previousSlotId !== slot?.id) {
        // Previous slot completed, check if user won or lost
        await checkSlotResult(previousSlotId);
      }

      setPreviousSlotId(slot?.id || null);
      setCurrentSlot(slot);
      if (slot) {
        setBetsByIcon(slot.betsByIcon || {});
        await loadMyCurrentSlotBet(slot.id);
      }
    } catch (error) {
      console.error("Failed to load current slot:", error);
    } finally {
      setSlotLoading(false);
    }
  };

  const checkSlotResult = async (completedSlotId: string) => {
    try {
      // Get all bets for this completed slot
      const response = (await betApi.getBets(completedSlotId, 100, 0)) as any;
      const betsArray = Array.isArray(response)
        ? response
        : response?.data || [];

      const myBetsForSlot = betsArray.filter(
        (bet: any) =>
          bet.slotId && bet.slotId.toString() === completedSlotId.toString()
      );

      if (myBetsForSlot.length === 0) {
        // User didn't bet on this slot
        return;
      }

      // Get winning icon from slot data in bets
      const winningIcon = myBetsForSlot[0]?.slot?.winningIcon || null;
      const slotNumber =
        myBetsForSlot[0]?.slot?.slotNumber ||
        myBetsForSlot[0]?.slotNumber ||
        null;

      if (!winningIcon) {
        // Slot might not be fully processed yet
        return;
      }

      const wonBets = myBetsForSlot.filter(
        (bet: any) => bet.icon === winningIcon && bet.status === "won"
      );
      const lostBets = myBetsForSlot.filter(
        (bet: any) => bet.status === "lost"
      );

      if (wonBets.length > 0) {
        // User won
        const totalPayout = wonBets.reduce(
          (sum: number, bet: any) => sum + (bet.payout || 0),
          0
        );
        const totalBetAmount = wonBets.reduce(
          (sum: number, bet: any) => sum + bet.amount,
          0
        );
        setResultPopup({
          show: true,
          type: "win",
          slotNumber: slotNumber,
          winningIcon: winningIcon,
          payout: totalPayout,
          betAmount: totalBetAmount,
        });

        // Auto close after 5 seconds
        setTimeout(() => {
          setResultPopup({ show: false, type: null });
        }, 5000);
      } else if (lostBets.length > 0) {
        // User lost
        const totalBetAmount = lostBets.reduce(
          (sum: number, bet: any) => sum + bet.amount,
          0
        );
        setResultPopup({
          show: true,
          type: "loss",
          slotNumber: slotNumber,
          winningIcon: winningIcon,
          betAmount: totalBetAmount,
        });

        // Auto close after 5 seconds
        setTimeout(() => {
          setResultPopup({ show: false, type: null });
        }, 5000);
      }
    } catch (err) {
      console.error("Failed to check slot result:", err);
    }
  };

  const loadMyCurrentSlotBet = async (slotId?: string) => {
    if (!slotId) {
      setCurrentSlotBets([]);
      return;
    }
    try {
      const response = (await betApi.getBets(slotId, 10, 0)) as any;
      const betsArray = Array.isArray(response)
        ? response
        : response.data || [];
      const myBetsForSlot =
        betsArray
          ?.filter((b: any) => b.slotId === slotId)
          .map((b: any) => ({ icon: b.icon, amount: b.amount })) || [];
      setCurrentSlotBets(myBetsForSlot);
    } catch (error) {
      console.error("Failed to load current slot bet:", error);
      setCurrentSlotBets([]);
    }
  };

  const loadMyBets = async (reset = false) => {
    if (reset) {
      setBetsSkip(10);
      setBetsHasMore(true);
    }
    if (!betsHasMore && !reset) return;

    setBetsLoading(true);
    try {
      const response = (await betApi.getBets(
        undefined,
        10,
        reset ? 0 : betsSkip
      )) as any;
      // Handle both old format (array) and new format (paginated)
      if (Array.isArray(response)) {
        const updatedBets = reset ? response : [...myBets, ...response];
        setMyBets(updatedBets);
        const latestWin =
          updatedBets
            .filter((b: any) => b.status === "won" && b.payout > 0)
            .sort(
              (a: any, b: any) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )[0] || null;
        setLastWin(latestWin);
        setBetsHasMore(false);
      } else {
        const newBets = response.data || [];
        const updatedBets = reset ? newBets : [...myBets, ...newBets];
        setMyBets(updatedBets);
        const latestWin =
          updatedBets
            .filter((b: any) => b.status === "won" && b.payout > 0)
            .sort(
              (a: any, b: any) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )[0] || null;
        setLastWin(latestWin);
        setBetsHasMore(response.pagination?.hasMore || false);
        setBetsSkip((prev) => (reset ? 10 : prev + 10));
      }
    } catch (error) {
      console.error("Failed to load bets:", error);
    } finally {
      setBetsLoading(false);
    }
  };

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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh user profile to update wallet balance
      const profile = (await authApi.getProfile()) as any;
      useAppStore.setState({ user: profile });

      // Refresh current slot
      await loadCurrentSlot();

      // Refresh betting history
      await loadMyBets(true);

      // Update time remaining
      if (currentSlot) {
        updateTimeRemaining();
      }
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const handlePlaceBet = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const amount = Number.parseFloat(betAmount);
      if (amount < 50) {
        setError("Minimum bet amount is 50 coins");
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

      await betApi.placeBet(currentSlot.id, selectedIcon, amount);
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

  const quickActions = [
    {
      href: "/dashboard/wallet",
      label: "Wallet",
      icon: Wallet,
      description: "View balance and add money",
      color: "text-green-400",
    },
    {
      href: "/dashboard/transactions",
      label: "Transactions",
      icon: ArrowUpDown,
      description: "View transaction history",
      color: "text-blue-400",
    },
    {
      href: "/dashboard/withdrawals",
      label: "Withdrawals",
      icon: CreditCard,
      description: "Request withdrawals",
      color: "text-purple-400",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Wallet Balance Card */}
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-white">
              <Wallet className="w-5 h-5" />
              Wallet Balance
            </CardTitle>
            <Button
              onClick={onRefresh}
              disabled={refreshing}
              variant="ghost"
              size="sm"
              className="text-blue-400 hover:text-blue-300 hover:bg-slate-700"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-green-400">
            ₹{user?.walletBalance.toFixed(2) || "0.00"}
          </div>
          <p className="text-slate-400 text-sm mt-2">
            Your current wallet balance
          </p>
        </CardContent>
      </Card>

      {/* Refer & Earn */}
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Refer & Earn</CardTitle>
          <CardDescription className="text-slate-400">
            Share your referral code with friends. When they play and win, you
            can earn extra rewards. (Tracking enabled now; payout rules can be
            adjusted later.)
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400 mb-1">Your Referral Code</p>
            <p className="text-2xl font-bold text-blue-400">
              {referralLoading
                ? "Loading..."
                : referralInfo.referralCode || "N/A"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Ask new users to share this code with the admin when their account
              is created, or during signup once enabled.
            </p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-sm text-slate-400">
              Total Referrals:{" "}
              <span className="font-semibold text-white">
                {referralInfo.referralCount ?? 0}
              </span>
            </p>
            <p className="text-sm text-slate-400">
              Referral Earnings:{" "}
              <span className="font-semibold text-green-400">
                ₹{(referralInfo.referralEarnings ?? 0).toFixed(2)}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Prediction Game Betting */}
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Gamepad2 className="w-5 h-5" />
                Prediction Game
              </CardTitle>
              <CardDescription className="text-slate-400">
                {currentSlot
                  ? `Slot #${currentSlot.slotNumber} • Time Remaining: ${timeRemaining}`
                  : "No active slot"}
              </CardDescription>
            </div>
            {currentSlot && (
              <div className="text-right">
                <p className="text-sm text-slate-400">Total Bets</p>
                <p className="text-xl font-bold text-blue-400">
                  {currentSlot.totalBets}
                </p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Big Win Banner */}
          {lastWin && (
            <div className="mb-6">
              <div className="relative overflow-hidden rounded-2xl border border-amber-400 bg-gradient-to-br from-amber-500 via-yellow-400 to-orange-500 shadow-[0_0_30px_rgba(251,191,36,0.7)] animate-pulse">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_#ffffff,_transparent_60%)]" />
                <div className="relative px-6 py-4 text-center text-slate-900">
                  <p className="text-xs font-semibold tracking-[0.25em] uppercase">
                    You Win
                  </p>
                  <p className="mt-1 text-4xl md:text-5xl font-extrabold drop-shadow-sm">
                    {lastWin.payout.toFixed(0)} coins
                  </p>
                  {lastWin.amount > 0 && (
                    <p className="mt-1 text-sm font-semibold">
                      {(lastWin.payout / lastWin.amount || 0).toFixed(1)}x
                    </p>
                  )}
                  <p className="mt-2 text-xs text-slate-800">
                    Slot #{lastWin.slotNumber ?? "-"} •{" "}
                    {new Date(lastWin.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {slotLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="w-6 h-6 text-blue-400" />
              <p className="ml-3 text-slate-400">Loading slot...</p>
            </div>
          ) : !currentSlot ? (
            <div className="text-center py-8">
              <p className="text-slate-400">
                No active slot. Waiting for the next prediction slot to be
                created.
              </p>
            </div>
          ) : (
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
                    const isSelected = selectedIcon === id;
                    const myBetsForIcon = currentSlotBets.filter(
                      (b) => b.icon === id
                    );
                    const hasMyBetOnIcon = myBetsForIcon.length > 0;
                    const totalMyAmountForIcon = myBetsForIcon.reduce(
                      (sum, b) => sum + b.amount,
                      0
                    );
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSelectedIcon(id)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-500 bg-opacity-20"
                            : "border-slate-600 bg-slate-700 hover:border-slate-500"
                        }`}
                      >
                        <Icon className={`w-6 h-6 mx-auto mb-1 ${color}`} />
                        <p className="text-xs text-slate-300">{name}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {iconData.totalBets} bets •{" "}
                          {iconData.totalAmount.toFixed(0)} coins
                        </p>
                        {hasMyBetOnIcon && (
                          <p className="text-[10px] text-amber-300 mt-1 font-semibold">
                            Your bets: {totalMyAmountForIcon.toFixed(0)} coins
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Bet Amount (coins)
                </label>
                <Input
                  type="number"
                  min="50"
                  step="10"
                  placeholder="50"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
                {currentSlotBets.length > 0 && (
                  <p className="text-xs text-slate-300">
                    You already have{" "}
                    <span className="text-white font-semibold">
                      {currentSlotBets.length}
                    </span>{" "}
                    bets on this slot. You can place more bets on different
                    icons.
                  </p>
                )}
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <Button
                type="submit"
                disabled={
                  loading || !selectedIcon || Number.parseFloat(betAmount) < 50
                }
                className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    Placing Bet...
                  </>
                ) : (
                  "Place Bet"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Betting History */}
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white">My Betting History</CardTitle>
          <CardDescription className="text-slate-400">
            View all your bets and their results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {betsLoading && myBets.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="w-6 h-6 text-blue-400" />
              <p className="ml-3 text-slate-400">Loading betting history...</p>
            </div>
          ) : myBets.length === 0 ? (
            <p className="text-slate-400 text-center py-8">
              No betting history found
            </p>
          ) : (
            <>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3 pr-4">
                  {myBets.map((bet) => {
                    const slot = bet.slot;
                    const slotNumber = slot?.slotNumber || bet.slotNumber;
                    const isWinner = slot?.winningIcon === bet.icon;
                    const isCompleted = slot?.status === "completed";
                    const betStatus =
                      bet.status ||
                      (isCompleted ? (isWinner ? "won" : "lost") : "pending");
                    return (
                      <div
                        key={bet.id}
                        className="p-4 bg-slate-700 rounded-lg border border-slate-600"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-blue-300">
                                {bet.icon}
                              </span>
                              <span className="text-sm text-slate-400">•</span>
                              <p className="text-sm font-semibold text-white">
                                Slot #{slotNumber || "N/A"}
                              </p>
                            </div>
                            <p className="text-xs text-slate-400">
                              {slot?.startTime
                                ? new Date(slot.startTime).toLocaleString()
                                : bet.createdAt
                                ? new Date(bet.createdAt).toLocaleString()
                                : "Unknown date"}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Bet: ₹{bet.amount.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            {betStatus === "won" && bet.payout > 0 && (
                              <>
                                <p className="text-lg font-bold text-green-400">
                                  +₹{bet.payout.toFixed(2)}
                                </p>
                                <span className="text-xs px-2 py-1 rounded-full bg-green-600 text-white inline-block mt-1">
                                  Won
                                </span>
                              </>
                            )}
                            {betStatus === "lost" && (
                              <>
                                <p className="text-lg font-bold text-red-400">
                                  -₹{bet.amount.toFixed(2)}
                                </p>
                                <span className="text-xs px-2 py-1 rounded-full bg-red-600 text-white inline-block mt-1">
                                  Lost
                                </span>
                              </>
                            )}
                            {betStatus === "pending" && (
                              <>
                                <p className="text-sm text-slate-400">
                                  Pending
                                </p>
                                <span className="text-xs px-2 py-1 rounded-full bg-yellow-600 text-white inline-block mt-1">
                                  Pending
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        {isCompleted && slot?.winningIcon && (
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-600">
                            <span className="text-xs text-slate-400">
                              Winning Icon:
                            </span>
                            <span className="text-xs font-semibold text-green-300">
                              {slot.winningIcon}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
              {betsHasMore && (
                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={() => loadMyBets(false)}
                    disabled={betsLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    {betsLoading ? (
                      <>
                        <Spinner className="w-4 h-4 mr-2" />
                        Loading...
                      </>
                    ) : (
                      "Load More (10 bets)"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href}>
              <Card className="border-slate-700 bg-slate-800 hover:bg-slate-750 transition-colors cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Icon className={`w-8 h-8 ${action.color}`} />
                    <div>
                      <h3 className="font-semibold text-white">
                        {action.label}
                      </h3>
                      <p className="text-sm text-slate-400">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Result Popup Dialog */}
      <Dialog
        open={resultPopup.show}
        onOpenChange={(open) => {
          if (!open) {
            setResultPopup({ show: false, type: null });
          }
        }}
      >
        <DialogContent className="sm:max-w-md border-0 p-0 overflow-hidden">
          {resultPopup.type === "win" ? (
            <div className="relative bg-gradient-to-br from-amber-500 via-yellow-400 to-orange-500 p-8 text-center">
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setResultPopup({ show: false, type: null })}
                  className="text-slate-900 hover:text-slate-700 transition-colors"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="mb-6 flex justify-center">
                <div className="bg-amber-400/30 rounded-full p-6">
                  <Trophy className="h-20 w-20 text-amber-900" />
                </div>
              </div>
              <DialogTitle className="text-3xl font-black text-slate-900 mb-3 tracking-wider">
                🎉 YOU WIN! 🎉
              </DialogTitle>
              <div className="text-5xl font-black text-slate-900 mb-2">
                +{resultPopup.payout?.toFixed(0) || 0} coins
              </div>
              {resultPopup.betAmount && resultPopup.payout && (
                <div className="text-lg font-bold text-amber-900 mb-4">
                  {(resultPopup.payout / resultPopup.betAmount).toFixed(1)}x
                  Multiplier
                </div>
              )}
              <DialogDescription className="text-slate-900 space-y-1 mt-4">
                <p className="font-semibold">Slot #{resultPopup.slotNumber}</p>
                <p className="font-semibold">
                  Winning Icon: {resultPopup.winningIcon?.toUpperCase()}
                </p>
              </DialogDescription>
            </div>
          ) : resultPopup.type === "loss" ? (
            <div className="relative bg-slate-800 p-8 text-center border-2 border-red-500">
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setResultPopup({ show: false, type: null })}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="mb-6 flex justify-center">
                <div className="bg-red-500/20 rounded-full p-6">
                  <XIcon className="h-20 w-20 text-red-500" />
                </div>
              </div>
              <DialogTitle className="text-3xl font-black text-white mb-3 tracking-wider">
                😔 YOU LOST
              </DialogTitle>
              <div className="text-5xl font-black text-red-500 mb-4">
                -{resultPopup.betAmount?.toFixed(0) || 0} coins
              </div>
              <DialogDescription className="text-slate-300 space-y-1 mt-4">
                <p className="font-semibold">Slot #{resultPopup.slotNumber}</p>
                <p className="font-semibold">
                  Winning Icon: {resultPopup.winningIcon?.toUpperCase()}
                </p>
                <p className="text-slate-400 italic mt-2">
                  Better luck next time!
                </p>
              </DialogDescription>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
