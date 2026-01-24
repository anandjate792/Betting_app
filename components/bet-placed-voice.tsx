"use client";

import { useEffect, useRef } from "react";
import { playSound } from "@/lib/sounds";

export default function BetPlacedVoice({
  betPlaced,
  totalAmount,
}: {
  betPlaced: boolean;
  totalAmount?: number;
}) {
  const hasPlayed = useRef(false);

  useEffect(() => {
    if (!betPlaced || hasPlayed.current) return;

    // Play bet-placed.mp3 sound instead of speech synthesis
    playSound('bet-placed');
    hasPlayed.current = true;
  }, [betPlaced, totalAmount]);

  // Reset hasPlayed when betPlaced becomes false (new slot starts)
  useEffect(() => {
    if (!betPlaced) {
      hasPlayed.current = false;
    }
  }, [betPlaced]);

  return null;
}
