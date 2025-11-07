# Eureka Tasks MCP Server - Claude Code Instructions

## Project Context

This is the **Eureka Tasks MCP Server** - a Model Context Protocol server for task management with automated change tracking and workflow enforcement.

**Repository**: eurekalabo/mcp-server
**Purpose**: Task management MCP server with git integration and work session tracking
**Tech Stack**: TypeScript, Node.js, Prisma, MCP SDK

---

## 🎯 Active Skills - USE THESE PROACTIVELY

Claude Code has **8 specialized skills** available for this project. **You MUST actively use these skills** based on the triggers described below.

### Workflow Automation Skills

#### 1. **eureka-task-coding** 🔄
**WHEN TO USE**: User requests code changes (implement, add, fix, refactor, create)

**AUTOMATIC ACTIONS**:
1. Search existing tasks: `mcp__eureka-tasks__list_tasks({ search: "keywords" })`
2. Create task if needed (Japanese title/description)
3. Start work session: `mcp__eureka-tasks__start_work_on_task({ taskId })`
4. Then proceed with Write/Edit operations

**CRITICAL**: Always create task BEFORE any Write/Edit operations (hook enforces this)

#### 2. **eureka-spec-validator** ✅
**WHEN TO USE**: Before implementing features linked to feature specs

**AUTOMATIC ACTIONS**:
1. Check if task is linked to feature spec
2. Validate spec completeness: `mcp__eureka-tasks__validate_feature_spec_readiness({ specId })`
3. Report missing components (pages, endpoints, ER diagrams, navigation flow)
4. Block implementation if critical components missing

**TRIGGERS**: "start implementing", "begin feature", "implement spec"

#### 3. **eureka-session-recovery** 🔄
**WHEN TO USE**: Detects stale session markers from previous Claude Code sessions

**AUTOMATIC ACTIONS**:
1. Detect Claude session ID mismatch
2. Prompt user to create new session
3. Preserve work context

---

### Git & PR Management Skills

#### 4. **eureka-smart-commits** 📝
**WHEN TO USE**: User says "commit" or when completing task work session

**AUTOMATIC ACTIONS**:
1. Get git diff: `git diff --staged` or `git diff HEAD`
2. Generate smart commit: `mcp__eureka-tasks__generate_smart_commit_message({ gitDiff, taskContext })`
3. Create commit with Conventional Commits format + Japanese summary

