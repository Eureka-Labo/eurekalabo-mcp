# Frontend Implementation Plan - Subtask & Navigation System

**Date**: 2025-11-06
**Status**: 📝 PLANNING
**Target**: `/Users/yujirohikawa/workspace/eurekalabo/eurekalabo/`

---

## 📋 Overview

This document outlines the frontend implementation plan for the feature-spec subtask management and navigation flow visualization system. All backend APIs are complete and deployed.

**Backend Status**: ✅ ALL COMPLETE (7 MCP tools + 7 API endpoints deployed)

**Frontend Scope**: Add UI components and API integration for:
1. Subtask hierarchy display and creation
2. Navigation flow visualization with graph rendering
3. Enhanced progress tracking with dependency blockers
4. Board type routing indicators

---

## 🎯 Phase 1: Type Definitions & API Client

### 1.1 Add New Type Definitions

**File**: `src/types/feature-spec.types.ts`

**Add Enums**:
```typescript
// Task Feature Type (matches backend)
export type TaskFeatureType =
  | 'MAIN'
  | 'FRONTEND_SUBTASK'
  | 'BACKEND_SUBTASK'
  | 'DATABASE_SUBTASK'
  | 'TESTING_SUBTASK'
  | 'DEPLOYMENT_SUBTASK';

// Flow Node Type (for navigation visualization)
export type FlowNodeType =
  | 'PAGE'
  | 'MODAL'
  | 'REDIRECT'
  | 'CONDITION'
  | 'START'
  | 'END';

// Edge Trigger Type (for navigation transitions)
export type EdgeTrigger =
  | 'CLICK'
  | 'SUBMIT'
  | 'AUTO_REDIRECT'
  | 'CONDITION'
  | 'BACK'
  | 'AUTH_REQUIRED';
```

**Add Interfaces**:
```typescript
// Enhanced ImplementationTask with subtask support
export interface ImplementationTask {
  // ... existing fields ...

  // NEW: Subtask management
  taskType?: TaskFeatureType;
  parentTaskId?: string | null;
  progressPercent?: number;
  startedAt?: string | null;
  completedAt?: string | null;

  // Relations
  subtasks?: ImplementationTask[];
  parentTask?: ImplementationTask;
}

// Subtask Creation Request
export interface CreateSubtasksRequest {
  featureSpecId: string;
  mainTaskId: string;
  taskTypes?: TaskFeatureType[];
  estimatedHours?: number;
  priority?: Priority;
}

export interface CreateSubtasksResponse {
  success: boolean;
  subtasks: Array<{
    taskId: string;
    taskType: TaskFeatureType;
    boardId: string;
    boardName: string;
  }>;
  totalEstimatedHours: number;
}

// Navigation Flow Types
export interface PageNavigationFlow {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  nodes: PageFlowNode[];
  edges: PageFlowEdge[];
  layoutData?: NodePosition[];
  createdBy?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface PageFlowNode {
  id: string;
  flowId: string;
  pageId: string;
  positionX: number;
  positionY: number;
  nodeType: FlowNodeType;
  label: string;
  metadata?: Record<string, unknown>;
  page?: {
    id: string;
    name: string;
    path: string;
    category: string;
    status: string;
  };
}

export interface PageFlowEdge {
  id: string;
  flowId: string;
  fromNodeId: string;
  toNodeId: string;
  trigger: EdgeTrigger;
  label?: string;
  condition?: string;
  metadata?: Record<string, unknown>;
  fromNode?: PageFlowNode;
  toNode?: PageFlowNode;
}

export interface NodePosition {
  id: string;
  x: number;
  y: number;
}

// Navigation Flow Requests
export interface CreateNavigationFlowRequest {
  projectId: string;
  name: string;
  description?: string;
  pages: Array<{
    pageId: string;
    positionX?: number;
    positionY?: number;
  }>;
  connections: Array<{
    fromPageId: string;
    toPageId: string;
    trigger: EdgeTrigger;
    label?: string;
    condition?: string;
  }>;
  autoLayout?: boolean;
}

export interface UpdateNavigationFlowRequest {
  name?: string;
  description?: string;
  pages?: Array<{
    pageId: string;
    positionX?: number;
    positionY?: number;
  }>;
  connections?: Array<{
    fromPageId: string;
    toPageId: string;
    trigger: EdgeTrigger;
    label?: string;
    condition?: string;
  }>;
  autoLayout?: boolean;
}

// Enhanced Progress Response
export interface EnhancedSpecProgress {
  spec: FeatureSpec;
  mainTasks: Array<{
    task: ImplementationTask & {
      board?: {
        id: string;
        name: string;
        type: string;
      };
    };
    subtasks: Array<{
      task: ImplementationTask;
      progressPercent: number;
    }>;
    progress: number;
    blockedBy: string[];
    estimatedHoursRemaining: number;
  }>;
  totalProgress: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  blockerCount: number;
}

// Project Navigation Overview
export interface ProjectNavigationOverview {
  flows: PageNavigationFlow[];
  pages: Array<{
    id: string;
    name: string;
    path: string;
    category: string;
    status: string;
  }>;
  totalFlows: number;
  totalPages: number;
  orphanedPages: Array<{
    id: string;
    name: string;
    path: string;
    category: string;
    status: string;
  }>;
}
```

