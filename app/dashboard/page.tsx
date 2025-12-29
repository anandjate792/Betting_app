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
import {
  Wallet,
  Gamepad2,
  ArrowUpDown,
  CreditCard,
  RefreshCw,
  XIcon,
  RotateCcw,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
import { Trophy } from "lucide-react";

import { FaUmbrella, FaFootballBall } from "react-icons/fa";
import {
  GiButterfly,
  GiCow,
  GiEmptyMetalBucketHandle,
  GiKite,
} from "react-icons/gi";
import { WiDaySunny } from "react-icons/wi";
import { MdLight } from "react-icons/md";
import { GiSpinningTop } from "react-icons/gi";
import { GiRose } from "react-icons/gi";
import { GiSparrow } from "react-icons/gi";
import { GiRabbit } from "react-icons/gi";

import { betApi, predictionApi, referralApi } from "@/lib/api";
import { authApi } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster, toast } from "sonner";

const ICONS = [
  {
    id: "umbrella",
    name: "Umbrella",
    Icon: FaUmbrella,
    color: "text-blue-500",
  },
  {
    id: "football",
    name: "Football",
    Icon: FaFootballBall,
    color: "text-orange-600",
  },
  { id: "sun", name: "Sun", Icon: WiDaySunny, color: "text-yellow-400" },
  { id: "lamp", name: "Lamp", Icon: MdLight, color: "text-amber-500" },
  { id: "cow", name: "Cow", Icon: GiCow, color: "text-stone-600" },
  {
    id: "bucket",
    name: "Bucket",
    Icon: GiEmptyMetalBucketHandle,
    color: "text-cyan-500",
  },
  { id: "kite", name: "Kite", Icon: GiKite, color: "text-red-500" },
  {
    id: "spinning-top",
    name: "Spinning Top",
    Icon: GiSpinningTop,
    color: "text-indigo-500",
  },
  { id: "rose", name: "Rose", Icon: GiRose, color: "text-pink-500" },
  {
    id: "butterfly",
    name: "Butterfly",
    Icon: GiButterfly,
    color: "text-purple-500",
  },
  { id: "sparrow", name: "Sparrow", Icon: GiSparrow, color: "text-sky-600" },
  { id: "rabbit", name: "Rabbit", Icon: GiRabbit, color: "text-emerald-500" },
];

const CHIP_VALUES = [10, 20, 50, 100, 200, 500];

