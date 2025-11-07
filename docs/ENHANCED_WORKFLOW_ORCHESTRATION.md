# Enhanced Feature Spec Workflow Orchestration

## Problem Statement

Currently, the feature spec creation workflow allows Claude to start work before all necessary artifacts (pages, endpoints, ER diagrams, navigation flows, subtasks) are fully generated. This leads to:

- ❌ Incomplete implementation context
- ❌ Missing navigation flows
- ❌ No subtask structure
- ❌ Premature `start_work_on_task()` calls

## Solution: Complete Artifact Generation Before Work

### Principle: "Setup Everything Before Implementation"

All artifacts must be created and validated before ANY `start_work_on_task()` call.

---

## Enhanced Workflow

### Phase 1: Feature Spec Creation (AI-Powered)

```typescript
// MCP Tool: start_feature_development
const developmentSession = await start_feature_development({
  projectId: string,
  prompt: "ユーザー認証機能を追加",
  figmaUrl?: string
});

// Returns one of:
// 1. existing_specs_found → User selects existing or creates new
// 2. spec_loaded → Resume existing spec
// 3. ready_to_create → Proceed to spec creation
```

### Phase 2: Complete Spec Generation

```typescript
// MCP Tool: create_feature_spec
// This should be enhanced to generate ALL artifacts atomically
const fullSpec = await create_feature_spec({
  projectId: string,
  prompt: string,
  figmaUrl?: string,
  clarifications?: Record<string, any>,

  // NEW: Ensure all generation flags are TRUE
  generatePRD: true,
  generateImplementationPlan: true,
  generatePages: true,
  generateEndpoints: true,        // NEW
  generateERDiagrams: true,       // NEW
  generateNavigationFlow: true,   // NEW
  generateSubtasks: true          // NEW
});

// MUST return:
{
  featureSpec: {
    id: string,
    title: string,
    prdDocument: string,          // ✅ REQUIRED
    implementationPlan: object,   // ✅ REQUIRED
    status: "DRAFT"
  },

  pages: ProjectPage[],           // ✅ REQUIRED (length > 0)
  endpoints: APIEndpoint[],       // ✅ REQUIRED (length > 0)
  erDiagrams: ERDiagram[],        // ✅ REQUIRED (length > 0)

  navigationFlow: {               // ✅ REQUIRED
    id: string,
    nodes: FlowNode[],
    edges: FlowEdge[]
  },

  taskBreakdown: {                // ✅ REQUIRED
    mainTask: TaskTemplate,
    subtasks: SubtaskTemplate[]
  }
}
```

### Phase 3: Task Structure Creation

```typescript
// Step 1: Create main task
const mainTask = await create_task({
  title: fullSpec.taskBreakdown.mainTask.title,
  description: fullSpec.taskBreakdown.mainTask.description,
  priority: "HIGH"
});

// Step 2: Link main task to feature spec
await link_task_to_feature_spec({
  taskId: mainTask.id,
  featureSpecId: fullSpec.featureSpec.id,
  purpose: "メイン実装タスク"
});

// Step 3: Create subtasks with auto-board routing
const subtasks = await create_subtasks({
  featureSpecId: fullSpec.featureSpec.id,
  mainTaskId: mainTask.id,
  taskTypes: ['BACKEND_SUBTASK', 'FRONTEND_SUBTASK', 'TESTING_SUBTASK'],
  estimatedHours: fullSpec.taskBreakdown.estimatedHours,
  priority: "HIGH"
});

// Returns:
{
  success: true,
  subtasks: [
    {
      taskId: "backend-id",
      taskType: "BACKEND_SUBTASK",
      boardId: "backend-board-id",      // Auto-routed
      linkedEndpoints: [...],
      linkedERDiagrams: [...],
      dependencies: []
    },
    {
      taskId: "frontend-id",
      taskType: "FRONTEND_SUBTASK",
      boardId: "frontend-board-id",     // Auto-routed
      linkedPages: [...],
      dependencies: ["backend-id"]      // Blocked by backend
    },
    {
      taskId: "testing-id",
      taskType: "TESTING_SUBTASK",
      boardId: "qa-board-id",           // Auto-routed
      dependencies: ["backend-id", "frontend-id"]
    }
  ]
}
```

