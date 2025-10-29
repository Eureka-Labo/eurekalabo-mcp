# Pull Request Integration Plan

## Overview

Add GitHub Pull Request creation workflow that:
1. Tracks multiple tasks worked on in the same branch
2. Creates a PR summarizing all task changes
3. Links the PR URL to all related tasks

## Current Flow Analysis

### Existing Work Session Flow
```
1. start_work_on_task(taskId)
   - Captures git baseline commit
   - Stores branch name
   - Sets task status to "in_progress"

2. [User makes code changes]

3. complete_task_work(taskId, summary)
   - Captures all changes since baseline
   - Creates WorkSession and WorkSessionChange records
   - Updates task description with change summary
   - Sets task status to "done"
```

### Problem
- Multiple tasks can be worked on in the same branch
- Each task completion is independent
- No tracking of "branch is ready for PR"
- No way to create PR with all task changes

## Proposed Solution

### 1. Branch Session Tracking

**New Concept: Branch Session**
- A branch session tracks ALL tasks worked on in a specific branch
- Persists across multiple task completions
- Ends when PR is created or branch is merged

**Data Structure:**
```typescript
interface BranchSession {
  branchName: string;
  taskIds: string[];          // All tasks worked on this branch
  startedAt: string;
  lastActivityAt: string;
  prUrl?: string;             // Set when PR is created
  status: 'active' | 'pr_created' | 'merged';
}
```

**Storage Options:**

**Option A: Local File Cache (Simple)**
```json
// ~/.eureka-mcp/branch-sessions.json
{
  "feature/auth": {
    "branchName": "feature/auth",
    "taskIds": ["cm123", "cm456", "cm789"],
    "startedAt": "2025-01-28T10:00:00Z",
    "lastActivityAt": "2025-01-28T15:30:00Z",
    "status": "active"
  }
}
```

**Option B: Database Table (Robust)**
```sql
CREATE TABLE "BranchSession" (
  "id" TEXT PRIMARY KEY,
  "branchName" TEXT UNIQUE NOT NULL,
  "projectId" TEXT NOT NULL,
  "taskIds" TEXT[] NOT NULL,  -- Array of task IDs
  "startedAt" TIMESTAMP NOT NULL,
  "lastActivityAt" TIMESTAMP NOT NULL,
  "prUrl" TEXT,
  "prNumber" INTEGER,
  "status" TEXT DEFAULT 'active',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

**Recommendation: Start with Option A (file cache), migrate to Option B later if needed**

### 2. Modified Work Session Flow

```
1. start_work_on_task(taskId)
   - Captures git baseline and branch
   - Updates/creates branch session for current branch
   - Adds taskId to branch session
   - Sets task status to "in_progress"

2. [User makes code changes]

3. complete_task_work(taskId, summary)
   - Captures all changes since baseline
   - Creates WorkSession records
   - Updates task description
   - Sets task status to "done"
   - Updates branch session lastActivityAt
   - Task stays in branch session (not removed)

4. create_pull_request()  // NEW COMMAND
   - Gets current branch
   - Finds branch session for current branch
   - Generates PR description from all task summaries
   - Creates GitHub PR
   - Updates all tasks with PR URL
   - Sets branch session status to "pr_created"
```

### 3. New MCP Commands

#### Command 1: `create_pull_request`

**Purpose**: Create GitHub PR for current branch with all task changes

**Parameters:**
```typescript
{
  title?: string,        // Optional: PR title (auto-generated if not provided)
  description?: string,  // Optional: Additional description
  targetBranch?: string, // Default: "main"
  draft?: boolean        // Default: false
}
```

**Auto-generated PR title:**
```
"feat: {first-task-title} and {n} more tasks"
// Example: "feat: JWT authentication and 2 more tasks"
```

**Auto-generated PR description:**
```markdown
## 📋 Tasks Completed

- [x] #123 Implement JWT authentication
- [x] #124 Add bcrypt password hashing
- [x] #125 Create auth middleware

