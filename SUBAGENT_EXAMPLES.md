# Sub-Agent Integration Examples

Practical examples showing how to use sub-agent tools in real workflows.

## Example 1: Smart Commit Message Generation

### Scenario
You've completed work on a task with multiple file changes and want an intelligent commit message.

### Traditional Approach
```typescript
// Manually write commit message
git commit -m "fix: update authentication and add tests"
```

### Sub-Agent Approach
```typescript
// 1. Get git diff
const gitDiff = await exec('git diff --staged');

// 2. Call sub-agent tool
const result = await claudeCode.call('mcp__eureka-tasks__generate_smart_commit_message', {
  gitDiff: gitDiff.stdout,
  taskContext: {
    taskId: 'task-123',
    title: 'ユーザー認証機能の実装',
    priority: 'high'
  }
});

// 3. Claude Code automatically launches technical-writer sub-agent
// 4. Sub-agent analyzes changes and returns:
/*
feat: Implement JWT authentication with refresh tokens

Add comprehensive authentication system with:
- JWT token generation and validation middleware
- Bcrypt password hashing with configurable rounds
- Refresh token support for long-lived sessions
- Integration tests for all auth flows

Fixes: #123

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
*/

// 5. Use the generated message
await exec(`git commit -m "${result.message}"`);
```

### Result
- **Time saved**: 3-5 minutes → 10 seconds
- **Quality**: Professional, detailed, follows conventions
- **Consistency**: Always follows Conventional Commits format

---

## Example 2: Automated PR Creation with AI Description

### Scenario
You've completed all tasks in a feature branch and want to create a PR with comprehensive description.

### Traditional Approach
```markdown
# Manually write PR description
## Changes
- Added user authentication
- Added tests
- Updated docs

## Testing
- Test login flow
```

### Sub-Agent Approach
```typescript
// 1. Get branch tasks
const branchTasks = await claudeCode.call('mcp__eureka-tasks__list_branch_tasks');

// 2. Get git diff summary
const gitDiff = await exec('git diff main..HEAD --stat');

// 3. Call sub-agent tool
const result = await claudeCode.call('mcp__eureka-tasks__generate_smart_pr_description', {
  branchTasks: branchTasks.tasks,
  gitDiff: gitDiff.stdout,
  baseBranch: 'main'
});

// 4. Claude Code launches technical-writer sub-agent
// 5. Sub-agent generates comprehensive PR description:
/*
## 概要 (Summary)
ユーザー認証機能を完全実装しました。JWT トークンベースの認証ミドルウェア、リフレッシュトークンサポート、包括的なテストスイートを含みます。

## Summary (English)
Comprehensive user authentication implementation with JWT-based middleware, refresh token support, and complete test coverage.

## Changes

### Core Implementation (Task #123)
- **JWT Middleware**: Token generation, validation, and refresh logic
- **Password Security**: Bcrypt hashing with configurable rounds
- **Session Management**: Refresh token rotation and revocation
- **Files changed**: 15 files (+842/-123 lines)

### Testing (Task #124)
- **Integration Tests**: Full auth flow coverage (login, refresh, logout)
- **Unit Tests**: Middleware validation and edge cases
- **Coverage**: 94% overall, 100% on critical auth paths
- **Files changed**: 8 files (+567/-45 lines)

### Documentation (Task #125)
- **API Documentation**: All authentication endpoints documented
- **Setup Guide**: Environment variables and configuration
- **Security Notes**: Best practices and considerations
- **Files changed**: 4 files (+234/-12 lines)

## Testing Checklist

### Functional Testing
- [ ] User can register with valid email/password
- [ ] User can login and receive JWT token
- [ ] Protected routes require valid token
- [ ] Token refresh works correctly
- [ ] Logout invalidates tokens
- [ ] Invalid tokens are rejected

### Security Testing
- [ ] Passwords are hashed (not stored plaintext)
- [ ] Tokens have appropriate expiration
- [ ] Refresh tokens rotate on use
- [ ] Rate limiting works on auth endpoints
- [ ] SQL injection attempts are blocked

### Performance Testing
- [ ] Login response time < 200ms
- [ ] Token validation overhead < 10ms
- [ ] Hash generation time acceptable (< 1s)

## Breaking Changes

**Authentication Required**: All API endpoints now require authentication. Clients must include `Authorization: Bearer <token>` header.

**Migration Guide**:
1. Update client to handle login flow
2. Store JWT tokens securely
3. Add token refresh logic
4. Update API calls to include auth header

## Related Tasks
- Task #123: ユーザー認証機能の実装 (Core implementation)
- Task #124: 認証テストの追加 (Testing)
- Task #125: 認証ドキュメントの作成 (Documentation)

## Dependencies
- Added: `jsonwebtoken@9.0.0`
- Added: `bcrypt@5.1.0`
- Updated: `express@4.18.2`

---
🤖 Generated with Claude Code
*/

// 6. Create PR with AI-generated description
await exec(`gh pr create --title "Feature: User Authentication" --body "${result.description}"`);
```

