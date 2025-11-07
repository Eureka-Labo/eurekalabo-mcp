---
name: eureka-board-router
description: Intelligently routes tasks to correct boards based on file paths, keywords, and project context. Prevents manual board selection errors. Use when creating tasks or organizing work.
allowed-tools: mcp__eureka-tasks__*, Read, Grep, Glob
---

# Board-Aware Task Router

Automatically assigns tasks to the correct board based on file context, keywords, and repository structure, ensuring proper task organization without manual board selection.

## Auto-Activation Triggers

- **Before**: Creating any task with `create_task`
- **Keywords**: "organize tasks", "which board", "assign to board"
- **Context**: When task creation lacks `boardId` parameter

## Board Detection Strategy

### 1. Repository-Based Detection

```javascript
// Detect git repository for multi-repo projects
const gitRoot = await Bash("git rev-parse --show-toplevel");
const repoName = await Bash("basename $(git config --get remote.origin.url .git)");

// Map repository to board
const boardMapping = {
  "eurekalabo-frontend": "Frontend Board",
  "eurekalabo-api": "Backend Board",
  "eurekalabo-mobile": "Mobile Board",
  "eurekalabo-mcp-server": "MCP Development Board"
};
```

### 2. File Path Analysis

Analyzes file paths mentioned in task description or current working directory:

```javascript
const pathPatterns = {
  // Frontend boards
  "/src/components/": "Frontend Board",
  "/src/pages/": "Frontend Board",
  "/src/hooks/": "Frontend Board",
  "/app/": "Next.js Board",
  "/public/": "Frontend Board",

  // Backend boards
  "/api/": "Backend Board",
  "/server/": "Backend Board",
  "/services/": "Backend Board",
  "/prisma/": "Backend Board",
  "/database/": "Backend Board",

  // Mobile boards
  "/ios/": "Mobile Board",
  "/android/": "Mobile Board",
  "/mobile/": "Mobile Board",

  // Infrastructure
  "/docker/": "DevOps Board",
  "/k8s/": "DevOps Board",
  "/.github/workflows/": "DevOps Board",
  "/terraform/": "DevOps Board",

  // Documentation
  "/docs/": "Documentation Board",
  "README.md": "Documentation Board",

  // Testing
  "/__tests__/": "QA Board",
  "/test/": "QA Board",
  "/e2e/": "QA Board"
};
```

### 3. Keyword Analysis

Analyzes task title and description for domain keywords:

```javascript
const keywordMapping = {
  frontend: ["UI", "コンポーネント", "React", "Vue", "画面", "フロントエンド", "レイアウト"],
  backend: ["API", "エンドポイント", "データベース", "サーバー", "バックエンド", "認証"],
  mobile: ["iOS", "Android", "モバイル", "アプリ", "ネイティブ"],
  devops: ["デプロイ", "CI/CD", "Docker", "Kubernetes", "インフラ", "監視"],
  qa: ["テスト", "品質", "バグ", "QA", "検証", "テストケース"],
  design: ["デザイン", "UI/UX", "プロトタイプ", "Figma", "スタイル"],
  documentation: ["ドキュメント", "文書", "マニュアル", "説明書", "README"]
};
```

### 4. Task Type Detection

Determines board based on task type prefix:

```javascript
const typeMapping = {
  "メンテナンス": "Maintenance Board",
  "修正": "Bug Fix Board",
  "リファクタリング": "Technical Debt Board",
  "新機能": "Feature Development Board"
};
```

## Workflow

### Step 1: Get Available Boards

```javascript
const boards = await mcp__eureka-tasks__list_boards();

// Returns:
// [
//   { id: "board-1", name: "Frontend Board", repository: "frontend" },
//   { id: "board-2", name: "Backend Board", repository: "api" },
//   ...
// ]
```

### Step 2: Analyze Context

```javascript
const context = {
  currentDirectory: process.cwd(),
  gitRepository: getCurrentRepo(),
  mentionedFiles: extractFilesFromDescription(taskDescription),
  keywords: extractKeywords(taskTitle + " " + taskDescription),
  taskType: detectTaskType(taskTitle)
};
```

### Step 3: Score Each Board

```javascript
function scoreBoardMatch(board, context) {
  let score = 0;

  // Repository match (highest weight)
  if (board.repository === context.gitRepository) score += 50;

  // File path matches
  for (const file of context.mentionedFiles) {
    if (matchesBoard(file, board)) score += 20;
  }

  // Keyword matches
  for (const keyword of context.keywords) {
    if (boardKeywords[board.id].includes(keyword)) score += 10;
  }

  // Task type match
  if (board.name.includes(context.taskType)) score += 15;

  return score;
}
```

