/**
 * Pull Request Tools
 * GitHub PR integration for branch sessions
 */

import { getBranchSessionManager } from '../managers/branch-session-manager.js';
import { getCurrentBranch, captureWorkSessionChanges, getCurrentCommit } from '../tracking/git-tracker.js';
import { getConfig } from '../config.js';
import { getAPIClient } from '../api/client.js';

/**
 * List all tasks in the current branch session
 */
export async function listBranchTasks(): Promise<{
  success: boolean;
  message?: string;
  branchName?: string;
  tasks?: any[];
  taskCount?: number;
}> {
  try {
    const config = getConfig();
    const branchSessionManager = getBranchSessionManager();
    const branchName = await getCurrentBranch(config.workspacePath);

    if (branchName === 'main' || branchName === 'master') {
      return {
        success: false,
        message: 'Cannot list branch tasks for main/master branch. Switch to a feature branch first.',
      };
    }

    const tasks = await branchSessionManager.getBranchTasks();

    if (!tasks || tasks.length === 0) {
      return {
        success: true,
        message: `No tasks found in branch "${branchName}". Use start_work_on_task to track tasks in this branch.`,
        branchName,
        tasks: [],
        taskCount: 0,
      };
    }

    return {
      success: true,
      branchName,
      tasks,
      taskCount: tasks.length,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to list branch tasks: ${error.message}`,
    };
  }
}

/**
 * Generate Japanese task description from git changes
 */
function generateTaskDescriptionFromChanges(changes: any, branchName: string): string {
  const { statistics, changes: fileChanges, gitFinal, gitBaseline } = changes;

  let description = `## 🎯 実装概要\n\n`;
  description += `ブランチ \`${branchName}\` での開発作業を完了しました。\n\n`;

  // Statistics
  description += `## 📊 変更統計\n\n`;
  description += `- **変更ファイル数**: ${statistics.filesChanged}個\n`;
  description += `- **追加行数**: +${statistics.linesAdded}行\n`;
  description += `- **削除行数**: -${statistics.linesRemoved}行\n`;
  description += `- **ブランチ**: \`${branchName}\`\n`;
  description += `- **ベースコミット**: \`${gitBaseline.substring(0, 7)}\`\n`;
  description += `- **最終コミット**: \`${gitFinal.substring(0, 7)}\`\n\n`;

  // File list
  description += `## 📁 変更ファイル一覧\n\n`;
  fileChanges.forEach((change: any) => {
    const icon = change.changeType === 'added' ? '➕' :
                 change.changeType === 'deleted' ? '❌' : '✏️';
    description += `${icon} \`${change.file}\` (+${change.linesAdded}/-${change.linesRemoved})\n`;
  });

  description += `\n---\n\n`;
  description += `*この作業内容はPull Requestと連携されています。*\n`;

  return description;
}

/**
 * Generate Japanese task title from branch name
 */
function generateTaskTitleFromBranch(branchName: string): string {
  // Convert branch name to readable title
  // Examples:
  // - "feature/add-auth" -> "認証機能の追加"
  // - "fix/user-login" -> "ユーザーログイン修正"
  // - "refactor/api-client" -> "APIクライアントのリファクタリング"

  const parts = branchName.split('/');
  const prefix = parts[0];
  const name = parts.slice(1).join('/') || parts[0];

  // Clean up the name
  const cleanName = name.replace(/-/g, ' ').replace(/_/g, ' ');

  // Add appropriate suffix based on prefix
  if (prefix === 'feature' || prefix === 'feat') {
    return `${cleanName}の実装`;
  } else if (prefix === 'fix' || prefix === 'bugfix') {
    return `${cleanName}の修正`;
  } else if (prefix === 'refactor') {
    return `${cleanName}のリファクタリング`;
  } else if (prefix === 'docs') {
    return `${cleanName}のドキュメント更新`;
  } else if (prefix === 'test') {
    return `${cleanName}のテスト追加`;
  } else if (prefix === 'chore') {
    return `${cleanName}のメンテナンス`;
  } else {
    return `${cleanName}の作業`;
  }
}

/**
 * Create a pull request for the current branch
 */
export async function createPullRequest(args: {
  title?: string;
  baseBranch?: string;
}): Promise<{
  success: boolean;
  message?: string;
  prUrl?: string;
  prNumber?: number;
  updatedTasks?: number;
  autoCreatedTask?: any;
}> {
  try {
    const config = getConfig();
    const apiClient = getAPIClient();
    const branchSessionManager = getBranchSessionManager();
    const branchName = await getCurrentBranch(config.workspacePath);

    if (branchName === 'main' || branchName === 'master') {
      return {
        success: false,
        message: 'Cannot create PR from main/master branch. Switch to a feature branch first.',
      };
    }

    // Check if branch has any tasks
    let session = await branchSessionManager.getBranchSession();
    let autoCreatedTask = null;

    if (!session || !session.taskIds || session.taskIds.length === 0) {
      // No tasks found - automatically create one from git changes
      try {
        // Get git baseline (first commit in branch or parent branch merge base)
        const gitBaseline = await getGitBaseline(config.workspacePath, branchName);

        // Capture all changes in the branch
        const changes = await captureWorkSessionChanges(config.workspacePath, gitBaseline);

        if (changes.statistics.filesChanged === 0) {
          return {
            success: false,
            message: `ブランチ "${branchName}" に変更が検出されませんでした。ファイルを編集してから再度実行してください。`,
          };
        }

        // Generate task title and description in Japanese
        const taskTitle = generateTaskTitleFromBranch(branchName);
        const taskDescription = generateTaskDescriptionFromChanges(changes, branchName);

        // Create task
        autoCreatedTask = await apiClient.createTask({
          title: taskTitle,
          description: taskDescription,
          status: 'done',
          priority: 'medium',
        });

        console.log(`✅ Auto-created task: ${autoCreatedTask.id} - ${taskTitle}`);

        // Create work session for the task
        const workSession = {
          sessionId: `session_${Date.now()}`,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          summary: taskTitle,
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
            oldValue: change.diff.oldValue,
            newValue: change.diff.newValue,
            unifiedDiff: change.unifiedDiff,
          })),
        };

        await apiClient.createWorkSession(autoCreatedTask.id, workSession);

        // Track task in branch session
        await branchSessionManager.trackTaskInBranch(autoCreatedTask.id);

        // Refresh session
        session = await branchSessionManager.getBranchSession();
      } catch (createError: any) {
        return {
          success: false,
          message: `タスクの自動作成に失敗しました: ${createError.message}\n\n` +
            `手動でタスクを作成してstart_work_on_taskを実行するか、既存のタスクで作業を開始してください。`,
        };
      }
    }

    // Check if PR already exists
    if (session && session.prUrl) {
      return {
        success: false,
        message: `このブランチのPull Requestは既に存在します: ${session.prUrl}`,
      };
    }

    // Auto-generate title if not provided (in Japanese)
    let prTitle: string;
    if (args.title) {
      prTitle = args.title;
    } else {
      const tasks = await branchSessionManager.getBranchTasks();
      if (tasks.length === 1) {
        prTitle = tasks[0].title;
      } else {
        prTitle = `${branchName}: ${tasks.length}件のタスクを完了`;
      }
    }

    // Create PR
    const result = await branchSessionManager.createPullRequest(
      prTitle,
      args.baseBranch
    );

    let message = `✅ Pull Requestを作成しました！\n\n` +
      `PR URL: ${result.prUrl}\n` +
      `PR番号: #${result.prNumber}\n` +
      `連携タスク数: ${result.updatedTasks}件\n\n`;

    if (autoCreatedTask) {
      message += `📝 タスクを自動作成しました: ${autoCreatedTask.title}\n\n`;
    }

    message += `すべてのタスクがこのPRに連携されました。`;

    return {
      success: true,
      message,
      prUrl: result.prUrl,
      prNumber: result.prNumber,
      updatedTasks: result.updatedTasks,
      autoCreatedTask,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Pull Requestの作成に失敗しました: ${error.message}`,
    };
  }
}

/**
 * Get git baseline for the current branch
 * Finds the merge base with main/master branch
 */
async function getGitBaseline(workspacePath: string, branchName: string): Promise<string> {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  try {
    // Try to find merge base with main
    const { stdout: mainBase } = await execAsync('git merge-base HEAD origin/main || git merge-base HEAD main', {
      cwd: workspacePath,
    });
    return mainBase.trim();
  } catch (error) {
    try {
      // Try master if main doesn't exist
      const { stdout: masterBase } = await execAsync('git merge-base HEAD origin/master || git merge-base HEAD master', {
        cwd: workspacePath,
      });
      return masterBase.trim();
    } catch (error2) {
      // Fall back to first commit in the branch
      const { stdout: firstCommit } = await execAsync('git rev-list --max-parents=0 HEAD', {
        cwd: workspacePath,
      });
      return firstCommit.trim().split('\n')[0];
    }
  }
}