## 🎯 Summary

### Task #123: Implement JWT authentication
bcryptを使用したJWT認証を実装しました

**Changes:**
- ✏️ `src/middleware/auth.ts` (+45/-12)
- ➕ `tests/auth.test.ts` (+78/0)

### Task #124: Add bcrypt password hashing
...

## 📊 Overall Statistics
- **Total Files Changed**: 8
- **Total Lines Added**: +423
- **Total Lines Removed**: -34
- **Branch**: `feature/auth`
```

**Flow:**
```typescript
1. Get current branch name
2. Load branch session
3. Fetch all tasks and work sessions from API
4. Generate PR title and description
5. Create GitHub PR via API
6. Update all tasks with PR URL
7. Mark branch session as "pr_created"
```

#### Command 2: `list_branch_tasks`

**Purpose**: Show all tasks worked on in current branch

**Output:**
```
📋 Tasks in branch "feature/auth":
  ✅ #123 Implement JWT authentication (done)
  ✅ #124 Add bcrypt password hashing (done)
  🔄 #125 Create auth middleware (in_progress)

Status: 2 completed, 1 in progress
Ready for PR: No (1 task still in progress)
```

#### Command 3: `clear_branch_session` (Optional)

**Purpose**: Manually clear branch session (if starting fresh work)

### 4. Database Schema Changes

**Add PR info to Task model:**
```prisma
model Task {
  // ... existing fields
  prUrl       String?  // GitHub PR URL
  prNumber    Int?     // GitHub PR number
  prCreatedAt DateTime?
}
```

**Migration:**
```sql
ALTER TABLE "Task" ADD COLUMN "prUrl" TEXT;
ALTER TABLE "Task" ADD COLUMN "prNumber" INTEGER;
ALTER TABLE "Task" ADD COLUMN "prCreatedAt" TIMESTAMP(3);
```

### 5. GitHub Integration

**Option A: Use Existing GitHub Config**
```typescript
// Check if project has GitHubConfig
const githubConfig = await prisma.gitHubConfig.findUnique({
  where: { projectId }
});

if (githubConfig) {
  // Use existing config (owner, repo, accessToken)
}
```

**Option B: Standalone Git Detection**
```bash
# Detect GitHub repo from git remote
git remote get-url origin
# → https://github.com/username/repo.git
# Parse owner and repo
```

**Option C: Manual Configuration**
```json
// ~/.eureka-mcp/config.json
{
  "github": {
    "owner": "username",
    "repo": "repository",
    "token": "ghp_..."
  }
}
```

**Recommendation: Use Option B (git remote detection) + prompt for token on first use**

### 6. API Endpoints

#### New Backend Endpoints

**1. Bulk Update Tasks with PR**
```http
PATCH /api/v1/tasks/bulk-update-pr
Authorization: Bearer {token}

Request:
{
  "taskIds": ["cm123", "cm456"],
  "prUrl": "https://github.com/owner/repo/pull/42",
  "prNumber": 42
}

Response:
{
  "updated": 2,
  "tasks": [...]
}
```

**2. Get Tasks by IDs**
```http
POST /api/v1/tasks/by-ids
Authorization: Bearer {token}

Request:
{
  "taskIds": ["cm123", "cm456", "cm789"]
}

Response:
{
  "tasks": [...],
  "workSessions": {
    "cm123": [...],
    "cm456": [...]
  }
}
```

### 7. Implementation Steps

#### Phase 1: Branch Session Tracking (MVP)
- [x] Create branch-sessions.json file structure
- [ ] Implement BranchSessionManager class
- [ ] Update start_work_on_task to track branch sessions
- [ ] Update complete_task_work to update branch sessions
- [ ] Add list_branch_tasks command

#### Phase 2: GitHub PR Creation
- [ ] Implement GitHub API client
- [ ] Add git remote detection
- [ ] Implement PR description generator
- [ ] Add create_pull_request command
- [ ] Test PR creation flow

#### Phase 3: Task-PR Linking
- [ ] Add migration for PR fields in Task model
- [ ] Create bulk-update-pr API endpoint
- [ ] Update MCP client with new endpoint
- [ ] Link tasks to PR after creation

#### Phase 4: Frontend Integration
- [ ] Display PR link in task detail
- [ ] Show PR status badge
- [ ] Add "Create PR" button in project view
- [ ] Display branch session status

## Example Usage Flow

### Scenario: Working on Auth Feature

```bash
# 1. Start work on first task
@eureka-tasks start_work_on_task {"taskId": "cm123"}
# → Creates branch session for "feature/auth"
# → Adds cm123 to branch session

