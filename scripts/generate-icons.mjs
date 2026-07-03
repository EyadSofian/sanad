/**
 * Generates the PWA icon set into web/public/icons/ with zero dependencies
 * (hand-rolled PNG encoder over node:zlib).
 *
 * Motif: an upward-open gold arc cradling a floating dot — "سند" (support).
 * Usage: npm run icons
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../web/public/icons');

// ---------- minimal PNG encoder ----------
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- drawing ----------
const clamp01 = (v) => Math.max(0, Math.min(1, v));
/** 1px-feathered edge: signed distance <= 0 is inside. */
const coverage = (dist, feather) => clamp01(0.5 - dist / feather);

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * @param {number} size
 * @param {object} opts
 * @param {boolean} opts.maskable  full-bleed square with content in the 80% safe zone
 * @param {boolean} opts.opaque    no transparent corners (apple-touch-icon)
 */
function drawIcon(size, { maskable = false, opaque = false } = {}) {
  const px = Buffer.alloc(size * size * 4);
  const S = size;
  const cx = S / 2;
  const feather = Math.max(1.25, S / 256);
  const cornerR = maskable || opaque ? 0 : S * 0.22;
  const scale = maskable ? 0.78 : 1; // safe zone for maskable

  // motif geometry (in icon units)
  const arcCy = S * (0.5 + 0.07 * scale);
  const arcR = S * 0.30 * scale;
  const arcW = S * 0.085 * scale;
  const dotCy = S * (0.5 - 0.16 * scale);
  const dotR = S * 0.105 * scale;

  // gold #d9b64a, background gradient night-800 → night-950
  const GOLD = [217, 182, 74];
  const BG_TOP = [16, 31, 54];
  const BG_BOT = [7, 13, 24];

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;

      // rounded-rect alpha
      let shapeAlpha = 1;
      if (cornerR > 0) {
        const qx = Math.abs(x + 0.5 - cx) - (S / 2 - cornerR);
        const qy = Math.abs(y + 0.5 - cx) - (S / 2 - cornerR);
        const dist = Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - cornerR;
        shapeAlpha = coverage(dist, feather);
        if (shapeAlpha === 0) continue; // transparent corner
      }

      // vertical gradient background
      const tGrad = y / S;
      let r = lerp(BG_TOP[0], BG_BOT[0], tGrad);
      let g = lerp(BG_TOP[1], BG_BOT[1], tGrad);
      let b = lerp(BG_TOP[2], BG_BOT[2], tGrad);

      // arc: lower open-top ring segment (cradle)
      const dxA = x + 0.5 - cx;
      const dyA = y + 0.5 - arcCy;
      const ringDist = Math.abs(Math.hypot(dxA, dyA) - arcR) - arcW / 2;
      // keep only the lower ~200° of the ring (angle from +x axis; y grows downward)
      const angle = Math.atan2(dyA, dxA); // -PI..PI, positive = below center
      const arcOpen = angle > -0.35 && angle < Math.PI + 0.35; // open at the top
      let arcCov = arcOpen ? coverage(ringDist, feather) : 0;

      // dot floating above the cradle
      const dotDist = Math.hypot(x + 0.5 - cx, y + 0.5 - dotCy) - dotR;
      const dotCov = coverage(dotDist, feather);

      const goldCov = Math.max(arcCov, dotCov);
      if (goldCov > 0) {
        r = lerp(r, GOLD[0], goldCov);
        g = lerp(g, GOLD[1], goldCov);
        b = lerp(b, GOLD[2], goldCov);
      }

      px[i] = Math.round(r);
      px[i + 1] = Math.round(g);
      px[i + 2] = Math.round(b);
      px[i + 3] = Math.round((opaque ? 1 : shapeAlpha) * 255);
    }
  }
  return encodePng(S, S, px);
}

mkdirSync(OUT, { recursive: true });
const targets = [
  ['icon-192.png', drawIcon(192)],
  ['icon-512.png', drawIcon(512)],
  ['maskable-512.png', drawIcon(512, { maskable: true, opaque: true })],
  ['apple-touch-icon.png', drawIcon(180, { opaque: true })],
];
for (const [name, buf] of targets) {
  writeFileSync(path.join(OUT, name), buf);
  console.log(`✓ ${name} (${buf.length} bytes)`);
}
