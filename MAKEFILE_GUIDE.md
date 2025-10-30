# Makefile Guide - Eureka Tasks MCP Server

This guide explains how to use the Makefile for common development and deployment tasks.

## Quick Reference

```bash
# Show all available commands
make help

# Most common commands
make install            # Install CLI globally
make build              # Build everything
make hooks-install      # Install hooks (guidance mode)
make hooks-status       # Check hook status
make status             # Show system status
```

## Installation & Setup

### Install CLI Globally

```bash
# Install eurekaclaude command globally
make install
```

**What it does:**
- Builds the CLI
- Creates global symlink via npm link
- Enables `eurekaclaude` command from anywhere

**After installation:**
```bash
# Use from any directory
eurekaclaude build
eurekaclaude hooks install
eurekaclaude status
```

**Permissions:**
- **macOS/Linux**: May require `sudo make install` if npm global directory needs permissions
- **Windows**: Run Command Prompt or PowerShell as Administrator

**Uninstall:**
```bash
make uninstall
```

### First Time Setup

```bash
# Install all dependencies and build everything
make install-deps
make build

# Install work session hooks (recommended)
make hooks-install

# Or for stricter enforcement
make hooks-strict
```

### Quick Start (One Command)

```bash
# Does everything: install deps, build, and install hooks
make quickstart
```

Output:
```
📦 Installing MCP server dependencies...
📦 Installing CLI dependencies...
✅ Dependencies installed
🔨 Building MCP server...
✅ MCP server built
🔨 Building CLI...
✅ CLI built
🪝 Installing work session hooks (guidance mode)...
✅ Hooks installed

🎉 Quick start complete!

Next steps:
  1. Restart Claude Code
  2. Configure your EUREKA_API_KEY
  3. Start coding - tasks will be created automatically!
```

## Build Commands

### Build Everything

```bash
make build
```

Builds both:
- MCP server (TypeScript → JavaScript)
- CLI (TypeScript → JavaScript)

### Build Individually

```bash
# Just the MCP server
make build-mcp

# Just the CLI
make build-cli
```

### Rebuild from Scratch

```bash
# Clean and rebuild
make rebuild
```

## Hook Management

### Install Hooks

#### Guidance Mode (Recommended)

```bash
make hooks-install
```

**What it does:**
- Prompts user when no session exists
- Allows bypass if needed
- Gives Claude time to auto-create tasks
- User-friendly workflow

#### Strict Mode

```bash
make hooks-strict
```

**What it does:**
- Hard blocks without active session
- No bypass allowed
- Maximum enforcement
- Best for teams

### Check Hook Status

```bash
make hooks-status
```

Output example:
```
🪝 Eureka Tasks Hook Status

✅ Hook script: Installed
   /path/to/.claude/hooks/check-work-session.js
✅ Hook configuration: Active
✅ Active session: Yes
   Task: task-123
   Started: 2025-10-29 18:30:00
   Branch: feature/auth
```

### Uninstall Hooks

```bash
make hooks-uninstall
```

Removes hook configuration from settings.local.json.

## Development Commands

### Run MCP Server (Development Mode)

```bash
make dev
```

Runs MCP server with tsx for hot reload during development.

### Run CLI (Development Mode)

```bash
make dev-cli
```

Runs CLI in development mode for testing commands.

## Utility Commands

### Check System Status

```bash
make status
```

Shows:
- Node and npm versions
- Build status (MCP server and CLI)
- Current git branch
- Active session status

Example output:
```
📊 Eureka Tasks MCP Server Status

Node Version:
v22.0.0

npm Version:
10.5.1

Build Status:
  MCP Server: ✅ Built
  CLI: ✅ Built

Git Status:
main

Active Session: ⚠️  No
```

### Clean Build Artifacts

```bash
# Remove build files
make clean

# Remove build files AND node_modules
make clean-all
```

### Run Tests

```bash
make test
```

Currently a placeholder - runs `npm test`.

## Advanced Commands

### Link CLI Globally

```bash
make link-cli
```

**What it does:**
- Builds CLI
- Creates global symlink
- Enables `eurekaclaude` command everywhere

**After linking:**
```bash
# Use from any directory
eurekaclaude hooks install
eurekaclaude hooks status
```

### Publish CLI to npm

```bash
make publish
```