### Phase 4: Validation Before Work

```typescript
// NEW MCP Tool: validate_feature_spec_readiness
const readiness = await validate_feature_spec_readiness({
  featureSpecId: string
});

// Returns:
{
  ready: boolean,
  checklist: {
    featureSpec: { exists: true, hasPRD: true, hasPlan: true },
    pages: { count: 3, allValid: true },
    endpoints: { count: 5, allValid: true },
    erDiagrams: { count: 2, allValid: true },
    navigationFlow: { exists: true, hasNodes: true, hasEdges: true },
    tasks: {
      mainTask: { exists: true, linked: true },
      subtasks: { count: 3, allLinked: true, dependenciesSet: true }
    }
  },
  missingArtifacts: [],
  blockers: []
}
```

### Phase 5: Work Execution (Only After Validation)

```typescript
// Only allow start_work_on_task if validation passes
if (readiness.ready) {
  // Start backend first (no dependencies)
  await start_work_on_task({ taskId: subtasks.backend.taskId });

  // ... implementation ...

  await complete_task_work({
    taskId: subtasks.backend.taskId,
    summary: "Backend API完了"
  });

  // Then frontend (depends on backend)
  await start_work_on_task({ taskId: subtasks.frontend.taskId });

  // ... implementation ...

  await complete_task_work({
    taskId: subtasks.frontend.taskId,
    summary: "Frontend UI完了"
  });
} else {
  throw new Error(`Cannot start work: Missing artifacts - ${readiness.missingArtifacts.join(', ')}`);
}
```

---

## Backend API Enhancements Needed

### 1. Enhanced `/projects/:projectId/specs` Endpoint

```typescript
// POST /api/v1/projects/:projectId/specs
// Current behavior: Creates spec + optionally generates PRD/Plan/Pages
// NEW behavior: Creates spec + ALL artifacts atomically

interface CreateFullSpecRequest {
  title: string;
  description: string;
  priority: Priority;
  figmaUrl?: string;
  clarifications?: Record<string, any>;

  // NEW: All generation flags default to TRUE
  generatePRD?: boolean;              // default: true
  generateImplementationPlan?: boolean; // default: true
  generatePages?: boolean;             // default: true
  generateEndpoints?: boolean;         // default: true
  generateERDiagrams?: boolean;        // default: true
  generateNavigationFlow?: boolean;    // default: true
  generateSubtasks?: boolean;          // default: true
}

interface CreateFullSpecResponse {
  featureSpec: FeatureSpec;
  pages: ProjectPage[];
  endpoints: APIEndpoint[];
  erDiagrams: ERDiagram[];
  navigationFlow: NavigationFlow;
  taskBreakdown: {
    mainTask: TaskTemplate;
    subtasks: SubtaskTemplate[];
    estimatedHours: number;
  };
  validationStatus: {
    ready: boolean;
    missingArtifacts: string[];
  };
}
```

### 2. New `/specs/:specId/validate-readiness` Endpoint

```typescript
// GET /api/v1/specs/:specId/validate-readiness
// Checks if all artifacts are complete before allowing work to start

interface ValidateReadinessResponse {
  ready: boolean;
  checklist: {
    featureSpec: { exists: boolean; hasPRD: boolean; hasPlan: boolean };
    pages: { count: number; allValid: boolean; list: string[] };
    endpoints: { count: number; allValid: boolean; list: string[] };
    erDiagrams: { count: number; allValid: boolean; list: string[] };
    navigationFlow: { exists: boolean; hasNodes: boolean; hasEdges: boolean };
    tasks: {
      mainTask: { exists: boolean; linked: boolean };
      subtasks: { count: number; allLinked: boolean; dependenciesSet: boolean };
    };
  };
  missingArtifacts: string[];
  blockers: string[];
}
```

