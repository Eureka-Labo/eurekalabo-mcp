# Phase 2 Implementation Plan: Backend API

## Overview

Detailed implementation plan for Backend API endpoints supporting subtask generation, navigation flow management, and progress tracking.

## 1. API Endpoints Design

### 1.1 Subtask Management

#### POST `/api/v1/specs/:specId/subtasks`
**Purpose**: Generate frontend/backend subtasks from feature spec

**Request Body**:
```typescript
{
  mainTaskId: string;           // Parent task ID
  autoGenerate?: boolean;       // Auto-create from spec (default: true)
  pages?: string[];             // Optional: specific page IDs
  endpoints?: string[];         // Optional: specific endpoint IDs
  estimatedHours?: {
    backend?: number;
    frontend?: number;
    testing?: number;
  };
}
```

**Response**:
```typescript
{
  success: true,
  subtasks: {
    backend?: {
      id: string;
      title: string;
      boardId: string;
      taskType: "BACKEND_SUBTASK";
      linkedEndpoints: string[];
      linkedErDiagrams: string[];
      dependencies: [];
      estimatedHours: number;
    },
    frontend?: {
      id: string;
      title: string;
      boardId: string;
      taskType: "FRONTEND_SUBTASK";
      linkedPages: string[];
      dependencies: [backendTaskId];
      estimatedHours: number;
    },
    testing?: {
      id: string;
      title: string;
      boardId: string;
      taskType: "TESTING_SUBTASK";
      dependencies: [backendTaskId, frontendTaskId];
      estimatedHours: number;
    }
  }
}
```

**Business Logic**:
1. Fetch FeatureSpec with pages, endpoints, erDiagrams
2. Find or create BACKEND board for backend subtask
3. Find or create FRONTEND board for frontend subtask
4. Generate task titles in Japanese
5. Create subtasks with proper boardId and dependencies
6. Create TaskFeatureSpec links for each subtask
7. Update main task's metadata with subtask references

**Validation**:
- mainTaskId must exist and be valid
- specId must exist and match mainTaskId's featureSpecId
- Main task must not already have subtasks
- Project must have or allow board creation

---

### 1.2 Navigation Flow Management

#### POST `/api/v1/projects/:projectId/navigation-flows`
**Purpose**: Create navigation flow

**Request Body**:
```typescript
{
  name: string;
  description?: string;
  pages: string[];              // Page IDs to include
  autoGenerate?: boolean;       // Auto-generate nodes/edges (default: true)
  isDefault?: boolean;
  nodes?: PageFlowNode[];       // Manual node definition
  edges?: PageFlowEdge[];       // Manual edge definition
}
```

**Response**:
```typescript
{
  success: true,
  flow: {
    id: string;
    name: string;
    nodes: PageFlowNode[];
    edges: PageFlowEdge[];
    statistics: {
      totalNodes: number;
      totalEdges: number;
      pageTypes: Record<PageCategory, number>;
    }
  }
}
```

**Business Logic (autoGenerate=true)**:
1. Fetch pages with their endpoints and entities
2. Analyze page relationships:
   - Auth pages → Connect to dashboard
   - List pages → Connect to detail pages
   - Forms → Connect to success/error pages
3. Generate nodes with auto-layout (force-directed graph)
4. Generate edges based on:
   - Page category patterns
   - Common navigation flows
   - Auth requirements
5. Store in PageNavigationFlow

**Validation**:
- projectId must exist
- pages array must contain valid page IDs
- name must be unique within project
- If manual nodes/edges provided, validate structure

---

#### GET `/api/v1/navigation-flows/:flowId`
**Purpose**: Get navigation flow details

**Response**:
```typescript
{
  success: true,
  flow: {
    id: string;
    projectId: string;
    name: string;
    description: string;
    nodes: PageFlowNode[];
    edges: PageFlowEdge[];
    isDefault: boolean;
    layoutData: { zoom: number; panX: number; panY: number };
    createdAt: string;
    updatedAt: string;
  },
  pages: ProjectPage[];         // Full page details for each node
}
```

---

#### PUT `/api/v1/navigation-flows/:flowId`
**Purpose**: Update navigation flow

**Request Body**:
```typescript
{
  name?: string;
  description?: string;
  nodes?: PageFlowNode[];
  edges?: PageFlowEdge[];
  layoutData?: { zoom: number; panX: number; panY: number };
  isDefault?: boolean;
}
```

