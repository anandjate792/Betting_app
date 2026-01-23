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
import { transactionApi } from "@/lib/api";

export default function TransactionsPage() {
  const { transactions, fetchTransactions } = useAppStore();
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [transactionsSkip, setTransactionsSkip] = useState(10);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadTransactions(true);
  }, []);

  const loadTransactions = async (reset = false) => {
    if (reset) {
      setTransactionsSkip(10);
      setHasMore(true);
    }
    if (!hasMore && !reset) return;

    setTransactionsLoading(reset);
    setLoadingMore(!reset);
    try {
      const response = await transactionApi.getUserTransactions(10, reset ? 0 : transactionsSkip);
      if (response?.pagination) {
        setHasMore(response.pagination.hasMore || false);
        setTransactionsSkip((prev) => reset ? 10 : prev + 10);
        if (!reset && response.data) {
          useAppStore.setState((state) => ({
            transactions: [...(state.transactions || []), ...response.data],
          }));
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setTransactionsLoading(false);
      setLoadingMore(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Transaction History</CardTitle>
            <CardDescription className="text-slate-400">
              View all your transaction requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="w-6 h-6 text-blue-400" />
                <p className="ml-3 text-slate-400">Loading transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No transactions found</p>
            ) : (
              <>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3 pr-4">
                    {transactions.map((trans) => (
                      <div
                        key={trans.id}
                        className="p-4 bg-slate-700 rounded-lg border border-slate-600"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-white">{trans.description}</p>
                            <p className="text-sm text-slate-400">
                              {new Date(trans.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-400">
                              ₹{trans.amount.toFixed(2)}
                            </p>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                trans.status === "pending"
                                  ? "bg-yellow-600 text-white"
                                  : trans.status === "approved"
                                  ? "bg-green-600 text-white"
                                  : "bg-red-600 text-white"
                              }`}
                            >
                              {trans.status.charAt(0).toUpperCase() + trans.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        {trans.screenshotImage && (
                          <img
                            src={trans.screenshotImage}
                            alt="Transaction screenshot"
                            className="w-full max-h-32 object-cover rounded-lg border border-slate-600 mt-2"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {hasMore && (
                  <div className="mt-4 flex justify-center">
                    <Button
                      onClick={() => loadTransactions(false)}
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
                        "Load More (10 transactions)"
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
  );
}
