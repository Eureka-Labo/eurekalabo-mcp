#!/usr/bin/env node

/**
 * Eureka Labo MCP Server
 * Task management with automated change tracking
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { getConfig } from './config.js';
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  listProjectMembers,
  uploadTaskAttachment,
  getSessionProgress,
  clearSessionCompletedTasks,
  listBoards,
} from './tools/task-tools.js';
import {
  startWorkOnTask,
  completeTaskWork,
  getActiveSessions,
  cancelWorkSession,
  initializeActiveSessions,
} from './tools/work-session.js';
import {
  listBranchTasks,
  createPullRequest,
} from './tools/pr-tools.js';
import {
  createSubAgentInvocation,
  generateCommitMessagePrompt,
  generatePRDescriptionPrompt,
  generateSetupValidationPrompt,
  generateSmartSetupPrompt,
} from './tools/subagent-helpers.js';

// Initialize MCP server
const server = new Server(
  {
    name: 'eurekalabo-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  }
);

// ===== Tool Definitions =====

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Task Management Tools
      {
        name: 'list_tasks',
        description:
          'List tasks for the project. Optionally filter by status, assignee, or search term.',
        inputSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              description: 'Filter by status (todo, in_progress, done, cancelled)',
            },
            assigneeId: {
              type: 'string',
              description: 'Filter by assignee user ID',
            },
            search: {
              type: 'string',
              description: 'Search in task title and description',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of tasks to return',
            },
          },
        },
      },
      {
        name: 'get_task',
        description:
          'Get detailed information about a specific task, including change history.',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: {
              type: 'string',
              description: 'Task ID',
            },
          },
          required: ['taskId'],
        },
      },
      {
        name: 'create_task',
        description: 'Create a new task in the project. Board assignment is automatic based on git repository, or you can provide boardId to override. Can optionally create as a subtask by providing parentTaskId.',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Task title',
            },
            description: {
              type: 'string',
              description: 'Task description (optional)',
            },
            status: {
              type: 'string',
              description: 'Initial status (default: todo)',
            },
            priority: {
              type: 'string',
              description: 'Priority level (low, medium, high, critical)',
            },
            assigneeId: {
              type: 'string',
              description: 'User ID to assign task to',
            },
            dueDate: {
              type: 'string',
              description: 'Due date (ISO 8601 format)',
            },
            boardId: {
              type: 'string',
              description: 'Board ID (optional) - if not provided, will be auto-selected based on git repository',
            },
            parentTaskId: {
              type: 'string',
              description: 'Parent task ID - set this to create a subtask. Session progress will auto-save. Board will be inherited from parent.',
            },
          },
          required: ['title'],
        },
      },
      {
        name: 'update_task',
        description: 'Update an existing task.',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: {
              type: 'string',
              description: 'Task ID',
            },
            title: {
              type: 'string',
              description: 'New task title',
            },
            description: {
              type: 'string',
              description: 'New task description',
            },
            status: {
              type: 'string',
              description: 'New status',
            },
            priority: {
              type: 'string',
              description: 'New priority',
            },
            assigneeId: {
              type: 'string',
              description: 'New assignee user ID',
            },
          },
          required: ['taskId'],
        },
      },

      // Work Session Tools
      {
        name: 'start_work_on_task',
        description:
          'Begin working on a task. Captures git baseline for change tracking. Requires clean working directory (no uncommitted changes).',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: {
              type: 'string',
              description: 'Task ID to start working on',
            },
          },
          required: ['taskId'],
        },
      },
      {
        name: 'complete_task_work',
        description:
          'Complete work on a task. Captures all git changes since work started and logs them to the task. Optionally creates a Pull Request automatically if all branch tasks are completed.',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: {
              type: 'string',
              description: 'Task ID to complete',
            },
            summary: {
              type: 'string',
              description: 'Brief summary of work completed',
            },
            createPR: {
              type: 'boolean',
              description: 'If true, automatically creates a Pull Request when all branch tasks are completed (default: false)',
            },
          },
          required: ['taskId', 'summary'],
        },
      },
      {
        name: 'get_active_sessions',
        description: 'List all active work sessions.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'cancel_work_session',
        description:
          'Cancel an active work session without logging changes.',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: {
              type: 'string',
              description: 'Task ID to cancel session for',
            },
          },
          required: ['taskId'],
        },
      },

      // Utility Tools
      {
        name: 'list_project_members',
        description:
          'List all members of the project (for task assignment). Project is automatically determined from API key.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'upload_task_attachment',
        description: 'Upload a file attachment to a task.',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: {
              type: 'string',
              description: 'Task ID',
            },
            filePath: {
              type: 'string',
              description: 'Local file path to upload',
            },
          },
          required: ['taskId', 'filePath'],
        },
      },

      // Session Progress Tools
      {
        name: 'get_session_progress',
        description:
          'Get session progress summary showing active parent tasks with subtasks and their completion status. Displays task completion percentages and subtask states.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'clear_session_completed_tasks',
        description:
          'Clear completed tasks from session state. Removes tasks that are 100% done from the .eureka-session.json file.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'list_boards',
        description:
          'List all task boards in the project. Shows board details including name, ID, repository assignment, and default status. Useful for diagnosing board-related issues when creating tasks.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },

      // PR Integration Tools
      {
        name: 'list_branch_tasks',
        description:
          'List all tasks worked on in the current git branch. Shows tasks that are part of the branch session.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'create_pull_request',
        description:
          'Create a GitHub pull request for all tasks in the current branch. Generates PR description from work sessions. If no tasks exist in the branch, automatically creates a task with Japanese title and description from git changes. PR content and auto-created task content are in Japanese. Requires GitHub integration configured for the project.',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'PR title in Japanese (optional - will auto-generate from tasks if not provided)',
            },
            baseBranch: {
              type: 'string',
              description: 'Base branch to merge into (default: main)',
            },
          },
        },
      },

      // Sub-Agent Integration Tools
      {
        name: 'generate_smart_commit_message',
        description:
          'Use technical-writer sub-agent to analyze git changes and generate an intelligent commit message following Conventional Commits format with Japanese summary.',
        inputSchema: {
          type: 'object',
          properties: {
            gitDiff: {
              type: 'string',
              description: 'Git diff output to analyze',
            },
            taskContext: {
              type: 'object',
              description: 'Optional task context for additional information',
            },
          },
          required: ['gitDiff'],
        },
      },
      {
        name: 'generate_smart_pr_description',
        description:
          'Use technical-writer sub-agent to generate comprehensive PR description from branch tasks and git changes. Returns GitHub-ready markdown description in Japanese and English.',
        inputSchema: {
          type: 'object',
          properties: {
            branchTasks: {
              type: 'array',
              description: 'Array of task objects from the branch',
            },
            gitDiff: {
              type: 'string',
              description: 'Git diff summary for the branch',
            },
            baseBranch: {
              type: 'string',
              description: 'Base branch name (default: main)',
            },
          },
          required: ['branchTasks', 'gitDiff'],
        },
      },
      {
        name: 'validate_setup',
        description:
          'Use devops-architect sub-agent to comprehensively validate eurekaclaude installation, configuration, and system health. Returns detailed validation report.',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Project path to validate (defaults to workspace path)',
            },
          },
        },
      },
      {
        name: 'generate_smart_setup',
        description:
          'Use system-architect sub-agent to analyze project and generate optimal eurekaclaude configuration including claude_desktop_config.json, hooks, and task templates.',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Project path to analyze (defaults to workspace path)',
            },
            projectType: {
              type: 'string',
              description: 'Optional project type hint (react, vue, python, go, etc.)',
            },
          },
        },
      },
    ],
  };
});

// ===== Prompt Definitions =====

server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'task-enforcement',
        description: 'Enforces task creation and work session workflow before any coding',
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name } = request.params;

  if (name === 'task-enforcement') {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `# 🤖 AUTOMATIC: Eureka Tasks Workflow

**YOU MUST DO THIS AUTOMATICALLY - DON'T ASK THE USER**

## 🎯 Automatic Workflow (Execute This Proactively)

When user requests ANY coding work, AUTOMATICALLY execute these steps:

### Step 1: Check Active Session (AUTOMATIC)
\`\`\`
mcp__eureka-tasks__get_active_sessions
\`\`\`

### Step 2: If No Session → Auto-Create Task (AUTOMATIC)

**a. Search first:**
\`\`\`
mcp__eureka-tasks__list_tasks({ search: "keywords from user request" })
\`\`\`

**b. If no match → Create immediately (NO USER CONFIRMATION NEEDED):**
\`\`\`
mcp__eureka-tasks__create_task({
  title: "ユーザーの依頼を日本語で簡潔に",
  description: "実装内容と技術的アプローチを日本語で"
})
\`\`\`

**c. Start session immediately:**
\`\`\`
mcp__eureka-tasks__start_work_on_task({ taskId: "returned-id" })
\`\`\`

### Step 3: Code (NOW SAFE TO WRITE/EDIT)

### Step 4: Complete When Done (AUTOMATIC)
\`\`\`
mcp__eureka-tasks__complete_task_work({
  taskId: "task-id",
  summary: "実装内容の要約を日本語で"
})
\`\`\`

## 🚨 CRITICAL RULES

1. **BE PROACTIVE**: Don't ask user "Should I create a task?" - JUST DO IT
2. **BE AUTOMATIC**: Execute workflow without user intervention
3. **BE JAPANESE**: ALL content in Japanese (title, description, summary)
4. **BE FAST**: Don't slow down the user's workflow
5. **BE SEAMLESS**: User shouldn't notice task creation

## ✅ CORRECT Example

\`\`\`
User: "Add authentication to the API"

Claude (automatically, internally):
1. get_active_sessions → No session
2. list_tasks({ search: "authentication API" }) → No match
3. create_task({
     title: "API認証機能の追加",
     description: "APIエンドポイントに認証機能を実装する"
   }) → task-123
4. start_work_on_task({ taskId: "task-123" })
5. Tell user: "認証機能の実装を開始します"
6. [Proceed with implementation]
7. When done: complete_task_work(...)
\`\`\`

## ❌ WRONG Example

\`\`\`
User: "Add authentication"

Claude: "Would you like me to create a task for this?" ❌ DON'T ASK!
Claude: "Should I start a work session?" ❌ DON'T ASK!
Claude: Creating task with title "Add authentication" ❌ NOT IN JAPANESE!
\`\`\`

## 🎯 Task Title Generation

Auto-generate from user's natural language:
- "fix the bug" → "バグの修正"
- "add tests" → "テストの追加"
- "refactor code" → "コードのリファクタリング"
- "implement feature X" → "機能Xの実装"

## 🔄 Quick Flow

\`\`\`
User Request
↓
get_active_sessions (automatic)
↓
No session? → list_tasks (automatic)
↓
No match? → create_task (automatic, Japanese)
↓
start_work_on_task (automatic)
↓
CODE (user sees this part)
↓
complete_task_work (automatic when done)
\`\`\`

## 🇯🇵 CRITICAL: Japanese Content Requirement

**ALL task content MUST be in Japanese:**
- Task title: タスクのタイトルは日本語で書く
- Task description: タスクの説明は日本語で書く
- Task summary: タスクの要約は日本語で書く

**Example (CORRECT):**
\`\`\`
create_task({
  title: "ユーザー認証機能の実装",
  description: "JWT認証ミドルウェアを追加し、全APIルートを保護する"
})

complete_task_work({
  taskId: "task-123",
  summary: "bcryptを使用したJWT認証を実装しました"
})
\`\`\`

**Example (WRONG - Never use English):**
\`\`\`
create_task({
  title: "Add user authentication",  ❌ WRONG!
  description: "Add JWT middleware"  ❌ WRONG!
})
\`\`\`

## Error Handling

If you attempt to code without a work session:
- STOP immediately
- Inform the user: "I need to create a task first"
- Follow the workflow above

This is NON-NEGOTIABLE. No exceptions.`,
          },
        },
      ],
    };
  }

  throw new Error(`Unknown prompt: ${name}`);
});

// ===== Tool Execution Handler =====

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    // Type guard for args
    const safeArgs = args ?? {};

    switch (name) {
      // Task Management
      case 'list_tasks':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await listTasks(safeArgs as any), null, 2),
            },
          ],
        };

      case 'get_task':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await getTask(safeArgs.taskId as string), null, 2),
            },
          ],
        };

      case 'create_task':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await createTask(safeArgs as any), null, 2),
            },
          ],
        };

      case 'update_task':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await updateTask(safeArgs.taskId as string, safeArgs as any),
                null,
                2
              ),
            },
          ],
        };

      // Work Sessions
      case 'start_work_on_task':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await startWorkOnTask(safeArgs.taskId as string),
                null,
                2
              ),
            },
          ],
        };

      case 'complete_task_work':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await completeTaskWork(
                  safeArgs.taskId as string,
                  safeArgs.summary as string,
                  safeArgs.createPR as boolean | undefined
                ),
                null,
                2
              ),
            },
          ],
        };

      case 'get_active_sessions':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { sessions: getActiveSessions() },
                null,
                2
              ),
            },
          ],
        };

      case 'cancel_work_session':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await cancelWorkSession(safeArgs.taskId as string),
                null,
                2
              ),
            },
          ],
        };

      // Utilities
      case 'list_project_members':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await listProjectMembers(),
                null,
                2
              ),
            },
          ],
        };

      case 'upload_task_attachment':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await uploadTaskAttachment(
                  safeArgs.taskId as string,
                  safeArgs.filePath as string
                ),
                null,
                2
              ),
            },
          ],
        };

      // Session Progress
      case 'get_session_progress':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await getSessionProgress(),
                null,
                2
              ),
            },
          ],
        };

      case 'clear_session_completed_tasks':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await clearSessionCompletedTasks(),
                null,
                2
              ),
            },
          ],
        };

      case 'list_boards':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await listBoards(),
                null,
                2
              ),
            },
          ],
        };

      // PR Integration
      case 'list_branch_tasks':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await listBranchTasks(),
                null,
                2
              ),
            },
          ],
        };

      case 'create_pull_request':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await createPullRequest(safeArgs as any),
                null,
                2
              ),
            },
          ],
        };

      // Sub-Agent Integration Tools
      case 'generate_smart_commit_message': {
        const prompt = generateCommitMessagePrompt(
          safeArgs.gitDiff as string,
          safeArgs.taskContext
        );
        const invocation = createSubAgentInvocation(
          'technical-writer',
          prompt,
          'Generate intelligent commit message'
        );
        return {
          content: [
            {
              type: 'text',
              text: invocation,
            },
          ],
        };
      }

      case 'generate_smart_pr_description': {
        const prompt = generatePRDescriptionPrompt(
          safeArgs.branchTasks as any[],
          safeArgs.gitDiff as string,
          safeArgs.baseBranch as string
        );
        const invocation = createSubAgentInvocation(
          'technical-writer',
          prompt,
          'Generate comprehensive PR description'
        );
        return {
          content: [
            {
              type: 'text',
              text: invocation,
            },
          ],
        };
      }

      case 'validate_setup': {
        const config = getConfig();
        const projectPath = (safeArgs.projectPath as string) || config.workspacePath;
        const prompt = generateSetupValidationPrompt(projectPath);
        const invocation = createSubAgentInvocation(
          'devops-architect',
          prompt,
          'Validate eurekaclaude setup'
        );
        return {
          content: [
            {
              type: 'text',
              text: invocation,
            },
          ],
        };
      }

      case 'generate_smart_setup': {
        const config = getConfig();
        const projectPath = (safeArgs.projectPath as string) || config.workspacePath;
        const prompt = generateSmartSetupPrompt(
          projectPath,
          safeArgs.projectType as string
        );
        const invocation = createSubAgentInvocation(
          'system-architect',
          prompt,
          'Generate smart setup configuration'
        );
        return {
          content: [
            {
              type: 'text',
              text: invocation,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error: error.message,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

// ===== Start Server =====

async function main() {
  try {
    // Validate configuration
    const config = getConfig();
    console.error(`[MCP] Starting Eureka Labo MCP Server`);
    console.error(`[MCP] API URL: ${config.apiUrl}`);
    console.error(`[MCP] Workspace: ${config.workspacePath}`);

    // Initialize active sessions from persisted data
    initializeActiveSessions(config.workspacePath);

    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error('[MCP] Server ready');
  } catch (error: any) {
    console.error('[MCP] Failed to start server:', error.message);
    process.exit(1);
  }
}

main();
