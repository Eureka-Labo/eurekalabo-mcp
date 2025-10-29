# Frontend Implementation Prompt: Work Session Diff Viewer

## Context

We have implemented a git-based work session tracking system for tasks in Eureka Labo. The MCP server now captures file changes (uncommitted or committed) and stores them in relational database tables. Your task is to implement the frontend UI to display these work sessions and code diffs.

## Database Schema

### WorkSession Table
```typescript
interface WorkSession {
  id: string;
  taskId: string;
  sessionId: string;          // e.g., "session_1738051200000"
  startedAt: string;          // ISO timestamp
  completedAt: string | null; // ISO timestamp
  summary: string | null;     // User-provided summary in Japanese
  gitBaseline: string;        // Starting commit hash
  gitFinal: string;           // Ending commit hash
  branch: string;             // Git branch name
  statistics: {
    filesChanged: number;
    linesAdded: number;
    linesRemoved: number;
  };
  createdAt: string;
  updatedAt: string;
  changes: WorkSessionChange[]; // Relation
}
```

### WorkSessionChange Table
```typescript
interface WorkSessionChange {
  id: string;
  workSessionId: string;
  file: string;               // File path (e.g., "src/middleware/auth.ts")
  changeType: 'added' | 'modified' | 'deleted';
  linesAdded: number;
  linesRemoved: number;
  language: string;           // "typescript", "javascript", "python", etc.
  oldValue: string;           // Full old file content
  newValue: string;           // Full new file content
  unifiedDiff: string;        // Git unified diff format
  createdAt: string;
}
```

## API Endpoints

### 1. Get All Work Sessions for a Task
```http
GET /api/v1/tasks/{taskId}/work-sessions
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": "cm123abc456",
    "taskId": "cmXXXXXXXXXXX",
    "sessionId": "session_1738051200000",
    "startedAt": "2025-01-28T10:00:00Z",
    "completedAt": "2025-01-28T10:45:00Z",
    "summary": "bcryptを使用したJWT認証を実装しました",
    "gitBaseline": "abc123def",
    "gitFinal": "def456ghi",
    "branch": "feature/auth",
    "statistics": {
      "filesChanged": 3,
      "linesAdded": 243,
      "linesRemoved": 12
    },
    "createdAt": "2025-01-28T10:45:00Z",
    "updatedAt": "2025-01-28T10:45:00Z",
    "changes": [
      {
        "id": "cmCHG001",
        "workSessionId": "cm123abc456",
        "file": "src/middleware/auth.ts",
        "changeType": "modified",
        "linesAdded": 45,
        "linesRemoved": 12,
        "language": "typescript",
        "createdAt": "2025-01-28T10:45:00Z"
      }
      // Note: oldValue, newValue, unifiedDiff are NOT included in list view for performance
    ]
  }
]
```

### 2. Get Specific Work Session with Full Diffs
```http
GET /api/v1/tasks/{taskId}/work-sessions/{sessionId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "cm123abc456",
  "taskId": "cmXXXXXXXXXXX",
  "sessionId": "session_1738051200000",
  "startedAt": "2025-01-28T10:00:00Z",
  "completedAt": "2025-01-28T10:45:00Z",
  "summary": "bcryptを使用したJWT認証を実装しました",
  "gitBaseline": "abc123def",
  "gitFinal": "def456ghi",
  "branch": "feature/auth",
  "statistics": {
    "filesChanged": 3,
    "linesAdded": 243,
    "linesRemoved": 12
  },
  "changes": [
    {
      "id": "cmCHG001",
      "workSessionId": "cm123abc456",
      "file": "src/middleware/auth.ts",
      "changeType": "modified",
      "linesAdded": 45,
      "linesRemoved": 12,
      "language": "typescript",
      "oldValue": "// Complete old file content here...",
      "newValue": "// Complete new file content here...",
      "unifiedDiff": "@@ -10,5 +10,8 @@ import { Hono } from 'hono';\n...",
      "createdAt": "2025-01-28T10:45:00Z"
    },
    {
      "id": "cmCHG002",
      "workSessionId": "cm123abc456",
      "file": "tests/auth.test.ts",
      "changeType": "added",
      "linesAdded": 78,
      "linesRemoved": 0,
      "language": "typescript",
      "oldValue": "",
      "newValue": "// Complete new test file content...",
      "unifiedDiff": "@@ -0,0 +1,78 @@ ...",
      "createdAt": "2025-01-28T10:45:00Z"
    }
  ]
}
```

## Required Implementation

### 1. Task Detail Page Enhancement

**Location:** Where task details are displayed (probably `TaskDetail.tsx` or similar)

**Requirements:**
- Add a new section called "Work Sessions" or "Code Changes" (コード変更)
- Display list of work sessions sorted by `startedAt` DESC (most recent first)
- For each work session, show:
  - Summary (Japanese text)
  - Statistics (files changed, lines added/removed)
  - Git information (branch, commit hashes)
  - Timestamp
  - List of changed files with change type icons

### 2. Work Session Diff Viewer Component

**Component Name:** `WorkSessionDiffViewer.tsx`

