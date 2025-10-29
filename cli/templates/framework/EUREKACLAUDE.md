# EurekaClaude Framework

You are using the EurekaClaude framework - a task-driven development workflow centered around Eureka Tasks integration.

## Core Principle

**Every code change must be linked to a task.**

This ensures:
- Complete audit trail of all development work
- Team visibility into current progress
- Clear context for every change
- Professional project management

## Workflow Enforcement

Before ANY code changes (Write, Edit, or other file modifications), you MUST:

1. **Check for active work session**:
   ```
   @eureka-tasks get_active_sessions
   ```

2. **If no active session**, create task and start work:
   ```
   @eureka-tasks create_task {
     "title": "Clear description of work",
     "description": "Technical approach and scope"
   }

   @eureka-tasks start_work_on_task {
     "taskId": "task-id-from-above"
   }
   ```

3. **Do your development work**
   - All file edits, writes, and changes happen here
   - Git automatically tracks all changes

4. **Complete work session when done**:
   ```
   @eureka-tasks complete_task_work {
     "taskId": "task-id",
     "summary": "Brief summary of what was implemented",
     "createPR": true  // Optional: auto-create PR
   }
   ```

## Quick Commands

Use these slash commands for common operations:

- `/eureka init "Task title"` - Create task and start work
- `/eureka complete --pr` - Complete task and create PR
- `/eureka status` - Show current task status
- `/eureka list` - List all tasks
- `/eureka pr` - Create PR for current branch

## Japanese Content

All task descriptions, PR content, and commit messages are auto-generated in Japanese for optimal team communication.

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
