# Workflow Classification Guide

## Overview

The Eureka Tasks MCP Server uses an intelligent classification system to determine whether your request requires a full feature specification or just a simple task. This guide explains how classification works and what to expect.

## Two Workflow Types

### 🎨 Workflow A: Feature-Spec-Driven (for New Features)

**When to use:**
- Building new functionality
- Creating new user-facing features
- Implementing complex multi-component systems
- Requires PRD, pages, endpoints, or ER diagrams

**What happens:**
1. Check for existing feature specs
2. Create new feature spec (AI-powered PRD generation with ALL artifacts)
3. Create main task and link to feature spec
4. Create subtasks with auto-board routing
5. Validate feature spec readiness
6. Start work session (ONLY after validation passes)
7. Code implementation
8. Complete work session

**IMPORTANT: Complete Artifact Generation**
Before starting ANY work, the following MUST be created:
- ✅ Feature spec with PRD document
- ✅ Implementation plan
- ✅ Pages (frontend pages with paths)
- ✅ API endpoints (backend APIs with methods)
- ✅ ER diagrams (database schema)
- ✅ Navigation flow (page relationships)
- ✅ Main task linked to feature spec
- ✅ Subtasks (frontend, backend, testing) with dependencies

**Examples:**
- "Add user authentication system"
- "Implement payment processing"
- "Create dashboard with analytics"
- "Build notification system"

### 🔧 Workflow B: Maintenance Task (for Bug Fixes & Refactoring)

**When to use:**
- Bug fixes
- Code refactoring
- Technical improvements
- Documentation updates
- Adding tests
- Dependency updates

**What happens:**
1. Create task (no feature spec)
2. Start work session
3. Code implementation
4. Complete work session

**Examples:**
- "Fix login bug where users get 500 error"
- "Refactor authentication middleware"
- "Update React to latest version"
- "Add unit tests for user service"
- "Optimize database queries"

## Ambiguous Requests

Some requests are not immediately clear. When Claude encounters an ambiguous request, it will ask you to clarify.

### Common Ambiguous Scenarios

| Request | Why Ambiguous | Possible Types |
|---------|--------------|----------------|
| "Improve authentication" | Could be new feature OR refactor | Feature: Add OAuth<br>Maintenance: Clean up code |
| "Add validation" | Could be new feature OR bug fix | Feature: Complex validation system<br>Maintenance: Fix missing validation |
| "Update authentication" | Could be new method OR security fix | Feature: Add 2FA<br>Maintenance: Fix security vulnerability |
| "Change how X works" | Could be feature OR refactor | Feature: New behavior<br>Maintenance: Code cleanup |
| "Enhance X" | Could be new feature OR improvement | Feature: New capabilities<br>Maintenance: Optimize existing |

### What Claude Will Ask

When facing ambiguity, Claude will ask:

```
"Is this a new feature requiring a feature specification,
or a maintenance task (bug fix/refactor/improvement)?"
```

Your response determines which workflow is used.

## Classification Decision Tree

```
User Request
    ↓
    ├─ Keywords: "Add", "Implement", "Create" + new functionality?
    │  → Likely FEATURE (Workflow A)
    │
    ├─ Keywords: "Fix", "Refactor", "Update", "Optimize"?
    │  → Likely MAINTENANCE (Workflow B)
    │
    └─ Keywords: "Improve", "Enhance", "Change"?
       → AMBIGUOUS - Ask user
```

## Best Practices

### For Users

1. **Be specific in your requests**
   - Good: "Add OAuth authentication" (clear feature)
   - Good: "Fix the login timeout bug" (clear bug fix)
   - Ambiguous: "Improve login" (could be either)

2. **When asked for clarification, provide context**
   - "It's a new feature - I want to add social login"
   - "It's a refactor - just cleaning up the existing code"

3. **Don't overthink it**
   - Claude's classification is usually accurate
   - You'll only be asked when truly ambiguous

### For Claude

1. **Always classify before starting**
   - Never assume workflow type
   - Use the indicators in the prompt

2. **Ask when not 100% sure**
   - Better to ask than choose wrong workflow
   - One clarifying question is better than wrong implementation

3. **Be automatic for clear requests**
   - Don't ask unnecessary questions
   - User should see seamless workflow

## Validation Workflow (NEW)

### Before Starting Work

**Step 1: Create Complete Feature Spec**
```typescript
const fullSpec = await create_feature_spec({
  projectId: "xxx",
  prompt: "ユーザー認証機能を追加",
  clarifications: { ... }
});

// Returns:
// - featureSpec (with PRD, implementation plan)
// - pages[] (frontend pages)
// - endpoints[] (API endpoints)
// - erDiagrams[] (database schema)
// - navigationFlow (page relationships)
// - taskBreakdown (suggested main/subtasks)
```

