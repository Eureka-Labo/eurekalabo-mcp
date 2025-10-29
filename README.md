# Eureka Labo MCP Server

Model Context Protocol (MCP) server for Eureka Labo task management with automated git change tracking.

## Features

- 📋 **Task Management** - List, create, update tasks via MCP
- 🔄 **Work Sessions** - Track development work with git integration
- 📊 **Change Logging** - Automatically capture and log file changes
- 🎨 **React Diff Support** - Generate diffs compatible with react-diff-viewer
- 🔐 **API Key Auth** - Secure project-scoped access
- 🤖 **Auto Task Creation** - Automatically creates tasks from git changes when creating PRs without tracked tasks
- 🇯🇵 **Japanese Content** - Task descriptions and PR content auto-generated in Japanese
- 🚦 **Task Enforcement** - Optional prompt to require task creation before coding work (see [TASK_ENFORCEMENT.md](TASK_ENFORCEMENT.md))

## Prerequisites

- Node.js 18+
- Git repository for workspace
- Eureka Labo API access with generated API key

## Installation

### Option 1: Quick Install (Recommended)

Clone the repository and install dependencies:

```bash
# Clone the repository
git clone https://github.com/Eureka-Labo/eurekalabo-mcp.git
cd eurekalabo-mcp

# Install dependencies
npm install

# Add to Claude Code (Mac/Linux) - from inside the directory
claude mcp add -t stdio eureka-tasks \
  -e EUREKA_API_URL=https://eurekalabo.162-43-92-100.nip.io \
  -e EUREKA_API_KEY=pk_live_your_api_key_here \
  -- npx tsx "$(pwd)/src/index.ts"

# OR from anywhere with absolute path (Mac/Linux)
claude mcp add -t stdio eureka-tasks \
  -e EUREKA_API_URL=https://eurekalabo.162-43-92-100.nip.io \
  -e EUREKA_API_KEY=pk_live_your_api_key_here \
  -- npx tsx /Users/yourname/workspace/eurekalabo-mcp/src/index.ts

# Add to Claude Code (Windows - run in PowerShell)
claude mcp add -t stdio eureka-tasks `
  -e EUREKA_API_URL=https://eurekalabo.162-43-92-100.nip.io `
  -e EUREKA_API_KEY=pk_live_your_api_key_here `
  -- cmd /c npx tsx "$PWD/src/index.ts"

# OR from anywhere with absolute path (Windows)
claude mcp add -t stdio eureka-tasks `
  -e EUREKA_API_URL=https://eurekalabo.162-43-92-100.nip.io `
  -e EUREKA_API_KEY=pk_live_your_api_key_here `
  -- cmd /c npx tsx C:/workspace/eurekalabo-mcp/src/index.ts
```

### Option 2: Manual Installation

```bash
cd /path/to/eurekalabo/mcp-server
npm install
```

Then manually configure `~/.claude/mcp.json` (see Configuration section below).

## Configuration

**Note:** If you used Option 1 (Quick Install), you've already configured the MCP server! You can skip to the [Usage](#usage) section. The following steps are for Option 2 (Manual Installation) or if you need to reconfigure.

### 1. Generate API Key

1. Open your project in Eureka Labo UI
2. Go to Project Settings → API Keys
3. Click "Create API Key"
4. Select permissions:
   - `read:project`
   - `read:tasks`
   - `write:tasks`
   - `assign:tasks`
   - `read:members`
5. Copy the key (shown only once!)

**Important**: The API key is project-scoped, meaning it automatically grants access to the specific project it was created for. The MCP server will automatically detect which project you're working with.

### 2. Create Environment File

```bash
cp .env.example .env
```

Edit `.env`:

