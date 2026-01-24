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
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [transactionsSkip, setTransactionsSkip] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [processingTransaction, setProcessingTransaction] = useState<{
    id: string;
    action: "approve" | "reject";
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleApprove = async (transactionId: string) => {
    if (processingTransaction) return; // Prevent multiple clicks
    
    setProcessingTransaction({ id: transactionId, action: "approve" });
    setErrorMessage(null);
    
    try {
      await approveTransaction(transactionId, user!.id);
      // Reload transactions to get updated status
      await loadTransactions(true);
    } catch (error: any) {
      const errorMsg = error?.message || "Failed to approve transaction";
      setErrorMessage(errorMsg);
      console.error("Approve transaction error:", error);
    } finally {
      setProcessingTransaction(null);
    }
  };

  const handleReject = async (transactionId: string) => {
    if (processingTransaction) return; // Prevent multiple clicks
    
    setProcessingTransaction({ id: transactionId, action: "reject" });
    setErrorMessage(null);
    
    try {
      await rejectTransaction(transactionId);
      // Reload transactions to get updated status
      await loadTransactions(true);
    } catch (error: any) {
      const errorMsg = error?.message || "Failed to reject transaction";
      setErrorMessage(errorMsg);
      console.error("Reject transaction error:", error);
    } finally {
      setProcessingTransaction(null);
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
                      <strong>Amount:</strong> ₹{trans.amount.toFixed(2)}
                    </p>
                    <p>
                      <strong>Description:</strong> {trans.description}
                    </p>
                    {trans.description && trans.description.includes('UTR:') && (
                      <p>
                        <strong>UTR Number:</strong> {trans.description.split('UTR:')[1]?.trim() || 'N/A'}
                      </p>
                    )}
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

      {selectedTransaction && (
        <Card className="border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Transaction Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400">User</p>
                <p className="text-white font-medium">{selectedTransaction.userName}</p>
              </div>
              <div>
                <p className="text-slate-400">Amount</p>
                <p className="text-green-400 font-medium">₹{selectedTransaction.amount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-slate-400">Status</p>
                <p className={`font-medium ${
                  selectedTransaction.status === 'pending' ? 'text-yellow-400' :
                  selectedTransaction.status === 'approved' ? 'text-green-400' :
                  'text-red-400'
                }`}>
                  {selectedTransaction.status.charAt(0).toUpperCase() + selectedTransaction.status.slice(1)}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Date</p>
                <p className="text-white font-medium">
                  {new Date(selectedTransaction.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-400">Description</p>
                <p className="text-white font-medium">{selectedTransaction.description}</p>
                {selectedTransaction.description && selectedTransaction.description.includes('UTR:') && (
                  <p className="text-blue-400 text-sm mt-1">
                    UTR: {selectedTransaction.description.split('UTR:')[1]?.trim() || 'N/A'}
                  </p>
                )}
              </div>
              {selectedTransaction.approvedAt && (
                <div>
                  <p className="text-slate-400">Approved At</p>
                  <p className="text-white font-medium">
                    {new Date(selectedTransaction.approvedAt).toLocaleString()}
                  </p>
                </div>
              )}
              {selectedTransaction.approvedBy && (
                <div>
                  <p className="text-slate-400">Approved By</p>
                  <p className="text-white font-medium">{selectedTransaction.approvedBy}</p>
                </div>
              )}
            </div>
            
            {selectedTransaction.screenshotImage && (
              <div>
                <p className="text-slate-400 mb-2">Screenshot</p>
                <img
                  src={selectedTransaction.screenshotImage}
                  alt="Transaction screenshot"
                  className="w-full max-h-64 object-cover rounded-lg border border-slate-600"
                />
              </div>
            )}
            
            <div className="flex gap-2">
              {selectedTransaction.status === 'pending' && (
                <>
                  <Button
                    onClick={() => {
                      handleApprove(selectedTransaction.id);
                      setSelectedTransaction(null);
                    }}
                    disabled={processingTransaction?.id === selectedTransaction.id}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => {
                      handleReject(selectedTransaction.id);
                      setSelectedTransaction(null);
                    }}
                    disabled={processingTransaction?.id === selectedTransaction.id}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </>
              )}
              <Button
                onClick={() => setSelectedTransaction(null)}
                variant="outline"
                className="w-full text-slate-800 border-slate-600 hover:bg-slate-100"
              >
                Close
              </Button>
            </div>
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
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-600 rounded-lg">
              <p className="text-red-400 text-sm">{errorMessage}</p>
              <Button
                onClick={() => setErrorMessage(null)}
                variant="ghost"
                size="sm"
                className="mt-2 text-red-400 hover:text-red-300"
              >
                Dismiss
              </Button>
            </div>
          )}
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
                    className="p-4 bg-slate-700 rounded-lg border border-slate-600 cursor-pointer hover:bg-slate-650 transition-colors"
                    onClick={() => setSelectedTransaction(trans)}
                  >
                    <div className="flex gap-4">
                      {/* Left side: Transaction details */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-semibold text-white text-lg">
                              {trans.userName}
                            </p>
                            <p className="text-sm text-slate-400">
                              {trans.description}
                            </p>
                            {trans.description && trans.description.includes('UTR:') && (
                              <p className="text-xs text-blue-400 mt-1">
                                UTR: {trans.description.split('UTR:')[1]?.trim() || 'N/A'}
                              </p>
                            )}
                          </div>
                          <p className="text-xl font-bold text-green-400">
                            ₹{trans.amount.toFixed(2)}
                          </p>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">
                          {new Date(trans.createdAt).toLocaleString()}
                        </p>

                        <div className="flex gap-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(trans.id);
                            }}
                            disabled={
                              processingTransaction?.id === trans.id ||
                              processingTransaction !== null
                            }
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            size="sm"
                          >
                            {processingTransaction?.id === trans.id &&
                            processingTransaction?.action === "approve" ? (
                              <>
                                <Spinner className="w-4 h-4 mr-2" />
                                Approving...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReject(trans.id);
                            }}
                            disabled={
                              processingTransaction?.id === trans.id ||
                              processingTransaction !== null
                            }
                            variant="destructive"
                            className="flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            size="sm"
                          >
                            {processingTransaction?.id === trans.id &&
                            processingTransaction?.action === "reject" ? (
                              <>
                                <Spinner className="w-4 h-4 mr-2" />
                                Rejecting...
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Right side: Screenshot image */}
                      {trans.screenshotImage && (
                        <div className="flex-shrink-0">
                          <img
                            src={trans.screenshotImage}
                            alt="Transaction screenshot"
                            className="w-48 h-32 object-cover rounded-lg border-2 border-slate-500 cursor-pointer hover:opacity-80 transition hover:border-blue-400"
                            onClick={() => setSelectedImageTransaction(trans.id)}
                          />
                          <p className="text-xs text-slate-400 mt-1 text-center">
                            Click to expand
                          </p>
                        </div>
                      )}
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
                        <th className="text-left py-2 px-2 text-slate-300">UTR</th>
                        <th className="text-left py-2 px-2 text-slate-300">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allTransactions.map((trans) => (
                        <tr
                          key={trans.id}
                          className="border-b border-slate-700 hover:bg-slate-700/50 cursor-pointer"
                          onClick={() => setSelectedTransaction(trans)}
                        >
                          <td className="py-3 px-2 text-white">
                            {trans.userName}
                          </td>
                          <td className="py-3 px-2 text-green-400 font-semibold">
                            ₹{trans.amount.toFixed(2)}
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
                          <td className="py-3 px-2 text-blue-400 text-xs">
                            {trans.description && trans.description.includes('UTR:') 
                              ? trans.description.split('UTR:')[1]?.trim() 
                              : 'N/A'}
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

