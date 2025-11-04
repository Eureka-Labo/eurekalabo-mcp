# Session Progress Tracking

## Overview

The MCP server now automatically persists task progress across Claude Code sessions using `.eureka-session.json` stored at the workspace root.

## Features

### Auto-Save Progress
When you update tasks with parent-child relationships, progress is automatically saved:
- Parent task completion percentage
- Subtask status (todo, in_progress, done)
- Last updated timestamp
- Current git branch

### Session File Location
```
<workspace-root>/.eureka-session.json
```

### Example Session File
```json
{
  "version": "1.0.0",
  "projectId": "cmgrn7wk4001ln13uxhq3id2t",
  "lastSaved": "2025-10-30T07:53:35.750Z",
  "activeTasks": [
    {
      "id": "cmhd4nsuh000vpc0t04gb49fu",
      "title": "Session Persistence Testing",
      "status": "in_progress",
      "priority": "high",
      "completionPercentage": 33,
      "subtasks": [
        {
          "id": "cmhd4nyob000zpc0t6j3ho3vx",
          "title": "Subtask 1: Build session state manager",
          "status": "done",
          "priority": "high",
          "completedAt": null
        },
        {
          "id": "cmhd4nyr40013pc0tdtgrd5l3",
          "title": "Subtask 2: Integrate with task updates",
          "status": "in_progress",
          "priority": "medium",
          "completedAt": null
        },
        {
          "id": "cmhd4nytm0017pc0t6rj0xpx9",
          "title": "Subtask 3: Test persistence across sessions",
          "status": "todo",
          "priority": "medium",
          "completedAt": null
        }
      ],
      "lastUpdated": "2025-10-30T07:53:35.750Z"
    }
  ],
  "branch": "main"
}
```

## MCP Tools

### `get_session_progress`
View current session progress with parent tasks and subtasks.

**Usage:**
```typescript
// Returns formatted summary
{
  "success": true,
  "summary": "📋 Session Progress (Branch: main)\n...",
  "sessionFile": "/Users/yujirohikawa/workspace/eurekalabo/mcp-server/.eureka-session.json"
}
```

### `clear_session_completed_tasks`
Remove completed tasks (100% done) from session state.

**Usage:**
```typescript
// Returns count of removed tasks
{
  "success": true,
  "message": "Cleared 2 completed task(s) from session",
  "removedCount": 2
}
```

## How It Works

### 1. Task Update Triggers Save
```typescript
// When you update a subtask
updateTask(subtaskId, { status: "done" })
  ↓
// Parent task is fetched with all subtasks
getTask(parentTaskId)
  ↓
// Progress is calculated and saved to session
updateTaskProgress(parentTask, projectId, branch)
  ↓
// .eureka-session.json is updated
```

### 2. Completion Percentage Auto-Calculation
```typescript
completionPercentage = Math.round((completedSubtasks / totalSubtasks) * 100)
// completedSubtasks = subtasks with status 'done' or 'completed'
```

### 3. Auto-Cleanup
Tasks are automatically removed from session when:
- Status is "done" AND
- Completion percentage is 100%

## Best Practices

### 1. Always Use Parent-Child Tasks
```typescript
// Create parent task
const parent = await createTask({
  title: "Feature Implementation",
  status: "in_progress"
});

// Create subtasks linked to parent
const subtask1 = await createTask({
  title: "Step 1: Design",
  status: "done",
  parentTaskId: parent.id  // Link to parent
});
```

### 2. Update Subtask Status Regularly
```typescript
// Mark subtasks as done when complete
await updateTask(subtaskId, { status: "done" });
// Session automatically saves parent progress
```

### 3. Check Progress Between Sessions
```typescript
// View current progress
const progress = await getSessionProgress();
console.log(progress.summary);

// Expected output:
// 📋 Session Progress (Branch: main)
// Last saved: 10/30/2025, 4:53:35 PM
//
// 🎯 Feature Implementation [high]
//    Status: in_progress | Progress: 66% (2/3 subtasks)
//    ✅ Step 1: Design [done]
//    ✅ Step 2: Implement [done]
//    📋 Step 3: Test [todo]
```

### 4. Clean Up When Done
```typescript
// Remove completed tasks from session
await clearSessionCompletedTasks();
```

## Integration Points

### API Backend (task.service.ts)
- `calculateCompletionPercentage()` - Calculates parent task %
- `updateParentCompletion()` - Updates parent when subtask changes
- Auto-completion when all subtasks are done

### MCP Server (task-tools.ts)
- `saveTaskProgressToSession()` - Saves to .eureka-session.json
- Triggered on every `updateTask()` call
- Silent fail - doesn't break main workflow

### Session State Manager (session-state.ts)
- `loadSessionState()` - Loads from disk
- `saveSessionState()` - Saves to disk
- `updateTaskProgress()` - Updates specific task
- `getTaskProgressSummary()` - Formats display
- `clearCompletedTasks()` - Removes finished tasks

## File Structure

```
workspace/
├── .eureka-session.json          # Session progress (auto-created)
├── .gitignore                     # Add .eureka-session.json here
└── your-project/
    └── src/
```

## .gitignore Entry

Add this to your `.gitignore`:
```gitignore
# Eureka session state (local only)
.eureka-session.json
```

## Troubleshooting

### Session file not created?
- Ensure you're updating tasks with parent-child relationships
- Check that the workspace is a git repository
- Verify MCP server has write permissions

### Progress not persisting?
- Restart Claude Code to reload MCP server
- Check `.eureka-session.json` exists in workspace root
- Verify task has `parentTaskId` or `subtasks`

### Old tasks showing in session?
- Use `clear_session_completed_tasks` to clean up
- Manually delete `.eureka-session.json` to reset

## Example Workflow

```typescript
// 1. Create parent task for feature
const parent = await createTask({
  title: "Authentication System",
  description: "Implement JWT authentication",
  status: "in_progress",
  priority: "high"
});

// 2. Create subtasks (3 steps)
const subtasks = await Promise.all([
  createTask({ title: "1. Setup JWT library", status: "todo" }),
  createTask({ title: "2. Implement middleware", status: "todo" }),
  createTask({ title: "3. Add tests", status: "todo" })
]);

// 3. Link subtasks to parent
for (const subtask of subtasks) {
  await updateTask(subtask.id, { parentTaskId: parent.id });
}
// ✅ Session saved: 0% completion

// 4. Complete step 1
await updateTask(subtasks[0].id, { status: "done" });
// ✅ Session updated: 33% completion

// 5. Complete step 2
await updateTask(subtasks[1].id, { status: "done" });
// ✅ Session updated: 66% completion

// 6. Check progress
const progress = await getSessionProgress();
// Shows: "66% (2/3 subtasks)"

// 7. Complete step 3
await updateTask(subtasks[2].id, { status: "done" });
// ✅ Session updated: 100% completion
// ✅ Parent auto-completed to "done"
// ✅ Task removed from session (100% done)
```

## Benefits

1. **Resume Work Easily**: See exactly where you left off
2. **Track Progress**: Visual % completion for complex tasks
3. **Branch Awareness**: Know which tasks belong to current branch
4. **Auto-Cleanup**: Completed tasks don't clutter the session
5. **Lightweight**: Simple JSON file, no database required
6. **Git-Friendly**: Add to .gitignore for local-only tracking
