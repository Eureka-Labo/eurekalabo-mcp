# CLI Sub-Agent Commands Guide

Complete guide to using eurekaclaude CLI commands that leverage Claude Code sub-agents.

## Overview

The eurekaclaude CLI provides convenient commands that prepare data and output instructions for Claude Code to launch specialized sub-agents. This creates a seamless workflow between your terminal and Claude Code's AI capabilities.

## How It Works

```
┌─────────────────┐
│  Terminal       │  1. Run eurekaclaude command
│  $ eurekaclaude │     (analyzes local environment)
│     commit      │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  CLI Tool       │  2. Gathers data (git diff, etc.)
│  Analyzes       │     Outputs instructions for Claude
│  Local Data     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Copy/Paste     │  3. Copy MCP tool call
│  to Claude Code │     Paste into Claude Code
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Claude Code    │  4. Launches sub-agent
│  MCP Server     │     Returns professional result
│  Sub-Agent      │
└─────────────────┘
```

## Available Commands

### 1. `eurekaclaude commit`

**Purpose**: Generate intelligent commit messages from staged changes

**What it does**:
- Checks if you're in a git repository
- Gets your staged changes (`git diff --staged`)
- Outputs MCP tool call for Claude Code to use

**Usage**:
```bash
# Stage your changes first
git add src/auth.ts src/middleware.ts

# Run command
eurekaclaude commit

# Copy the output and paste into Claude Code
```

**Output**:
```
🤖 Smart Commit Message Generator

✓ Git repository found
✓ Staged changes found (247 lines)

✅ Ready to generate smart commit message!

📋 Instructions for Claude Code:

await mcp__eureka-tasks__generate_smart_commit_message({
  gitDiff: `
diff --git a/src/auth.ts b/src/auth.ts
index 1234567..abcdefg 100644
--- a/src/auth.ts
+++ b/src/auth.ts
[full diff here]
  `
});

---

💡 Tip: Claude Code will automatically launch the technical-writer sub-agent
   to analyze your changes and generate a professional commit message.
```

**Result from Claude Code**:
```
feat: Implement JWT authentication with refresh tokens

Add comprehensive authentication system with:
- JWT token generation and validation middleware
- Bcrypt password hashing with configurable rounds
- Refresh token support for long-lived sessions
- Integration tests for all auth flows

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

---

### 2. `eurekaclaude pr`

**Purpose**: Generate comprehensive PR descriptions from branch tasks and changes

**What it does**:
- Checks current branch (must not be on main/master)
- Gets diff summary comparing to base branch
- Outputs instructions to get branch tasks and generate PR description

**Usage**:
```bash
# Make sure you're on a feature branch
git checkout feature/user-authentication

# Run command
eurekaclaude pr

# Or specify custom base branch
eurekaclaude pr --base-branch develop
```

**Output**:
```
🤖 Smart PR Description Generator

✓ Git repository found
✓ Feature branch: feature/user-authentication
✓ Changes analyzed

✅ Ready to generate smart PR description!

📋 Instructions for Claude Code:

Step 1: Get branch tasks

const branchTasks = await mcp__eureka-tasks__list_branch_tasks();

Step 2: Generate smart PR description

await mcp__eureka-tasks__generate_smart_pr_description({
  branchTasks: branchTasks.tasks,
  gitDiff: `
 src/auth.ts        | 145 +++++++++++++++++++
 src/middleware.ts  |  67 +++++++++
 tests/auth.test.ts | 234 +++++++++++++++++++++++++++++
 3 files changed, 446 insertions(+)
  `,
  baseBranch: 'main'
});

---

💡 Tip: The technical-writer sub-agent will create a comprehensive
   PR description with Japanese/English summaries and testing checklist.
```

**Result from Claude Code**:
Comprehensive markdown PR description with:
- Japanese summary (概要)
- English detailed description
- Change breakdown by task
- Testing checklist
- Breaking changes section
- Related task links

---

### 3. `eurekaclaude validate`

**Purpose**: Validate your eurekaclaude development environment

**What it does**:
- Performs quick local checks (Node version, git, env vars)
- Outputs instructions for comprehensive validation via sub-agent

**Usage**:
```bash
# Validate current directory
eurekaclaude validate

# Or validate specific project
eurekaclaude validate --workspace /path/to/project
```

**Output**:
```
🔍 EurekaClaude Setup Validator

✓ Basic checks completed

📊 Quick Validation Results:

✅  Node.js: v20.10.0
✅  Git: Installed
✅  Git Repository: Yes
⚠️  Env Variables: Not configured

