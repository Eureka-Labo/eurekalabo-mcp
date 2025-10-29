/**
 * API Client for Eureka Labo REST API
 * Handles authentication via X-API-Key header
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { getConfig } from '../config.js';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigneeId: string | null;
  createdById: string;
  dueDate: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  userId: string;
  role: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

export class EurekaAPIClient {
  private client: AxiosInstance;
  private projectId: string | null = null;
  private initialized: boolean = false;

  constructor() {
    const config = getConfig();

    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'X-API-Key': config.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          const status = error.response.status;
          const data = error.response.data as any;

          if (status === 401) {
            throw new Error('Authentication failed. Check your API key.');
          } else if (status === 403) {
            throw new Error('Permission denied. Check API key permissions.');
          } else if (status === 404) {
            throw new Error('Resource not found.');
          } else {
            throw new Error(data?.error || `API error: ${status}`);
          }
        } else if (error.request) {
          throw new Error('No response from API server. Check if API is running.');
        } else {
          throw new Error(`Request error: ${error.message}`);
        }
      }
    );
  }

  /**
   * Initialize the client by fetching project info from API key
   * This must be called before any other operations
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Fetch current API key info to get projectId
      const response = await this.client.get('/api/v1/api-keys/me');
      const keyInfo = response.data;

      if (!keyInfo || !keyInfo.projectId) {
        throw new Error('API key validation failed: no project ID found');
      }

      this.projectId = keyInfo.projectId;
      this.initialized = true;

      console.log(`✅ MCP Server initialized for project: ${this.projectId}`);
    } catch (error: any) {
      throw new Error(`Failed to initialize API client: ${error.message}`);
    }
  }

  /**
   * Ensure client is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Get the current project ID
   */
  getProjectId(): string {
    if (!this.projectId) {
      throw new Error('API client not initialized. Call initialize() first.');
    }
    return this.projectId;
  }

  // ===== Task Operations =====

  async listTasks(filters?: {
    status?: string;
    assigneeId?: string;
    search?: string;
    limit?: number;
  }): Promise<Task[]> {
    await this.ensureInitialized();
    const projectId = this.getProjectId();

    // Use MCP-optimized endpoint that returns only essential fields
    // This significantly reduces token usage by excluding relations and metadata
    const response = await this.client.get(`/api/v1/projects/${projectId}/tasks/mcp`, {
      params: filters,
    });
    return response.data.tasks || response.data;
  }

  async getTask(taskId: string): Promise<Task> {
    await this.ensureInitialized();

    const response = await this.client.get(`/api/v1/tasks/${taskId}`);
    return response.data;
  }

  async createTask(data: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    assigneeId?: string;
    dueDate?: string;
  }): Promise<Task> {
    await this.ensureInitialized();
    const projectId = this.getProjectId();

    const response = await this.client.post(`/api/v1/projects/${projectId}/tasks`, data);
    return response.data;
  }

  async updateTask(taskId: string, data: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    assigneeId?: string;
    metadata?: Record<string, any>;
  }): Promise<Task> {
    await this.ensureInitialized();

    const response = await this.client.patch(`/api/v1/tasks/${taskId}`, data);
    return response.data;
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.ensureInitialized();

    await this.client.delete(`/api/v1/tasks/${taskId}`);
  }

  // ===== Work Session Operations =====

  /**
   * Create a work session for a task with git changes
   */
  async createWorkSession(taskId: string, session: any): Promise<any> {
    await this.ensureInitialized();

    const response = await this.client.post(`/api/v1/tasks/${taskId}/work-sessions`, session);
    return response.data;
  }

  /**
   * Get all work sessions for a task
   */
  async getWorkSessions(taskId: string): Promise<any[]> {
    await this.ensureInitialized();

    const response = await this.client.get(`/api/v1/tasks/${taskId}/work-sessions`);
    return response.data;
  }

  /**
   * Get specific work session with all change details
   */
  async getWorkSession(taskId: string, sessionId: string): Promise<any> {
    await this.ensureInitialized();

    const response = await this.client.get(`/api/v1/tasks/${taskId}/work-sessions/${sessionId}`);
    return response.data;
  }

  // ===== Member Operations =====

  async listProjectMembers(): Promise<ProjectMember[]> {
    await this.ensureInitialized();
    const projectId = this.getProjectId();

    const response = await this.client.get(`/api/v1/projects/${projectId}/members`);
    return response.data;
  }

  // ===== Attachment Operations =====

  async uploadTaskAttachment(taskId: string, filePath: string): Promise<any> {
    const FormData = (await import('form-data')).default;
    const fs = (await import('fs')).default;

    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    const response = await this.client.post(
      `/api/v1/tasks/${taskId}/attachments`,
      form,
      {
        headers: {
          ...form.getHeaders(),
        },
      }
    );

    return response.data;
  }

  // ===== Branch Session Operations =====

  /**
   * Create or update a branch session
   */
  async createBranchSession(data: {
    branchName: string;
    taskId: string;
  }): Promise<any> {
    await this.ensureInitialized();
    const projectId = this.getProjectId();

    const response = await this.client.post('/api/v1/branch-sessions', {
      projectId,
      branchName: data.branchName,
      taskId: data.taskId,
    });
    return response.data;
  }

  /**
   * Get branch session by branch name
   */
  async getBranchSession(branchName: string): Promise<any> {
    await this.ensureInitialized();
    const projectId = this.getProjectId();

    const response = await this.client.get(`/api/v1/branch-sessions/${branchName}`, {
      params: { projectId },
    });
    return response.data;
  }

  /**
   * Get all tasks for a branch session
   */
  async getBranchTasks(branchName: string): Promise<Task[]> {
    await this.ensureInitialized();
    const projectId = this.getProjectId();

    const response = await this.client.get(`/api/v1/branch-sessions/${branchName}/tasks`, {
      params: { projectId },
    });
    return response.data.tasks || [];
  }

  /**
   * Update branch session activity timestamp
   */
  async updateBranchActivity(branchName: string): Promise<any> {
    await this.ensureInitialized();
    const projectId = this.getProjectId();

    const response = await this.client.patch(`/api/v1/branch-sessions/${branchName}/activity`, null, {
      params: { projectId },
    });
    return response.data;
  }

  /**
   * Check if all tasks in branch are completed
   */
  async checkBranchCompletion(branchName: string): Promise<boolean> {
    await this.ensureInitialized();
    const projectId = this.getProjectId();

    const response = await this.client.get(`/api/v1/branch-sessions/${branchName}/check-completion`, {
      params: { projectId },
    });
    return response.data.allCompleted || false;
  }

  /**
   * Create GitHub PR for branch session
   */
  async createPullRequest(data: {
    branchName: string;
    title: string;
    baseBranch?: string;
  }): Promise<any> {
    await this.ensureInitialized();
    const projectId = this.getProjectId();

    const response = await this.client.post(`/api/v1/branch-sessions/${data.branchName}/pr`, {
      projectId,
      title: data.title,
      baseBranch: data.baseBranch,
    });
    return response.data;
  }

  /**
   * Get multiple tasks by IDs
   */
  async getTasksByIds(taskIds: string[]): Promise<Task[]> {
    await this.ensureInitialized();

    const response = await this.client.post('/api/v1/branch-sessions/tasks/by-ids', {
      taskIds,
    });
    return response.data.tasks || [];
  }
}

// Singleton instance
let apiClient: EurekaAPIClient | null = null;

export function getAPIClient(): EurekaAPIClient {
  if (!apiClient) {
    apiClient = new EurekaAPIClient();
  }
  return apiClient;
}
