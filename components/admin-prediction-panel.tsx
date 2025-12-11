"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Umbrella,
  Fish,
  Egg,
  Coins,
  Star,
  Heart,
  Diamond,
  Spade,
  Club,
  Trophy,
  Crown,
  Gem,
} from "lucide-react";
import { predictionApi } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";

const ICONS = [
  { id: "umbrella", name: "Umbrella", Icon: Umbrella },
  { id: "fish", name: "Fish", Icon: Fish },
  { id: "hen", name: "Hen", Icon: Egg },
  { id: "coin", name: "Coin", Icon: Coins },
  { id: "star", name: "Star", Icon: Star },
  { id: "heart", name: "Heart", Icon: Heart },
  { id: "diamond", name: "Diamond", Icon: Diamond },
  { id: "spade", name: "Spade", Icon: Spade },
  { id: "club", name: "Club", Icon: Club },
  { id: "trophy", name: "Trophy", Icon: Trophy },
  { id: "crown", name: "Crown", Icon: Crown },
  { id: "gem", name: "Gem", Icon: Gem },
];

export default function AdminPredictionPanel() {
  const [currentSlot, setCurrentSlot] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedWinningIcon, setSelectedWinningIcon] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotLoading, setSlotLoading] = useState(true);

  useEffect(() => {
    loadSlots();
    const interval = setInterval(() => {
      loadSlots();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    autoCreateSlots();
    const interval = setInterval(autoCreateSlots, 600000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    autoCompleteExpiredSlots();
    const interval = setInterval(autoCompleteExpiredSlots, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadSlots = async () => {
    setSlotsLoading(true);
    setSlotLoading(true);
    try {
      const allSlots = (await predictionApi.getAllSlots()) as any[];
      setSlots(allSlots);

      const current = await predictionApi.getCurrentSlot().catch(() => null);
      setCurrentSlot(current);
    } catch (error) {
      console.error("Failed to load slots:", error);
    } finally {
      setSlotsLoading(false);
      setSlotLoading(false);
    }
  };

  const autoCreateSlots = async () => {
    try {
      await predictionApi.autoCreateSlot();
      await loadSlots();
    } catch (error) {
      console.error("Failed to auto-create slot:", error);
    }
  };

  const autoCompleteExpiredSlots = async () => {
    try {
      await predictionApi.autoCompleteSlots();
      await loadSlots();
    } catch (error) {
      console.error("Failed to auto-complete slots:", error);
    }
  };

  const handleCompleteSlot = async () => {
    if (!currentSlot || !selectedWinningIcon) {
      setError("Please select a winning icon");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const result = (await predictionApi.completeSlot(
        currentSlot.id,
        selectedWinningIcon
      )) as any;
      setMessage(
        `Slot completed! Winners: ${
          result.totalWinners
        }, Total Payout: ₹${result.totalPayout.toFixed(
          2
        )}, Commission: ₹${result.companyCommission.toFixed(2)}`
      );
      setSelectedWinningIcon("");
      await loadSlots();
    } catch (err: any) {
      setError(err.message || "Failed to complete slot");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white">
            Prediction Game Management
          </CardTitle>
          <CardDescription className="text-slate-400">
            Auto-create slots every 10 minutes and manage active games
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={autoCreateSlots}
            className="bg-green-600 hover:bg-green-700 text-white w-full"
          >
            Create Next Slot Now
          </Button>
          <Button
            onClick={async () => {
              try {
                await autoCompleteExpiredSlots();
                setMessage("Expired slots processed successfully");
              } catch (err: any) {
                setError(err.message || "Failed to process expired slots");
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full"
          >
            Process Expired Slots Now
          </Button>
          <p className="text-xs text-slate-400">
            Auto-complete runs every minute. Expired slots with no admin action
            will automatically declare the icon with least bets as winner.
          </p>
        </CardContent>
      </Card>

      {slotLoading ? (
        <Card className="border-slate-700 bg-slate-800">
          <CardContent className="flex items-center justify-center py-12">
            <Spinner className="w-6 h-6 text-blue-400" />
            <p className="ml-3 text-slate-400">Loading current slot...</p>
          </CardContent>
        </Card>
      ) : currentSlot && (
        <Card className="border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Current Active Slot</CardTitle>
            <CardDescription className="text-slate-400">
              Slot #{currentSlot.slotNumber} • Total Bets:{" "}
              {currentSlot.totalBets} • Total Amount: ₹
              {currentSlot.totalAmount.toFixed(2)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Select Winning Icon
              </label>
              <Select
                value={selectedWinningIcon}
                onValueChange={setSelectedWinningIcon}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Choose winning icon" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {ICONS.map(({ id, name, Icon }) => {
                    const iconData = currentSlot.betsByIcon?.[id] || {
                      totalBets: 0,
                      totalAmount: 0,
                    };
                    return (
                      <SelectItem key={id} value={id} className="text-white">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span>{name}</span>
                          <span className="text-xs text-slate-400">
                            ({iconData.totalBets} bets, ₹
                            {iconData.totalAmount.toFixed(0)})
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
            {message && <p className="text-sm text-green-400">{message}</p>}

            <Button
              onClick={handleCompleteSlot}
              disabled={loading || !selectedWinningIcon}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {loading
                ? "Completing..."
                : "Complete Slot & Distribute Winnings"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Slots</CardTitle>
        </CardHeader>
        <CardContent>
          {slotsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="w-6 h-6 text-blue-400" />
              <p className="ml-3 text-slate-400">Loading slots...</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 pr-4">
                {slots.slice(0, 10).map((slot) => (
              <div
                key={slot.id}
                className="p-3 bg-slate-700 rounded-lg flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-white">
                    Slot #{slot.slotNumber}
                  </p>
                  <p className="text-sm text-slate-400">
                    {new Date(slot.startTime).toLocaleString()} -{" "}
                    {new Date(slot.endTime).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">
                    Status: {slot.status}
                  </p>
                  {slot.winningIcon && (
                    <p className="text-sm text-green-400">
                      Winner: {slot.winningIcon}
                    </p>
                  )}
                  <p className="text-sm text-blue-400">
                    {slot.totalBets} bets • ₹{slot.totalAmount.toFixed(2)}
                  </p>
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
