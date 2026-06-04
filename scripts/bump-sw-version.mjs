// Replaces __BUILD_VERSION__ in public/sw.js with the current timestamp
// so every production build forces a service worker update on clients.

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const swPath = join(__dirname, '..', 'public', 'sw.js');

const source = readFileSync(swPath, 'utf8');

// Build a stable, monotonic version: YYYYMMDD-HHmmss
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const version =
  `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
  `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

// Replace either the placeholder OR an existing version stamp
const updated = source.replace(
  /const CACHE_VERSION = 'ljt-[^']+';/,
  `const CACHE_VERSION = 'ljt-${version}';`
);

if (updated === source) {
  console.warn(
    '[bump-sw-version] No CACHE_VERSION line found in public/sw.js — skipping.'
  );
  process.exit(0);
}

writeFileSync(swPath, updated, 'utf8');
console.log(`✓ Service worker version bumped to: ljt-${version}`);
