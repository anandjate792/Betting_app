"use client";

import type React from "react";
import { useState, useEffect } from "react";
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
  Search,
} from "lucide-react";
import SettingsModal from "./settings-modal";
import AdminPredictionPanel from "./admin-prediction-panel";
import { withdrawalApi } from "@/lib/api";

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

  // Search filters
  const [userSearch, setUserSearch] = useState("");
  const [transactionSearch, setTransactionSearch] = useState("");
  const [withdrawalSearch, setWithdrawalSearch] = useState("");

  const regularUsers = users.filter((u) => u.role === "user");
  const pendingTransactions = transactions.filter(
    (t) => t.status === "pending"
  );
  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending");

  // Filtered lists
  const filteredUsers = regularUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredTransactions = transactions.filter(
    (trans) =>
      trans.userName.toLowerCase().includes(transactionSearch.toLowerCase()) ||
      trans.description?.toLowerCase().includes(transactionSearch.toLowerCase())
  );

  const filteredWithdrawals = withdrawals.filter((withdrawal) =>
    withdrawal.userName.toLowerCase().includes(withdrawalSearch.toLowerCase())
  );

  // Helper function to safely format dates
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString();
    } catch {
      return "Invalid Date";
    }
  };

  const formatDateTime = (dateString?: string | Date) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleString();
    } catch {
      return "Invalid Date";
    }
  };

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

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        {/* Header */}
        <div className="border-b border-slate-700 bg-slate-800 sticky top-0 z-10">
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
                  Pending Withdrawals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-400">
                  {pendingWithdrawals.length}
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
                <CardHeader className="sticky top-0 bg-slate-800 z-10">
                  <CardTitle className="text-white">Registered Users</CardTitle>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3">
                    {filteredUsers.length === 0 ? (
                      <p className="text-slate-400 text-center py-8">
                        No users found
                      </p>
                    ) : (
                      filteredUsers.map((u) => (
                        <div
                          key={u.id}
                          className="flex justify-between items-center p-4 bg-slate-700 rounded-lg hover:bg-slate-700/80 transition"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate">
                              {u.name}
                            </p>
                            <p className="text-sm text-slate-400 truncate">
                              {u.email}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Joined: {formatDate(u.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 ml-4">
                            <div className="text-right">
                              <p className="font-semibold text-green-400">
                                ${u.walletBalance?.toFixed(2) || "0.00"}
                              </p>
                              <p className="text-xs text-slate-400">Balance</p>
                            </div>
                            <Button
                              onClick={() => deleteUser(u.id)}
                              variant="ghost"
                              className="text-red-400 hover:text-red-600 hover:bg-red-900/20"
                              size="sm"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
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
                              {trans.amount?.toFixed(2) || "0.00"}
                            </p>
                            <p>
                              <strong>Description:</strong>{" "}
                              {trans.description || "No description"}
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
                    <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
                      {pendingTransactions.map((trans) => (
                        <div
                          key={trans.id}
                          className="p-4 bg-slate-700 rounded-lg border border-slate-600 hover:bg-slate-700/80 transition"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white truncate">
                                {trans.userName}
                              </p>
                              <p className="text-sm text-slate-400 truncate">
                                {trans.description || "No description"}
                              </p>
                            </div>
                            <p className="text-lg font-bold text-green-400 ml-4">
                              ${trans.amount?.toFixed(2) || "0.00"}
                            </p>
                          </div>
                          <p className="text-xs text-slate-400 mb-3">
                            {formatDateTime(trans.createdAt)}
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
                                user && approveTransaction(trans.id, user.id)
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
                            {u.name} ({u.email}) - $
                            {u.walletBalance?.toFixed(2) || "0.00"}
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
            <TabsContent value="withdrawals" className="mt-6 space-y-6">
              {/* Pending Withdrawals */}
              <Card className="border-slate-700 bg-slate-800">
                <CardHeader className="sticky top-0 bg-slate-800 z-10">
                  <CardTitle className="text-white">
                    Pending Withdrawal Requests
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Approve or reject user withdrawal requests
                  </CardDescription>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search by user name..."
                      value={withdrawalSearch}
                      onChange={(e) => setWithdrawalSearch(e.target.value)}
                      className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {pendingWithdrawals.filter((w) =>
                    w.userName
                      .toLowerCase()
                      .includes(withdrawalSearch.toLowerCase())
                  ).length === 0 ? (
                    <p className="text-slate-400 text-center py-8">
                      No pending withdrawal requests
                    </p>
                  ) : (
                    <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
                      {pendingWithdrawals
                        .filter((w) =>
                          w.userName
                            .toLowerCase()
                            .includes(withdrawalSearch.toLowerCase())
                        )
                        .map((withdrawal) => (
                          <div
                            key={withdrawal.id}
                            className="p-4 bg-slate-700 rounded-lg border border-slate-600 hover:bg-slate-700/80 transition"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white truncate">
                                  {withdrawal.userName}
                                </p>
                                <p className="text-sm text-slate-400">
                                  Amount: ₹
                                  {withdrawal.amount?.toFixed(2) || "0.00"}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                  {formatDateTime(withdrawal.createdAt)}
                                </p>
                              </div>
                              <div className="text-right ml-4">
                                <p className="text-lg font-bold text-purple-400">
                                  ₹{withdrawal.amount?.toFixed(2) || "0.00"}
                                </p>
                                <p className="text-xs text-slate-400">
                                  Requested
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

              {/* All Withdrawals */}
              <Card className="border-slate-700 bg-slate-800">
                <CardHeader className="sticky top-0 bg-slate-800 z-10">
                  <CardTitle className="text-white">All Withdrawals</CardTitle>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search by user name..."
                      value={withdrawalSearch}
                      onChange={(e) => setWithdrawalSearch(e.target.value)}
                      className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredWithdrawals.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">
                      No withdrawals found
                    </p>
                  ) : (
                    <div className="max-h-[500px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-slate-800">
                          <tr className="border-b border-slate-600">
                            <th className="text-left py-3 px-2 text-slate-300">
                              User
                            </th>
                            <th className="text-left py-3 px-2 text-slate-300">
                              Amount
                            </th>
                            <th className="text-left py-3 px-2 text-slate-300">
                              Status
                            </th>
                            <th className="text-left py-3 px-2 text-slate-300">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredWithdrawals.map((w) => (
                            <tr
                              key={w.id}
                              className="border-b border-slate-700 hover:bg-slate-700/50 transition"
                            >
                              <td className="py-3 px-2 text-white">
                                {w.userName}
                              </td>
                              <td className="py-3 px-2 text-purple-400 font-semibold">
                                ₹{w.amount?.toFixed(2) || "0.00"}
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
                                  {w.status?.charAt(0).toUpperCase() +
                                    w.status?.slice(1) || "Unknown"}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-slate-400">
                                {formatDate(w.createdAt)}
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
            <CardHeader className="sticky top-0 bg-slate-800 z-10">
              <CardTitle className="text-white">All Transactions</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search by user name or description..."
                  value={transactionSearch}
                  onChange={(e) => setTransactionSearch(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <p className="text-slate-400 text-center py-8">
                  No transactions found
                </p>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-800">
                      <tr className="border-b border-slate-600">
                        <th className="text-left py-3 px-2 text-slate-300">
                          User
                        </th>
                        <th className="text-left py-3 px-2 text-slate-300">
                          Amount
                        </th>
                        <th className="text-left py-3 px-2 text-slate-300">
                          Description
                        </th>
                        <th className="text-left py-3 px-2 text-slate-300">
                          Status
                        </th>
                        <th className="text-left py-3 px-2 text-slate-300">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((trans) => (
                        <tr
                          key={trans.id}
                          className="border-b border-slate-700 hover:bg-slate-700/50 transition"
                        >
                          <td className="py-3 px-2 text-white">
                            {trans.userName}
                          </td>
                          <td className="py-3 px-2 text-green-400 font-semibold">
                            ${trans.amount?.toFixed(2) || "0.00"}
                          </td>
                          <td className="py-3 px-2 text-slate-300 max-w-[200px] truncate">
                            {trans.description || "No description"}
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
                              {trans.status?.charAt(0).toUpperCase() +
                                trans.status?.slice(1) || "Unknown"}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-slate-400">
                            {formatDate(trans.createdAt)}
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