**Business Logic**:
- If isDefault=true, set other flows to isDefault=false
- Validate node/edge references
- Update PageFlowNode and PageFlowEdge records
- Update JSON fields in PageNavigationFlow

---

#### DELETE `/api/v1/navigation-flows/:flowId`
**Purpose**: Delete navigation flow

**Business Logic**:
- Cascade delete PageFlowNode and PageFlowEdge
- Cannot delete if isDefault=true (must set another as default first)

---

### 1.3 Progress Tracking

#### GET `/api/v1/specs/:specId/progress`
**Purpose**: Get feature implementation progress

**Response**:
```typescript
{
  success: true,
  featureSpec: {
    id: string;
    title: string;
    status: SpecStatus;
  },
  mainTask: {
    id: string;
    title: string;
    status: string;
    progress: number;           // Overall completion %
  },
  subtasks: {
    backend?: {
      id: string;
      title: string;
      taskType: "BACKEND_SUBTASK";
      phase: ImplementationPhase;
      status: string;
      progressPercent: number;
      estimatedHours: number;
      startedAt: string;
      completedAt: string;
    },
    frontend?: { ... },
    testing?: { ... }
  },
  overallProgress: number;      // Weighted average of all subtasks
  estimatedHours: number;       // Sum of all estimates
  actualHours: number;          // Sum from time entries
  timeline: {
    started: string;            // First subtask startedAt
    expectedCompletion: string; // Based on estimates
    actualCompletion: string;   // Last subtask completedAt
  }
}
```

**Business Logic**:
1. Fetch FeatureSpec
2. Find all TaskFeatureSpec links for this spec
3. Calculate progress per subtask type
4. Compute weighted overall progress
5. Aggregate time data

---

#### GET `/api/v1/projects/:projectId/navigation-overview`
**Purpose**: Get project-wide navigation overview

**Response**:
```typescript
{
  success: true,
  flows: PageNavigationFlow[];
  statistics: {
    totalPages: number;
    totalFlows: number;
    pagesByCategory: Record<PageCategory, number>;
    pagesByStatus: Record<PageStatus, number>;
  },
  visualization: {
    allNodes: PageFlowNode[];
    allEdges: PageFlowEdge[];
    clusters: Array<{
      name: string;
      nodeIds: string[];
      category: PageCategory;
    }>;
  }
}
```

**Business Logic**:
1. Fetch all PageNavigationFlow for project
2. Fetch all ProjectPage for statistics
3. Merge all nodes/edges from all flows
4. Cluster pages by category
5. Generate visualization data

---

## 2. Service Layer Architecture

### 2.1 SubtaskService

**File**: `src/services/subtask.service.ts`

```typescript
class SubtaskService {
  /**
   * Generate subtasks from feature spec
   */
  async generateSubtasks(
    specId: string,
    mainTaskId: string,
    options: SubtaskGenerationOptions
  ): Promise<GeneratedSubtasks>

  /**
   * Find or create board by type
   */
  async findOrCreateBoardByType(
    projectId: string,
    boardType: BoardType
  ): Promise<string>

  /**
   * Generate task title in Japanese
   */
  generateTaskTitle(
    taskType: TaskFeatureType,
    featureTitle: string
  ): string

  /**
   * Calculate estimated hours
   */
  calculateEstimatedHours(
    taskType: TaskFeatureType,
    complexity: {
      pageCount?: number;
      endpointCount?: number;
      schemaCount?: number;
    }
  ): number

  /**
   * Link resources to subtask
   */
  async linkResourcesToSubtask(
    taskId: string,
    resources: {
      pages?: string[];
      endpoints?: string[];
      erDiagrams?: string[];
    }
  ): Promise<void>
}
```

**Key Algorithms**:

**Board Auto-Selection**:
```typescript
async findOrCreateBoardByType(projectId: string, boardType: BoardType) {
  // 1. Find existing board
  const boards = await prisma.taskBoard.findMany({
    where: { projectId, type: boardType }
  });

  if (boards.length > 0) {
    return boards[0].id;
  }

  // 2. Create new board
  const boardNames = {
    FRONTEND: "Frontend Board",
    BACKEND: "Backend Board",
    DATABASE: "Database Board",
    TESTING: "QA Board",
  };

  const newBoard = await prisma.taskBoard.create({
    data: {
      projectId,
      name: boardNames[boardType] || `${boardType} Board`,
      type: boardType,
      viewType: "board",
      statusOptions: defaultStatusOptions
    }
  });

  return newBoard.id;
}
```

