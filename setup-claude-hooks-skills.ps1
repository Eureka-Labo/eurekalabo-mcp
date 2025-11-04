# Claude Code Hooks & Skills Setup Script (Windows PowerShell)
# This script sets up the .claude directory with hooks and skills

$ErrorActionPreference = "Stop"

$CLAUDE_DIR = ".claude"
$HOOKS_DIR = "$CLAUDE_DIR\hooks"
$SKILLS_DIR = "$CLAUDE_DIR\skills"

Write-Host "🚀 Claude Code Hooks & Skills Setup (Windows)" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in root directory
if ($PWD.Path -match '^[A-Z]:\\$') {
    Write-Host "❌ Error: Do not run this in root directory" -ForegroundColor Red
    Write-Host "   Navigate to your project directory first" -ForegroundColor Red
    exit 1
}

# Check if .claude already exists
if (Test-Path $CLAUDE_DIR) {
    Write-Host "⚠️  .claude directory already exists" -ForegroundColor Yellow
    $response = Read-Host "   Continue and overwrite existing files? (y/N)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-Host "❌ Setup cancelled" -ForegroundColor Red
        exit 0
    }
    $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $backupDir = "$CLAUDE_DIR.backup.$timestamp"
    Write-Host "📦 Backing up existing .claude to $backupDir" -ForegroundColor Yellow
    Copy-Item -Recurse $CLAUDE_DIR $backupDir
}

# Create directory structure
Write-Host "📁 Creating directory structure..." -ForegroundColor Green
New-Item -ItemType Directory -Force -Path $HOOKS_DIR | Out-Null
New-Item -ItemType Directory -Force -Path "$SKILLS_DIR\code-review" | Out-Null
New-Item -ItemType Directory -Force -Path "$SKILLS_DIR\api-design" | Out-Null
New-Item -ItemType Directory -Force -Path "$SKILLS_DIR\perf-optimize" | Out-Null

# ============================================================================
# CREATE HOOKS (Bash versions for Git Bash compatibility)
# ============================================================================

Write-Host "🎣 Creating hooks..." -ForegroundColor Green

# Pre-Edit Hook
@'
#!/bin/bash
# Pre-edit hook - runs before any file edit

FILE_PATH="$1"

# Prevent editing production config files
if [[ "$FILE_PATH" == *"production.config"* ]]; then
    echo "❌ BLOCKED: Cannot edit production config files"
    exit 1
fi

# Warn about editing lock files
if [[ "$FILE_PATH" == *"package-lock.json"* ]] || [[ "$FILE_PATH" == *"yarn.lock"* ]]; then
    echo "⚠️ WARNING: Editing lock file - ensure this is intentional"
fi

exit 0
'@ | Out-File -FilePath "$HOOKS_DIR\pre-edit.sh" -Encoding UTF8 -NoNewline

# Post-Edit Hook
@'
#!/bin/bash
# Post-edit hook - runs after file edits

FILE_PATH="$1"

# Auto-format TypeScript/JavaScript files
if [[ "$FILE_PATH" == *.ts ]] || [[ "$FILE_PATH" == *.tsx ]] || [[ "$FILE_PATH" == *.js ]]; then
    if command -v prettier &> /dev/null; then
        prettier --write "$FILE_PATH" 2>/dev/null
        echo "✅ Formatted: $FILE_PATH"
    fi
fi

# Run type check for TypeScript files
if [[ "$FILE_PATH" == *.ts ]] || [[ "$FILE_PATH" == *.tsx ]]; then
    if command -v tsc &> /dev/null; then
        tsc --noEmit --skipLibCheck 2>&1 | head -20
    fi
fi

exit 0
'@ | Out-File -FilePath "$HOOKS_DIR\post-edit.sh" -Encoding UTF8 -NoNewline

# Pre-Commit Hook
@'
#!/bin/bash
# Pre-commit hook - runs before git commits

# Run tests before commit
if [ -f "package.json" ]; then
    if npm run test --if-present 2>/dev/null; then
        echo "✅ Tests passed"
    else
        echo "❌ BLOCKED: Tests failed - fix before committing"
        exit 1
    fi
fi

# Check for debugging code
if git diff --cached | grep -E "console\.log|debugger|TODO:|FIXME:" > /dev/null; then
    echo "⚠️ WARNING: Found debugging code or TODOs in commit"
    echo "Consider removing before committing"
fi

# Prevent commits with secrets
if git diff --cached | grep -iE "(api_key|password|secret|token).*=.*['\"].*['\"]" > /dev/null; then
    echo "❌ BLOCKED: Potential secrets detected in commit"
    exit 1
fi

exit 0
'@ | Out-File -FilePath "$HOOKS_DIR\pre-commit.sh" -Encoding UTF8 -NoNewline

# Post-Commit Hook
@'
#!/bin/bash
# Post-commit hook - runs after successful commits

COMMIT_MSG=$(git log -1 --pretty=%B)
COMMIT_HASH=$(git rev-parse --short HEAD)

