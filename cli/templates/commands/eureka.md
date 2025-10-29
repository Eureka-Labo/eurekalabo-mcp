# Eureka Task Management

Quick access to Eureka Tasks workflow operations.

## 🇯🇵 IMPORTANT: すべて日本語で入力してください

**タスクのタイトルと内容は必ず日本語で書いてください。**

## Usage

```
/eureka <command> [options]
```

## Commands

### init - Start New Task
Create a task and begin work session in one command.

```
/eureka init "ユーザー認証機能の追加"
/eureka init "ログインバグの修正"
/eureka init "APIクライアントのリファクタリング"
```

**IMPORTANT: タスクタイトルは必ず日本語で！**

**What it does:**
1. Creates task in Eureka with Japanese description
2. Starts work session with git baseline
3. Ready to code immediately

---

### complete - Finish Task
Complete current task and optionally create PR.

```
/eureka complete
/eureka complete --pr
/eureka complete --pr "カスタムPRタイトル（日本語で）"
```

**IMPORTANT: PRタイトルも日本語で！**

**What it does:**
1. Captures all git changes since start
2. Logs changes to task with diffs
3. Updates task status to "done"
4. [If --pr] Creates Pull Request automatically (in Japanese)
5. [If --pr] Links PR to all branch tasks

---

### status - Current Status
Show current task and work session info.

```
/eureka status
```

**Shows:**
- Active work session details
- Current task title and ID
- Branch name and tasks
- PR status if exists

---

### list - List Tasks
List tasks with optional filtering.

```
/eureka list
/eureka list todo
/eureka list in_progress
/eureka list done
```

**Filters:**
- `todo` - Not started tasks
- `in_progress` - Currently being worked on
- `done` - Completed tasks
- (no filter) - All tasks

---

### pr - Create Pull Request
Create PR for current branch with all tasks.

```
/eureka pr
/eureka pr "新機能: ユーザー認証システム"
```

**IMPORTANT: PRタイトルは必ず日本語で！**

**What it does:**
1. Lists all tasks in current branch
2. Generates PR description from work sessions (in Japanese)
3. Creates GitHub PR
4. Links PR to all tasks
5. Updates task metadata

**Smart Features:**
- Auto-creates task if no tracked tasks exist
- Generates Japanese title from branch name
- Includes all task summaries in PR description (in Japanese)
- Links all changes to proper tasks
- All content generated in Japanese automatically

---

## Examples

### Daily Workflow

```bash
# 朝 - 作業開始
/eureka init "パスワードリセット機能の実装"

# ... 開発作業 ...

# 午後 - タスク完了とPR作成
/eureka complete --pr

# 結果: タスク完了、PR作成、すべてリンクされました！
```

## 🇯🇵 Japanese Content Examples

### ✅ Correct (日本語で)
```bash
/eureka init "ユーザー認証機能の実装"
/eureka complete --pr
/eureka pr "新機能: JWT認証システム"
```

### ❌ Wrong (英語は使わないで)
```bash
/eureka init "Add user authentication"  # WRONG!
/eureka pr "Feature: JWT auth system"    # WRONG!
```

**Remember: ALL task and PR content MUST be in Japanese!**

### Check Current Status

```bash
/eureka status

# Output:
# 📋 Active Work Session
# Task: Implement password reset feature
# ID: cmXXXXX
# Branch: feature/password-reset
# Started: 2 hours ago
#
# 🌿 Branch Tasks: 1 task
# 🔗 PR: Not created yet
```

### List Team Tasks

```bash
/eureka list in_progress

# Shows all tasks currently being worked on by the team
```

---

## Tips

💡 **Use natural language**: Just tell Claude what you want to work on
   - "Start working on authentication" → Auto-creates task
   - "I'm done with the auth feature" → Auto-completes task

💡 **One command PR creation**: `/eureka complete --pr` does everything
   - Completes task
   - Captures all changes
   - Creates PR
   - Links everything together

💡 **Team visibility**: All tasks visible in Eureka dashboard
   - Real-time progress tracking
   - Who's working on what
   - Complete change history

---

## Configuration

To adjust workflow settings:
```
eurekaclaude config
```

Or manually edit: `~/.claude/config/eureka-workflow.json`
