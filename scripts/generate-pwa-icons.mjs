import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const iconsDir = join(root, 'public', 'icons');

if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

const svgBuffer = readFileSync(join(iconsDir, 'icon.svg'));

const targets = [
  // Standard "any" icons — content goes edge to edge
  { name: 'icon-192.png', size: 192, padding: 0, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  { name: 'icon-512.png', size: 512, padding: 0, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  // Maskable icons — content stays in safe zone (80% of canvas)
  { name: 'icon-maskable-192.png', size: 192, padding: 24, background: { r: 59, g: 130, b: 246, alpha: 1 } },
  { name: 'icon-maskable-512.png', size: 512, padding: 64, background: { r: 59, g: 130, b: 246, alpha: 1 } },
  // Apple touch icon
  { name: 'apple-touch-icon.png', size: 180, padding: 0, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  // Favicons
  { name: 'favicon-32.png', size: 32, padding: 0, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  { name: 'favicon-16.png', size: 16, padding: 0, background: { r: 0, g: 0, b: 0, alpha: 0 } },
];

for (const t of targets) {
  const inner = t.size - t.padding * 2;
  const resized = await sharp(svgBuffer)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: t.size,
      height: t.size,
      channels: 4,
      background: t.background,
    },
  })
    .composite([{ input: resized, top: t.padding, left: t.padding }])
    .png({ compressionLevel: 9 })
    .toFile(join(iconsDir, t.name));

  console.log(`✓ Generated ${t.name} (${t.size}x${t.size})`);
}

console.log('\n✅ All PWA icons generated successfully!');
