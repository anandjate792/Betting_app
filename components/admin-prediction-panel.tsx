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
import { FaUmbrella, FaFootballBall } from "react-icons/fa";
import {
  GiButterfly,
  GiCow,
  GiEmptyMetalBucketHandle,
  GiKite,
} from "react-icons/gi";
import { WiDaySunny } from "react-icons/wi";
import { MdLight } from "react-icons/md";
import { GiSpinningTop } from "react-icons/gi";
import { GiRose } from "react-icons/gi";
import { GiSparrow } from "react-icons/gi";
import { GiRabbit } from "react-icons/gi";
import { predictionApi } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";

const ICONS = [
  {
    id: "umbrella",
    name: "Umbrella",
    Icon: FaUmbrella,
  },
  {
    id: "football",
    name: "Football",
    Icon: FaFootballBall,
  },
  { id: "sun", name: "Sun", Icon: WiDaySunny },
  { id: "lamp", name: "Lamp", Icon: MdLight },
  { id: "cow", name: "Cow", Icon: GiCow },
  {
    id: "bucket",
    name: "Bucket",
    Icon: GiEmptyMetalBucketHandle,
  },
  { id: "kite", name: "Kite", Icon: GiKite },
  {
    id: "spinning-top",
    name: "Spinning Top",
    Icon: GiSpinningTop,
  },
  { id: "rose", name: "Rose", Icon: GiRose },
  {
    id: "butterfly",
    name: "Butterfly",
    Icon: GiButterfly,
  },
  { id: "sparrow", name: "Sparrow", Icon: GiSparrow },
  { id: "rabbit", name: "Rabbit", Icon: GiRabbit },
];

// Helper function to format slot numbers that restart after 1000
const formatSlotNumber = (slotNumber: number): number => {
  return slotNumber > 1000 ? ((slotNumber - 1) % 1000) + 1 : slotNumber;
};

export default function AdminPredictionPanel() {
  const [currentSlot, setCurrentSlot] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedWinningIcon, setSelectedWinningIcon] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotLoading, setSlotLoading] = useState(true);
  const [slotsSkip, setSlotsSkip] = useState(10);
  const [slotsHasMore, setSlotsHasMore] = useState(true);
  const [loadingMoreSlots, setLoadingMoreSlots] = useState(false);

  useEffect(() => {
    loadSlots(true);
    // Only refresh current slot, not all slots list
    const interval = setInterval(async () => {
      try {
        const current = await predictionApi.getCurrentSlot().catch(() => null);
        setCurrentSlot(current);
      } catch (error) {
        console.error("Failed to refresh current slot:", error);
      }
    }, 30000); // Refresh current slot every 30 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const loadSlots = async (reset = false) => {
    if (reset) {
      setSlotsSkip(10);
      setSlotsHasMore(true);
    }
    if (!reset && !slotsHasMore) return;

    setSlotsLoading(reset);
    setLoadingMoreSlots(!reset);
    setSlotLoading(reset);
    try {
      const allSlots = (await predictionApi.getAllSlots()) as any[];
      // Sort by slot number descending (newest first)
      const sortedSlots = [...allSlots].sort(
        (a, b) => b.slotNumber - a.slotNumber
      );

      if (reset) {
        setSlots(sortedSlots.slice(0, 10));
        setSlotsHasMore(sortedSlots.length > 10);
        setSlotsSkip(10);
      } else {
        const newSlots = sortedSlots.slice(slotsSkip, slotsSkip + 10);
        // Filter out duplicates by checking if slot.id already exists
        setSlots((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const uniqueNewSlots = newSlots.filter((s) => !existingIds.has(s.id));
          return [...prev, ...uniqueNewSlots];
        });
        setSlotsHasMore(sortedSlots.length > slotsSkip + 10);
        setSlotsSkip((prev) => prev + 10);
      }

      const current = await predictionApi.getCurrentSlot().catch(() => null);
      setCurrentSlot(current);
    } catch (error) {
      console.error("Failed to load slots:", error);
    } finally {
      setSlotsLoading(false);
      setSlotLoading(false);
      setLoadingMoreSlots(false);
    }
  };

  const autoCreateSlots = async () => {
    try {
      await predictionApi.autoCreateSlot();
      await loadSlots(true); // Reset to show latest slots
    } catch (error) {
      console.error("Failed to auto-create slot:", error);
    }
  };

  const autoCompleteExpiredSlots = async () => {
    try {
      await predictionApi.autoCompleteSlots();
      await loadSlots(true); // Reset to show latest slots
    } catch (error) {
      console.error("Failed to auto-complete slots:", error);
    }
  };

  const handleCompleteSlot = async () => {
    if (!currentSlot || !selectedWinningIcon) {
      setError("Please select a winning icon");
      return;
    }

    // Prevent manual completion before endTime
    const now = new Date();
    const endTime = new Date(currentSlot.endTime);
    if (now < endTime) {
      const secondsRemaining = Math.ceil((endTime.getTime() - now.getTime()) / 1000);
      setError(`Slot cannot be completed yet. Please wait ${secondsRemaining} more second(s). Slots must remain open for the full 45 seconds.`);
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
      await loadSlots(true); // Reset to show latest slots after completion
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
      ) : (
        currentSlot && (
        <Card className="border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Current Active Slot</CardTitle>
            <CardDescription className="text-slate-400">
              Slot #{formatSlotNumber(currentSlot.slotNumber || 0)} • Total Bets:{" "}
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

            {/* Check if slot has expired */}
            {(() => {
              const now = new Date();
              const endTime = new Date(currentSlot.endTime);
              const isExpired = now >= endTime;
              const secondsRemaining = isExpired ? 0 : Math.ceil((endTime.getTime() - now.getTime()) / 1000);
              
              return (
                <>
                  {!isExpired && (
                    <div className="bg-yellow-900/50 border-2 border-yellow-600 rounded-lg p-3 mb-4">
                      <p className="text-sm text-yellow-300 font-semibold">
                        ⏱️ Slot is still active - {secondsRemaining} second(s) remaining
                      </p>
                      <p className="text-xs text-yellow-400 mt-1">
                        Slots must remain open for the full 45 seconds. Please wait for the slot to expire automatically.
                      </p>
                    </div>
                  )}
                  <Button
                    onClick={handleCompleteSlot}
                    disabled={loading || !selectedWinningIcon || !isExpired}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  >
                    {loading
                      ? "Completing..."
                      : isExpired
                      ? "Complete Slot & Distribute Winnings"
                      : `Wait ${secondsRemaining}s to Complete`}
                  </Button>
                </>
              );
            })()}
          </CardContent>
        </Card>
        )
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
            <>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2 pr-4">
                  {slots.map((slot, index) => {
                    // Use a combination of id and index to ensure unique keys
                    const uniqueKey = slot.id
                      ? `${slot.id}-${index}`
                      : `slot-${index}`;
                    return (
                      <div
                        key={uniqueKey}
                className="p-3 bg-slate-700 rounded-lg flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-white">
                    Slot #{formatSlotNumber(slot.slotNumber)}
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
                            {slot.totalBets} bets • ₹
                            {slot.totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>
                    );
                  })}
                </div>
              </ScrollArea>
              {slotsHasMore && (
                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={() => loadSlots(false)}
                    disabled={loadingMoreSlots}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    {loadingMoreSlots ? (
                      <>
                        <Spinner className="w-4 h-4 mr-2" />
                        Loading...
                      </>
                    ) : (
                      "Load More (10 slots)"
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
