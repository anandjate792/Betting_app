"use client";

import { useEffect, useRef } from "react";

export default function WinLossVoice({
  result,
  amount,
  slotNumber,
}: {
  result: "win" | "loss" | null;
  amount?: number;
  slotNumber?: number;
}) {
  const hasPlayed = useRef(false);

  useEffect(() => {
    if (!result || hasPlayed.current) return;

    if ("speechSynthesis" in window) {
      let message = "";
      
      if (result === "win") {
        message = amount 
          ? `You win ₹${amount} on slot ${slotNumber || ""}`
          : `You win on slot ${slotNumber || ""}`;
      } else if (result === "loss") {
        message = amount 
          ? `You loss ₹${amount} on slot ${slotNumber || ""}`
          : `You loss on slot ${slotNumber || ""}`;
      }
      
      const msg = new SpeechSynthesisUtterance(message);

      msg.lang = "en-IN"; // sounds good for Indian accent
      msg.rate = 1;
      msg.pitch = 1;
      msg.volume = 1;

      window.speechSynthesis.cancel(); // stop any previous speech
      window.speechSynthesis.speak(msg);

      hasPlayed.current = true; // prevent replay
    }
  }, [result, amount, slotNumber]);

  // Reset hasPlayed when result becomes null (new slot starts)
  useEffect(() => {
    if (!result) {
      hasPlayed.current = false;
    }
  }, [result]);

  return null;
}
