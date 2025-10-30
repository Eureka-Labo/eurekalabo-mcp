# Sub-Agent Setup Guide

Complete guide to setting up and configuring sub-agent tools with eurekaclaude CLI.

## Quick Start

```bash
# 1. Configure sub-agent permissions (one-time setup)
eurekaclaude subagents configure

# 2. Restart Claude Desktop

# 3. Start using sub-agent commands
eurekaclaude commit
eurekaclaude pr
eurekaclaude validate
eurekaclaude setup smart
```

---

## Configuration Command

### `eurekaclaude subagents configure`

**Purpose**: Automatically configure Claude Code permissions for sub-agent tools

**What it does**:
1. Creates `.claude/settings.local.json` if it doesn't exist
2. Adds permissions for all 4 sub-agent MCP tools
3. Ensures eureka-tasks MCP server is enabled
4. Updates existing configuration safely (preserves other settings)

### Usage

```bash
# Basic configuration
eurekaclaude subagents configure

# Force reconfiguration
eurekaclaude subagents configure --force

# Configure specific project
eurekaclaude subagents configure --workspace /path/to/project
```

### Example Output

```
⚙️  Sub-Agent Configuration Setup

✅ Loaded existing settings

📊 Current Status:

✅ Already configured: 0 tools
➕ To be added: 4 tools

Will add:
  + mcp__eureka-tasks__generate_smart_commit_message
  + mcp__eureka-tasks__generate_smart_pr_description
  + mcp__eureka-tasks__validate_setup
  + mcp__eureka-tasks__generate_smart_setup

? Add 4 sub-agent tool permissions? Yes

✅ Sub-Agent Configuration Complete!

📋 Configured Tools:

  ✓ mcp__eureka-tasks__generate_smart_commit_message
  ✓ mcp__eureka-tasks__generate_smart_pr_description
  ✓ mcp__eureka-tasks__validate_setup
  ✓ mcp__eureka-tasks__generate_smart_setup

🚀 Next Steps:

1. Restart Claude Desktop to apply changes
2. Use sub-agent commands:
   eurekaclaude commit
   eurekaclaude pr
   eurekaclaude validate
   eurekaclaude setup smart

💡 Tip: Run these commands to get instructions for Claude Code
```

---

## What Gets Configured

### Permissions Added

The command adds these permissions to `.claude/settings.local.json`:

```json
{
  "permissions": {
    "allow": [
      "mcp__eureka-tasks__generate_smart_commit_message",
      "mcp__eureka-tasks__generate_smart_pr_description",
      "mcp__eureka-tasks__validate_setup",
      "mcp__eureka-tasks__generate_smart_setup"
    ]
  }
}
```

### MCP Server Enabled

Ensures `eureka-tasks` MCP server is enabled:

```json
{
  "enabledMcpjsonServers": [
    "eureka-tasks"
  ],
  "disabledMcpjsonServers": []
}
```

Or if you have:

```json
{
  "enableAllProjectMcpServers": true
}
```

Then it doesn't need to explicitly enable individual servers.

---

## Complete Setup Workflow

### Step 1: Install EurekaClaude

```bash
# Clone repository
git clone https://github.com/eurekalabo/eurekaclaude.git
cd eurekaclaude/mcp-server

# Quick setup
make quickstart

# Or manual
npm install
npm run build
cd cli
npm run build
npm link  # Makes eurekaclaude command available globally
```

### Step 2: Configure MCP Server

Add to `~/.config/Claude/claude_desktop_config.json` (or equivalent):

```json
{
  "mcpServers": {
    "eureka-tasks": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "EUREKA_API_KEY": "your-api-key-here",
        "EUREKA_API_URL": "https://api.eurekalabo.com",
        "EUREKA_WORKSPACE_PATH": "/path/to/your/project"
      }
    }
  }
}
```

### Step 3: Configure Sub-Agents

```bash
# Navigate to your project
cd /path/to/your/project

# Run configuration
eurekaclaude subagents configure

# Confirms with you before making changes
? Add 4 sub-agent tool permissions? Yes

✅ Configuration complete!
```

### Step 4: Restart Claude Desktop

```bash
# macOS
killall "Claude Desktop"
open -a "Claude Desktop"

# Or just quit and reopen manually
```

### Step 5: Verify Setup

```bash
# Test a command
eurekaclaude validate

# Should show:
# - Quick validation results
# - Instructions for Claude Code
# - No errors
```

---

## Troubleshooting

### Command Not Found: eurekaclaude

**Problem**: CLI not installed globally

**Solution**:
```bash
cd /path/to/mcp-server/cli
npm link

# Or use directly
npm exec eurekaclaude -- subagents configure
```

### Permission Denied Creating .claude Directory

**Problem**: No write permissions

