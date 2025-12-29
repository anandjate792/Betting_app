"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
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
  const [showResultBanner, setShowResultBanner] = useState(false);

  const [seenSlotIds, setSeenSlotIds] = useState<Set<string>>(new Set());
  const [processedSlots, setProcessedSlots] = useState<Set<string>>(new Set());
  const slotEndTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [winningHistory, setWinningHistory] = useState<
    Array<{ slotNumber: number; winningIcon: string }>
  >([]);
  const [previousSlotsHistory, setPreviousSlotsHistory] = useState<
    Array<{
      slot: any;
      userBets: any[];
      participated: boolean;
    }>
  >([]);

  // Load seen slots from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("wt_seen_slots");
    if (stored) {
      try {
        setSeenSlotIds(new Set(JSON.parse(stored)));
      } catch {}
    }
  }, []);

  const markSlotSeen = (slotId: string) => {
    setSeenSlotIds((prev) => {
      const next = new Set(prev);
      next.add(slotId);
      localStorage.setItem("wt_seen_slots", JSON.stringify([...next]));
      return next;
    });
  };

  /* ---------------- SLOT TIMER (CRITICAL FIX) ---------------- */

  useEffect(() => {
    if (!currentSlot?.id || !currentSlot?.endTime) return;

    if (slotEndTimerRef.current) {
      clearTimeout(slotEndTimerRef.current);
    }

    const end = new Date(currentSlot.endTime).getTime();
    const now = Date.now();
    const delay = end - now;

    if (delay <= 0) {
      checkSlotResult(currentSlot.id);
      return;
    }

    slotEndTimerRef.current = setTimeout(() => {
      checkSlotResult(currentSlot.id);
    }, delay + 1000);

    return () => {
      if (slotEndTimerRef.current) {
        clearTimeout(slotEndTimerRef.current);
      }
    };
  }, [currentSlot?.id]);

  /* ---------------- LOAD CURRENT SLOT ---------------- */

  const loadCurrentSlot = async () => {
    try {
      const slot = await predictionApi.getCurrentSlot().catch(() => null);
      setCurrentSlot(slot);
      setBetsByIcon(slot?.betsByIcon || {});

      if (slot) {
        await loadMyCurrentSlotBet(slot.id);
      }
    } finally {
      setSlotLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentSlot();
    loadMyBets(true);
    loadReferralInfo();
    loadWinningHistory();
    loadPreviousSlotsHistory();

    const i = setInterval(loadCurrentSlot, 30000);
    return () => clearInterval(i);
  }, []);

  const loadWinningHistory = async () => {
    try {
      const slots = await predictionApi.getAllSlots();
      const completed = (slots as any[])
        .filter((s: any) => s.status === "completed" && s.winningIcon)
        .sort((a: any, b: any) => (b.slotNumber || 0) - (a.slotNumber || 0))
        .slice(0, 10)
        .map((s: any) => ({
          slotNumber: s.slotNumber,
          winningIcon: s.winningIcon,
        }));
      setWinningHistory(completed);
    } catch (error) {
      console.error("Failed to load winning history:", error);
    }
  };

  const loadPreviousSlotsHistory = async () => {
    try {
      const slots = await predictionApi.getAllSlots();
      const completedSlots = (slots as any[])
        .filter((s: any) => s.status === "completed" && s.winningIcon)
        .sort((a: any, b: any) => (b.slotNumber || 0) - (a.slotNumber || 0))
        .slice(0, 10);

      const historyWithBets = await Promise.all(
        completedSlots.map(async (slot) => {
          try {
            const res = (await betApi.getBets(slot.id, 100, 0)) as any;
            const allBets = Array.isArray(res) ? res : res?.data || [];
            const userBets = allBets.filter((b: any) => b.userId === user?.id);
            return {
              slot,
              userBets,
              participated: userBets.length > 0,
            };
          } catch (error) {
            console.error(`Failed to load bets for slot ${slot.id}:`, error);
            return {
              slot,
              userBets: [],
              participated: false,
            };
          }
        })
      );

      setPreviousSlotsHistory(historyWithBets);
    } catch (error) {
      console.error("Failed to load previous slots history:", error);
    }
  };

  /* ---------------- TIMER UI ---------------- */

  useEffect(() => {
    if (!currentSlot?.endTime) return;

    const tick = () => {
      const diff = new Date(currentSlot.endTime).getTime() - Date.now();
      if (diff <= 0) {
        setTimeRemaining("Slot Closed");
        return;
      }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${m}:${s.toString().padStart(2, "0")}`);
    };

    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [currentSlot?.endTime]);

  /* ---------------- CHECK SLOT RESULT ---------------- */

  const checkSlotResult = async (slotId: string, retry = 0) => {
    if (seenSlotIds.has(slotId) || processedSlots.has(slotId)) return;

    try {
      const slot = await predictionApi.getSlot(slotId);
      if (!slot || slot.status !== "completed" || !slot.winningIcon) {
        if (retry < 8) {
          setTimeout(() => checkSlotResult(slotId, retry + 1), 2000);
        }
        return;
      }

      const res = (await betApi.getBets(slotId, 100, 0)) as any;
      const bets = (res.data || res).filter((b: any) => b.userId === user?.id);

      if (!bets.length) {
        markSlotSeen(slotId);
        return;
      }

      const wins = bets.filter((b: any) => b.icon === slot.winningIcon);
      const totalBet = bets.reduce((s: number, b: any) => s + b.amount, 0);
      const payout = wins.length
        ? wins.reduce(
            (s: number, b: any) => s + (b.payout || b.amount * 1.5),
            0
          )
        : 0;

      setResultPopup({
        show: true,
        type: wins.length ? "win" : "loss",
        slotNumber: slot.slotNumber,
        winningIcon: slot.winningIcon,
        payout,
        betAmount: totalBet,
      });
      setShowResultBanner(true);

      markSlotSeen(slotId);
      setProcessedSlots((p) => new Set(p).add(slotId));

      const profile = (await authApi.getProfile()) as any;
      useAppStore.setState({ user: profile });

      // Reload betting history
      await loadMyBets(true);

      setTimeout(() => {
        setShowResultBanner(false);
      }, 5000);
    } catch {
      if (retry < 5) {
        setTimeout(() => checkSlotResult(slotId, retry + 1), 3000);
      }
    }
  };

  /* ---------------- LOAD USER'S BETS FOR CURRENT SLOT ---------------- */

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
          ?.filter((b: any) => b.slotId === slotId && b.userId === user?.id)
          .map((b: any) => ({ icon: b.icon, amount: b.amount })) || [];
      setCurrentSlotBets(myBetsForSlot);
    } catch (error) {
      console.error("Failed to load current slot bet:", error);
      setCurrentSlotBets([]);
    }
  };

  /* ---------------- LOAD REFERRAL INFO ---------------- */

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

  /* ---------------- LOAD MY BETS ---------------- */

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

  /* ---------------- REFRESH ---------------- */

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const profile = (await authApi.getProfile()) as any;
      useAppStore.setState({ user: profile });

      await loadCurrentSlot();
      await loadMyBets(true);
      await loadWinningHistory();
      await loadPreviousSlotsHistory();

      if (currentSlot) {
        updateTimeRemaining();
      }
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setRefreshing(false);
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

  /* ---------------- PLACE BET ---------------- */

  const handlePlaceBet = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const amount = Number.parseFloat(betAmount);
      if (amount < 10 || amount > 500) {
        setError("Bet amount must be between 10 and 500 coins");
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
      setBetAmount("10");
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-slate-800 pb-8">
      {/* Top Stats Bar - Similar to Lightning Roulette */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-slate-400">Balance</p>
              <p className="text-lg font-bold text-green-400">
                ₹{user?.walletBalance?.toFixed(2) || "0.00"}
              </p>
            </div>
            {lastWin && (
              <div className="border-l border-slate-600 pl-4">
                <p className="text-xs text-slate-400">Last Win</p>
                <p className="text-lg font-bold text-yellow-400">
                  ₹{lastWin.payout?.toFixed(2) || "0.00"}
                </p>
              </div>
            )}
          </div>
          <Button
            onClick={onRefresh}
            disabled={refreshing}
            size="sm"
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Win/Loss Banner - Quick Display */}
      {showResultBanner && resultPopup.type && (
        <div className="mx-4 mt-4">
          {resultPopup.type === "win" ? (
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-center shadow-lg animate-pulse">
              <div className="relative z-10">
                <Trophy className="w-12 h-12 mx-auto mb-2 text-white" />
                <p className="text-3xl font-black text-white mb-1">YOU WIN!</p>
                <p className="text-4xl font-black text-white">
                  +₹{resultPopup.payout?.toFixed(2)}
                </p>
                <p className="text-sm text-white/80 mt-2">
                  Slot #{resultPopup.slotNumber}
                </p>
              </div>
              <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" />
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 p-6 text-center shadow-lg border-2 border-red-500">
              <div className="relative z-10">
                <XIcon className="w-12 h-12 mx-auto mb-2 text-red-400" />
                <p className="text-2xl font-black text-white mb-1">LOST</p>
                <p className="text-3xl font-black text-red-400">
                  -₹{resultPopup.betAmount?.toFixed(2)}
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  Slot #{resultPopup.slotNumber}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Previous Winner History (Last 10 Slots) - Horizontal Scroll */}
      {winningHistory.length > 0 && (
        <Card className="border-slate-700 bg-slate-800 mt-4 mx-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base">
              Last 10 Results
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {winningHistory.map((item, idx) => {
                const iconData = ICONS.find((i) => i.id === item.winningIcon);
                const IconComponent = iconData?.Icon || Trophy;
                return (
                  <div
                    key={idx}
                    className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 bg-slate-700 rounded-lg border-2 border-slate-600 hover:border-blue-400 transition-colors"
                  >
                    <IconComponent
                      className={`w-6 h-6 ${
                        iconData?.color || "text-yellow-500"
                      }`}
                    />
                    <span className="text-[10px] text-slate-400 mt-1">
                      #{item.slotNumber}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prediction Game */}
      <Card className="border-slate-700 bg-slate-800 mx-4 mt-4">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Gamepad2 className="w-5 h-5" />
                Pop The Picture
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
          {lastWin && (
            <div className="mb-6">
              <div className="relative overflow-hidden rounded-xl border-2 border-yellow-500 bg-gradient-to-br from-yellow-500 via-orange-400 to-orange-500 shadow-xl">
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,_#ffffff,_transparent_60%)]" />
                <div className="relative px-6 py-4 text-center text-slate-900">
                  <Trophy className="w-8 h-8 mx-auto mb-2 text-white" />
                  <p className="text-sm font-bold tracking-wider uppercase text-white drop-shadow-md">
                    Latest Win
                  </p>
                  <p className="mt-1 text-4xl font-black text-white drop-shadow-lg">
                    ₹{lastWin.payout.toFixed(2)}
                  </p>
                  {lastWin.amount > 0 && (
                    <p className="mt-1 text-base font-bold text-white/90">
                      {(lastWin.payout / lastWin.amount || 0).toFixed(1)}x
                    </p>
                  )}
                  <p className="mt-2 text-xs text-white/80">
                    Slot #{lastWin.slotNumber ?? "-"}
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
                  min="10"
                  max="500"
                  step="10"
                  placeholder="10"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Minimum: 10 coins • Maximum: 500 coins
                </p>
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
                  loading ||
                  !selectedIcon ||
                  Number.parseFloat(betAmount) < 10 ||
                  Number.parseFloat(betAmount) > 500
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

        {/* Refer & Earn - Below Prediction Table */}
        <CardContent className="border-t border-slate-700 pt-6 mt-6">
          <CardTitle className="text-white mb-4">Refer & Earn</CardTitle>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400 mb-1">Your Referral Code</p>
              <p className="text-2xl font-bold text-blue-400">
                {referralLoading
                  ? "Loading..."
                  : referralInfo.referralCode || "N/A"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Share this code with friends to earn rewards
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
          </div>
        </CardContent>
      </Card>

      {/* My Betting History */}
      <Card className="border-slate-700 bg-slate-800 mx-4 mt-4">
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

      {/* Previous 10 Slots History */}
      {previousSlotsHistory.length > 0 && (
        <Card className="border-slate-700 bg-slate-800 mx-4 mt-4">
          <CardHeader>
            <CardTitle className="text-white">
              Previous 10 Slots History
            </CardTitle>
            <CardDescription className="text-slate-400">
              View results of the last 10 completed slots, whether you
              participated or not
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {previousSlotsHistory.map((item, idx) => {
                const slot = item.slot;
                const iconData = ICONS.find((i) => i.id === slot.winningIcon);
                const IconComponent = iconData?.Icon || Trophy;
                const totalUserBetAmount = item.userBets.reduce(
                  (sum, b) => sum + b.amount,
                  0
                );
                const winningBets = item.userBets.filter(
                  (b: any) => b.icon === slot.winningIcon
                );
                const totalPayout = winningBets.reduce(
                  (sum: number, b: any) => sum + (b.payout || 0),
                  0
                );

                return (
                  <div
                    key={slot.id || idx}
                    className="p-4 bg-slate-700 rounded-lg border border-slate-600"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold text-white">
                          Slot #{slot.slotNumber}
                        </span>
                        <div className="flex items-center gap-2">
                          <IconComponent
                            className={`w-5 h-5 ${
                              iconData?.color || "text-yellow-500"
                            }`}
                          />
                          <span className="text-sm text-slate-400">Winner</span>
                        </div>
                      </div>
                      {item.participated ? (
                        <span className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                          Participated
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-slate-600 text-white text-xs font-semibold rounded-full">
                          Not Participated
                        </span>
                      )}
                    </div>

                    {item.participated && (
                      <div className="mt-3 pt-3 border-t border-slate-600">
                        <p className="text-sm text-slate-400 mb-2">
                          Your Bets: {item.userBets.length} bet(s) • ₹
                          {totalUserBetAmount.toFixed(2)}
                        </p>
                        {winningBets.length > 0 ? (
                          <p className="text-sm font-semibold text-green-400">
                            ✓ Won: +₹{totalPayout.toFixed(2)}
                          </p>
                        ) : (
                          <p className="text-sm font-semibold text-red-400">
                            ✗ Lost: -₹{totalUserBetAmount.toFixed(2)}
                          </p>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-slate-500 mt-2">
                      {slot.endTime
                        ? new Date(slot.endTime).toLocaleString()
                        : "Unknown date"}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wallet, Transactions, Withdrawal Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 mx-4 mb-4">
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
    </div>
  );
}
