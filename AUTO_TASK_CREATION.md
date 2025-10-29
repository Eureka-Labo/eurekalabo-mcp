# Auto Task Creation for Pull Requests

## Overview

When creating a Pull Request without any tracked tasks in the branch, the MCP server now automatically creates a task with complete git change information. This feature allows developers to create PRs directly without the formal `start_work_on_task` → `complete_task_work` workflow.

## Key Features

### 🤖 Automatic Task Generation
- Analyzes all git changes in the current branch
- Generates Japanese task title from branch name
- Creates comprehensive task description with change statistics
- Attaches complete git diffs to the task

### 🇯🇵 Japanese Content
- All auto-generated task titles and descriptions are in Japanese
- PR titles are auto-generated in Japanese
- User messages and notifications are in Japanese

### 📊 Complete Change Tracking
- Captures file changes from branch baseline to current state
- Stores full diffs in WorkSession for react-diff-viewer
- Calculates accurate statistics (files changed, lines added/removed)

## Branch Name → Task Title Mapping

The system intelligently converts branch names to Japanese task titles:

| Branch Name | Generated Task Title |
|-------------|---------------------|
| `feature/add-auth` | `add authの実装` |
| `fix/user-login` | `user loginの修正` |
| `refactor/api-client` | `api clientのリファクタリング` |
| `docs/update-readme` | `update readmeのドキュメント更新` |
| `test/add-unit-tests` | `add unit testsのテスト追加` |
| `chore/update-deps` | `update depsのメンテナンス` |

## Usage Examples

### Scenario 1: Quick PR Without Task Tracking

```bash
# Create a feature branch and make changes
git checkout -b feature/add-authentication
# ... edit files ...
git add .
git commit -m "Add JWT authentication"

# Create PR directly - no start_work_on_task needed!
@eureka-tasks create_pull_request

# Result:
# ✅ Pull Requestを作成しました！
# PR URL: https://github.com/...
# PR番号: #123
# 連携タスク数: 1件
#
# 📝 タスクを自動作成しました: add authenticationの実装
```

### Scenario 2: PR with Custom Title

```bash
# Create changes
git checkout -b feature/user-profile
# ... make changes ...
git commit -m "Implement user profile page"

# Create PR with custom Japanese title
@eureka-tasks create_pull_request {
  "title": "新機能: ユーザープロフィールページの実装"
}
```

### Scenario 3: Multiple Commits Without Task

```bash
git checkout -b fix/authentication-bug
git commit -m "Fix token validation"
git commit -m "Add error handling"
git commit -m "Update tests"

# Create PR - captures all commits
@eureka-tasks create_pull_request

# Auto-creates task with all changes from branch baseline
```

## Generated Task Structure

### Task Title (Japanese)
Based on branch name pattern and prefix

### Task Description (Japanese)
```markdown
## 🎯 実装概要

ブランチ `feature/add-auth` での開発作業を完了しました。

## 📊 変更統計

- **変更ファイル数**: 5個
- **追加行数**: +243行
- **削除行数**: -12行
- **ブランチ**: `feature/add-auth`
- **ベースコミット**: `abc123d`
- **最終コミット**: `def456g`

## 📁 変更ファイル一覧

✏️ `src/middleware/auth.ts` (+45/-12)
➕ `tests/auth.test.ts` (+78/0)
➕ `docs/auth.md` (+120/0)

---

*この作業内容はPull Requestと連携されています。*
```

### WorkSession Data
Complete git diffs attached with:
- Full old/new file contents
- Unified diff format
- Language detection for syntax highlighting
- Line-level change statistics

## Technical Implementation

### Git Baseline Detection
The system finds the branch baseline using:
1. Merge base with `origin/main` or `main`
2. Merge base with `origin/master` or `master`
3. First commit in branch (fallback)

### Change Capture
```typescript
// Capture all changes from baseline to working directory
const changes = await captureWorkSessionChanges(workspacePath, gitBaseline);

// Generate task content in Japanese
const taskTitle = generateTaskTitleFromBranch(branchName);
const taskDescription = generateTaskDescriptionFromChanges(changes, branchName);

// Create task with status 'done' and priority 'medium'
const task = await apiClient.createTask({
  title: taskTitle,
  description: taskDescription,
  status: 'done',
  priority: 'medium',
});

// Attach complete work session with diffs
await apiClient.createWorkSession(task.id, workSession);
```

### Error Handling

**No Changes Detected**
```
ブランチ "feature/xyz" に変更が検出されませんでした。
ファイルを編集してから再度実行してください。
```

**Task Creation Failed**
```
タスクの自動作成に失敗しました: [error details]

手動でタスクを作成してstart_work_on_taskを実行するか、
既存のタスクで作業を開始してください。
```

## When to Use Auto-Creation vs Manual Workflow

### Use Auto-Creation ✅
- Quick fixes or small features
- Prototype or experimental work
- Solo development without formal task tracking
- Retroactive PR creation for existing branches

### Use Manual Workflow ✅
- Formal project management required
- Multiple developers collaborating
- Need precise time tracking
- Task created before implementation starts

## Compatibility

### With Existing Workflows
- Auto-creation only triggers when NO tasks exist in branch
- If tasks exist, normal PR flow continues
- Existing `start_work_on_task` workflow unchanged
- Both workflows can coexist in same project

### Backend Requirements
- Eureka Labo backend must support:
  - WorkSession creation API
  - WorkSessionChange storage
  - GitHub integration for PR creation
  - Japanese content in task descriptions

## Benefits

1. **Flexibility**: Developers can choose workflow based on context
2. **No Lost Work**: All changes tracked even without formal task workflow
3. **Consistency**: Auto-generated tasks follow same format as manual tasks
4. **Japanese-First**: All generated content in Japanese for Japanese teams
5. **Complete Tracking**: Full git diffs captured regardless of workflow

## Limitations

1. Auto-generated titles may need manual refinement
2. Task summary is generic - developers may want to add details
3. Cannot split changes into multiple tasks retroactively
4. Requires proper branch naming conventions for meaningful titles

## Future Enhancements

Potential improvements:
- AI-powered task title generation from commit messages
- Configurable language (English/Japanese)
- Task template customization
- Automatic task splitting based on file changes
- Integration with AI code review for task description enhancement
