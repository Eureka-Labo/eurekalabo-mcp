#!/bin/bash

# Claude Code Hooks & Skills Setup Script
# This script sets up the .claude directory with hooks and skills

set -e

CLAUDE_DIR=".claude"
HOOKS_DIR="$CLAUDE_DIR/hooks"
SKILLS_DIR="$CLAUDE_DIR/skills"

echo "🚀 Claude Code Hooks & Skills Setup"
echo "===================================="
echo ""

# Check if we're in a directory (not root)
if [ "$PWD" = "/" ]; then
    echo "❌ Error: Do not run this in root directory"
    echo "   Navigate to your project directory first"
    exit 1
fi

# Check if .claude already exists
if [ -d "$CLAUDE_DIR" ]; then
    echo "⚠️  .claude directory already exists"
    read -p "   Continue and overwrite existing files? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled"
        exit 0
    fi
    echo "📦 Backing up existing .claude to .claude.backup.$(date +%s)"
    cp -r "$CLAUDE_DIR" "$CLAUDE_DIR.backup.$(date +%s)"
fi

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p "$HOOKS_DIR"
mkdir -p "$SKILLS_DIR/code-review"
mkdir -p "$SKILLS_DIR/api-design"
mkdir -p "$SKILLS_DIR/perf-optimize"

# ============================================================================
# CREATE HOOKS
# ============================================================================

echo "🎣 Creating hooks..."

# Pre-Edit Hook
cat > "$HOOKS_DIR/pre-edit.sh" << 'EOF'
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
EOF

# Post-Edit Hook
cat > "$HOOKS_DIR/post-edit.sh" << 'EOF'
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
EOF

# Pre-Commit Hook
cat > "$HOOKS_DIR/pre-commit.sh" << 'EOF'
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
EOF

# Post-Commit Hook
cat > "$HOOKS_DIR/post-commit.sh" << 'EOF'
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
EOF

# User Prompt Submit Hook
cat > "$HOOKS_DIR/user-prompt-submit.sh" << 'EOF'
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
EOF

# Make all hooks executable
chmod +x "$HOOKS_DIR"/*.sh
echo "   ✅ Created 5 hooks (all executable)"

# ============================================================================
# CREATE SKILLS
# ============================================================================

echo "🎨 Creating skills..."

# Code Review Skill
cat > "$SKILLS_DIR/code-review/skill.md" << 'EOF'
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
EOF

# API Design Skill
cat > "$SKILLS_DIR/api-design/skill.md" << 'EOF'
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
EOF

# Performance Optimization Skill
cat > "$SKILLS_DIR/perf-optimize/skill.md" << 'EOF'
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
EOF

echo "   ✅ Created 3 skills (code-review, api-design, perf-optimize)"

# ============================================================================
# CREATE README
# ============================================================================

cat > "$CLAUDE_DIR/README.md" << 'EOF'
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

### Testing Hooks

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

## Troubleshooting

**Hooks not running?**
- Ensure scripts are executable: `chmod +x .claude/hooks/*.sh`
- Check hook output for errors

**Skills not found?**
- Verify `skill.md` exists in skill directory
- Check YAML frontmatter is valid
EOF

# ============================================================================
# SUMMARY
# ============================================================================

echo ""
echo "✅ Setup Complete!"
echo ""
echo "📦 Created structure:"
echo "   .claude/"
echo "   ├── hooks/ (5 hooks)"
echo "   │   ├── pre-edit.sh"
echo "   │   ├── post-edit.sh"
echo "   │   ├── pre-commit.sh"
echo "   │   ├── post-commit.sh"
echo "   │   └── user-prompt-submit.sh"
echo "   ├── skills/ (3 skills)"
echo "   │   ├── code-review/"
echo "   │   ├── api-design/"
echo "   │   └── perf-optimize/"
echo "   └── README.md"
echo ""
echo "🎯 Next Steps:"
echo "   1. Test hooks: .claude/hooks/pre-edit.sh 'test.ts'"
echo "   2. Use skills in Claude Code with /code-review, /api-design, etc."
echo "   3. Customize hooks/skills for your project in .claude/"
echo ""
echo "📚 Documentation: .claude/README.md"
echo ""
echo "🚀 Happy coding with Claude!"