# 2. Make changes and complete
@eureka-tasks complete_task_work {
  "taskId": "cm123",
  "summary": "JWT認証を実装"
}
# → Task cm123 status: done
# → Branch session updated

# 3. Start another task in same branch
@eureka-tasks start_work_on_task {"taskId": "cm456"}
# → Adds cm456 to same branch session

# 4. Complete second task
@eureka-tasks complete_task_work {
  "taskId": "cm456",
  "summary": "bcryptパスワードハッシュを追加"
}

# 5. Check what's in current branch
@eureka-tasks list_branch_tasks
# → Shows: cm123 (done), cm456 (done)
# → Ready for PR: Yes

# 6. Create PR
@eureka-tasks create_pull_request {
  "title": "feat: JWT authentication system",
  "targetBranch": "main"
}
# → Creates GitHub PR
# → Updates cm123 and cm456 with PR URL
# → Branch session status: pr_created
```

## File Structure

```
mcp-server/
├── src/
│   ├── tracking/
│   │   ├── git-tracker.ts          # Existing
│   │   ├── branch-session.ts       # NEW: Branch session manager
│   │   └── github-client.ts        # NEW: GitHub API integration
│   ├── tools/
│   │   ├── work-session.ts         # Existing (update)
│   │   └── pull-request.ts         # NEW: PR creation commands
│   └── data/
│       └── branch-sessions.json    # NEW: Local cache
```

## Edge Cases & Error Handling

### Edge Case 1: Task completed but not committed
- **Issue**: User completes task but doesn't commit changes
- **Solution**: Warn user, PR will still be created (captures working directory state)

### Edge Case 2: Switching branches mid-work
- **Issue**: User starts task in branch A, switches to branch B
- **Solution**: Detect branch mismatch, warn user, update branch session

### Edge Case 3: Multiple projects, same branch name
- **Issue**: "feature/auth" in project A and project B
- **Solution**: Scope branch sessions by projectId

### Edge Case 4: PR already exists for branch
- **Issue**: User tries to create PR twice
- **Solution**: Check if PR exists, offer to update or skip

### Edge Case 5: No GitHub remote configured
- **Issue**: Local repo not connected to GitHub
- **Solution**: Error with instructions to add remote

## Configuration

### ~/.eureka-mcp/config.json
```json
{
  "github": {
    "token": "ghp_...",           // GitHub Personal Access Token
    "defaultBranch": "main",      // Default target branch
    "autoLinkIssues": true        // Auto-link GitHub issues if task has issueNumber
  },
  "pr": {
    "autoCreateDraft": false,     // Create as draft by default
    "includeStatistics": true,    // Include change statistics in PR description
    "templatePath": null          // Path to custom PR template
  }
}
```

## Benefits

1. **Batch PR Creation**: One PR for multiple related tasks
2. **Automatic Linking**: All tasks automatically linked to PR
3. **Rich PR Descriptions**: Auto-generated from task summaries and changes
4. **Traceability**: Clear connection between tasks, code changes, and PRs
5. **Team Collaboration**: Easy for reviewers to understand scope of changes

## Next Steps

1. **Approve this plan** or provide feedback
2. **Choose implementation approach**:
   - Quick MVP (file-based branch sessions)
   - Full solution (database-backed)
3. **Confirm GitHub integration method**
4. **Start implementation**
