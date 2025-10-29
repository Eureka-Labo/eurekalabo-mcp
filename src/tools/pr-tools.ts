/**
 * Pull Request Tools
 * GitHub PR integration for branch sessions
 */

import { getBranchSessionManager } from '../managers/branch-session-manager.js';
import { getCurrentBranch } from '../tracking/git-tracker.js';
import { getConfig } from '../config.js';

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
}> {
  try {
    const config = getConfig();
    const branchSessionManager = getBranchSessionManager();
    const branchName = await getCurrentBranch(config.workspacePath);

    if (branchName === 'main' || branchName === 'master') {
      return {
        success: false,
        message: 'Cannot create PR from main/master branch. Switch to a feature branch first.',
      };
    }

    // Check if branch has any tasks
    const session = await branchSessionManager.getBranchSession();
    if (!session || !session.taskIds || session.taskIds.length === 0) {
      return {
        success: false,
        message: `Branch "${branchName}" has no tracked tasks. Use start_work_on_task first.`,
      };
    }

    // Check if PR already exists
    if (session.prUrl) {
      return {
        success: false,
        message: `A pull request already exists for this branch: ${session.prUrl}`,
      };
    }

    // Auto-generate title if not provided
    let prTitle: string;
    if (args.title) {
      prTitle = args.title;
    } else {
      const tasks = await branchSessionManager.getBranchTasks();
      if (tasks.length === 1) {
        prTitle = tasks[0].title;
      } else {
        prTitle = `${tasks.length} tasks completed in ${branchName}`;
      }
    }

    // Create PR
    const result = await branchSessionManager.createPullRequest(
      prTitle,
      args.baseBranch
    );

    return {
      success: true,
      message: `✅ Pull request created successfully!\n\n` +
        `PR URL: ${result.prUrl}\n` +
        `PR Number: #${result.prNumber}\n` +
        `Updated ${result.updatedTasks} task(s)\n\n` +
        `All tasks have been linked to this PR.`,
      prUrl: result.prUrl,
      prNumber: result.prNumber,
      updatedTasks: result.updatedTasks,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to create pull request: ${error.message}`,
    };
  }
}
