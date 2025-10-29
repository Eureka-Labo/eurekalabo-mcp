# Pull Request Integration Flow Diagrams

## 1. Complete Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  Developer Workflow                                          │
└─────────────────────────────────────────────────────────────┘

┌────────────┐
│ Start Task │ @eureka-tasks start_work_on_task
└──────┬─────┘
       │
       v
┌────────────────────────────────────────┐
│ Branch Session Manager                  │
├────────────────────────────────────────┤
│ • Check if branch session exists       │
│ • Create new if not exists             │
│ • Add taskId to branch session         │
│ • Save to branch-sessions.json         │
└──────┬─────────────────────────────────┘
       │
       v
┌────────────────────┐
│ Make Code Changes  │ (Developer works in IDE)
└──────┬─────────────┘
       │
       v
┌────────────┐
│ Complete   │ @eureka-tasks complete_task_work
│ Task Work  │
└──────┬─────┘
       │
       v
┌────────────────────────────────────────┐
│ Git Tracker                             │
├────────────────────────────────────────┤
│ • Capture all file changes             │
│ • Store diffs in WorkSession tables    │
│ • Update task description              │
└──────┬─────────────────────────────────┘
       │
       v
┌────────────────────────────────────────┐
│ Branch Session Update                   │
├────────────────────────────────────────┤
│ • Update lastActivityAt                │
│ • Keep task in session                 │
└──────┬─────────────────────────────────┘
       │
       │  [Repeat for more tasks]
       │
       v
┌────────────┐
│ List Tasks │ @eureka-tasks list_branch_tasks
│ in Branch  │
└──────┬─────┘
       │
       v
┌────────────────────────────────────────┐
│ Branch Session Summary                  │
├────────────────────────────────────────┤
│ ✅ Task #123 (done)                    │
│ ✅ Task #124 (done)                    │
│ 🔄 Task #125 (in_progress)             │
│                                         │
│ Status: 2 done, 1 in progress          │
│ Ready for PR: No                        │
└────────────────────────────────────────┘
       │
       │  [All tasks completed]
       │
       v
┌────────────┐
│ Create PR  │ @eureka-tasks create_pull_request
└──────┬─────┘
       │
       v
┌────────────────────────────────────────┐
│ PR Generator                            │
├────────────────────────────────────────┤
│ 1. Load all tasks from branch session  │
│ 2. Fetch work sessions for each task   │
│ 3. Generate PR title from task titles  │
│ 4. Generate PR description:            │
│    • Task list with checkboxes         │
│    • Each task summary                 │
│    • File changes per task             │
│    • Overall statistics                │
└──────┬─────────────────────────────────┘
       │
       v
┌────────────────────────────────────────┐
│ GitHub API                              │
├────────────────────────────────────────┤
│ POST /repos/{owner}/{repo}/pulls       │
│ {                                       │
│   "title": "feat: Auth system",        │
│   "body": "...",                        │
│   "head": "feature/auth",               │
│   "base": "main"                        │
│ }                                       │
└──────┬─────────────────────────────────┘
       │
       v
┌────────────────────────────────────────┐
│ PR Created!                             │
│ https://github.com/.../pull/42          │
└──────┬─────────────────────────────────┘
       │
       v
┌────────────────────────────────────────┐
│ Update Tasks                            │
├────────────────────────────────────────┤
│ PATCH /api/v1/tasks/bulk-update-pr     │
│ {                                       │
│   "taskIds": ["cm123", "cm124"],       │
│   "prUrl": "https://...",               │
│   "prNumber": 42                        │
│ }                                       │
└──────┬─────────────────────────────────┘
       │
       v
┌────────────────────────────────────────┐
│ Update Branch Session                   │
├────────────────────────────────────────┤
│ • Set prUrl                             │
│ • Set prNumber                          │
│ • Set status: "pr_created"              │
└────────────────────────────────────────┘
```

## 2. Branch Session Lifecycle

```
┌──────────────┐
│ Branch: main │  (Developer creates new branch)
└──────┬───────┘
       │
       │ git checkout -b feature/auth
       v
┌──────────────────────┐
│ Branch: feature/auth │
└──────┬───────────────┘
       │
       │ start_work_on_task(cm123)
       v
┌─────────────────────────────────┐
│ Branch Session Created          │
├─────────────────────────────────┤
│ branchName: "feature/auth"      │
│ taskIds: ["cm123"]              │
│ status: "active"                │
└──────┬──────────────────────────┘
       │
       │ complete_task_work(cm123)
       v
┌─────────────────────────────────┐
│ Branch Session Updated          │
├─────────────────────────────────┤
│ branchName: "feature/auth"      │
│ taskIds: ["cm123"]              │
│ status: "active"                │
│ lastActivityAt: updated         │
└──────┬──────────────────────────┘
       │
       │ start_work_on_task(cm124)
       v
┌─────────────────────────────────┐
│ Branch Session Updated          │
├─────────────────────────────────┤
│ branchName: "feature/auth"      │
│ taskIds: ["cm123", "cm124"]     │
│ status: "active"                │
└──────┬──────────────────────────┘
       │
       │ create_pull_request()
       v
