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
# CREATE HOOKS (Node.js .cjs files)
# ============================================================================

echo "🎣 Creating hooks..."

# Pre-Edit Hook
cat > "$HOOKS_DIR/pre-edit.cjs" << 'EOF'
#!/usr/bin/env node

/**
 * Pre-Edit Hook
 * Runs before any file edit operation
 */

let inputData = '';

process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    const hookInput = JSON.parse(inputData);
    processHook(hookInput);
  } catch (error) {
    // Fail open on parse error
    process.exit(0);
  }
});

function processHook(hookInput) {
  const { tool_input } = hookInput;
  const filePath = tool_input?.file_path || '';

  // Block production config files
  if (filePath.includes('production.config')) {
    const response = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: '❌ BLOCKED: Cannot edit production config files'
      }
    };
    console.log(JSON.stringify(response));
    process.exit(0);
    return;
  }

  // Warn about lock files
  if (filePath.includes('package-lock.json') || filePath.includes('yarn.lock')) {
    const response = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
        permissionDecisionReason: '⚠️ WARNING: Editing lock file - ensure this is intentional'
      },
      suppressOutput: false
    };
    console.log(JSON.stringify(response));
    process.exit(0);
    return;
  }

  // Allow by default
  process.exit(0);
}
EOF

# Post-Edit Hook
cat > "$HOOKS_DIR/post-edit.cjs" << 'EOF'
#!/usr/bin/env node

/**
 * Post-Edit Hook
 * Runs after file edit operations
 */

const { execSync } = require('child_process');

let inputData = '';

process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    const hookInput = JSON.parse(inputData);
    processHook(hookInput);
  } catch (error) {
    // Fail open on parse error
    process.exit(0);
  }
});

function processHook(hookInput) {
  const { tool_input } = hookInput;
  const filePath = tool_input?.file_path || '';

  let messages = [];

  // Auto-format TypeScript/JavaScript files
  if (/\.(ts|tsx|js|jsx)$/.test(filePath)) {
    try {
      execSync(`prettier --write "${filePath}"`, { stdio: 'ignore' });
      messages.push(`✅ Formatted: ${filePath}`);
    } catch (error) {
      // Prettier not installed or failed, skip
    }
  }

  // Run type check for TypeScript files
  if (/\.(ts|tsx)$/.test(filePath)) {
    try {
      const output = execSync('tsc --noEmit --skipLibCheck 2>&1 | head -20', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
      });
      if (output) {
        messages.push(`TypeScript check:\n${output}`);
      }
    } catch (error) {
      // TypeScript not installed or errors, skip
    }
  }

  if (messages.length > 0) {
    console.log(messages.join('\n'));
  }

  process.exit(0);
}
EOF

# Pre-Commit Hook
cat > "$HOOKS_DIR/pre-commit.cjs" << 'EOF'
#!/usr/bin/env node

/**
 * Pre-Commit Hook
 * Runs before git commit operations
 */

const { execSync } = require('child_process');

let inputData = '';

process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    const hookInput = JSON.parse(inputData);
    processHook(hookInput);
  } catch (error) {
    // Fail open on parse error
    process.exit(0);
  }
});

function processHook(hookInput) {
  const { tool_name } = hookInput;

  // Only run for Bash tool with git commit commands
  if (tool_name !== 'Bash') {
    process.exit(0);
    return;
  }

  const command = hookInput.tool_input?.command || '';
  if (!command.includes('git commit')) {
    process.exit(0);
    return;
  }

  let warnings = [];

  // Run tests if package.json exists
  try {
    const fs = require('fs');
    if (fs.existsSync('package.json')) {
      try {
        execSync('npm run test --if-present', { stdio: 'ignore' });
        console.log('✅ Tests passed');
      } catch (error) {
        const response = {
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'deny',
            permissionDecisionReason: '❌ BLOCKED: Tests failed - fix before committing'
          }
        };
        console.log(JSON.stringify(response));
        process.exit(0);
        return;
      }
    }
  } catch (error) {
    // Skip test check if error
  }

  // Check for debugging code
  try {
    const diff = execSync('git diff --cached', { encoding: 'utf8' });
    if (/console\.log|debugger|TODO:|FIXME:/.test(diff)) {
      warnings.push('⚠️ WARNING: Found debugging code or TODOs in commit');
    }

    // Check for secrets
    if (/(api_key|password|secret|token).*=.*['"]/i.test(diff)) {
      const response = {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: '❌ BLOCKED: Potential secrets detected in commit'
        }
      };
      console.log(JSON.stringify(response));
      process.exit(0);
      return;
    }
  } catch (error) {
    // Skip diff check if error
  }

  if (warnings.length > 0) {
    console.log(warnings.join('\n'));
  }

  process.exit(0);
}
EOF

# Post-Commit Hook
cat > "$HOOKS_DIR/post-commit.cjs" << 'EOF'
#!/usr/bin/env node

/**
 * Post-Commit Hook
 * Runs after successful git commits
 */

const { execSync } = require('child_process');

let inputData = '';

process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    const hookInput = JSON.parse(inputData);
    processHook(hookInput);
  } catch (error) {
    // Fail open on parse error
    process.exit(0);
  }
});