✅ For comprehensive validation, use Claude Code:

📋 Instructions:

await mcp__eureka-tasks__validate_setup({
  projectPath: '/Users/user/workspace/my-project'
});

---

💡 Tip: The devops-architect sub-agent will perform comprehensive
   checks including MCP configuration, work sessions, and system health.
```

**Result from Claude Code**:
Detailed health report with:
- ✅ Passing checks (environment, git, MCP config)
- ⚠️ Warnings (non-critical issues)
- ❌ Critical issues (blocking problems)
- 🔧 Recommended fix commands
- 📊 System information

---

### 4. `eurekaclaude setup smart`

**Purpose**: Generate optimal project configuration using AI analysis

**What it does**:
- Detects project type (React, Vue, Python, Go, etc.)
- Outputs instructions for system-architect sub-agent to analyze and configure

**Usage**:
```bash
# Auto-detect project type
eurekaclaude setup smart

# Or specify project type
eurekaclaude setup smart --type react

# For specific project
eurekaclaude setup smart --workspace /path/to/project --type vue
```

**Output**:
```
⚙️  Smart Setup Generator

✓ Project type detected: react

✅ Ready to generate smart setup!

📋 Instructions for Claude Code:

await mcp__eureka-tasks__generate_smart_setup({
  projectPath: '/Users/user/workspace/my-react-app',
  projectType: 'react'
});

---

💡 Tip: The system-architect sub-agent will analyze your project
   and generate optimal configuration, hooks, and task templates.
```

**Result from Claude Code**:
Complete configuration package with:
- `claude_desktop_config.json` entry
- Environment variable setup
- Recommended git hooks for React projects
- React-specific task templates
- Step-by-step setup instructions

---

## Complete Workflows

### Workflow 1: Smart Commit After Coding

```bash
# 1. Code your feature
vim src/auth.ts

# 2. Stage changes
git add src/auth.ts tests/auth.test.ts

# 3. Generate smart commit message
eurekaclaude commit

# 4. Copy output and paste into Claude Code
# Claude launches technical-writer sub-agent

# 5. Use the generated commit message
git commit -m "feat: Add JWT authentication

Implement JWT token generation and validation with:
- Configurable token expiration
- Refresh token support
- Comprehensive test coverage

🤖 Generated with Claude Code"
```

---

### Workflow 2: Create PR with AI Description

```bash
# 1. Ensure you're on feature branch
git checkout feature/authentication

# 2. Complete all your tasks
# (work sessions tracked automatically)

# 3. Generate PR instructions
eurekaclaude pr

# 4. In Claude Code:
#    a. Get branch tasks
const tasks = await mcp__eureka-tasks__list_branch_tasks();

#    b. Generate description
const desc = await mcp__eureka-tasks__generate_smart_pr_description({
  branchTasks: tasks.tasks,
  gitDiff: "...",
  baseBranch: 'main'
});

#    c. Create PR with description
await mcp__eureka-tasks__create_pull_request({
  title: "Feature: User Authentication"
});
```

---

### Workflow 3: New Team Member Onboarding

```bash
# 1. Clone repository
git clone git@github.com:company/project.git
cd project

# 2. Run validation
eurekaclaude validate

# 3. Follow instructions in Claude Code
await mcp__eureka-tasks__validate_setup({ projectPath: '.' });

# 4. If issues found, run smart setup
eurekaclaude setup smart

# 5. Apply configuration in Claude Code
await mcp__eureka-tasks__generate_smart_setup({
  projectPath: '.',
  projectType: 'react'
});

# 6. Apply returned configuration
# - Copy claude_desktop_config.json
# - Set environment variables
# - Install git hooks
# - Ready to work!
```

---

### Workflow 4: Troubleshooting Issues

```bash
# 1. Something's not working...
# Run validation
eurekaclaude validate

# 2. Check output for quick issues
📊 Quick Validation Results:
✅  Node.js: v20.10.0
✅  Git: Installed
❌  Git Repository: No        # <-- Issue found!
⚠️  Env Variables: Not configured

# 3. Fix immediate issues
git init
export EUREKA_API_KEY="your-key"

# 4. Run comprehensive validation in Claude Code
await mcp__eureka-tasks__validate_setup();

