---
name: ket-flashcard-printables
description: >-
  Generate printable image-only KET noun flashcard stickers from the project
  vocabulary. Use when the user asks for KET flashcards, sticker sheets,
  printable word cards, A4 flashcard layouts, or to expand printables under
  printables/ket-flashcards/.
---

# KET Flashcard Printables

Reusable workflow for physical sticker / flashcard prototypes. Capture layout and selection rules only — do not turn this into a heavy pipeline.

## When to Use

- User wants printable KET (A1/A2) noun stickers or flashcard sheets
- Expanding or regenerating files under `printables/ket-flashcards/`
- Reviewing whether a word is worth illustrating

## Sources of Truth

- Vocabulary: `ShankaHero/Resources/Vocabulary/cefr-a1.json` + `cefr-a2.json`
- KET scope: A1 + A2 (`ExamScope` / `ExamWordScope.ket`)
- Existing pack: `printables/ket-flashcards/` (PDF master + preview PNGs + index)

## Word Selection

**Include** only concrete nouns that a child can recognize from a single centered illustration:

- Food & drink, animals, transport, home objects, clothes, body parts, nature/weather, school/daily objects, sports gear

**Exclude**:

- Abstract nouns (`idea`, `advice`, `problem`, …)
- Relationship / people labels unless clearly depictable as a stock character (prefer skip)
- Grammar, time units, vague place words
- Multi-word or hard-to-depict compounds unless the user explicitly asks
- Duplicates already present in `ket-flashcards-index.txt`

Always verify the English lemma exists as a noun entry in the KET vocab JSON before illustrating.

## Illustration Rules

- Square composition (`1:1`)
- Pure white background
- Single subject, centered, filling most of the frame (~90%)
- Cute flat vector / kid-friendly style
- **No text, letters, numbers, or readable logos** on the image
- Keep style consistent with existing cards in the pack

## Page Layout Spec

| Spec | Value |
| --- | --- |
| Paper | A4 portrait, 300 DPI for the print PDF |
| Card size | ~4.95 × 4.95 cm square (must stay within 9 × 5 cm) |
| Grid | 4 columns × 6 rows = 24 cards/page max |
| Gaps | None between cards; shared light-gray cut lines only |
| Margins | Flush top and left; right may leave a thin scrap strip |
| Card fill | White; illustration ~92% of card, slight edge feather OK |
| Content | Image only — no word labels on the printable |

## Deliverables

Write under `printables/ket-flashcards/` (or a dated sibling folder if regenerating a full new pack):

1. **`ket-flashcards-a4.pdf`** — multi-page print master (300 DPI). This is the file to print.
2. **`ket-flashcards-a4-pNN.png`** — one PNG per page for GitHub/PR review. Compress each to **&lt; 500KB** (quantize + modest downscale is fine; do not shrink the PDF).
3. **`ket-flashcards-index.txt`** — page-by-page word list.
4. Update **`README.md`** if specs or counts change.

Print note for README: use actual size / 100% scale; borderless printers preferred.

## Workflow

1. Diff requested theme/words against `ket-flashcards-index.txt` and vocab JSON.
2. Generate only new missing illustrations.
3. Relayout all (or append pages) with the grid spec above.
4. Export PDF + compressed preview PNGs + refreshed index.
5. Commit on a `cursor/...-5567` branch and open/update a PR for review. Do not merge unless asked.

## Do Not

- Illustrate every noun in the vocab “for completeness”
- Put English/Chinese labels on the sticker sheets unless the user asks
- Commit multi‑MB preview PNGs
- Change app code or vocab JSON for a printables-only task
- Re-derive card size / margins from scratch — use this skill’s table