### Step 4: Select Best Board

```javascript
const boardScores = boards.map(board => ({
  board,
  score: scoreBoardMatch(board, context),
  reasoning: explainMatch(board, context)
}));

const bestMatch = boardScores.sort((a, b) => b.score - a.score)[0];

// Confidence thresholds
if (bestMatch.score >= 50) {
  // High confidence - auto-assign
  return { boardId: bestMatch.board.id, confidence: "high" };
} else if (bestMatch.score >= 30) {
  // Medium confidence - suggest with confirmation
  return { boardId: bestMatch.board.id, confidence: "medium", requireConfirm: true };
} else {
  // Low confidence - ask user
  return { confidence: "low", suggestOptions: boardScores.slice(0, 3) };
}
```

### Step 5: Apply or Confirm

**High Confidence** (score >= 50):
```javascript
// Auto-apply
const task = await mcp__eureka-tasks__create_task({
  title: taskTitle,
  description: taskDescription,
  boardId: bestMatch.board.id
});

console.log(`✅ タスクを「${bestMatch.board.name}」に自動割り当てしました`);
```

**Medium Confidence** (30-49):
```javascript
console.log(`
📋 タスクボードの推奨

推奨ボード: ${bestMatch.board.name}
理由: ${bestMatch.reasoning}

このボードに割り当てますか？
- Yes → 続行
- No → 他のボードを選択
`);
```

**Low Confidence** (< 30):
```javascript
console.log(`
❓ ボード割り当てが不明確です

候補:
1. ${options[0].board.name} (${options[0].score}% 一致)
2. ${options[1].board.name} (${options[1].score}% 一致)
3. ${options[2].board.name} (${options[2].score}% 一致)

どのボードに割り当てますか？番号で指定してください。
`);
```

## Integration with Task Creation

### Automatic Integration

```javascript
// Original task creation (without boardId)
await mcp__eureka-tasks__create_task({
  title: "認証APIエンドポイントの追加",
  description: "src/api/auth.ts にJWT認証エンドポイントを実装"
});

// Skill intercepts and analyzes:
// - Repository: eurekalabo-api
// - File path: src/api/ (backend pattern)
// - Keywords: "API", "エンドポイント", "認証"
// - Result: 85% match with "Backend Board"

// Auto-applies boardId:
await mcp__eureka-tasks__create_task({
  title: "認証APIエンドポイントの追加",
  description: "src/api/auth.ts にJWT認証エンドポイントを実装",
  boardId: "backend-board-id"  // ← Auto-added
});
```

### Works With Other Skills

```javascript
// eureka-task-coding creates task
→ eureka-board-router activates
→ Analyzes context
→ Adds boardId before creation
→ Task created on correct board automatically
```

## Smart Features

### 1. Multi-File Task Detection

For tasks affecting multiple areas:

```javascript
// Task description mentions both frontend and backend files
"Add authentication: Update Login.tsx and auth.ts API"

// Analysis:
// - Login.tsx → Frontend (50%)
// - auth.ts → Backend (50%)

// Decision: Split or assign to Integration Board
console.log(`
⚠️ このタスクは複数の領域にまたがります:
- Frontend: Login.tsx
- Backend: auth.ts

推奨:
1. タスクを2つに分割 (推奨)
   - 「ログイン画面の実装」→ Frontend Board
   - 「認証APIの実装」→ Backend Board
2. 統合ボードに割り当て
   - 「認証機能の実装」→ Integration Board

どちらにしますか？
`);
```

### 2. Learning from Past Assignments

```javascript
// Track user's board assignment patterns
const history = {
  "API認証": "Backend Board",
  "ログイン画面": "Frontend Board",
  "Docker設定": "DevOps Board"
};

// Use history to improve future predictions
if (similarTaskInHistory(newTask)) {
  const historicalBoard = getHistoricalBoard(newTask);
  score += 25; // Boost historical match
}
```

### 3. Repository Configuration

```javascript
// .claude/board-routing-config.json
{
  "rules": [
    {
      "pattern": "src/components/**",
      "board": "Frontend Board",
      "priority": "high"
    },
    {
      "pattern": "api/**/*.ts",
      "board": "Backend Board",
      "priority": "high"
    },
    {
      "keywords": ["デプロイ", "CI/CD"],
      "board": "DevOps Board",
      "priority": "medium"
    }
  ],
  "defaultBoard": "General Board",
  "requireConfirmation": false
}
```