---

## MCP Tool Enhancements

### 1. Enhanced `create_feature_spec` Tool

```typescript
export async function create_feature_spec(args: {
  projectId: string;
  prompt: string;
  figmaUrl?: string;
  clarifications?: Record<string, any>;
}): Promise<{
  featureSpec: any;
  pages: any[];
  endpoints: any[];
  erDiagrams: any[];
  navigationFlow: any;
  taskBreakdown: any;
  validationStatus: any;
}> {
  const apiClient = getAPIClient();
  await apiClient.initialize();

  const projectId = apiClient.getProjectId();

  // Call enhanced backend API with all generation flags TRUE
  const response = await apiClient.post(`/api/v1/projects/${projectId}/specs`, {
    title: args.prompt.substring(0, 100),
    description: args.prompt,
    priority: 'MEDIUM',
    figmaUrl: args.figmaUrl,
    clarifications: args.clarifications || {},

    // Force all generation
    generatePRD: true,
    generateImplementationPlan: true,
    generatePages: true,
    generateEndpoints: true,
    generateERDiagrams: true,
    generateNavigationFlow: true,
    generateSubtasks: true
  });

  const result = response.data.data || response.data;

  // Validate completeness
  if (!result.validationStatus.ready) {
    throw new Error(
      `Feature spec incomplete. Missing: ${result.validationStatus.missingArtifacts.join(', ')}`
    );
  }

  return result;
}
```

### 2. New `validate_feature_spec_readiness` Tool

```typescript
export async function validate_feature_spec_readiness(args: {
  featureSpecId: string;
}): Promise<{
  ready: boolean;
  checklist: any;
  missingArtifacts: string[];
  blockers: string[];
}> {
  const apiClient = getAPIClient();
  await apiClient.initialize();

  const response = await apiClient.get(
    `/api/v1/specs/${args.featureSpecId}/validate-readiness`
  );

  return response.data.data || response.data;
}
```

### 3. Enhanced `start_work_on_task` with Validation

```typescript
export async function start_work_on_task(args: {
  taskId: string;
}): Promise<any> {
  // ... existing code ...

  // NEW: Check feature spec readiness
  const taskFeatureSpec = await getTaskFeatureSpecLink(args.taskId);
  if (taskFeatureSpec) {
    const readiness = await validate_feature_spec_readiness({
      featureSpecId: taskFeatureSpec.featureSpecId
    });

    if (!readiness.ready) {
      throw new Error(
        `Cannot start work on task. Feature spec is not ready.\n` +
        `Missing artifacts: ${readiness.missingArtifacts.join(', ')}\n` +
        `Blockers: ${readiness.blockers.join(', ')}`
      );
    }

    // Check dependencies
    if (taskFeatureSpec.dependencies?.length > 0) {
      const dependencyTasks = await getTasks(taskFeatureSpec.dependencies);
      const incompleteDeps = dependencyTasks.filter(
        t => t.status !== "COMPLETED" && t.status !== "done"
      );

      if (incompleteDeps.length > 0) {
        throw new Error(
          `Cannot start work. The following dependency tasks are incomplete:\n` +
          incompleteDeps.map(t => `- ${t.title} (${t.status})`).join('\n')
        );
      }
    }
  }

  // ... continue with existing work session logic ...
}
```

---

## Claude Code Workflow Instructions

### When Creating Feature Specs, Claude MUST:

1. ✅ **Create complete feature spec** with ALL artifacts
   ```
   create_feature_spec({ prompt, figmaUrl, clarifications })
   ```

2. ✅ **Verify all artifacts generated**
   ```
   - pages.length > 0
   - endpoints.length > 0
   - erDiagrams.length > 0
   - navigationFlow exists
   - taskBreakdown exists
   ```

