# Claude Code Hooks & Skills Setup

Automated setup script to configure Claude Code with best-practice hooks and skills.

## Quick Start

### Linux/macOS

#### Download and Run

```bash
# Option 1: Download and run directly
curl -O https://raw.githubusercontent.com/your-repo/setup-claude-hooks-skills.sh
chmod +x setup-claude-hooks-skills.sh
./setup-claude-hooks-skills.sh
```

#### Or Copy to Your Project

```bash
# Option 2: Copy the script to your project
cp setup-claude-hooks-skills.sh /path/to/your/project/
cd /path/to/your/project/
./setup-claude-hooks-skills.sh
```

### Windows

#### Using PowerShell

```powershell
# Option 1: Download and run with PowerShell
Invoke-WebRequest -Uri https://raw.githubusercontent.com/your-repo/setup-claude-hooks-skills.ps1 -OutFile setup-claude-hooks-skills.ps1
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\setup-claude-hooks-skills.ps1
```

#### Or Copy to Your Project

```powershell
# Option 2: Copy the PowerShell script to your project
Copy-Item setup-claude-hooks-skills.ps1 C:\path\to\your\project\
cd C:\path\to\your\project\
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\setup-claude-hooks-skills.ps1
```

**Requirements for Windows:**
- Git for Windows (includes Git Bash) - Download from https://git-scm.com/download/win
- Hooks are bash scripts that run via Git Bash
- PowerShell 5.1 or later for running the setup script

## What This Script Does

The script creates a complete `.claude/` directory structure with:

### 📁 Directory Structure

```
.claude/
├── hooks/              # Automated event handlers
│   ├── pre-edit.sh    # Runs before file edits
│   ├── post-edit.sh   # Runs after file edits
│   ├── pre-commit.sh  # Runs before git commits
│   ├── post-commit.sh # Runs after git commits
│   └── user-prompt-submit.sh  # Runs when user submits prompts
├── skills/            # Reusable workflows
│   ├── code-review/   # Comprehensive code analysis
│   ├── api-design/    # RESTful API design guide
│   └── perf-optimize/ # Performance optimization workflow
└── README.md          # Documentation
```

### 🎣 Hooks Installed

1. **pre-edit.sh**: Safety checks before editing files
   - Blocks production config edits
   - Warns about lock file modifications

2. **post-edit.sh**: Automatic quality improvements
   - Auto-formats with Prettier
   - Runs TypeScript type checking

3. **pre-commit.sh**: Quality gates before commits
   - Runs tests automatically
   - Detects debugging code (console.log, debugger)
   - Prevents secret commits

4. **post-commit.sh**: Post-commit actions
   - Displays commit summary
   - Integrates with Eureka Tasks

5. **user-prompt-submit.sh**: Smart suggestions
   - Detects infrastructure operations
   - Warns about production changes
   - Suggests analysis flags

### 🎨 Skills Installed

1. **code-review**: Comprehensive code review
   - Quality analysis (SOLID, DRY, naming)
   - Security checks (XSS, SQL injection, secrets)
   - Performance analysis (Big O, optimization)
   - Testing and documentation review

2. **api-design**: RESTful API design guidance
   - Resource naming conventions
   - HTTP method best practices
   - Status code standards
   - Response format templates

3. **perf-optimize**: Performance optimization workflow
   - Baseline measurement
   - Bottleneck identification
   - Optimization strategies
   - Validation metrics

## Usage

### Running the Setup

**Linux/macOS:**
```bash
# Navigate to your project directory
cd /path/to/your/project

# Run the setup script
./setup-claude-hooks-skills.sh
```

**Windows (PowerShell):**
```powershell
# Navigate to your project directory
cd C:\path\to\your\project

# Run the setup script
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\setup-claude-hooks-skills.ps1
```

### If .claude/ Already Exists

The script will:
1. Detect existing `.claude/` directory
2. Prompt for confirmation
3. Create a timestamped backup (`.claude.backup.TIMESTAMP`)
4. Proceed with installation

### Testing Your Installation

**Linux/macOS:**
```bash
# Test a hook
.claude/hooks/pre-edit.sh "src/test.ts"

# Test pre-commit hook
.claude/hooks/pre-commit.sh

# Test user prompt detection
.claude/hooks/user-prompt-submit.sh "configure nginx"
```

**Windows (Git Bash):**
```bash
# Open Git Bash in your project directory, then:

# Test a hook
.claude/hooks/pre-edit.sh "src/test.ts"

# Test pre-commit hook
.claude/hooks/pre-commit.sh

# Test user prompt detection
.claude/hooks/user-prompt-submit.sh "configure nginx"
```

### Using Skills in Claude Code

Once installed, invoke skills in Claude Code:

