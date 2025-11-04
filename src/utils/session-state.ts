/**
 * Session State Manager
 * Persists task progress across Claude Code sessions
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

export interface SubtaskProgress {
  id: string;
  title: string;
  status: string;
  priority: string;
  completedAt: string | null;
}

export interface ParentTaskProgress {
  id: string;
  title: string;
  status: string;
  priority: string;
  completionPercentage: number | null;
  subtasks: SubtaskProgress[];
  lastUpdated: string;
}

export interface SessionState {
  version: string;
  projectId: string;
  lastSaved: string;
  activeTasks: ParentTaskProgress[];
  branch: string;
}

/**
 * Get the workspace root directory
 */
function getWorkspaceRoot(): string {
  try {
    const gitRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
    return gitRoot;
  } catch {
    return process.cwd();
  }
}

/**
 * Get session state file path
 */
function getSessionFilePath(): string {
  const workspaceRoot = getWorkspaceRoot();
  return path.join(workspaceRoot, '.eureka-session.json');
}

/**
 * Load session state from disk
 */
export async function loadSessionState(): Promise<SessionState | null> {
  try {
    const filePath = getSessionFilePath();
    const content = await fs.readFile(filePath, 'utf-8');
    const state = JSON.parse(content) as SessionState;

    return state;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist yet
      return null;
    }
    console.error('Failed to load session state:', error);
    return null;
  }
}

/**
 * Save session state to disk
 */
export async function saveSessionState(state: SessionState): Promise<void> {
  try {
    const filePath = getSessionFilePath();
    const content = JSON.stringify(state, null, 2);
    await fs.writeFile(filePath, content, 'utf-8');
  } catch (error: any) {
    console.error('Failed to save session state:', error);
    throw error;
  }
}

/**
 * Initialize new session state
 */
export function initializeSessionState(projectId: string, branch: string): SessionState {
  return {
    version: '1.0.0',
    projectId,
    lastSaved: new Date().toISOString(),
    activeTasks: [],
    branch,
  };
}

/**
 * Update parent task progress in session state
 */
export async function updateTaskProgress(
  parentTask: {
    id: string;
    title: string;
    status: string;
    priority: string;
    completionPercentage: number | null;
    subtasks: Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
      completedAt: string | null;
    }>;
  },
  projectId: string,
  branch: string
): Promise<void> {
  try {
    // Load existing state or initialize new
    let state = await loadSessionState();
    if (!state) {
      state = initializeSessionState(projectId, branch);
    }

    // Update or add parent task
    const taskIndex = state.activeTasks.findIndex(t => t.id === parentTask.id);

    const taskProgress: ParentTaskProgress = {
      id: parentTask.id,
      title: parentTask.title,
      status: parentTask.status,
      priority: parentTask.priority,
      completionPercentage: parentTask.completionPercentage,
      subtasks: parentTask.subtasks.map(st => ({
        id: st.id,
        title: st.title,
        status: st.status,
        priority: st.priority,
        completedAt: st.completedAt,
      })),
      lastUpdated: new Date().toISOString(),
    };

    if (taskIndex >= 0) {
      state.activeTasks[taskIndex] = taskProgress;
    } else {
      state.activeTasks.push(taskProgress);
    }

    // Remove completed tasks (100% done)
    state.activeTasks = state.activeTasks.filter(
      t => t.status !== 'done' || (t.completionPercentage !== null && t.completionPercentage < 100)
    );

    state.lastSaved = new Date().toISOString();
    state.branch = branch;

    await saveSessionState(state);
  } catch (error: any) {
    console.error('Failed to update task progress:', error);
  }
}

/**
 * Get current task progress summary
 */
export async function getTaskProgressSummary(): Promise<string> {
  const state = await loadSessionState();

  if (!state || state.activeTasks.length === 0) {
    return 'No active tasks in current session.';
  }

  const lines = [
    `\n📋 Session Progress (Branch: ${state.branch})`,
    `Last saved: ${new Date(state.lastSaved).toLocaleString()}`,
    '',
  ];

  for (const task of state.activeTasks) {
    const percentage = task.completionPercentage !== null ? `${task.completionPercentage}%` : 'N/A';
    const completedSubtasks = task.subtasks.filter(st => st.status === 'done' || st.status === 'completed').length;

    lines.push(`🎯 ${task.title} [${task.priority}]`);
    lines.push(`   Status: ${task.status} | Progress: ${percentage} (${completedSubtasks}/${task.subtasks.length} subtasks)`);

    for (const subtask of task.subtasks) {
      const icon = subtask.status === 'done' || subtask.status === 'completed' ? '✅' :
                   subtask.status === 'in_progress' ? '🔄' : '📋';
      lines.push(`   ${icon} ${subtask.title} [${subtask.status}]`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Clear completed tasks from session
 */
export async function clearCompletedTasks(): Promise<number> {
  const state = await loadSessionState();

  if (!state) {
    return 0;
  }

  const beforeCount = state.activeTasks.length;
  state.activeTasks = state.activeTasks.filter(
    t => t.status !== 'done' && (t.completionPercentage === null || t.completionPercentage < 100)
  );

  const removedCount = beforeCount - state.activeTasks.length;

  if (removedCount > 0) {
    state.lastSaved = new Date().toISOString();
    await saveSessionState(state);
  }

  return removedCount;
}

/**
 * Get session file path for external tools
 */
export function getSessionFileLocation(): string {
  return getSessionFilePath();
}
