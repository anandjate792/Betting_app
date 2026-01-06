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
import { withdrawalApi } from "@/lib/api";

export default function WithdrawalsPage() {
  const { fetchUsers } = useAppStore();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    setWithdrawalsLoading(true);
    try {
      const response = await withdrawalApi.getWithdrawals(50, 0);
      if (Array.isArray(response)) {
        setWithdrawals(response);
      } else {
        setWithdrawals(response.data || []);
      }
    } catch (error) {
      console.error("Failed to load withdrawals:", error);
    } finally {
      setWithdrawalsLoading(false);
    }
  };

  const handleApproveWithdrawal = async (withdrawalId: string) => {
    try {
      await withdrawalApi.approveWithdrawal(withdrawalId);
      await loadWithdrawals();
      await fetchUsers();
    } catch (error) {
      console.error("Failed to approve withdrawal:", error);
    }
  };

  const handleRejectWithdrawal = async (withdrawalId: string) => {
    try {
      await withdrawalApi.rejectWithdrawal(withdrawalId);
      await loadWithdrawals();
      await fetchUsers();
    } catch (error) {
      console.error("Failed to reject withdrawal:", error);
    }
  };

  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending");

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Selected Withdrawal Details Modal */}
      {selectedWithdrawal && (
        <Card className="border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex justify-between items-center">
              Withdrawal Details
              <Button
                onClick={() => setSelectedWithdrawal(null)}
                variant="ghost"
                className="text-slate-400 hover:text-white"
              >
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-300">User Information</p>
                <p className="text-white">{selectedWithdrawal.userName}</p>
                <p className="text-sm text-slate-400">ID: {selectedWithdrawal.userId}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-300">Amount</p>
                <p className="text-2xl font-bold text-purple-400">
                  ₹{selectedWithdrawal.amount.toFixed(2)}
                </p>
                <p className="text-sm text-slate-400">
                  Status: <span className={`px-2 py-1 rounded text-xs ${
                    selectedWithdrawal.status === 'pending' ? 'bg-yellow-600 text-white' :
                    selectedWithdrawal.status === 'approved' ? 'bg-green-600 text-white' :
                    'bg-red-600 text-white'
                  }`}>
                    {selectedWithdrawal.status}
                  </span>
                </p>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-semibold text-slate-300 mb-2">Bank Details</p>
              {selectedWithdrawal.bankDetails ? (
                <div className="p-4 bg-slate-900 rounded-lg border border-slate-600 space-y-2">
                  {selectedWithdrawal.bankDetails.accountHolderName && (
                    <p className="text-slate-300">
                      <span className="text-slate-500">Account Holder:</span> {selectedWithdrawal.bankDetails.accountHolderName}
                    </p>
                  )}
                  {selectedWithdrawal.bankDetails.bankName && (
                    <p className="text-slate-300">
                      <span className="text-slate-500">Bank Name:</span> {selectedWithdrawal.bankDetails.bankName}
                    </p>
                  )}
                  {selectedWithdrawal.bankDetails.accountNumber && (
                    <p className="text-slate-300">
                      <span className="text-slate-500">Account Number:</span> {selectedWithdrawal.bankDetails.accountNumber}
                    </p>
                  )}
                  {selectedWithdrawal.bankDetails.ifscCode && (
                    <p className="text-slate-300">
                      <span className="text-slate-500">IFSC Code:</span> {selectedWithdrawal.bankDetails.ifscCode}
                    </p>
                  )}
                  {selectedWithdrawal.bankDetails.upiId && (
                    <p className="text-slate-300">
                      <span className="text-slate-500">UPI ID:</span> {selectedWithdrawal.bankDetails.upiId}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-yellow-400 text-sm">No bank details provided</p>
              )}
            </div>
            
            <div>
              <p className="text-sm font-semibold text-slate-300 mb-2">Request Information</p>
              <p className="text-slate-400">
                <span className="text-slate-500">Requested:</span> {new Date(selectedWithdrawal.createdAt).toLocaleString()}
              </p>
              {selectedWithdrawal.updatedAt && (
                <p className="text-slate-400">
                  <span className="text-slate-500">Last Updated:</span> {new Date(selectedWithdrawal.updatedAt).toLocaleString()}
                </p>
              )}
            </div>
            
            {selectedWithdrawal.status === 'pending' && (
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    handleApproveWithdrawal(selectedWithdrawal.id);
                    setSelectedWithdrawal(null);
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Withdrawal
                </Button>
                <Button
                  onClick={() => {
                    handleRejectWithdrawal(selectedWithdrawal.id);
                    setSelectedWithdrawal(null);
                  }}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Withdrawal
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Withdrawal Requests</CardTitle>
          <CardDescription className="text-slate-400">
            Approve or reject user withdrawal requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {withdrawalsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="w-6 h-6 text-blue-400" />
              <p className="ml-3 text-slate-400">Loading withdrawals...</p>
            </div>
          ) : pendingWithdrawals.length === 0 ? (
            <p className="text-slate-400 text-center py-8">
              No pending withdrawal requests
            </p>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3 pr-4">
                {pendingWithdrawals.map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="p-4 bg-slate-700 rounded-lg border border-slate-600"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="font-semibold text-white">
                          {withdrawal.userName}
                        </p>
                        <p className="text-sm text-slate-400">
                          Amount: ₹{withdrawal.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(withdrawal.createdAt).toLocaleString()}
                        </p>
                        
                        {/* Bank Details */}
                        {withdrawal.bankDetails && (
                          <div className="mt-3 p-3 bg-slate-800 rounded-lg border border-slate-600">
                            <p className="text-xs font-semibold text-slate-300 mb-2">Bank Details:</p>
                            <div className="space-y-1 text-xs">
                              {withdrawal.bankDetails.accountHolderName && (
                                <p className="text-slate-400">
                                  <span className="text-slate-500">Account Holder:</span> {withdrawal.bankDetails.accountHolderName}
                                </p>
                              )}
                              {withdrawal.bankDetails.bankName && (
                                <p className="text-slate-400">
                                  <span className="text-slate-500">Bank Name:</span> {withdrawal.bankDetails.bankName}
                                </p>
                              )}
                              {withdrawal.bankDetails.accountNumber && (
                                <p className="text-slate-400">
                                  <span className="text-slate-500">Account Number:</span> {withdrawal.bankDetails.accountNumber}
                                </p>
                              )}
                              {withdrawal.bankDetails.ifscCode && (
                                <p className="text-slate-400">
                                  <span className="text-slate-500">IFSC Code:</span> {withdrawal.bankDetails.ifscCode}
                                </p>
                              )}
                              {withdrawal.bankDetails.upiId && (
                                <p className="text-slate-400">
                                  <span className="text-slate-500">UPI ID:</span> {withdrawal.bankDetails.upiId}
                                </p>
                              )}
                              {!withdrawal.bankDetails.accountHolderName && 
                               !withdrawal.bankDetails.bankName && 
                               !withdrawal.bankDetails.accountNumber && 
                               !withdrawal.bankDetails.ifscCode && 
                               !withdrawal.bankDetails.upiId && (
                                <p className="text-yellow-400 text-xs">No bank details provided</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-lg font-bold text-purple-400">
                          ₹{withdrawal.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApproveWithdrawal(withdrawal.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleRejectWithdrawal(withdrawal.id)}
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
          <CardTitle className="text-white">All Withdrawals</CardTitle>
          <CardDescription className="text-slate-400">
            Click on any withdrawal to view detailed bank information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {withdrawalsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="w-6 h-6 text-blue-400" />
              <p className="ml-3 text-slate-400">Loading withdrawals...</p>
            </div>
          ) : withdrawals.length === 0 ? (
            <p className="text-slate-400 text-center py-4">No withdrawals</p>
          ) : (
            <ScrollArea className="h-[400px]">
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
                    {withdrawals.map((w) => (
                      <tr
                        key={w.id}
                        className="border-b border-slate-700 hover:bg-slate-700/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedWithdrawal(w)}
                      >
                        <td className="py-3 px-2 text-white">{w.userName}</td>
                        <td className="py-3 px-2 text-purple-400 font-semibold">
                          ₹{w.amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-2">
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
                        </td>
                        <td className="py-3 px-2 text-slate-400">
                          {new Date(w.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

