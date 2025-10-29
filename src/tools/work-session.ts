/**
 * Work Session Tools
 * Manages development work sessions with git tracking
 */

import { getAPIClient } from '../api/client.js';
import { getConfig } from '../config.js';
import {
  getCurrentCommit,
  getCurrentBranch,
  captureWorkSessionChanges,
  isGitRepository,
  hasUncommittedChanges,
} from '../tracking/git-tracker.js';
import { getBranchSessionManager } from '../managers/branch-session-manager.js';

// In-memory session storage (could be moved to file/db if needed)
const activeSessions = new Map<string, WorkSession>();

interface WorkSession {
  taskId: string;
  startedAt: string;
  gitBaseline: string;
  branch: string;
}

/**
 * Start working on a task
 * Captures git baseline for later diff comparison
 */
export async function startWorkOnTask(taskId: string): Promise<{
  success: boolean;
  message: string;
  session?: WorkSession;
}> {
  const config = getConfig();
  const workspacePath = config.workspacePath;

  // Check if workspace is a git repository
  const isRepo = await isGitRepository(workspacePath);
  if (!isRepo) {
    return {
      success: false,
      message: `Workspace ${workspacePath} is not a git repository. Please initialize git first.`,
    };
  }

  // Note: We allow uncommitted changes at start.
  // The diff will be captured from baseline to working directory when completing.

  // Check if task already has an active session
  if (activeSessions.has(taskId)) {
    return {
      success: false,
      message: `Task ${taskId} already has an active work session.`,
    };
  }

  try {
    const apiClient = getAPIClient();
    const branchSessionManager = getBranchSessionManager();

    // Get current git state
    const gitBaseline = await getCurrentCommit(workspacePath);
    const branch = await getCurrentBranch(workspacePath);

    // Update task status to in_progress
    await apiClient.updateTask(taskId, {
      status: 'in_progress',
    });

    // Track task in branch session
    await branchSessionManager.trackTaskInBranch(taskId);

    // Create session
    const session: WorkSession = {
      taskId,
      startedAt: new Date().toISOString(),
      gitBaseline,
      branch,
    };

    // Store active session
    activeSessions.set(taskId, session);

    return {
      success: true,
      message: `Started work session on task ${taskId}`,
      session,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to start work session: ${error.message}`,
    };
  }
}

/**
 * Format changes into markdown description for task (in Japanese)
 */
function formatTaskDescription(summary: string, changes: any): string {
  const { statistics, changes: fileChanges, gitFinal, branch } = changes;

  let description = `## 🎯 実装概要\n\n${summary}\n\n`;

  // Statistics
  description += `## 📊 変更統計\n\n`;
  description += `- **変更ファイル数**: ${statistics.filesChanged}個\n`;
  description += `- **追加行数**: +${statistics.linesAdded}行\n`;
  description += `- **削除行数**: -${statistics.linesRemoved}行\n`;
  description += `- **ブランチ**: \`${branch}\`\n`;
  description += `- **コミット**: \`${gitFinal.substring(0, 7)}\`\n\n`;

  // File list
  description += `## 📁 変更ファイル一覧\n\n`;
  fileChanges.forEach((change: any) => {
    const icon = change.changeType === 'added' ? '➕' :
                 change.changeType === 'deleted' ? '❌' : '✏️';
    description += `${icon} \`${change.file}\` (+${change.linesAdded}/-${change.linesRemoved})\n`;
  });

  description += `\n---\n\n`;
  description += `*詳細な差分はWork Sessionsタブで表示できます。*\n`;

  return description;
}

/**
 * Complete work on a task
 * Captures all changes and logs them to task metadata
 * Updates task description with formatted change summary
 */
export async function completeTaskWork(
  taskId: string,
  summary: string
): Promise<{
  success: boolean;
  message: string;
  changes?: any;
}> {
  const config = getConfig();
  const workspacePath = config.workspacePath;

  // Check if task has an active session
  const session = activeSessions.get(taskId);
  if (!session) {
    return {
      success: false,
      message: `No active work session found for task ${taskId}. Use start_work_on_task first.`,
    };
  }

  try {
    const apiClient = getAPIClient();
    const branchSessionManager = getBranchSessionManager();

    // Capture all changes since baseline (includes uncommitted changes)
    const changes = await captureWorkSessionChanges(
      workspacePath,
      session.gitBaseline
    );

    // Check if any changes were captured
    if (changes.statistics.filesChanged === 0) {
      return {
        success: false,
        message: `⚠️ 変更が検出されませんでした。\n\nベースライン: ${session.gitBaseline}\n現在のHEAD: ${changes.gitFinal}\n\nファイルを編集してから再度実行してください。`,
      };
    }

    // Create work session record
    // Flatten the diff structure to match API schema
    const workSession = {
      sessionId: `session_${Date.now()}`,
      startedAt: session.startedAt,
      completedAt: new Date().toISOString(),
      summary,
      gitBaseline: changes.gitBaseline,
      gitFinal: changes.gitFinal,
      branch: changes.branch,
      statistics: changes.statistics,
      changes: changes.changes.map((change) => ({
        file: change.file,
        changeType: change.changeType,
        linesAdded: change.linesAdded,
        linesRemoved: change.linesRemoved,
        language: change.language,
        oldValue: change.diff.oldValue,  // Flatten from diff.oldValue to oldValue
        newValue: change.diff.newValue,  // Flatten from diff.newValue to newValue
        unifiedDiff: change.unifiedDiff,
      })),
    };

    // Create work session in database (stores in WorkSession and WorkSessionChange tables)
    await apiClient.createWorkSession(taskId, workSession);

    // Format description with change summary
    const description = formatTaskDescription(summary, changes);

    // Update task with description and status
    await apiClient.updateTask(taskId, {
      description,
      status: 'done',
    });

    // Update branch session activity
    await branchSessionManager.updateBranchActivity();

    // Check if we should suggest PR creation
    const prSuggestion = await branchSessionManager.suggestPRCreation();

    // Remove active session
    activeSessions.delete(taskId);

    let completionMessage = `✅ 作業セッションを完了しました。\n- ファイル変更: ${changes.statistics.filesChanged}個\n- 追加: +${changes.statistics.linesAdded}行\n- 削除: -${changes.statistics.linesRemoved}行\n\nタスク説明とメタデータを更新しました。`;

    // Add PR suggestion if available
    if (prSuggestion) {
      completionMessage += `\n\n${prSuggestion}`;
    }

    return {
      success: true,
      message: completionMessage,
      changes: workSession,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to complete work session: ${error.message}`,
    };
  }
}

/**
 * Get active work sessions
 */
export function getActiveSessions(): WorkSession[] {
  return Array.from(activeSessions.values());
}

/**
 * Cancel a work session
 */
export async function cancelWorkSession(taskId: string): Promise<{
  success: boolean;
  message: string;
}> {
  const session = activeSessions.get(taskId);
  if (!session) {
    return {
      success: false,
      message: `No active work session found for task ${taskId}.`,
    };
  }

  try {
    const apiClient = getAPIClient();

    // Revert task status back to todo
    await apiClient.updateTask(taskId, {
      status: 'todo',
    });

    // Remove active session
    activeSessions.delete(taskId);

    return {
      success: true,
      message: `Cancelled work session for task ${taskId}.`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to cancel work session: ${error.message}`,
    };
  }
}
