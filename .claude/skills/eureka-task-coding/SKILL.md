---
name: eureka-task-coding
description: Manages Eureka Tasks workflow for code changes. Automatically creates tasks and starts work sessions before any Write/Edit operations. Use when user requests code implementation, bug fixes, or file modifications.
---

# Eureka Task-Aware Coding

Automatically integrates Eureka Tasks workflow with code changes.

## Auto-Activation Triggers

This skill activates when user requests:
- **Implementation**: "add", "implement", "create", "build"
- **Modifications**: "fix", "refactor", "update", "modify", "change"
- **Features**: "add feature", "new feature", "implement feature"

## Automatic Workflow

### 1. Search Existing Tasks
```
mcp__eureka-tasks__list_tasks({
  search: "keywords extracted from user request"
})
```

Extract relevant keywords from user's request for intelligent search.

### 2. Create Task if Needed

**CRITICAL: Always use Japanese for title and description**

```
mcp__eureka-tasks__create_task({
  title: "ユーザーの依頼を日本語で簡潔に要約",
  description: "実装する内容と技術的アプローチを日本語で詳しく記述",
  priority: "medium" // or "high", "low" based on context
})
```

### 3. Start Work Session
```
mcp__eureka-tasks__start_work_on_task({ taskId: task.id })
```

This creates `.eureka-active-session` marker that allows Write/Edit operations.

### 4. Implement Code Changes

Now proceed with requested Write/Edit operations.

### 5. User Communication

**Tell the user what you did:**
```
タスク「{task.title}」を作成して作業を開始しました。実装します...
```

## Integration with Hooks

This skill works seamlessly with the PreToolUse hook:
- Hook checks for `.eureka-active-session`
- Skill creates session before Write/Edit
- Operations proceed without user intervention

## Error Handling

### Session Already Active
```
if (activeSessionExists) {
  // Ask user: complete existing or create new task?
  // Offer: complete_task_work or cancel_work_session
}
```

### Task Creation Fails
```
// Retry with simpler title/description
// Or ask user for manual task creation
```

## Examples

**User Request**: "Add JWT authentication to the API"

**Skill Actions**:
1. Search tasks: "JWT", "認証", "auth", "API"
2. No match found → Create: "APIにJWT認証を追加"
3. Start session with task ID
4. Tell user: "タスク「APIにJWT認証を追加」を作成して作業を開始しました"
5. Proceed with implementation

---

**User Request**: "Fix the bug in user validation"

**Skill Actions**:
1. Search tasks: "bug", "validation", "バグ", "検証"
2. Found existing task → Use that task
3. Start session
4. Tell user: "既存のタスクで作業を開始しました"
5. Fix the bug
