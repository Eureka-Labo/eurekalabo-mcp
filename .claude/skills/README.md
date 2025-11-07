# Eureka Tasks - Claude Code Skills

Comprehensive collection of intelligent skills for automated workflow enhancement, quality assurance, and productivity optimization.

## 📦 Installed Skills Overview

### Workflow Automation (3 skills)

#### 1. **eureka-task-coding** 🔄
**Status**: Directory exists (needs installation)
**Purpose**: Auto-manages tasks and work sessions for code changes
**Triggers**: "implement", "add", "fix", "refactor", "create"
**Actions**:
- Searches for existing tasks
- Creates task if needed (Japanese title/description)
- Starts work session automatically
- Allows Write/Edit operations

**Installation**: `eurekaclaude skills install eureka-task-coding`

#### 2. **eureka-session-recovery** 🔄
**Status**: Directory exists (needs installation)
**Purpose**: Recovers and resumes interrupted work sessions
**Triggers**: Detects stale session markers from previous Claude Code sessions
**Actions**:
- Detects Claude session ID mismatch
- Prompts to create new session
- Preserves work context

**Installation**: `eurekaclaude skills install eureka-session-recovery`

#### 3. **eureka-spec-validator** ✅ NEW!
**Status**: ✅ Installed
**Purpose**: Validates feature specification completeness before implementation
**Triggers**: "start implementing", "begin feature", "implement spec"
**Actions**:
- Checks PRD completeness
- Validates pages, endpoints, ER diagrams
- Verifies navigation flow
- Confirms task breakdown and subtasks
- Uses `validate_feature_spec_readiness` tool

**Benefits**:
- Prevents incomplete specifications
- Reduces implementation errors
- Ensures all dependencies are identified
- Comprehensive readiness check before coding

---

### Git & PR Management (2 skills)

#### 4. **eureka-smart-commits** 📝
**Status**: Directory exists (needs installation)
**Purpose**: AI-generated conventional commit messages with Japanese summaries
**Triggers**: "commit", "commit changes", completing task work session
**Actions**:
- Analyzes git diff
- Uses technical-writer sub-agent
- Generates Conventional Commits format
- Adds Japanese summary

**Installation**: `eurekaclaude skills install eureka-smart-commits`

#### 5. **eureka-pr-creator** 🚀 NEW!
**Status**: ✅ Installed
**Purpose**: Automatically generates GitHub pull requests from completed branch tasks
**Triggers**: "create PR", "make pull request", all branch tasks completed
**Actions**:
- Gathers all branch tasks
- Analyzes git changes
- Generates bilingual PR description (Japanese/English)
- Creates GitHub PR with `gh` CLI
- Links PR URL to all tasks
- Auto-creates task if branch has no tasks

**Features**:
- Multi-task PR consolidation
- Conventional Commit analysis
- Task hierarchy visualization
- Automatic PR on task completion

---

### Code Quality & Organization (3 skills)

#### 6. **eureka-board-router** 🎯 NEW!
**Status**: ✅ Installed
**Purpose**: Intelligently routes tasks to correct boards based on context
**Triggers**: Before creating any task without `boardId`
**Actions**:
- Repository-based detection
- File path analysis (frontend/backend/mobile patterns)
- Keyword analysis from title/description
- Task type detection (メンテナンス, 修正, etc.)
- Scoring algorithm for best board match
- Auto-assigns high-confidence matches

**Benefits**:
- No manual board selection
- Prevents misorganized tasks
- Learns from project structure
- Configurable routing rules

#### 7. **api-doc-generator** 📚 NEW!
**Status**: ✅ Installed
**Purpose**: Automatically generates OpenAPI/Swagger documentation from API code
**Triggers**: Editing files in `routes/`, `api/`, `controllers/`, endpoints files
**Keywords**: "API", "endpoint", "route", "REST"
**Actions**:
- Extracts routes from Express, Fastify, Next.js, tRPC
- Parses JSDoc comments
- Converts TypeScript types to OpenAPI schemas
- Generates bilingual descriptions (Japanese/English)
- Creates Swagger UI
- Exports Postman collection

**Supported Frameworks**:
- Express.js (TypeScript/JavaScript)
- Fastify
- Next.js API Routes (App Router)
- tRPC
- Prisma-based APIs

**Output**:
- `docs/api/openapi.yaml` (primary)
- `docs/api/openapi.json`
- `docs/api/index.html` (Swagger UI)
- `docs/api/postman-collection.json`

