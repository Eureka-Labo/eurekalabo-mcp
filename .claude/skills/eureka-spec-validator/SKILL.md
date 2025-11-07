---
name: eureka-spec-validator
description: Validates feature specification completeness before starting implementation. Checks for pages, endpoints, ER diagrams, navigation flow, and linked tasks. Use when user wants to start implementing a feature or when validating spec readiness.
allowed-tools: mcp__eureka-tasks__*, Read, Grep
---

# Feature Spec Validator

Ensures all required artifacts exist before starting feature implementation, preventing incomplete specifications and missing dependencies.

## Auto-Activation Triggers

- **Keywords**: "start implementing", "begin feature", "implement spec", "start coding feature"
- **Context**: When feature spec ID is mentioned or task is linked to spec
- **Before**: Starting work session on feature-related tasks

## Validation Checklist

### 1. Feature Spec Basics
```
mcp__eureka-tasks__get_feature_spec({ specId: "spec-id" })
```

Check for:
- ✅ Spec exists and is accessible
- ✅ PRD (Product Requirements Document) is complete
- ✅ Status is not "draft" or "pending"
- ✅ Has clear objectives and success criteria

### 2. Pages Definition
```
mcp__eureka-tasks__get_feature_spec({ specId: "spec-id" })
```

Verify:
- ✅ At least one page defined
- ✅ Each page has clear purpose and user journey
- ✅ Page components are specified
- ✅ No orphaned pages (pages without navigation)

### 3. API Endpoints
```
mcp__eureka-tasks__get_feature_spec({ specId: "spec-id" })
```

Validate:
- ✅ Required endpoints are documented
- ✅ Request/response schemas defined
- ✅ Authentication requirements specified
- ✅ Error handling documented

### 4. Data Model (ER Diagrams)
```
mcp__eureka-tasks__get_feature_spec({ specId: "spec-id" })
```

Check:
- ✅ Entity relationships defined
- ✅ Database schema is clear
- ✅ Foreign keys and constraints documented
- ✅ Data validation rules specified

### 5. Navigation Flow
```
mcp__eureka-tasks__get_navigation_flow({ flowId: "flow-id" })
mcp__eureka-tasks__get_project_navigation_overview({ projectId: "project-id" })
```

Ensure:
- ✅ Navigation flow diagram exists
- ✅ All pages are connected in flow
- ✅ User journey is complete (no dead ends)
- ✅ Edge cases and error paths defined

### 6. Task Breakdown
```
mcp__eureka-tasks__get_enhanced_spec_progress({ specId: "spec-id" })
```

Verify:
- ✅ Main tasks created and linked to spec
- ✅ Subtasks generated (frontend, backend, testing)
- ✅ Task dependencies identified
- ✅ Estimated hours assigned
- ✅ No circular dependencies

### 7. Comprehensive Readiness Check
```
mcp__eureka-tasks__validate_feature_spec_readiness({ specId: "spec-id" })
```

This performs all validations above in one call.

## Validation Process

### Step 1: Get Current Context
```javascript
// If task is active
const sessions = await mcp__eureka-tasks__get_active_sessions();
const currentTask = sessions.activeSessions[0];

// Get spec ID from task
const task = await mcp__eureka-tasks__get_task({ taskId: currentTask.taskId });
const specId = task.featureSpecs[0]?.id;
```

### Step 2: Run Comprehensive Validation
```javascript
const validation = await mcp__eureka-tasks__validate_feature_spec_readiness({
  specId: specId
});
```

### Step 3: Report Results

**If validation passes** ✅:
```
✅ Feature Spec Validation Passed

Ready to implement: {spec.title}

Completeness:
✓ PRD: Complete with {sections} sections
✓ Pages: {pageCount} pages defined
✓ Endpoints: {endpointCount} endpoints documented
✓ Data Model: {entityCount} entities with relationships
✓ Navigation: Flow diagram complete
✓ Tasks: {taskCount} tasks with {subtaskCount} subtasks

🚀 All systems go! Safe to start implementation.
```