**Estimated Time**: 2 hours

---

### 1.2 Update API Client

**File**: `src/lib/api.ts`

**Add to `featureSpecAPI` object**:

```typescript
export const featureSpecAPI = {
  // ... existing methods ...

  // ===== NEW: Subtask Management =====

  // Create subtasks for main task
  createSubtasks: async (data: CreateSubtasksRequest): Promise<CreateSubtasksResponse> => {
    const response = await api.post(`/specs/${data.featureSpecId}/subtasks`, data);
    return response.data;
  },

  // Get enhanced progress with subtask breakdown
  getEnhancedProgress: async (specId: string): Promise<EnhancedSpecProgress> => {
    const response = await api.get(`/specs/${specId}/progress`);
    return response.data;
  },

  // ===== NEW: Navigation Flow Management =====

  // Create navigation flow
  createNavigationFlow: async (data: CreateNavigationFlowRequest): Promise<PageNavigationFlow> => {
    const response = await api.post(`/projects/${data.projectId}/navigation-flows`, data);
    return response.data;
  },

  // Get navigation flow with nodes and edges
  getNavigationFlow: async (flowId: string): Promise<{
    flow: PageNavigationFlow;
    nodes: PageFlowNode[];
    edges: PageFlowEdge[];
  }> => {
    const response = await api.get(`/navigation-flows/${flowId}`);
    return response.data;
  },

  // Update navigation flow
  updateNavigationFlow: async (
    flowId: string,
    data: UpdateNavigationFlowRequest
  ): Promise<{
    flow: PageNavigationFlow;
    nodes: PageFlowNode[];
    edges: PageFlowEdge[];
  }> => {
    const response = await api.put(`/navigation-flows/${flowId}`, data);
    return response.data;
  },

  // Delete navigation flow
  deleteNavigationFlow: async (flowId: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/navigation-flows/${flowId}`);
    return response.data;
  },

  // Get project navigation overview
  getProjectNavigationOverview: async (projectId: string): Promise<ProjectNavigationOverview> => {
    const response = await api.get(`/projects/${projectId}/navigation-overview`);
    return response.data;
  },
};
```

**Estimated Time**: 1 hour

---

## 🎨 Phase 2: UI Components

### 2.1 SubtaskHierarchy Component

**File**: `src/components/feature-specs/SubtaskHierarchy.tsx`

**Purpose**: Display main task with its subtasks in a collapsible tree structure

**Features**:
- Collapsible main task card
- Nested subtask cards with type badges (FRONTEND, BACKEND, etc.)
- Progress bars for each subtask
- Board routing indicators
- Dependency blocker warnings
- Create subtasks button

**Dependencies**:
- `shadcn/ui`: Card, Badge, Button, Progress, Collapsible, AlertCircle
- `lucide-react`: ChevronDown, ChevronRight, AlertTriangle, Plus
- `@tanstack/react-query`: useMutation, useQueryClient

**Props**:
```typescript
interface SubtaskHierarchyProps {
  specId: string;
  mainTask: ImplementationTask & {
    subtasks?: ImplementationTask[];
    board?: { id: string; name: string; type: string };
  };
  onSubtaskUpdate?: (taskId: string, progress: number) => void;
  onCreateSubtasks?: (mainTaskId: string) => void;
}
```

**Key UI Elements**:
```jsx
<Card className="mb-4">
  <CardHeader>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={toggleExpand}>
          {expanded ? <ChevronDown /> : <ChevronRight />}
        </Button>
        <Badge variant="outline">MAIN TASK</Badge>
        <CardTitle>{mainTask.title}</CardTitle>
      </div>
      <div className="flex items-center gap-2">
        <Badge className={boardTypeColors[mainTask.board?.type]}>
          {mainTask.board?.name}
        </Badge>
        {!mainTask.subtasks?.length && (
          <Button size="sm" onClick={() => onCreateSubtasks(mainTask.id)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Subtasks
          </Button>
        )}
      </div>
    </div>
  </CardHeader>

  {expanded && (
    <CardContent>
      {/* Progress Overview */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Overall Progress</span>
          <span>{mainTask.progressPercent || 0}%</span>
        </div>
        <Progress value={mainTask.progressPercent || 0} />
      </div>

      {/* Subtasks */}
      <div className="space-y-2">
        {mainTask.subtasks?.map(subtask => (
          <SubtaskCard
            key={subtask.id}
            subtask={subtask}
            onUpdate={onSubtaskUpdate}
          />
        ))}
      </div>

      {/* Blockers */}
      {mainTask.blockedBy?.length > 0 && (
        <Alert variant="warning" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Blocked by {mainTask.blockedBy.length} dependencies</AlertTitle>
        </Alert>
      )}
    </CardContent>
  )}
</Card>
```

**Estimated Time**: 6 hours

---

### 2.2 SubtaskCard Component

**File**: `src/components/feature-specs/SubtaskCard.tsx`

**Purpose**: Display individual subtask with progress and type badge

**Props**:
```typescript
interface SubtaskCardProps {
  subtask: ImplementationTask;
  onUpdate: (taskId: string, progress: number) => void;
}
```

**Key Features**:
- Task type badge with color coding (FRONTEND=blue, BACKEND=green, etc.)
- Progress slider (0-100%)
- Board routing indicator
- Estimated vs actual hours
- Status dropdown

**Estimated Time**: 3 hours

---

### 2.3 CreateSubtasksDialog Component

**File**: `src/components/feature-specs/CreateSubtasksDialog.tsx`

**Purpose**: Dialog to generate subtasks for main task

**Props**:
```typescript
interface CreateSubtasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  specId: string;
  mainTaskId: string;
  mainTaskTitle: string;
}
```

**Form Fields**:
- Checkbox list of task types (FRONTEND_SUBTASK, BACKEND_SUBTASK, DATABASE_SUBTASK, TESTING_SUBTASK, DEPLOYMENT_SUBTASK)
- Estimated hours input (distributed equally among subtasks)
- Priority selector
- Preview of board routing (Frontend → FRONTEND board, Backend → BACKEND board, etc.)

**API Integration**:
```typescript
const createMutation = useMutation({
  mutationFn: (data: CreateSubtasksRequest) =>
    featureSpecAPI.createSubtasks(data),
  onSuccess: (response) => {
    toast({
      title: 'Subtasks Created',
      description: `Created ${response.subtasks.length} subtasks across ${new Set(response.subtasks.map(s => s.boardName)).size} boards`,
    });
    queryClient.invalidateQueries(['featureSpec', specId]);
    onOpenChange(false);
  },
});
```

**Estimated Time**: 4 hours

---

### 2.4 NavigationFlowViewer Component

**File**: `src/components/feature-specs/NavigationFlowViewer.tsx`

**Purpose**: Visualize page navigation flow as interactive graph

**Dependencies**:
- `reactflow` library for graph visualization
- `shadcn/ui`: Card, Badge, Button
- `lucide-react`: ExternalLink, Edit, Trash2

**Props**:
```typescript
interface NavigationFlowViewerProps {
  projectId: string;
  flowId?: string;
  onEdit?: (flowId: string) => void;
  onDelete?: (flowId: string) => void;
}
```

**ReactFlow Integration**:
```typescript
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Convert backend data to ReactFlow format
const convertToReactFlowData = (
  nodes: PageFlowNode[],
  edges: PageFlowEdge[]
) => {
  const flowNodes: Node[] = nodes.map(node => ({
    id: node.id,
    type: 'custom',
    position: { x: node.positionX, y: node.positionY },
    data: {
      label: node.label,
      page: node.page,
      nodeType: node.nodeType,
    },
  }));

  const flowEdges: Edge[] = edges.map(edge => ({
    id: edge.id,
    source: edge.fromNodeId,
    target: edge.toNodeId,
    label: edge.label || edge.trigger,
    type: 'smoothstep',
    animated: edge.trigger === 'AUTO_REDIRECT',
  }));

  return { flowNodes, flowEdges };
};
```

**Custom Node Component**:
```jsx
const PageNode = ({ data }: { data: any }) => (
  <div className="bg-white border-2 border-blue-500 rounded-lg p-3 shadow-lg min-w-[150px]">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xl">{pageCategoryIcons[data.page.category]}</span>
      <span className="font-semibold text-sm">{data.label}</span>
    </div>
    <Badge className={pageStatusColors[data.page.status]}>
      {data.page.status}
    </Badge>
  </div>
);
```

**Estimated Time**: 8 hours

---

### 2.5 NavigationFlowEditor Component

**File**: `src/components/feature-specs/NavigationFlowEditor.tsx`

**Purpose**: Create/edit navigation flows with drag-and-drop interface

**Features**:
- Page selector (multiselect from project pages)
- Drag-and-drop node positioning
- Edge creation by clicking nodes
- Edge trigger selector (CLICK, SUBMIT, AUTO_REDIRECT, etc.)
- Auto-layout button (calls backend algorithm)
- Save and preview

**Form**:
```typescript
interface FlowFormData {
  name: string;
  description?: string;
  selectedPages: string[];
  connections: Array<{
    fromPageId: string;
    toPageId: string;
    trigger: EdgeTrigger;
    label?: string;
  }>;
  autoLayout: boolean;
}
```

**Estimated Time**: 10 hours

---

### 2.6 EnhancedProgressTracker Component

**File**: `src/components/feature-specs/EnhancedProgressTracker.tsx`

**Purpose**: Display enhanced progress with subtask breakdown and blockers

**Props**:
```typescript
interface EnhancedProgressTrackerProps {
  specId: string;
}
```

**Features**:
- Overall progress bar with weighted calculation
- Breakdown by main tasks and their subtasks
- Blocker alerts with task names
- Estimated hours remaining
- Phase progress indicators
- Board distribution chart (how many tasks on each board type)

**UI Layout**:
```jsx
<Card>
  <CardHeader>
    <CardTitle>Implementation Progress</CardTitle>
    <CardDescription>Weighted progress across all tasks and subtasks</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Overall Progress */}
    <div className="mb-6">
      <div className="flex justify-between mb-2">
        <span className="text-lg font-semibold">Overall Completion</span>
        <span className="text-2xl font-bold text-blue-600">
          {progress.totalProgress}%
        </span>
      </div>
      <Progress value={progress.totalProgress} className="h-4" />
    </div>

    {/* Hours Tracking */}
    <div className="grid grid-cols-3 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Estimated Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{progress.totalEstimatedHours}h</p>
        </CardContent>
      </Card>
      {/* ... actual hours and remaining ... */}
    </div>

    {/* Blockers Alert */}
    {progress.blockerCount > 0 && (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>
          {progress.blockerCount} tasks blocked by dependencies
        </AlertTitle>
        <AlertDescription>
          {progress.mainTasks
            .filter(t => t.blockedBy.length > 0)
            .map(t => (
              <div key={t.task.id}>
                <strong>{t.task.title}</strong> waiting on {t.blockedBy.length} dependencies
              </div>
            ))}
        </AlertDescription>
      </Alert>
    )}

    {/* Task Breakdown */}
    <div className="space-y-4 mt-6">
      {progress.mainTasks.map(mainTask => (
        <SubtaskHierarchy
          key={mainTask.task.id}
          specId={specId}
          mainTask={mainTask.task}
          onSubtaskUpdate={handleSubtaskUpdate}
        />
      ))}
    </div>
  </CardContent>
