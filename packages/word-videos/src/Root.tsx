import React from "react";
import { Composition } from "remotion";
import { WordLesson } from "./compositions/WordLesson";
import type { WordLessonProps } from "./types";
import { wordVideoTheme } from "./theme";

const defaultProps: WordLessonProps = {
  englishWord: "water",
  chineseTranslation: "水",
  exampleSentence: "I drink water every day.",
  level: "A1",
  durationSeconds: 12,
  audioFileName: "",
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="WordLesson"
        component={WordLesson as unknown as React.ComponentType<Record<string, unknown>>}
        defaultProps={defaultProps as unknown as Record<string, unknown>}
        calculateMetadata={async ({ props }) => {
          const p = props as unknown as WordLessonProps;
          const fps = wordVideoTheme.fps;
          const raw = Number(p.durationSeconds ?? 12);
          const dur = Math.max(
            1,
            Math.min(Number.isFinite(raw) ? raw : 12, wordVideoTheme.maxDurationSeconds)
          );
          return {
            durationInFrames: Math.ceil(dur * fps),
            width: wordVideoTheme.width,
            height: wordVideoTheme.height,
            fps,
          };
        }}
      />
    </>
  );
};