### Result
- **Time saved**: 15-20 minutes → 30 seconds
- **Quality**: Comprehensive, well-structured, professional
- **Completeness**: All tasks, changes, and testing covered

---

## Example 3: Project Setup Validation

### Scenario
You're joining a project and want to validate your development environment is correctly configured.

### Traditional Approach
```bash
# Manual checks
which node
which git
cat ~/.config/Claude/claude_desktop_config.json
echo $EUREKA_API_KEY
git status
# ... many more manual checks
```

### Sub-Agent Approach
```typescript
// 1. Call validation tool
const result = await claudeCode.call('mcp__eureka-tasks__validate_setup', {
  projectPath: '/Users/user/workspace/my-project'
});

// 2. Claude Code launches devops-architect sub-agent
// 3. Sub-agent performs comprehensive validation:
/*
# 🔍 EurekaClaude Setup Validation Report

## ✅ Passing Checks

### Environment Variables
- **EUREKA_API_KEY**: Configured (length: 64 chars)
- **EUREKA_API_URL**: Using default (https://api.eurekalabo.com)
- **EUREKA_WORKSPACE_PATH**: Set to /Users/user/workspace/my-project

### Git Repository
- **Repository Status**: Initialized and healthy
- **Git Version**: 2.39.1
- **Current Branch**: feature/auth-system
- **Working Directory**: Clean (no uncommitted changes)
- **Remote**: origin configured (git@github.com:user/repo.git)

### Claude Code Integration
- **Config File**: Found at ~/Library/Application Support/Claude/claude_desktop_config.json
- **MCP Server**: eurekaclaude configured correctly
- **Server Path**: /Users/user/workspace/eurekalabo/mcp-server/dist/index.js
- **Server Status**: Responding (tested with list_tasks)

### Work Session State
- **Sessions Directory**: /Users/user/workspace/my-project/.eureka-sessions
- **Active Sessions**: None (clean state)
- **Session History**: 3 completed sessions found

## ⚠️ Warnings

### Performance
- **Node Version**: v18.17.0 (v20+ recommended for better performance)
- **Recommendation**: Upgrade to Node.js v20+ for optimal performance

### Configuration
- **Git Hooks**: No pre-commit hooks detected
- **Recommendation**: Consider adding commit validation hooks

## ❌ Critical Issues

None detected! Your setup is healthy.

## 🔧 Recommended Actions

1. **Upgrade Node.js**:
   ```bash
   nvm install 20
   nvm use 20
   ```

2. **Add Git Hooks** (optional):
   ```bash
   eurekaclaude hooks install --type pre-commit
   ```

3. **Verify CLI Access**:
   ```bash
   eurekaclaude --version
   ```

4. **Create Your First Task**:
   ```typescript
   mcp__eureka-tasks__create_task({
     title: "最初のタスク",
     description: "EurekaClaude の動作確認"
   })
   ```

## 📊 System Information

- **Operating System**: macOS 14.2.1 (Sonoma)
- **Node.js**: v18.17.0
- **npm**: 9.8.1
- **Git**: 2.39.1
- **Claude Desktop**: 1.2.0
- **Workspace Path**: /Users/user/workspace/my-project
- **Total Disk Space**: 500 GB
- **Available Space**: 250 GB (50% free)

## 🎯 Next Steps

Your eurekaclaude setup is ready to use! Start by:
1. Creating a task with `mcp__eureka-tasks__create_task`
2. Starting work with `mcp__eureka-tasks__start_work_on_task`
3. Coding your implementation
4. Completing work with `mcp__eureka-tasks__complete_task_work`

---
Validation completed at: 2025-01-30 14:30:00 JST
*/
```

