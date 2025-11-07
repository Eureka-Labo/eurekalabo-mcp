# Feature-Spec-Driven Architecture Design

## Overview

Complete architecture for feature specification-driven development with frontend/backend task separation, navigation flow management, and progress tracking.

## 1. Task Hierarchy & Board Separation

### Task Structure

```
Main Task (Feature Implementation)
├─ TaskFeatureSpec Link (with priority, type: MAIN)
├─ Frontend Subtask
│  ├─ boardId → Frontend Board (BoardType.FRONTEND)
│  ├─ TaskFeatureSpec Link (type: FRONTEND_SUBTASK)
│  ├─ Links to: ProjectPage[]
│  └─ Dependencies: Backend API completion
└─ Backend Subtask
   ├─ boardId → Backend Board (BoardType.BACKEND)
   ├─ TaskFeatureSpec Link (type: BACKEND_SUBTASK)
   ├─ Links to: APIEndpoint[], ERDiagram[]
   └─ Must complete before: Frontend implementation
```

### Board Type Routing

```typescript
enum BoardType {
  FRONTEND   // UI implementation tasks
  BACKEND    // API/service implementation
  MOBILE     // Mobile app tasks
  DATABASE   // Schema/migration tasks
  DEVOPS     // Infrastructure tasks
  DESIGN     // Design system tasks
  QA         // Testing tasks
  GENERAL    // Miscellaneous tasks
}
```

**Automatic Board Selection**:
1. Main task → Use git repository board or GENERAL board
2. Frontend subtask → Auto-route to FRONTEND board
3. Backend subtask → Auto-route to BACKEND board

## 2. Enhanced TaskFeatureSpec Schema

### Current Schema (task.prisma line 455-472)
```prisma
model TaskFeatureSpec {
  id            String   @id @default(cuid())
  taskId        String
  featureSpecId String
  purpose       String?
  addedBy       String
  createdAt     DateTime @default(now())
  // ... relations
}
```

### Proposed Enhancement
```prisma
model TaskFeatureSpec {
  id            String             @id @default(cuid())
  taskId        String
  featureSpecId String
  purpose       String?            @db.Text
  addedBy       String

  // NEW FIELDS
  taskType      TaskFeatureType    @default(MAIN)
  priority      Priority           @default(MEDIUM)
  phase         ImplementationPhase?
  estimatedHours Float?
  dependencies  String[]           // Array of taskId that must complete first

  // Progress tracking
  progressPercent Int              @default(0)
  startedAt      DateTime?
  completedAt    DateTime?

  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt

  // Relations
  task          Task               @relation(fields: [taskId], references: [id], onDelete: Cascade)
  featureSpec   FeatureSpec        @relation("TaskFeatureSpecs", fields: [featureSpecId], references: [id], onDelete: Cascade)
  addedByUser   User               @relation("TaskFeatureSpecAdder", fields: [addedBy], references: [id])

  @@unique([taskId, featureSpecId])
  @@index([taskId])
  @@index([featureSpecId])
  @@index([taskType])
  @@index([phase])
}

enum TaskFeatureType {
  MAIN              // Main feature task
  FRONTEND_SUBTASK  // Frontend implementation subtask
  BACKEND_SUBTASK   // Backend implementation subtask
  DATABASE_SUBTASK  // Database migration subtask
  TESTING_SUBTASK   // QA testing subtask
  DEPLOYMENT_SUBTASK // Deployment preparation subtask
}
```

## 3. Navigation Flow Management System

### Database Schema Addition

