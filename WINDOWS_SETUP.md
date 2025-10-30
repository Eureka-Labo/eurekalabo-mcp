# Windows Setup Guide

Complete installation guide for Windows users.

## Prerequisites

- **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
- **npm** - Comes with Node.js
- **Git for Windows** - Download from [git-scm.com](https://git-scm.com/)
- **PowerShell 5.1+** - Built into Windows 10/11

## Quick Start (PowerShell)

### Option 1: Using PowerShell Script (Recommended)

```powershell
# 1. Clone repository
git clone <repository-url>
cd mcp-server

# 2. Run quick start
.\make.ps1 quickstart
```

This will:
- Install all dependencies
- Build MCP server and CLI
- Install work session hooks
- Set up everything automatically

### Option 2: Using npm Scripts (Easiest)

All-in-one installation - works on all platforms:

```powershell
# 1. Clone repository
git clone <repository-url>
cd mcp-server

# 2. One command does everything
npm run setup:all
```

**What it does:**
1. Installs all dependencies (MCP server + CLI)
2. Builds both MCP server and CLI
3. Installs CLI globally (`eurekaclaude` command)
4. Installs work session hooks (guidance mode)
5. Installs all skills

**Available npm scripts:**
```powershell
npm run setup:all          # Complete setup (recommended)
npm run setup:deps         # Install dependencies only
npm run setup:build        # Build MCP server and CLI
npm run setup:cli          # Install CLI globally
npm run setup:hooks        # Install hooks (guidance mode)
npm run setup:hooks:strict # Install hooks (strict mode)
npm run setup:skills       # Install all skills
```

**Or step by step:**
```powershell
npm run setup:deps     # 1. Install dependencies
npm run setup:build    # 2. Build everything
npm run setup:cli      # 3. Install CLI globally
npm run setup:hooks    # 4. Install hooks
npm run setup:skills   # 5. Install skills
```

## PowerShell Script Usage

The `make.ps1` script provides all Makefile functionality for Windows.

### First Time Setup

```powershell
# Show all available commands
.\make.ps1 help

# Install dependencies
.\make.ps1 install-deps

# Build everything
.\make.ps1 build

# Install CLI globally
.\make.ps1 install

# Install hooks (guidance mode - recommended)
.\make.ps1 hooks-install
```

### Common Commands

```powershell
# Build Commands
.\make.ps1 build           # Build both MCP server and CLI
.\make.ps1 build-mcp       # Build MCP server only
.\make.ps1 build-cli       # Build CLI only

# Installation
.\make.ps1 install         # Install CLI globally
.\make.ps1 uninstall       # Uninstall CLI globally

# Hook Management
.\make.ps1 hooks-install   # Install hooks (guidance mode)
.\make.ps1 hooks-strict    # Install hooks (strict mode)
.\make.ps1 hooks-status    # Check hook status
.\make.ps1 hooks-uninstall # Remove hooks

# Development
.\make.ps1 dev             # Run MCP server in dev mode
.\make.ps1 dev-cli         # Run CLI in dev mode

# Utilities
.\make.ps1 status          # Show system status
.\make.ps1 clean           # Clean build artifacts
.\make.ps1 clean-all       # Clean everything including node_modules
.\make.ps1 rebuild         # Clean and rebuild
```

## PowerShell Execution Policy

If you get an error like "cannot be loaded because running scripts is disabled":

```powershell
# Check current policy
Get-ExecutionPolicy

# Set policy for current user (recommended)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or for current session only
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

## Installing CLI Globally

### Using PowerShell Script (Recommended)

The PowerShell script automatically checks PATH configuration:

```powershell
.\make.ps1 install
```

**What it does:**
1. Builds the CLI
2. Runs `npm link` to install globally
3. **Checks if npm global directory is in PATH**
4. **Provides copy-paste commands if PATH setup needed**
5. Tests if `eurekaclaude` command works

**Example output if PATH needs configuration:**
```
✅ Installation complete!
⚠️  npm global directory not found in PATH!

To use 'eurekaclaude' command, add npm global directory to PATH:
  [Environment]::SetEnvironmentVariable('Path', "C:\Users\...\npm;$env:Path", 'User')

After adding to PATH, restart PowerShell/Terminal
```

### Manual Installation

```powershell
cd cli
npm link
```

### PATH Configuration (Important!)

**npm link relies on npm's global directory being in PATH.** By default, Node.js installation adds this, but sometimes it's missing.

#### Check if PATH is configured:

```powershell
# Check npm global directory
npm config get prefix

# Check if it's in PATH
$env:Path -split ';' | Select-String npm
```

#### Add to PATH (if needed):

**Option 1: System-wide (requires Administrator)**

```powershell
# Run PowerShell as Administrator, then:
$npmPath = npm config get prefix
[Environment]::SetEnvironmentVariable(
    "Path",
    "$npmPath;$env:Path",
    "Machine"
)
```

**Option 2: Current user only (no admin needed)**

```powershell
$npmPath = npm config get prefix
[Environment]::SetEnvironmentVariable(
    "Path",
    "$npmPath;" + [Environment]::GetEnvironmentVariable("Path", "User"),
    "User"
)
```

**Option 3: Configure npm to use custom directory**

```powershell
# Create directory for global packages
mkdir "$env:APPDATA\npm-global"

# Configure npm to use it
npm config set prefix "$env:APPDATA\npm-global"

# Add to PATH (user-level, no admin needed)
[Environment]::SetEnvironmentVariable(
    "Path",
    "$env:APPDATA\npm-global;" + [Environment]::GetEnvironmentVariable("Path", "User"),
    "User"
)
```

**After PATH changes:** Restart PowerShell/Terminal for changes to take effect.

### Permission Errors

If you get permission errors during `npm link`:

1. **Run PowerShell as Administrator:**
   - Right-click PowerShell
   - Select "Run as Administrator"
   - Run `.\make.ps1 install` again

2. **Or use Option 3 above** to configure npm with user-level directory

## After Installation

Once installed, use the `eurekaclaude` command from any directory:

```powershell
# Check installation
eurekaclaude --help

# Show status
eurekaclaude status

# Build project
eurekaclaude build

# Manage hooks
eurekaclaude hooks install
eurekaclaude hooks status
```

## Troubleshooting

### "npm link" Permission Errors

**Solution 1: Run as Administrator**
```powershell
# Right-click PowerShell → "Run as Administrator"
.\make.ps1 install
```

**Solution 2: Configure npm global directory** (see above)

### "tsc is not recognized"

TypeScript isn't installed globally:

```powershell
# Install globally (optional)
npm install -g typescript

# Or use project-local build
npm run build
```

### Git Hooks Not Working

Git for Windows automatically handles Unix-style hooks. If issues occur:

1. Check Git installation:
```powershell
git --version
```

2. Verify hook installation:
```powershell
.\make.ps1 hooks-status
```

3. Reinstall hooks:
```powershell
.\make.ps1 hooks-install --force
```

### Node.js Version Issues

Check Node.js version:
```powershell
node --version
```

Requires Node.js 18+. Download latest from [nodejs.org](https://nodejs.org/).

### Build Failures

```powershell
# Clean everything and rebuild
.\make.ps1 clean-all
.\make.ps1 install-deps
.\make.ps1 build
```

### Path Issues

After installing CLI globally, if `eurekaclaude` is not found:

1. Restart PowerShell/Terminal
2. Check npm global directory is in PATH:
```powershell
$env:Path -split ';' | Select-String npm
```

3. Add npm global directory to PATH if missing

## Development Workflow

### Daily Development

```powershell
# Morning: Check status
.\make.ps1 status

# After code changes
.\make.ps1 build

# Check hooks still working
.\make.ps1 hooks-status
```

### After Git Pull

```powershell
# Rebuild everything
.\make.ps1 rebuild

# Reinstall hooks if needed
.\make.ps1 hooks-install
```

### Testing Changes

```powershell
# Make changes to src/
.\make.ps1 build-mcp

# Make changes to cli/src/
.\make.ps1 build-cli

# Test immediately
.\make.ps1 dev
```

## Alternative: Using Make on Windows

If you prefer using the original Makefile:

### Option 1: Chocolatey

```powershell
# Install Chocolatey first (see chocolatey.org)
# Then install make
choco install make

# Use Makefile
make build
make install
```

### Option 2: Scoop

```powershell
# Install Scoop first (see scoop.sh)
# Then install make
scoop install make

# Use Makefile
make build
```

### Option 3: WSL (Windows Subsystem for Linux)

```bash
# In WSL terminal
make build
make install
```

## IDE Integration

### Visual Studio Code

Add to `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Build All",
      "type": "shell",
      "command": ".\\make.ps1 build",
      "group": {
        "kind": "build",
        "isDefault": true
      }
    },
    {
      "label": "Install CLI",
      "type": "shell",
      "command": ".\\make.ps1 install"
    },
    {
      "label": "Status",
      "type": "shell",
      "command": ".\\make.ps1 status"
    }
  ]
}
```

Then use:
- `Ctrl+Shift+B` to build
- `Ctrl+Shift+P` → "Run Task" for other commands

## Environment Configuration

### Setting Environment Variables

```powershell
# Temporary (current session)
$env:EUREKA_API_KEY = "your-api-key"
$env:EUREKA_API_URL = "https://api.example.com"

