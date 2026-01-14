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
import Image from "next/image";

import { betApi, predictionApi, referralApi } from "@/lib/api";
import { authApi } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster, toast } from "sonner";
import { playSound } from "@/lib/sounds";

const ICONS = [
  {
    id: "umbrella",
    name: "Umbrella",
    image: "/umbrella.webp",
  },
  {
    id: "football",
    name: "Football",
    image: "/football.webp",
  },
  { id: "sun", name: "Sun", image: "/sun.webp" },
  { id: "lamp", name: "Lamp", image: "/lamp.webp" },
  { id: "cow", name: "Cow", image: "/cow.webp" },
  {
    id: "bucket",
    name: "Bucket",
    image: "/bucket.webp",
  },
  { id: "kite", name: "Kite", image: "/kite.webp" },
  {
    id: "spinning-top",
    name: "Spinning Top",
    image: "/spinning-top.webp",
  },
  { id: "rose", name: "Rose", image: "/rose.webp" },
  {
    id: "butterfly",
    name: "Butterfly",
    image: "/butterfly.webp",
  },
  { id: "sparrow", name: "Sparrow", image: "/sparrow.webp" },
  { id: "rabbit", name: "Rabbit", image: "/rabbit.webp" },
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

        // Clear placed bets when slot ends
        setPlacedBets([]);

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
        // Only clear placed bets if we're moving from a completed/closed slot to a new one
        const shouldClearBets =
          currentSlot &&
          (currentSlot.status === "completed" ||
            currentSlot.status === "closed" ||
            currentSlot.status === "cancelled") &&
          slot &&
          slot.status === "active";

        if (shouldClearBets) {
          // Clear placed bets when new slot starts (only when previous slot is done)
          setPlacedBets([]);
        }

        // Stop previous polling if any
        stopResultPolling();
        lastCheckedSlotIdRef.current = null;
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
        const isWin = winningBets.length > 0;
        
        setResultPopup({
          show: true,
          type: isWin ? "win" : "loss",
          slotNumber: slot.slotNumber,
          winningIcon: slot.winningIcon,
          payout,
          betAmount: totalBet,
        });
        setShowResultBanner(true);

        // Play sound effect
        playSound(isWin ? "win" : "lose");

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

    // Check if slot is still active
    const now = Date.now();
    const end = new Date(currentSlot.endTime).getTime();
    if (now >= end) {
      setError("Slot has ended. Bets are no longer accepted.");
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

    // Check if slot is still active
    const now = Date.now();
    const end = new Date(currentSlot.endTime).getTime();
    if (now >= end) {
      setError("Slot has ended. Bets are no longer accepted.");
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-slate-800 pb-6">
      <Toaster position="top-right" richColors />

      {/* Top Stats Bar */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 px-3 py-2">
        <div className="flex justify-between items-center max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] text-slate-400">Balance</p>
              <p className="text-base font-bold text-green-400">
                ₹{user?.walletBalance?.toFixed(2) || "0.00"}
              </p>
            </div>
            {lastWin && (
              <div className="border-l border-slate-600 pl-3">
                <p className="text-[10px] text-slate-400">Last Win</p>
                <p className="text-base font-bold text-yellow-400">
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
        <div className="mx-auto mt-3 max-w-5xl animate-in slide-in-from-top duration-500 px-3">
          {resultPopup.type === "win" ? (
            <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 p-4 text-center shadow-lg animate-pulse">
              <div className="relative z-10">
                <Trophy className="w-8 h-8 mx-auto mb-1 text-white" />
                <p className="text-xl font-black text-white mb-1">YOU WIN!</p>
                <p className="text-3xl font-black text-white">
                  +₹{resultPopup.payout?.toFixed(2)}
                </p>
                <p className="text-xs text-white/80 mt-1">
                  Slot #{resultPopup.slotNumber} • {resultPopup.winningIcon}
                </p>
              </div>
              <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" />
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-slate-700 to-slate-800 p-4 text-center shadow-lg border-2 border-red-500">
              <div className="relative z-10">
                <XIcon className="w-8 h-8 mx-auto mb-1 text-red-400" />
                <p className="text-xl font-black text-white mb-1">LOST</p>
                <p className="text-2xl font-black text-red-400">
                  -₹{resultPopup.betAmount?.toFixed(2)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
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
        <Card className="border-slate-700 bg-slate-800 mt-3 mx-auto max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-7xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-white text-sm">
              Last 10 Results
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 px-4 pb-4">
            <div className="flex gap-1.5 lg:gap-3 xl:gap-4 2xl:gap-5 overflow-x-auto pb-2 scrollbar-hide">
              {winningHistory.map((item, idx) => {
                const iconData = ICONS.find((i) => i.id === item.winningIcon);
                return (
                  <div
                    key={idx}
                    className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 lg:w-20 lg:h-20 xl:w-24 xl:h-24 2xl:w-28 2xl:h-28 bg-slate-700 rounded-lg border-2 border-slate-600 hover:border-blue-400 transition-colors"
                  >
                    {iconData ? (
                      <Image
                        src={iconData.image}
                        alt={iconData.name}
                        width={20}
                        height={20}
                        className="w-5 h-5 lg:w-8 lg:h-8 xl:w-12 xl:h-12 2xl:w-16 2xl:h-16"
                      />
                    ) : (
                      <Trophy className="w-5 h-5 lg:w-8 lg:h-8 xl:w-12 xl:h-12 2xl:w-16 2xl:h-16 text-yellow-500" />
                    )}
                    <span className="text-[9px] lg:text-[10px] xl:text-xs 2xl:text-sm text-slate-400 mt-0.5 lg:mt-1 xl:mt-1.5">
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
      <Card className="border-slate-700 bg-slate-800 mx-auto mt-3 max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-7xl">
        <CardHeader className="px-4 py-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <Gamepad2 className="w-4 h-4" />
                Pop The Picture
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs mt-0.5">
                {currentSlot
                  ? `Slot #${currentSlot.slotNumber} • Time Remaining: ${timeRemaining}`
                  : "No active slot"}
              </CardDescription>
            </div>
            {currentSlot && (
              <div className="text-right">
                <p className="text-xs text-slate-400">Total Bets</p>
                <p className="text-lg font-bold text-blue-400">
                  {currentSlot.totalBets}
                </p>
              </div>
            )}
          </div>
        </CardHeader>
      <CardContent className="px-4">
  {lastResult &&
    (() => {
      // Calculate overall slot result
      const slotId = lastResult.slot?.id || lastResult.slotId;
      const slotNumber = lastResult.slot?.slotNumber || lastResult.slotNumber;
      
      // Get the winning icon from the slot
      const winningIcon = lastResult.slot?.winningIcon || lastResult.winningIcon;
      
      // Find the icon data
      const winningIconData = ICONS.find(icon => icon.id === winningIcon);

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
      let netResult;
       if(hasWins){
      netResult = totalPayout;
       }
       else{
      netResult = totalPayout - totalBetAmount;
       }
      const isOverallWin = netResult > 0;
      const hasBothWinsAndLosses = hasWins && hasLosses;

      // Show "Won" only if there are both wins and losses AND net result is positive
      const showWin = hasBothWinsAndLosses || isOverallWin;

      return (
        <div className="mb-4">
          {showWin ? (
            <div className="relative overflow-hidden rounded-lg border-2 border-yellow-500 bg-gradient-to-br from-yellow-500 via-orange-400 to-orange-500 shadow-xl">
              <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,_#ffffff,_transparent_60%)]" />
              <div className="relative px-4 py-3 text-center text-slate-900">
                {/* Show winning icon image if available, otherwise show trophy */}
                {winningIconData ? (
                  <div className="relative w-16 h-16 mx-auto mb-1 flex items-center justify-center">
                    <Image
                      src={winningIconData.image}
                      alt={winningIconData.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 object-contain drop-shadow-lg"
                    />
                    <div className="absolute inset-0 bg-yellow-400 rounded-full blur-md opacity-50" />
                  </div>
                ) : (
                  <Trophy className="w-6 h-6 mx-auto mb-1 text-white" />
                )}
                <p className="text-xs font-bold tracking-wider uppercase text-white drop-shadow-md">
                  Latest Result: Won
                </p>
                <p className="mt-1 text-2xl font-black text-white drop-shadow-lg">
                  +₹{netResult.toFixed(2)}
                </p>
                <p className="mt-1 text-[10px] text-white/80">
                  Slot #{slotNumber ?? "-"}
                  {winningIcon && ` • ${winningIcon}`}
                </p>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-lg border-2 border-red-500 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 shadow-xl">
              <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,_#ffffff,_transparent_60%)]" />
              <div className="relative px-4 py-3 text-center">
                <XIcon className="w-6 h-6 mx-auto mb-1 text-red-400" />
                <p className="text-xs font-bold tracking-wider uppercase text-red-400 drop-shadow-md">
                  Latest Result: Lost
                </p>
                <p className="mt-1 text-2xl font-black text-red-400 drop-shadow-lg">
                  -₹{Math.abs(netResult).toFixed(2)}
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  Slot #{slotNumber ?? "-"}
                  {winningIcon && ` • Winning Icon: ${winningIcon}`}
                </p>
              </div>
            </div>
          )}
        </div>
      );
    })()}

          {slotLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="w-5 h-5 text-blue-400" />
              <p className="ml-2 text-sm text-slate-400">Loading slot...</p>
            </div>
          ) : !currentSlot ? (
            <div className="text-center py-6">
              <p className="text-sm text-slate-400">
                No active slot. Waiting for the next prediction slot to be
                created.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Compact Single Screen Betting Interface */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-3 lg:p-5 xl:p-6 2xl:p-8 border border-slate-700">
                {/* Icon Grid - Compact */}
                <div className="grid grid-cols-4 gap-1.5 lg:gap-3 xl:gap-4 2xl:gap-6 mb-3 lg:mb-4 xl:mb-5">
                  {ICONS.map(({ id, name, image }) => {
                    const localBetAmount = getBetAmountForIcon(id);
                    const confirmedBetAmount = currentSlotBets
                      .filter((bet) => bet.icon === id)
                      .reduce((sum, bet) => sum + bet.amount, 0);
                    const hasMyBet = localBetAmount > 0 || confirmedBetAmount > 0;
                    const totalBetAmount = localBetAmount + confirmedBetAmount;

                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleIconClick(id)}
                        className={`relative flex flex-col items-center justify-center p-2 lg:p-3 xl:p-4 2xl:p-5 rounded-lg border transition-all aspect-square ${
                          hasMyBet
                            ? "bg-green-600/30 border-green-500"
                            : "bg-slate-700/50 border-slate-600 hover:border-slate-500"
                        }`}
                      >
                        {(localBetAmount > 0 || confirmedBetAmount > 0) && (
                          <>
                            <div className="absolute -top-0.5 -right-0.5 lg:-top-1 lg:-right-1 xl:-top-1.5 xl:-right-1.5 2xl:-top-2 2xl:-right-2 bg-green-600 text-white text-[8px] lg:text-[9px] xl:text-[10px] 2xl:text-xs font-bold rounded-full w-3 h-3 lg:w-4 lg:h-4 xl:w-5 xl:h-5 2xl:w-6 2xl:h-6 flex items-center justify-center border-2 border-white shadow-lg z-10">
                              {totalBetAmount}
                            </div>
                            <div className="absolute top-1 left-1 bg-green-600 text-white text-[7px] lg:text-[8px] xl:text-[9px] 2xl:text-[10px] px-1.5 lg:px-2 xl:px-2.5 2xl:px-3 py-0.5 lg:py-1 xl:py-1.5 2xl:py-2 rounded-full font-semibold shadow-lg z-10">
                              BETTED
                            </div>
                          </>
                        )}
                        <Image
                          src={image}
                          alt={name}
                          width={64}
                          height={64}
                          className="w-10 h-10 lg:w-12 lg:h-12 xl:w-16 xl:h-16 2xl:w-20 2xl:h-20 object-contain"
                        />
                        <span className="text-[9px] lg:text-[10px] xl:text-sm 2xl:text-base text-slate-300 mt-1 lg:mt-1 xl:mt-1.5 2xl:mt-2 text-center leading-tight">
                          {name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Chip Selection - Horizontal */}
                <div className="flex items-center justify-center gap-1.5 lg:gap-2.5 xl:gap-3 2xl:gap-4 mb-3 lg:mb-4 xl:mb-5 flex-wrap">
                  {CHIP_VALUES.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelectedChip(value)}
                      className={`relative w-11 h-11 lg:w-14 lg:h-14 xl:w-16 xl:h-16 2xl:w-20 2xl:h-20 rounded-full font-bold text-xs lg:text-sm xl:text-base 2xl:text-lg transition-all ${
                        selectedChip === value
                          ? "bg-gradient-to-br from-yellow-300 to-yellow-500 text-slate-900 scale-110 border-2 border-yellow-200 shadow-lg shadow-yellow-500/50"
                          : "bg-gradient-to-br from-green-600 to-green-800 text-white border-2 border-white/50"
                      }`}
                    >
                      <div className="absolute inset-0 rounded-full border-2 border-white/20"></div>
                      <span className="relative z-10">₹{value}</span>
                    </button>
                  ))}
                </div>

                {/* Control Buttons - Horizontal */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUndo}
                    disabled={placedBets.length === 0}
                    className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-xs h-8"
                  >
                    <Undo2 className="w-3 h-3 mr-1" />
                    Undo
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRepeat}
                    className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-xs h-8"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Repeat
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClear}
                    disabled={placedBets.length === 0}
                    className="flex-1 bg-red-700 border-red-600 text-white hover:bg-red-600 text-xs h-8"
                  >
                    <XIcon className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                </div>

                {/* Total and Submit */}
                {placedBets.length > 0 && (
                  <div className="bg-slate-700/50 rounded-lg p-2 mb-2 border border-slate-600">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-300">
                        Total Bets:
                      </span>
                      <span className="text-base font-bold text-yellow-400">
                        ₹{getTotalBetAmount()}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {placedBets.length} bet(s) placed
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-900/50 border border-red-500 rounded-lg p-1.5 flex items-center gap-1.5 mb-2">
                    <XIcon className="w-3 h-3 text-red-400 flex-shrink-0" />
                    <p className="text-[10px] text-red-300">{error}</p>
                  </div>
                )}

                <Button
                  type="button"
                  onClick={handleSubmitBets}
                  disabled={
                    loading ||
                    placedBets.length === 0 ||
                    !currentSlot ||
                    Date.now() >= new Date(currentSlot.endTime).getTime()
                  }
                  className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white disabled:opacity-50 font-bold text-sm py-2.5 rounded-lg border-2 border-red-900 shadow-lg uppercase"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Spinner className="w-4 h-4" />
                      Placing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <Trophy className="w-4 h-4" />
                      Confirm Bets
                    </span>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>

        {/* Refer & Earn */}
        <CardContent className="border-t border-slate-700 pt-4 mt-4 px-4 pb-4">
          <CardTitle className="text-white mb-3 text-sm">
            Refer & Earn
          </CardTitle>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-xs text-slate-400 mb-1">Your Referral Code</p>
              <p className="text-lg font-bold text-blue-400">
                {referralLoading
                  ? "Loading..."
                  : referralInfo.referralCode || "N/A"}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Share this code with friends to earn rewards
              </p>
            </div>
            <div className="text-right space-y-0.5">
              <p className="text-xs text-slate-400">
                Total Referrals:{" "}
                <span className="font-semibold text-white">
                  {referralInfo.referralCount ?? 0}
                </span>
              </p>
              <p className="text-xs text-slate-400">
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
      <Card className="border-slate-700 bg-slate-800 mx-auto mt-3 max-w-5xl">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-white text-base">
            My Betting History
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            View all your bets and their results
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4">
          {betsLoading && myBets.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="w-5 h-5 text-blue-400" />
              <p className="ml-2 text-sm text-slate-400">
                Loading betting history...
              </p>
            </div>
          ) : myBets.length === 0 ? (
            <p className="text-slate-400 text-center py-6 text-sm">
              No betting history found
            </p>
          ) : (
            <>
              <ScrollArea className="h-[400px]">
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
                            {iconData ? (
                              <Image
                                src={iconData.image}
                                alt={iconData.name}
                                width={20}
                                height={20}
                                className="w-5 h-5 lg:w-7 lg:h-7 xl:w-9 xl:h-9 2xl:w-12 2xl:h-12"
                              />
                            ) : (
                              <Trophy className="w-5 h-5 lg:w-7 lg:h-7 xl:w-9 xl:h-9 2xl:w-12 2xl:h-12 text-yellow-500" />
                            )}
                            <span className="text-sm lg:text-base xl:text-lg 2xl:text-xl text-slate-400">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 mx-auto mb-4 max-w-5xl px-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href}>
              <Card className="border-slate-700 bg-slate-800 hover:bg-slate-750 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-6 h-6 ${action.color}`} />
                    <div>
                      <h3 className="font-semibold text-white text-sm">
                        {action.label}
                      </h3>
                      <p className="text-xs text-slate-400">
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
