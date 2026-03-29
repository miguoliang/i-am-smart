/**
 * Batch pipeline: CEFR JSON → TTS (macOS say + ffmpeg) → Remotion render → MP4.
 * Run from package dir: pnpm render -- --file ../../apps/pwa/data/cefr-a1.json --limit 5
 */

import { execSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.join(__dirname, "..");

interface CefrEntry {
  englishWord: string;
  chineseTranslation: string;
  exampleSentence: string;
  level: string;
  pos?: string;
  theme?: string;
}

interface CliArgs {
  file: string;
  outDir: string;
  limit: number | null;
  offset: number;
  force: boolean;
  voice: string;
}

function parseArgs(argv: string[]): CliArgs {
  let file = path.join(packageRoot, "../../apps/pwa/data/cefr-a1.json");
  let outDir = path.join(packageRoot, "out");
  let limit: number | null = null;
  let offset = 0;
  let force = false;
  let voice = process.platform === "darwin" ? "Samantha" : "default";

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--file" && argv[i + 1]) {
      file = path.resolve(argv[++i]);
    } else if (a === "--out" && argv[i + 1]) {
      outDir = path.resolve(argv[++i]);
    } else if (a === "--limit" && argv[i + 1]) {
      limit = parseInt(argv[++i], 10);
    } else if (a === "--offset" && argv[i + 1]) {
      offset = parseInt(argv[++i], 10);
    } else if (a === "--force") {
      force = true;
    } else if (a === "--voice" && argv[i + 1]) {
      voice = argv[++i];
    }
  }

  return { file, outDir, limit, offset, force, voice };
}

function slugForEntry(entry: CefrEntry, index: number): string {
  const w = entry.englishWord
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "word";
  return `${entry.level.toLowerCase()}-${String(index).padStart(4, "0")}-${w}`;
}

function shellQuote(s: string): string {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

function requireCmd(name: string, installHint: string): void {
  try {
    execSync(`which ${name}`, { stdio: "pipe" });
  } catch {
    console.error(`Missing dependency: ${name}. ${installHint}`);
    process.exit(1);
  }
}

function getAudioDurationSeconds(audioPath: string): number {
  const out = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${shellQuote(audioPath)}`,
    { encoding: "utf8" }
  );
  const n = parseFloat(out.trim());
  return Number.isFinite(n) ? n : 1;
}

function synthesizeSpeechMac(text: string, outWav: string, voice: string): void {
  const tmpAiff = `${outWav}.tmp.aiff`;
  try {
    execSync(`say -v ${shellQuote(voice)} -o ${shellQuote(tmpAiff)} ${shellQuote(text)}`, {
      stdio: "pipe",
    });
    execSync(`ffmpeg -y -i ${shellQuote(tmpAiff)} -ac 2 -ar 44100 ${shellQuote(outWav)}`, {
      stdio: "pipe",
    });
  } finally {
    if (existsSync(tmpAiff)) {
      rmSync(tmpAiff);
    }
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  requireCmd("ffmpeg", "Install ffmpeg (e.g. brew install ffmpeg).");
  requireCmd("ffprobe", "Install ffmpeg (ffprobe included).");

  if (process.platform !== "darwin") {
    console.error(
      "TTS: this pipeline uses macOS `say` by default. On Linux, patch scripts/pipeline.ts to use espeak-ng or Piper."
    );
    process.exit(1);
  }

  if (!existsSync(args.file)) {
    console.error(`File not found: ${args.file}`);
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(args.file, "utf8")) as CefrEntry[];
  if (!Array.isArray(raw)) {
    console.error("JSON must be an array.");
    process.exit(1);
  }

  mkdirSync(args.outDir, { recursive: true });
  const tmpDir = path.join(args.outDir, ".tmp");
  mkdirSync(tmpDir, { recursive: true });

  console.log("Bundling Remotion project (once per run)…");
  const serveUrl = await bundle({
    entryPoint: path.join(packageRoot, "src/index.ts"),
    publicDir: path.join(packageRoot, "public"),
    webpackOverride: (c) => c,
  });

  const slice = raw.slice(args.offset, args.limit != null ? args.offset + args.limit : undefined);

  const manifest: Array<{ slug: string; file: string; ok: boolean; error?: string }> = [];

  for (let i = 0; i < slice.length; i++) {
    const globalIndex = args.offset + i;
    const entry = slice[i];
    const slug = slugForEntry(entry, globalIndex);
    const outFile = path.join(args.outDir, `${slug}.mp4`);

    if (existsSync(outFile) && !args.force) {
      console.log(`[skip] ${slug} (exists)`);
      manifest.push({ slug, file: outFile, ok: true });
      continue;
    }

    const ttsText = `${entry.englishWord}. ${entry.exampleSentence}`;
    const wavPath = path.join(tmpDir, `${slug}.wav`);

    try {
      console.log(`[tts] ${slug}`);
      synthesizeSpeechMac(ttsText, wavPath, args.voice);

      let durationSeconds = getAudioDurationSeconds(wavPath);
      durationSeconds = Math.min(15, Math.max(0.8, durationSeconds + 0.25));

      const publicAudioRel = "narration.wav";
      const bundlePublicDir = path.join(serveUrl, "public");
      mkdirSync(bundlePublicDir, { recursive: true });
      copyFileSync(wavPath, path.join(bundlePublicDir, publicAudioRel));

      const inputProps = {
        englishWord: entry.englishWord,
        chineseTranslation: entry.chineseTranslation,
        exampleSentence: entry.exampleSentence,
        level: entry.level,
        durationSeconds,
        audioFileName: publicAudioRel,
      };

      console.log(`[render] ${slug} (~${durationSeconds.toFixed(2)}s)`);

      const composition = await selectComposition({
        serveUrl,
        id: "WordLesson",
        inputProps,
      });

      await renderMedia({
        composition,
        serveUrl,
        codec: "h264",
        outputLocation: outFile,
        inputProps,
        chromiumOptions: {
          disableWebSecurity: true,
        },
      });

      manifest.push({ slug, file: outFile, ok: true });
      console.log(`[ok] ${outFile}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[fail] ${slug}: ${msg}`);
      manifest.push({ slug, file: outFile, ok: false, error: msg });
    }
  }

  const manifestPath = path.join(args.outDir, "manifest.json");
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`\nWrote ${manifestPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
