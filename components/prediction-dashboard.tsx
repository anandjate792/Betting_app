"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { authApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { Upload } from "lucide-react";
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
import {
  betApi,
  predictionApi,
  transactionApi,
  withdrawalApi,
} from "@/lib/api";

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

export default function PredictionDashboard() {
  const { user, logout, addTransaction, transactions, fetchTransactions } =
    useAppStore();
  const { toast } = useToast();
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
  const [hasBetCurrentSlot, setHasBetCurrentSlot] = useState(false);
  const [currentSlotBet, setCurrentSlotBet] = useState<{
    icon: string;
    amount: number;
  } | null>(null);
  const [currentSlotBets, setCurrentSlotBets] = useState<
    { icon: string; amount: number }[]
  >([]);
  const [refreshing, setRefreshing] = useState(false);
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
  const [slotLoading, setSlotLoading] = useState(true);
  const [betsLoading, setBetsLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [betsHasMore, setBetsHasMore] = useState(true);
  const [transactionsHasMore, setTransactionsHasMore] = useState(true);
  const [withdrawalsHasMore, setWithdrawalsHasMore] = useState(true);
  const [betsSkip, setBetsSkip] = useState(0);
  const [transactionsSkip, setTransactionsSkip] = useState(0);
  const [withdrawalsSkip, setWithdrawalsSkip] = useState(0);
  const betsScrollRef = useRef<HTMLDivElement>(null);
  const transactionsScrollRef = useRef<HTMLDivElement>(null);
  const withdrawalsScrollRef = useRef<HTMLDivElement>(null);
  const [processedBetIds, setProcessedBetIds] = useState<Set<string>>(new Set());
  const [slotWaitTime, setSlotWaitTime] = useState<number | null>(null);

  const handleBetsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const bottom =
      target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    if (bottom && betsHasMore && !betsLoading) {
      loadMyBets(false);
    }
  };

  const handleTransactionsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const bottom =
      target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    if (bottom && transactionsHasMore && !transactionsLoading) {
      loadTransactions(false);
    }
  };

  const handleWithdrawalsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const bottom =
      target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    if (bottom && withdrawalsHasMore && !withdrawalsLoading) {
      loadWithdrawals(false);
    }
  };

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

  // Load bets when current slot changes to catch results immediately
  useEffect(() => {
    if (currentSlot) {
      loadMyBets(true);
    }
  }, [currentSlot?.status]);

  // Handle waiting period countdown
  useEffect(() => {
    if (slotWaitTime !== null && slotWaitTime > 0) {
      const timer = setTimeout(() => {
        setSlotWaitTime(prev => prev !== null ? prev - 1 : null);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (slotWaitTime === 0) {
      // Time's up, try loading slot again
      loadCurrentSlot();
    }
  }, [slotWaitTime]);

  const loadCurrentSlot = async () => {
    setSlotLoading(true);
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
        setSlotWaitTime(null);
      } else {
        setCurrentSlot(null);
        // Check if it's a waiting period error
        const response = await fetch('/api/prediction-slots?current=true');
        const data = await response.json();
        if (response.status === 404 && data.waitTime !== undefined) {
          setSlotWaitTime(data.waitTime);
        } else {
          setSlotWaitTime(null);
        }
      }
      await loadMyCurrentSlotBet(slot?.id);
    } catch (error: any) {
      setCurrentSlot(null);
      setSlotWaitTime(null);
    } finally {
      setSlotLoading(false);
    }
  };

  const loadMyBets = async (reset = false) => {
    if (reset) {
      setBetsSkip(0);
      setMyBets([]);
      setBetsHasMore(true);
    }
    if (!betsHasMore && !reset) return;

    setBetsLoading(true);
    try {
      const response = await betApi.getBets(
        undefined,
        10,
        reset ? 0 : betsSkip
      );
      // Handle both old format (array) and new format (paginated)
      if (Array.isArray(response)) {
        setMyBets(reset ? response : [...myBets, ...response]);
        setBetsHasMore(false);
      } else {
        const newBets = response.data || [];
        setMyBets((prev) => (reset ? newBets : [...prev, ...newBets]));
        setBetsHasMore(response.pagination?.hasMore || false);
        setBetsSkip((prev) => (reset ? 10 : prev + 10));
      }
    } catch (error) {
      console.error("Failed to load bets:", error);
    } finally {
      setBetsLoading(false);
    }
  };

  const loadMyCurrentSlotBet = async (slotId?: string) => {
    if (!slotId) {
      setHasBetCurrentSlot(false);
      setCurrentSlotBet(null);
      setCurrentSlotBets([]);
      return;
    }
    try {
      const response = await betApi.getBets(slotId, 10, 0);
      // Handle both old format (array) and new format (paginated)
      const betsArray = Array.isArray(response)
        ? response
        : response.data || [];
      const myBetsForSlot = betsArray.filter((b: any) => b.userId === user?.id);
      setHasBetCurrentSlot(myBetsForSlot.length > 0);
      
      // Set all bets for current slot
      setCurrentSlotBets(
        myBetsForSlot.map((b: any) => ({ icon: b.icon, amount: b.amount }))
      );
      
      // Keep backward compatibility - set first bet as currentSlotBet
      setCurrentSlotBet(
        myBetsForSlot.length > 0 
          ? { icon: myBetsForSlot[0].icon, amount: myBetsForSlot[0].amount }
          : null
      );
    } catch (error) {
      console.error("Failed to load current slot bet:", error);
      setCurrentSlotBets([]);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCurrentSlot();
    await loadMyBets(true);
    await loadTransactions(true);
    await loadWithdrawals(true);
    setRefreshing(false);
  };

  useEffect(() => {
    if (activeTab === "dashboard") {
      loadMyBets(true);
      loadTransactions(true);
      loadWithdrawals(true);
    }
  }, [activeTab]);

  // Check for bet results and show notifications
  useEffect(() => {
    myBets.forEach((bet) => {
      // Only process bets that haven't been processed yet
      if (!processedBetIds.has(bet.id) && (bet.status === "won" || bet.status === "lost")) {
        if (bet.status === "won") {
          toast({
            title: "🎉 Congratulations! You Won!",
            description: `You won ₹${bet.payout?.toFixed(2) || "0.00"} on Slot #${bet.slotNumber || "N/A"} with ${bet.icon}`,
            variant: "default",
          });
        } else if (bet.status === "lost") {
          toast({
            title: "😔 You Lost",
            description: `Your bet on ${bet.icon} for Slot #${bet.slotNumber || "N/A"} was not the winning icon`,
            variant: "destructive",
          });
        }
        
        // Mark this bet as processed
        setProcessedBetIds(prev => new Set([...prev, bet.id]));
      }
    });
  }, [myBets, processedBetIds, toast]);

  const loadTransactions = async (reset = false) => {
    if (reset) {
      setTransactionsSkip(0);
      setTransactionsHasMore(true);
    }
    if (!transactionsHasMore && !reset) return;

    setTransactionsLoading(true);
    try {
      const response = await fetchTransactions(
        10,
        reset ? 0 : transactionsSkip
      );
      if (response?.pagination) {
        setTransactionsHasMore(response.pagination.hasMore || false);
        setTransactionsSkip((prev) => (reset ? 10 : prev + 10));
      } else {
        setTransactionsHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const loadWithdrawals = async (reset = false) => {
    if (reset) {
      setWithdrawalsSkip(0);
      setMyWithdrawals([]);
      setWithdrawalsHasMore(true);
    }
    if (!withdrawalsHasMore && !reset) return;

    setWithdrawalsLoading(true);
    try {
      const response = await withdrawalApi.getWithdrawals(
        10,
        reset ? 0 : withdrawalsSkip
      );
      // Handle both old format (array) and new format (paginated)
      if (Array.isArray(response)) {
        setMyWithdrawals(reset ? response : [...myWithdrawals, ...response]);
        setWithdrawalsHasMore(false);
      } else {
        const newWithdrawals = response.data || [];
        setMyWithdrawals((prev) =>
          reset ? newWithdrawals : [...prev, ...newWithdrawals]
        );
        setWithdrawalsHasMore(response.pagination?.hasMore || false);
        setWithdrawalsSkip((prev) => (reset ? 10 : prev + 10));
      }
    } catch (error) {
      console.error("Failed to load withdrawals:", error);
    } finally {
      setWithdrawalsLoading(false);
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
      if (amount < 10) {
        setError("Minimum bet amount is 10 rupees");
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

      if (hasBetCurrentSlot) {
        setError(
          "You have already placed a bet for this slot. Please wait for the result."
        );
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
      await loadMyBets();
    } catch (err: any) {
      setError(err.message || "Failed to place bet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-700">
          <TabsTrigger value="prediction">Pop The Picture</TabsTrigger>
          <TabsTrigger value="dashboard">My Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="prediction" className="mt-6 space-y-6">
          {slotLoading ? (
            <Card className="border-slate-700 bg-slate-800">
              <CardContent className="flex items-center justify-center py-12">
                <Spinner className="w-8 h-8 text-blue-400" />
                <p className="ml-3 text-slate-400">Loading slot...</p>
              </CardContent>
            </Card>
          ) : !currentSlot ? (
            <Card className="border-slate-700 bg-slate-800">
              <CardHeader>
                <CardTitle className="text-white">
                  {slotWaitTime !== null ? "Next Slot Starting Soon" : "No Active Slot"}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {slotWaitTime !== null 
                    ? `Previous slot just ended! Next slot starts in ${slotWaitTime} seconds...`
                    : "Waiting for the next prediction slot to be created. Please check back soon!"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 text-center py-8">
                  {slotWaitTime !== null 
                    ? "Take a moment to check your results from the previous slot!"
                    : "The next slot will be created automatically every 10 minutes."
                  }
                </p>
                {slotWaitTime !== null && (
                  <div className="flex justify-center mt-4">
                    <div className="text-3xl font-bold text-blue-400 animate-pulse">
                      {slotWaitTime}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="border-slate-700 bg-slate-800">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-white">Current Slot</CardTitle>
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
                    Minimum bet: ₹10
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
                          const isSelected = selectedIcon === id;
                          const isMyBet = currentSlotBets.some((bet) => bet.icon === id);
                          const myBetAmount = currentSlotBets
                            .filter((bet) => bet.icon === id)
                            .reduce((sum, bet) => sum + bet.amount, 0);
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => setSelectedIcon(id)}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                isSelected
                                  ? "border-blue-500 bg-blue-500 bg-opacity-20"
                                  : isMyBet
                                  ? "border-green-500 bg-green-500 bg-opacity-30 shadow-lg shadow-green-500/30"
                                  : "border-slate-600 bg-slate-700 hover:border-slate-500"
                              }`}
                            >
                              <Icon
                                className={`w-8 h-8 mx-auto mb-2 ${
                                  isMyBet ? "text-green-300" : color
                                }`}
                              />
                              <p className="text-xs text-slate-300">{name}</p>
                              <p className="text-xs text-slate-400 mt-1">
                                {iconData.totalBets} bets • ₹
                                {iconData.totalAmount.toFixed(0)}
                              </p>
                              {isMyBet && (
                                <div className="mt-2 flex items-center justify-center">
                                  <div className="bg-green-600 text-white text-[10px] px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                    Betted ₹{myBetAmount}
                                  </div>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">
                        Bet Amount (₹)
                      </label>
                      <Input
                        type="number"
                        min="10"
                        step="10"
                        placeholder="50"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        className="mt-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                      />
                      {hasBetCurrentSlot && (
                        <p className="text-xs text-amber-400">
                          You have already placed a bet for this slot. Please
                          wait for the result.
                        </p>
                      )}
                      {currentSlotBet && (
                        <p className="text-xs text-slate-300">
                          You placed{" "}
                          <span className="text-white font-semibold">
                            ₹{currentSlotBet.amount.toFixed(2)}
                          </span>{" "}
                          on{" "}
                          <span className="font-semibold text-blue-200">
                            {currentSlotBet.icon}
                          </span>
                          . Awaiting result.
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
                        hasBetCurrentSlot
                      }
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                    >
                      {loading ? "Placing Bet..." : `Place Bet (₹${betAmount})`}
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
              {betsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner className="w-6 h-6 text-blue-400" />
                  <p className="ml-3 text-slate-400">
                    Loading betting history...
                  </p>
                </div>
              ) : myBets.length === 0 ? (
                <p className="text-slate-400 text-center py-8">
                  No bets placed yet
                </p>
              ) : (
                <div
                  className="h-[400px] overflow-y-auto pr-4"
                  onScroll={handleBetsScroll}
                  ref={betsScrollRef}
                >
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
                    {betsHasMore && (
                      <div className="flex justify-center py-4">
                        <Spinner className="w-5 h-5 text-blue-400" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Add Money to Wallet</CardTitle>
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
                    onChange={(e) => setTransactionDescription(e.target.value)}
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
                  {transactionLoading ? "Submitting..." : "Submit for Approval"}
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
                  <p>• Minimum bet amount: ₹10</p>
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
                <form onSubmit={handleRequestWithdrawal} className="space-y-4">
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
              {withdrawalsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner className="w-6 h-6 text-blue-400" />
                  <p className="ml-3 text-slate-400">
                    Loading withdrawal history...
                  </p>
                </div>
              ) : myWithdrawals.length === 0 ? (
                <p className="text-slate-400 text-center py-8">
                  No withdrawal requests yet
                </p>
              ) : (
                <div
                  className="h-[400px] overflow-y-auto pr-4"
                  onScroll={handleWithdrawalsScroll}
                  ref={withdrawalsScrollRef}
                >
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
                    {withdrawalsHasMore && (
                      <div className="flex justify-center py-4">
                        <Spinner className="w-5 h-5 text-blue-400" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Transaction History</CardTitle>
              <CardDescription className="text-slate-400">
                Your payment requests and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner className="w-6 h-6 text-blue-400" />
                  <p className="ml-3 text-slate-400">
                    Loading transaction history...
                  </p>
                </div>
              ) : userTransactions.length === 0 ? (
                <p className="text-slate-400 text-center py-8">
                  No transactions yet
                </p>
              ) : (
                <div
                  className="h-[400px] overflow-y-auto pr-4"
                  onScroll={handleTransactionsScroll}
                  ref={transactionsScrollRef}
                >
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
                    {transactionsHasMore && (
                      <div className="flex justify-center py-4">
                        <Spinner className="w-5 h-5 text-blue-400" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
