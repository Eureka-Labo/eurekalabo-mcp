---
name: eureka-smart-commits
description: Generates conventional commit messages with Japanese summaries using technical-writer analysis. Use when committing changes or completing task work sessions.
---

# Eureka Smart Commits

AI-powered commit message generation following Conventional Commits with Japanese summaries.

## Auto-Activation Triggers

- User says: "commit", "create commit", "commit these changes"
- Completing task work session
- Manual git commit requests

## Workflow

### 1. Analyze Changes
```bash
git diff --staged
# or
git diff HEAD
```

### 2. Generate Smart Commit Message
```
mcp__eureka-tasks__generate_smart_commit_message({
  gitDiff: "<diff output>",
  taskContext: {
    taskId: "current-task-id",
    title: "task title",
    description: "task description"
  }
})
```

### 3. Commit Format

The generated message follows this structure:

```
<type>(<scope>): <subject>

<body with Japanese summary>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types**: feat, fix, refactor, docs, test, chore, style, perf

### 4. Execute Commit
```bash
git commit -m "$(cat <<'EOF'
<generated message>
EOF
)"
```

## Examples

### Feature Addition
```
feat(auth): Add JWT authentication middleware

APIにJWT認証ミドルウェアを追加しました。
トークン検証とユーザー認証フローを実装。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Bug Fix
```
fix(validation): Correct email validation regex

メール検証の正規表現エラーを修正しました。
特殊文字を含むメールアドレスに対応。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Integration with Task Completion

When completing a task work session:
```
mcp__eureka-tasks__complete_task_work({
  taskId: "task-id",
  summary: "実装内容の日本語サマリー"
})
```

The skill can generate commit message from:
- Git changes since session start
- Task context (title, description, summary)
- Technical-writer analysis
