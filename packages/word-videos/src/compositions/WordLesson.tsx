import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { wordVideoTheme } from "../theme";
import type { WordLessonProps } from "../types";

export const WordLesson: React.FC<WordLessonProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const totalDuration = Math.max(durationInFrames / fps, 0.001);
  const { wordOnlyEnd, chineseEnd } = wordVideoTheme.timing;
  const t1 = wordOnlyEnd * totalDuration;
  const t2 = chineseEnd * totalDuration;

  const showChinese = t >= t1;
  const showExample = t >= t2;
  const heroWord = !showChinese;

  const { paddingX, wordSizePx, wordSizePxSecondary, chineseSizePx, exampleSizePx, lineHeight } =
    wordVideoTheme.layout;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(165deg, ${wordVideoTheme.colors.backgroundTop} 0%, ${wordVideoTheme.colors.backgroundBottom} 55%, #0f172a 100%)`,
        fontFamily: wordVideoTheme.fontFamily,
        color: wordVideoTheme.colors.word,
      }}
    >
      {props.audioFileName ? <Audio src={staticFile(props.audioFileName)} /> : null}

      <div
        style={{
          position: "absolute",
          top: 56,
          left: paddingX,
          right: paddingX,
          display: "flex",
          justifyContent: "flex-start",
        }}
      >
        <span
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: wordVideoTheme.colors.levelBadge,
            textTransform: "uppercase",
            opacity: 0.95,
          }}
        >
          {props.level} · Word
        </span>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          paddingLeft: paddingX,
          paddingRight: paddingX,
          paddingBottom: 120,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: heroWord ? wordSizePx : wordSizePxSecondary,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: heroWord ? "-0.02em" : "-0.01em",
            color: wordVideoTheme.colors.word,
            textShadow: "0 8px 40px rgba(0,0,0,0.35)",
            maxWidth: "100%",
            wordBreak: "break-word",
          }}
        >
          {props.englishWord}
        </h1>

        {showChinese ? (
          <p
            style={{
              marginTop: 36,
              marginBottom: 0,
              fontSize: chineseSizePx,
              fontWeight: 600,
              lineHeight,
              color: wordVideoTheme.colors.chinese,
              maxWidth: "100%",
            }}
          >
            {props.chineseTranslation}
          </p>
        ) : null}

        {showExample ? (
          <p
            style={{
              marginTop: 40,
              marginBottom: 0,
              fontSize: exampleSizePx,
              fontWeight: 500,
              lineHeight,
              color: wordVideoTheme.colors.example,
              maxWidth: "100%",
            }}
          >
            {props.exampleSentence}
          </p>
        ) : null}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 48,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 22,
          color: wordVideoTheme.colors.accent,
          opacity: 0.55,
          fontWeight: 500,
        }}
      >
        {props.level} vocabulary
      </div>
    </AbsoluteFill>
  );
};
