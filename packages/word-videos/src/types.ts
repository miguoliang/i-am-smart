export interface WordLessonProps {
  englishWord: string;
  chineseTranslation: string;
  exampleSentence: string;
  level: string;
  /** Audio duration in seconds (from TTS), capped before render */
  durationSeconds: number;
  /**
   * File name under `public/` for Remotion staticFile(), e.g. `narration.wav`.
   * Pipeline copies TTS output there before each render.
   */
  audioFileName: string;
}
