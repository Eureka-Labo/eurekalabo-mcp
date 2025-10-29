# EurekaClaude Framework

A complete task-driven development workflow framework centered around Eureka Tasks integration.

## Vision

EurekaClaude is a development framework that enforces and automates task-driven development through seamless integration with Eureka Tasks. Every code change is tracked, every task is linked to actual work, and the entire development process is visible and auditable.

## Core Principles

### 1. Task-First Development
- Every coding session starts with a task
- No code changes without active task tracking
- Complete audit trail of all work

### 2. Automated Workflow
- Git hooks automate task tracking
- Slash commands simplify operations
- MCP tools provide seamless integration

### 3. Team Visibility
- All work visible in Eureka dashboard
- Real-time progress tracking
- Clear communication through tasks

### 4. Japanese-First
- All content auto-generated in Japanese
- Optimized for Japanese development teams
- Bilingual documentation support

## Framework Components

### 📋 Core Files (in ~/.claude/)

```
~/.claude/
├── EUREKACLAUDE.md          # Main framework documentation
├── EUREKA_WORKFLOW.md        # Workflow patterns and rules
├── EUREKA_PRINCIPLES.md      # Development principles
├── EUREKA_TASK_ENFORCEMENT.md # Task enforcement rules
├── mcp.json                  # MCP server configuration
└── config/
    └── eureka-workflow.json  # Workflow settings
```

### 🔧 Slash Commands (in ~/.claude/commands/)

```
/eureka init          - Initialize task and start work session
/eureka complete      - Complete task and optionally create PR
/eureka status        - Show current task and branch status
/eureka pr           - Create PR from current branch
/eureka list         - List tasks with filters
```

### 🪝 Git Hooks (in project/.git/hooks/)

```
pre-commit  - Verify active work session
post-commit - Update task with commit info
pre-push    - Suggest PR creation
```

### 🤖 MCP Integration

- **Eureka Tasks MCP Server**: Full task management integration
- **Automated Change Tracking**: Git diffs linked to tasks
- **PR Management**: Automatic PR creation with task linking

## Installation

```bash
# Install EurekaClaude CLI
npm install -g @eurekalabo/eurekaclaude

# Initialize framework in your project
cd your-project
eurekaclaude init

# Interactive setup will configure:
# - Eureka API credentials
# - MCP server installation
# - Slash commands
# - Git hooks
# - Workflow preferences
```

## Daily Workflow

### Starting Work

```bash
# Natural language
claude "Start working on user authentication"

# Or use slash command
/eureka init "Add JWT authentication"

# What happens:
✓ Creates task in Eureka
✓ Starts work session
✓ Captures git baseline
✓ Ready to code!
```

### During Development

```bash
# Just code normally
# All changes are tracked automatically
# Git commits update task progress
```

### Completing Work

```bash
# Complete task and create PR in one command
/eureka complete --pr

# What happens:
✓ Captures all git changes
✓ Logs changes to task
✓ Updates task status to "done"
✓ Creates Pull Request
✓ Links PR to task
✓ Generates Japanese description
```

## Framework Features

### 🎯 Intelligent Task Management
- Auto-create tasks from natural language
- Smart task title generation
- Context-aware descriptions in Japanese

### 📊 Complete Audit Trail
- Every change linked to a task
- Full git diff history
- Work session tracking

### 🚀 One-Command Operations
- `/eureka complete --pr` - Complete task + Create PR
- Automatic Japanese descriptions
- Smart task linking

### 🔄 Workflow Automation
- Git hooks ensure proper workflow
- Automatic task status updates
- PR creation suggestions

### 👥 Team Collaboration
- Shared visibility in Eureka dashboard
- Clear task ownership
- Progress tracking

## Configuration

### Workflow Settings

```json
{
  "taskWorkflow": {
    "requireTaskBeforeCoding": true,
    "autoCompleteOnPR": false,
    "prCreationStrategy": "prompt"
  },
  "gitHooks": {
    "enabled": true,
    "checkWorkSession": true,
    "suggestPR": true
  },
  "language": {
    "primary": "ja",
    "fallback": "en"
  }
}
```

### Enforcement Levels

**Strict** (Recommended for teams):
- Task required before any code changes
- Blocks commits without work session
- Enforces PR creation workflow

**Flexible** (Good for solo):
- Suggests tasks but allows bypass
- Warns about missing work session
- Optional PR creation

**Advisory Only**:
- Shows reminders
- No enforcement
- Maximum flexibility

## Framework Philosophy

### Why Task-Driven Development?

1. **Visibility**: Everyone knows what's being worked on
2. **Context**: Every change has a "why" attached
3. **Collaboration**: Clear communication through tasks
4. **Quality**: Enforced workflow prevents mistakes
5. **Audit**: Complete history for compliance

### Why Eureka Tasks?

- **Git Integration**: Native change tracking
- **MCP Support**: Seamless Claude Code integration
- **Japanese-First**: Optimized for Japanese teams
- **Work Sessions**: Automatic diff capture
- **PR Linking**: Complete workflow automation

## Commands Reference

### eurekaclaude CLI

```bash
eurekaclaude init              # Initialize framework
eurekaclaude status            # Show configuration status
eurekaclaude update            # Update to latest version
eurekaclaude config            # Edit configuration
eurekaclaude uninstall         # Remove framework
```

### Slash Commands

```bash
/eureka init <title>           # Create task and start
/eureka complete [--pr]        # Complete task [+ PR]
/eureka status                 # Current task info
/eureka list [status]          # List tasks
/eureka pr [title]             # Create PR
```

### MCP Tools (used automatically)

```bash
@eureka-tasks list_tasks
@eureka-tasks create_task
@eureka-tasks start_work_on_task
@eureka-tasks complete_task_work
@eureka-tasks create_pull_request
```

## Benefits

✅ **Zero Overhead** - Natural language workflow
✅ **Complete Tracking** - Every change audited
✅ **Team Visibility** - Real-time dashboard
✅ **Quality Assurance** - Enforced best practices
✅ **Japanese Support** - Native Japanese content
✅ **One-Command PR** - `complete --pr` does everything
✅ **Git Integration** - Automatic change tracking
✅ **Flexible Enforcement** - Adjust to your needs

## Roadmap

- [ ] VS Code extension for task visualization
- [ ] Slack notifications for task updates
- [ ] AI-powered task suggestions
- [ ] Advanced analytics dashboard
- [ ] Multi-project support
- [ ] Custom workflow templates

## Support

- Documentation: https://github.com/eurekalabo/eurekaclaude
- Issues: https://github.com/eurekalabo/eurekaclaude/issues
- Discord: https://discord.gg/eurekalabo