**Step 2: Create Task Structure**
```typescript
// Create main task
const mainTask = await create_task({ ... });
await link_task_to_feature_spec({ taskId, featureSpecId });

// Create subtasks
const subtasks = await create_subtasks({
  featureSpecId,
  mainTaskId,
  taskTypes: ['BACKEND_SUBTASK', 'FRONTEND_SUBTASK']
});
```

**Step 3: Validate Readiness (REQUIRED)**
```typescript
const readiness = await validate_feature_spec_readiness({
  specId: featureSpecId
});

if (!readiness.ready) {
  // Cannot start work - missing artifacts
  console.error(readiness.missingArtifacts);
  console.error(readiness.blockers);
}
```

**Step 4: Start Work (ONLY if validation passes)**
```typescript
await start_work_on_task({ taskId: backend_subtask_id });
// ✅ Validation passed
// ✅ All artifacts present
// ✅ Dependencies checked
// ✅ Work session started
```

### Validation Prevents Premature Work

The `start_work_on_task` tool now automatically validates:
- ✅ Feature spec exists with PRD and implementation plan
- ✅ Pages created (count > 0)
- ✅ API endpoints defined (count > 0)
- ✅ ER diagrams exist (count > 0)
- ✅ Navigation flow created
- ✅ Main task exists and linked
- ✅ Subtasks created with dependencies

**Error Message Example:**
```
❌ タスクを開始できません: 機能仕様が完全ではありません

不足している成果物:
  - pages
  - API endpoints
  - navigation flow

ブロッカー:
  - No pages created - frontend implementation will lack context
  - No API endpoints defined - backend implementation will lack specification
  - No navigation flow defined - page relationships unclear
```

## Why This Matters

### Workflow A (Feature) Benefits
- ✅ Complete PRD documentation
- ✅ AI-generated pages, endpoints, ER diagrams
- ✅ Clear feature tracking and progress
- ✅ Better project organization
- ✅ **NEW:** Validation prevents incomplete setup
- ✅ **NEW:** All context available before implementation starts

### Workflow B (Maintenance) Benefits
- ✅ Faster task creation (no spec overhead)
- ✅ Appropriate for simple fixes
- ✅ No unnecessary documentation
- ✅ More efficient for maintenance work

### Wrong Workflow = Problems
- ❌ Feature without spec = Poor documentation, hard to track
- ❌ Bug fix with spec = Wasted time, unnecessary complexity
- ❌ **NEW:** Starting work without validation = Missing context, incomplete implementation

## Examples in Action

### Example 1: Clear Feature Request

```
User: "Add payment processing with Stripe"

Claude: [Automatically detects FEATURE]
- Creates feature spec
- Generates PRD with payment flow
- Creates task linked to spec
- Starts work session

Result: Full documentation + implementation
```

### Example 2: Clear Maintenance Request

```
User: "Fix the bug where users can't logout"

Claude: [Automatically detects MAINTENANCE]
- Creates task directly
- Starts work session
- No feature spec created

Result: Quick fix with task tracking
```

### Example 3: Ambiguous Request

```
User: "Improve the authentication system"

Claude: "Is this a new feature requiring a feature specification
(e.g., adding new authentication methods like OAuth), or a
maintenance task (e.g., refactoring existing code, fixing
performance issues)?"

User: "It's a refactor - just cleaning up the code"

Claude: [Proceeds with MAINTENANCE workflow]
- Creates task directly
- No feature spec

Result: Efficient refactor without overhead
```

### Example 4: Another Ambiguous Request

```
User: "Add validation to the forms"

Claude: "Is this a new feature requiring a feature specification
(e.g., comprehensive validation system with custom rules), or a
maintenance task (e.g., fixing missing validation)?"

User: "It's a new feature - I want a complete validation framework
with custom validators and error messages"

Claude: [Proceeds with FEATURE workflow]
- Creates feature spec
- Generates validation system PRD
- Creates task linked to spec

Result: Full feature implementation with documentation
```

## Troubleshooting

### "Claude asked me about feature vs maintenance for a bug fix"
- Your request might have ambiguous wording
- Be more specific: "Fix X bug" vs "Improve X"

### "Claude created a feature spec for my bug fix"
- Report this as a misclassification
- In the future, be more explicit: "Fix the bug in X"

### "Claude didn't create a feature spec for my feature"
- Your request might have looked like maintenance
- Be more explicit: "Implement new feature X"

### "I'm not sure which one to choose"
- Ask yourself: "Is this adding NEW functionality?"
  - Yes → Feature (Workflow A)
  - No → Maintenance (Workflow B)

## Summary

| Aspect | Feature (A) | Maintenance (B) |
|--------|------------|----------------|
| **Purpose** | New functionality | Fix/improve existing |
| **Spec Required** | ✅ Yes | ❌ No |
| **AI PRD** | ✅ Yes | ❌ No |
| **Time** | Longer (more setup) | Faster (direct) |
| **Documentation** | Full spec + PRD | Task description only |
| **When to use** | New features | Bug fixes, refactors |

Remember: When in doubt, Claude will ask! The system is designed to help you, not confuse you.