**Requirements:**
- npm authentication configured
- Proper version in package.json
- Clean git state

## Common Workflows

### Daily Development

```bash
# Morning: Check status
make status

# If changes were made to TypeScript
make build

# Check if hooks still working
make hooks-status
```

### After Git Pull

```bash
# Rebuild everything
make rebuild

# Reinstall hooks if needed
make hooks-install
```

### Setting Up New Machine

```bash
# One command setup
make quickstart

# Or step by step
make install-deps
make build
make hooks-install
make link-cli
```

### Switching Hook Modes

```bash
# Currently in strict mode, want guidance
make hooks-install

# Currently in guidance, want strict
make hooks-strict
```

### Testing Changes

```bash
# Make changes to src/
make build-mcp

# Make changes to cli/src/
make build-cli

# Test hooks immediately
make hooks-status
```

## Troubleshooting

### "make: command not found"

Install make:
```bash
# macOS (comes with Xcode Command Line Tools)
xcode-select --install

# Linux
sudo apt-get install build-essential  # Debian/Ubuntu
sudo yum install make                   # RedHat/CentOS
```

### "Permission denied" errors

```bash
# Make sure Makefile is in the right location
ls -la Makefile

# Check it's executable (shouldn't matter but sometimes helps)
chmod +x Makefile
```

### Build fails

```bash
# Clean everything and try again
make clean-all
make install-deps
make build
```

### Hooks not working after install

```bash
# Verify installation
make hooks-status

# Reinstall
make hooks-install

# Restart Claude Code
```

## Tips & Best Practices

### 1. Always Build After Changes

```bash
# After editing src/index.ts
make build-mcp

# After editing cli/src/
make build-cli
```

### 2. Check Status Regularly

```bash
make status
```

Quickly shows if everything is built and working.

### 3. Use Guidance Mode First

```bash
make hooks-install  # Start with this
```

Try guidance mode first. Switch to strict only if needed:
```bash
make hooks-strict   # Only if guidance isn't strict enough
```

### 4. Quick Rebuilds

```bash
# Just rebuild, don't clean
make build

# Full clean rebuild
make rebuild
```

### 5. Link for Development

```bash
make link-cli
```

Enables testing CLI changes immediately without reinstalling.

## Environment Variables

The Makefile respects these environment variables:

```bash
# Use different workspace
WORKSPACE=/path/to/project make hooks-install

# Force hook installation
FORCE=true make hooks-install
```

## Integration with Other Tools

### With Git Hooks

```bash
# In .git/hooks/pre-commit
#!/bin/bash
make hooks-status
```

### With CI/CD

```yaml
# .github/workflows/build.yml
steps:
  - name: Build
    run: make build

  - name: Test
    run: make test
```

### With Docker

```dockerfile
# Dockerfile
FROM node:22
WORKDIR /app
COPY . .
RUN make install-deps
RUN make build
CMD ["make", "dev"]
```

## Files Created/Modified

The Makefile operates on these files:

```
mcp-server/
├── Makefile                    ← The Makefile itself
├── dist/                       ← MCP server build output
├── cli/
│   └── dist/                   ← CLI build output
├── .claude/
│   ├── hooks/
│   │   └── check-work-session.js  ← Created by hooks-install
│   └── settings.local.json     ← Updated by hooks-install
└── .eureka-active-session      ← Created by MCP during sessions
```

## Getting Help

### Show Available Commands

```bash
make help
```

### Check Current Status

```bash
make status
```

### Test Specific Feature

```bash
# Test hooks
make hooks-status

# Test build
make build && make status
```

## Summary

**Installation:**
```bash
make install            # Install CLI globally
make uninstall          # Uninstall CLI globally
```

**Most Used Commands:**
```bash
make build              # Build everything
make hooks-install      # Install hooks
make hooks-status       # Check hooks
make status             # System status
make clean              # Clean build files
```

**Development:**
```bash
make dev                # Run MCP server
make dev-cli            # Run CLI
make link-cli           # Global CLI access (same as install)
```

**Setup:**
```bash
make quickstart         # First time setup
make rebuild            # Rebuild from scratch
make clean-all          # Complete clean
```

For detailed documentation on hooks, see [CLI_HOOKS.md](CLI_HOOKS.md).

For automatic workflow information, see [AUTOMATIC_WORKFLOW.md](AUTOMATIC_WORKFLOW.md).
