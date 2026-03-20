import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const merged = {};
for (let i = 0; i < 10; i++) {
  const p = path.join(__dirname, `cefr-c2-zh-chunk-${i}.json`);
  const chunk = JSON.parse(fs.readFileSync(p, "utf8"));
  for (const k of Object.keys(chunk)) {
    if (Object.prototype.hasOwnProperty.call(merged, k)) {
      console.error(`Duplicate key across chunk files: ${JSON.stringify(k)}`);
      process.exit(1);
    }
    merged[k] = chunk[k];
  }
}

const dataPath = path.join(__dirname, "..", "data", "cefr-c2.json");
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

const missing = [];
for (const entry of data) {
  const w = entry.englishWord;
  const cur = entry.chineseTranslation;
  if (typeof cur === "string" && cur.trim()) continue;
  if (merged[w] === undefined) {
    missing.push(w);
  } else {
    entry.chineseTranslation = merged[w];
  }
}

for (const entry of data) {
  if (!entry.chineseTranslation?.trim()) {
    missing.push(entry.englishWord);
  }
}

if (missing.length > 0) {
  console.error("Missing translations for:", missing);
  process.exit(1);
}

if (Object.keys(merged).length !== 2064) {
  console.error("Expected 2064 keys in merged map, got", Object.keys(merged).length);
  process.exit(1);
}

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log("Updated", dataPath, "entries:", data.length);
