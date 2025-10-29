# フロントエンド統合ガイド - タスク詳細でのDiff表示

## データ構造

Work sessionデータはリレーショナルテーブルに保存されています：

```typescript
interface Task {
  id: string;
  title: string;
  description: string;  // 日本語で書かれた変更概要
  status: string;
  workSessions?: WorkSession[];  // リレーション経由で取得
}

interface WorkSession {
  id: string;
  taskId: string;
  sessionId: string;
  startedAt: string;
  completedAt: string;
  summary: string;
  gitBaseline: string;
  gitFinal: string;
  branch: string;
  statistics: {
    filesChanged: number;
    linesAdded: number;
    linesRemoved: number;
  };
  changes: WorkSessionChange[];  // リレーション経由で取得
  createdAt: string;
  updatedAt: string;
}

interface WorkSessionChange {
  id: string;
  workSessionId: string;
  file: string;                    // ファイルパス
  changeType: 'added' | 'modified' | 'deleted';
  linesAdded: number;
  linesRemoved: number;
  language: string;                // "typescript", "javascript", "python"など
  oldValue: string;                // 変更前のファイル全体
  newValue: string;                // 変更後のファイル全体
  unifiedDiff: string;             // Git unified diff形式
  createdAt: string;
}
```

## react-diff-viewerを使用した表示

### 1. パッケージのインストール

```bash
npm install react-diff-viewer-continued
# または
yarn add react-diff-viewer-continued
```

### 2. タスク詳細コンポーネント

```tsx
import React from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { Task } from '@/types';

interface TaskDetailProps {
  task: Task;
}

export function TaskDetail({ task }: TaskDetailProps) {
  const workSessions = task.workSessions || [];
  const latestSession = workSessions[0]; // Already sorted by startedAt DESC

  return (
    <div className="task-detail">
      {/* タスク基本情報 */}
      <div className="task-header">
        <h1>{task.title}</h1>
        <span className={`status-badge ${task.status}`}>
          {task.status}
        </span>
      </div>

      {/* タスク説明（日本語の変更概要） */}
      <div className="task-description">
        <div dangerouslySetInnerHTML={{ __html: marked(task.description) }} />
      </div>

      {/* 変更差分表示 */}
      {latestSession && (
        <div className="work-session">
          <h2>📝 コード変更</h2>

          {/* 統計情報 */}
          <div className="stats">
            <span>ファイル: {latestSession.statistics.filesChanged}個</span>
            <span className="text-green-600">
              +{latestSession.statistics.linesAdded}行
            </span>
            <span className="text-red-600">
              -{latestSession.statistics.linesRemoved}行
            </span>
          </div>

          {/* 各ファイルのDiff */}
          {latestSession.changes.map((change) => (
            <div key={change.file} className="file-diff">
              <h3>{getFileIcon(change.changeType)} {change.file}</h3>

              {change.changeType === 'deleted' ? (
                <div className="deleted-file">
                  <p>このファイルは削除されました</p>
                </div>
              ) : (
                <ReactDiffViewer
                  oldValue={change.oldValue}
                  newValue={change.newValue}
                  splitView={true}
                  useDarkTheme={false}
                  leftTitle={`変更前 (${latestSession.gitBaseline.substring(0, 7)})`}
                  rightTitle={`変更後 (${latestSession.gitFinal.substring(0, 7)})`}
                  compareMethod="diffWords"
                  styles={{
                    variables: {
                      light: {
                        diffViewerBackground: '#fff',
                        addedBackground: '#e6ffed',
                        addedColor: '#24292e',
                        removedBackground: '#ffeef0',
                        removedColor: '#24292e',
                      },
                    },
                  }}
                />
              )}
            </div>
          ))}

          {/* Git情報 */}
          <div className="git-info">
            <p>
              <strong>ブランチ:</strong> <code>{latestSession.branch}</code>
            </p>
            <p>
              <strong>コミット:</strong>{' '}
              <code>{latestSession.gitFinal.substring(0, 7)}</code>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function getFileIcon(changeType: string): string {
  switch (changeType) {
    case 'added':
      return '➕';
    case 'deleted':
      return '❌';
    case 'modified':
      return '✏️';
    default:
      return '📄';
  }
}
```

### 3. スタイリング例

