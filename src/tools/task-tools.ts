/**
 * Task Management Tools
 * Basic CRUD operations for tasks
 */

import { getAPIClient } from '../api/client.js';
import { selectBoardForTask, getBoardAssignmentInfo } from '../utils/board-selector.js';
import { updateTaskProgress, getTaskProgressSummary, clearCompletedTasks, getSessionFileLocation } from '../utils/session-state.js';
import { execSync } from 'child_process';

/**
 * List tasks with optional filters
 */
export async function listTasks(filters?: {
  status?: string;
  assigneeId?: string;
  search?: string;
  limit?: number;
}): Promise<any> {
  try {
    const apiClient = getAPIClient();
    const tasks = await apiClient.listTasks(filters);

    return {
      success: true,
      tasks,
      count: tasks.length,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to list tasks: ${error.message}`,
      tasks: [],
      count: 0,
    };
  }
}

/**
 * Get task details including change history
 */
export async function getTask(taskId: string): Promise<any> {
  try {
    const apiClient = getAPIClient();
    const task = await apiClient.getTask(taskId);

    // Extract work sessions from metadata
    const workSessions = task.metadata?.workSessions || [];

    return {
      success: true,
      task: {
        ...task,
        workSessionCount: workSessions.length,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to get task: ${error.message}`,
    };
  }
}

/**
 * Create a new task with smart board assignment
 *
 * Automatically assigns task to:
 * 1. Board connected to current git repository, OR
 * 2. Board without repository assignment, OR
 * 3. No board (task created at project level)
 */
export async function createTask(data: {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  dueDate?: string;
  boardId?: string; // Optional manual override
  parentTaskId?: string; // Optional: create as subtask
}): Promise<any> {
  try {
    const apiClient = getAPIClient();

    // Smart board selection logic
    let boardId: string | undefined = data.boardId;
    let boardAssignment = null;

    // If creating a subtask, inherit parent's boardId
    if (data.parentTaskId && !boardId) {
      try {
        const parentTask: any = await apiClient.getTask(data.parentTaskId);
        boardId = parentTask.boardId || undefined;

        if (boardId) {
          boardAssignment = {
            boardName: parentTask.board?.name,
            repositoryName: null,
            reason: `Inherited from parent task "${parentTask.title}"`,
          };
        }
      } catch (error) {
        console.error('Failed to get parent task for board inheritance:', error);
        // Continue with normal board selection if parent fetch fails
      }
    }

    // If still no boardId, use smart board selection (for regular tasks)
    if (!boardId && !data.parentTaskId) {
      const selectedBoardId = await selectBoardForTask();

      if (!selectedBoardId) {
        // No boards available - return helpful error
        return {
          success: false,
          message: 'Failed to create task: No boards available in project. Please create a board first using list_boards() to see available boards, or create one in the dashboard.',
        };
      }

      boardId = selectedBoardId;

      // Get assignment info for logging
      const info = await getBoardAssignmentInfo();
      boardAssignment = {
        boardName: info.selectedBoard?.name,
        repositoryName: info.repository?.name,
        reason: info.reason,
      };
    }

    // Ensure boardId is present (required by backend)
    if (!boardId) {
      return {
        success: false,
        message: 'Failed to create task: boardId is required. Use list_boards() to get available boards.',
      };
    }

    // Create task with board assignment
    const taskData = {
      ...data,
      boardId, // Always include boardId (now guaranteed to exist)
    };

    const task = await apiClient.createTask(taskData);

    // Save session progress if this is a subtask
    if (data.parentTaskId) {
      await saveTaskProgressToSession(task);
    }

    return {
      success: true,
      message: `Task created successfully: ${task.id}`,
      task,
      boardAssignment, // Include for debugging/logging
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to create task: ${error.message}`,
    };
  }
}

/**
 * Update an existing task
 */
export async function updateTask(
  taskId: string,
  data: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    assigneeId?: string;
    parentTaskId?: string;
  }
): Promise<any> {
  try {
    const apiClient = getAPIClient();
    const task = await apiClient.updateTask(taskId, data);

    // Save session progress if this task has a parent or is a parent with subtasks
    await saveTaskProgressToSession(task);

    return {
      success: true,
      message: `Task updated successfully: ${task.id}`,
      task,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to update task: ${error.message}`,
    };
  }
}