# Permanent (user-level)
[Environment]::SetEnvironmentVariable("EUREKA_API_KEY", "your-api-key", "User")
[Environment]::SetEnvironmentVariable("EUREKA_API_URL", "https://api.example.com", "User")
```

Or create `.env` file in project root:
```
EUREKA_API_KEY=your-api-key
EUREKA_API_URL=https://api.example.com
```

## Next Steps

1. Configure your API credentials:
   ```powershell
   $env:EUREKA_API_KEY = "your-key"
   ```

2. Restart Claude Code to pick up MCP server

3. Start coding - tasks will be created automatically!

4. Check hook status regularly:
   ```powershell
   .\make.ps1 hooks-status
   ```

## Additional Resources

- [Main README](README.md) - Full documentation
- [CLI Documentation](cli/README.md) - CLI usage guide
- [Makefile Guide](MAKEFILE_GUIDE.md) - Original Unix guide
- [Hook Documentation](CLI_HOOKS.md) - Work session hooks

## Getting Help

If you encounter issues:

1. Check system status:
   ```powershell
   .\make.ps1 status
   ```

2. Verify installation:
   ```powershell
   node --version
   npm --version
   git --version
   ```

3. Review error messages carefully

4. Try clean rebuild:
   ```powershell
   .\make.ps1 clean-all
   .\make.ps1 quickstart
   ```

## Summary

**Quick Setup:**
```powershell
# One command setup
.\make.ps1 quickstart

# Or step by step
.\make.ps1 install-deps
.\make.ps1 build
.\make.ps1 install
.\make.ps1 hooks-install
```

**Daily Use:**
```powershell
eurekaclaude status
eurekaclaude hooks status
eurekaclaude build
```

**Common Tasks:**
```powershell
.\make.ps1 status       # Check everything
.\make.ps1 rebuild      # Full rebuild
.\make.ps1 clean        # Clean builds
```