**OUTPUT FORMAT**:
```
feat: {Japanese description}

{Detailed Japanese explanation}

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

#### 5. **eureka-pr-creator** 🚀
**WHEN TO USE**:
- User says: "create PR", "make pull request", "open PR"
- All branch tasks are completed
- After completing last task in branch

**AUTOMATIC ACTIONS**:
1. Get branch tasks: `mcp__eureka-tasks__list_branch_tasks()`
2. Analyze git changes: `git diff origin/main...HEAD`
3. Generate PR description: `mcp__eureka-tasks__generate_smart_pr_description({ branchTasks, gitDiff })`
4. Create PR: `mcp__eureka-tasks__create_pull_request({ title?, baseBranch })`
5. Auto-create task if branch has no tasks

**OUTPUT**: Bilingual PR (Japanese primary, English secondary)

---

### Code Quality & Organization Skills

#### 6. **eureka-board-router** 🎯
**WHEN TO USE**: BEFORE creating any task without `boardId`

**AUTOMATIC ACTIONS**:
1. Get available boards: `mcp__eureka-tasks__list_boards()`
2. Analyze context:
   - Current repository (git remote)
   - File paths mentioned in description
   - Keywords in title/description
   - Task type (メンテナンス, 修正, etc.)
3. Score each board (repository match=50pts, file path=20pts, keyword=10pts)
4. Auto-assign if score >= 50 (high confidence)
5. Ask user if score < 30 (low confidence)

**RESULT**: Prevents manual board selection errors

#### 7. **api-doc-generator** 📚
**WHEN TO USE**: When editing API files

**FILE PATTERNS**:
- `**/routes/*.ts`
- `**/api/*.ts`
- `**/controllers/*.ts`
- `**/endpoints/*.ts`

**AUTOMATIC ACTIONS**:
1. Detect API framework (Express, Fastify, Next.js, tRPC)
2. Extract endpoints, parameters, request/response schemas
3. Parse JSDoc comments
4. Convert TypeScript types to OpenAPI schemas
5. Generate bilingual descriptions (Japanese/English)
6. Output: `docs/api/openapi.yaml`, Swagger UI, Postman collection

**SUPPORTED FRAMEWORKS**: Express, Fastify, Next.js API Routes, tRPC, Prisma

#### 8. **react-best-practices** ⚛️
**WHEN TO USE**: When editing React components

**FILE EXTENSIONS**: `.jsx`, `.tsx`, React files

**AUTOMATIC VALIDATIONS**:
1. **Hooks Rules** (CRITICAL):
   - No conditional hooks
   - No hooks in loops
   - Exhaustive dependencies
2. **Server Components** (Next.js 13+):
   - Default to Server Components
   - 'use client' only when needed
3. **Performance**:
   - Suggest useMemo for expensive computations
   - Suggest useCallback for function props
4. **Accessibility**:
   - ARIA labels for icon buttons
   - Semantic HTML (button vs div)
   - Keyboard support (onKeyDown)
5. **Component Structure**:
   - TypeScript props interfaces
   - Unique keys in lists

**AUTO-FIX**: Can automatically fix violations (asks user first)

---

## 🔄 Skill Coordination Example

**User Request**: "Implement JWT authentication feature"

**Automatic Skill Flow**:
```
1. eureka-task-coding activates
   → Creates: "JWT認証機能の実装"
   → Starts work session

2. eureka-board-router activates
   → Detects: api/auth.ts (backend pattern)
   → Assigns to: "Backend Board"

3. eureka-spec-validator activates
   → Validates auth feature spec
   → Checks: endpoints, data model, navigation
   → Result: ✅ or ❌ with missing components

4. [User implements code]

5. api-doc-generator activates
   → Extracts: POST /api/auth/login, /api/auth/refresh
   → Generates: docs/api/openapi.yaml

6. react-best-practices activates (if editing Login.tsx)
   → Validates: hooks, accessibility, performance

7. User: "commit and create PR"

8. eureka-smart-commits activates
   → Generates: "feat: JWT認証機能の実装"

9. eureka-pr-creator activates
   → Generates bilingual PR description
   → Creates GitHub PR
   → Links PR to task
```

---

## 📋 Task Management Rules

### Work Session Enforcement

**CRITICAL**: The PreToolUse hook BLOCKS Write/Edit operations without active session.

**Required Workflow**:
1. Create or find task
2. Start work session: `mcp__eureka-tasks__start_work_on_task({ taskId })`
3. This creates `.eureka-active-session` marker
4. Now Write/Edit operations are allowed
5. Complete session: `mcp__eureka-tasks__complete_task_work({ taskId, summary })`

**Hook Path**: `.claude/hooks/check-work-session.cjs`

### Task Classification

**NEW FEATURE** (requires feature spec):
- Keywords: "add feature", "new feature", "implement feature"
- Workflow: check spec → create task → link to spec → validate spec → start session

**MAINTENANCE** (no feature spec):
- Keywords: "fix", "refactor", "update", "bug"
- Workflow: create task → start session (no spec needed)

---

## 🎨 Bilingual Support

**Primary Language**: Japanese (日本語)
**Secondary Language**: English

**All generated content is bilingual**:
- Task titles/descriptions: Japanese
- Commit messages: Japanese with English Co-Authored-By
- PR descriptions: Japanese 概要 + English Summary
- API documentation: Japanese descriptions with English translations

---

## 🔧 Configuration Files

Skills can be customized with these config files:

```
.claude/
├── board-routing-config.json      # Board assignment rules
├── api-doc-config.json            # OpenAPI generation settings
├── react-rules-config.json        # React validation strictness
└── settings.local.json            # Hook configuration (already exists)
```

---

## 🚨 Critical Requirements

1. **ALWAYS use skills proactively** - Don't wait for user to ask
2. **Create tasks BEFORE code changes** - Hook enforces this
3. **Validate feature specs** - Before implementing features
4. **Generate bilingual content** - Japanese primary, English secondary
5. **Use intelligent board routing** - No manual board selection
6. **Document APIs automatically** - When editing API files
7. **Enforce React best practices** - When editing React components
8. **Create comprehensive PRs** - With task summaries and change analysis

---

## 📚 Additional Resources

- **Skills Documentation**: `.claude/skills/README.md`
- **Hook Documentation**: `.claude/hooks/README.md`
- **MCP Server README**: `README.md`
- **CLI Documentation**: `cli/README.md`

---

## 🎯 Success Criteria

Skills are working correctly when:
- ✅ Tasks created automatically before code changes
- ✅ Boards assigned intelligently (no user selection)
- ✅ Feature specs validated before implementation
- ✅ API docs generated from code changes
- ✅ React components validated for best practices
- ✅ Commits use Conventional Commits with Japanese
- ✅ PRs are bilingual with comprehensive descriptions
- ✅ All content is in Japanese (primary) and English (secondary)

---

**Last Updated**: 2025-11-07
**Skills Active**: 8
**Skill Discovery**: Automatic (Claude Code reads .claude/skills/*/SKILL.md)