</Card>
```

**Estimated Time**: 6 hours

---

## 🔗 Phase 3: Integration & UI Updates

### 3.1 Enhance FeatureSpecDetailPage

**File**: `src/pages/FeatureSpecDetailPage.tsx`

**Changes**:

1. **Add Navigation Flow Tab**:
```jsx
<TabsList>
  {/* ... existing tabs ... */}
  {spec.pages && spec.pages.length > 0 && (
    <TabsTrigger value="navigation">
      <GitBranch className="h-4 w-4 mr-2" />
      {t('sdd.tabs.navigation')} ({navigationFlows?.length || 0})
    </TabsTrigger>
  )}
</TabsList>

<TabsContent value="navigation">
  <NavigationFlowViewer
    projectId={spec.projectId}
    onEdit={handleEditFlow}
    onDelete={handleDeleteFlow}
  />
</TabsContent>
```

2. **Replace Overview Progress with Enhanced Tracker**:
```jsx
<TabsContent value="overview">
  <Card>
    {/* ... existing metadata ... */}

    {/* Replace simple progress card with EnhancedProgressTracker */}
    <EnhancedProgressTracker specId={spec.id} />
  </Card>
</TabsContent>
```

3. **Update Tasks Tab with Subtask Hierarchy**:
```jsx
<TabsContent value="tasks">
  <div className="space-y-4">
    {/* Group tasks by main tasks */}
    {mainTasks.map(mainTask => (
      <SubtaskHierarchy
        key={mainTask.id}
        specId={spec.id}
        mainTask={mainTask}
        onSubtaskUpdate={handleSubtaskUpdate}
        onCreateSubtasks={handleCreateSubtasks}
      />
    ))}

    {/* Button to create new main task */}
    <Button onClick={() => setCreateMainTaskOpen(true)}>
      <Plus className="h-4 w-4 mr-2" />
      {t('sdd.tasks.createMainTask')}
    </Button>
  </div>