**Solution**:
```bash
# Check permissions
ls -la .

# Fix if needed
chmod 755 .

# Or run with sudo (not recommended)
sudo eurekaclaude subagents configure
```

### Configuration Not Applied

**Problem**: Claude Desktop not restarted

**Solution**:
```bash
# Completely quit Claude Desktop
killall "Claude Desktop"

# Wait a few seconds

# Reopen
open -a "Claude Desktop"
```

### MCP Tool Not Found

**Problem**: eureka-tasks MCP server not configured

**Solution**:

1. Check MCP server configuration:
```bash
cat ~/.config/Claude/claude_desktop_config.json
```

2. Ensure `eureka-tasks` server is defined

3. Check server is running:
```bash
# In Claude Code, try:
await mcp__eureka-tasks__list_tasks()
```

4. If not working, reconfigure MCP server first, then run:
```bash
eurekaclaude subagents configure
```

### Tools Already Configured

**Output**: "All sub-agent tools already configured!"

**Meaning**: Configuration already complete

**To reconfigure**:
```bash
eurekaclaude subagents configure --force
```

---

## Advanced Configuration

### Custom Workspace

Configure sub-agents for a specific project:

```bash
# From anywhere
eurekaclaude subagents configure --workspace /path/to/project

# Creates/updates /path/to/project/.claude/settings.local.json
```

### Multiple Projects

Each project can have its own configuration:

```bash
# Project 1
cd ~/projects/project1
eurekaclaude subagents configure

# Project 2
cd ~/projects/project2
eurekaclaude subagents configure

# Each has independent .claude/settings.local.json
```

### Manual Configuration

If you prefer to configure manually:

**File**: `.claude/settings.local.json`

```json
{
  "permissions": {
    "allow": [
      "mcp__eureka-tasks__generate_smart_commit_message",
      "mcp__eureka-tasks__generate_smart_pr_description",
      "mcp__eureka-tasks__validate_setup",
      "mcp__eureka-tasks__generate_smart_setup"
    ]
  },
  "enableAllProjectMcpServers": true
}
```

---

## Verification

### Check Configuration

```bash
# View current configuration
cat .claude/settings.local.json

# Should see sub-agent tool permissions
```

### Test Sub-Agent Tools

```bash
# Test each command
eurekaclaude commit     # Requires staged changes
eurekaclaude pr         # Requires feature branch
eurekaclaude validate   # Works anywhere
eurekaclaude setup smart # Works anywhere
```

### Test in Claude Code

After configuration, in Claude Code:

```typescript
// Should work without permission prompts
await mcp__eureka-tasks__generate_smart_commit_message({ gitDiff: "..." });
await mcp__eureka-tasks__generate_smart_pr_description({ ... });
await mcp__eureka-tasks__validate_setup();
await mcp__eureka-tasks__generate_smart_setup();
```

---

## Security Notes

### What Permissions Allow

These permissions allow Claude Code to:
- Call MCP tools that return sub-agent invocation instructions
- The tools themselves just return text/instructions
- No direct file system access
- No direct git operations

### Safe to Grant

✅ These permissions are safe because:
1. Tools only return instructions for Claude to execute
2. Claude still needs your approval for actual operations
3. No automated commits or changes
4. Read-only analysis of local files

### Revoke Permissions

To remove sub-agent permissions:

**Option 1**: Manual edit
```bash
# Edit .claude/settings.local.json
# Remove the 4 sub-agent tool entries
```

**Option 2**: Delete and reconfigure
```bash
# Remove configuration
rm .claude/settings.local.json

# Restart Claude Desktop

# Reconfigure with only what you need
```

---

## Next Steps

After configuration:

1. **Try it out**: Run `eurekaclaude commit` after making some changes
2. **Read guides**: Check [CLI_SUBAGENT_GUIDE.md](./CLI_SUBAGENT_GUIDE.md) for detailed usage
3. **See examples**: Review [SUBAGENT_EXAMPLES.md](./SUBAGENT_EXAMPLES.md) for workflows
4. **Integrate**: Add to your daily development workflow

---

## Summary

```bash
# One-time setup (per project)
eurekaclaude subagents configure

# Restart Claude Desktop
killall "Claude Desktop"
open -a "Claude Desktop"

# Start using sub-agents
eurekaclaude commit
eurekaclaude pr
eurekaclaude validate
eurekaclaude setup smart

# All commands output instructions for Claude Code
# Copy/paste to Claude Code
# Claude automatically launches appropriate sub-agent
# Get professional AI-generated results
```

**Time to setup**: 2 minutes
**Configuration**: Automatic
**Value**: Unlocks AI-powered commit messages, PR descriptions, validation, and setup

Start now with: `eurekaclaude subagents configure` 🚀