/**
 * Helper: Save task progress to session if it's a parent task with subtasks
 */
async function saveTaskProgressToSession(task: any): Promise<void> {
  try {
    // If this task was updated and has a parent, fetch the parent and save its progress
    if (task.parentTaskId) {
      const apiClient = getAPIClient();
      const parentTaskResponse: any = await apiClient.getTask(task.parentTaskId);

      if (parentTaskResponse.subtasks && parentTaskResponse.subtasks.length > 0) {
        const branch = getBranchName();
        await updateTaskProgress(parentTaskResponse, parentTaskResponse.projectId, branch);
      }
    }
    // If this task has subtasks, save its own progress
    else if (task.subtasks && task.subtasks.length > 0) {
      const branch = getBranchName();
      await updateTaskProgress(task, task.projectId, branch);
    }
  } catch (error) {
    // Silent fail - don't break the main flow if session save fails
    console.error('Failed to save session progress:', error);
  }
}

/**
 * Get current git branch name
 */
function getBranchName(): string {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

/**
 * List project members (for task assignment)
 * Project ID is automatically determined from API key
 */
export async function listProjectMembers(): Promise<any> {
  try {
    const apiClient = getAPIClient();
    const members = await apiClient.listProjectMembers();

    return {
      success: true,
      members: members.map((m) => ({
        userId: m.userId,
        fullName: m.user.fullName,
        email: m.user.email,
        role: m.role,
      })),
      count: members.length,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to list members: ${error.message}`,
      members: [],
      count: 0,
    };
  }
}

/**
 * Upload attachment to task
 */
export async function uploadTaskAttachment(
  taskId: string,
  filePath: string
): Promise<any> {
  try {
    const apiClient = getAPIClient();
    const result = await apiClient.uploadTaskAttachment(taskId, filePath);

    return {
      success: true,
      message: `File uploaded successfully`,
      attachment: result.attachment,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to upload attachment: ${error.message}`,
    };
  }
}

/**
 * Get session progress summary
 * Shows active parent tasks with subtasks and their completion status
 */
export async function getSessionProgress(): Promise<any> {
  try {
    const summary = await getTaskProgressSummary();
    const sessionFile = getSessionFileLocation();

    return {
      success: true,
      summary,
      sessionFile,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to get session progress: ${error.message}`,
      summary: 'No session data available',
    };
  }
}

/**
 * Clear completed tasks from session
 * Removes tasks that are 100% done from the session state
 */
export async function clearSessionCompletedTasks(): Promise<any> {
  try {
    const removedCount = await clearCompletedTasks();

    return {
      success: true,
      message: `Cleared ${removedCount} completed task(s) from session`,
      removedCount,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to clear completed tasks: ${error.message}`,
    };
  }
}

/**
 * List all boards in the project
 * Useful for debugging board assignment issues
 */
export async function listBoards(): Promise<any> {
  try {
    const apiClient = getAPIClient();
    const boards = await apiClient.listBoards();
    const repositories = await apiClient.listRepositories();

    return {
      success: true,
      boards: boards.map(b => ({
        id: b.id,
        name: b.name,
        isDefault: b.isDefault,
        repositoryId: b.repositoryId,
        repositoryName: repositories.find(r => r.id === b.repositoryId)?.name || null,
        viewType: b.viewType,
      })),
      count: boards.length,
      message: boards.length === 0
        ? 'No boards found. Create at least one board in your project to create tasks.'
        : `Found ${boards.length} board(s)`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to list boards: ${error.message}`,
      boards: [],
      count: 0,
    };
  }
}