#### 8. **react-best-practices** ⚛️ NEW!
**Status**: ✅ Installed
**Purpose**: Enforces React 18+ best practices and modern patterns
**Triggers**: Editing `.jsx`, `.tsx` files, "React", "component"
**Actions**:
- Validates Hooks Rules (no conditional hooks, complete dependencies)
- Enforces Server Components patterns (Next.js 13+)
- Performance optimization suggestions (useMemo, useCallback)
- Accessibility checks (ARIA labels, semantic HTML, keyboard support)
- Component structure validation
- Auto-fix capabilities

**Enforcement Categories**:
1. **Hooks Rules** ⚠️ CRITICAL
   - Top-level only
   - Exhaustive dependencies
   - Stable order

2. **Server Components** (Next.js)
   - Default to Server Components
   - Explicit 'use client' when needed

3. **Performance**
   - useMemo for expensive computations
   - useCallback for function props
   - React.memo for components

4. **Accessibility**
   - Semantic HTML
   - ARIA labels
   - Keyboard navigation

5. **Component Structure**
   - TypeScript props interfaces
   - Key props in lists
   - Proper exports

---

## 📊 Skills Statistics

- **Total Skills**: 8 (3 existing + 5 new)
- **Installed**: 5 new skills ready to use
- **Pending Installation**: 3 existing skills (need CLI install command)
- **Total Documentation**: ~2,548 lines of guidance
- **Categories**: Workflow (3), Git/PR (2), Code Quality (3)

---

## 🚀 Installation Guide

### Install All Skills at Once
```bash
# Recommended: Install everything
eurekaclaude skills install all
```

### Install Individual Skills
```bash
# Workflow automation
eurekaclaude skills install eureka-task-coding
eurekaclaude skills install eureka-session-recovery

# Git management
eurekaclaude skills install eureka-smart-commits

# Note: New skills are already installed!
# eureka-spec-validator ✅
# eureka-pr-creator ✅
# eureka-board-router ✅
# api-doc-generator ✅
# react-best-practices ✅
```

### Check Installation Status
```bash
eurekaclaude skills status
eurekaclaude skills list
```

---

## 🎯 How Skills Work

### Automatic Activation
Skills activate based on:
1. **File patterns**: `.tsx`, `routes/*.ts`, etc.
2. **Keywords**: "implement", "create PR", "API endpoint"
3. **Context**: Current task, repository, branch state
4. **Events**: Before Write/Edit, after task completion

### Skill Coordination
Skills work together seamlessly:

```mermaid
User Request: "Implement authentication feature"
    ↓
eureka-task-coding: Creates task "認証機能の実装"
    ↓
eureka-board-router: Assigns to "Backend Board" (detects api/auth.ts)
    ↓
eureka-spec-validator: Checks feature spec completeness
    ↓
[User implements code]
    ↓
react-best-practices: Validates React components
api-doc-generator: Extracts API endpoints → OpenAPI spec
    ↓
eureka-smart-commits: Generates conventional commit message
    ↓
eureka-pr-creator: Creates GitHub PR with bilingual description
```

---

## 🎨 Skill Customization

### Configuration Files

Each skill can be customized with `.claude/*-config.json`:

```bash
.claude/
├── board-routing-config.json      # Board routing rules
├── api-doc-config.json            # OpenAPI generation settings
├── react-rules-config.json        # React validation strictness
└── skills/                        # Skill definitions
```

### Example: Board Routing Config
```json
{
  "repositoryMapping": {
    "eurekalabo-frontend": "Frontend Board",
    "eurekalabo-api": "Backend Board"
  },
  "confidence": {
    "autoAssign": 50,
    "suggestWithConfirm": 30
  }
}
```

---

## 💡 Usage Examples

### Example 1: Feature Implementation Flow
```
User: "Add JWT authentication to the API"

1. eureka-task-coding activates
   → Creates task: "APIにJWT認証を追加"

2. eureka-board-router activates
   → Analyzes: api/auth.ts mentioned
   → Assigns to: "Backend Board" (90% confidence)

3. eureka-spec-validator activates
   → Checks auth feature spec
   → Validates: endpoints, data model, navigation flow
   → Result: ✅ Ready to implement

4. [User writes code in api/auth.ts]

5. api-doc-generator activates
   → Extracts: POST /api/auth/login
   → Generates: OpenAPI spec with JWT security scheme
   → Creates: docs/api/openapi.yaml

6. User: "Commit and create PR"

7. eureka-smart-commits activates
   → Analyzes diff
   → Generates: "feat: APIにJWT認証を追加"

8. eureka-pr-creator activates
   → Gathers task info
   → Generates bilingual PR description
   → Creates GitHub PR
   → Links PR to task
```