```css
.task-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
}

.status-badge.done {
  background-color: #d4edda;
  color: #155724;
}

.task-description {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.work-session {
  margin-top: 30px;
}

.stats {
  display: flex;
  gap: 20px;
  margin: 20px 0;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.file-diff {
  margin-bottom: 40px;
}

.file-diff h3 {
  padding: 10px;
  background: #e9ecef;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
}

.git-info {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 14px;
}

.git-info code {
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}
```

## APIリクエスト例

```typescript
// タスク詳細の取得（work sessionsを含む）
async function fetchTaskWithWorkSessions(taskId: string): Promise<Task> {
  const [task, workSessions] = await Promise.all([
    fetch(`https://eurekalabo.162-43-92-100.nip.io/api/v1/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }).then(r => r.json()),

    fetch(`https://eurekalabo.162-43-92-100.nip.io/api/v1/tasks/${taskId}/work-sessions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }).then(r => r.json())
  ]);

  return {
    ...task,
    workSessions
  };
}

// 特定のwork sessionの詳細取得
async function fetchWorkSessionDetail(taskId: string, sessionId: string) {
  const response = await fetch(
    `https://eurekalabo.162-43-92-100.nip.io/api/v1/tasks/${taskId}/work-sessions/${sessionId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch work session');
  }

  return response.json();
}
```

## データフロー

```
1. Claude Code が complete_task_work を実行
   ↓
2. MCP Server が変更をキャプチャ
   - Git diff を取得
   - 各ファイルの oldValue/newValue を保存
   ↓
3. WorkSession と WorkSessionChange テーブルに保存
   POST /api/v1/tasks/{taskId}/work-sessions
   ↓
4. Task.description に日本語の概要を設定
   PATCH /api/v1/tasks/{taskId}
   ↓
5. フロントエンドがタスク詳細を表示
   - GET /api/v1/tasks/{taskId} → description をマークダウンでレンダリング
   - GET /api/v1/tasks/{taskId}/work-sessions → react-diff-viewer で表示
```

## 表示オプション

### Side-by-Side表示

```tsx
<ReactDiffViewer
  oldValue={change.diff.oldValue}
  newValue={change.diff.newValue}
  splitView={true}  // 左右分割表示
  useDarkTheme={false}
/>
```

### Inline表示

```tsx
<ReactDiffViewer
  oldValue={change.diff.oldValue}
  newValue={change.diff.newValue}
  splitView={false}  // 縦に統合表示
  useDarkTheme={false}
/>
```

### シンタックスハイライト

言語は自動検出されて`change.language`に保存されています：
- TypeScript: `"typescript"`
- JavaScript: `"javascript"`
- Python: `"python"`
- Go: `"go"`
- など30以上の言語

## 注意点

1. **大きなファイル**: 非常に大きなファイル（>1000行）の場合は、仮想スクロールを検討
2. **複数セッション**: `workSessions`は配列なので、複数のセッションを持つタスクもある
3. **削除されたファイル**: `changeType === 'deleted'`の場合、`oldValue`のみ存在
4. **追加されたファイル**: `changeType === 'added'`の場合、`newValue`のみ存在
5. **パフォーマンス**: Work sessionsを常に読み込む必要がない場合は、遅延読み込みを使用
6. **データベースクエリ**: `changes`を含む場合は`include: { changes: true }`を指定

## 完成イメージ

```
+------------------------------------------+
| タスク詳細                                |
+------------------------------------------+
| [完了] JWTミドルウェアの実装              |
+------------------------------------------+

📝 説明
┌────────────────────────────────────────┐
│ ## 🎯 実装概要                           │
│                                         │
│ bcryptを使用したJWT認証を実装しました    │
│                                         │
│ ## 📊 変更統計                           │
│ - 変更ファイル数: 3個                    │
│ - 追加行数: +243行                       │
│ - 削除行数: -12行                        │
└────────────────────────────────────────┘

📝 コード変更
┌────────────────────────────────────────┐
│ ファイル: 3個  +243行  -12行            │
└────────────────────────────────────────┘

✏️ src/middleware/auth.ts
┌─────────────────────┬─────────────────────┐
│ 変更前 (abc123)      │ 変更後 (def456)      │
├─────────────────────┼─────────────────────┤
│ 1  import { Hono }  │ 1  import { Hono }  │
│ 2  ...              │ 2  import { verify } │
│ 3                   │ 3  ...              │
└─────────────────────┴─────────────────────┘
```
