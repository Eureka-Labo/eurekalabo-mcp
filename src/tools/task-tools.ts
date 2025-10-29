/**
 * Task Management Tools
 * Basic CRUD operations for tasks
 */

import { getAPIClient } from '../api/client.js';

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
 * Create a new task
 */
export async function createTask(data: {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  dueDate?: string;
}): Promise<any> {
  try {
    const apiClient = getAPIClient();
    const task = await apiClient.createTask(data);

    return {
      success: true,
      message: `Task created successfully: ${task.id}`,
      task,
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
  }
): Promise<any> {
  try {
    const apiClient = getAPIClient();
    const task = await apiClient.updateTask(taskId, data);

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