# 5. Follow recommended actions from report
```

---

## Command Reference

### `eurekaclaude commit`

| Option | Description | Default |
|--------|-------------|---------|
| `-w, --workspace <path>` | Workspace path | Current directory |

**Requirements**:
- Git repository
- Staged changes (`git add` files first)

**Outputs**: MCP tool call for `generate_smart_commit_message`

---

### `eurekaclaude pr`

| Option | Description | Default |
|--------|-------------|---------|
| `-w, --workspace <path>` | Workspace path | Current directory |
| `-b, --base-branch <branch>` | Base branch to compare | `main` |

**Requirements**:
- Git repository
- Not on base branch
- Branch has commits ahead of base

**Outputs**: MCP tool calls for `list_branch_tasks` and `generate_smart_pr_description`

---

### `eurekaclaude validate`

| Option | Description | Default |
|--------|-------------|---------|
| `-w, --workspace <path>` | Workspace path | Current directory |

**Requirements**: None (works anywhere)

**Outputs**:
- Quick validation results (CLI)
- MCP tool call for `validate_setup` (comprehensive)

---

### `eurekaclaude setup smart`

| Option | Description | Default |
|--------|-------------|---------|
| `-w, --workspace <path>` | Workspace path | Current directory |
| `-t, --type <type>` | Project type | Auto-detect |

**Project Types**: `react`, `vue`, `next`, `express`, `python`, `go`, `node`, etc.

**Requirements**: None (works anywhere)

**Outputs**: MCP tool call for `generate_smart_setup`

---

## Tips and Best Practices

### 💡 Tip 1: Always Stage First
```bash
# DON'T run commit without staging
eurekaclaude commit  # Will fail!

# DO stage changes first
git add .
eurekaclaude commit  # Success!
```

### 💡 Tip 2: Use with Task Tracking
```bash
# Best workflow
1. Start task: in Claude Code
   mcp__eureka-tasks__start_work_on_task({ taskId })

2. Code your feature

3. Generate smart commit:
   eurekaclaude commit (in terminal)
   → Copy to Claude Code

4. Complete task:
   mcp__eureka-tasks__complete_task_work({ taskId, summary })
```

### 💡 Tip 3: Validate Before Important Operations
```bash
# Before deployment
eurekaclaude validate
# Fix any issues found

# Then deploy
npm run deploy
```

### 💡 Tip 4: Use Smart Setup for New Projects
```bash
# Setting up new project
eurekaclaude setup smart

# Returns project-optimized configuration
# - React projects get React hooks and templates
# - Python projects get Python-specific setup
# - etc.
```

---

## Integration with Make Commands

If you're using the Makefile:

```bash
# Build CLI
make cli-build

# Install CLI globally
make cli-install

# Then use commands
eurekaclaude commit
eurekaclaude pr
eurekaclaude validate
eurekaclaude setup smart
```

---

## Troubleshooting

### Command not found: eurekaclaude

**Solution**:
```bash
# Install CLI globally
cd /path/to/mcp-server/cli
npm link

# Or use via npm
npm exec eurekaclaude -- commit
```

### No staged changes found

**Solution**:
```bash
# Stage your changes first
git add <files>

# Then run command
eurekaclaude commit
```

### Not a git repository

**Solution**:
```bash
# Initialize git
git init

# Then run command
eurekaclaude commit
```

### Claude Code doesn't recognize MCP tool

**Solution**:
```bash
# 1. Rebuild MCP server
cd /path/to/mcp-server
npm run build

# 2. Restart Claude Desktop

# 3. Verify MCP server is configured
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

---

## See Also

- [Sub-Agent Integration Guide](./SUBAGENT_INTEGRATION.md) - Complete sub-agent documentation
- [Sub-Agent Examples](./SUBAGENT_EXAMPLES.md) - Real-world usage examples
- [Sub-Agent Quick Start](./SUBAGENT_QUICKSTART.md) - Fast reference
- [CLI README](./cli/README.md) - Full CLI documentation

---

## Summary

The eurekaclaude CLI sub-agent commands provide a bridge between your terminal and Claude Code's AI capabilities:

1. **`commit`** - Smart commit messages (technical-writer)
2. **`pr`** - Comprehensive PR descriptions (technical-writer)
3. **`validate`** - Environment health checks (devops-architect)
4. **`setup smart`** - Intelligent configuration (system-architect)

All commands prepare local data and output instructions for Claude Code to launch the appropriate sub-agent, creating a seamless AI-powered development workflow.

**Time Savings**: 30-90% reduction in documentation and configuration tasks
**Quality**: Professional, consistent output following best practices
**Workflow**: Seamless integration between terminal and Claude Code

Start using them today to supercharge your development process! 🚀
