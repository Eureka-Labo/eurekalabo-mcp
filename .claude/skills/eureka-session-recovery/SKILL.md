---
name: eureka-session-recovery
description: Recovers and resumes interrupted work sessions. Use when detecting orphaned session markers, git status shows uncommitted changes, or user mentions interrupted work.
---

# Eureka Session Recovery

Automatically detect and recover interrupted work sessions.

## Auto-Activation Triggers

- Session marker exists but no clear context
- User says: "what was I working on?", "resume work", "continue"
- Uncommitted changes detected in git status
- Session conflicts detected

## Detection

### Check for Orphaned Sessions
```
1. Check if .eureka-active-session exists
2. Read session metadata
3. Check git status for uncommitted changes
4. Verify task still exists in system
```

### Get Active Sessions
```
mcp__eureka-tasks__get_active_sessions()
```

## Recovery Actions

### Option 1: Complete Session
```
mcp__eureka-tasks__complete_task_work({
  taskId: "task-id",
  summary: "作業内容のサマリーを日本語で"
})
```

**When to use**: Changes are complete and ready to commit

### Option 2: Cancel Session
```
mcp__eureka-tasks__cancel_work_session({
  taskId: "task-id"
})
```

**When to use**:
- Work was experimental/temporary
- Want to start fresh
- Session is corrupted

### Option 3: Resume Session
```
// Session already active - just continue
// No action needed, inform user of current task
```

## Recovery Workflow

### 1. Detect Session State
```typescript
const sessionMarker = '.eureka-active-session';
if (exists(sessionMarker)) {
  const session = readJSON(sessionMarker);
  const gitStatus = execSync('git status --short').toString();

  if (gitStatus.trim()) {
    // Has uncommitted changes - offer to complete
  } else {
    // No changes - offer to cancel
  }
}
```

### 2. Analyze Changes
```bash
git diff HEAD
git diff --stat
```

### 3. Offer User Options
```
タスク「{task.title}」のセッションが残っています。

変更内容:
{git diff summary}

アクション:
1. セッションを完了する（変更をコミット）
2. セッションをキャンセルする（変更を保持）
3. 作業を続ける
```

## Conflict Resolution

### Multiple Active Sessions
```
// Should not happen, but if it does:
1. List all active sessions
2. Show task details for each
3. Cancel stale sessions
4. Keep only the current one
```

### Stale Sessions (>24 hours)
```
if (sessionAge > 24 * 60 * 60 * 1000) {
  console.log('⚠️  Session is older than 24 hours');
  // Offer to cancel automatically
}
```

## Examples

### Scenario 1: Resume After Restart

**Detection**:
- Claude Code restarts
- Session marker exists
- Uncommitted changes present

**Action**:
```
セッション「APIに認証を追加」を検出しました。

変更ファイル:
- src/auth.ts (新規作成)
- src/index.ts (変更)

作業を続けますか？
[Y] 続ける  [C] 完了する  [X] キャンセル
```

### Scenario 2: Clean Up Stale Session

**Detection**:
- Session marker exists
- No uncommitted changes
- Session is 48 hours old

**Action**:
```
古いセッションを検出しました（48時間前）。
変更内容がないため、セッションをキャンセルします。
```

### Scenario 3: Conflict Resolution

**Detection**:
- User tries to start new session
- Active session already exists

**Action**:
```
既存のセッション「{existing.title}」があります。

オプション:
1. 既存セッションを完了して新規セッションを開始
2. 既存セッションをキャンセルして新規セッションを開始
3. 既存セッションを続ける
```