## Error Handling

### No Boards Available
```
❌ プロジェクトにボードが見つかりません

Eureka Tasksダッシュボードでボードを作成してください:
https://eurekalabo.com/projects/{projectId}/boards

デフォルトの「開発ボード」を使用してタスクを作成しますか？
```

### Ambiguous Context
```
⚠️ ボードを自動判定できませんでした

分析結果:
- リポジトリ: mcp-server
- ファイル: なし
- キーワード: "実装", "追加" (一般的すぎる)

利用可能なボード:
1. Frontend Board
2. Backend Board
3. MCP Development Board

番号で選択してください (1-3):
```

### Board Not Found
```
❌ 指定されたボード ID が見つかりません: ${boardId}

利用可能なボード:
${boards.map(b => `- ${b.name} (${b.id})`).join('\n')}

正しいボードIDを指定するか、自動割り当てを使用してください。
```

## Examples

### Example 1: Clear Frontend Task

```
Task: "ユーザープロフィール画面の作成"
Description: "src/components/UserProfile.tsx を実装"

🔍 Board Analysis:
✓ File path: src/components/ → Frontend pattern
✓ Keywords: "画面", "コンポーネント"
✓ Repository: eurekalabo-frontend

🎯 Best Match: Frontend Board (95% confidence)

✅ タスクを「Frontend Board」に自動割り当てしました
```

### Example 2: Backend API Task

```
Task: "決済APIエンドポイントの追加"
Description: "Stripe統合のため api/routes/payment.ts を作成"

🔍 Board Analysis:
✓ File path: api/routes/ → Backend pattern
✓ Keywords: "API", "エンドポイント"
✓ Repository: eurekalabo-api

🎯 Best Match: Backend Board (90% confidence)

✅ タスクを「Backend Board」に自動割り当てしました
```

### Example 3: Ambiguous Task

```
Task: "パフォーマンスの改善"
Description: "アプリケーション全体の速度を向上させる"

🔍 Board Analysis:
✗ File path: なし (一般的な説明)
⚠️ Keywords: "パフォーマンス", "改善" (複数領域)
✓ Repository: eurekalabo-frontend

📊 Candidates:
1. Frontend Board (40%) - Current repository
2. Backend Board (35%) - Performance work
3. DevOps Board (25%) - Infrastructure optimization

❓ より具体的な情報が必要です:
- どのコンポーネント/ファイルを改善しますか？
- フロントエンド、バックエンド、またはインフラ？

ボードを選択してください (1-3):
```

### Example 4: Multi-Area Task

```
Task: "ユーザー認証機能の実装"
Description: "Login.tsx, auth.ts API, JWT middleware を実装"

🔍 Board Analysis:
✓ Multiple areas detected:
  - Login.tsx → Frontend
  - auth.ts API → Backend
  - JWT middleware → Backend

⚠️ このタスクは複数領域にまたがります

推奨: タスク分割
1. 「ログイン画面の実装」→ Frontend Board
   - Login.tsx のUI実装
2. 「認証APIとミドルウェアの実装」→ Backend Board
   - auth.ts API エンドポイント
   - JWT middleware

タスクを分割しますか？(y/n):
```

## Configuration

### Custom Routing Rules

Create `.claude/board-routing-config.json`:

```json
{
  "repositoryMapping": {
    "eurekalabo-frontend": "Frontend Board",
    "eurekalabo-api": "Backend Board",
    "eurekalabo-mobile": "Mobile Board"
  },
  "pathPatterns": {
    "src/components/**": "Frontend Board",
    "api/**": "Backend Board"
  },
  "keywordBoost": {
    "UI": 15,
    "API": 15,
    "テスト": 10
  },
  "confidence": {
    "autoAssign": 50,
    "suggestWithConfirm": 30,
    "askUser": 0
  },
  "defaultBoard": "General Board"
}
```

## Best Practices

1. **Be specific in descriptions**: Mention file paths for better routing
2. **Use consistent keywords**: Helps skill learn patterns
3. **Review suggestions**: Check medium-confidence assignments
4. **Configure custom rules**: Add project-specific routing logic
5. **Split multi-area tasks**: Better organization and tracking

## Performance

- Board analysis: < 1 second
- No additional API calls (uses cached board list)
- Runs before task creation (no extra wait)
- Scoring is CPU-only (fast)

## Permissions Required

- Read: Board list, project configuration
- Analysis: File paths, git repository info
- Modify: Add boardId to task creation parameters
