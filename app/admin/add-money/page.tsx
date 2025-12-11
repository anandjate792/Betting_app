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

export default function AddMoneyPage() {
  const { users, addMoneyToWallet } = useAppStore();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [moneyAmount, setMoneyAmount] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      await useAppStore.getState().fetchUsers();
    } catch (error) {
      console.error("Failed to load users:", error);
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

  const regularUsers = users.filter((u) => u.role === "user");

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Add Money to Wallet</CardTitle>
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
    </div>
  );
}