**Props:**
```typescript
interface WorkSessionDiffViewerProps {
  taskId: string;
  sessionId: string;
  // OR pass the full session object if already loaded
  session?: WorkSession;
}
```

**Requirements:**
- Use `react-diff-viewer-continued` package for rendering diffs
- Lazy load full diff data when user expands a work session
- Show side-by-side diff view by default
- Support toggling between side-by-side and inline views
- Display syntax highlighting based on `language` field
- Show file change type icons (➕ added, ✏️ modified, ❌ deleted)
- For deleted files, only show old content
- For added files, only show new content

### 3. Install Dependencies

```bash
npm install react-diff-viewer-continued
# or
yarn add react-diff-viewer-continued
```

## Example Implementation

### WorkSessionList Component

```tsx
import React, { useState, useEffect } from 'react';
import { WorkSession } from '@/types';
import { WorkSessionDiffViewer } from './WorkSessionDiffViewer';

interface WorkSessionListProps {
  taskId: string;
}

export function WorkSessionList({ taskId }: WorkSessionListProps) {
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  useEffect(() => {
    async function loadSessions() {
      try {
        const response = await fetch(
          `/api/v1/tasks/${taskId}/work-sessions`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        setSessions(data);
      } catch (error) {
        console.error('Failed to load work sessions:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSessions();
  }, [taskId]);

  if (loading) {
    return <div>Loading work sessions...</div>;
  }

  if (sessions.length === 0) {
    return <div>No work sessions yet.</div>;
  }

  return (
    <div className="work-sessions">
      <h2>📝 コード変更履歴</h2>

      {sessions.map((session) => (
        <div key={session.id} className="work-session-card">
          <div className="session-header">
            <div className="session-summary">
              <h3>{session.summary || 'Work session completed'}</h3>
              <p className="session-meta">
                {new Date(session.completedAt || session.startedAt).toLocaleString('ja-JP')}
                {' • '}
                <code>{session.branch}</code>
                {' • '}
                <code>{session.gitFinal.substring(0, 7)}</code>
              </p>
            </div>

            <div className="session-stats">
              <span className="stat-item">
                📁 {session.statistics.filesChanged}個
              </span>
              <span className="stat-item text-green-600">
                +{session.statistics.linesAdded}
              </span>
              <span className="stat-item text-red-600">
                -{session.statistics.linesRemoved}
              </span>
            </div>
          </div>

          <div className="changed-files">
            {session.changes.map((change) => (
              <div key={change.id} className="file-item">
                <span className="file-icon">
                  {change.changeType === 'added' ? '➕' :
                   change.changeType === 'deleted' ? '❌' : '✏️'}
                </span>
                <code className="file-path">{change.file}</code>
                <span className="file-stats">
                  <span className="text-green-600">+{change.linesAdded}</span>
                  {' / '}
                  <span className="text-red-600">-{change.linesRemoved}</span>
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setExpandedSession(
              expandedSession === session.sessionId ? null : session.sessionId
            )}
            className="expand-button"
          >
            {expandedSession === session.sessionId ? '▼ Hide Diff' : '▶ Show Diff'}
          </button>

          {expandedSession === session.sessionId && (
            <WorkSessionDiffViewer
              taskId={taskId}
              sessionId={session.sessionId}
            />
          )}
        </div>
      ))}
    </div>
  );
}
```

### WorkSessionDiffViewer Component