```prisma
// Add to existing schema
model PageNavigationFlow {
  id          String   @id @default(cuid())
  projectId   String
  name        String   // "Main User Flow", "Admin Dashboard Flow"
  description String?  @db.Text

  // Flow definition
  nodes       Json     // PageFlowNode[]
  edges       Json     // PageFlowEdge[]

  // Metadata
  isDefault   Boolean  @default(false)
  layoutData  Json?    // Positions for diagram rendering

  // Relations
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  createdById String
  createdBy   User     @relation("FlowCreator", fields: [createdById], references: [id])

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([projectId])
  @@index([isDefault])
}

model PageFlowNode {
  id            String      @id @default(cuid())
  flowId        String
  pageId        String

  // Position in diagram
  positionX     Float
  positionY     Float

  // Node metadata
  nodeType      FlowNodeType @default(PAGE)
  label         String?
  metadata      Json?        // Custom data

  // Relations
  flow          PageNavigationFlow @relation(fields: [flowId], references: [id], onDelete: Cascade)
  page          ProjectPage        @relation(fields: [pageId], references: [id], onDelete: Cascade)

  // Edges
  outgoingEdges PageFlowEdge[] @relation("FromNode")
  incomingEdges PageFlowEdge[] @relation("ToNode")

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([flowId])
  @@index([pageId])
}

model PageFlowEdge {
  id          String       @id @default(cuid())
  flowId      String
  fromNodeId  String
  toNodeId    String

  // Edge metadata
  trigger     EdgeTrigger  @default(CLICK)
  label       String?
  condition   String?      // "if user.role === 'admin'"
  metadata    Json?

  // Relations
  flow        PageNavigationFlow @relation(fields: [flowId], references: [id], onDelete: Cascade)
  fromNode    PageFlowNode       @relation("FromNode", fields: [fromNodeId], references: [id], onDelete: Cascade)
  toNode      PageFlowNode       @relation("ToNode", fields: [toNodeId], references: [id], onDelete: Cascade)

  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([flowId])
  @@index([fromNodeId])
  @@index([toNodeId])
}

enum FlowNodeType {
  PAGE          // Regular page
  MODAL         // Modal dialog
  REDIRECT      // External redirect
  CONDITION     // Conditional branch
  START         // Flow entry point
  END           // Flow exit point
}

enum EdgeTrigger {
  CLICK         // User click/tap
  SUBMIT        // Form submission
  AUTO_REDIRECT // Automatic redirect
  CONDITION     // Conditional navigation
  BACK          // Browser back
  AUTH_REQUIRED // Authentication check
}
```

### Navigation Flow JSON Structure

```typescript
interface PageFlowNode {
  id: string;
  pageId: string;
  type: FlowNodeType;
  label?: string;
  position: { x: number; y: number };
  metadata?: {
    requiredAuth?: boolean;
    requiredRoles?: string[];
    endpoints?: string[]; // API endpoints used
    entities?: string[];  // Database entities accessed
  };
}

interface PageFlowEdge {
  id: string;
  from: string; // nodeId
  to: string;   // nodeId
  trigger: EdgeTrigger;
  label?: string;
  condition?: string;
  metadata?: {
    params?: Record<string, string>;
    queryParams?: Record<string, string>;
  };
}

interface NavigationFlow {
  id: string;
  name: string;
  nodes: PageFlowNode[];
  edges: PageFlowEdge[];
  layoutData?: {
    zoom: number;
    panX: number;
    panY: number;
  };
}
```

## 4. Complete Workflow

### Feature Development Workflow

```
1. Feature Spec Creation
   ↓
   start_feature_development({ prompt: "User authentication" })
   ↓
   create_feature_spec({
     prompt: "ユーザー認証機能",
     clarifications: { ... }
   })
   ↓
   AI generates:
   - PRD document
   - ProjectPage[] (Login, Register, Profile)
   - APIEndpoint[] (/auth/login, /auth/register)
   - ERDiagram[] (User, Session tables)
   - NavigationFlow (Auth flow diagram)

2. Main Task Creation
   ↓
   create_task({
     title: "ユーザー認証機能の実装",
     description: "JWT認証システム全体の実装"
   })
   ↓
   link_task_to_feature_spec({
     taskId: "main-task-id",
     featureSpecId: "spec-id",
     taskType: "MAIN",
     priority: "HIGH",
     phase: "PLANNING"
   })

3. Automatic Subtask Generation
   ↓
   create_frontend_backend_subtasks({
     mainTaskId: "main-task-id",
     featureSpecId: "spec-id",
     pages: [...],      // From FeatureSpec
     endpoints: [...]   // From FeatureSpec
   })
   ↓
   Creates:
   a) Backend Subtask
      - Board: BACKEND board
      - Links: APIEndpoint[], ERDiagram[]
      - Dependencies: []
      - Phase: BACKEND_IMPL

   b) Frontend Subtask
      - Board: FRONTEND board
      - Links: ProjectPage[]
      - Dependencies: [backend-subtask-id]
      - Phase: FRONTEND_IMPL

4. Navigation Flow Generation
   ↓
   create_navigation_flow({
     projectId: "xxx",
     name: "Authentication Flow",
     pages: [...],
     autoGenerate: true
   })
   ↓
   AI analyzes:
   - Page relationships from FeatureSpec
   - Common navigation patterns
   - Auth requirements
   ↓
   Generates PageNavigationFlow with nodes and edges

5. Work Execution
   ↓
   // Start backend first
   start_work_on_task({ taskId: "backend-subtask-id" })
   → Validates feature spec link
   → Checks dependencies (none for backend)
   → Starts work session

   complete_task_work({ taskId: "backend-subtask-id", ... })
   → Updates TaskFeatureSpec progress
   → Marks backend subtask complete
   → Updates main task progress (50%)

   // Then frontend
   start_work_on_task({ taskId: "frontend-subtask-id" })
   → Validates feature spec link
   → Checks dependencies (backend complete? ✓)
   → Starts work session

   complete_task_work({ taskId: "frontend-subtask-id", ... })
   → Updates TaskFeatureSpec progress
   → Marks frontend subtask complete
   → Updates main task progress (100%)
```