</TabsContent>
```

**Estimated Time**: 4 hours

---

### 3.2 Update TaskBoard Component

**File**: `src/components/feature-specs/TaskBoard.tsx`

**Changes**:

1. **Group by Main Tasks Instead of Phase**:
```typescript
// OLD: Group by phase
const tasksByPhase = tasks.reduce((acc, task) => {
  if (!acc[task.phase]) {
    acc[task.phase] = [];
  }
  acc[task.phase].push(task);
  return acc;
}, {} as Record<string, ImplementationTask[]>);

// NEW: Group by main task (separate main tasks and subtasks)
const mainTasks = tasks.filter(t => t.taskType === 'MAIN' || !t.taskType);
const subtasksMap = tasks
  .filter(t => t.parentTaskId)
  .reduce((acc, task) => {
    if (!acc[task.parentTaskId!]) {
      acc[task.parentTaskId!] = [];
    }
    acc[task.parentTaskId!].push(task);
    return acc;
  }, {} as Record<string, ImplementationTask[]>);

// Attach subtasks to main tasks
mainTasks.forEach(mainTask => {
  mainTask.subtasks = subtasksMap[mainTask.id] || [];
});
```

2. **Replace TaskCard with SubtaskHierarchy**:
```jsx
<div className="space-y-4">
  {mainTasks.map((mainTask) => (
    <SubtaskHierarchy
      key={mainTask.id}
      specId={specId}
      mainTask={mainTask}
      onSubtaskUpdate={(taskId, progress) =>
        updateProgressMutation.mutate({ taskId, progressPercent: progress })
      }
      onCreateSubtasks={(mainTaskId) =>
        setCreateSubtasksDialogOpen({ open: true, mainTaskId })
      }
    />
  ))}