export default function DashboardPage() {
  const { user } = useAppStore();
  const [currentSlot, setCurrentSlot] = useState<any>(null);
  const [selectedIcon, setSelectedIcon] = useState<string>("");
  const [selectedChip, setSelectedChip] = useState<number>(20);
  const [placedBets, setPlacedBets] = useState<
    { icon: string; amount: number }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [betsByIcon, setBetsByIcon] = useState<
    Record<string, { totalBets: number; totalAmount: number }>
  >({});
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [slotLoading, setSlotLoading] = useState(true);
  const [lastWin, setLastWin] = useState<any | null>(null);
  const [lastResult, setLastResult] = useState<any | null>(null);
  const [currentSlotBets, setCurrentSlotBets] = useState<
    { icon: string; amount: number }[]
  >([]);
  const [allCurrentSlotBets, setAllCurrentSlotBets] = useState<
    Array<{ icon: string; amount: number; userId: string }>
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

  // Refs for tracking
  const checkingResultRef = useRef<boolean>(false);
  const lastCheckedSlotIdRef = useRef<string | null>(null);
  const resultPollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial data
  useEffect(() => {
    loadCurrentSlot();
    loadMyBets(true);
    loadReferralInfo();
    loadWinningHistory();
    loadPreviousSlotsHistory();

    // Setup polling for slot changes
    const slotPollInterval = setInterval(loadCurrentSlot, 15000);

    return () => {
      clearInterval(slotPollInterval);
      if (resultPollingIntervalRef.current) {
        clearInterval(resultPollingIntervalRef.current);
      }
    };
  }, []);

  // Update time remaining and check for slot end
  useEffect(() => {
    if (!currentSlot?.endTime) return;

    const updateTimer = () => {
      const now = Date.now();
      const end = new Date(currentSlot.endTime).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeRemaining("Slot Closed");
        // Start checking for results when slot ends
        if (!checkingResultRef.current) {
          startResultPolling(currentSlot.id);
        }
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);

    return () => {
      clearInterval(timerInterval);
    };
  }, [currentSlot?.endTime]);

  // Function to start polling for results
  const startResultPolling = (slotId: string) => {
    if (checkingResultRef.current || lastCheckedSlotIdRef.current === slotId) {
      return;
    }

    checkingResultRef.current = true;
    lastCheckedSlotIdRef.current = slotId;

    // Check immediately
    checkSlotResult(slotId);

    // Then poll every 3 seconds for up to 30 seconds
    let pollCount = 0;
    const maxPolls = 10; // 10 polls * 3 seconds = 30 seconds total

    resultPollingIntervalRef.current = setInterval(async () => {
      pollCount++;
      if (pollCount >= maxPolls) {
        stopResultPolling();
        return;
      }

      await checkSlotResult(slotId);
    }, 3000);
  };

  const stopResultPolling = () => {
    if (resultPollingIntervalRef.current) {
      clearInterval(resultPollingIntervalRef.current);
      resultPollingIntervalRef.current = null;
    }
    checkingResultRef.current = false;
  };

  // Load current slot
  const loadCurrentSlot = async () => {
    try {
      const slot = await predictionApi.getCurrentSlot().catch(() => null);

      // Check if slot has changed
      if (slot?.id !== currentSlot?.id) {
        // Stop previous polling if any
        stopResultPolling();
        lastCheckedSlotIdRef.current = null;
        // Clear placed bets when new slot starts
        setPlacedBets([]);
      }

      setCurrentSlot(slot);
      setBetsByIcon(slot?.betsByIcon || {});

      if (slot) {
        await loadMyCurrentSlotBet(slot.id);

        // If slot is completed, check results immediately
        if (slot.status === "completed" && !checkingResultRef.current) {
          await checkSlotResult(slot.id);
        }
      } else {
        setAllCurrentSlotBets([]);
      }
    } finally {
      setSlotLoading(false);
    }
  };

  // Check slot result - optimized
  const checkSlotResult = async (slotId: string) => {
    try {
      const slot = await predictionApi.getSlot(slotId);

      if (!slot || slot.status !== "completed" || !slot.winningIcon) {
        return;
      }

      // Check if we have bets for this slot
      const response = (await betApi.getBets(slotId, 100, 0)) as any;
      const bets = Array.isArray(response) ? response : response?.data || [];
      const userBets = bets.filter((b: any) => b.userId === user?.id);

      if (userBets.length === 0) {
        stopResultPolling();
        return;
      }

      // Calculate results
      const winningBets = userBets.filter(
        (b: any) => b.icon === slot.winningIcon
      );
      const totalBet = userBets.reduce(
        (sum: number, b: any) => sum + b.amount,
        0
      );
      const payout = winningBets.reduce(
        (sum: number, b: any) => sum + (b.payout || b.amount * 1.5),
        0
      );

      // Show result if we haven't shown it yet for this slot
      const resultKey = `${slotId}_${user?.id}`;
      const hasShownResult = localStorage.getItem(resultKey);

      if (!hasShownResult) {
        setResultPopup({
          show: true,
          type: winningBets.length > 0 ? "win" : "loss",
          slotNumber: slot.slotNumber,
          winningIcon: slot.winningIcon,
          payout,
          betAmount: totalBet,
        });
        setShowResultBanner(true);

        // Mark as shown
        localStorage.setItem(resultKey, "true");

        // Auto-hide banner after 5 seconds
        setTimeout(() => {
          setShowResultBanner(false);
        }, 5000);

        // Show toast notification
        if (winningBets.length > 0) {
          toast.success(`You won ₹${payout} on Slot #${slot.slotNumber}!`, {
            duration: 5000,
          });
        } else {
          toast.error(
            `Slot #${slot.slotNumber} completed. Better luck next time!`,
            {
              duration: 5000,
            }
          );
        }
      }

      // Update user data
      try {
        const profile = (await authApi.getProfile()) as any;
        useAppStore.setState({ user: profile });
      } catch (err) {
        console.error("Failed to update user profile:", err);
      }

      // Refresh data
      await loadMyBets(true);
      await loadWinningHistory();
      await loadPreviousSlotsHistory();

      // Stop polling since we got the result
      stopResultPolling();
    } catch (error) {
      console.error("Error checking slot result:", error);
    }
  };

  const loadMyCurrentSlotBet = async (slotId?: string) => {
    if (!slotId) {
      setCurrentSlotBets([]);
      setAllCurrentSlotBets([]);
      return;
    }
    try {
      const response = (await betApi.getBets(slotId, 100, 0)) as any;
      const betsArray = Array.isArray(response)
        ? response
        : response.data || [];
      const allBetsForSlot =
        betsArray
          ?.filter((b: any) => b.slotId === slotId)
          .map((b: any) => ({
            icon: b.icon,
            amount: b.amount,
            userId: b.userId,
          })) || [];
      setAllCurrentSlotBets(allBetsForSlot);

      const myBetsForSlot =
        allBetsForSlot
          ?.filter((b: any) => b.userId === user?.id)
          .map((b: any) => ({ icon: b.icon, amount: b.amount })) || [];
      setCurrentSlotBets(myBetsForSlot);
    } catch (error) {
      console.error("Failed to load current slot bet:", error);
      setCurrentSlotBets([]);
      setAllCurrentSlotBets([]);
    }
  };

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

        const lastCompletedBet =
          updatedBets
            .filter((b: any) => b.status === "won" || b.status === "lost")
            .sort(
              (a: any, b: any) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )[0] || null;
        setLastResult(lastCompletedBet);

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

        const lastCompletedBet =
          updatedBets
            .filter((b: any) => b.status === "won" || b.status === "lost")
            .sort(
              (a: any, b: any) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )[0] || null;
        setLastResult(lastCompletedBet);

        setBetsHasMore(response.pagination?.hasMore || false);
        setBetsSkip((prev) => (reset ? 10 : prev + 10));
      }
    } catch (error) {
      console.error("Failed to load bets:", error);
    } finally {
      setBetsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const profile = (await authApi.getProfile()) as any;
      useAppStore.setState({ user: profile });

      await loadCurrentSlot();
      await loadMyBets(true);
      await loadWinningHistory();
      await loadPreviousSlotsHistory();
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle icon click - place bet with selected chip
  const handleIconClick = (iconId: string) => {
    if (!currentSlot) {
      setError("No active slot found");
      return;
    }

    if (selectedChip < 10 || selectedChip > 500) {
      setError("Invalid chip value");
      return;
    }

    // Add bet to placed bets array
    setPlacedBets([...placedBets, { icon: iconId, amount: selectedChip }]);
    setError("");
  };

  // Undo last bet
  const handleUndo = () => {
    if (placedBets.length > 0) {
      setPlacedBets(placedBets.slice(0, -1));
    }
  };

  // Repeat last bet pattern
  const handleRepeat = () => {
    if (placedBets.length > 0) {
      setPlacedBets([...placedBets, ...placedBets]);
    } else if (currentSlotBets.length > 0) {
      // Repeat bets from the current slot if no local bets are placed yet
      setPlacedBets([...currentSlotBets]);
    }
  };

  // Clear all bets
  const handleClear = () => {
    setPlacedBets([]);
  };

  // Submit all bets to server
  const handleSubmitBets = async () => {
    if (placedBets.length === 0) {
      setError("Please place at least one bet");
      return;
    }

    if (!currentSlot) {
      setError("No active slot found");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Place each bet
      for (const bet of placedBets) {
        await betApi.placeBet(currentSlot.id, bet.icon, bet.amount);
      }

      // Clear placed bets
      setPlacedBets([]);

      // Refresh user profile and current slot
      const profile = (await authApi.getProfile()) as any;
      useAppStore.setState({ user: profile });

      await loadCurrentSlot();
      // Reload all bets for the current slot to show updated bet amounts
      if (currentSlot?.id) {
        await loadMyCurrentSlotBet(currentSlot.id);
      }

      toast.success("Bets placed successfully!");
    } catch (err: any) {
      const errorMessage = err.message || "Failed to place bets";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total bet amount from placed bets
  const getTotalBetAmount = () => {
    return placedBets.reduce((sum, bet) => sum + bet.amount, 0);
  };

  // Get bet amount for specific icon
  const getBetAmountForIcon = (iconId: string) => {
    return placedBets
      .filter((bet) => bet.icon === iconId)
      .reduce((sum, bet) => sum + bet.amount, 0);
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
      <Toaster position="top-right" richColors />

      {/* Top Stats Bar */}
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

      {/* Win/Loss Banner */}
      {showResultBanner && resultPopup.type && (
        <div className="mx-4 mt-4 animate-in slide-in-from-top duration-500">
          {resultPopup.type === "win" ? (
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-center shadow-lg animate-pulse">
              <div className="relative z-10">
                <Trophy className="w-12 h-12 mx-auto mb-2 text-white" />
                <p className="text-3xl font-black text-white mb-1">YOU WIN!</p>
                <p className="text-4xl font-black text-white">
                  +₹{resultPopup.payout?.toFixed(2)}
                </p>
                <p className="text-sm text-white/80 mt-2">
                  Slot #{resultPopup.slotNumber} • {resultPopup.winningIcon}
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
                  Slot #{resultPopup.slotNumber} • Winning Icon:{" "}
                  {resultPopup.winningIcon}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Previous Winner History */}
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

      {/* Main Prediction Game */}
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
          {lastResult &&
            (() => {
              // Calculate overall slot result
              const slotId = lastResult.slot?.id || lastResult.slotId;
              const slotNumber =
                lastResult.slot?.slotNumber || lastResult.slotNumber;

              // Get all bets for this slot
              const slotBets = myBets.filter((bet: any) => {
                const betSlotId = bet.slot?.id || bet.slotId;
                const betSlotNumber = bet.slot?.slotNumber || bet.slotNumber;
                return betSlotId === slotId || betSlotNumber === slotNumber;
              });

              // Calculate net result for the slot
              let totalBetAmount = 0;
              let totalPayout = 0;
              let hasWins = false;
              let hasLosses = false;

              slotBets.forEach((bet: any) => {
                totalBetAmount += bet.amount || 0;
                totalPayout += bet.payout || 0;
                if (bet.status === "won") hasWins = true;
                if (bet.status === "lost") hasLosses = true;
              });

              const netResult = totalPayout - totalBetAmount;
              const isOverallWin = netResult > 0;
              const hasBothWinsAndLosses = hasWins && hasLosses;

              // Show "Won" only if there are both wins and losses AND net result is positive
              const showWin = hasBothWinsAndLosses || isOverallWin;

              return (
                <div className="mb-6">
                  {showWin ? (
                    <div className="relative overflow-hidden rounded-xl border-2 border-yellow-500 bg-gradient-to-br from-yellow-500 via-orange-400 to-orange-500 shadow-xl">
                      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,_#ffffff,_transparent_60%)]" />
                      <div className="relative px-6 py-4 text-center text-slate-900">
                        <Trophy className="w-8 h-8 mx-auto mb-2 text-white" />
                        <p className="text-sm font-bold tracking-wider uppercase text-white drop-shadow-md">
                          Latest Result: Won
                        </p>
                        <p className="mt-1 text-4xl font-black text-white drop-shadow-lg">
                          +₹{netResult.toFixed(2)}
                        </p>
                        <p className="mt-2 text-xs text-white/80">
                          Slot #{slotNumber ?? "-"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative overflow-hidden rounded-xl border-2 border-red-500 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 shadow-xl">
                      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,_#ffffff,_transparent_60%)]" />
                      <div className="relative px-6 py-4 text-center">
                        <XIcon className="w-8 h-8 mx-auto mb-2 text-red-400" />
                        <p className="text-sm font-bold tracking-wider uppercase text-red-400 drop-shadow-md">
                          Latest Result: Lost
                        </p>
                        <p className="mt-1 text-4xl font-black text-red-400 drop-shadow-lg">
                          -₹{Math.abs(netResult).toFixed(2)}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">
                          Slot #{slotNumber ?? "-"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

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
            <div className="space-y-6">
              {/* Main Betting Interface */}
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Icon Grid */}
                <div className="flex-1">
                  <div className="mb-4">
                    <label className="text-sm font-bold text-yellow-300 uppercase tracking-wider flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      Click on Icon to Place Bet
                      {placedBets.length > 0 && (
                        <span className="ml-2 text-sm text-yellow-400 bg-yellow-900/50 px-2 py-1 rounded-full border border-yellow-600">
                          {placedBets.length} bet(s) placed
                        </span>
                      )}
                    </label>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {ICONS.map(({ id, name, Icon, color }) => {
                      const iconData = betsByIcon[id] || {
                        totalBets: 0,
                        totalAmount: 0,
                      };
                      const myBetAmount = getBetAmountForIcon(id);
                      const hasMyBet = myBetAmount > 0;

                      // Get all bet amounts for this icon from all users
                      const iconBets = allCurrentSlotBets
                        .filter((bet) => bet.icon === id)
                        .map((bet) => bet.amount);

                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => handleIconClick(id)}
                          className={`relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 aspect-square ${
                            selectedIcon === id
                              ? "bg-slate-700 border-blue-500 shadow-lg shadow-blue-500/20"
                              : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                          }`}
                        >
                          {hasMyBet && (
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold rounded-full min-w-[24px] h-6 flex items-center justify-center px-1 border-2 border-white shadow-lg z-10">
                              ₹{myBetAmount}
                            </div>
                          )}
                          <Icon
                            className={`w-6 h-6 sm:w-8 sm:h-8 mb-2 ${color}`}
                          />
                          <span className="text-xs font-medium text-slate-300">
                            {name}
                          </span>
                          <div className="text-[10px] mt-1 text-slate-500 flex flex-col gap-0.5">
                            <div>{iconData.totalBets} bets</div>
                            <div>{iconData.totalAmount.toFixed(0)} coins</div>
                          </div>
                          {/* Show all bet amounts on this icon */}
                          {iconBets.length > 0 && (
                            <div className="mt-1 flex flex-wrap justify-center gap-1 px-1 max-w-full">
                              {iconBets.slice(0, 4).map((amount, idx) => (
                                <span
                                  key={idx}
                                  className="text-[9px] font-bold text-yellow-300 bg-yellow-900/60 px-1.5 py-0.5 rounded-md border border-yellow-600/70 shadow-sm whitespace-nowrap"
                                  title={`Bet amount: ₹${amount}`}
                                >
                                  ₹{amount}
                                </span>
                              ))}
                              {iconBets.length > 4 && (
                                <span
                                  className="text-[9px] font-bold text-yellow-400 bg-yellow-900/40 px-1.5 py-0.5 rounded-md border border-yellow-600/50"
                                  title={`${iconBets.length - 4} more bet(s)`}
                                >
                                  +{iconBets.length - 4}
                                </span>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Middle Betting Controls */}
                <div className="flex flex-col items-center justify-center">
                  <div className="flex flex-col items-center justify-center gap-4 py-6 px-3 bg-[#3d0a1a]/40 rounded-full backdrop-blur-md border border-white/10 shadow-2xl min-h-[240px]">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-[11px] font-bold text-gray-400 tracking-tighter uppercase opacity-80">
                        UNDO
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleUndo}
                        disabled={placedBets.length === 0}
                        className="w-[52px] h-[52px] rounded-full border border-white/20 bg-black/40 hover:bg-black/60 transition-colors group"
                      >
                        <Undo2
                          className="w-7 h-7 text-gray-300 group-hover:text-white transition-colors"
                          strokeWidth={1.5}
                        />
                      </Button>
                    </div>

                    <div className="relative w-16 h-16 flex items-center justify-center my-1">
                      {/* Top Active Chip */}
                      <div className="relative z-10 w-[54px] h-[54px] rounded-full border-[3px] border-dashed border-white bg-[#4caf50] flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                        <div className="w-[38px] h-[38px] rounded-full border-2 border-white/20 flex items-center justify-center bg-black/10">
                          <span className="text-white font-black text-lg tracking-tight drop-shadow-md">
                            {selectedChip}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRepeat}
                        className="w-[52px] h-[52px] rounded-full border border-white/20 bg-black/40 hover:bg-black/60 transition-colors group"
                      >
                        <RotateCcw
                          className="w-7 h-7 text-gray-300 group-hover:text-white transition-colors"
                          strokeWidth={1.5}
                        />
                      </Button>
                      <span className="text-[11px] font-bold text-gray-400 tracking-tighter uppercase opacity-80">
                        REPEAT
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Chip Selection - Only visible on larger screens */}
                <div className="hidden lg:block flex-shrink-0">
                  <label className="text-sm font-bold text-yellow-300 uppercase tracking-wider mb-4 block text-center">
                    Select Chip
                  </label>
                  <div className="flex flex-col gap-3">
                    {CHIP_VALUES.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSelectedChip(value)}
                        className={`relative w-16 h-16 rounded-full font-black text-base transition-all transform hover:scale-110 shadow-2xl ${
                          selectedChip === value
                            ? "bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-slate-900 scale-110 shadow-yellow-500/80 border-4 border-yellow-200"
                            : "bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white hover:from-green-500 hover:to-green-700 border-4 border-white"
                        }`}
                      >
                        <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
                        <div className="absolute inset-2 rounded-full border-2 border-white/30"></div>
                        <span className="relative z-10 text-xs">₹{value}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile Chip Selection - Visible only on mobile */}
              <div className="lg:hidden">
                <label className="text-sm font-bold text-yellow-300 uppercase tracking-wider mb-4 block text-center">
                  Select Chip Value
                </label>
                <div className="flex flex-wrap gap-3 justify-center">
                  {CHIP_VALUES.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelectedChip(value)}
                      className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full font-black text-base transition-all transform hover:scale-110 shadow-2xl ${
                        selectedChip === value
                          ? "bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-slate-900 scale-110 shadow-yellow-500/80 border-4 border-yellow-200"
                          : "bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white hover:from-green-500 hover:to-green-700 border-4 border-white"
                      }`}
                    >
                      <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
                      <div className="absolute inset-2 rounded-full border-2 border-white/30"></div>
                      <span className="relative z-10 text-xs">₹{value}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Bet Display */}
              {placedBets.length > 0 && (
                <div className="mt-6 bg-slate-900/60 rounded-xl p-4 border-2 border-yellow-700/50 max-w-2xl mx-auto">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-center sm:text-left">
                      <p className="text-sm text-yellow-400 font-semibold">
                        Total Bet Amount:
                      </p>
                      <p className="text-2xl sm:text-3xl font-black text-white">
                        ₹{getTotalBetAmount()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleClear}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg border-2 border-red-800 shadow-lg transition-all"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 bg-red-900/50 border-2 border-red-500 rounded-lg p-3 flex items-center gap-2 max-w-2xl mx-auto">
                  <XIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-300 font-semibold">{error}</p>
                </div>
              )}

              {/* Submit Bets Button */}
              <div className="max-w-2xl mx-auto">
                <Button
                  type="button"
                  onClick={handleSubmitBets}
                  disabled={loading || placedBets.length === 0}
                  className="w-full mt-6 bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-500 hover:via-red-600 hover:to-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed font-black text-xl sm:text-2xl py-4 sm:py-6 rounded-2xl border-4 border-red-900 shadow-2xl shadow-red-900/50 uppercase tracking-widest transform hover:scale-[1.02] transition-all relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <Spinner className="w-5 h-5 sm:w-6 sm:h-6" />
                      Placing Bets...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-3">
                      <Trophy className="w-5 h-5 sm:w-7 sm:h-7" />
                      Confirm Bets
                      {placedBets.length > 0 && (
                        <span className="ml-2 text-yellow-300">
                          ({placedBets.length} bet
                          {placedBets.length > 1 ? "s" : ""})
                        </span>
                      )}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>

        {/* Refer & Earn */}
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
                  {(() => {
                    // Group bets by slot
                    const betsBySlot = new Map();
                    myBets.forEach((bet) => {
                      const slot = bet.slot;
                      const slotId =
                        slot?.id || bet.slotId || `slot-${bet.slotNumber}`;
                      const slotNumber = slot?.slotNumber || bet.slotNumber;

                      if (!betsBySlot.has(slotId)) {
                        betsBySlot.set(slotId, {
                          slotId,
                          slotNumber,
                          slot,
                          bets: [],
                          totalBetAmount: 0,
                          totalPayout: 0,
                          netResult: 0,
                        });
                      }

                      const slotGroup = betsBySlot.get(slotId);
                      slotGroup.bets.push(bet);
                      slotGroup.totalBetAmount += bet.amount || 0;
                      slotGroup.totalPayout += bet.payout || 0;
                    });

                    // Calculate net result for each slot
                    betsBySlot.forEach((slotGroup) => {
                      slotGroup.netResult =
                        slotGroup.totalPayout - slotGroup.totalBetAmount;
                    });

                    // Convert to array and sort by slot number (newest first)
                    const slotGroups = Array.from(betsBySlot.values()).sort(
                      (a, b) => (b.slotNumber || 0) - (a.slotNumber || 0)
                    );

                    return slotGroups.map((slotGroup) => {
                      const {
                        slot,
                        slotNumber,
                        bets,
                        totalBetAmount,
                        totalPayout,
                        netResult,
                      } = slotGroup;
                      const isCompleted =
                        slot?.status === "completed" ||
                        slot?.status === "cancelled";
                      const isCancelled = slot?.status === "cancelled";
                      const hasPending = bets.some(
                        (b: any) => !b.status || b.status === "pending"
                      );

                      // Determine overall slot status
                      let overallStatus = "pending";
                      if (isCancelled) {
                        overallStatus = "cancelled";
                      } else if (isCompleted && !hasPending) {
                        overallStatus =
                          netResult > 0
                            ? "won"
                            : netResult < 0
                            ? "lost"
                            : "draw";
                      }

                      return (
                        <div
                          key={slotGroup.slotId}
                          className="p-4 bg-slate-700 rounded-lg border border-slate-600"
                        >
                          {/* Slot Header with Overall Result */}
                          <div className="flex justify-between items-start mb-3 pb-3 border-b border-slate-600">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-base font-bold text-white">
                                  Slot #{slotNumber || "N/A"}
                                </p>
                                {isCompleted &&
                                  slot?.winningIcon &&
                                  !isCancelled && (
                                    <>
                                      <span className="text-sm text-slate-400">
                                        •
                                      </span>
                                      <span className="text-xs text-slate-400">
                                        Winner:{" "}
                                        <span className="font-semibold text-green-300">
                                          {slot.winningIcon}
                                        </span>
                                      </span>
                                    </>
                                  )}
                              </div>
                              <p className="text-xs text-slate-400">
                                {slot?.startTime
                                  ? new Date(slot.startTime).toLocaleString()
                                  : bets[0]?.createdAt
                                  ? new Date(bets[0].createdAt).toLocaleString()
                                  : "Unknown date"}
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              {overallStatus === "won" && (
                                <>
                                  <p className="text-lg font-bold text-green-400">
                                    +₹{netResult.toFixed(2)}
                                  </p>
                                  <span className="text-xs px-2 py-1 rounded-full bg-green-600 text-white inline-block mt-1">
                                    Won
                                  </span>
                                </>
                              )}
                              {overallStatus === "lost" && (
                                <>
                                  <p className="text-lg font-bold text-red-400">
                                    -₹{Math.abs(netResult).toFixed(2)}
                                  </p>
                                  <span className="text-xs px-2 py-1 rounded-full bg-red-600 text-white inline-block mt-1">
                                    Lost
                                  </span>
                                </>
                              )}
                              {overallStatus === "cancelled" && (
                                <>
                                  <p className="text-sm text-slate-400">
                                    Refunded
                                  </p>
                                  <span className="text-xs px-2 py-1 rounded-full bg-gray-600 text-white inline-block mt-1">
                                    Cancelled
                                  </span>
                                </>
                              )}
                              {overallStatus === "pending" && (
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

                          {/* Individual Bets */}
                          <div className="space-y-2">
                            {bets.map((bet: any) => {
                              const isWinner = slot?.winningIcon === bet.icon;
                              let betStatus = bet.status || "pending";
                              if (!bet.status && isCompleted && !isCancelled) {
                                betStatus = isWinner ? "won" : "lost";
                              }

                              return (
                                <div
                                  key={bet.id}
                                  className="flex justify-between items-center p-2 bg-slate-800 rounded border border-slate-600"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-blue-300">
                                      {bet.icon}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                      Bet: ₹{bet.amount.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    {betStatus === "won" && (
                                      <span className="text-sm font-semibold text-green-400">
                                        +₹{(bet.payout || 0).toFixed(2)}
                                      </span>
                                    )}
                                    {betStatus === "lost" && (
                                      <span className="text-sm font-semibold text-red-400">
                                        -₹{bet.amount.toFixed(2)}
                                      </span>
                                    )}
                                    {betStatus === "pending" && (
                                      <span className="text-xs text-slate-400">
                                        Pending
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()}
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
              View results of the last 10 completed slots
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {previousSlotsHistory.map((item, idx) => {
                const slot = item.slot;
                const winningIcon = slot?.winningIcon;
                const iconData = winningIcon
                  ? ICONS.find((i) => i.id === winningIcon)
                  : null;
                const IconComponent = iconData?.Icon || Trophy;
                const totalUserBetAmount = item.userBets.reduce(
                  (sum, b) => sum + b.amount,
                  0
                );
                const winningBets = item.userBets.filter(
                  (b: any) => b.icon === winningIcon
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
                        {winningIcon && (
                          <div className="flex items-center gap-2">
                            <IconComponent
                              className={`w-5 h-5 ${
                                iconData?.color || "text-yellow-500"
                              }`}
                            />
                            <span className="text-sm text-slate-400">
                              Winner: {winningIcon}
                            </span>
                          </div>
                        )}
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

      {/* Quick Actions */}
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