**Estimated Hours Calculation**:
```typescript
calculateEstimatedHours(taskType: TaskFeatureType, complexity) {
  const baseHours = {
    BACKEND_SUBTASK: 2,
    FRONTEND_SUBTASK: 1.5,
    DATABASE_SUBTASK: 1,
    TESTING_SUBTASK: 0.5,
  };

  const multipliers = {
    pageCount: 1.5,      // 1.5 hours per page
    endpointCount: 2,    // 2 hours per endpoint
    schemaCount: 1,      // 1 hour per schema
  };

  let hours = baseHours[taskType] || 4;

  if (complexity.pageCount) {
    hours += complexity.pageCount * multipliers.pageCount;
  }
  if (complexity.endpointCount) {
    hours += complexity.endpointCount * multipliers.endpointCount;
  }
  if (complexity.schemaCount) {
    hours += complexity.schemaCount * multipliers.schemaCount;
  }

  return Math.ceil(hours);
}
```

---

### 2.2 NavigationFlowService

**File**: `src/services/navigation-flow.service.ts`

```typescript
class NavigationFlowService {
  /**
   * Create navigation flow
   */
  async createNavigationFlow(
    projectId: string,
    data: CreateNavigationFlowInput
  ): Promise<PageNavigationFlow>

  /**
   * Auto-generate flow from pages
   */
  async autoGenerateFlow(
    projectId: string,
    pages: ProjectPage[]
  ): Promise<{ nodes: PageFlowNode[]; edges: PageFlowEdge[] }>

  /**
   * Analyze page relationships
   */
  analyzePageRelationships(pages: ProjectPage[]): PageRelationship[]

  /**
   * Generate auto-layout positions
   */
  generateAutoLayout(
    nodes: PageFlowNode[],
    edges: PageFlowEdge[]
  ): PageFlowNode[]

  /**
   * Update flow
   */
  async updateNavigationFlow(
    flowId: string,
    updates: UpdateNavigationFlowInput
  ): Promise<PageNavigationFlow>

  /**
   * Get project navigation overview
   */
  async getProjectNavigationOverview(
    projectId: string
  ): Promise<NavigationOverview>
}
```

**Key Algorithms**:

**Auto-Generate Flow**:
```typescript
async autoGenerateFlow(projectId: string, pages: ProjectPage[]) {
  // 1. Analyze relationships
  const relationships = this.analyzePageRelationships(pages);

  // 2. Create nodes
  const nodes: PageFlowNode[] = pages.map((page, index) => ({
    id: `node-${page.id}`,
    pageId: page.id,
    type: this.inferNodeType(page),
    label: page.name,
    position: { x: 0, y: 0 }, // Will be calculated in layout
    metadata: {
      requiredAuth: page.category !== 'AUTH',
      endpoints: page.apiEndpoints || [],
      entities: page.entities || []
    }
  }));

  // 3. Create edges from relationships
  const edges: PageFlowEdge[] = relationships.map((rel, index) => ({
    id: `edge-${index}`,
    from: `node-${rel.fromPageId}`,
    to: `node-${rel.toPageId}`,
    trigger: rel.trigger,
    label: rel.label
  }));

  // 4. Apply auto-layout
  const layoutNodes = this.generateAutoLayout(nodes, edges);

  return { nodes: layoutNodes, edges };
}
```

**Relationship Analysis**:
```typescript
analyzePageRelationships(pages: ProjectPage[]): PageRelationship[] {
  const relationships: PageRelationship[] = [];

  // Common patterns
  const authPages = pages.filter(p => p.category === 'AUTH');
  const dashboards = pages.filter(p => p.category === 'DASHBOARD');
  const listPages = pages.filter(p => p.category === 'LIST');
  const detailPages = pages.filter(p => p.category === 'DETAIL');

  // Pattern 1: Auth → Dashboard
  authPages.forEach(auth => {
    dashboards.forEach(dashboard => {
      relationships.push({
        fromPageId: auth.id,
        toPageId: dashboard.id,
        trigger: 'SUBMIT',
        label: 'Successful login'
      });
    });
  });

  // Pattern 2: List → Detail
  listPages.forEach(list => {
    // Find matching detail page by naming
    const matchingDetail = detailPages.find(detail =>
      detail.name.includes(list.name.replace('List', ''))
    );
    if (matchingDetail) {
      relationships.push({
        fromPageId: list.id,
        toPageId: matchingDetail.id,
        trigger: 'CLICK',
        label: 'View details'
      });
    }
  });

  // Pattern 3: Form → Success/Error
  // ... more patterns

  return relationships;
}
```