```tsx
import React, { useState, useEffect } from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { WorkSession } from '@/types';

interface WorkSessionDiffViewerProps {
  taskId: string;
  sessionId: string;
}

export function WorkSessionDiffViewer({ taskId, sessionId }: WorkSessionDiffViewerProps) {
  const [session, setSession] = useState<WorkSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [splitView, setSplitView] = useState(true);

  useEffect(() => {
    async function loadFullSession() {
      try {
        const response = await fetch(
          `/api/v1/tasks/${taskId}/work-sessions/${sessionId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        setSession(data);
      } catch (error) {
        console.error('Failed to load work session:', error);
      } finally {
        setLoading(false);
      }
    }

    loadFullSession();
  }, [taskId, sessionId]);

  if (loading) {
    return <div className="p-4">Loading diffs...</div>;
  }

  if (!session) {
    return <div className="p-4">Session not found.</div>;
  }

  return (
    <div className="diff-viewer-container">
      <div className="diff-controls">
        <button
          onClick={() => setSplitView(!splitView)}
          className="toggle-view-button"
        >
          {splitView ? 'Switch to Inline View' : 'Switch to Side-by-Side View'}
        </button>
      </div>

      {session.changes.map((change) => (
        <div key={change.id} className="file-diff-section">
          <h4 className="file-diff-header">
            {change.changeType === 'added' ? '➕' :
             change.changeType === 'deleted' ? '❌' : '✏️'}
            {' '}
            <code>{change.file}</code>
            {' '}
            <span className="text-sm text-gray-500">
              ({change.language})
            </span>
          </h4>

          {change.changeType === 'deleted' ? (
            <div className="deleted-file-notice">
              <p>このファイルは削除されました</p>
              <details>
                <summary>Show deleted content</summary>
                <pre><code>{change.oldValue}</code></pre>
              </details>
            </div>
          ) : (
            <ReactDiffViewer
              oldValue={change.oldValue}
              newValue={change.newValue}
              splitView={splitView}
              useDarkTheme={false}
              leftTitle={`変更前 (${session.gitBaseline.substring(0, 7)})`}
              rightTitle={`変更後 (${session.gitFinal.substring(0, 7)})`}
              compareMethod="diffWords"
              styles={{
                variables: {
                  light: {
                    diffViewerBackground: '#fff',
                    addedBackground: '#e6ffed',
                    addedColor: '#24292e',
                    removedBackground: '#ffeef0',
                    removedColor: '#24292e',
                    wordAddedBackground: '#acf2bd',
                    wordRemovedBackground: '#fdb8c0',
                  },
                },
                diffContainer: {
                  fontSize: '14px',
                  fontFamily: 'Monaco, Menlo, "Courier New", monospace',
                },
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
```

### Styling Example (Tailwind CSS)

```css
.work-sessions {
  @apply mt-8 space-y-6;
}

.work-session-card {
  @apply border border-gray-200 rounded-lg p-4 bg-white shadow-sm;
}

.session-header {
  @apply flex justify-between items-start mb-4;
}

.session-summary h3 {
  @apply text-lg font-semibold text-gray-900;
}

.session-meta {
  @apply text-sm text-gray-500 mt-1;
}

.session-stats {
  @apply flex gap-3 text-sm;
}

.stat-item {
  @apply px-2 py-1 bg-gray-100 rounded;
}

.changed-files {
  @apply space-y-2 mb-4;
}

.file-item {
  @apply flex items-center gap-2 text-sm font-mono;
}

.file-path {
  @apply flex-1 text-gray-700;
}

.file-stats {
  @apply text-xs;
}

.expand-button {
  @apply w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded;
}

.diff-viewer-container {
  @apply mt-4 border-t border-gray-200 pt-4;
}

.diff-controls {
  @apply mb-4 flex justify-end;
}

.toggle-view-button {
  @apply px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded;
}

.file-diff-section {
  @apply mb-6;
}

.file-diff-header {
  @apply mb-2 p-2 bg-gray-100 rounded font-mono text-sm;
}

.deleted-file-notice {
  @apply p-4 bg-red-50 border border-red-200 rounded;
}
```

## Integration Points

### 1. Add to Task Detail Page

Find your task detail component and add:

```tsx
import { WorkSessionList } from '@/components/WorkSessionList';

// Inside your TaskDetail component
<div className="task-detail">
  {/* Existing task info */}

  {/* Add this section */}
  <WorkSessionList taskId={task.id} />
</div>
```

### 2. Type Definitions

Add to your `types.ts` or similar:

```typescript
export interface WorkSession {
  id: string;
  taskId: string;
  sessionId: string;
  startedAt: string;
  completedAt: string | null;
  summary: string | null;
  gitBaseline: string;
  gitFinal: string;
  branch: string;
  statistics: {
    filesChanged: number;
    linesAdded: number;
    linesRemoved: number;
  };
  createdAt: string;
  updatedAt: string;
  changes: WorkSessionChange[];
}

export interface WorkSessionChange {
  id: string;
  workSessionId: string;
  file: string;
  changeType: 'added' | 'modified' | 'deleted';
  linesAdded: number;
  linesRemoved: number;
  language: string;
  oldValue: string;
  newValue: string;
  unifiedDiff: string;
  createdAt: string;
}
```

## Testing Checklist

- [ ] Work sessions load correctly for a task with completed work
- [ ] Empty state displays when no work sessions exist
- [ ] Statistics display correctly (files, lines added/removed)
- [ ] File list shows correct change type icons
- [ ] Expanding a session loads full diff data
- [ ] Side-by-side diff view renders correctly
- [ ] Inline diff view works when toggled
- [ ] Syntax highlighting works for different languages
- [ ] Deleted files show appropriate UI
- [ ] Added files (oldValue is empty) render correctly
- [ ] Multiple work sessions display in correct order
- [ ] Loading states display appropriately
- [ ] Error handling works when API fails

## Performance Considerations

1. **Lazy Loading**: Only load full diff data when user expands a session
2. **Pagination**: If a task has many work sessions, implement pagination
3. **Virtual Scrolling**: For very large diffs, consider virtualizing the diff viewer
4. **Caching**: Cache loaded sessions to avoid refetching

## Additional Features (Optional)

1. **Search**: Add ability to search within diffs
2. **Download**: Allow downloading diffs as patch files
3. **Copy**: Copy diff content to clipboard
4. **Filtering**: Filter by file type or change type
5. **Comparison**: Compare two different work sessions

## Notes

- The task description field already contains a Japanese summary generated by the MCP server
- Work sessions are sorted by `startedAt` DESC in the API response
- The `statistics` field is stored as JSONB in the database
- Full file contents (`oldValue`, `newValue`) are only included in the detail endpoint for performance
