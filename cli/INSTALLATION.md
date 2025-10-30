# Eureka Claude CLI Installation Guide

## Overview

The `eurekaclaude` CLI provides automated installation and management of the Eureka Tasks work session enforcement hooks for Claude Code.

## Installation Methods

### Method 1: Global Installation (Recommended for Published Package)

```bash
# Install globally from npm
npm install -g eurekaclaude

# Or use npx (no installation required)
npx eurekaclaude hooks install
```

### Method 2: Local Development Installation

```bash
# Clone the repository
git clone https://github.com/eurekalabo/eurekaclaude.git
cd eurekaclaude/mcp-server

# Install dependencies and build
npm install
npm run build
cd cli
npm install
npm run build

# Link globally for development
npm link

# Now you can use the CLI
eurekaclaude hooks install
```

## Hook Installation Process

When you run `eurekaclaude hooks install`, the CLI:

1. **Creates hook script**: Copies the work session enforcement hook to your project's `.claude/hooks/check-work-session.cjs`
2. **Configures Claude Code**: Updates `.claude/settings.local.json` with the hook configuration
3. **Updates .gitignore**: Adds `.eureka-active-session` marker to gitignore
4. **Creates documentation**: Adds README in `.claude/hooks/` directory

### Why `.cjs` Extension?

The hook script uses CommonJS modules (`require()`), and modern Node.js requires the `.cjs` extension to correctly identify CommonJS modules in projects that may have `"type": "module"` in their `package.json`.

## Usage

### Install Hook

```bash
# Interactive installation (recommended)
eurekaclaude hooks install

# Non-interactive with defaults
eurekaclaude hooks install --mode guidance

# Force overwrite existing hook
eurekaclaude hooks install --force
```

### Check Hook Status

```bash
eurekaclaude hooks status
```

Shows:
- Hook script installation status
- Hook configuration status
- Active work session status

### Uninstall Hook

```bash
eurekaclaude hooks uninstall
```

Removes hook configuration from settings but keeps the script file for reference.

## Hook Modes

### Guidance Mode (Recommended)

- **Permission**: `ask`
- **Behavior**: Prompts to create tasks but allows bypass
- **Best for**: Teams transitioning to Eureka Tasks workflow

### Strict Mode

- **Permission**: `deny`
- **Behavior**: Blocks Write/Edit operations without active session
- **Best for**: Teams requiring hard enforcement

## Troubleshooting

### Hook Not Firing?

1. **Check executable permissions**:
   ```bash
   chmod +x .claude/hooks/check-work-session.cjs
   ```

2. **Verify configuration**:
   ```bash
   cat .claude/settings.local.json | grep -A 10 "hooks"
   ```

3. **Check Node.js version**:
   ```bash
   node --version  # Should be >= 18
   ```

### Module Loading Errors?

If you see `ERR_REQUIRE_ESM` or similar errors:
- The CLI automatically uses `.cjs` extension to avoid module system conflicts
- Ensure you're using the latest version: `npm update -g eurekaclaude`

### Hook Path Issues?

The CLI installs the hook **into your project directory**, not from the CLI installation directory. This ensures:
- ✅ Works with global CLI installation
- ✅ Works with npx usage
- ✅ Works when CLI is updated
- ✅ Project-specific customization possible

## Directory Structure After Installation

```
your-project/
├── .claude/
│   ├── hooks/
│   │   ├── check-work-session.cjs  ← Hook script (executable)
│   │   └── README.md                ← Hook documentation
│   └── settings.local.json          ← Hook configuration
├── .eureka-active-session           ← Session marker (when active)
└── .gitignore                       ← Updated to exclude marker
```

## Integration with Claude Code

Once installed, the hook automatically:

1. **Intercepts Write/Edit operations**
2. **Checks for active work session**
3. **Prompts automatic workflow**:
   - Search existing tasks
   - Create task if needed
   - Start work session
   - Allow operation
4. **Tracks session context**

## Advanced Configuration

### Custom Hook Path

The CLI uses absolute paths in the configuration, so the hook works from any location:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "/absolute/path/to/your-project/.claude/hooks/check-work-session.cjs",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

### Customizing Hook Behavior

You can edit `.claude/hooks/check-work-session.cjs` to customize:
- Enforcement mode (ask vs deny)
- Guidance messages
- Session marker location
- Hook timeout

## Development

### Building the CLI

```bash
cd cli
npm run build
```

### Testing Hook Installation

```bash
# Install to test project
eurekaclaude hooks install --workspace /path/to/test/project

# Check status
eurekaclaude hooks status --workspace /path/to/test/project

# Uninstall
eurekaclaude hooks uninstall --workspace /path/to/test/project
```

## FAQ

**Q: Do I need to install the hook in every project?**
A: Yes, the hook is project-specific. Run `eurekaclaude hooks install` in each project where you want work session enforcement.

**Q: Can I use this with npx?**
A: Yes! `npx eurekaclaude hooks install` works without global installation.

**Q: What if I update the CLI?**
A: The hook script is copied to your project, so CLI updates won't affect existing installations. Re-run `eurekaclaude hooks install --force` to update the hook.

**Q: Can I modify the hook script?**
A: Yes! The script is in your project directory. You can customize it as needed.

**Q: Does this work on Windows?**
A: Yes, Node.js handles the shebang (`#!/usr/bin/env node`) on all platforms.

## Support

- GitHub Issues: https://github.com/eurekalabo/eurekaclaude/issues
- Documentation: See `.claude/hooks/README.md` after installation