3. ✅ **Create main task and link to spec**
   ```
   mainTask = create_task(...)
   link_task_to_feature_spec({ taskId, featureSpecId, purpose })
   ```

4. ✅ **Create subtasks with auto-board routing**
   ```
   subtasks = create_subtasks({
     featureSpecId,
     mainTaskId,
     taskTypes: ['BACKEND_SUBTASK', 'FRONTEND_SUBTASK', 'TESTING_SUBTASK']
   })
   ```

5. ✅ **Validate readiness before starting work**
   ```
   readiness = validate_feature_spec_readiness({ featureSpecId })
   if (!readiness.ready) {
     throw error with missing artifacts
   }
   ```

6. ✅ **Start work ONLY after validation passes**
   ```
   start_work_on_task({ taskId: backend_subtask_id })
   ```

### Claude Should NEVER:

- ❌ Call `start_work_on_task()` before all artifacts exist
- ❌ Create feature spec without pages
- ❌ Create feature spec without endpoints
- ❌ Create feature spec without ER diagrams
- ❌ Create feature spec without navigation flow
- ❌ Create main task without creating subtasks
- ❌ Skip validation before starting work

---

## Example: Complete Workflow Execution

```typescript
// 1. User request
User: "Add user profile management with avatar upload"

// 2. Claude checks for existing specs
const session = await start_feature_development({
  projectId: "xxx",
  prompt: "ユーザープロフィール管理（アバターアップロード機能）"
});

// session.status === 'ready_to_create'

// 3. Claude creates COMPLETE feature spec
const fullSpec = await create_feature_spec({
  projectId: "xxx",
  prompt: "ユーザープロフィール管理機能（アバターアップロード含む）",
  clarifications: {
    avatarStorage: "minio",
    maxFileSize: "5MB",
    allowedFormats: ["jpg", "png"]
  }
});

// fullSpec includes:
// ✅ featureSpec (with PRD, implementation plan)
// ✅ pages: [Profile Page, Settings Page] (2 pages)
// ✅ endpoints: [PUT /users/:id, POST /users/:id/avatar, GET /users/:id] (3 endpoints)
// ✅ erDiagrams: [User schema with avatarUrl] (1 diagram)
// ✅ navigationFlow: { nodes: [...], edges: [...] }
// ✅ taskBreakdown: { mainTask, subtasks: [backend, frontend, testing] }

// 4. Claude creates main task
const mainTask = await create_task({
  title: "ユーザープロフィール管理機能の実装",
  description: fullSpec.featureSpec.prdDocument.substring(0, 500)
});

await link_task_to_feature_spec({
  taskId: mainTask.id,
  featureSpecId: fullSpec.featureSpec.id,
  purpose: "プロフィール管理のメイン実装タスク"
});

// 5. Claude creates subtasks
const subtasks = await create_subtasks({
  featureSpecId: fullSpec.featureSpec.id,
  mainTaskId: mainTask.id,
  taskTypes: ['BACKEND_SUBTASK', 'FRONTEND_SUBTASK', 'TESTING_SUBTASK'],
  estimatedHours: fullSpec.taskBreakdown.estimatedHours,
  priority: "HIGH"
});

// subtasks.subtasks[0] = Backend (BACKEND board, no deps)
// subtasks.subtasks[1] = Frontend (FRONTEND board, depends on backend)
// subtasks.subtasks[2] = Testing (QA board, depends on both)

// 6. Claude validates readiness
const readiness = await validate_feature_spec_readiness({
  featureSpecId: fullSpec.featureSpec.id
});

console.log(readiness);
// {
//   ready: true,
//   checklist: {
//     featureSpec: { exists: true, hasPRD: true, hasPlan: true },
//     pages: { count: 2, allValid: true, list: ["Profile Page", "Settings Page"] },
//     endpoints: { count: 3, allValid: true, list: ["PUT /users/:id", ...] },
//     erDiagrams: { count: 1, allValid: true, list: ["User"] },
//     navigationFlow: { exists: true, hasNodes: true, hasEdges: true },
//     tasks: {
//       mainTask: { exists: true, linked: true },
//       subtasks: { count: 3, allLinked: true, dependenciesSet: true }
//     }
//   },
//   missingArtifacts: [],
//   blockers: []
// }

// 7. Claude starts work (ONLY NOW)
await start_work_on_task({ taskId: subtasks.subtasks[0].taskId });
// ✅ Validation passed
// ✅ No dependencies for backend
// ✅ Work session started

// ... Claude implements backend ...

await complete_task_work({
  taskId: subtasks.subtasks[0].taskId,
  summary: "Backend API完了"
});

// 8. Claude starts frontend (after backend complete)
await start_work_on_task({ taskId: subtasks.subtasks[1].taskId });
// ✅ Validation passed
// ✅ Backend dependency complete
// ✅ Work session started

// ... Claude implements frontend ...

await complete_task_work({
  taskId: subtasks.subtasks[1].taskId,
  summary: "Frontend UI完了"
});
```

