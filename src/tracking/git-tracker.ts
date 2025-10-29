/**
 * Git Diff Tracker
 * Captures file changes and formats them for react-diff-viewer
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface FileDiff {
  file: string;
  changeType: 'added' | 'modified' | 'deleted';
  linesAdded: number;
  linesRemoved: number;
  language: string;
  diff: {
    oldValue: string;
    newValue: string;
  };
  unifiedDiff: string;
}

export interface WorkSessionChanges {
  gitBaseline: string;
  gitFinal: string;
  branch: string;
  changes: FileDiff[];
  statistics: {
    filesChanged: number;
    linesAdded: number;
    linesRemoved: number;
  };
}

/**
 * Detect programming language from file extension
 */
export function detectLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();

  const languageMap: Record<string, string> = {
    'ts': 'typescript',
    'tsx': 'typescript',
    'js': 'javascript',
    'jsx': 'javascript',
    'py': 'python',
    'go': 'go',
    'rs': 'rust',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'h': 'c',
    'hpp': 'cpp',
    'cs': 'csharp',
    'rb': 'ruby',
    'php': 'php',
    'swift': 'swift',
    'kt': 'kotlin',
    'scala': 'scala',
    'md': 'markdown',
    'json': 'json',
    'yml': 'yaml',
    'yaml': 'yaml',
    'xml': 'xml',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'sh': 'bash',
    'bash': 'bash',
    'zsh': 'bash',
    'sql': 'sql',
    'graphql': 'graphql',
    'prisma': 'prisma',
  };

  return languageMap[ext || ''] || 'text';
}

/**
 * Execute git command in workspace directory
 */
async function execGit(command: string, workspacePath: string): Promise<string> {
  try {
    const { stdout } = await execAsync(command, {
      cwd: workspacePath,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large diffs
    });
    return stdout.trim();
  } catch (error: any) {
    // Return empty string for certain expected errors
    if (error.code === 128 || error.message.includes('does not exist')) {
      return '';
    }
    throw error;
  }
}

/**
 * Get current git commit hash
 */
export async function getCurrentCommit(workspacePath: string): Promise<string> {
  return execGit('git rev-parse HEAD', workspacePath);
}

/**
 * Get current git branch
 */
export async function getCurrentBranch(workspacePath: string): Promise<string> {
  return execGit('git rev-parse --abbrev-ref HEAD', workspacePath);
}

/**
 * Get list of changed files between baseline and current state
 * Includes both committed and uncommitted changes
 */
async function getChangedFiles(
  workspacePath: string,
  baselineCommit: string
): Promise<Array<{ file: string; status: string }>> {
  // Get changes from baseline to working directory (includes uncommitted changes)
  const output = await execGit(
    `git diff --name-status ${baselineCommit}`,
    workspacePath
  );

  if (!output) {
    return [];
  }

  return output.split('\n').map((line) => {
    const [status, file] = line.split('\t');
    return { file, status };
  });
}

/**
 * Get file content at specific commit
 */
async function getFileAtCommit(
  workspacePath: string,
  filePath: string,
  commit: string
): Promise<string> {
  try {
    return await execGit(`git show ${commit}:${filePath}`, workspacePath);
  } catch (error) {
    // File doesn't exist at this commit (newly added or deleted)
    return '';
  }
}

/**
 * Get unified diff for a file
 * Includes uncommitted changes in working directory
 */
async function getUnifiedDiff(
  workspacePath: string,
  filePath: string,
  baselineCommit: string
): Promise<string> {
  try {
    // Compare baseline with working directory (includes uncommitted changes)
    return await execGit(
      `git diff ${baselineCommit} -- ${filePath}`,
      workspacePath
    );
  } catch (error) {
    return '';
  }
}

/**
 * Parse diff stats (lines added/removed)
 */
function parseDiffStats(unifiedDiff: string): { added: number; removed: number } {
  const lines = unifiedDiff.split('\n');
  let added = 0;
  let removed = 0;

  for (const line of lines) {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      added++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      removed++;
    }
  }

  return { added, removed };
}

/**
 * Determine change type based on file status
 */
function determineChangeType(status: string): 'added' | 'modified' | 'deleted' {
  if (status === 'A') return 'added';
  if (status === 'D') return 'deleted';
  return 'modified';
}

/**
 * Get current file content from working directory
 */
async function getCurrentFileContent(
  workspacePath: string,
  filePath: string
): Promise<string> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const fullPath = path.join(workspacePath, filePath);
    return await fs.readFile(fullPath, 'utf-8');
  } catch (error) {
    // File doesn't exist (deleted)
    return '';
  }
}

/**
 * Capture diff for a single file
 * Includes uncommitted changes in working directory
 */
export async function captureFileDiff(
  workspacePath: string,
  filePath: string,
  status: string,
  baselineCommit: string
): Promise<FileDiff> {
  const changeType = determineChangeType(status);

  // Get file contents at baseline and current state
  const oldContent = await getFileAtCommit(workspacePath, filePath, baselineCommit);
  // Get current file from working directory (includes uncommitted changes)
  const newContent = await getCurrentFileContent(workspacePath, filePath);

  // Get unified diff
  const unifiedDiff = await getUnifiedDiff(workspacePath, filePath, baselineCommit);

  // Parse stats
  const stats = parseDiffStats(unifiedDiff);

  return {
    file: filePath,
    changeType,
    linesAdded: stats.added,
    linesRemoved: stats.removed,
    language: detectLanguage(filePath),
    diff: {
      oldValue: oldContent,
      newValue: newContent,
    },
    unifiedDiff,
  };
}

/**
 * Capture all changes between baseline and current state
 */
export async function captureWorkSessionChanges(
  workspacePath: string,
  baselineCommit: string
): Promise<WorkSessionChanges> {
  // Get current state
  const currentCommit = await getCurrentCommit(workspacePath);
  const currentBranch = await getCurrentBranch(workspacePath);

  // Get changed files
  const changedFiles = await getChangedFiles(workspacePath, baselineCommit);

  // Capture diff for each file
  const changes = await Promise.all(
    changedFiles.map((file) =>
      captureFileDiff(workspacePath, file.file, file.status, baselineCommit)
    )
  );

  // Calculate statistics
  const statistics = {
    filesChanged: changes.length,
    linesAdded: changes.reduce((sum, change) => sum + change.linesAdded, 0),
    linesRemoved: changes.reduce((sum, change) => sum + change.linesRemoved, 0),
  };

  return {
    gitBaseline: baselineCommit,
    gitFinal: currentCommit,
    branch: currentBranch,
    changes,
    statistics,
  };
}

/**
 * Check if workspace is a git repository
 */
export async function isGitRepository(workspacePath: string): Promise<boolean> {
  try {
    await execGit('git rev-parse --git-dir', workspacePath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if there are uncommitted changes
 */
export async function hasUncommittedChanges(workspacePath: string): Promise<boolean> {
  const output = await execGit('git status --porcelain', workspacePath);
  return output.length > 0;
}
