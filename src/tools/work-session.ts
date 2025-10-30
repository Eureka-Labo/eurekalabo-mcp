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
import * as fs from 'fs';
import * as path from 'path';

// In-memory session storage (could be moved to file/db if needed)
const activeSessions = new Map<string, WorkSession>();

interface WorkSession {
  taskId: string;
  startedAt: string;
  gitBaseline: string | null;
  branch: string | null;
  gitTracked: boolean;
}

/**
 * Get the sessions storage directory
 */
function getSessionsDir(workspacePath: string): string {
  return path.join(workspacePath, '.eureka-sessions');
}

/**
 * Ensure sessions directory exists
 */
function ensureSessionsDir(workspacePath: string): void {
  const sessionsDir = getSessionsDir(workspacePath);
  if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
  }
}

/**
 * Save session to disk
 */
function persistSession(workspacePath: string, session: WorkSession): void {
  try {
    ensureSessionsDir(workspacePath);
    const sessionFile = path.join(getSessionsDir(workspacePath), `${session.taskId}.json`);
    fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2), 'utf8');
  } catch (error) {
    console.error('[Session Persistence] Failed to save session:', error);
  }
}

/**
 * Remove persisted session from disk
 */
function removePersistedSession(workspacePath: string, taskId: string): void {
  try {
    const sessionFile = path.join(getSessionsDir(workspacePath), `${taskId}.json`);
    if (fs.existsSync(sessionFile)) {
      fs.unlinkSync(sessionFile);
    }
  } catch (error) {
    console.error('[Session Persistence] Failed to remove session:', error);
  }
}

/**
 * Load all persisted sessions from disk
 */
