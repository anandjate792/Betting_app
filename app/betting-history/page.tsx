"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { betApi } from "@/lib/api";
import { RefreshCw, Wallet, ArrowLeft } from "lucide-react";
import Link from "next/link";

const formatSlotNumber = (slotNumber: number): number => {
  return slotNumber > 1000 ? ((slotNumber - 1) % 1000) + 1 : slotNumber;
};

export default function BettingHistoryPage() {
  const { user } = useAppStore();
  const [myBets, setMyBets] = useState<any[]>([]);
  const [betsLoading, setBetsLoading] = useState(false);
  const [betsSkip, setBetsSkip] = useState(10);
  const [betsHasMore, setBetsHasMore] = useState(true);

  useEffect(() => {
    loadMyBets(true);
  }, []);

  const loadMyBets = async (reset = false) => {
    if (reset) {
      setBetsSkip(10);
      setBetsHasMore(true);
    }
    if (!betsHasMore && !reset) return;

    setBetsLoading(reset);
    try {
      const response = await betApi.getBets(undefined, 10, reset ? 0 : betsSkip);
      if (response?.pagination) {
        setBetsHasMore(response.pagination.hasMore || false);
        setBetsSkip((prev) => reset ? 10 : prev + 10);
        if (reset) {
          setMyBets(response.data || []);
        } else {
          setMyBets((prev) => [...prev, ...(response.data || [])]);
        }
      } else if (Array.isArray(response)) {
        setBetsHasMore(false);
        if (reset) {
          setMyBets(response);
        } else {
          setMyBets((prev) => [...prev, ...response]);
        }
      } else {
        setBetsHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load betting history:", error);
    } finally {
      setBetsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-7xl mx-auto">
          <Card className="border-slate-700 bg-slate-800">
            <CardContent className="text-center py-12">
              <p className="text-slate-400">Please log in to view your betting history.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Top Stats Bar */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 px-3 py-2">
        <div className="flex justify-between items-center max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <p className="text-[10px] text-slate-400">Balance</p>
              <p className="text-base font-bold text-green-400">
                ₹{user?.walletBalance?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
          <Button
            onClick={() => loadMyBets(true)}
            disabled={betsLoading}
            size="sm"
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw
              className={`w-4 h-4 ${betsLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      <div className="p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">My Betting History</h1>
            <p className="text-slate-400">View all your bets and their results</p>
          </div>

        <Card className="border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Betting History</CardTitle>
            <CardDescription className="text-slate-400">
              View all your bets and their results
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                <ScrollArea className="h-[600px]">
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
                                    Slot #{formatSlotNumber(slotNumber || 0)}
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
        </div>
      </div>
    </div>
  );
}