```
/code-review
/api-design
/perf-optimize
```

## Customization

### Modifying Hooks

Edit hook scripts in `.claude/hooks/`:

```bash
# Edit pre-commit hook to customize test behavior
vim .claude/hooks/pre-commit.sh

# Make changes, then test
.claude/hooks/pre-commit.sh
```

### Adding New Skills

Create a new skill directory:

```bash
mkdir -p .claude/skills/my-skill
cat > .claude/skills/my-skill/skill.md << 'EOF'
---
name: my-skill
description: Description of what this skill does
category: custom
---

# My Custom Skill

[Skill content here]
EOF
```

Then invoke with `/my-skill` in Claude Code.

### Disabling Hooks

```bash
# Temporarily disable a hook by renaming it
mv .claude/hooks/pre-commit.sh .claude/hooks/pre-commit.sh.disabled

# Re-enable later
mv .claude/hooks/pre-commit.sh.disabled .claude/hooks/pre-commit.sh
```

## Requirements

### Optional Dependencies

Hooks work best with these tools installed:

- **prettier**: Auto-formatting (post-edit hook)
- **tsc**: TypeScript checking (post-edit hook)
- **npm**: Test running (pre-commit hook)
- **eurekaclaude**: Task tracking (post-commit hook)

If these tools aren't installed, the relevant hook features will be skipped gracefully.

## Integration with Eureka Tasks

If you have Eureka Tasks MCP server configured:

The **post-commit.sh** hook automatically logs commits to your active work session, providing seamless integration between git commits and task tracking.

## Troubleshooting

### Hooks Not Running

**Linux/macOS:**
```bash
# Ensure hooks are executable
chmod +x .claude/hooks/*.sh

# Check for errors in hook output
.claude/hooks/pre-commit.sh
```

**Windows:**
```bash
# Hooks should work in Git Bash automatically
# If not, ensure Git for Windows is installed:
# https://git-scm.com/download/win

# Test in Git Bash:
bash .claude/hooks/pre-commit.sh
```

### Skills Not Found

```bash
# Verify skill.md exists
ls .claude/skills/*/skill.md

# Check YAML frontmatter format
head -5 .claude/skills/code-review/skill.md
```

**Windows (PowerShell):**
```powershell
# Verify skill.md exists
Get-ChildItem -Path .claude\skills\*\skill.md

# Check YAML frontmatter format
Get-Content .claude\skills\code-review\skill.md -Head 5
```

### Script Permission Denied

**Linux/macOS:**
```bash
# Make script executable
chmod +x setup-claude-hooks-skills.sh
```

**Windows:**
```powershell
# If PowerShell blocks execution:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Then run the script
.\setup-claude-hooks-skills.ps1
```

### Git Bash Not Found (Windows)

If hooks aren't working on Windows:

1. **Install Git for Windows**: https://git-scm.com/download/win
2. **Verify installation**:
   ```bash
   # Open Git Bash and check version
   git --version
   bash --version
   ```
3. **Set Git Bash as default** for hook execution in Claude Code settings

## Examples

### Example: Pre-Commit Hook in Action

```bash
$ git commit -m "Add feature"

✅ Tests passed
⚠️ WARNING: Found debugging code or TODOs in commit
Consider removing before committing

[main abc123] Add feature
```

### Example: User Prompt Hook Detection

When you type in Claude Code:
```
"configure nginx reverse proxy"
```

Hook output:
```
🔍 INFRASTRUCTURE DETECTED: Consulting official documentation required
🚨 REMINDER: All configuration changes must be validated against official docs
```

### Example: Code Review Skill

In Claude Code:
```
/code-review
```

Output:
```
## Code Review Summary

### 🟢 Strengths
- Clean separation of concerns
- Comprehensive error handling

### 🟡 Improvements Needed
- Consider extracting complex function (auth.js:45)
- Add JSDoc comments for public API

### 🔴 Critical Issues
- Potential SQL injection in query builder

### 📊 Metrics
- Complexity: 8/10 (good)
- Test Coverage: 85%
- Security Score: 7/10 (needs attention)
```

## Uninstallation

To remove the Claude Code configuration:

```bash
# Remove the entire .claude directory
rm -rf .claude/

# Or just remove specific components
rm -rf .claude/hooks/
rm -rf .claude/skills/
```

## Contributing

To improve these hooks and skills:

1. Modify the setup script: `setup-claude-hooks-skills.sh`
2. Test in a clean directory
3. Share improvements with the community

## License

This setup script and included hooks/skills are provided as-is for use with Claude Code.

## Support

For issues or questions:
- Check `.claude/README.md` for documentation
- Review hook scripts for customization options
- Test hooks individually to debug issues