**Auto-Layout (Force-Directed)**:
```typescript
generateAutoLayout(nodes: PageFlowNode[], edges: PageFlowEdge[]) {
  // Simple force-directed layout
  // For production, use library like dagre or cola.js

  const WIDTH = 800;
  const HEIGHT = 600;
  const ITERATIONS = 100;

  // Initialize positions
  nodes.forEach((node, i) => {
    node.position = {
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT
    };
  });

  // Force simulation
  for (let iter = 0; iter < ITERATIONS; iter++) {
    // Repulsion between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].position.x - nodes[i].position.x;
        const dy = nodes[j].position.y - nodes[i].position.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = 100 / (dist * dist);

        nodes[i].position.x -= (dx / dist) * force;
        nodes[i].position.y -= (dy / dist) * force;
        nodes[j].position.x += (dx / dist) * force;
        nodes[j].position.y += (dy / dist) * force;
      }
    }

    // Attraction along edges
    edges.forEach(edge => {
      const from = nodes.find(n => n.id === edge.from);
      const to = nodes.find(n => n.id === edge.to);
      if (!from || !to) return;

      const dx = to.position.x - from.position.x;
      const dy = to.position.y - from.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = dist * 0.01;

      from.position.x += (dx / dist) * force;
      from.position.y += (dy / dist) * force;
      to.position.x -= (dx / dist) * force;
      to.position.y -= (dy / dist) * force;
    });
  }

  return nodes;
}
```

---

### 2.3 ProgressTrackingService

**File**: `src/services/progress-tracking.service.ts`

```typescript
class ProgressTrackingService {
  /**
   * Get feature implementation progress
   */
  async getFeatureProgress(
    specId: string
  ): Promise<FeatureProgress>

  /**
   * Calculate overall progress
   */
  calculateOverallProgress(
    subtasks: TaskFeatureSpec[]
  ): number

  /**
   * Get timeline data
   */
  getTimeline(
    subtasks: TaskFeatureSpec[]
  ): Timeline

  /**
   * Update subtask progress
   */
  async updateSubtaskProgress(
    taskId: string,
    progress: number
  ): Promise<void>
}
```

**Progress Calculation**:
```typescript
calculateOverallProgress(subtasks: TaskFeatureSpec[]): number {
  if (subtasks.length === 0) return 0;

  // Weighted by task type
  const weights = {
    BACKEND_SUBTASK: 0.4,
    FRONTEND_SUBTASK: 0.4,
    TESTING_SUBTASK: 0.2,
    DATABASE_SUBTASK: 0.3,
    DEPLOYMENT_SUBTASK: 0.1,
  };

  let totalWeight = 0;
  let weightedProgress = 0;

  subtasks.forEach(subtask => {
    const weight = weights[subtask.taskType] || 0.25;
    totalWeight += weight;
    weightedProgress += subtask.progressPercent * weight;
  });

  return totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0;
}
```

---

## 3. Validation Schemas

**File**: `src/validation/subtask.validation.ts`

