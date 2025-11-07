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
import {
  startFeatureDevelopment,
  analyzeCodebase,
  getFeatureSpec,
  createFeatureSpec,
  linkTaskToFeatureSpec,
  getPageNavigationFlow,
  createSubtasks,
  createNavigationFlow,
  getNavigationFlow,
  updateNavigationFlow,
  deleteNavigationFlow,
  getEnhancedSpecProgress,
  getProjectNavigationOverview,
  validateFeatureSpecReadiness,
} from './tools/feature-spec-tools.js';

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
        description: 'Create a new task in the project. Board assignment is automatic based on git repository, or you can provide boardId to override. Can optionally create as a subtask by providing parentTaskId. AUTO-DETECTS task type and adds Japanese prefix: メンテナンス (maintenance/update/upgrade), 修正 (fix/bug/error), リファクタリング (refactor/cleanup) based on title and description keywords.',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Task title - will auto-detect type and add prefix if maintenance/fix/refactoring keywords found',
            },
            description: {
              type: 'string',
              description: 'Task description (optional) - used for type detection along with title',
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
            skipAutoPrefix: {
              type: 'boolean',
              description: 'Set to true to disable automatic task type prefix detection (default: false)',
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

      // Feature Spec Tools
      {
        name: 'start_feature_development',
        description: 'Start developing a new feature. Checks for existing specs first.',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            prompt: { type: 'string' },
            figmaUrl: { type: 'string' },
            selectedExistingSpecId: { type: 'string' },
            createNew: { type: 'boolean' },
          },
          required: ['projectId', 'prompt'],
        },
      },
      {
        name: 'create_feature_spec',
        description: 'Create a new feature specification with AI-generated PRD, pages, endpoints, and ER diagrams.',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            prompt: { type: 'string', description: 'Feature description in Japanese' },
            figmaUrl: { type: 'string' },
            clarifications: { type: 'object', description: 'User answers to clarification questions' },
          },
          required: ['projectId', 'prompt'],
        },
      },
      {
        name: 'link_task_to_feature_spec',
        description: 'Link a board task to a feature spec. Required for all tasks before starting work.',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: { type: 'string' },
            featureSpecId: { type: 'string' },
            purpose: { type: 'string', description: 'Why this task relates to the spec (in Japanese)' },
          },
          required: ['taskId', 'featureSpecId'],
        },
      },
      {
        name: 'analyze_codebase',
        description: 'Analyze project codebase structure',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            analyzePages: { type: 'boolean' },
            analyzeEndpoints: { type: 'boolean' },
            analyzeErDiagrams: { type: 'boolean' },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'get_feature_spec',
        description: 'Get feature spec details with tasks and progress',
        inputSchema: {
          type: 'object',
          properties: {
            specId: { type: 'string' },
          },
          required: ['specId'],
        },
      },
      {
        name: 'get_page_navigation_flow',
        description: 'Get navigation flow for a project page including linked endpoints, entities, and screens',
        inputSchema: {
          type: 'object',
          properties: {
            pageId: { type: 'string' },
          },
          required: ['pageId'],
        },
      },
      {
        name: 'create_subtasks',
        description: 'Generate frontend, backend, and testing subtasks for a main task with auto-board routing',
        inputSchema: {
          type: 'object',
          properties: {
            featureSpecId: { type: 'string', description: 'Feature spec ID' },
            mainTaskId: { type: 'string', description: 'Main task ID to create subtasks for' },
            taskTypes: {
              type: 'array',
              description: 'Types of subtasks to create (default: FRONTEND, BACKEND, TESTING)',
              items: { type: 'string' }
            },
            estimatedHours: { type: 'number', description: 'Total estimated hours for all subtasks' },
            priority: { type: 'string', description: 'Priority level (LOW, MEDIUM, HIGH, CRITICAL)' },
          },
          required: ['featureSpecId', 'mainTaskId'],
        },
      },
      {
        name: 'create_navigation_flow',
        description: 'Create a visual navigation flow diagram for project pages with auto-layout',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            name: { type: 'string', description: 'Flow name (e.g., "User Registration Flow")' },
            description: { type: 'string', description: 'Flow description' },
            pages: {
              type: 'array',
              description: 'Pages to include in the flow',
              items: { type: 'object' }
            },
            connections: {
              type: 'array',
              description: 'Page connections with triggers',
              items: { type: 'object' }
            },
            autoLayout: { type: 'boolean', description: 'Auto-arrange nodes (default: true)' },
          },
          required: ['projectId', 'name', 'pages', 'connections'],
        },
      },
      {
        name: 'get_navigation_flow',
        description: 'Get detailed navigation flow with nodes and edges',
        inputSchema: {
          type: 'object',
          properties: {
            flowId: { type: 'string' },
          },
          required: ['flowId'],
        },
      },
      {
        name: 'update_navigation_flow',
        description: 'Update navigation flow structure and layout',
        inputSchema: {
          type: 'object',
          properties: {
            flowId: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            pages: { type: 'array' },
            connections: { type: 'array' },
            autoLayout: { type: 'boolean' },
          },
          required: ['flowId'],
        },
      },
      {
        name: 'delete_navigation_flow',
        description: 'Delete a navigation flow diagram',
        inputSchema: {
          type: 'object',
          properties: {
            flowId: { type: 'string' },
          },
          required: ['flowId'],
        },
      },
      {
        name: 'get_enhanced_spec_progress',
        description: 'Get progress with subtask breakdown, dependency tracking, and estimated hours',
        inputSchema: {
          type: 'object',
          properties: {
            specId: { type: 'string' },
          },
          required: ['specId'],
        },
      },
      {
        name: 'get_project_navigation_overview',
        description: 'Get all navigation flows and page relationships for a project, including orphaned pages',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'validate_feature_spec_readiness',
        description: 'Validate that all required artifacts (pages, endpoints, ER diagrams, navigation flow, tasks, subtasks) exist before starting work. CRITICAL: Must be called before start_work_on_task to ensure complete setup.',
        inputSchema: {
          type: 'object',
          properties: {
            specId: { type: 'string', description: 'Feature spec ID to validate' },
          },
          required: ['specId'],
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
            text: `# 🤖 AUTOMATIC: Intelligent Task Workflow

**YOU MUST CLASSIFY REQUEST TYPE FIRST - THEN CHOOSE APPROPRIATE WORKFLOW**

## 🔍 Step 0: Request Classification (MANDATORY FIRST STEP)

**CRITICAL**: Before starting ANY workflow, you MUST classify the user's request.

### ✨ Feature Development (Requires Feature Spec)
**Indicators:**
- New functionality or feature requests
- "Add X feature", "Implement X", "Create X"
- Requires PRD, pages, endpoints, or ER diagrams
- Significant new user-facing functionality
- Complex multi-component implementation

**Clear Examples:**
- ✅ "Add user authentication system"
- ✅ "Implement payment processing"
- ✅ "Create dashboard with analytics"

### 🔧 Maintenance Tasks (Task Only - No Feature Spec)
**Indicators:**
- Bug fixes: "Fix X", "Resolve X error"
- Refactoring: "Refactor X", "Clean up X code"
- Technical improvements: "Optimize X", "Update dependencies"
- Documentation: "Add comments", "Update README"
- Testing: "Add tests for X"

**Clear Examples:**
- ✅ "Fix login bug where users can't sign in"
- ✅ "Refactor authentication middleware"
- ✅ "Update React to latest version"
- ✅ "Add unit tests for user service"

### ❓ Ambiguous Requests (ASK USER - 100% REQUIRED)
**When you're NOT 100% certain, you MUST ask for clarification.**

**Ambiguous scenarios:**
- "Improve X" - could be feature enhancement OR optimization
- "Add validation" - could be new feature OR bug fix
- "Update authentication" - could be new auth method OR security fix
- "Change how X works" - could be feature OR refactor
- "Enhance X" - could be new feature OR improvement
- Any request where intent is unclear

**MANDATORY ACTION for ambiguous requests:**
\`\`\`
YOU MUST ASK: "Is this a new feature requiring a feature specification,
or a maintenance task (bug fix/refactor/improvement)?"

WAIT for user response before proceeding.
DO NOT make assumptions.
DO NOT proceed without clarification.
\`\`\`

---

## 🎯 Workflow A: Feature-Spec-Driven (For NEW FEATURES Only)

When user requests feature development work, AUTOMATICALLY execute these steps:

### Step 1: Check Active Session (AUTOMATIC)
\`\`\`
mcp__eureka-tasks__get_active_sessions
\`\`\`

### Step 2: If No Session → Feature Spec Workflow (AUTOMATIC)

**a. Check for existing feature specs:**
\`\`\`
mcp__eureka-tasks__start_feature_development({
  projectId: "project-id",
  prompt: "User's feature request in Japanese"
})
\`\`\`

**Response scenarios:**
- \`existing_specs_found\`: Show user existing specs with progress, ask which to use
- \`spec_loaded\`: Spec selected, proceed with tasks
- \`ready_to_create\`: No specs found, need to create new spec

**b. If ready_to_create → Create Feature Spec (AUTOMATIC):**
\`\`\`
mcp__eureka-tasks__create_feature_spec({
  projectId: "project-id",
  prompt: "ユーザーの機能要求を日本語で",
  figmaUrl: "optional-figma-url",
  clarifications: { /* user answers */ }
})
\`\`\`

**c. Create Board Task linked to Feature Spec:**
\`\`\`
mcp__eureka-tasks__create_task({
  title: "機能名を日本語で簡潔に",
  description: "実装内容と技術的アプローチを日本語で"
})
\`\`\`

**d. Link Task to Feature Spec (AUTOMATIC):**
\`\`\`
mcp__eureka-tasks__link_task_to_feature_spec({
  taskId: "task-id",
  featureSpecId: "spec-id",
  purpose: "このタスクで実装する内容"
})
\`\`\`

**e. Start session immediately:**
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

---

## 🔧 Workflow B: Maintenance Task (For BUG FIXES & REFACTORING)

When user requests bug fix, refactor, or technical improvement, AUTOMATICALLY execute these steps:

### Step 1: Check Active Session (AUTOMATIC)
\`\`\`
mcp__eureka-tasks__get_active_sessions
\`\`\`

### Step 2: If No Session → Create Task Only (AUTOMATIC)

**NO feature spec needed - just create the task:**

\`\`\`
mcp__eureka-tasks__create_task({
  title: "タスク名を日本語で簡潔に",
  description: "修正内容や技術的アプローチを日本語で",
  priority: "medium"
})
\`\`\`

**Note:** For maintenance tasks:
- ❌ NO feature spec creation
- ❌ NO link_task_to_feature_spec
- ✅ ONLY create_task + start_work_on_task

### Step 3: Start session immediately
\`\`\`
mcp__eureka-tasks__start_work_on_task({ taskId: "returned-id" })
\`\`\`

### Step 4: Code (NOW SAFE TO WRITE/EDIT)

### Step 5: Complete When Done (AUTOMATIC)
\`\`\`
mcp__eureka-tasks__complete_task_work({
  taskId: "task-id",
  summary: "修正内容の要約を日本語で"
})
\`\`\`

---

## 🚨 CRITICAL RULES

### For Feature Development (Workflow A):
1. **FEATURE-SPEC FIRST**: Always check/create feature spec before tasks
2. **LINK TASKS**: All board tasks MUST link to a feature spec
3. **BE AUTOMATIC**: Execute workflow without user intervention
4. **BE JAPANESE**: ALL content in Japanese (title, description, summary)

### For Maintenance Tasks (Workflow B):
1. **NO FEATURE SPEC**: Skip feature spec creation entirely
2. **TASK ONLY**: Just create_task → start_work_on_task → code → complete
3. **BE AUTOMATIC**: Execute workflow without user intervention
4. **BE JAPANESE**: ALL content in Japanese (title, description, summary)

### Universal Rules:
5. **CLASSIFY FIRST**: Always determine feature vs maintenance BEFORE starting
6. **ASK WHEN AMBIGUOUS**: If not 100% sure, ask user to clarify
7. **BE SEAMLESS**: User shouldn't notice the workflow overhead

## ✅ CORRECT Example 1: Feature Development

\`\`\`
User: "Add authentication to the API"

Claude (automatically, internally):
1. Classification: "Add authentication" = NEW FEATURE → Workflow A
2. get_active_sessions → No session
3. start_feature_development({ prompt: "API認証機能" }) → ready_to_create
4. create_feature_spec({
     prompt: "API認証機能の追加",
     clarifications: { priority: "HIGH", ... }
   }) → spec-456
5. create_task({
     title: "API認証機能の実装",
     description: "JWT認証ミドルウェアとAPIルート保護"
   }) → task-123
6. link_task_to_feature_spec({
     taskId: "task-123",
     featureSpecId: "spec-456",
     purpose: "認証ミドルウェアの実装"
   })
7. start_work_on_task({ taskId: "task-123" })
8. Tell user: "機能仕様を作成し、認証機能の実装を開始します"
9. [Proceed with implementation]
10. When done: complete_task_work(...)
\`\`\`

## ✅ CORRECT Example 2: Maintenance Task

\`\`\`
User: "Fix the login bug where users get 500 error"

Claude (automatically, internally):
1. Classification: "Fix the login bug" = BUG FIX → Workflow B
2. get_active_sessions → No session
3. create_task({
     title: "ログインバグの修正",
     description: "ユーザーがログイン時に500エラーを受け取る問題を修正"
   }) → task-789
4. start_work_on_task({ taskId: "task-789" })
5. Tell user: "ログインバグの修正タスクを作成しました"
6. [Proceed with bug fix]
7. When done: complete_task_work({
     taskId: "task-789",
     summary: "認証エラーハンドリングを修正しました"
   })
\`\`\`

## ✅ CORRECT Example 3: Ambiguous Request

\`\`\`
User: "Improve the authentication system"

Claude: "Is this a new feature requiring a feature specification (e.g., adding new
authentication methods like OAuth), or a maintenance task (e.g., refactoring existing
code, fixing performance issues)?"

User: "It's a refactor - just cleaning up the code"

Claude (automatically, internally):
1. Classification confirmed: MAINTENANCE → Workflow B
2. get_active_sessions → No session
3. create_task({
     title: "認証システムのリファクタリング",
     description: "既存の認証コードをクリーンアップして可読性を向上"
   }) → task-456
4. start_work_on_task({ taskId: "task-456" })
5. [Proceed with refactoring]
6. When done: complete_task_work(...)
\`\`\`

## ❌ WRONG Examples

\`\`\`
❌ Example 1: Proceeding without classification
User: "Add authentication"
Claude: create_task() immediately ❌ MUST CLASSIFY FIRST!

❌ Example 2: Asking unnecessary questions for clear requests
User: "Fix the login bug"
Claude: "Would you like me to create a feature spec?" ❌ BUG FIX = NO SPEC!

❌ Example 3: Not asking when ambiguous
User: "Improve authentication"
Claude: Proceeds with feature spec ❌ SHOULD ASK FOR CLARIFICATION!

❌ Example 4: English content
Claude: Creating task with title "Add authentication" ❌ NOT IN JAPANESE!

❌ Example 5: Feature without spec
User: "Add payment processing"
Claude: create_task() only ❌ FEATURE NEEDS SPEC!
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
🔍 CLASSIFY REQUEST (Step 0 - MANDATORY)
↓
├─ ✨ NEW FEATURE? ────────────────┐
│                                   │
│  get_active_sessions              │
│  ↓                                │
│  start_feature_development        │
│  ↓                                │
│  create_feature_spec (AI)         │
│  ↓                                │
│  create_task (Japanese)           │
│  ↓                                │
│  link_task_to_feature_spec        │
│  ↓                                │
│  start_work_on_task               │
│  ↓                                │
│  CODE                             │
│  ↓                                │
│  complete_task_work               │
│                                   │
├─ 🔧 MAINTENANCE? ────────────────┤
│                                   │
│  get_active_sessions              │
│  ↓                                │
│  create_task (Japanese)           │
│  ↓                                │
│  start_work_on_task               │
│  ↓                                │
│  CODE                             │
│  ↓                                │
│  complete_task_work               │
│                                   │
└─ ❓ AMBIGUOUS? ──────────────────┘
   ↓
   ASK USER FOR CLARIFICATION
   ↓
   (wait for response, then follow appropriate workflow)
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

### If you attempt to code without classification:
- STOP immediately
- Classify the request first (Feature vs Maintenance vs Ambiguous)
- If ambiguous, ask the user for clarification
- NEVER proceed without knowing which workflow to use

### If you attempt to code without a work session:
- STOP immediately
- Inform the user: "I need to create a task first"
- Follow the appropriate workflow (A or B) based on request type

### If you create a feature without a feature spec:
- STOP immediately
- This is a CRITICAL ERROR
- Features MUST have feature specs - no exceptions

### If you create a bug fix with a feature spec:
- STOP immediately
- This is WASTEFUL
- Maintenance tasks do NOT need feature specs

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

      // Feature Spec Tools
      case 'start_feature_development':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await startFeatureDevelopment(safeArgs as any), null, 2),
            },
          ],
        };

      case 'analyze_codebase':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await analyzeCodebase(safeArgs as any), null, 2),
            },
          ],
        };

      case 'get_feature_spec':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await getFeatureSpec(safeArgs as any), null, 2),
            },
          ],
        };

      case 'create_feature_spec':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await createFeatureSpec(safeArgs as any), null, 2),
            },
          ],
        };

      case 'link_task_to_feature_spec':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await linkTaskToFeatureSpec(safeArgs as any), null, 2),
            },
          ],
        };

      case 'get_page_navigation_flow':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await getPageNavigationFlow(safeArgs as any), null, 2),
            },
          ],
        };

      case 'create_subtasks':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await createSubtasks(safeArgs as any), null, 2),
            },
          ],
        };

      case 'create_navigation_flow':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await createNavigationFlow(safeArgs as any), null, 2),
            },
          ],
        };

      case 'get_navigation_flow':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await getNavigationFlow(safeArgs as any), null, 2),
            },
          ],
        };

      case 'update_navigation_flow':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await updateNavigationFlow(safeArgs as any), null, 2),
            },
          ],
        };

      case 'delete_navigation_flow':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await deleteNavigationFlow(safeArgs as any), null, 2),
            },
          ],
        };

      case 'get_enhanced_spec_progress':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await getEnhancedSpecProgress(safeArgs as any), null, 2),
            },
          ],
        };

      case 'get_project_navigation_overview':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await getProjectNavigationOverview(safeArgs as any), null, 2),
            },
          ],
        };

      case 'validate_feature_spec_readiness':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await validateFeatureSpecReadiness(safeArgs as any), null, 2),
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
