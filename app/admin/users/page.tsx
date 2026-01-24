"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { UserPlusIcon } from "lucide-react";
import { predictionApi } from "@/lib/api";

export default function UsersPage() {
  const { users, deleteUser, createUser, transactions, totalTransactions, user } = useAppStore();
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);
  const [autoCreateEnabled, setAutoCreateEnabled] = useState(false);

  useEffect(() => {
    loadUsers();
    loadTransactions();
    loadAutoCreate();
  }, []);

  const loadTransactions = async () => {
    try {
      await useAppStore.getState().fetchTransactions(10, 0);
    } catch (error) {
      console.error("Failed to load transactions:", error);
    }
  };

  const loadAutoCreate = async () => {
    try {
      const status = await predictionApi.getAutoCreateStatus();
      setAutoCreateEnabled(Boolean((status as any).enabled));
    } catch (error) {
      console.error("Failed to fetch auto-create status:", error);
    }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      await useAppStore.getState().fetchUsers();
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setUsersLoading(false);
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

  const regularUsers = users.filter((u) => u.role === "user");

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              {transactions.filter((t) => t.status === "pending").length}
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
              {totalTransactions || transactions.length}
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
              {autoCreateEnabled ? "Enabled" : "Disabled"}
            </p>
            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  try {
                    await predictionApi.autoCreateSlotToggle(true);
                    setAutoCreateEnabled(true);
                  } catch (error) {
                    console.error("Failed to toggle auto-create:", error);
                  }
                }}
                variant={autoCreateEnabled ? "default" : "outline"}
                className={
                  autoCreateEnabled ? "bg-green-600 hover:bg-green-700" : ""
                }
                size="sm"
              >
                Enable
              </Button>
              <Button
                onClick={async () => {
                  try {
                    await predictionApi.autoCreateSlotToggle(false);
                    setAutoCreateEnabled(false);
                  } catch (error) {
                    console.error("Failed to toggle auto-create:", error);
                  }
                }}
                variant={!autoCreateEnabled ? "default" : "outline"}
                className={
                  !autoCreateEnabled
                    ? "bg-slate-700 hover:bg-slate-600"
                    : ""
                }
                size="sm"
              >
                Disable
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

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
          {usersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="w-6 h-6 text-blue-400" />
              <p className="ml-3 text-slate-400">Loading users...</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3 pr-4">
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
                          ₹{u.walletBalance.toFixed(2)}
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
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

