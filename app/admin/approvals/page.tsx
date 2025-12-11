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
import { CheckCircle, XCircle } from "lucide-react";
import { transactionApi } from "@/lib/api";

export default function ApprovalsPage() {
  const { user, transactions, approveTransaction, rejectTransaction, totalTransactions } =
    useAppStore();
  const [selectedImageTransaction, setSelectedImageTransaction] = useState<
    string | null
  >(null);
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
      const response = await transactionApi.getAllTransactions(10, reset ? 0 : transactionsSkip);
      // Handle paginated response
      if (response?.pagination) {
        setHasMore(response.pagination.hasMore || false);
        setTransactionsSkip((prev) => reset ? 10 : prev + 10);
        // Append new transactions to store
        if (!reset && response.data) {
          useAppStore.setState((state) => ({
            transactions: [...(state.transactions || []), ...response.data],
          }));
        }
      } else if (Array.isArray(response)) {
        // Handle old format
        setHasMore(false);
        if (!reset) {
          useAppStore.setState((state) => ({
            transactions: [...(state.transactions || []), ...response],
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

  const pendingTransactions = transactions.filter(
    (t) => t.status === "pending"
  );
  const allTransactions = transactions;

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-300 text-sm font-medium">
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-400">
              {pendingTransactions.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedImageTransaction && (
        <Card className="border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Screenshot Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              const trans = transactions.find(
                (t) => t.id === selectedImageTransaction
              );
              return trans?.screenshotImage ? (
                <>
                  <img
                    src={trans.screenshotImage || "/placeholder.svg"}
                    alt="Transaction screenshot"
                    className="w-full max-h-96 object-cover rounded-lg border border-slate-600"
                  />
                  <div className="text-sm text-slate-300">
                    <p>
                      <strong>User:</strong> {trans.userName}
                    </p>
                    <p>
                      <strong>Amount:</strong> ${trans.amount.toFixed(2)}
                    </p>
                    <p>
                      <strong>Description:</strong> {trans.description}
                    </p>
                  </div>
                  <Button
                    onClick={() => setSelectedImageTransaction(null)}
                    variant="outline"
                    className="w-full text-slate-300 border-slate-600 hover:bg-slate-700"
                  >
                    Close Preview
                  </Button>
                </>
              ) : null;
            })()}
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Transaction Approvals</CardTitle>
          <CardDescription>
            Review and approve pending Gpay transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="w-6 h-6 text-blue-400" />
              <p className="ml-3 text-slate-400">Loading transactions...</p>
            </div>
          ) : pendingTransactions.length === 0 ? (
            <p className="text-slate-400 text-center py-8">
              No pending transactions
            </p>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3 pr-4">
                {pendingTransactions.map((trans) => (
                  <div
                    key={trans.id}
                    className="p-4 bg-slate-700 rounded-lg border border-slate-600"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-white">
                          {trans.userName}
                        </p>
                        <p className="text-sm text-slate-400">
                          {trans.description}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-green-400">
                        ${trans.amount.toFixed(2)}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">
                      {new Date(trans.createdAt).toLocaleString()}
                    </p>

                    {trans.screenshotImage && (
                      <div className="mb-3">
                        <img
                          src={
                            trans.screenshotImage || "/placeholder.svg"
                          }
                          alt="Transaction screenshot"
                          className="w-full max-h-32 object-cover rounded-lg border border-slate-600 cursor-pointer hover:opacity-80 transition"
                          onClick={() => setSelectedImageTransaction(trans.id)}
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          Click image to expand
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={() => approveTransaction(trans.id, user!.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => rejectTransaction(trans.id)}
                        variant="destructive"
                        className="flex-1"
                        size="sm"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white">All Transactions</CardTitle>
          <CardDescription>
            Complete transaction history ({totalTransactions || allTransactions.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="w-6 h-6 text-blue-400" />
              <p className="ml-3 text-slate-400">Loading transactions...</p>
            </div>
          ) : allTransactions.length === 0 ? (
            <p className="text-slate-400 text-center py-8">
              No transactions
            </p>
          ) : (
            <>
              <ScrollArea className="h-[500px]">
                <div className="pr-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="text-left py-2 px-2 text-slate-300">User</th>
                        <th className="text-left py-2 px-2 text-slate-300">Amount</th>
                        <th className="text-left py-2 px-2 text-slate-300">Status</th>
                        <th className="text-left py-2 px-2 text-slate-300">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allTransactions.map((trans) => (
                        <tr
                          key={trans.id}
                          className="border-b border-slate-700 hover:bg-slate-700/50"
                        >
                          <td className="py-3 px-2 text-white">
                            {trans.userName}
                          </td>
                          <td className="py-3 px-2 text-green-400 font-semibold">
                            ${trans.amount.toFixed(2)}
                          </td>
                          <td className="py-3 px-2">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                trans.status === "pending"
                                  ? "bg-yellow-600 text-white"
                                  : trans.status === "approved"
                                  ? "bg-green-600 text-white"
                                  : "bg-red-600 text-white"
                              }`}
                            >
                              {trans.status.charAt(0).toUpperCase() +
                                trans.status.slice(1)}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-slate-400">
                            {new Date(trans.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
              {hasMore && (
                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={() => loadTransactions(false)}
                    disabled={loadingMore}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
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
  );
}

