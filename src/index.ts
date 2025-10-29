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
} from './tools/task-tools.js';
import {
  startWorkOnTask,
  completeTaskWork,
  getActiveSessions,
  cancelWorkSession,
} from './tools/work-session.js';
import {
  listBranchTasks,
  createPullRequest,
} from './tools/pr-tools.js';

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
        description: 'Create a new task in the project.',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Task title',
            },
            description: {
              type: 'string',
              description: 'Task description',
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
            text: `# 🔴 CRITICAL: Eureka Tasks Work Session Enforcement

**BEFORE ANY CODING WORK, YOU MUST:**

1. **Check for relevant tasks**: Call \`list_tasks\` to search for existing tasks
   - Search by keywords from the user's request
   - Check if any task matches the current work

2. **If NO relevant task exists**: Call \`create_task\` (REQUIRED, NOT OPTIONAL)
   - Title: Clear description of what will be implemented
   - Description: Brief technical approach and scope
   - This is MANDATORY before any code changes

3. **Start work session**: Call \`start_work_on_task\` with the task ID
   - Captures git baseline for change tracking
   - Requires clean working directory
   - This MUST happen before writing any code

4. **Do the coding work**
   - All file edits, writes, and code changes happen here
   - Git will automatically track all changes from baseline

5. **Complete work session**: Call \`complete_task_work\` when done
   - Provide a brief summary of what was implemented
   - Automatically captures all git changes and logs them to the task
   - Updates task status and creates complete audit trail

## Why This Matters

- ✅ **Full Audit Trail**: Every code change is tracked and linked to a task
- ✅ **Git Integration**: Automatic git baseline capture and change tracking
- ✅ **Project Visibility**: All work visible in Eureka Tasks dashboard
- ✅ **Team Collaboration**: Others can see what you're working on
- ✅ **Change History**: Complete history of what changed and why

## Enforcement

**🚫 BLOCKED ACTIONS WITHOUT ACTIVE WORK SESSION:**
- Writing new files (\`Write\` tool)
- Editing existing files (\`Edit\` tool)
- Running build/deploy commands that modify code
- Git commits (should be done through \`complete_task_work\`)

**✅ ALLOWED ACTIONS WITHOUT WORK SESSION:**
- Reading files (\`Read\` tool)
- Searching code (\`Grep\`, \`Glob\`)
- Listing tasks (\`list_tasks\`)
- Creating tasks (\`create_task\`)
- Starting work sessions (\`start_work_on_task\`)

## Example Workflow

\`\`\`
User: "APIに認証を追加して"

Step 1: list_tasks(search: "認証")
→ 該当するタスクが見つかりません

Step 2: create_task({
  title: "APIエンドポイントにJWT認証を追加",
  description: "JWT検証のためのミドルウェアを実装し、ルートを保護する"
})
→ Returns taskId: "task-123"

Step 3: start_work_on_task(taskId: "task-123")
→ Gitベースラインをキャプチャ、作業セッション開始

Step 4: [認証のためのファイルを作成・編集]

Step 5: complete_task_work(
  taskId: "task-123",
  summary: "JWTミドルウェアを実装し、すべてのAPIルートを保護しました"
)
→ すべての変更がログされ、タスクが'完了'に更新されました
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

    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error('[MCP] Server ready');
  } catch (error: any) {
    console.error('[MCP] Failed to start server:', error.message);
    process.exit(1);
  }
}

main();