### Result
- **Time saved**: 10-15 minutes → 20 seconds
- **Completeness**: All aspects checked systematically
- **Actionable**: Clear next steps and recommendations

---

## Example 4: Intelligent Project Setup

### Scenario
You're setting up eurekaclaude for a new React project and want optimal configuration.

### Traditional Approach
```bash
# Manual configuration
cat > claude_desktop_config.json << 'EOF'
{
  "mcpServers": {
    "eureka-tasks": {
      // ... manual configuration
    }
  }
}
EOF

# Create .env file manually
# Configure hooks manually
# etc.
```

### Sub-Agent Approach
```typescript
// 1. Call smart setup tool
const result = await claudeCode.call('mcp__eureka-tasks__generate_smart_setup', {
  projectPath: '/Users/user/workspace/new-react-project',
  projectType: 'react'  // Optional hint
});

// 2. Claude Code launches system-architect sub-agent
// 3. Sub-agent analyzes project structure and generates:
/*
{
  "claudeConfig": {
    "mcpServers": {
      "eureka-tasks": {
        "command": "node",
        "args": [
          "/Users/user/workspace/eurekalabo/mcp-server/dist/index.js"
        ],
        "env": {
          "EUREKA_API_KEY": "your-api-key-here",
          "EUREKA_API_URL": "https://api.eurekalabo.com",
          "EUREKA_WORKSPACE_PATH": "/Users/user/workspace/new-react-project"
        }
      }
    }
  },

  "projectAnalysis": {
    "type": "react",
    "framework": "create-react-app",
    "packageManager": "npm",
    "typescript": true,
    "testing": "jest + react-testing-library",
    "structure": "src/ component-based"
  },

  "recommendedHooks": [
    {
      "name": "pre-commit",
      "description": "Run linting and type checking before commits",
      "script": "npm run lint && npm run type-check",
      "reason": "Ensures code quality before commits",
      "priority": "high"
    },
    {
      "name": "pre-push",
      "description": "Run full test suite before pushing",
      "script": "npm test -- --coverage",
      "reason": "Prevents broken code from reaching remote",
      "priority": "medium"
    },
    {
      "name": "commit-msg",
      "description": "Validate commit message format",
      "script": "eurekaclaude hooks validate-commit",
      "reason": "Enforces Conventional Commits format",
      "priority": "high"
    }
  ],

  "taskTemplates": [
    {
      "title": "新しいコンポーネントの作成",
      "description": "Reactコンポーネントとテストを作成",
      "priority": "medium",
      "tags": ["component", "frontend"]
    },
    {
      "title": "バグの修正",
      "description": "既存機能のバグを修正",
      "priority": "high",
      "tags": ["bugfix"]
    },
    {
      "title": "APIエンドポイントの追加",
      "description": "新しいAPIエンドポイントを実装",
      "priority": "medium",
      "tags": ["api", "backend"]
    },
    {
      "title": "テストの追加",
      "description": "既存機能にテストを追加",
      "priority": "low",
      "tags": ["testing", "quality"]
    },
    {
      "title": "リファクタリング",
      "description": "コードの品質と保守性を向上",
      "priority": "low",
      "tags": ["refactoring", "technical-debt"]
    }
  ],

  "setupSteps": [
    "1. Copy the generated claude_desktop_config.json to ~/Library/Application Support/Claude/",
    "2. Set EUREKA_API_KEY in the environment (get from https://eurekalabo.com/settings/api)",
    "3. Restart Claude Desktop to load new configuration",
    "4. Test MCP connection: mcp__eureka-tasks__list_tasks()",
    "5. Install recommended git hooks: npm run setup-hooks",
    "6. Create your first task from templates",
    "7. Start coding with automatic task tracking!"
  ],

  "environmentVariables": {
    "required": [
      {
        "name": "EUREKA_API_KEY",
        "description": "API key for Eureka Tasks backend",
        "source": "https://eurekalabo.com/settings/api",
        "example": "ek_1234567890abcdef..."
      }
    ],
    "optional": [
      {
        "name": "EUREKA_API_URL",
        "description": "API base URL (defaults to production)",
        "default": "https://api.eurekalabo.com",
        "whenToSet": "Only for development/staging environments"
      }
    ]
  },

  "optimizations": {
    "react": {
      "taskWorkflow": "Component → Test → Documentation",
      "prPattern": "Feature branches with multiple component tasks",
      "commitStyle": "feat(component): Add UserProfile component",
      "testingStrategy": "Create test file when creating component"
    },
    "typescript": {
      "recommendation": "Run type-check in pre-commit hook",
      "strictMode": true
    }
  }
}
*/

// 4. Apply configuration automatically
await applySetup(result);

console.log('✅ Setup complete! Next steps:');
result.setupSteps.forEach((step, i) => {
  console.log(`${i + 1}. ${step}`);
});
```

