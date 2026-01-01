import { useEffect, useCallback } from "react";

declare global {
  interface Window {
    speak: (text: string, lang: "en-US" | "en-GB") => void;
  }
}

export function useSpeech() {
  const speak = useCallback((text: string, lang: "en-US" | "en-GB" = "en-US") => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang;
      utter.rate = 0.8;
      window.speechSynthesis.speak(utter);
    }
  }, []);

  useEffect(() => {
    window.speak = speak;
    return () => {
      // @ts-expect-error cleanup global function
      delete window.speak;
    };
  }, [speak]);

  return { speak };
}

