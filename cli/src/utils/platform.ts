/**
 * Platform-specific utilities
 */

import { homedir, platform } from 'os';
import { join } from 'path';

export type Platform = 'darwin' | 'linux' | 'windows';

/**
 * Detect current platform
 */
export function detectPlatform(): Platform {
  const p = platform();

  if (p === 'darwin') return 'darwin';
  if (p === 'win32') return 'windows';
  return 'linux';
}

/**
 * Get npx command for current platform
 */
export function getNpxCommand(): string {
  return detectPlatform() === 'windows' ? 'npx.cmd' : 'npx';
}

/**
 * Get Claude Code configuration directory
 */
export function getClaudeConfigDir(): string {
  const p = detectPlatform();
  const home = homedir();

  switch (p) {
    case 'darwin':
      return join(home, 'Library', 'Application Support', 'Claude');
    case 'linux':
      return join(home, '.config', 'Claude');
    case 'windows':
      return join(home, 'AppData', 'Roaming', 'Claude');
    default:
      throw new Error(`Unsupported platform: ${p}`);
  }
}