```bash
# Your Eureka Labo API URL (production URL with HTTPS)
EUREKA_API_URL=https://eurekalabo.162-43-92-100.nip.io

# Your project-specific API key (starts with pk_live_)
EUREKA_API_KEY=pk_live_your_personal_api_key_here

# WORKSPACE_PATH is optional - automatically uses Claude Code's current directory
# Only uncomment if you need to override:
# WORKSPACE_PATH=/path/to/your/git/repository
```

### 3. Configure Claude Code

Add to `~/.claude/mcp.json`:

**For Mac/Linux:**
```json
{
  "mcpServers": {
    "eureka-tasks": {
      "command": "npx",
      "args": [
        "tsx",
        "/Users/yourname/workspace/eurekalabo/mcp-server/src/index.ts"
      ],
      "env": {
        "EUREKA_API_URL": "https://eurekalabo.162-43-92-100.nip.io",
        "EUREKA_API_KEY": "pk_live_..."
      }
    }
  }
}
```

**For Windows:**
```json
{
  "mcpServers": {
    "eureka-tasks": {
      "command": "npx",
      "args": [
        "tsx",
        "C:/workspace/eurekalabo/mcp-server/src/index.ts"
      ],
      "env": {
        "EUREKA_API_URL": "https://eurekalabo.162-43-92-100.nip.io",
        "EUREKA_API_KEY": "pk_live_..."
      }
    }
  }
}
```

**Note**:
- The MCP server automatically uses the directory where Claude Code is opened. No need to specify `WORKSPACE_PATH`!
- The project ID is automatically fetched from your API key on initialization, so you don't need to configure it manually.

## Usage

### Task Management

```bash
# List all tasks
@eureka-tasks list_tasks

# Filter by status
@eureka-tasks list_tasks {"status": "todo"}

# Get specific task
@eureka-tasks get_task {"taskId": "cmXXXXXXXXXXX"}

# Create task
@eureka-tasks create_task {
  "title": "Implement JWT authentication",
  "description": "Add JWT token verification middleware",
  "priority": "high"
}

# Update task
@eureka-tasks update_task {
  "taskId": "cmXXXXXXXXXXX",
  "status": "in_progress"
}
```

### Development Workflow

```bash
# 1. Start work on a task (captures git baseline)
@eureka-tasks start_work_on_task {"taskId": "cmXXXXXXXXXXX"}

# 2. Do your development work (edit files)
# Note: コミットは不要です！未コミットの変更も自動的にキャプチャされます。

# 3. Complete work (captures all changes and logs to task)
@eureka-tasks complete_task_work {
  "taskId": "cmXXXXXXXXXXX",
  "summary": "bcryptを使用したJWT認証を実装しました"
}

# OR automatically create PR when completing the task
@eureka-tasks complete_task_work {
  "taskId": "cmXXXXXXXXXXX",
  "summary": "bcryptを使用したJWT認証を実装しました",
  "createPR": true
}

# This will:
# - Capture all changes from baseline (includes uncommitted changes!)
# - Store full diffs in task metadata (for react-diff-viewer in UI)
# - Update task description with formatted change summary in Japanese
# - Update task status to "done"
# - If createPR=true and all branch tasks are done: Automatically create a Pull Request
# - If createPR=false: Suggest creating a pull request if appropriate
```

**重要な変更点:**
- ✅ **コミット不要**: 未コミットの変更も自動的にキャプチャされます
- ✅ **リアルタイム変更**: working directoryの現在の状態を取得
- ✅ **柔軟性**: コミットしてもしなくても、どちらでも動作します

**タスク説明フォーマット（完了後）：**

```markdown
## 🎯 実装概要

bcryptを使用したJWT認証を実装しました

## 📊 変更統計

- **変更ファイル数**: 3個
- **追加行数**: +243行
- **削除行数**: -12行
- **ブランチ**: `feature/auth`
- **コミット**: `def456g`

## 📁 変更ファイル一覧

✏️ `src/middleware/auth.ts` (+45/-12)
➕ `tests/auth.test.ts` (+78/0)
➕ `docs/auth.md` (+120/0)

---

*詳細な差分はタスクのメタデータに保存されており、UIでreact-diff-viewerを使用して表示できます。*
```