## 5. MCP Tool Updates

### New Tools Needed

```typescript
// 1. Create subtasks with board routing
create_frontend_backend_subtasks({
  mainTaskId: string;
  featureSpecId: string;
  pages?: string[];      // Optional: specific pages
  endpoints?: string[];  // Optional: specific endpoints
  autoGenerate?: boolean; // Auto-create based on FeatureSpec
})

// 2. Navigation flow management
create_navigation_flow({
  projectId: string;
  name: string;
  pages: string[];
  autoGenerate?: boolean;
})

get_navigation_flow({
  projectId: string;
  flowId?: string; // Get specific flow or default
})

update_navigation_flow({
  flowId: string;
  nodes?: PageFlowNode[];
  edges?: PageFlowEdge[];
})

// 3. Enhanced task linking
link_task_to_feature_spec({
  taskId: string;
  featureSpecId: string;
  taskType: TaskFeatureType;
  priority: Priority;
  phase?: ImplementationPhase;
  dependencies?: string[];
})

// 4. Progress tracking
get_feature_implementation_progress({
  featureSpecId: string;
})
// Returns:
// {
//   mainTask: { progress: 75%, status: "IN_PROGRESS" },
//   subtasks: {
//     backend: { progress: 100%, status: "COMPLETED" },
//     frontend: { progress: 50%, status: "IN_PROGRESS" }
//   },
//   overallProgress: 75%
// }
```

## 6. Enhanced FeatureSpec Generation

### AI Generation Flow

```typescript
create_feature_spec({
  prompt: "User authentication with email/password",
  clarifications: {
    authMethod: "jwt",
    socialLogin: false,
    twoFactor: true
  }
})

// AI generates comprehensive spec:
{
  featureSpec: {
    title: "ユーザー認証機能",
    prdDocument: "# PRD...",
    implementationPlan: {
      phases: [...],
      estimatedHours: 40
    }
  },

  pages: [
    {
      name: "Login Page",
      path: "/login",
      category: "AUTH",
      endpoints: ["/api/v1/auth/login"],
      entities: ["User", "Session"]
    },
    {
      name: "Register Page",
      path: "/register",
      category: "AUTH"
    }
  ],

  endpoints: [
    {
      path: "/api/v1/auth/login",
      method: "POST",
      requiresAuth: false
    },
    {
      path: "/api/v1/auth/logout",
      method: "POST",
      requiresAuth: true
    }
  ],

  erDiagrams: [...],

  // NEW: Auto-generated navigation flow
  navigationFlow: {
    name: "Authentication Flow",
    nodes: [
      { id: "n1", pageId: "login-page-id", type: "START" },
      { id: "n2", pageId: "dashboard-page-id", type: "PAGE" },
      { id: "n3", pageId: "register-page-id", type: "PAGE" }
    ],
    edges: [
      {
        from: "n1",
        to: "n2",
        trigger: "SUBMIT",
        label: "Successful login"
      },
      {
        from: "n1",
        to: "n3",
        trigger: "CLICK",
        label: "Create account"
      }
    ]
  },

  // NEW: Suggested task breakdown
  taskBreakdown: {
    mainTask: {
      title: "ユーザー認証機能の実装",
      priority: "HIGH"
    },
    backendSubtask: {
      title: "認証API実装",
      estimatedHours: 20,
      endpoints: ["POST /auth/login", "POST /auth/register"],
      phase: "BACKEND_IMPL"
    },
    frontendSubtask: {
      title: "認証UI実装",
      estimatedHours: 15,
      pages: ["Login Page", "Register Page"],
      dependencies: ["backend"],
      phase: "FRONTEND_IMPL"
    },
    testingSubtask: {
      title: "認証機能テスト",
      estimatedHours: 5,
      dependencies: ["backend", "frontend"],
      phase: "TESTING"
    }
  }
}
```

