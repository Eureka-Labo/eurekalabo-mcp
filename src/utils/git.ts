/**
 * Git utility functions
 */

import { execSync } from 'child_process';

/**
 * Get the remote repository URL from git config
 * @param cwd Working directory (defaults to process.cwd())
 * @returns Remote URL or null if not found
 */
export function getGitRemoteUrl(cwd: string = process.cwd()): string | null {
  try {
    // Try to get the remote URL from origin
    const remoteUrl = execSync('git config --get remote.origin.url', {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'], // Suppress stderr
    }).trim();

    if (!remoteUrl) {
      return null;
    }

    // Normalize GitHub URLs to HTTPS format
    return normalizeGitUrl(remoteUrl);
  } catch (error) {
    // Not a git repository or no remote configured
    return null;
  }
}

/**
 * Normalize git URLs to a consistent format
 * Converts SSH URLs to HTTPS format for easier matching
 *
 * Examples:
 * - git@github.com:user/repo.git -> https://github.com/user/repo
 * - https://github.com/user/repo.git -> https://github.com/user/repo
 * - https://github.com/user/repo -> https://github.com/user/repo
 */
export function normalizeGitUrl(url: string): string {
  // Remove .git suffix
  let normalized = url.replace(/\.git$/, '');

  // Convert SSH format to HTTPS
  // git@github.com:user/repo -> https://github.com/user/repo
  normalized = normalized.replace(/^git@([^:]+):(.+)$/, 'https://$1/$2');

  // Ensure https://
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }

  return normalized;
}

/**
 * Check if the current directory is a git repository
 */
export function isGitRepository(cwd: string = process.cwd()): boolean {
  try {
    execSync('git rev-parse --git-dir', {
      cwd,
      stdio: 'ignore',
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get current git branch name
 */
export function getCurrentBranch(cwd: string = process.cwd()): string | null {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
    return branch || null;
  } catch (error) {
    return null;
  }
}
