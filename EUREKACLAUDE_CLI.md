# EurekaClaude Framework CLI

**Status**: ✅ Complete and functional

## What We Built

A complete framework installer called **EurekaClaude** that sets up an optimized task-driven development workflow with one command.

## Components

### 1. Framework Files (templates/framework/)
- `EUREKACLAUDE.md` - Main framework documentation for Claude Code
- `AGENTS.md` - Agent orchestration configuration

### 2. Slash Commands (templates/commands/)
- `eureka.md` - Complete workflow command set
  - `/eureka init` - Create task and start work
  - `/eureka complete` - Finish task and create PR
  - `/eureka status` - Show current status
  - `/eureka list` - List tasks
  - `/eureka pr` - Create pull request

### 3. GitHub Workflows (templates/github-workflows/)
- `eureka-tasks.yml` - Full CI/CD integration
  - Automated task status updates
  - Test result posting
  - Build and deployment automation
  - Team notifications

### 4. CLI Tool (cli/)
```
cli/
├── src/
│   ├── index.ts                 # Main CLI entry point
│   ├── commands/
│   │   ├── init.ts             # Install framework
│   │   ├── status.ts           # Show configuration
│   │   ├── update.ts           # Update framework
│   │   └── uninstall.ts        # Remove framework
│   └── utils/
│       ├── platform.ts         # Platform detection
│       └── claude-config.ts    # Claude Code config management
├── templates/
│   ├── framework/              # Framework files
│   ├── commands/               # Slash commands
│   └── github-workflows/       # CI/CD workflows
└── package.json                # CLI package

Binary: eurekaclaude
```

## Installation Flow

When user runs `eurekaclaude init`:

1. ✅ **Prompts for configuration**
   - Eureka API URL and API key
   - Workspace path
   - Git hooks preference
   - Task enforcement level
   - GitHub workflows

2. ✅ **Installs framework files** to `~/.claude/`
   - EUREKACLAUDE.md
   - AGENTS.md

3. ✅ **Configures MCP server** in `~/.claude/mcp.json`
   - Eureka Tasks MCP server with credentials
   - Environment variables

4. ✅ **Installs slash commands** to `~/.claude/commands/`
   - eureka.md with all workflow commands

5. ✅ **Creates agent configuration** in `~/.claude/config/`
   - agents.json with task-manager, implementation, analysis, automation agents

6. ✅ **Installs GitHub workflows** to `.github/workflows/`
   - eureka-tasks.yml for CI/CD automation

7. ✅ **Sets up git hooks** in `.git/hooks/`
   - pre-commit: Check for active work session
   - pre-push: Suggest PR creation

8. ✅ **Creates workflow config** in `~/.claude/config/`
   - eureka-workflow.json with all settings

## Usage

### Install Globally
```bash
npm install -g @eurekalabo/eurekaclaude
```

### Initialize Project
```bash
cd your-project
eurekaclaude init
```

### Check Status
```bash
eurekaclaude status
```

### Update Framework
```bash
eurekaclaude update
```

### Remove Framework
```bash
eurekaclaude uninstall
```

## Daily Workflow

```bash
# 1. Start work
/eureka init "Add authentication feature"
→ Creates task, starts session, ready to code

# 2. Do development
# ... edit files ...

# 3. Complete and create PR
/eureka complete --pr
→ Captures changes, completes task, creates PR, links everything
```

## What Makes It Special

### 🎯 Complete Setup
One command installs EVERYTHING needed for optimized workflow:
- MCP server
- Agents
- Slash commands
- GitHub workflows
- Git hooks
- Configuration

### 🇯🇵 Japanese-First
All generated content in Japanese:
- Task descriptions
- PR content
- Commit messages
- Workflow notifications

### 🔧 Framework Not Library
Unlike libraries you import, EurekaClaude is a complete framework that sets up Claude Code environment with enforced workflow patterns.

### 🤖 Intelligent Agents
Built-in agent orchestration:
- Task Management Agent (workflow enforcement)
- Implementation Agent (code changes with tracking)
- Analysis Agent (quality checks)
- Automation Agent (CI/CD integration)

### 📊 Complete Visibility
Every code change linked to a task visible in Eureka dashboard with full audit trail.

## Files Created

When installed, these files are created:

```
~/.claude/
├── EUREKACLAUDE.md
├── AGENTS.md
├── mcp.json (modified)
├── commands/
│   └── eureka.md
└── config/
    ├── eureka-workflow.json
    └── agents.json

project/
├── .github/
│   └── workflows/
│       └── eureka-tasks.yml
└── .git/
    └── hooks/
        ├── pre-commit
        └── pre-push
```

## Next Steps

### To Publish
```bash
cd cli
npm login
npm publish --access public
```

### To Use
```bash
npm install -g @eurekalabo/eurekaclaude
cd your-project
eurekaclaude init
```

## Benefits

✅ **Zero Configuration** - One command setup
✅ **Complete Framework** - Everything needed for task-driven development
✅ **Team Ready** - Built for team collaboration
✅ **Japanese Support** - Optimized for Japanese teams
✅ **Flexible** - Adjustable enforcement levels
✅ **Automated** - Git hooks and CI/CD integration
✅ **Professional** - Complete audit trail and visibility

## Documentation

- CLI README: `cli/README.md`
- Framework Design: `cli/EUREKACLAUDE_FRAMEWORK.md`
- Templates: `cli/templates/`
- Source Code: `cli/src/`
