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
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { withdrawalApi } from "@/lib/api";

export default function WithdrawalsPage() {
  const { user } = useAppStore();
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>("");
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [myWithdrawals, setMyWithdrawals] = useState<any[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [withdrawalsSkip, setWithdrawalsSkip] = useState(10);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadWithdrawals(true);
  }, []);

  const loadWithdrawals = async (reset = false) => {
    if (reset) {
      setWithdrawalsSkip(10);
      setHasMore(true);
    }
    if (!hasMore && !reset) return;

    setWithdrawalsLoading(reset);
    setLoadingMore(!reset);
    try {
      const response = await withdrawalApi.getWithdrawals(10, reset ? 0 : withdrawalsSkip);
      if (response?.pagination) {
        setHasMore(response.pagination.hasMore || false);
        setWithdrawalsSkip((prev) => reset ? 10 : prev + 10);
        if (reset) {
          setMyWithdrawals(response.data || []);
        } else {
          setMyWithdrawals((prev) => [...prev, ...(response.data || [])]);
        }
      } else if (Array.isArray(response)) {
        setHasMore(false);
        if (reset) {
          setMyWithdrawals(response);
        } else {
          setMyWithdrawals((prev) => [...prev, ...response]);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load withdrawals:", error);
    } finally {
      setWithdrawalsLoading(false);
      setLoadingMore(false);
    }
  };

  const handleWithdrawal = async () => {
    if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
      return;
    }

    setWithdrawalLoading(true);
    try {
      await withdrawalApi.requestWithdrawal(parseFloat(withdrawalAmount));
      setWithdrawalAmount("");
      await loadWithdrawals(true);
    } catch (error: any) {
      console.error("Failed to request withdrawal:", error);
      alert(error.message || "Failed to request withdrawal");
    } finally {
      setWithdrawalLoading(false);
    }
  };


  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Request Withdrawal */}
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Request Withdrawal</CardTitle>
          <CardDescription className="text-slate-400">
            Withdraw money from your wallet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Amount
            </label>
            <Input
              type="number"
              placeholder="Enter withdrawal amount"
              value={withdrawalAmount}
              onChange={(e) => setWithdrawalAmount(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
            />
            <p className="text-xs text-slate-400 mt-1">
              Available balance: ₹{user?.walletBalance.toFixed(2) || "0.00"}
            </p>
          </div>
          <Button
            onClick={handleWithdrawal}
            disabled={withdrawalLoading || !withdrawalAmount || parseFloat(withdrawalAmount) <= 0}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            {withdrawalLoading ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Processing...
              </>
            ) : (
              "Request Withdrawal"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Withdrawal History</CardTitle>
          <CardDescription className="text-slate-400">
            View all your withdrawal requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {withdrawalsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="w-6 h-6 text-blue-400" />
              <p className="ml-3 text-slate-400">Loading withdrawals...</p>
            </div>
          ) : myWithdrawals.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No withdrawals found</p>
          ) : (
            <>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3 pr-4">
                  {myWithdrawals.map((w) => (
                    <div
                      key={w.id}
                      className="p-4 bg-slate-700 rounded-lg border border-slate-600"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-white">
                            ₹{w.amount.toFixed(2)}
                          </p>
                          <p className="text-sm text-slate-400">
                            {new Date(w.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            w.status === "pending"
                              ? "bg-yellow-600 text-white"
                              : w.status === "approved"
                              ? "bg-green-600 text-white"
                              : "bg-red-600 text-white"
                          }`}
                        >
                          {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {hasMore && (
                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={() => loadWithdrawals(false)}
                    disabled={loadingMore}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    {loadingMore ? (
                      <>
                        <Spinner className="w-4 h-4 mr-2" />
                        Loading...
                      </>
                    ) : (
                      "Load More (10 withdrawals)"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

