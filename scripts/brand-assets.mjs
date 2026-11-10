/**
 * Regenerates every logo-derived file in public/ from public/logo.svg (the
 * supplied brand mark): favicon.svg, favicon-16/32.png, favicon.ico,
 * apple-touch-icon.png, icon-192/512.png and the maskable icon.
 * The wordmark is wide, so each icon is the wordmark centred on a paper square.
 *
 * Uses `sharp`, which is already installed as a dependency of the AI tooling.
 * Run: node scripts/brand-assets.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const PUBLIC = path.resolve('public');
const PAPER = '#efefee';
const BLUE = '#2563ff';
const LOGO_W = 291.27;
const LOGO_H = 132.09;

const source = fs.readFileSync(path.join(PUBLIC, 'logo.svg'), 'utf8');
const paths = [...source.matchAll(/<path[^>]*\/>/g)]
  .map((m) => m[0].replace(/ class="cls-1"/, ` fill="${BLUE}"`))
  .join('');

/** The wordmark centred on a square, occupying `fill` of its width. */
function iconSvg(size, fill) {
  const k = (size * fill) / LOGO_W;
  const x = (size - LOGO_W * k) / 2;
  const y = (size - LOGO_H * k) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="${PAPER}"/><g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${k.toFixed(4)})">${paths}</g></svg>`;
}

const png = (size, fill) => sharp(Buffer.from(iconSvg(size, fill)), { density: 384 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

fs.writeFileSync(path.join(PUBLIC, 'favicon.svg'), iconSvg(64, 0.88));

const outputs = {
  'favicon-16x16.png': await png(16, 0.96),
  'favicon-32x32.png': await png(32, 0.94),
  'apple-touch-icon.png': await png(180, 0.8),
  'icon-192.png': await png(192, 0.8),
  'icon-512.png': await png(512, 0.8),
  'icon-maskable-512.png': await png(512, 0.55),
};
for (const [name, data] of Object.entries(outputs)) fs.writeFileSync(path.join(PUBLIC, name), data);

// favicon.ico: two PNG images (16 and 32) in an ICO container.
const images = [
  { size: 16, data: outputs['favicon-16x16.png'] },
  { size: 32, data: outputs['favicon-32x32.png'] },
];
const header = Buffer.alloc(6 + images.length * 16);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach((img, i) => {
  const at = 6 + i * 16;
  header.writeUInt8(img.size, at);
  header.writeUInt8(img.size, at + 1);
  header.writeUInt16LE(1, at + 4);
  header.writeUInt16LE(32, at + 6);
  header.writeUInt32LE(img.data.length, at + 8);
  header.writeUInt32LE(offset, at + 12);
  offset += img.data.length;
});
fs.writeFileSync(path.join(PUBLIC, 'favicon.ico'), Buffer.concat([header, ...images.map((i) => i.data)]));

console.log('wrote favicon.svg, favicon.ico and', Object.keys(outputs).join(', '));
