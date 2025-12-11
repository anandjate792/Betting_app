"use client";

import type React from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserPlusIcon,
  LogOutIcon,
  CheckCircle,
  XCircle,
  Settings,
} from "lucide-react";
import SettingsModal from "./settings-modal";
import AdminPredictionPanel from "./admin-prediction-panel";
import { withdrawalApi } from "@/lib/api";
import { predictionApi } from "@/lib/api";

export default function AdminDashboard() {
  const {
    user,
    logout,
    users,
    transactions,
    deleteUser,
    createUser,
    approveTransaction,
    rejectTransaction,
    addMoneyToWallet,
  } = useAppStore();
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [moneyAmount, setMoneyAmount] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [selectedImageTransaction, setSelectedImageTransaction] = useState<
    string | null
  >(null);
  const [showSettings, setShowSettings] = useState(false);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [autoCreateEnabled, setAutoCreateEnabled] = useState(false);

  useEffect(() => {
    const loadAutoCreate = async () => {
      try {
        const status = await predictionApi.getAutoCreateStatus();
        setAutoCreateEnabled(Boolean((status as any).enabled));
      } catch (error) {
        console.error("Failed to fetch auto-create status:", error);
      }
    };
    void loadAutoCreate();
  }, []);

  const regularUsers = users.filter((u) => u.role === "user");
  const pendingTransactions = transactions.filter(
    (t) => t.status === "pending"
  );
  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending");
  const commissionEarnings = transactions
    .filter(
      (t) =>
        t.userId === user?.id &&
        t.description.toLowerCase().includes("commission")
    )
    .reduce((sum, t) => sum + t.amount, 0);

  const loadWithdrawals = async () => {
    try {
      const data = await withdrawalApi.getWithdrawals();
      setWithdrawals(data as any[]);
    } catch (error) {
      console.error("Failed to load withdrawals:", error);
    }
  };

  const handleApproveWithdrawal = async (withdrawalId: string) => {
    try {
      await withdrawalApi.approveWithdrawal(withdrawalId);
      await loadWithdrawals();
      await useAppStore.getState().fetchUsers();
    } catch (error) {
      console.error("Failed to approve withdrawal:", error);
    }
  };

  const handleRejectWithdrawal = async (withdrawalId: string) => {
    try {
      await withdrawalApi.rejectWithdrawal(withdrawalId);
      await loadWithdrawals();
      await useAppStore.getState().fetchUsers();
    } catch (error) {
      console.error("Failed to reject withdrawal:", error);
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserName && newUserEmail && newUserPassword) {
      createUser(newUserName, newUserEmail, newUserPassword);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
    }
  };

  const handleAddMoney = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserId && moneyAmount) {
      addMoneyToWallet(selectedUserId, Number.parseFloat(moneyAmount));
      setMoneyAmount("");
      setSelectedUserId("");
    }
  };

  const toggleAutoCreate = async (enabled: boolean) => {
    try {
      await predictionApi.autoCreateSlotToggle(enabled);
      setAutoCreateEnabled(enabled);
    } catch (error) {
      console.error("Failed to toggle auto-create:", error);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        {/* Header */}
        <div className="border-b border-slate-700 bg-slate-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-slate-400 text-sm">System Administration</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowSettings(true)}
                variant="ghost"
                className="text-slate-400 hover:text-blue-400"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button
                onClick={logout}
                variant="ghost"
                className="text-slate-400 hover:text-red-400"
              >
                <LogOutIcon className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 space-y-6">
          {/* ... existing stats and tabs code ... */}
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-slate-700 bg-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-300 text-sm font-medium">
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-400">
                  {regularUsers.length}
                </div>
              </CardContent>
            </Card>
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
            <Card className="border-slate-700 bg-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-300 text-sm font-medium">
                  Total Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-400">
                  {transactions.length}
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-700 bg-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-300 text-sm font-medium">
                  Admin Profit Wallet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold text-green-400">
                  ₹{user?.walletBalance?.toFixed(2) ?? "0.00"}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Lifetime commission earned: ₹{commissionEarnings.toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-700 bg-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-300 text-sm font-medium">
                  Auto Slot Creation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-slate-400">
                  Keeps generating slots every 10 minutes even if admin is
                  offline.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => toggleAutoCreate(true)}
                    variant={autoCreateEnabled ? "default" : "outline"}
                    className={
                      autoCreateEnabled ? "bg-green-600 hover:bg-green-700" : ""
                    }
                  >
                    Enable
                  </Button>
                  <Button
                    onClick={() => toggleAutoCreate(false)}
                    variant={!autoCreateEnabled ? "default" : "outline"}
                    className={
                      !autoCreateEnabled
                        ? "bg-slate-700 hover:bg-slate-600"
                        : ""
                    }
                  >
                    Disable
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-slate-700">
              <TabsTrigger value="users" onClick={() => setActiveTab("users")}>
                User Management
              </TabsTrigger>
              <TabsTrigger
                value="approvals"
                onClick={() => setActiveTab("approvals")}
              >
                Approvals
              </TabsTrigger>
              <TabsTrigger
                value="wallet"
                onClick={() => setActiveTab("wallet")}
              >
                Add Money
              </TabsTrigger>
              <TabsTrigger
                value="withdrawals"
                onClick={() => {
                  setActiveTab("withdrawals");
                  loadWithdrawals();
                }}
              >
                Withdrawals
              </TabsTrigger>
              <TabsTrigger
                value="prediction"
                onClick={() => setActiveTab("prediction")}
              >
                Prediction Game
              </TabsTrigger>
            </TabsList>

            {/* User Management Tab */}
            <TabsContent value="users" className="mt-6 space-y-6">
              {/* Create New User */}
              <Card className="border-slate-700 bg-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <UserPlusIcon className="w-5 h-5" />
                    Create New User
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-300">
                          Name
                        </label>
                        <Input
                          type="text"
                          placeholder="John Doe"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          className="mt-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-300">
                          Email
                        </label>
                        <Input
                          type="email"
                          placeholder="user@example.com"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          className="mt-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-300">
                          Password
                        </label>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          className="mt-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Create User
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Users List */}
              <Card className="border-slate-700 bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Registered Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {regularUsers.map((u) => (
                      <div
                        key={u.id}
                        className="flex justify-between items-center p-3 bg-slate-700 rounded-lg"
                      >
                        <div>
                          <p className="font-semibold text-white">{u.name}</p>
                          <p className="text-sm text-slate-400">{u.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold text-green-400">
                              ${u.walletBalance.toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-400">Balance</p>
                          </div>
                          <Button
                            onClick={() => deleteUser(u.id)}
                            variant="ghost"
                            className="text-red-400 hover:text-red-600"
                            size="sm"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Approvals Tab */}
            <TabsContent value="approvals" className="mt-6">
              {selectedImageTransaction && (
                <Card className="border-slate-700 bg-slate-800 mb-6">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Screenshot Preview
                    </CardTitle>
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
                              <strong>Amount:</strong> $
                              {trans.amount.toFixed(2)}
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
                  <CardTitle className="text-white">
                    Transaction Approvals
                  </CardTitle>
                  <CardDescription>
                    Review and approve pending Gpay transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingTransactions.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">
                      No pending transactions
                    </p>
                  ) : (
                    <div className="space-y-3">
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
                                onClick={() =>
                                  setSelectedImageTransaction(trans.id)
                                }
                              />
                              <p className="text-xs text-slate-400 mt-1">
                                Click image to expand
                              </p>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              onClick={() =>
                                approveTransaction(trans.id, user!.id)
                              }
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
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Add Money Tab */}
            <TabsContent value="wallet" className="mt-6">
              <Card className="border-slate-700 bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">
                    Add Money to Wallet
                  </CardTitle>
                  <CardDescription>
                    Manually add funds to user wallets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddMoney} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-300">
                        Select User
                      </label>
                      <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Choose a user...</option>
                        {regularUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.email}) - ${u.walletBalance.toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-300">
                        Amount ($)
                      </label>
                      <Input
                        type="number"
                        placeholder="100"
                        value={moneyAmount}
                        onChange={(e) => setMoneyAmount(e.target.value)}
                        className="mt-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Add Money
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Withdrawals Tab */}
            <TabsContent value="withdrawals" className="mt-6">
              <Card className="border-slate-700 bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">
                    Withdrawal Requests
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Approve or reject user withdrawal requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingWithdrawals.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">
                      No pending withdrawal requests
                    </p>
                  ) : (
                    <div className="space-y-3">
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
                                {new Date(
                                  withdrawal.createdAt
                                ).toLocaleString()}
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
                              onClick={() =>
                                handleApproveWithdrawal(withdrawal.id)
                              }
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                              size="sm"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              onClick={() =>
                                handleRejectWithdrawal(withdrawal.id)
                              }
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
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-700 bg-slate-800 mt-6">
                <CardHeader>
                  <CardTitle className="text-white">All Withdrawals</CardTitle>
                </CardHeader>
                <CardContent>
                  {withdrawals.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">
                      No withdrawals
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-600">
                            <th className="text-left py-2 px-2 text-slate-300">
                              User
                            </th>
                            <th className="text-left py-2 px-2 text-slate-300">
                              Amount
                            </th>
                            <th className="text-left py-2 px-2 text-slate-300">
                              Status
                            </th>
                            <th className="text-left py-2 px-2 text-slate-300">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {withdrawals.map((w) => (
                            <tr
                              key={w.id}
                              className="border-b border-slate-700 hover:bg-slate-700/50"
                            >
                              <td className="py-3 px-2 text-white">
                                {w.userName}
                              </td>
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
                                  {w.status.charAt(0).toUpperCase() +
                                    w.status.slice(1)}
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
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Prediction Game Tab */}
            <TabsContent value="prediction" className="mt-6">
              <AdminPredictionPanel />
            </TabsContent>
          </Tabs>

          {/* Transaction History */}
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="text-white">All Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-slate-400 text-center py-4">
                  No transactions
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="text-left py-2 px-2 text-slate-300">
                          User
                        </th>
                        <th className="text-left py-2 px-2 text-slate-300">
                          Amount
                        </th>
                        <th className="text-left py-2 px-2 text-slate-300">
                          Status
                        </th>
                        <th className="text-left py-2 px-2 text-slate-300">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((trans) => (
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}
