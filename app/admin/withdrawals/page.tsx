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
                      <div>
                        <p className="font-semibold text-white">
                          {withdrawal.userName}
                        </p>
                        <p className="text-sm text-slate-400">
                          Amount: ₹{withdrawal.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(withdrawal.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
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
                        className="border-b border-slate-700 hover:bg-slate-700/50"
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