## 7. Project Detail Integration

### Project Navigation Overview

```typescript
// Get complete project navigation
get_project_navigation_overview({
  projectId: string
})

// Returns:
{
  flows: PageNavigationFlow[],
  statistics: {
    totalPages: 25,
    totalFlows: 3,
    pagesByCategory: {
      AUTH: 3,
      DASHBOARD: 5,
      ADMIN: 7,
      SETTINGS: 4
    },
    implementationStatus: {
      PLANNED: 10,
      IN_PROGRESS: 8,
      IMPLEMENTED: 7
    }
  },
  visualization: {
    // Data for rendering complete navigation diagram
    allNodes: PageFlowNode[],
    allEdges: PageFlowEdge[],
    clusters: [
      { name: "Auth Flow", nodeIds: [...] },
      { name: "Admin Flow", nodeIds: [...] }
    ]
  }
}
```

## 8. Implementation Priority

### Phase 1: Database Schema (Backend)
1. Add `TaskFeatureType` enum to `enums.prisma`
2. Enhance `TaskFeatureSpec` model in `task.prisma`
3. Add navigation flow models to new file `navigation.prisma`:
   - `PageNavigationFlow`
   - `PageFlowNode`
   - `PageFlowEdge`
4. Add `FlowNodeType` and `EdgeTrigger` enums
5. Create migration: `npx prisma migrate dev --name add_subtask_navigation_system`

### Phase 2: Backend API Endpoints
1. `POST /api/v1/specs/:specId/subtasks` - Generate frontend/backend subtasks
2. `POST /api/v1/projects/:projectId/navigation-flows` - Create navigation flow
3. `GET /api/v1/navigation-flows/:flowId` - Get flow details
4. `PUT /api/v1/navigation-flows/:flowId` - Update flow
5. `GET /api/v1/projects/:projectId/navigation-overview` - Complete overview
6. `GET /api/v1/specs/:specId/progress` - Feature implementation progress

### Phase 3: MCP Server Tools
1. `create_frontend_backend_subtasks()` - Auto-generate subtasks with board routing
2. `create_navigation_flow()` - Create navigation flow
3. `get_navigation_flow()` - Get flow details
4. `get_project_navigation_overview()` - Project-wide navigation overview
5. Enhanced `create_feature_spec()` - Include navigation flow and task breakdown
6. Enhanced `link_task_to_feature_spec()` - Add taskType, priority, dependencies
7. Enhanced `start_work_on_task()` - Validate dependencies before starting

### Phase 4: Frontend Visualization
1. Navigation flow diagram component (React Flow or similar)
2. Project navigation overview dashboard
3. Task dependency graph visualization
4. Progress tracking UI by task type
5. Board-specific task views (Frontend/Backend separation)

## 9. Benefits

### For Developers
- **Clear Separation**: Frontend and backend work clearly separated
- **Automatic Routing**: Tasks auto-assigned to correct boards
- **Dependency Safety**: Can't start frontend before backend is ready
- **Progress Visibility**: See exactly what's done and what remains

### For Project Managers
- **Visual Navigation**: Understand complete page flow at a glance
- **Progress Overview**: Track implementation by type (frontend/backend)
- **Priority Management**: Tasks linked with priorities and phases
- **Bottleneck Detection**: Identify blocked tasks and dependencies