### Example 2: React Component Creation
```
User: "Create a user profile component"

1. eureka-task-coding activates
   → Creates task: "ユーザープロフィールコンポーネントの作成"

2. eureka-board-router activates
   → Detects: components/ directory
   → Assigns to: "Frontend Board"

3. [User creates components/UserProfile.tsx]

4. react-best-practices activates
   → Validates hooks rules
   → Checks Server Component pattern
   → Verifies accessibility
   → Suggests: "Add aria-label to profile image"
   → Auto-fixes: Missing dependency in useEffect
```

### Example 3: PR Creation
```
User: "Create PR for authentication feature"

eureka-pr-creator activates:

🔍 Analyzing branch: feature/jwt-auth

Branch Tasks:
✅ JWT認証ミドルウェアの実装
✅ トークン更新エンドポイント追加
✅ 認証テストの追加

📊 Changes:
- 5 files modified
- 234 lines added, 18 deleted
- 3 commits by 樋川 裕次郎

🤖 Generating PR description...

✅ PR Created: https://github.com/org/repo/pull/123

Updated 3 tasks with PR link.
```

---

## 🔧 Troubleshooting

### Skills Not Activating?

1. **Check Installation**:
   ```bash
   eurekaclaude skills status
   ```

2. **Verify SKILL.md exists**:
   ```bash
   ls .claude/skills/*/SKILL.md
   ```

3. **Check Claude Code discovery**:
   - Skills are auto-discovered by Claude Code
   - Restart Claude Code if skills were just installed

4. **Review Trigger Conditions**:
   - Read skill's frontmatter for activation triggers
   - Ensure keywords match your request

### Skill Conflicts?

Skills are designed to work together, but you can:
- **Disable specific skills**: Remove or rename SKILL.md
- **Adjust priorities**: Modify skill descriptions to be more/less specific
- **Configure rules**: Use config files to control behavior

### API Configuration Issues?

Some skills require API access:
- Ensure `.env` has `EUREKA_API_KEY`
- Check network connectivity
- Verify API server is running

---

## 📈 Performance Impact

Skills are designed for minimal overhead:
- **Activation check**: < 100ms
- **File analysis**: 1-3 seconds
- **Auto-fix generation**: 1-2 seconds
- **API documentation**: 5-10 seconds for full spec
- **PR generation**: 10-15 seconds (includes sub-agent call)

Total overhead: **< 5 seconds** for most operations

---

## 🎓 Best Practices

1. **Let skills work automatically** - Trust the automation
2. **Review auto-fixes** - Understand what changed and why
3. **Customize for your project** - Add config files for project-specific rules
4. **Team alignment** - Share `.claude/` directory in git for team consistency
5. **Iterative improvement** - Skills learn from your patterns over time

---

## 🚀 Next Steps

1. **Install pending skills**:
   ```bash
   eurekaclaude skills install all
   ```

2. **Test the workflow**:
   - Try: "Implement a new feature"
   - Observe: Skills activate automatically
   - Review: Generated tasks, commits, PRs

3. **Customize configurations**:
   - Create `.claude/board-routing-config.json`
   - Adjust React validation strictness
   - Configure API doc output format

4. **Explore advanced features**:
   - Multi-task PR consolidation
   - Feature spec validation
   - Bilingual documentation generation

---

## 📚 Related Documentation

- **Hooks**: `.claude/hooks/README.md` - PreToolUse enforcement
- **Slash Commands**: `.claude/commands/` - Manual invocation
- **MCP Server**: `README.md` - Eureka Tasks integration
- **CLI**: `cli/README.md` - eurekaclaude command reference

---

## 🤝 Contributing

Have ideas for new skills? Create a new skill file:

```bash
mkdir -p .claude/skills/my-new-skill
nano .claude/skills/my-new-skill/SKILL.md
```

**Skill Template**:
```markdown
---
name: my-skill-name
description: Specific description of WHAT it does and WHEN to use it. Include trigger keywords.
allowed-tools: Read, Write, Edit, Bash(git:*)
---

# Skill Title

## Auto-Activation Triggers
- Keywords: "keyword1", "keyword2"
- File patterns: *.ext
- Context: When X happens

## Behavior
1. Step one
2. Step two
3. Step three
```

---

**Generated**: 2025-11-07
**Total Skills**: 8
**Documentation Lines**: 2,548
**Ready to Use**: ✅ Yes
