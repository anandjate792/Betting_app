"use client";

import { useEffect, useRef } from "react";

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

    if ("speechSynthesis" in window) {
      const message = totalAmount 
        ? `Bet placed successfully for ₹${totalAmount}`
        : "Bet placed successfully";
      
      const msg = new SpeechSynthesisUtterance(message);

      msg.lang = "en-IN"; // sounds good for Indian accent
      msg.rate = 1;
      msg.pitch = 1;
      msg.volume = 1;

      window.speechSynthesis.cancel(); // stop any previous speech
      window.speechSynthesis.speak(msg);

      hasPlayed.current = true; // prevent replay
    }
  }, [betPlaced, totalAmount]);

  // Reset hasPlayed when betPlaced becomes false (new slot starts)
  useEffect(() => {
    if (!betPlaced) {
      hasPlayed.current = false;
    }
  }, [betPlaced]);

  return null;
}
