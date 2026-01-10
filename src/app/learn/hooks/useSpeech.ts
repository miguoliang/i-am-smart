import { useCallback } from "react";

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

  return { speak };
}