echo "✅ Commit successful: $COMMIT_HASH"
echo "📝 Message: $COMMIT_MSG"

# Update task tracking if using Eureka Tasks
if command -v eurekaclaude &> /dev/null; then
    # Log commit to current task if in work session
    eurekaclaude tasks log-commit "$COMMIT_HASH" 2>/dev/null || true
fi

exit 0
'@ | Out-File -FilePath "$HOOKS_DIR\post-commit.sh" -Encoding UTF8 -NoNewline

# User Prompt Submit Hook
@'
#!/bin/bash
# User prompt submit hook - runs when user submits a prompt

USER_PROMPT="$1"

# Detect infrastructure configuration changes
if echo "$USER_PROMPT" | grep -iE "(traefik|nginx|apache|docker|kubernetes)" > /dev/null; then
    echo "🔍 INFRASTRUCTURE DETECTED: Consulting official documentation required"
    echo "🚨 REMINDER: All configuration changes must be validated against official docs"
fi

# Detect production operations
if echo "$USER_PROMPT" | grep -iE "(production|prod|deploy|release)" > /dev/null; then
    echo "⚠️ PRODUCTION OPERATION: Extra validation required"
    echo "🛡️ Remember to run --validate flag"
fi

# Suggest flags for complex operations
if echo "$USER_PROMPT" | grep -iE "(analyze|investigate|debug|complex)" > /dev/null; then
    echo "💡 SUGGESTION: Consider using --think or --ultrathink for deep analysis"
fi

exit 0
'@ | Out-File -FilePath "$HOOKS_DIR\user-prompt-submit.sh" -Encoding UTF8 -NoNewline

Write-Host "   ✅ Created 5 hooks (Git Bash compatible)" -ForegroundColor Green

# ============================================================================
# CREATE SKILLS
# ============================================================================

Write-Host "🎨 Creating skills..." -ForegroundColor Green

# Code Review Skill
@'
---
name: code-review
description: Comprehensive code review with quality, security, and performance analysis
category: quality
---

# Code Review Skill

When this skill is activated, perform a comprehensive code review:

## Review Checklist

### 1. Code Quality
- [ ] SOLID principles adherence
- [ ] DRY violations check
- [ ] Naming conventions consistency
- [ ] Function complexity (cyclomatic complexity < 10)
- [ ] Code duplication detection

### 2. Security
- [ ] Input validation
- [ ] SQL injection vulnerabilities
- [ ] XSS vulnerabilities
- [ ] Authentication/authorization issues
- [ ] Secrets in code

### 3. Performance
- [ ] Algorithm complexity (Big O)
- [ ] Database query optimization
- [ ] Memory leak potential
- [ ] Unnecessary re-renders (React)
- [ ] Bundle size impact

### 4. Testing
- [ ] Test coverage gaps
- [ ] Edge cases handling
- [ ] Error handling completeness
- [ ] Mock/stub appropriateness

### 5. Documentation
- [ ] Function documentation
- [ ] Complex logic comments
- [ ] API documentation
- [ ] README updates needed

## Output Format

```
## Code Review Summary

### 🟢 Strengths
- [List positive aspects]

### 🟡 Improvements Needed
- [List non-critical issues]

### 🔴 Critical Issues
- [List must-fix issues]

### 📊 Metrics
- Complexity: [score]
- Test Coverage: [percentage]
- Security Score: [score]

### 🎯 Recommendations
1. [Priority 1 recommendation]
2. [Priority 2 recommendation]
```
'@ | Out-File -FilePath "$SKILLS_DIR\code-review\skill.md" -Encoding UTF8

# API Design Skill
@'
---
name: api-design
description: RESTful API design with best practices and OpenAPI specification
category: architecture
---

# API Design Skill

Design RESTful APIs following industry best practices.

## Design Principles

### 1. Resource Naming
- Use nouns, not verbs: `/users`, not `/getUsers`
- Plural for collections: `/users`, `/orders`
- Hierarchical relationships: `/users/{id}/orders`
- Lowercase with hyphens: `/user-profiles`

### 2. HTTP Methods
- GET: Retrieve resources (idempotent)
- POST: Create new resources
- PUT: Full update (idempotent)
- PATCH: Partial update
- DELETE: Remove resources (idempotent)

### 3. Status Codes
- 200: Success (GET, PUT, PATCH)
- 201: Created (POST)
- 204: No Content (DELETE)
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

### 4. Response Format
```json
{
  "data": {},
  "meta": {
    "page": 1,
    "total": 100
  },
  "errors": []
}
```

### 5. Versioning
- URL versioning: `/v1/users`
- Header versioning: `Accept: application/vnd.api+json; version=1`

## Deliverables

1. **OpenAPI Specification** (swagger.yaml)
2. **Endpoint Documentation**
3. **Authentication Strategy**
4. **Rate Limiting Design**
5. **Error Response Standards**
'@ | Out-File -FilePath "$SKILLS_DIR\api-design\skill.md" -Encoding UTF8