```typescript
import { z } from 'zod';

export const createSubtasksSchema = z.object({
  mainTaskId: z.string().cuid(),
  autoGenerate: z.boolean().default(true),
  pages: z.array(z.string().cuid()).optional(),
  endpoints: z.array(z.string().cuid()).optional(),
  estimatedHours: z.object({
    backend: z.number().min(0).optional(),
    frontend: z.number().min(0).optional(),
    testing: z.number().min(0).optional(),
  }).optional()
});

export const createNavigationFlowSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  pages: z.array(z.string().cuid()).min(1),
  autoGenerate: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  nodes: z.array(z.object({
    pageId: z.string().cuid(),
    type: z.enum(['PAGE', 'MODAL', 'REDIRECT', 'CONDITION', 'START', 'END']),
    label: z.string().optional(),
    position: z.object({
      x: z.number(),
      y: z.number()
    }),
    metadata: z.record(z.any()).optional()
  })).optional(),
  edges: z.array(z.object({
    from: z.string(),
    to: z.string(),
    trigger: z.enum(['CLICK', 'SUBMIT', 'AUTO_REDIRECT', 'CONDITION', 'BACK', 'AUTH_REQUIRED']),
    label: z.string().optional(),
    condition: z.string().optional(),
    metadata: z.record(z.any()).optional()
  })).optional()
});

export const updateNavigationFlowSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
  layoutData: z.object({
    zoom: z.number(),
    panX: z.number(),
    panY: z.number()
  }).optional(),
  isDefault: z.boolean().optional()
});
```

---

## 4. Dependency Validation Logic

**File**: `src/utils/dependency-validator.ts`

```typescript
export class DependencyValidator {
  /**
   * Validate dependencies before starting work
   */
  async validateDependencies(
    taskId: string
  ): Promise<{ valid: boolean; blockingTasks: Task[] }> {
    // 1. Get TaskFeatureSpec link
    const link = await prisma.taskFeatureSpec.findFirst({
      where: { taskId },
      include: { task: true }
    });

    if (!link || link.dependencies.length === 0) {
      return { valid: true, blockingTasks: [] };
    }

    // 2. Check dependency tasks
    const dependencyTasks = await prisma.task.findMany({
      where: { id: { in: link.dependencies } }
    });

    const blockingTasks = dependencyTasks.filter(
      t => t.status !== 'COMPLETED' && t.status !== 'done'
    );

    return {
      valid: blockingTasks.length === 0,
      blockingTasks
    };
  }

  /**
   * Check circular dependencies
   */
  async hasCircularDependency(
    taskId: string,
    newDependencies: string[]
  ): Promise<boolean> {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    async function dfs(currentTaskId: string): Promise<boolean> {
      visited.add(currentTaskId);
      recursionStack.add(currentTaskId);

      // Get dependencies
      const link = await prisma.taskFeatureSpec.findFirst({
        where: { taskId: currentTaskId }
      });

      const deps = currentTaskId === taskId
        ? newDependencies
        : (link?.dependencies || []);

      for (const depId of deps) {
        if (!visited.has(depId)) {
          if (await dfs(depId)) return true;
        } else if (recursionStack.has(depId)) {
          return true; // Circular dependency found
        }
      }

      recursionStack.delete(currentTaskId);
      return false;
    }

    return await dfs(taskId);
  }
}
```

---

## 5. Error Handling Strategy

### Error Types

```typescript
export class SubtaskError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SubtaskError';
  }
}

// Error codes
export enum SubtaskErrorCode {
  MAIN_TASK_NOT_FOUND = 'MAIN_TASK_NOT_FOUND',
  SPEC_NOT_FOUND = 'SPEC_NOT_FOUND',
  SUBTASKS_ALREADY_EXIST = 'SUBTASKS_ALREADY_EXIST',
  BOARD_CREATION_FAILED = 'BOARD_CREATION_FAILED',
  INVALID_DEPENDENCIES = 'INVALID_DEPENDENCIES',
  CIRCULAR_DEPENDENCY = 'CIRCULAR_DEPENDENCY',
}

export enum NavigationFlowErrorCode {
  FLOW_NOT_FOUND = 'FLOW_NOT_FOUND',
  INVALID_PAGES = 'INVALID_PAGES',
  DUPLICATE_FLOW_NAME = 'DUPLICATE_FLOW_NAME',
  CANNOT_DELETE_DEFAULT = 'CANNOT_DELETE_DEFAULT',
}
```

### Error Handler Middleware

```typescript
export function errorHandler(error: Error, c: Context) {
  if (error instanceof SubtaskError) {
    return c.json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    }, 400);
  }

  // Log unexpected errors
  console.error('[API Error]', error);

  return c.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  }, 500);
}
```

---

## 6. Test Cases

### 6.1 Subtask Generation Tests

