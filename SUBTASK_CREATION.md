# Creating Subtasks Directly

## ✅ Improved Workflow

You can now create subtasks in a single step without needing to update them afterward!

## Before (2 steps)

```typescript
// Old way - required 2 API calls
const subtask = await createTask({
  title: "Implement authentication",
  status: "todo"
});

// Then update to link to parent
await updateTask(subtask.id, {
  parentTaskId: parentId
});
```

## After (1 step) ✨

```typescript
// New way - single API call
const subtask = await createTask({
  title: "Implement authentication",
  status: "todo",
  parentTaskId: parentId  // ← Link directly on creation!
});
// ✅ Session progress automatically saved!
```

## Complete Example

```typescript
// 1. Create parent task
const parent = await createTask({
  title: "Build Authentication System",
  description: "Complete JWT authentication with refresh tokens",
  status: "in_progress",
  priority: "high"
});

// 2. Create subtasks directly with parent link
const subtasks = await Promise.all([
  createTask({
    title: "1. Setup JWT library",
    status: "done",
    priority: "high",
    parentTaskId: parent.id  // ← Direct link
  }),
  createTask({
    title: "2. Implement middleware",
    status: "in_progress",
    priority: "high",
    parentTaskId: parent.id  // ← Direct link
  }),
  createTask({
    title: "3. Add refresh token logic",
    status: "todo",
    priority: "medium",
    parentTaskId: parent.id  // ← Direct link
  })
]);

// ✅ Done! No update calls needed
// ✅ Parent completion: 33% (1/3 done)
// ✅ Session automatically saved
```

## Benefits

1. **Fewer API Calls** - 1 call instead of 2 per subtask
2. **Auto-Save Session** - Progress tracked immediately
3. **Cleaner Code** - No separate update logic needed
4. **Faster Execution** - Reduced network overhead

## Session Progress Auto-Tracking

When you create a subtask with `parentTaskId`:
1. ✅ Subtask created and linked to parent
2. ✅ Parent task fetched with all subtasks
3. ✅ Completion percentage calculated
4. ✅ Session progress saved to `.eureka-session.json`

## API Reference

### createTask Parameters

```typescript
{
  title: string;           // Required - task title
  description?: string;    // Optional - task description
  status?: string;         // Optional - initial status (default: "todo")
  priority?: string;       // Optional - low, medium, high, critical
  assigneeId?: string;     // Optional - user ID to assign
  dueDate?: string;        // Optional - ISO 8601 format
  boardId?: string;        // Optional - board assignment
  parentTaskId?: string;   // Optional - creates subtask if provided ✨
}
```

### Example with All Options

```typescript
const subtask = await createTask({
  title: "Design database schema",
  description: "Create ER diagram and migration scripts",
  status: "in_progress",
  priority: "high",
  assigneeId: "user_abc123",
  dueDate: "2025-11-15T00:00:00.000Z",
  parentTaskId: "parent_task_xyz789"  // Creates as subtask
});
```

## Workflow Comparison

### Traditional Approach (2 calls per subtask)
```typescript
// 3 subtasks = 6 API calls total
for (const step of steps) {
  const task = await createTask(step);        // Call 1
  await updateTask(task.id, { parentTaskId }); // Call 2
}
```

### New Approach (1 call per subtask)
```typescript
// 3 subtasks = 3 API calls total
const subtasks = await Promise.all(
  steps.map(step => createTask({
    ...step,
    parentTaskId  // Single call with parent link
  }))
);
```

**Result:** 50% fewer API calls! 🚀

## Testing

```typescript
// Create parent
const parent = await createTask({
  title: "Test Task",
  status: "in_progress"
});

// Create 3 subtasks at once
const [sub1, sub2, sub3] = await Promise.all([
  createTask({ title: "Step 1", status: "done", parentTaskId: parent.id }),
  createTask({ title: "Step 2", status: "todo", parentTaskId: parent.id }),
  createTask({ title: "Step 3", status: "todo", parentTaskId: parent.id })
]);

// Check parent completion
const updated = await getTask(parent.id);
console.log(updated.completionPercentage); // 33 (1/3 done)

// View session progress
const progress = await getSessionProgress();
console.log(progress.summary);
// Shows: "Test Task" at 33% completion
```

## Migration Guide

### Update Your Code

**Before:**
```typescript
const task = await createTask({ title: "Step 1" });
await updateTask(task.id, { parentTaskId: parent.id });
```

**After:**
```typescript
const task = await createTask({
  title: "Step 1",
  parentTaskId: parent.id
});
```

**Batch Creation Before:**
```typescript
const tasks = [];
for (const step of steps) {
  const task = await createTask(step);
  await updateTask(task.id, { parentTaskId });
  tasks.push(task);
}
```

**Batch Creation After:**
```typescript
const tasks = await Promise.all(
  steps.map(step => createTask({ ...step, parentTaskId }))
);
```

---

**Updated:** October 30, 2025
**Feature:** Direct subtask creation with `parentTaskId`
**Benefit:** 50% fewer API calls + automatic session tracking