# Performance Optimization Skill
@'
---
name: perf-optimize
description: Systematic performance optimization with measurement and validation
category: performance
---

# Performance Optimization Skill

Measure → Analyze → Optimize → Validate

## Optimization Process

### 1. Baseline Measurement
```bash
# Capture current performance metrics
npm run benchmark
lighthouse --output json --output-path=./baseline.json
```

### 2. Identify Bottlenecks
- Profile with Chrome DevTools
- Analyze bundle size
- Check database query performance
- Review network waterfall
- Measure Time to Interactive (TTI)

### 3. Optimization Targets

**Frontend:**
- Code splitting
- Lazy loading
- Image optimization
- Caching strategy
- Minimize JavaScript execution

**Backend:**
- Database query optimization
- Caching (Redis/Memcached)
- API response compression
- Connection pooling
- Background job processing

**Infrastructure:**
- CDN configuration
- HTTP/2 or HTTP/3
- Gzip/Brotli compression
- Load balancing
- Horizontal scaling

### 4. Validation
```bash
# Compare before/after
lighthouse --output json --output-path=./optimized.json
npm run benchmark -- --compare baseline
```

## Success Metrics
- [ ] Page load < 2s
- [ ] Time to Interactive < 3.5s
- [ ] First Contentful Paint < 1.5s
- [ ] Lighthouse score > 90
- [ ] Bundle size reduction > 20%
'@ | Out-File -FilePath "$SKILLS_DIR\perf-optimize\skill.md" -Encoding UTF8

Write-Host "   ✅ Created 3 skills (code-review, api-design, perf-optimize)" -ForegroundColor Green

# ============================================================================
# CREATE README
# ============================================================================

@'
# Claude Code Configuration

This directory contains hooks and skills for Claude Code.

## Directory Structure

```
.claude/
├── hooks/           # Event-driven automation
│   ├── pre-edit.sh
│   ├── post-edit.sh
│   ├── pre-commit.sh
│   ├── post-commit.sh
│   └── user-prompt-submit.sh
└── skills/          # Reusable workflows
    ├── code-review/
    ├── api-design/
    └── perf-optimize/
```

## Hooks

Hooks automatically run at specific events:

- **pre-edit.sh**: Before any file edit (validation, safety checks)
- **post-edit.sh**: After file edits (formatting, type checking)
- **pre-commit.sh**: Before git commits (tests, secret detection)
- **post-commit.sh**: After commits (logging, notifications)
- **user-prompt-submit.sh**: When user submits a prompt (suggestions, reminders)

### Testing Hooks (Git Bash required)

```bash
# Test individual hooks
.claude/hooks/pre-edit.sh "src/test.ts"
.claude/hooks/pre-commit.sh
.claude/hooks/user-prompt-submit.sh "configure nginx"
```

## Skills

Skills are reusable workflows you can invoke:

- **code-review**: Comprehensive code quality analysis
- **api-design**: RESTful API design guidance
- **perf-optimize**: Performance optimization workflow

### Using Skills

In Claude Code, use the Skill tool:
```
/code-review
/api-design
/perf-optimize
```

## Customization

Feel free to modify hooks and skills for your project needs:

1. Edit hook scripts in `.claude/hooks/`
2. Modify skill definitions in `.claude/skills/*/skill.md`
3. Add new skills by creating new directories with `skill.md`

## Windows Notes

Hooks are bash scripts that require Git Bash to run. Ensure Git for Windows is installed:
- Download from: https://git-scm.com/download/win
- Git Bash is included with Git for Windows

## Troubleshooting

**Hooks not running?**
- Ensure Git Bash is installed (comes with Git for Windows)
- Check hook output for errors

**Skills not found?**
- Verify `skill.md` exists in skill directory
- Check YAML frontmatter is valid
'@ | Out-File -FilePath "$CLAUDE_DIR\README.md" -Encoding UTF8

# ============================================================================
# SUMMARY
# ============================================================================

Write-Host ""
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Created structure:" -ForegroundColor Cyan
Write-Host "   .claude\"
Write-Host "   ├── hooks\ (5 hooks)"
Write-Host "   │   ├── pre-edit.sh"
Write-Host "   │   ├── post-edit.sh"
Write-Host "   │   ├── pre-commit.sh"
Write-Host "   │   ├── post-commit.sh"
Write-Host "   │   └── user-prompt-submit.sh"
Write-Host "   ├── skills\ (3 skills)"
Write-Host "   │   ├── code-review\"
Write-Host "   │   ├── api-design\"
Write-Host "   │   └── perf-optimize\"
Write-Host "   └── README.md"
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Ensure Git Bash is installed (comes with Git for Windows)"
Write-Host "   2. Test hooks in Git Bash: .claude/hooks/pre-edit.sh 'test.ts'"
Write-Host "   3. Use skills in Claude Code with /code-review, /api-design, etc."
Write-Host "   4. Customize hooks/skills for your project in .claude\"
Write-Host ""
Write-Host "📚 Documentation: .claude\README.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Happy coding with Claude!" -ForegroundColor Green