function processHook(hookInput) {
  const { tool_name } = hookInput;

  // Only run for Bash tool with git commit commands
  if (tool_name !== 'Bash') {
    process.exit(0);
    return;
  }

  const command = hookInput.tool_input?.command || '';
  if (!command.includes('git commit')) {
    process.exit(0);
    return;
  }

  try {
    const commitMsg = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
    const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();

    console.log(`✅ Commit successful: ${commitHash}`);
    console.log(`📝 Message: ${commitMsg}`);

    // Try to log commit to Eureka Tasks if available
    try {
      execSync(`eurekaclaude tasks log-commit ${commitHash}`, { stdio: 'ignore' });
    } catch (error) {
      // eurekaclaude not available, skip
    }
  } catch (error) {
    // Git command failed, skip
  }

  process.exit(0);
}
EOF

# User Prompt Submit Hook
cat > "$HOOKS_DIR/user-prompt-submit.cjs" << 'EOF'
#!/usr/bin/env node

/**
 * User Prompt Submit Hook
 * Runs when user submits a prompt
 */

let inputData = '';

process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    const hookInput = JSON.parse(inputData);
    processHook(hookInput);
  } catch (error) {
    // Fail open on parse error
    process.exit(0);
  }
});

function processHook(hookInput) {
  const userPrompt = hookInput.prompt || '';
  const messages = [];

  // Detect infrastructure configuration changes
  if (/traefik|nginx|apache|docker|kubernetes/i.test(userPrompt)) {
    messages.push('🔍 INFRASTRUCTURE DETECTED: Consulting official documentation required');
    messages.push('🚨 REMINDER: All configuration changes must be validated against official docs');
  }

  // Detect production operations
  if (/production|prod|deploy|release/i.test(userPrompt)) {
    messages.push('⚠️ PRODUCTION OPERATION: Extra validation required');
    messages.push('🛡️ Remember to run --validate flag');
  }

  // Suggest flags for complex operations
  if (/analyze|investigate|debug|complex/i.test(userPrompt)) {
    messages.push('💡 SUGGESTION: Consider using --think or --ultrathink for deep analysis');
  }

  if (messages.length > 0) {
    console.log(messages.join('\n'));
  }

  process.exit(0);
}
EOF

# Make all hooks executable
chmod +x "$HOOKS_DIR"/*.cjs
echo "   ✅ Created 5 hooks (all executable)"

# ============================================================================
# CREATE SETTINGS.JSON
# ============================================================================

echo "⚙️  Creating settings.json..."

cat > "$CLAUDE_DIR/settings.json" << 'EOF'
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/pre-edit.cjs",
            "timeout": 10
          }
        ]
      },
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/pre-edit.cjs",
            "timeout": 10
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/pre-commit.cjs",
            "timeout": 60
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/post-edit.cjs",
            "timeout": 30
          }
        ]
      },
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/post-edit.cjs",
            "timeout": 30
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/post-commit.cjs",
            "timeout": 10
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/user-prompt-submit.cjs",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
EOF

echo "   ✅ Created settings.json"

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
│   ├── pre-edit.cjs
│   ├── post-edit.cjs
│   ├── pre-commit.cjs
│   ├── post-commit.cjs
│   └── user-prompt-submit.cjs
├── skills/          # Reusable workflows
│   ├── code-review/
│   ├── api-design/
│   └── perf-optimize/
└── settings.json    # Hook configuration
```

## Hooks

Hooks automatically run at specific events (configured in settings.json):

- **pre-edit.cjs**: Before any file edit (validation, safety checks)
- **post-edit.cjs**: After file edits (formatting, type checking)
- **pre-commit.cjs**: Before git commits (tests, secret detection)
- **post-commit.cjs**: After commits (logging, notifications)
- **user-prompt-submit.cjs**: When user submits a prompt (suggestions, reminders)

### Testing Hooks

```bash
# Test individual hooks (manually)
echo '{"tool_name":"Edit","tool_input":{"file_path":"test.ts"}}' | node .claude/hooks/pre-edit.cjs
echo '{"prompt":"configure nginx"}' | node .claude/hooks/user-prompt-submit.cjs
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
2. Modify hook configuration in `.claude/settings.json`
3. Modify skill definitions in `.claude/skills/*/skill.md`
4. Add new skills by creating new directories with `skill.md`

## Requirements

- Node.js (for running hooks)
- Optional: prettier, tsc, npm (for hook features)

## Troubleshooting

**Hooks not running?**
- Check `.claude/settings.json` configuration
- Ensure Node.js is installed
- Test hooks manually with echo/pipe

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
echo "   ├── hooks/ (5 Node.js hooks)"
echo "   │   ├── pre-edit.cjs"
echo "   │   ├── post-edit.cjs"
echo "   │   ├── pre-commit.cjs"
echo "   │   ├── post-commit.cjs"
echo "   │   └── user-prompt-submit.cjs"
echo "   ├── skills/ (3 skills)"
echo "   │   ├── code-review/"
echo "   │   ├── api-design/"
echo "   │   └── perf-optimize/"
echo "   ├── settings.json (hook configuration)"
echo "   └── README.md"
echo ""
echo "🎯 Next Steps:"
echo "   1. Restart Claude Code to load new settings"
echo "   2. Test hooks will run automatically on operations"
echo "   3. Use skills in Claude Code with /code-review, /api-design, etc."
echo "   4. Customize hooks/skills for your project in .claude/"
echo ""
echo "📚 Documentation: .claude/README.md"
echo ""
echo "🚀 Happy coding with Claude!"