```typescript
describe('SubtaskService', () => {
  describe('generateSubtasks', () => {
    it('should create backend and frontend subtasks', async () => {
      // Arrange
      const spec = await createTestFeatureSpec();
      const mainTask = await createTestTask();

      // Act
      const result = await subtaskService.generateSubtasks(
        spec.id,
        mainTask.id,
        { autoGenerate: true }
      );

      // Assert
      expect(result.backend).toBeDefined();
      expect(result.frontend).toBeDefined();
      expect(result.frontend.dependencies).toContain(result.backend.id);
    });

    it('should route backend subtask to BACKEND board', async () => {
      // Test board auto-selection logic
    });

    it('should calculate estimated hours correctly', async () => {
      // Test estimation algorithm
    });

    it('should throw error if subtasks already exist', async () => {
      // Test duplicate prevention
    });
  });
});
```

### 6.2 Navigation Flow Tests

```typescript
describe('NavigationFlowService', () => {
  describe('autoGenerateFlow', () => {
    it('should generate flow with correct relationships', async () => {
      // Test relationship analysis
    });

    it('should apply auto-layout to nodes', async () => {
      // Test layout algorithm
    });
  });

  describe('analyzePageRelationships', () => {
    it('should connect auth pages to dashboard', async () => {
      // Test auth pattern
    });

    it('should connect list pages to detail pages', async () => {
      // Test list-detail pattern
    });
  });
});
```

### 6.3 Dependency Validation Tests

```typescript
describe('DependencyValidator', () => {
  describe('validateDependencies', () => {
    it('should allow starting task with completed dependencies', async () => {
      // Test successful validation
    });

    it('should block starting task with incomplete dependencies', async () => {
      // Test blocking logic
    });
  });

  describe('hasCircularDependency', () => {
    it('should detect circular dependencies', async () => {
      // Test A → B → C → A
    });

    it('should allow valid dependency chains', async () => {
      // Test A → B → C
    });
  });
});
```

---

## 7. Implementation Order

### Step 1: Service Layer (Week 1)
1. SubtaskService core logic
2. Board auto-selection
3. Task title generation
4. Estimated hours calculation

### Step 2: Navigation Flow (Week 1-2)
1. NavigationFlowService core logic
2. Relationship analysis
3. Auto-layout algorithm
4. CRUD operations

### Step 3: API Endpoints (Week 2)
1. POST /specs/:specId/subtasks
2. POST /projects/:projectId/navigation-flows
3. GET /navigation-flows/:flowId
4. PUT /navigation-flows/:flowId
5. DELETE /navigation-flows/:flowId
6. GET /specs/:specId/progress
7. GET /projects/:projectId/navigation-overview

### Step 4: Validation & Error Handling (Week 2)
1. Zod schemas
2. Dependency validator
3. Error classes
4. Error handler middleware

### Step 5: Testing (Week 3)
1. Unit tests for services
2. Integration tests for API endpoints
3. E2E tests for complete workflows

---

## 8. Success Criteria

### Functional Requirements
- ✅ Can generate frontend/backend subtasks from feature spec
- ✅ Subtasks correctly routed to appropriate boards
- ✅ Dependencies properly enforced (backend before frontend)
- ✅ Navigation flows auto-generated with reasonable layouts
- ✅ Progress tracking accurately reflects completion status
- ✅ Circular dependencies detected and prevented

### Performance Requirements
- Subtask generation: < 500ms
- Navigation flow auto-generation: < 1s
- Progress calculation: < 200ms
- Navigation overview: < 1s

### Quality Requirements
- Unit test coverage: > 80%
- Integration test coverage: > 70%
- API documentation: 100% complete
- Error messages: Clear and actionable

---

## 9. Next Steps

After completing this plan:

1. **Review with team** - Validate approach and algorithms
2. **Create implementation tasks** - Break down into smaller tasks
3. **Set up test fixtures** - Prepare test data
4. **Begin implementation** - Follow the implementation order
5. **Continuous testing** - Write tests alongside implementation
6. **Documentation** - Update API docs as endpoints are built

---

## Summary

This plan provides:
- **7 API endpoints** for complete subtask and navigation management
- **3 service classes** with clear responsibilities
- **Validation schemas** for all inputs
- **Dependency validation** with circular detection
- **Error handling** with specific error codes
- **Test specifications** for all components
- **Implementation timeline** (3 weeks)
- **Success criteria** for quality assurance

Ready to proceed with Phase 2 implementation!
