# Smart Board Assignment Feature

## Overview

When creating tasks via the MCP server, tasks are now automatically assigned to the appropriate task board based on the git repository of the working directory.

## How It Works

### Automatic Board Selection Logic

When you create a task, the system automatically:

1. **Detects Git Repository** - Gets the remote URL from the current working directory
2. **Matches Repository** - Finds the repository registered in your Eureka Tasks project that matches the URL
3. **Selects Board** - Assigns the task to a board connected to that repository
4. **Fallback** - If no matching repository, uses an unassigned board
5. **Graceful Degradation** - If no suitable board found, creates task without board assignment

### Selection Priority

```
1. Board connected to matching repository (by git URL)
   ↓ (if not found)
2. Unassigned board (no repository connection)
   ↓ (if not found)
3. No board assignment (task at project level)
```

## Benefits

✅ **Automatic Organization** - Tasks automatically organized by repository/project
✅ **No Manual Selection** - Zero-configuration board assignment
✅ **Multi-Repository Support** - Works seamlessly across multiple repos
✅ **Flexible Fallback** - Gracefully handles edge cases

## Examples

### Example 1: Frontend Repository

```bash
# Working in: /workspace/my-app/frontend
# Git remote: https://github.com/user/my-app-frontend

# Create task
mcp__eureka-tasks__create_task({
  title: "Fix login button styling",
  description: "Update CSS for better mobile display"
})

# Result:
# ✅ Task assigned to "Frontend Board" (connected to frontend repository)
```

### Example 2: Backend Repository

```bash
# Working in: /workspace/my-app/api
# Git remote: https://github.com/user/my-app-api

# Create task
mcp__eureka-tasks__create_task({
  title: "Add authentication endpoint",
  description: "Implement JWT auth for API"
})

# Result:
# ✅ Task assigned to "API Board" (connected to API repository)
```

### Example 3: No Git Repository

```bash
# Working in: /workspace/scratch
# No git repository

# Create task
mcp__eureka-tasks__create_task({
  title: "Research task management patterns",
  description: "Investigate best practices"
})

# Result:
# ✅ Task assigned to "General Board" (unassigned board used as fallback)
```

### Example 4: Manual Override

```bash
# You can still manually specify a board
mcp__eureka-tasks__create_task({
  title: "Cross-cutting concern",
  description: "Affects multiple repositories",
  boardId: "cm1234567890abcdef" // Manual board ID
})

# Result:
# ✅ Task assigned to manually specified board
```

## Setup Requirements

### 1. Register Repositories

In your Eureka Tasks project, register each git repository:

```typescript
// Example: Register frontend repository
{
  name: "Frontend",
  url: "https://github.com/user/my-app-frontend",
  type: "frontend"
}

// Example: Register backend repository
{
  name: "API",
  url: "https://github.com/user/my-app-api",
  type: "backend"
}
```

### 2. Create Boards and Connect to Repositories

```typescript
// Example: Create board for frontend
{
  name: "Frontend Board",
  repositoryId: "frontend-repo-id"
}

// Example: Create board for API
{
  name: "API Board",
  repositoryId: "api-repo-id"
}

// Example: Create unassigned board for fallback
{
  name: "General Tasks",
  repositoryId: null // No repository connection
}
```

## URL Matching

The system normalizes git URLs for consistent matching:

```
SSH format:    git@github.com:user/repo.git
HTTPS format:  https://github.com/user/repo.git
Canonical:     https://github.com/user/repo

All match to: https://github.com/user/repo
```

## Debugging

Task creation responses include `boardAssignment` information:

```json
{
  "success": true,
  "task": { ... },
  "boardAssignment": {
    "boardName": "Frontend Board",
    "repositoryName": "Frontend",
    "reason": "Matched repository \"Frontend\" -> board \"Frontend Board\""
  }
}
```

## Implementation Details

### New API Methods

**Client (`src/api/client.ts`)**:
- `listBoards(repositoryId?: string): Promise<Board[]>` - List boards with optional repository filter
- `getBoard(boardId: string): Promise<Board>` - Get single board details
- `listRepositories(): Promise<Repository[]>` - List project repositories
- `getRepositoryByUrl(url: string): Promise<Repository | null>` - Find repository by URL

### New Utilities

**Git Utils (`src/utils/git.ts`)**:
- `getGitRemoteUrl(cwd?: string): string | null` - Get repository remote URL
- `normalizeGitUrl(url: string): string` - Normalize URLs for matching
- `isGitRepository(cwd?: string): boolean` - Check if directory is git repo
- `getCurrentBranch(cwd?: string): string | null` - Get current branch name

**Board Selector (`src/utils/board-selector.ts`)**:
- `selectBoardForTask(cwd?: string): Promise<string | null>` - Smart board selection
- `getBoardAssignmentInfo(cwd?: string)` - Get detailed assignment info for logging

### Modified Functions

**Task Tools (`src/tools/task-tools.ts`)**:
- `createTask()` - Now includes smart board assignment logic
- Added `boardId` optional parameter for manual override
- Returns `boardAssignment` info in response

## Migration Guide

### For Existing Projects

1. **Register your repositories** in Eureka Tasks with correct URLs
2. **Connect boards to repositories** via repositoryId field
3. **Create at least one unassigned board** as fallback
4. **Rebuild and restart** MCP server: `npm run build`
5. Tasks will now auto-assign to appropriate boards

### Backward Compatibility

- ✅ Existing task creation still works
- ✅ Manual `boardId` parameter still supported
- ✅ Gracefully handles missing repository/board setup
- ✅ No breaking changes to API

## Troubleshooting

### Task Not Assigned to Expected Board

**Check**:
1. Repository URL matches exactly (normalized format)
2. Repository is registered in project
3. Board is connected to repository via `repositoryId`
4. Check `boardAssignment` in create response for details

### No Board Assignment

**Possible Reasons**:
- No repositories registered in project
- Repository URL doesn't match any registered
- No unassigned boards available as fallback

**Solution**: Create an unassigned board (repositoryId: null) for fallback

### Multiple Boards for Same Repository

**Behavior**: Selects default board if marked, otherwise first board

**Recommendation**: Mark one board as default per repository

---

**Feature Added**: 2025-10-30
**MCP Server Version**: 1.1.0
**Status**: Active
