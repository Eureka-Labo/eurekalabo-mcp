#!/usr/bin/env node

/**
 * Entry point for EurekaClaude CLI
 * Runs the compiled TypeScript or falls back to tsx
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distIndex = join(__dirname, '../dist/index.js');
const srcIndex = join(__dirname, '../src/index.ts');

// Try to run from dist first, fall back to tsx
if (existsSync(distIndex)) {
  // Production: import compiled JS
  await import(distIndex);
} else if (existsSync(srcIndex)) {
  // Development: use tsx
  const tsx = spawn('npx', ['tsx', srcIndex, ...process.argv.slice(2)], {
    stdio: 'inherit',
    shell: true
  });

  tsx.on('exit', (code) => {
    process.exit(code || 0);
  });
} else {
  console.error('Error: Cannot find CLI entry point');
  console.error('  Expected: ' + distIndex);
  console.error('  Or: ' + srcIndex);
  process.exit(1);
}
