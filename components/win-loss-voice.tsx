"use client";

import { useEffect, useRef, useState } from "react";

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
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  // Check speech synthesis support on mount
  useEffect(() => {
    setSpeechSupported("speechSynthesis" in window);
    
    // Listen for user interaction
    const handleUserInteraction = () => {
      setHasUserInteracted(true);
      // Remove listeners after first interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  useEffect(() => {
    if (!result || hasPlayed.current) return;

    // Only attempt speech if supported and user has interacted
    if (!speechSupported) {
      console.log('Speech synthesis not supported');
      return;
    }

    if (!hasUserInteracted) {
      console.log('User interaction required for speech synthesis');
      return;
    }

    const speakWithFallback = () => {
      try {
        let message = "";
        
        if (result === "win") {
          message = amount 
            ? `You win ₹${amount} on slot ${slotNumber || ""}`
            : `You win on slot ${slotNumber || ""}`;
        } else if (result === "loss") {
          message = amount 
            ? `You lose ₹${amount} on slot ${slotNumber || ""}`
            : `You lose on slot ${slotNumber || ""}`;
        }
        
        const msg = new SpeechSynthesisUtterance(message);

        msg.lang = "en-IN";
        msg.rate = 1;
        msg.pitch = 1;
        msg.volume = 1;

        // Add event listeners for better error handling
        msg.onstart = () => {
          console.log('Win/Loss speech started');
        };
        
        msg.onend = () => {
          console.log('Win/Loss speech ended');
          hasPlayed.current = true;
        };
        
        msg.onerror = (event) => {
          console.error('Win/Loss speech synthesis error:', event.error);
          // Try fallback with different settings
          if (event.error === 'synthesis-failed') {
            setTimeout(() => speakFallback(), 100);
          } else {
            hasPlayed.current = true;
          }
        };

        // Cancel any previous speech and speak
        window.speechSynthesis.cancel();
        
        // Add a small delay before speaking to ensure proper initialization
        setTimeout(() => {
          window.speechSynthesis.speak(msg);
        }, 50);

      } catch (error) {
        console.error('Failed to initialize win/loss speech synthesis:', error);
        speakFallback();
      }
    };

    const speakFallback = () => {
      try {
        console.log('Attempting fallback win/loss speech synthesis');
        
        let message = "";
        
        if (result === "win") {
          message = amount 
            ? `You win ₹${amount} on slot ${slotNumber || ""}`
            : `You win on slot ${slotNumber || ""}`;
        } else if (result === "loss") {
          message = amount 
            ? `You lose ₹${amount} on slot ${slotNumber || ""}`
            : `You lose on slot ${slotNumber || ""}`;
        }
        
        const msg = new SpeechSynthesisUtterance(message);
        
        // Use default language and simpler settings
        msg.lang = "en-US";
        msg.rate = 0.9;
        msg.pitch = 1;
        msg.volume = 1;

        msg.onend = () => {
          console.log('Fallback win/loss speech ended');
          hasPlayed.current = true;
        };
        
        msg.onerror = (event) => {
          console.error('Fallback win/loss speech also failed:', event.error);
          hasPlayed.current = true; // Prevent infinite retries
        };

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(msg);
        
      } catch (fallbackError) {
        console.error('Fallback win/loss speech failed:', fallbackError);
        hasPlayed.current = true;
      }
    };

    speakWithFallback();
  }, [result, amount, slotNumber, speechSupported, hasUserInteracted]);

  // Reset hasPlayed when result becomes null (new slot starts)
  useEffect(() => {
    if (!result) {
      hasPlayed.current = false;
    }
  }, [result]);

  return null;
}
