# EurekaClaude Framework

**A complete task-driven development framework centered around Eureka Tasks integration.**

## What is EurekaClaude?

EurekaClaude is an opinionated development workflow framework that enforces and automates task-driven development. Every code change is tracked, every task is linked to actual work, and the entire development process is visible and auditable.

Perfect for:
- 🏢 Teams requiring complete audit trails
- 🇯🇵 Japanese development teams (Japanese-first content)
- 📊 Projects needing visibility and tracking
- ✅ Organizations requiring workflow enforcement

## Features

### 🎯 Task-First Development
- Every coding session starts with a task
- No code changes without active task tracking
- Complete audit trail of all work

### 🤖 Automated Workflow
- One command to create task and start work: `/eureka init`
- One command to complete and create PR: `/eureka complete --pr`
- Git hooks automate tracking
- MCP tools provide seamless integration

### 👥 Team Visibility
- All work visible in Eureka dashboard
- Real-time progress tracking
- Clear communication through tasks

### 🇯🇵 Japanese-First
- All content auto-generated in Japanese
- Optimized for Japanese development teams
- Bilingual documentation support

### 🔧 Complete Setup
One command installs:
- Eureka Tasks MCP server
- Agent orchestration system
- GitHub CI/CD workflows
- Slash commands for workflow
- Git hooks for automation

## Installation

### Prerequisites
- Node.js 18+
- Git repository
- Eureka Tasks account with API key

### Install CLI

```bash
npm install -g @eurekalabo/eurekaclaude
```

### Initialize Project

```bash
cd your-project
eurekaclaude init
```

Interactive setup will configure:
- ✅ Eureka API credentials
- ✅ MCP server installation
- ✅ Slash commands
- ✅ Agent configuration
- ✅ GitHub workflows
- ✅ Git hooks
- ✅ Workflow preferences

## Quick Start

### 1. Start Working

```bash
# Natural language
claude "Start working on user authentication"

# Or use slash command
/eureka init "Add JWT authentication"
```

**What happens:**
- ✓ Creates task in Eureka
- ✓ Starts work session
- ✓ Captures git baseline
- ✓ Ready to code!

### 2. Do Development

```bash
# Just code normally
# All changes are tracked automatically
# Git commits update task progress
```

### 3. Complete and Create PR

```bash
# One command does everything
/eureka complete --pr
```

**What happens:**
- ✓ Captures all git changes
- ✓ Logs changes to task
- ✓ Updates task status to "done"
- ✓ Creates Pull Request
- ✓ Links PR to task
- ✓ Generates Japanese description

## CLI Commands

### eurekaclaude init
Initialize EurekaClaude framework in current project

```bash
eurekaclaude init
eurekaclaude init --api-url https://your-api.com --api-key pk_xxx
```

### eurekaclaude status
Show current framework configuration and status

```bash
eurekaclaude status
```

### eurekaclaude update
Update to latest version

```bash
eurekaclaude update
```

### eurekaclaude uninstall
Remove framework configuration

```bash
eurekaclaude uninstall
eurekaclaude uninstall --keep-config
```

## Slash Commands

### /eureka init
Create task and start work session

```bash
/eureka init "Add authentication feature"
```

### /eureka complete
Complete task and optionally create PR

```bash
/eureka complete
/eureka complete --pr
/eureka complete --pr "Custom PR title"
```

### /eureka status
Show current task and branch status

```bash
/eureka status
```

### /eureka list
List tasks with optional filtering

```bash
/eureka list
/eureka list todo
/eureka list in_progress
/eureka list done
```

### /eureka pr
Create PR for current branch

```bash
/eureka pr
/eureka pr "Custom title in Japanese"
```

## Framework Components

### 📋 Framework Files (`~/.claude/`)

```
~/.claude/
├── EUREKACLAUDE.md          # Main framework documentation
├── AGENTS.md                 # Agent configuration guide
├── mcp.json                  # MCP server configuration
├── commands/
│   └── eureka.md            # Slash command definitions
└── config/
    ├── eureka-workflow.json # Workflow settings
    └── agents.json          # Agent configuration
```

### 🤖 MCP Integration

- **Eureka Tasks MCP Server**: Full task management integration
- **Automated Change Tracking**: Git diffs linked to tasks
- **PR Management**: Automatic PR creation with task linking

### 🪝 Git Hooks

- **pre-commit**: Verify active work session
- **pre-push**: Suggest PR creation

### 🔄 GitHub Workflows

- **CI/CD Integration**: Automated testing and deployment
- **Task Status Updates**: Auto-update tasks from CI results
- **Team Notifications**: Notify team of builds and deployments

### 🎭 Agents

- **Task Management Agent**: Handles all Eureka Tasks operations
- **Implementation Agent**: Executes coding tasks with tracking
- **Analysis Agent**: Code review and quality analysis
- **Automation Agent**: CI/CD and automated workflows

## Configuration

### Workflow Settings

Edit `~/.claude/config/eureka-workflow.json`:

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

### Agent Configuration

Edit `~/.claude/config/agents.json`:

```json
{
  "task-manager": {
    "enabled": true,
    "autoCreateTasks": true,
    "requireWorkSession": true
  },
  "implementation": {
    "enabled": true,
    "enforceSession": true
  },
  "analysis": {
    "enabled": true,
    "prePrReview": true
  },
  "automation": {
    "enabled": true,
    "updateTasks": true
  }
}
```

### Enforcement Levels

**Strict** (Recommended for teams):
```json
{
  "requireTaskBeforeCoding": true
}
```
- Task required before any code changes
- Blocks commits without work session
- Enforces PR creation workflow

**Flexible** (Good for solo):
```json
{
  "requireTaskBeforeCoding": false
}
```
- Suggests tasks but allows bypass
- Warns about missing work session
- Optional PR creation

## GitHub Integration

### Setup GitHub Secrets

Add these secrets to your repository:

1. `EUREKA_API_URL` - Your Eureka API URL
2. `EUREKA_API_KEY` - Your project API key

### Workflow Features

The installed GitHub workflow (`eureka-tasks.yml`) provides:

- ✅ Automated task status updates from PRs
- ✅ Test result posting to tasks
- ✅ Build status tracking
- ✅ Deployment automation
- ✅ Team notifications

## Benefits

✅ **Zero Overhead** - Natural language workflow, no manual task management
✅ **Complete Tracking** - Every change linked to tasks automatically
✅ **Team Visibility** - Everyone sees what's being worked on
✅ **Audit Trail** - Full history for compliance and quality
✅ **Quality Assurance** - Enforced workflow prevents mistakes
✅ **Japanese Support** - Native Japanese content generation
✅ **One-Command Operations** - Simple commands for complex workflows
✅ **Git Integration** - Automatic change tracking
✅ **Flexible Enforcement** - Adjust to your team's needs

## Troubleshooting

### MCP Server Not Working
1. Restart Claude Code
2. Run `eurekaclaude status` to verify configuration
3. Check `~/.claude/mcp.json` exists
4. Verify API credentials are correct

### Commands Not Found
1. Run `eurekaclaude status` to check installation
2. Ensure `~/.claude/commands/eureka.md` exists
3. Restart Claude Code

### Git Hooks Not Running
1. Check `.git/hooks/pre-commit` is executable
2. Verify you're in a git repository
3. Re-run `eurekaclaude init` to reinstall hooks

## Support

- Documentation: https://github.com/eurekalabo/eurekaclaude
- Issues: https://github.com/eurekalabo/eurekaclaude/issues
- Discord: https://discord.gg/eurekalabo

## License

MIT License - see LICENSE file for details

---

Made with ❤️ by Eureka Labo