function loadPersistedSessions(workspacePath: string): Map<string, WorkSession> {
  const sessions = new Map<string, WorkSession>();

  try {
    const sessionsDir = getSessionsDir(workspacePath);
    if (!fs.existsSync(sessionsDir)) {
      return sessions;
    }

    const files = fs.readdirSync(sessionsDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const sessionFile = path.join(sessionsDir, file);
          const content = fs.readFileSync(sessionFile, 'utf8');
          const session = JSON.parse(content) as WorkSession;
          sessions.set(session.taskId, session);
        } catch (error) {
          console.error(`[Session Persistence] Failed to load session from ${file}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('[Session Persistence] Failed to load sessions:', error);
  }

  return sessions;
}

/**
 * Initialize active sessions from persisted data
 */
export function initializeActiveSessions(workspacePath: string): void {
  const persistedSessions = loadPersistedSessions(workspacePath);
  persistedSessions.forEach((session, taskId) => {
    activeSessions.set(taskId, session);
  });

  if (persistedSessions.size > 0) {
    console.log(`[Session Persistence] Loaded ${persistedSessions.size} active session(s)`);
  }
}

/**
 * Create session marker file for hook validation
 */
function createSessionMarker(workspacePath: string, session: WorkSession): void {
  try {
    const markerPath = path.join(workspacePath, '.eureka-active-session');
    const markerContent = JSON.stringify({
      taskId: session.taskId,
      startedAt: session.startedAt,
      gitTracked: session.gitTracked,
      branch: session.branch,
      gitBaseline: session.gitBaseline,
    }, null, 2);
    fs.writeFileSync(markerPath, markerContent, 'utf8');
  } catch (error) {
    console.error('[Session Marker] Failed to create marker:', error);
  }
}

/**
 * Remove session marker file
 */
function removeSessionMarker(workspacePath: string): void {
  try {
    const markerPath = path.join(workspacePath, '.eureka-active-session');
    if (fs.existsSync(markerPath)) {
      fs.unlinkSync(markerPath);
    }
  } catch (error) {
    console.error('[Session Marker] Failed to remove marker:', error);
  }
}

/**
 * Start working on a task
 * Captures git baseline for later diff comparison (if git is available)
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

    let gitBaseline: string | null = null;
    let branch: string | null = null;

    // Get git state if available
    if (isRepo) {
      gitBaseline = await getCurrentCommit(workspacePath);
      branch = await getCurrentBranch(workspacePath);
    }

    // Update task status to in_progress
    await apiClient.updateTask(taskId, {
      status: 'in_progress',
    });

    // Track task in branch session (only if git is available)
    if (isRepo) {
      await branchSessionManager.trackTaskInBranch(taskId);
    }

    // Create session
    const session: WorkSession = {
      taskId,
      startedAt: new Date().toISOString(),
      gitBaseline,
      branch,
      gitTracked: isRepo,
    };

    // Store active session
    activeSessions.set(taskId, session);

    // Persist session to disk
    persistSession(workspacePath, session);

    // Create session marker file for hook validation
    createSessionMarker(workspacePath, session);

    const trackingMode = isRepo ? 'with git tracking' : 'without git tracking (manual summary required)';
    return {
      success: true,
      message: `Started work session on task ${taskId} ${trackingMode}`,
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
 * Format non-git work session description (in Japanese)
 */
function formatNonGitDescription(summary: string, startedAt: string, completedAt: string): string {
  let description = `## 🎯 実装概要\n\n${summary}\n\n`;

  description += `## ⏰ 作業時間\n\n`;
  description += `- **開始時刻**: ${new Date(startedAt).toLocaleString('ja-JP')}\n`;
  description += `- **完了時刻**: ${new Date(completedAt).toLocaleString('ja-JP')}\n\n`;

  description += `---\n\n`;
  description += `*この作業セッションはgit追跡なしで実行されました。*\n`;

  return description;
}

/**
 * Complete work on a task
 * Captures all changes and logs them to task metadata
 * Updates task description with formatted change summary
 *
 * Note: Returns only summary statistics to avoid token limit issues.
 * Full diffs are stored in the database and viewable in the UI.
 */
export async function completeTaskWork(
  taskId: string,
  summary: string,
  createPR?: boolean
): Promise<{
  success: boolean;
  message: string;
  summary?: {
    filesChanged: number;
    linesAdded: number;
    linesRemoved: number;
    branch: string;
    files: Array<{
      file: string;
      changeType: string;
      linesAdded: number;
      linesRemoved: number;
    }>;
  };
  prCreated?: {
    prUrl: string;
    prNumber: number;
    updatedTasks: number;
  };
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
    const completedAt = new Date().toISOString();

    // Handle git-tracked vs non-git sessions differently
    if (session.gitTracked && session.gitBaseline) {
      // GIT-TRACKED SESSION: Capture changes from git
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
        completedAt,
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

      // Remove active session
      activeSessions.delete(taskId);

      // Remove persisted session
      removePersistedSession(workspacePath, taskId);

      // Remove session marker file
      removeSessionMarker(workspacePath);

      let completionMessage = `✅ 作業セッションを完了しました。\n- ファイル変更: ${changes.statistics.filesChanged}個\n- 追加: +${changes.statistics.linesAdded}行\n- 削除: -${changes.statistics.linesRemoved}行\n\nタスク説明とメタデータを更新しました。`;

      // Handle PR creation if requested
      let prCreatedInfo = undefined;

      if (createPR) {
        // Check if all tasks in branch are completed
        const allCompleted = await branchSessionManager.areAllTasksCompleted();
        const branchSession = await branchSessionManager.getBranchSession();

        if (allCompleted && branchSession && !branchSession.prUrl) {
          // Automatically create PR
          try {
            const { createPullRequest } = await import('./pr-tools.js');
            const prResult = await createPullRequest({});

            if (prResult.success && prResult.prUrl) {
              prCreatedInfo = {
                prUrl: prResult.prUrl,
                prNumber: prResult.prNumber!,
                updatedTasks: prResult.updatedTasks!,
              };

              completionMessage += `\n\n🎉 Pull Requestを自動作成しました！\n- PR URL: ${prResult.prUrl}\n- PR番号: #${prResult.prNumber}\n- 連携タスク数: ${prResult.updatedTasks}件`;
            }
          } catch (prError: any) {
            completionMessage += `\n\n⚠️ PR作成に失敗しました: ${prError.message}\n手動で create_pull_request を実行してください。`;
          }
        } else if (!allCompleted) {
          completionMessage += `\n\n📋 ブランチ内に未完了のタスクがあります。すべてのタスク完了後にPRを作成できます。`;
        } else if (branchSession?.prUrl) {
          completionMessage += `\n\n✅ このブランチのPRは既に存在します: ${branchSession.prUrl}`;
        }
      } else {
        // Show suggestion if not creating PR automatically
        const prSuggestion = await branchSessionManager.suggestPRCreation();
        if (prSuggestion) {
          completionMessage += `\n\n${prSuggestion}`;
        }
      }

      // Return only summary statistics, not full diffs (to avoid token limit issues)
      return {
        success: true,
        message: completionMessage,
        summary: {
          filesChanged: changes.statistics.filesChanged,
          linesAdded: changes.statistics.linesAdded,
          linesRemoved: changes.statistics.linesRemoved,
          branch: changes.branch,
          files: changes.changes.map((c: any) => ({
            file: c.file,
            changeType: c.changeType,
            linesAdded: c.linesAdded,
            linesRemoved: c.linesRemoved,
          })),
        },
        prCreated: prCreatedInfo,
      };
    } else {
      // NON-GIT SESSION: Just use the summary provided
      // Format description with summary only
      const description = formatNonGitDescription(summary, session.startedAt, completedAt);

      // Update task with description and status
      await apiClient.updateTask(taskId, {
        description,
        status: 'done',
      });

      // Remove active session
      activeSessions.delete(taskId);

      // Remove persisted session
      removePersistedSession(workspacePath, taskId);

      // Remove session marker file
      removeSessionMarker(workspacePath);

      const completionMessage = `✅ 作業セッションを完了しました（git追跡なし）。\n\nタスク説明を更新しました。`;

      return {
        success: true,
        message: completionMessage,
      };
    }
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
  const config = getConfig();
  const workspacePath = config.workspacePath;

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

    // Remove persisted session
    removePersistedSession(workspacePath, taskId);

    // Remove session marker file
    removeSessionMarker(workspacePath);

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