### Pull Request Creation

```bash
# List tasks in current branch
@eureka-tasks list_branch_tasks

# Create PR (with tracked tasks)
@eureka-tasks create_pull_request

# Create PR with custom title and base branch
@eureka-tasks create_pull_request {
  "title": "新機能: ユーザー認証の実装",
  "baseBranch": "develop"
}

# 🤖 Smart PR Creation - No Tasks Required!
# If you create a PR without any tracked tasks, the system will:
# 1. Analyze all git changes in your branch
# 2. Auto-generate a Japanese task title from branch name
#    - feature/add-auth → "add authの実装"
#    - fix/user-login → "user loginの修正"
# 3. Create task with complete change summary in Japanese
# 4. Attach all git diffs to the task
# 5. Create the PR with proper task linking

# Example: Direct PR from feature branch without start_work_on_task
git checkout -b feature/add-authentication
# ... make your changes ...
git commit -m "Add JWT authentication"
@eureka-tasks create_pull_request

# Result:
# ✅ Pull Requestを作成しました！
# PR URL: https://github.com/...
# 📝 タスクを自動作成しました: add authenticationの実装
```

### Utilities

```bash
# List project members (for task assignment)
@eureka-tasks list_project_members {"projectId": "cmXXXXXXXXXXX"}

# Upload file attachment
@eureka-tasks upload_task_attachment {
  "taskId": "cmXXXXXXXXXXX",
  "filePath": "/path/to/file.pdf"
}

# Check active work sessions
@eureka-tasks get_active_sessions

# Cancel work session
@eureka-tasks cancel_work_session {"taskId": "cmXXXXXXXXXXX"}
```

## Work Session Flow

### Complete Workflow Example

```
1. 開発者がUIでタスクを作成: "ユーザー認証の追加"

2. Claude Codeが作業を開始:
   Claude> @eureka-tasks start_work_on_task {"taskId": "cm123"}
   Response: ✅ Started work session (baseline: abc123)

3. Claude Codeがファイルを編集:
   - src/middleware/auth.ts
   - tests/auth.test.ts
   - docs/auth.md

4. コミットは不要！（オプション）
   # 未コミットの変更も自動的にキャプチャされます
   # コミットしたい場合はしてもOK：
   git add .
   git commit -m "Add JWT authentication"

5. Claude Codeが作業を完了:
   Claude> @eureka-tasks complete_task_work {
     "taskId": "cm123",
     "summary": "包括的なテストを含むJWT認証を実装しました"
   }

   Response: ✅ 作業セッションを完了しました
     - ファイル変更: 3個
     - 追加: +243行
     - 削除: -12行

   タスク説明とメタデータを更新しました。

   💡 このブランチで複数のタスクが完了しています。
   create_pull_requestツールを使用してPRを作成できます。

6. Eureka Labo UIで表示:
   - タスクステータス: "完了"
   - タスク説明: 日本語の概要 + ファイル一覧 + 統計
   - タスクメタデータ: react-diff-viewer用の完全な差分
     • oldValue: 変更前のファイル全体
     • newValue: 変更後のファイル全体（working directoryから取得）
     • unifiedDiff: git unified diff形式
   - 変更ログ: シンタックスハイライト付きの並列差分表示
```

## Change Log Format

Changes are stored in relational tables `WorkSession` and `WorkSessionChange`:

