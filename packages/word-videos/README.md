# Word lesson videos (Remotion)

Highly automated **vertical (9:16) word explainer clips** from CEFR JSON: **TTS → Remotion → MP4**.

## Prerequisites (macOS)

- **ffmpeg** / **ffprobe** (`brew install ffmpeg`)
- **`say`** (built-in) for English TTS; override voice with `--voice` (see `say -v '?'`)

Linux is not supported out of the box (pipeline exits); add **Piper** / **espeak-ng** in `scripts/pipeline.ts` if needed.

## Layout & timing

- **Visual design**: edit `src/theme.ts` only (colors, fonts, segment timing).
- **Composition**: `src/compositions/WordLesson.tsx` (structure).
- **Default duration**: from TTS length + small padding, capped at **15s** (`theme.maxDurationSeconds`).

## Commands

From repo root:

```bash
pnpm --filter @i-am-smart/word-videos exec tsc --noEmit
```

From `packages/word-videos`:

```bash
# Preview in Remotion Studio (optional)
pnpm dev

# Batch render (example: first 5 A1 words → ./out)
pnpm render -- --file ../../apps/pwa/data/cefr-a1.json --limit 5 --out ./out

# Single word smoke test
pnpm render:demo
```

### CLI flags

| Flag | Description |
|------|-------------|
| `--file` | Path to CEFR JSON array (default: `apps/pwa/data/cefr-a1.json` relative to monorepo) |
| `--out` | Output directory for MP4s + `manifest.json` (default: `./out`) |
| `--limit` | Max number of entries to process |
| `--offset` | Start index in the array |
| `--force` | Re-render even if output MP4 exists |
| `--voice` | macOS `say` voice name (default: `Samantha`) |

## Outputs

- **`<out>/<level>-<index>-<slug>.mp4`** — e.g. `a1-0000-a.mp4`
- **`manifest.json`** — success/failure per slug

## Automation model

1. One **Remotion bundle** per run (`@remotion/bundler`).
2. For each row: **TTS** → WAV → copy into the bundle’s `public/narration.wav` (required for `<Audio />` + `staticFile`).
3. **`renderMedia`** with `inputProps` (word fields + `durationSeconds`).

## Next steps (optional)

- Replace `say` with **Piper** / **Azure TTS** for consistent quality.
- Add **ComfyUI** or static assets as **background** in `WordLesson` once images exist.
- Parallelize renders (watch memory); current script is **sequential** for stability.
