// embed_raster_to_svg.js
// Створює SVG-обгортку з вбудованим PNG/WebP (НЕ векторизація)

const fs = require("fs");
const path = require("path");

const IMG_DIR = path.join(__dirname, "img"); // якщо інша папка — зміни
const exts = new Set([".png", ".webp"]);

function svgWrap(dataUri, width, height) {
  const w = width || 512;
  const h = height || 512;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <image href="${dataUri}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>
</svg>`;
}

// PNG: width/height в IHDR
function readPngSize(buf) {
  if (buf.length < 24) return null;
  const isPng = buf.slice(0, 8).toString("hex") === "89504e470d0a1a0a";
  if (!isPng) return null;
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  return { w, h };
}

// WebP: не дістаємо розмір (для твоїх 2 штук не критично) -> 512x512
function toDataUri(ext, buf) {
  const mime = ext === ".webp" ? "image/webp" : "image/png";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

function main() {
  if (!fs.existsSync(IMG_DIR)) {
    console.error("Не знайдено папку:", IMG_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(IMG_DIR);
  let created = 0;
  let skipped = 0;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!exts.has(ext)) continue;

    const inPath = path.join(IMG_DIR, file);
    const base = path.basename(file, ext);
    const outPath = path.join(IMG_DIR, `${base}.svg`);

    // якщо svg вже є — не перезаписуємо
    if (fs.existsSync(outPath)) { skipped++; continue; }

    const buf = fs.readFileSync(inPath);
    const size = ext === ".png" ? readPngSize(buf) : null;

    const dataUri = toDataUri(ext, buf);
    const svg = svgWrap(dataUri, size?.w, size?.h);

    fs.writeFileSync(outPath, svg, "utf8");
    created++;
  }

  console.log(`Готово. Створено SVG: ${created}, пропущено (вже було): ${skipped}`);
}

main();
