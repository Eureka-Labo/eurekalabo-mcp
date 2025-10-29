# EurekaClaude Framework

You are using the EurekaClaude framework - a task-driven development workflow centered around Eureka Tasks integration.

## Core Principle

**Every code change must be linked to a task.**

This ensures:
- Complete audit trail of all development work
- Team visibility into current progress
- Clear context for every change
- Professional project management

## 🇯🇵 Japanese Content Requirement

**CRITICAL: All task content MUST be generated in Japanese.**

When creating or updating tasks, you MUST:
- Write task titles in Japanese (タイトルは日本語で)
- Write task descriptions in Japanese (説明は日本語で)
- Write task summaries in Japanese (要約は日本語で)
- Write PR titles in Japanese (PRタイトルは日本語で)
- Write PR descriptions in Japanese (PR説明は日本語で)

This is NON-NEGOTIABLE for this framework.

## Workflow Enforcement

Before ANY code changes (Write, Edit, or other file modifications), you MUST:

1. **Check for active work session**:
   ```
   @eureka-tasks get_active_sessions
   ```

2. **If no active session**, create task and start work:
   ```
   @eureka-tasks create_task {
     "title": "ユーザー認証機能の実装",
     "description": "JWT認証ミドルウェアを追加し、全APIルートを保護する"
   }

   @eureka-tasks start_work_on_task {
     "taskId": "task-id-from-above"
   }
   ```

   **IMPORTANT: Task title and description MUST be in Japanese!**

3. **Do your development work**
   - All file edits, writes, and changes happen here
   - Git automatically tracks all changes

4. **Complete work session when done**:
   ```
   @eureka-tasks complete_task_work {
     "taskId": "task-id",
     "summary": "JWT認証ミドルウェアを実装し、全APIルートを保護しました",
     "createPR": true  // Optional: auto-create PR
   }
   ```

   **IMPORTANT: Summary MUST be in Japanese!**

## Quick Commands

Use these slash commands for common operations:

- `/eureka init "認証機能の追加"` - Create task and start work
- `/eureka complete --pr` - Complete task and create PR
- `/eureka status` - Show current task status
- `/eureka list` - List all tasks
- `/eureka pr` - Create PR for current branch

## 🇯🇵 Japanese Content (MANDATORY)

**ALL task and PR content MUST be in Japanese:**

✅ **Correct Examples:**
- Task title: "ユーザー認証機能の実装"
- Task description: "JWT認証ミドルウェアを追加し、全APIルートを保護する"
- Task summary: "bcryptを使用したJWT認証を実装しました"
- PR title: "新機能: ユーザー認証システム"

❌ **WRONG - Never use English:**
- Task title: "Add user authentication"
- Task description: "Add JWT middleware"
- Task summary: "Implemented JWT authentication"
- PR title: "Feature: User authentication system"

**When Claude suggests English content, IMMEDIATELY convert to Japanese.**

## Benefits

✅ **Complete Tracking** - Every change linked to a task
✅ **Team Visibility** - Real-time progress in Eureka dashboard
✅ **Audit Trail** - Full history of who did what and why
✅ **Quality Assurance** - Enforced workflow prevents mistakes
✅ **One-Command Operations** - Simple commands for complex workflows

## Configuration

Framework settings are in `~/.claude/config/eureka-workflow.json`

Adjust enforcement level:
- `strict` - Block code changes without task (recommended for teams)
- `flexible` - Warn but allow bypass (good for solo)
- `advisory` - Show reminders only (maximum flexibility)

---

For more information: https://github.com/eurekalabo/eurekaclaude
