import sharp from "sharp";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svgPath = join(root, "public", "pwa-icon.svg");
const outPath = join(root, "public", "pwa-icon-28.png");

const svg = readFileSync(svgPath);
await sharp(svg).resize(28, 28).png().toFile(outPath);
console.log("Written:", outPath);