### For LLM (Claude Code)
- **Clear Context**: Understand page navigation and relationships
- **Task Dependencies**: Know which tasks must complete first
- **Automatic Generation**: Create subtasks and navigation flows automatically
- **Structured Guidance**: Follow implementation phases systematically

## 10. Example: Complete Feature Implementation

```typescript
// 1. User requests feature
User: "Add user profile management with avatar upload"

// 2. Claude creates feature spec
const spec = await create_feature_spec({
  projectId: "xxx",
  prompt: "ユーザープロフィール管理（アバターアップロード機能付き）",
  clarifications: {
    priority: "HIGH",
    includeSettings: true,
    avatarStorage: "minio"
  }
});

// Result includes:
// - featureSpec (with PRD)
// - pages: [Profile Page, Settings Page]
// - endpoints: [PUT /api/v1/users/:id, POST /api/v1/users/:id/avatar]
// - erDiagrams: [User schema with avatarUrl field]
// - navigationFlow: Auto-generated flow diagram
// - taskBreakdown: Suggested main/backend/frontend tasks

// 3. Claude creates main task
const mainTask = await create_task({
  title: "ユーザープロフィール管理機能",
  description: "アバターアップロードを含むプロフィール編集機能"
});

await link_task_to_feature_spec({
  taskId: mainTask.id,
  featureSpecId: spec.featureSpec.id,
  taskType: "MAIN",
  priority: "HIGH",
  phase: "PLANNING"
});

// 4. Claude auto-generates subtasks
const subtasks = await create_frontend_backend_subtasks({
  mainTaskId: mainTask.id,
  featureSpecId: spec.featureSpec.id,
  autoGenerate: true
});

// Result:
// subtasks = {
//   backend: {
//     id: "backend-subtask-id",
//     title: "プロフィールAPI実装",
//     boardId: "backend-board-id", // Auto-routed to BACKEND board
//     taskType: "BACKEND_SUBTASK",
//     linkedEndpoints: ["PUT /api/v1/users/:id", "POST /api/v1/users/:id/avatar"],
//     linkedErDiagrams: ["User schema"],
//     dependencies: [],
//     estimatedHours: 12
//   },
//   frontend: {
//     id: "frontend-subtask-id",
//     title: "プロフィールUI実装",
//     boardId: "frontend-board-id", // Auto-routed to FRONTEND board
//     taskType: "FRONTEND_SUBTASK",
//     linkedPages: ["Profile Page", "Settings Page"],
//     dependencies: ["backend-subtask-id"], // Must wait for backend
//     estimatedHours: 10
//   }
// }

// 5. Claude creates navigation flow
const navFlow = await create_navigation_flow({
  projectId: "xxx",
  name: "Profile Management Flow",
  pages: spec.pages.map(p => p.id),
  autoGenerate: true
});

// Result:
// navFlow = {
//   id: "flow-id",
//   nodes: [
//     { pageId: "dashboard", type: "START", position: { x: 0, y: 0 } },
//     { pageId: "profile-page", type: "PAGE", position: { x: 200, y: 0 } },
//     { pageId: "settings-page", type: "PAGE", position: { x: 200, y: 150 } }
//   ],
//   edges: [
//     { from: "dashboard", to: "profile-page", trigger: "CLICK", label: "View Profile" },
//     { from: "profile-page", to: "settings-page", trigger: "CLICK", label: "Settings" }
//   ]
// }

// 6. Work execution
// Backend first (no dependencies)
await start_work_on_task({ taskId: subtasks.backend.id });
// ✓ Feature spec link validated
// ✓ Dependencies checked (none)
// ✓ Session started

// ... Claude implements backend ...

await complete_task_work({
  taskId: subtasks.backend.id,
  summary: "プロフィールAPIとアバターアップロード実装完了"
});
// ✓ TaskFeatureSpec updated: progressPercent = 100, completedAt set
// ✓ Main task progress updated: 50% (1 of 2 subtasks complete)

// Frontend next (depends on backend)
await start_work_on_task({ taskId: subtasks.frontend.id });
// ✓ Feature spec link validated
// ✓ Dependencies checked: backend-subtask-id status = COMPLETED ✓
// ✓ Session started

// ... Claude implements frontend ...

await complete_task_work({
  taskId: subtasks.frontend.id,
  summary: "プロフィールUIとアバターアップロード画面実装完了"
});
// ✓ TaskFeatureSpec updated: progressPercent = 100, completedAt set
// ✓ Main task progress updated: 100% (2 of 2 subtasks complete)
// ✓ Main task auto-completes

// 7. View progress
const progress = await get_feature_implementation_progress({
  featureSpecId: spec.featureSpec.id
});

// Result:
// {
//   featureSpec: { id: "xxx", title: "ユーザープロフィール管理", status: "COMPLETED" },
//   mainTask: { id: "xxx", progress: 100, status: "COMPLETED" },
//   subtasks: {
//     backend: {
//       id: "xxx",
//       progress: 100,
//       status: "COMPLETED",
//       phase: "BACKEND_IMPL",
//       completedAt: "2025-11-05T12:00:00Z"
//     },
//     frontend: {
//       id: "xxx",
//       progress: 100,
//       status: "COMPLETED",
//       phase: "FRONTEND_IMPL",
//       completedAt: "2025-11-05T14:00:00Z"
//     }
//   },
//   overallProgress: 100,
//   estimatedHours: 22,
//   actualHours: 24
// }
```