```sql
-- WorkSession table
CREATE TABLE "WorkSession" (
  "id" TEXT PRIMARY KEY,
  "taskId" TEXT REFERENCES "Task"(id) ON DELETE CASCADE,
  "sessionId" TEXT UNIQUE,
  "startedAt" TIMESTAMP NOT NULL,
  "completedAt" TIMESTAMP,
  "summary" TEXT,
  "gitBaseline" TEXT NOT NULL,
  "gitFinal" TEXT NOT NULL,
  "branch" TEXT NOT NULL,
  "statistics" JSONB NOT NULL,  -- { filesChanged, linesAdded, linesRemoved }
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- WorkSessionChange table
CREATE TABLE "WorkSessionChange" (
  "id" TEXT PRIMARY KEY,
  "workSessionId" TEXT REFERENCES "WorkSession"(id) ON DELETE CASCADE,
  "file" TEXT NOT NULL,
  "changeType" TEXT NOT NULL,  -- 'added' | 'modified' | 'deleted'
  "linesAdded" INTEGER NOT NULL,
  "linesRemoved" INTEGER NOT NULL,
  "language" TEXT NOT NULL,
  "oldValue" TEXT NOT NULL,  -- Full old file content
  "newValue" TEXT NOT NULL,  -- Full new file content
  "unifiedDiff" TEXT NOT NULL,  -- Git unified diff
  "createdAt" TIMESTAMP DEFAULT NOW()
);
```

**Example Data:**
```typescript
// WorkSession record
{
  "id": "cm123abc456",
  "taskId": "cmXXXXXXXXXXX",
  "sessionId": "session_1738051200000",
  "startedAt": "2025-01-28T10:00:00Z",
  "completedAt": "2025-01-28T10:45:00Z",
  "summary": "Implemented JWT authentication",
  "gitBaseline": "abc123def",
  "gitFinal": "def456ghi",
  "branch": "feature/auth",
  "statistics": {
    "filesChanged": 3,
    "linesAdded": 243,
    "linesRemoved": 12
  },
  "changes": [
    // WorkSessionChange records (joined)
    {
      "id": "cmCHG001",
      "workSessionId": "cm123abc456",
      "file": "src/middleware/auth.ts",
      "changeType": "modified",
      "linesAdded": 45,
      "linesRemoved": 12,
      "language": "typescript",
      "oldValue": "// full old file content",
      "newValue": "// full new file content",
      "unifiedDiff": "@@ -10,5 +10,8 @@ ..."
    }
  ]
}
```

## Supported Languages

Automatic syntax highlighting for:
- TypeScript/JavaScript (.ts, .tsx, .js, .jsx)
- Python (.py)
- Go (.go)
- Rust (.rs)
- Java (.java)
- C/C++ (.c, .cpp, .h, .hpp)
- Ruby (.rb)
- PHP (.php)
- And 20+ more languages

## Troubleshooting

### "Workspace is not a git repository"

```bash
cd /path/to/your/project
git init
git add .
git commit -m "Initial commit"
```

### "変更が検出されませんでした"

```bash
# 以下を確認：
# 1. ファイルが実際に編集されているか
# 2. 正しいディレクトリで作業しているか（gitリポジトリ内）
# 3. start_work_on_task を実行してからファイルを編集したか

# デバッグ：
git status              # 変更されたファイルを確認
git diff                # 差分を確認
```

### "Authentication failed"

1. Check API key is correct in `.env`
2. Verify key hasn't expired in Eureka Labo UI
3. Ensure key has required permissions

### "No active work session found"

`complete_task_work`を実行する前に、必ず`start_work_on_task`を実行してください。

```bash
# 正しい順序：
@eureka-tasks start_work_on_task {"taskId": "..."}   # 1. 開始
# ファイル編集                                        # 2. 作業
@eureka-tasks complete_task_work {"taskId": "...", "summary": "..."} # 3. 完了
```

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Start production build
npm start
```

## Architecture

```
mcp-server/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── config.ts             # Environment configuration
│   ├── api/
│   │   └── client.ts         # Eureka API wrapper
│   ├── tools/
│   │   ├── task-tools.ts     # Task CRUD operations
│   │   └── work-session.ts   # Work session management
│   └── tracking/
│       └── git-tracker.ts    # Git diff capture
├── package.json
├── tsconfig.json
└── .env
```

## License

MIT