┌─────────────────────────────────┐
│ Branch Session Finalized        │
├─────────────────────────────────┤
│ branchName: "feature/auth"      │
│ taskIds: ["cm123", "cm124"]     │
│ status: "pr_created"            │
│ prUrl: "https://..."            │
│ prNumber: 42                    │
└─────────────────────────────────┘
       │
       │ [PR merged on GitHub]
       v
┌─────────────────────────────────┐
│ Branch Session Archived         │
├─────────────────────────────────┤
│ status: "merged"                │
│ (Can be cleaned up)             │
└─────────────────────────────────┘
```

## 3. Data Flow: Task → Work Session → PR

```
Task #123
├─ title: "Implement JWT auth"
├─ status: "done"
├─ description: "## 🎯 実装概要..."
└─ workSessions: [
     {
       sessionId: "session_123",
       summary: "JWT認証を実装",
       changes: [
         { file: "auth.ts", +45/-12 },
         { file: "test.ts", +78/0 }
       ],
       statistics: {
         filesChanged: 2,
         linesAdded: 123,
         linesRemoved: 12
       }
     }
   ]

Task #124
├─ title: "Add bcrypt hashing"
├─ status: "done"
└─ workSessions: [...]

      ↓ ↓ ↓  (combine via create_pull_request)

GitHub PR #42
├─ title: "feat: JWT authentication and 1 more task"
├─ body: """
│   ## 📋 Tasks Completed
│   - [x] #123 Implement JWT auth
│   - [x] #124 Add bcrypt hashing
│
│   ## 🎯 Summary
│   ### Task #123: Implement JWT auth
│   JWT認証を実装
│   **Changes:**
│   - ✏️ auth.ts (+45/-12)
│   - ➕ test.ts (+78/0)
│   ...
│   """
└─ url: "https://github.com/.../pull/42"

      ↓ ↓ ↓  (update tasks)

Task #123 ← prUrl: "https://github.com/.../pull/42"
Task #124 ← prUrl: "https://github.com/.../pull/42"
```

## 4. File Structure & Storage

```
~/.eureka-mcp/
├── config.json
│   └── { github: { token, defaultBranch }, ... }
│
└── branch-sessions.json
    └── {
          "feature/auth": {
            "branchName": "feature/auth",
            "taskIds": ["cm123", "cm124"],
            "startedAt": "2025-01-28T10:00:00Z",
            "lastActivityAt": "2025-01-28T15:30:00Z",
            "status": "active"
          },
          "feature/payments": {
            ...
          }
        }

Database (PostgreSQL)
├── Task
│   ├── id: "cm123"
│   ├── title: "Implement JWT auth"
│   ├── prUrl: "https://github.com/.../pull/42"  ← NEW
│   ├── prNumber: 42                              ← NEW
│   └── prCreatedAt: "2025-01-28T16:00:00Z"       ← NEW
│
├── WorkSession
│   ├── taskId: "cm123"
│   ├── sessionId: "session_123"
│   ├── summary: "JWT認証を実装"
│   └── statistics: { filesChanged: 2, ... }
│
└── WorkSessionChange
    ├── workSessionId: "ws_123"
    ├── file: "auth.ts"
    └── oldValue, newValue, unifiedDiff
```

## 5. Error Handling Flow

```
create_pull_request()
       │
       v
┌──────────────────────┐
│ Validation Checks    │
├──────────────────────┤
│ ✓ Branch session?    │──No──> Error: No tasks in branch
│ ✓ Has tasks?         │──No──> Error: No tasks in branch
│ ✓ Git remote?        │──No──> Error: No GitHub remote
│ ✓ GitHub token?      │──No──> Prompt for token
│ ✓ Uncommitted?       │──Yes─> Warn, continue
└──────┬───────────────┘
       │ All OK
       v
┌──────────────────────┐
│ Generate PR          │
└──────┬───────────────┘
       │
       v
┌──────────────────────┐
│ GitHub API Call      │
├──────────────────────┤
│ Success?             │──No──> Error: Show GitHub error
│                      │        (rate limit, permissions, etc.)
└──────┬───────────────┘
       │ Success
       v
┌──────────────────────┐
│ Update Tasks         │
├──────────────────────┤
│ Success?             │──No──> Warn: PR created but
│                      │        task update failed
└──────┬───────────────┘
       │ Success
       v
┌──────────────────────┐
│ ✅ Complete!         │
│ PR URL returned      │
└──────────────────────┘
```

## 6. Multi-Project Scenario

```
Project A (eurekalabo-frontend)
└─ Branch: feature/auth
   └─ Tasks: ["cm123", "cm124"]
   └─ PR: #42

Project B (eurekalabo-api)
└─ Branch: feature/auth  (same name!)
   └─ Tasks: ["cm456", "cm789"]
   └─ PR: #15

Storage:
{
  "project-A_feature/auth": {
    "projectId": "cmggg...",
    "branchName": "feature/auth",
    "taskIds": ["cm123", "cm124"]
  },
  "project-B_feature/auth": {
    "projectId": "cmhhh...",
    "branchName": "feature/auth",
    "taskIds": ["cm456", "cm789"]
  }
}
```
