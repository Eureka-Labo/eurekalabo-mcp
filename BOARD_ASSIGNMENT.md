# Board Assignment Logic

## Overview

Tasks can be assigned to boards (which are linked to git repositories). The MCP server intelligently selects the appropriate board based on context.

---

## Board Assignment Rules

### 1. Parent Tasks (Regular Tasks)

**Smart Board Selection (automatic):**
```typescript
const task = await createTask({
  title: "Build Feature",
  status: "in_progress"
});
// ✅ Board auto-selected based on git repository
```

**Selection Logic:**
1. **Match git repository** - Find board linked to current git remote URL
2. **Fallback to unassigned board** - Use board not linked to any repository
3. **No board** - Create task without board assignment

**Manual Override:**
```typescript
const task = await createTask({
  title: "Build Feature",
  boardId: "board_xyz123"  // Manual board assignment
});
```

---

### 2. Subtasks (Child Tasks)

**Automatic Inheritance (recommended):**
```typescript
const subtask = await createTask({
  title: "Step 1: Design",
  parentTaskId: parent.id
});
// ✅ Automatically inherits parent's boardId
// ✅ Appears on same board as parent
```

**Inheritance Logic:**
1. **Fetch parent task** - Get parent's boardId
2. **Inherit boardId** - Use same board as parent
3. **Fallback** - If parent fetch fails, create without board

**Why Inheritance?**
- ✅ **Consistency** - Subtasks stay with parent work
- ✅ **Visibility** - All related tasks on same board
- ✅ **Simplicity** - No need to specify board for subtasks

**Manual Override (rare):**
```typescript
const subtask = await createTask({
  title: "Step 1: Design",
  parentTaskId: parent.id,
  boardId: "different_board_id"  // Override inheritance
});
// ⚠️ Subtask on different board than parent
```

---

## Complete Examples

### Example 1: Parent Task with Auto-Board Selection

```typescript
// Working in repository: github.com/user/backend-api
// Board "Backend API" is linked to this repository

const parent = await createTask({
  title: "Implement Authentication",
  description: "JWT-based auth system",
  status: "in_progress",
  priority: "high"
});

// Result:
// - boardId: "board_backend_api_id"
// - boardAssignment: {
//     boardName: "Backend API",
//     repositoryName: "backend-api",
//     reason: "Matched repository 'backend-api' -> board 'Backend API'"
//   }
```

### Example 2: Subtasks Inherit Parent Board

```typescript
// Parent is on "Backend API" board
const parent = await createTask({
  title: "Implement Authentication"
  // Auto-assigned to "Backend API" board
});

// Create 3 subtasks
const subtasks = await Promise.all([
  createTask({
    title: "1. Setup JWT library",
    status: "done",
    parentTaskId: parent.id
    // ✅ Inherits parent.boardId → "Backend API"
  }),
  createTask({
    title: "2. Create middleware",
    status: "in_progress",
    parentTaskId: parent.id
    // ✅ Inherits parent.boardId → "Backend API"
  }),
  createTask({
    title: "3. Add tests",
    status: "todo",
    parentTaskId: parent.id
    // ✅ Inherits parent.boardId → "Backend API"
  })
]);

// Result:
// - All 4 tasks (parent + 3 subtasks) on "Backend API" board
// - Easy to view all related work in one board view
```

### Example 3: No Git Repository

```typescript
// Working in directory without git remote
// Or repository not registered in project

const task = await createTask({
  title: "Documentation Task"
});

// Result:
// - boardId: "board_general_id" (unassigned board)
// - boardAssignment: {
//     boardName: "General",
//     repositoryName: null,
//     reason: "No git repository - using unassigned board"
//   }
```

### Example 4: Manual Board Override

```typescript
const task = await createTask({
  title: "Cross-Repository Task",
  boardId: "board_specific_id"  // Force specific board
});

// Result:
// - Uses specified boardId regardless of git repository
// - boardAssignment: null (manual override, no auto-selection)
```

---

## Board Selection Flow Chart

```
Create Task Request
        ↓
   Has parentTaskId?
    ↙         ↘
  YES          NO
   ↓            ↓
Fetch parent   Has boardId?
   ↓          ↙        ↘
Inherit     YES         NO
parent's    ↓            ↓
boardId    Use it    Smart Select:
   ↓                   1. Match git repo
   ↓                   2. Unassigned board
   ↓                   3. No board
   ↓                      ↓
   └──────────────────────┘
           ↓
      Create Task
```

---

## Board Assignment Priority

**Highest to Lowest Priority:**

1. **Manual boardId** - Explicitly provided in `createTask()`
2. **Parent inheritance** - For subtasks, inherit from parent
3. **Git repository match** - Board linked to current git remote
4. **Unassigned board** - Board not linked to any repository
5. **No board** - Task created without board assignment

---

## API Response

The `createTask` response includes board assignment information:

```typescript
{
  "success": true,
  "message": "Task created successfully: task_abc123",
  "task": {
    "id": "task_abc123",
    "title": "Implement Authentication",
    "boardId": "board_backend_api",
    // ... other task fields
  },
  "boardAssignment": {
    "boardName": "Backend API",
    "repositoryName": "backend-api",
    "reason": "Matched repository 'backend-api' -> board 'Backend API'"
  }
}
```

**For subtasks with inheritance:**
```typescript
{
  "success": true,
  "task": { /* ... */ },
  "boardAssignment": {
    "boardName": "Backend API",
    "repositoryName": null,
    "reason": "Inherited from parent task 'Implement Authentication'"
  }
}
```

---

## Best Practices

### ✅ Do:
- Let subtasks inherit parent's boardId automatically
- Use smart board selection for parent tasks
- Only specify boardId manually when you need a specific board

### ❌ Don't:
- Manually set different boards for parent and subtasks
- Override boardId for subtasks unless absolutely necessary
- Create subtasks before parent (won't have boardId to inherit)

---

## Troubleshooting

### Subtask on wrong board?
**Cause:** Parent task had different/no board when subtask was created
**Fix:** Update subtask's boardId manually:
```typescript
await updateTask(subtaskId, { boardId: correctBoardId });
```

### No board auto-selected?
**Cause:** Git repository not registered in project
**Fix:**
1. Add repository to project in UI
2. Link repository URL to project
3. Create board and link to repository

### Parent and subtasks on different boards?
**Cause:** Parent's board was changed after subtasks were created
**Fix:** Subtasks don't auto-update when parent changes. Update manually if needed.

---

## Implementation Details

### Code Location
- **Board Selection**: `src/utils/board-selector.ts`
- **Task Creation**: `src/tools/task-tools.ts` (lines 83-131)
- **Board Inheritance**: Lines 90-107

### Key Functions
- `selectBoardForTask()` - Smart board selection based on git
- `getBoardAssignmentInfo()` - Get board selection details
- Parent task fetching for boardId inheritance

---

**Updated:** October 30, 2025
**Feature:** Automatic boardId inheritance for subtasks