</div>
```

**Estimated Time**: 3 hours

---

### 3.3 Add Navigation Flow Management to Project Pages

**File**: `src/pages/ProjectDetailPage.tsx` (or similar project overview page)

**Add Navigation Section**:
```jsx
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>Page Navigation Flows</CardTitle>
      <Button onClick={() => setCreateFlowOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Create Flow
      </Button>
    </div>
  </CardHeader>
  <CardContent>
    <ProjectNavigationOverview projectId={projectId} />
  </CardContent>
</Card>

<NavigationFlowEditor
  open={createFlowOpen}
  onOpenChange={setCreateFlowOpen}
  projectId={projectId}
/>
```

**Estimated Time**: 3 hours

---

## 🌐 Phase 4: Internationalization

### 4.1 Add Translation Keys

**Files**: `src/i18n/locales/en.json` and `src/i18n/locales/ja.json`

**New Keys**:
```json
{
  "sdd": {
    "subtasks": {
      "title": "Subtasks",
      "createSubtasks": "Create Subtasks",
      "mainTask": "Main Task",
      "frontendSubtask": "Frontend Subtask",
      "backendSubtask": "Backend Subtask",
      "databaseSubtask": "Database Subtask",
      "testingSubtask": "Testing Subtask",
      "deploymentSubtask": "Deployment Subtask",
      "progress": "Progress",
      "blockedBy": "Blocked by",
      "dependencies": "dependencies",
      "boardRouting": "Board Routing",
      "estimatedHours": "Estimated Hours",
      "actualHours": "Actual Hours",
      "selectTaskTypes": "Select Task Types",
      "distributeHours": "Distribute Hours Equally"
    },
    "navigation": {
      "title": "Navigation Flows",
      "createFlow": "Create Navigation Flow",
      "flowName": "Flow Name",
      "selectPages": "Select Pages",
      "addConnection": "Add Connection",
      "autoLayout": "Auto Layout",
      "orphanedPages": "Orphaned Pages",
      "totalFlows": "Total Flows",
      "nodeTypes": {
        "page": "Page",
        "modal": "Modal",
        "redirect": "Redirect",
        "condition": "Condition",
        "start": "Start",
        "end": "End"
      },
      "triggers": {
        "click": "Click",
        "submit": "Submit",
        "autoRedirect": "Auto Redirect",
        "condition": "Condition",
        "back": "Back",
        "authRequired": "Auth Required"
      }
    },
    "progress": {
      "enhanced": "Enhanced Progress",
      "weighted": "Weighted Progress",
      "overallCompletion": "Overall Completion",
      "estimatedRemaining": "Estimated Remaining",
      "blockerAlert": "Blocker Alert",
      "boardDistribution": "Board Distribution"
    },
    "tabs": {
      "navigation": "Navigation"
    }
  }
}
```

**Estimated Time**: 2 hours

---

## 🧪 Phase 5: Testing & Validation

### 5.1 Manual Testing Checklist

- [ ] **Subtask Creation**:
  - [ ] Create subtasks from main task
  - [ ] Verify board routing (Frontend → FRONTEND board, Backend → BACKEND board)
  - [ ] Check hours distribution
  - [ ] Validate priority propagation

- [ ] **Subtask Display**:
  - [ ] Collapsible main task hierarchy
  - [ ] Subtask progress sliders update correctly
  - [ ] Board badges display correct colors
  - [ ] Blocker warnings appear when dependencies exist

- [ ] **Progress Tracking**:
  - [ ] Weighted progress calculates correctly
  - [ ] Parent task progress = average of subtask progress
  - [ ] Hours tracking (estimated, actual, remaining) accurate
  - [ ] Blocker count matches dependency analysis

- [ ] **Navigation Flow**:
  - [ ] Create navigation flow with pages
  - [ ] Drag nodes to reposition
  - [ ] Create edges between nodes
  - [ ] Auto-layout positions nodes correctly
  - [ ] Edge labels display trigger types
  - [ ] Update and delete flows work
  - [ ] Orphaned pages detected correctly

- [ ] **Internationalization**:
  - [ ] All UI text translated in EN and JA
  - [ ] Language switching works correctly
  - [ ] No missing translation keys

- [ ] **Integration**:
  - [ ] FeatureSpecDetailPage displays all tabs correctly
  - [ ] TaskBoard groups by main tasks
  - [ ] API calls succeed with correct data
  - [ ] Query invalidation refreshes data
  - [ ] Error handling shows appropriate toasts

**Estimated Time**: 8 hours

---

### 5.2 Error Scenarios to Test

1. **API Failures**:
   - Network timeout during subtask creation
   - 404 when feature spec not found
   - 400 validation error for invalid task types

2. **Edge Cases**:
   - Main task with 0 subtasks
   - Main task with 10+ subtasks
   - Circular dependencies in navigation flow
   - Navigation flow with orphaned nodes
   - Progress updates with concurrent modifications

3. **UI Edge Cases**:
   - Very long task titles wrapping
   - Many subtasks causing scroll
   - Large navigation graphs (20+ pages)
   - Mobile responsive layouts

**Estimated Time**: 4 hours

---

## 📦 Phase 6: Documentation & Deployment

### 6.1 Component Documentation

**Create**: `src/components/feature-specs/README.md`

Document all new components with:
- Purpose and features
- Props interface with descriptions
- Usage examples
- Screenshots or GIFs
- Common patterns and best practices

**Estimated Time**: 3 hours

---

### 6.2 User Guide Updates

**Update**: Project documentation/user guides

Add sections for:
- How to create subtasks for main tasks
- Understanding board routing
- Creating navigation flows
- Reading enhanced progress reports
- Managing dependencies and blockers

**Estimated Time**: 2 hours

---

### 6.3 Deployment Checklist

- [ ] Build frontend (`npm run build`)
- [ ] Run type checking (`npm run type-check`)
- [ ] Run linter (`npm run lint`)
- [ ] Test production build locally
- [ ] Deploy to staging environment
- [ ] Smoke test all new features
- [ ] Deploy to production
- [ ] Monitor error logs for 24 hours

**Estimated Time**: 2 hours

---

## 📊 Time Estimates Summary

| Phase | Description | Hours |
|-------|-------------|-------|
| Phase 1 | Type Definitions & API Client | 3 |
| Phase 2 | UI Components | 37 |
| Phase 3 | Integration & UI Updates | 10 |
| Phase 4 | Internationalization | 2 |
| Phase 5 | Testing & Validation | 12 |
| Phase 6 | Documentation & Deployment | 7 |
| **Total** | | **71 hours** |

**Estimated Calendar Time**: 2-3 weeks for 1 developer

---

## 🎯 Implementation Priority

### High Priority (MVP)
1. ✅ Phase 1: Type definitions and API client (foundation)
2. ✅ SubtaskHierarchy + SubtaskCard components (core feature)
3. ✅ CreateSubtasksDialog component (user interaction)
4. ✅ EnhancedProgressTracker component (value demonstration)
5. ✅ Integrate into FeatureSpecDetailPage (visibility)

### Medium Priority (Enhanced UX)
6. ✅ NavigationFlowViewer component (visualization)
7. ✅ Update TaskBoard component (consistency)
8. ✅ Internationalization (user experience)
9. ✅ Testing & validation (quality assurance)

### Low Priority (Nice to Have)
10. ⏳ NavigationFlowEditor component (advanced feature)
11. ⏳ Project-level navigation overview (additional visibility)
12. ⏳ Documentation (knowledge sharing)

---

## 🔧 Technical Considerations

### Dependencies to Install

```bash
cd /Users/yujirohikawa/workspace/eurekalabo/eurekalabo

# Navigation flow visualization
npm install reactflow

# Already installed (verify):
# - @tanstack/react-query (API state management)
# - lucide-react (icons)
# - shadcn/ui components (UI framework)
```

### Performance Optimizations

1. **React Query Caching**:
   - Cache enhanced progress data for 5 minutes
   - Invalidate on task updates
   - Use background refetch for stale data

2. **ReactFlow Performance**:
   - Virtualize nodes for large graphs (>50 nodes)
   - Debounce node position updates
   - Lazy load flow data when tab is activated

3. **Component Optimization**:
   - Memoize SubtaskCard to prevent unnecessary re-renders
   - Use React.memo for PageFlowNode custom component
   - Debounce progress slider updates

### Responsive Design Considerations

- **Mobile**: Stack subtask cards vertically, hide graph on small screens
- **Tablet**: Show 2-column layout for subtasks, simplified graph
- **Desktop**: Full hierarchy with expand/collapse, interactive graph

---

## 🚀 Getting Started

### Step 1: Install Dependencies
```bash
cd /Users/yujirohikawa/workspace/eurekalabo/eurekalabo
npm install reactflow
```

### Step 2: Add Type Definitions
Start with `src/types/feature-spec.types.ts`

### Step 3: Update API Client
Add 7 new methods to `src/lib/api.ts`

### Step 4: Build Components Incrementally
Follow the component order in Phase 2

### Step 5: Integrate and Test
Update existing pages and test thoroughly

---

## 📝 Notes

- **Backend Status**: All 7 MCP tools and 7 API endpoints are complete and deployed to production (xeu server)
- **API Base URL**: Check `VITE_API_URL` environment variable (should point to production API)
- **Authentication**: API client already includes auth token interceptor
- **Existing Patterns**: Follow existing component structure (shadcn/ui + React Query + TypeScript)
- **Styling**: Use Tailwind CSS classes consistent with existing components
- **Icons**: Use lucide-react icons for consistency

---

## 🔗 Related Documentation

- Backend Implementation: `/Users/yujirohikawa/workspace/eurekalabo/mcp-server/docs/IMPLEMENTATION_STATUS.md`
- Backend Phase 2 Plan: `/Users/yujirohikawa/workspace/eurekalabo/mcp-server/docs/PHASE2_PLAN.md`
- Migration File: `/Users/yujirohikawa/workspace/eurekalabo/api/prisma/migrations/20251106021700_add_subtask_navigation_system/migration.sql`
- MCP Tools: `/Users/yujirohikawa/workspace/eurekalabo/mcp-server/src/tools/feature-spec-tools.ts`

---

**Status**: 📝 READY FOR IMPLEMENTATION
**Next Action**: Begin with Phase 1 (Type Definitions & API Client)
