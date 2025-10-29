# Task Update Flow

## What Happens When `complete_task_work` Is Called

### 1. Git Changes Captured
```typescript
{
  gitBaseline: "abc123def",  // Starting commit
  gitFinal: "def456ghi",     // Ending commit
  branch: "feature/auth",
  changes: [
    {
      file: "src/middleware/auth.ts",
      changeType: "modified",
      linesAdded: 45,
      linesRemoved: 12,
      language: "typescript",
      diff: {
        oldValue: "// Complete old file content...",  // For react-diff-viewer
        newValue: "// Complete new file content..."   // For react-diff-viewer
      },
      unifiedDiff: "@@ -10,5 +10,8 @@ ..."  // Git unified diff
    }
  ],
  statistics: {
    filesChanged: 3,
    linesAdded: 243,
    linesRemoved: 12
  }
}
```

### 2. Work Session Created in Database (Full Diffs Stored)
```typescript
// WorkSession table record
{
  id: "cm123abc456",
  taskId: "cmXXXXXXXXXXX",
  sessionId: "session_1738051200000",
  startedAt: "2025-01-28T10:00:00Z",
  completedAt: "2025-01-28T10:45:00Z",
  summary: "Implemented JWT authentication with bcrypt",
  gitBaseline: "abc123def",
  gitFinal: "def456ghi",
  branch: "feature/auth",
  statistics: {
    filesChanged: 3,
    linesAdded: 243,
    linesRemoved: 12
  }
}

// WorkSessionChange table records (one per file)
[
  {
    id: "cmCHG001",
    workSessionId: "cm123abc456",
    file: "src/middleware/auth.ts",
    changeType: "modified",
    linesAdded: 45,
    linesRemoved: 12,
    language: "typescript",
    oldValue: "// Complete old file content...",
    newValue: "// Complete new file content...",
    unifiedDiff: "@@ -10,5 +10,8 @@ ..."
  },
  {
    id: "cmCHG002",
    workSessionId: "cm123abc456",
    file: "tests/auth.test.ts",
    changeType: "added",
    linesAdded: 78,
    linesRemoved: 0,
    language: "typescript",
    oldValue: "",
    newValue: "// Complete new file content...",
    unifiedDiff: "@@ -0,0 +1,78 @@ ..."
  }
]
```

### 3. Task Description Updated (Formatted Summary in Japanese)
```markdown
## 🎯 実装概要

bcryptを使用したJWT認証を実装しました

## 📊 変更統計

- **変更ファイル数**: 3個
- **追加行数**: +243行
- **削除行数**: -12行
- **ブランチ**: `feature/auth`
- **コミット**: `def456g`

## 📁 変更ファイル一覧

✏️ `src/middleware/auth.ts` (+45/-12)
➕ `tests/auth.test.ts` (+78/0)
➕ `docs/auth.md` (+120/0)

---

*詳細な差分はタスクのメタデータに保存されており、UIでreact-diff-viewerを使用して表示できます。*
```

### 4. Task Status Updated
```typescript
Task.status = "done"
```

## Data Storage Locations

| データ | 保存場所 | 用途 |
|------|------------------|---------|
| **実装概要** | Task.description | 開発者向けの概要 |
| **ファイル一覧** | Task.description | 変更ファイルの簡単なスキャン |
| **統計情報** | WorkSession.statistics (JSONB) | クイックメトリクス |
| **完全な差分** | WorkSessionChange テーブル | UI でのreact-diff-viewer表示用 |
| **Unified差分** | WorkSessionChange.unifiedDiff | 代替差分フォーマット |
| **Git情報** | WorkSession.gitBaseline, gitFinal, branch | バージョントラッキング |

## Frontend Integration (react-diff-viewer)

The UI can use the stored diffs like this:

```tsx
import ReactDiffViewer from 'react-diff-viewer-continued';

// Fetch work sessions from API
const workSessions = await fetch(`/api/v1/tasks/${taskId}/work-sessions`).then(r => r.json());
const latestSession = workSessions[0];

// Render each file change
latestSession.changes.map((change) => (
  <ReactDiffViewer
    oldValue={change.oldValue}
    newValue={change.newValue}
    splitView={true}
    useDarkTheme={true}
    leftTitle={`${change.file} (before)`}
    rightTitle={`${change.file} (after)`}
    language={change.language}
  />
))
```

## 利点

1. **タスク説明**: クイックレビュー用の人間が読める要約（日本語）
2. **リレーショナルストレージ**: UIでの詳細検査用に完全な差分を保存
3. **ステータス**: 自動的に「完了」に設定
4. **トレーサビリティ**: Gitコミットとタスク変更をリンク
5. **統計情報**: 差分を開かずにクイックメトリクスを確認
6. **クエリ最適化**: 必要に応じてwork sessionsを遅延読み込み可能
7. **スケーラビリティ**: 大規模な差分データでもパフォーマンスを維持
8. **データ整合性**: 外部キー制約によるデータ整合性保証