**If validation fails** ❌:
```
⚠️ Feature Spec Validation Failed

Blocking Issues for: {spec.title}

Missing Components:
❌ {missing.pages.length} pages need definition
❌ {missing.endpoints.length} endpoints undocumented
❌ Data model incomplete: {missing.entities} entities missing
❌ Navigation flow: {orphanedPages.length} orphaned pages
❌ Tasks: {missingTasks} tasks need creation

🛑 Cannot start implementation safely.

**RECOMMENDED ACTIONS:**

1. Complete missing pages:
   mcp__eureka-tasks__create_page(...)

2. Document endpoints:
   mcp__eureka-tasks__create_endpoint(...)

3. Define data model:
   mcp__eureka-tasks__create_entity(...)

4. Create navigation flow:
   mcp__eureka-tasks__create_navigation_flow(...)

5. Generate subtasks:
   mcp__eureka-tasks__create_subtasks(...)

Would you like me to help complete these missing components?
```

## Integration with Existing Skills

### Works With
- **eureka-task-coding**: Validates before starting work session
- **eureka-session-recovery**: Checks spec validity when resuming

### Workflow Integration
```
User: "Let's implement the user authentication feature"

1. eureka-task-coding activates
2. Creates/finds task linked to auth spec
3. 🔍 eureka-spec-validator activates (THIS SKILL)
4. Validates spec completeness
5. If pass → start_work_on_task
6. If fail → prompt to complete spec first
```

## Error Handling

### Spec Not Found
```
⚠️ No feature specification linked to this task.

This appears to be a maintenance task (bug fix/refactor).
Skipping spec validation - proceeding with work session.
```

### Partial Spec
```
⚠️ Feature spec is incomplete but has basics.

You can proceed with RISK:
- Some components may be undefined
- Integration points unclear
- Testing criteria incomplete

Recommendation: Complete spec first for safer implementation.

Proceed anyway? (Requires explicit user confirmation)
```

### API Unavailable
```
❌ Cannot validate spec - API connection failed.

Ensure:
1. .env file has EUREKA_API_KEY
2. API server is accessible
3. Network connection is active

Skipping validation - proceed at your own risk.
```

## Examples

### Example 1: Complete Spec
```
User: "Start implementing the payment integration feature"

🔍 Validating feature spec: Payment Integration

✅ Validation Complete (3.2s)

Ready Components:
✓ PRD: 8 sections with clear requirements
✓ Pages: 4 pages (Checkout, Payment, Confirmation, Failed)
✓ Endpoints: 6 REST endpoints + 2 webhooks
✓ Data Model: 5 entities (Payment, Transaction, Receipt, Refund, PaymentMethod)
✓ Navigation: Flow complete with error handling
✓ Tasks: 3 main tasks, 9 subtasks (3 frontend, 3 backend, 3 testing)

🚀 Starting work session on task "決済フロー実装"...
```

### Example 2: Incomplete Spec
```
User: "Let's build the notification system"

🔍 Validating feature spec: Notification System

❌ Spec Incomplete - Cannot Start Implementation

Missing:
❌ No navigation flow defined
❌ WebSocket endpoint missing
❌ NotificationPreference entity undefined
❌ 0 subtasks created (need frontend, backend, testing breakdown)

🛠️ I can help complete these. Would you like me to:
1. Generate navigation flow based on pages?
2. Define missing endpoints?
3. Create subtasks for implementation?
4. Or would you prefer to design these yourself?
```

## Configuration

### Strictness Levels

**Strict Mode** (default):
- Blocks implementation if any component missing
- Requires 100% completeness

**Permissive Mode**:
- Allows implementation with warnings
- Minimum: PRD + 1 page + 1 endpoint

**Advisory Mode**:
- Never blocks, only warns
- Useful for prototyping

### Bypass Option

User can override with explicit command:
```
User: "Skip validation and start anyway"
→ Skill acknowledges but warns of risks
```

## Best Practices

1. **Run early**: Validate immediately after linking task to spec
2. **Iterative completion**: Fix one category at a time
3. **Team alignment**: Share validation results before sprint planning
4. **Update during development**: Re-validate if requirements change

## Performance

- Average validation: 2-5 seconds
- Caches spec data for 5 minutes
- Parallel API calls for efficiency
- Progressive results (shows what's validated as it checks)
