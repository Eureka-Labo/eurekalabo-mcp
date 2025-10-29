/**
 * Branch Session Manager
 * Tracks tasks worked on in each git branch for PR creation
 */

import { getAPIClient } from '../api/client.js';
import { getCurrentBranch } from '../tracking/git-tracker.js';
import { getConfig } from '../config.js';

export interface BranchSessionInfo {
  branchName: string;
  taskIds: string[];
  startedAt: string;
  lastActivityAt: string;
  prUrl?: string;
  prNumber?: number;
  status: 'active' | 'pr_created' | 'merged';
}

export class BranchSessionManager {
  private apiClient = getAPIClient();
  private currentBranch: string | null = null;

  /**
   * Get the current git branch
   */
  private async getCurrentBranch(): Promise<string> {
    if (!this.currentBranch) {
      const config = getConfig();
      this.currentBranch = await getCurrentBranch(config.workspacePath);
    }
    return this.currentBranch;
  }

  /**
   * Start tracking a task in the current branch session
   * Called when start_work_on_task is executed
   */
  async trackTaskInBranch(taskId: string): Promise<void> {
    try {
      const branchName = await this.getCurrentBranch();

      // Skip tracking for main/master branches
      if (branchName === 'main' || branchName === 'master') {
        console.log(`Skipping branch session tracking for ${branchName} branch`);
        return;
      }

      // Create or update branch session via API
      await this.apiClient.createBranchSession({
        branchName,
        taskId,
      });

      console.log(`✅ Task ${taskId} tracked in branch session: ${branchName}`);
    } catch (error: any) {
      console.error('Failed to track task in branch session:', error.message);
      // Don't throw - this is not critical to task workflow
    }
  }

  /**
   * Update branch session activity timestamp
   * Called when completing a task
   */
  async updateBranchActivity(): Promise<void> {
    try {
      const branchName = await this.getCurrentBranch();

      if (branchName === 'main' || branchName === 'master') {
        return;
      }

      await this.apiClient.updateBranchActivity(branchName);
    } catch (error: any) {
      console.error('Failed to update branch activity:', error.message);
    }
  }

  /**
   * Get all tasks in the current branch session
   */
  async getBranchTasks(): Promise<any[]> {
    const branchName = await this.getCurrentBranch();

    if (branchName === 'main' || branchName === 'master') {
      throw new Error('Cannot get branch tasks for main/master branch');
    }

    const tasks = await this.apiClient.getBranchTasks(branchName);
    return tasks;
  }

  /**
   * Get branch session info
   */
  async getBranchSession(): Promise<BranchSessionInfo | null> {
    try {
      const branchName = await this.getCurrentBranch();

      if (branchName === 'main' || branchName === 'master') {
        return null;
      }

      const session = await this.apiClient.getBranchSession(branchName);
      return session;
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Check if all tasks in current branch are completed
   */
  async areAllTasksCompleted(): Promise<boolean> {
    const branchName = await this.getCurrentBranch();

    if (branchName === 'main' || branchName === 'master') {
      return false;
    }

    return await this.apiClient.checkBranchCompletion(branchName);
  }

  /**
   * Create a pull request for the current branch
   */
  async createPullRequest(title: string, baseBranch?: string): Promise<{
    prUrl: string;
    prNumber: number;
    updatedTasks: number;
  }> {
    const branchName = await this.getCurrentBranch();

    if (branchName === 'main' || branchName === 'master') {
      throw new Error('Cannot create PR from main/master branch');
    }

    const result = await this.apiClient.createPullRequest({
      branchName,
      title,
      baseBranch,
    });

    return {
      prUrl: result.prUrl,
      prNumber: result.prNumber,
      updatedTasks: result.updatedTasks || 0,
    };
  }

  /**
   * Suggest PR creation if all tasks are completed
   * Returns suggestion message or null
   */
  async suggestPRCreation(): Promise<string | null> {
    try {
      const session = await this.getBranchSession();

      if (!session) {
        return null;
      }

      // Don't suggest if PR already created
      if (session.prUrl) {
        return null;
      }

      const allCompleted = await this.areAllTasksCompleted();

      if (!allCompleted) {
        return null;
      }

      const branchName = await this.getCurrentBranch();
      const taskCount = session.taskIds?.length || 0;

      return `
🎉 All ${taskCount} task(s) in branch "${branchName}" are now completed!

You can create a pull request using:
\`\`\`
create_pull_request
\`\`\`

This will:
- Generate a PR description from all task summaries and work sessions
- Link the PR URL to all tasks
- Update task status in the project
`;
    } catch (error: any) {
      console.error('Failed to check for PR suggestion:', error.message);
      return null;
    }
  }

  /**
   * Reset current branch cache (useful when switching branches)
   */
  resetBranchCache(): void {
    this.currentBranch = null;
  }
}

// Singleton instance
let branchSessionManager: BranchSessionManager | null = null;

export function getBranchSessionManager(): BranchSessionManager {
  if (!branchSessionManager) {
    branchSessionManager = new BranchSessionManager();
  }
  return branchSessionManager;
}