### Result
- **Time saved**: 30-60 minutes → 5 minutes
- **Quality**: Optimized for React project patterns
- **Completeness**: All configuration, hooks, and templates ready

---

## Example 5: End-to-End Workflow

### Complete feature implementation with sub-agent assistance

```typescript
// ==========================================
// STEP 1: Validate Setup (Health Check)
// ==========================================
console.log('🔍 Validating development environment...');
const validation = await claudeCode.call('mcp__eureka-tasks__validate_setup');

if (validation.criticalIssues.length > 0) {
  console.error('❌ Critical issues detected!');
  console.error(validation.criticalIssues);
  process.exit(1);
}

console.log('✅ Environment validated');

// ==========================================
// STEP 2: Create Task
// ==========================================
console.log('\n📝 Creating task...');
const task = await claudeCode.call('mcp__eureka-tasks__create_task', {
  title: 'ユーザープロフィール機能の実装',
  description: 'ユーザープロフィールの表示と編集機能を実装する',
  priority: 'high'
});

console.log(`✅ Task created: ${task.id}`);

// ==========================================
// STEP 3: Start Work Session
// ==========================================
console.log('\n🚀 Starting work session...');
await claudeCode.call('mcp__eureka-tasks__start_work_on_task', {
  taskId: task.id
});

console.log('✅ Work session started, git baseline captured');

// ==========================================
// STEP 4: Implementation (Your Code Here)
// ==========================================
console.log('\n💻 Implementing feature...');
// ... your actual implementation work ...
// - Create UserProfile component
// - Add profile API endpoints
// - Write tests
// - Update documentation

// ==========================================
// STEP 5: Generate Smart Commit Message
// ==========================================
console.log('\n📝 Generating intelligent commit message...');
const gitDiff = await exec('git diff --staged');

const commitResult = await claudeCode.call('mcp__eureka-tasks__generate_smart_commit_message', {
  gitDiff: gitDiff.stdout,
  taskContext: {
    taskId: task.id,
    title: task.title,
    priority: task.priority
  }
});

console.log('✅ Commit message generated');
console.log('---');
console.log(commitResult.message);
console.log('---');

// ==========================================
// STEP 6: Complete Work Session
// ==========================================
console.log('\n✅ Completing work session...');
const completion = await claudeCode.call('mcp__eureka-tasks__complete_task_work', {
  taskId: task.id,
  summary: 'ユーザープロフィール機能を実装しました。表示、編集、API統合、テストを含みます。'
});

console.log(`✅ Work session completed`);
console.log(`   Files changed: ${completion.summary.filesChanged}`);
console.log(`   Lines added: +${completion.summary.linesAdded}`);
console.log(`   Lines removed: -${completion.summary.linesRemoved}`);

// ==========================================
// STEP 7: Check for PR Creation
// ==========================================
console.log('\n🔍 Checking if ready for PR...');
const branchTasks = await claudeCode.call('mcp__eureka-tasks__list_branch_tasks');

const allCompleted = branchTasks.tasks.every(t => t.status === 'done');

if (allCompleted) {
  console.log('✅ All branch tasks completed! Creating PR...');

  // ==========================================
  // STEP 8: Generate Smart PR Description
  // ==========================================
  console.log('\n📝 Generating comprehensive PR description...');
  const gitDiffSummary = await exec('git diff main..HEAD --stat');

  const prResult = await claudeCode.call('mcp__eureka-tasks__generate_smart_pr_description', {
    branchTasks: branchTasks.tasks,
    gitDiff: gitDiffSummary.stdout,
    baseBranch: 'main'
  });

  console.log('✅ PR description generated');

  // ==========================================
  // STEP 9: Create Pull Request
  // ==========================================
  console.log('\n🎉 Creating pull request...');
  const pr = await claudeCode.call('mcp__eureka-tasks__create_pull_request', {
    title: 'Feature: ユーザープロフィール機能',
    // Description generated by sub-agent will be used automatically
  });

  console.log(`✅ Pull request created: ${pr.prUrl}`);
  console.log(`   PR Number: #${pr.prNumber}`);
  console.log(`   Updated Tasks: ${pr.updatedTasks}`);
} else {
  console.log('📋 More tasks remain in this branch');
  const remaining = branchTasks.tasks.filter(t => t.status !== 'done');
  console.log(`   Remaining: ${remaining.length} tasks`);
  remaining.forEach(t => {
    console.log(`   - ${t.title} (${t.status})`);
  });
}