## 11. Dependency Validation Logic

### Start Work Validation Flow

```typescript
async function start_work_on_task(taskId: string) {
  // 1. Check feature spec link (existing)
  const taskFeatureSpec = await getTaskFeatureSpecLink(taskId);
  if (!taskFeatureSpec) {
    throw new Error("Task must be linked to feature spec");
  }

  // 2. NEW: Check dependencies
  if (taskFeatureSpec.dependencies.length > 0) {
    const dependencyTasks = await getTasks(taskFeatureSpec.dependencies);

    const incompleteDeps = dependencyTasks.filter(
      t => t.status !== "COMPLETED"
    );

    if (incompleteDeps.length > 0) {
      const depTitles = incompleteDeps.map(t => t.title).join(", ");
      throw new Error(
        `タスクを開始できません。次の依存タスクが未完了です: ${depTitles}`
      );
    }
  }

  // 3. Start work session
  // ... existing logic ...
}
```

## 12. Board Auto-Selection Logic

### Enhanced Board Selection

```typescript
async function selectBoardForSubtask(
  taskType: TaskFeatureType,
  projectId: string
): Promise<string> {
  const boards = await listBoards(projectId);

  // Map task types to board types
  const boardTypeMap: Record<TaskFeatureType, BoardType> = {
    MAIN: "GENERAL",
    FRONTEND_SUBTASK: "FRONTEND",
    BACKEND_SUBTASK: "BACKEND",
    DATABASE_SUBTASK: "DATABASE",
    TESTING_SUBTASK: "QA",
    DEPLOYMENT_SUBTASK: "DEVOPS"
  };

  const targetBoardType = boardTypeMap[taskType];

  // Find board with matching type
  const matchingBoard = boards.find(b => b.type === targetBoardType);

  if (matchingBoard) {
    return matchingBoard.id;
  }

  // Fallback: create board if doesn't exist
  if (taskType !== "MAIN") {
    const newBoard = await createBoard({
      projectId,
      name: `${targetBoardType} Board`,
      type: targetBoardType,
      viewType: "board"
    });
    return newBoard.id;
  }

  // For MAIN tasks, use repository board or general board
  return await selectBoardForTask(); // Existing logic
}
```

## Summary

This architecture provides:

✅ **Task Hierarchy**: Main → Frontend/Backend/Testing subtasks with clear separation
✅ **Board Routing**: Automatic board assignment by TaskFeatureType
✅ **Navigation Flow**: Visual page flow management with nodes and edges
✅ **Dependency Management**: Backend-first enforcement prevents integration issues
✅ **Progress Tracking**: Multi-level progress visibility (spec → main → subtasks)
✅ **LLM Integration**: Clear context for AI-driven development with auto-generation
✅ **Project Overview**: Complete navigation visualization and statistics

**Next Steps**:
1. **Review this architecture** with the team
2. **Phase 1**: Implement database schema changes
3. **Phase 2**: Build backend API endpoints
4. **Phase 3**: Update MCP server tools
5. **Phase 4**: Create frontend visualization

This system ensures systematic, dependency-aware, progress-tracked feature development with complete navigation context for both developers and AI assistants.