---

## Implementation Checklist

### Backend API (api/src)
- [ ] Update `/projects/:projectId/specs` to generate all artifacts
- [ ] Add `/specs/:specId/validate-readiness` endpoint
- [ ] Update `featureSpecService.createSpec()` to generate endpoints
- [ ] Update `featureSpecService.createSpec()` to generate ER diagrams
- [ ] Update `featureSpecService.createSpec()` to generate navigation flow
- [ ] Update `featureSpecService.createSpec()` to generate task breakdown
- [ ] Add validation service for readiness checks

### MCP Server (mcp-server/src)
- [ ] Update `create_feature_spec()` to enforce all generation flags
- [ ] Add `validate_feature_spec_readiness()` tool
- [ ] Update `start_work_on_task()` to validate readiness
- [ ] Update `start_work_on_task()` to check dependencies
- [ ] Add clear error messages for validation failures

### Documentation
- [ ] Update `WORKFLOW_CLASSIFICATION.md` with new workflow
- [ ] Add examples showing complete artifact generation
- [ ] Document validation requirements
- [ ] Add troubleshooting guide for missing artifacts

---

## Benefits

### For Users
- ✅ **Complete Context**: All artifacts available from the start
- ✅ **Clear Progress**: See all pages, endpoints, diagrams upfront
- ✅ **No Surprises**: Everything planned before implementation
- ✅ **Better Planning**: Understand full scope immediately

### For Claude
- ✅ **Clear Guidance**: Must generate all artifacts before starting
- ✅ **Validation Gates**: Cannot start work without validation passing
- ✅ **Structured Workflow**: Clear steps from spec to implementation
- ✅ **Error Prevention**: Catches missing artifacts early

### For Project
- ✅ **Complete Documentation**: Full spec with all artifacts
- ✅ **Better Tracking**: Task hierarchy with dependencies
- ✅ **Easier Maintenance**: Navigation flows show relationships
- ✅ **Consistent Quality**: Validation ensures completeness

---

## Error Messages

### Missing Artifacts Error
```
❌ Cannot start work on task: Feature spec is not ready

Missing artifacts:
- 0 pages found (expected > 0)
- 0 endpoints found (expected > 0)
- Navigation flow not created

Please complete feature spec setup:
1. Create pages with create_feature_spec()
2. Create endpoints with create_feature_spec()
3. Create navigation flow with create_navigation_flow()
4. Validate with validate_feature_spec_readiness()
```

### Dependency Blocker Error
```
❌ Cannot start work on task: Frontend Implementation

The following dependency tasks are incomplete:
- Backend API Implementation (IN_PROGRESS - 60% complete)

Please complete dependency tasks first, or update task dependencies.
```

---

## Summary

This enhanced workflow ensures that **all necessary artifacts are created and validated** before any implementation work begins. By enforcing complete artifact generation and adding validation gates, we prevent premature work starts and ensure Claude has full context for implementation.

**Key Principle**: Setup Everything Before Implementation