// ==========================================
// STEP 10: Final Validation
// ==========================================
console.log('\n🔍 Running final validation...');
const finalValidation = await claudeCode.call('mcp__eureka-tasks__validate_setup');

console.log('✅ Workflow complete!');
console.log('\n📊 Summary:');
console.log(`   - Task: ${task.title}`);
console.log(`   - Status: ${completion.summary.filesChanged} files changed`);
console.log(`   - PR: ${pr ? pr.prUrl : 'Not created yet'}`);
console.log(`   - Validation: ${finalValidation.criticalIssues.length === 0 ? 'Passed' : 'Issues detected'}`);
```

### Result
- **Complete workflow**: Validation → Task → Implementation → Commit → PR
- **All automated**: Commit messages, PR descriptions, validation
- **Time saved**: 60-90 minutes → 15-20 minutes
- **Quality**: Professional output at every step

---

## Integration with Existing Workflows

### GitHub Actions Integration

```yaml
# .github/workflows/pr-validation.yml
name: PR Validation with Sub-Agents

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install eurekaclaude
        run: npm install -g eurekaclaude

      - name: Validate Setup
        env:
          EUREKA_API_KEY: ${{ secrets.EUREKA_API_KEY }}
        run: |
          # Use sub-agent for validation
          eurekaclaude validate --verbose

      - name: Check Task Completion
        run: |
          # Verify all PR tasks are completed
          eurekaclaude pr check --require-all-complete
```

---

## Tips and Tricks

### 1. Cache Sub-Agent Results

```typescript
// Cache expensive sub-agent calls
const cache = new Map();

async function getCachedCommitMessage(gitDiff: string) {
  const hash = hashString(gitDiff);

  if (cache.has(hash)) {
    return cache.get(hash);
  }

  const result = await generateSmartCommitMessage(gitDiff);
  cache.set(hash, result);
  return result;
}
```

### 2. Fallback Patterns

```typescript
// Always have a fallback
async function generateCommitMessage(gitDiff: string) {
  try {
    // Try sub-agent first
    return await generateSmartCommitMessage(gitDiff);
  } catch (error) {
    // Fall back to simple generation
    console.warn('Sub-agent failed, using fallback');
    return generateSimpleCommitMessage(gitDiff);
  }
}
```

### 3. Batch Operations

```typescript
// Process multiple tasks in parallel
const tasks = await listBranchTasks();

const commitMessages = await Promise.all(
  tasks.map(task =>
    generateSmartCommitMessage(task.diff, task.context)
  )
);
```

---

## Conclusion

These examples demonstrate the power of sub-agent integration:

1. **Dramatic time savings** across all workflows
2. **Professional quality** output automatically
3. **Consistent results** following best practices
4. **Reduced cognitive load** - focus on coding, not documentation

Start integrating sub-agents into your workflow today!
