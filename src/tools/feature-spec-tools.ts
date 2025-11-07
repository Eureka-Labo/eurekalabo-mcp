/**
 * Feature Spec Tools for MCP Server
 * AI-powered feature specification workflow
 */

import { getAPIClient } from '../api/client.js';

export interface ClarificationQuestion {
  question: string;
  type: 'boolean' | 'text' | 'url' | 'multiple_choice';
  options?: string[];
  placeholder?: string;
  key: string;
  dependsOn?: Record<string, any>;
}

export interface FeatureSpecProgress {
  totalTasks: number;
  completedTasks: number;
  completionPercentage: number;
}

export interface ExistingSpec {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  progress: FeatureSpecProgress;
}

export interface LoadedSpec {
  id: string;
  title: string;
  status: string;
  tasks: Array<any>;
  nextIncompleteTask?: any;
}

export interface StartFeatureDevelopmentResponse {
  sessionId: string;
  status: 'existing_specs_found' | 'spec_loaded' | 'ready_to_create';
  existingSpecs?: ExistingSpec[];
  loadedSpec?: LoadedSpec;
  featureSpecId?: string;
}

/**
 * Tool 1: Start Feature Development
 * Query existing feature specs and show progress, or prepare to create new spec
 */
export async function startFeatureDevelopment(args: {
  projectId: string;
  prompt: string;
  figmaUrl?: string;
  selectedExistingSpecId?: string;
  createNew?: boolean;
}): Promise<StartFeatureDevelopmentResponse> {
  try {
    const apiClient = getAPIClient();
    await apiClient.initialize();

    // 1. If user selected existing spec, load it
    if (args.selectedExistingSpecId) {
      const specResponse = await apiClient.get(`/api/v1/specs/${args.selectedExistingSpecId}`);
      const spec = specResponse.data.data || specResponse.data;

      const tasksResponse = await apiClient.get(
        `/api/v1/specs/${args.selectedExistingSpecId}/tasks`
      );
      const tasks = tasksResponse.data.data || tasksResponse.data || [];

      const nextIncomplete = tasks.find((t: any) => t.status !== 'COMPLETED' && t.status !== 'done');

      return {
        sessionId: `session-${Date.now()}`,
        status: 'spec_loaded',
        loadedSpec: {
          id: spec.id,
          title: spec.title,
          status: spec.status,
          tasks: tasks,
          nextIncompleteTask: nextIncomplete,
        },
      };
    }

    // 2. If user wants to create new, skip search
    if (args.createNew) {
      return {
        sessionId: `session-${Date.now()}`,
        status: 'ready_to_create',
      };
    }

    // 3. Search for existing specs with DRAFT/IN_PROGRESS/APPROVED status
    const projectId = apiClient.getProjectId();
    const response = await apiClient.get(`/api/v1/projects/${projectId}/specs`);
    const allSpecs = response.data.data || response.data || [];

    // Filter active specs
    const activeSpecs = allSpecs.filter((spec: any) =>
      ['DRAFT', 'IN_PROGRESS', 'APPROVED'].includes(spec.status)
    );

    if (activeSpecs.length === 0) {
      return {
        sessionId: `session-${Date.now()}`,
        status: 'ready_to_create',
      };
    }

    // 4. Calculate progress for each spec
    const specsWithProgress: ExistingSpec[] = await Promise.all(
      activeSpecs.map(async (spec: any) => {
        try {
          const tasksRes = await apiClient.get(`/api/v1/specs/${spec.id}/tasks`);
          const tasks = tasksRes.data.data || tasksRes.data || [];
          const completedTasks = tasks.filter(
            (t: any) => t.status === 'COMPLETED' || t.status === 'done'
          ).length;
          const completionPercentage =
            tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

          return {
            id: spec.id,
            title: spec.title,
            description: spec.description || '',
            status: spec.status,
            priority: spec.priority || 'MEDIUM',
            createdAt: spec.createdAt,
            progress: {
              totalTasks: tasks.length,
              completedTasks: completedTasks,
              completionPercentage: completionPercentage,
            },
          };
        } catch (error) {
          // If tasks endpoint fails, return spec with 0 progress
          return {
            id: spec.id,
            title: spec.title,
            description: spec.description || '',
            status: spec.status,
            priority: spec.priority || 'MEDIUM',
            createdAt: spec.createdAt,
            progress: {
              totalTasks: 0,
              completedTasks: 0,
              completionPercentage: 0,
            },
          };
        }
      })
    );

    return {
      sessionId: `session-${Date.now()}`,
      status: 'existing_specs_found',
      existingSpecs: specsWithProgress,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to start feature development: ${message}`);
  }
}

/**
 * Tool 2: Analyze Codebase
 * Scan project for existing pages, endpoints, and ER diagrams
 */
export async function analyzeCodebase(args: {
  projectId: string;
  analyzePages?: boolean;
  analyzeEndpoints?: boolean;
  analyzeErDiagrams?: boolean;
}): Promise<{
  pages: Array<any>;
  endpoints: Array<any>;
  erDiagrams: Array<any>;
  summary: {
    totalPages: number;
    totalEndpoints: number;
    totalSchemas: number;
    recommendations: string[];
  };
}> {
  try {
    const apiClient = getAPIClient();
    await apiClient.initialize();

    const projectId = apiClient.getProjectId();

    const results: any = {
      pages: [],
      endpoints: [],
      erDiagrams: [],
      summary: {
        totalPages: 0,
        totalEndpoints: 0,
        totalSchemas: 0,
        recommendations: [],
      },
    };

    // 1. Analyze pages
    if (args.analyzePages !== false) {
      try {
        const pagesRes = await apiClient.get(`/api/v1/projects/${projectId}/pages`);
        results.pages = pagesRes.data.data || pagesRes.data || [];
        results.summary.totalPages = results.pages.length;
      } catch (error) {
        console.error('Failed to fetch pages:', error);
      }
    }

    // 2. Analyze API endpoints
    if (args.analyzeEndpoints !== false) {
      try {
        const endpointsRes = await apiClient.get(`/api/v1/projects/${projectId}/api-specs`);
        results.endpoints = endpointsRes.data.data || endpointsRes.data || [];
        results.summary.totalEndpoints = results.endpoints.length;
      } catch (error) {
        console.error('Failed to fetch endpoints:', error);
      }
    }

    // 3. Analyze ER diagrams
    if (args.analyzeErDiagrams !== false) {
      try {
        const erDiagramsRes = await apiClient.get(`/api/v1/projects/${projectId}/er-diagrams`);
        results.erDiagrams = erDiagramsRes.data.data || erDiagramsRes.data || [];
        results.summary.totalSchemas = results.erDiagrams.length;
      } catch (error) {
        console.error('Failed to fetch ER diagrams:', error);
      }
    }

    // 4. Generate recommendations
    const recommendations: string[] = [];

    if (results.summary.totalPages === 0) {
      recommendations.push('No pages found - consider creating frontend pages');
    }
    if (results.summary.totalEndpoints === 0) {
      recommendations.push('No API endpoints found - consider defining backend APIs');
    }
    if (results.summary.totalSchemas === 0) {
      recommendations.push('No ER diagrams found - consider designing database schema');
    }

    // Check for common patterns
    const hasAuth = results.endpoints.some((e: any) =>
      e.path?.includes('/auth') || e.name?.toLowerCase().includes('auth')
    );
    if (!hasAuth && results.summary.totalEndpoints > 0) {
      recommendations.push('No authentication endpoints found - consider adding auth');
    }

    results.summary.recommendations = recommendations;

    return results;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to analyze codebase: ${message}`);
  }
}

/**
 * Tool 3: Get Feature Spec
 * Get detailed feature spec with tasks and progress
 */
export async function getFeatureSpec(args: {
  specId: string;
}): Promise<{
  spec: any;
  tasks: Array<any>;
  progress: {
    totalTasks: number;
    completedTasks: number;
    completionPercentage: number;
    tasksByPhase: Record<string, number>;
  };
}> {
  try {
    const apiClient = getAPIClient();
    await apiClient.initialize();

    // 1. Get spec details
    const specRes = await apiClient.get(`/api/v1/specs/${args.specId}`);
    const spec = specRes.data.data || specRes.data;

    // 2. Get tasks
    const tasksRes = await apiClient.get(`/api/v1/specs/${args.specId}/tasks`);
    const tasks = tasksRes.data.data || tasksRes.data || [];

    // 3. Calculate progress
    const completedTasks = tasks.filter((t: any) => t.status === 'COMPLETED' || t.status === 'done').length;
    const completionPercentage =
      tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    // 4. Group tasks by phase
    const tasksByPhase: Record<string, number> = {};
    tasks.forEach((task: any) => {
      const phase = task.phase || 'UNKNOWN';
      tasksByPhase[phase] = (tasksByPhase[phase] || 0) + 1;
    });

    return {
      spec,
      tasks,
      progress: {
        totalTasks: tasks.length,
        completedTasks,
        completionPercentage,
        tasksByPhase,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to get feature spec: ${message}`);
  }
}

/**
 * Tool 4: Create Feature Spec
 * Create a new feature specification with AI-generated content
 * ENHANCED: Now generates ALL artifacts (pages, endpoints, ER diagrams, navigation flow, task breakdown)
 */
export async function createFeatureSpec(args: {
  projectId: string;
  prompt: string;
  figmaUrl?: string;
  clarifications?: Record<string, any>;
}): Promise<{
  featureSpec: any;
  pages: any[];
  endpoints: any[];
  erDiagrams: any[];
  navigationFlow?: any;
  taskBreakdown?: any;
  validationStatus?: any;
}> {
  try {
    const apiClient = getAPIClient();
    await apiClient.initialize();

    const projectId = apiClient.getProjectId();

    // Call backend API to create feature spec with AI generation
    // ENHANCED: Force generation of ALL artifacts
    const response = await apiClient.post(`/api/v1/projects/${projectId}/specs`, {
      title: args.prompt.substring(0, 100), // First 100 chars as title
      description: args.prompt,
      priority: 'MEDIUM',
      figmaUrl: args.figmaUrl,
      clarifications: args.clarifications || {},

      // Force complete artifact generation
      generatePRD: true,
      generateImplementationPlan: true,
      generatePages: true,
      generateEndpoints: true,
      generateERDiagrams: true,
      generateNavigationFlow: true,
      generateSubtasks: true,
    });

    const result = response.data.data || response.data;

    // Validate completeness
    const missingArtifacts = [];
    if (!result.featureSpec?.prdDocument) missingArtifacts.push('PRD document');
    if (!result.pages || result.pages.length === 0) missingArtifacts.push('pages');
    if (!result.endpoints || result.endpoints.length === 0) missingArtifacts.push('endpoints');
    if (!result.erDiagrams || result.erDiagrams.length === 0) missingArtifacts.push('ER diagrams');

    if (missingArtifacts.length > 0) {
      console.warn(
        `⚠️ Feature spec created but missing artifacts: ${missingArtifacts.join(', ')}\n` +
        `Consider regenerating or manually creating these artifacts before starting work.`
      );
    }

    return {
      featureSpec: result.featureSpec,
      pages: result.pages || [],
      endpoints: result.endpoints || [],
      erDiagrams: result.erDiagrams || [],
      navigationFlow: result.navigationFlow,
      taskBreakdown: result.taskBreakdown,
      validationStatus: result.validationStatus || {
        ready: missingArtifacts.length === 0,
        missingArtifacts,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to create feature spec: ${message}`);
  }
}

/**
 * Tool 5: Link Task to Feature Spec
 * Create TaskFeatureSpec link between board task and feature spec
 */
export async function linkTaskToFeatureSpec(args: {
  taskId: string;
  featureSpecId: string;
  purpose?: string;
}): Promise<{
  success: boolean;
  link: any;
}> {
  try {
    const apiClient = getAPIClient();
    await apiClient.initialize();

    // Create TaskFeatureSpec link via API
    const response = await apiClient.post(`/api/v1/tasks/${args.taskId}/feature-specs`, {
      featureSpecId: args.featureSpecId,
      purpose: args.purpose || 'タスクの実装',
    });

    const link = response.data.data || response.data;

    return {
      success: true,
      link,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to link task to feature spec: ${message}`);
  }
}

/**
 * Tool 6: Get Page Navigation Flow
 * Get navigation flow for a project page
 */
export async function getPageNavigationFlow(args: {
  pageId: string;
}): Promise<{
  page: any;
  endpoints: any[];
  entities: string[];
  navigationFlow: {
    from: string[];
    to: string[];
  };
}> {
  try {
    const apiClient = getAPIClient();
    await apiClient.initialize();

    // Get page details
    const pageRes = await apiClient.get(`/api/v1/pages/${args.pageId}`);
    const page = pageRes.data.data || pageRes.data;

    // Get linked endpoints
    const endpointsRes = await apiClient.get(`/api/v1/pages/${args.pageId}/endpoints`);
    const endpoints = endpointsRes.data.data || endpointsRes.data || [];

    // Extract entities from page data
    const entities = page.entities || [];

    // TODO: Implement navigation flow analysis
    // This would analyze the page's links to other pages
    const navigationFlow = {
      from: [], // Pages that link to this page
      to: [],   // Pages this page links to
    };

    return {
      page,
      endpoints,
      entities,
      navigationFlow,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to get page navigation flow: ${message}`);
  }
}

/**
 * Tool 7: Create Subtasks for Feature Spec
 * Generate frontend, backend, and testing subtasks with auto-board routing
 */
export async function createSubtasks(args: {
  featureSpecId: string;
  mainTaskId: string;
  taskTypes?: ('FRONTEND_SUBTASK' | 'BACKEND_SUBTASK' | 'DATABASE_SUBTASK' | 'TESTING_SUBTASK' | 'DEPLOYMENT_SUBTASK')[];
  estimatedHours?: number;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}): Promise<{
  success: boolean;
  subtasks: Array<{
    taskId: string;
    taskType: string;
    boardId: string;
    boardName: string;
  }>;
  totalEstimatedHours: number;
}> {
  try {
    const apiClient = getAPIClient();
    await apiClient.initialize();

    const response = await apiClient.post(`/api/v1/specs/${args.featureSpecId}/subtasks`, {
      mainTaskId: args.mainTaskId,
      taskTypes: args.taskTypes || ['FRONTEND_SUBTASK', 'BACKEND_SUBTASK', 'TESTING_SUBTASK'],
      estimatedHours: args.estimatedHours,
      priority: args.priority || 'MEDIUM',
    });

    const result = response.data.data || response.data;

    return {
      success: true,
      subtasks: result.subtasks,
      totalEstimatedHours: result.totalEstimatedHours,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to create subtasks: ${message}`);
  }
}

/**
 * Tool 8: Create Navigation Flow
 * Create a visual navigation flow diagram for project pages
 */
export async function createNavigationFlow(args: {
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
    trigger: 'CLICK' | 'SUBMIT' | 'AUTO_REDIRECT' | 'CONDITION' | 'BACK' | 'AUTH_REQUIRED';
    label?: string;
    condition?: string;
  }>;
  autoLayout?: boolean;
}): Promise<{
  success: boolean;
  flow: any;
}> {
  try {
    const apiClient = getAPIClient();
    await apiClient.initialize();

    const projectId = apiClient.getProjectId();

    const response = await apiClient.post(`/api/v1/projects/${projectId}/navigation-flows`, {
      name: args.name,
      description: args.description,
      pages: args.pages,
      connections: args.connections,
      autoLayout: args.autoLayout !== false, // Default true
    });

    const flow = response.data.data || response.data;

    return {
      success: true,
      flow,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to create navigation flow: ${message}`);
  }
}

/**
 * Tool 9: Get Navigation Flow
 * Get detailed navigation flow with nodes and edges
 */
export async function getNavigationFlow(args: {
  flowId: string;
}): Promise<{
  flow: any;
  nodes: Array<any>;
  edges: Array<any>;
}> {
  try {
    const apiClient = getAPIClient();
    await apiClient.initialize();

    const response = await apiClient.get(`/api/v1/navigation-flows/${args.flowId}`);
    const result = response.data.data || response.data;

    return {
      flow: result.flow,
      nodes: result.nodes || [],
      edges: result.edges || [],
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to get navigation flow: ${message}`);
  }
}

/**
 * Tool 10: Update Navigation Flow
 * Update navigation flow structure and layout
 */
export async function updateNavigationFlow(args: {
  flowId: string;
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
    trigger: 'CLICK' | 'SUBMIT' | 'AUTO_REDIRECT' | 'CONDITION' | 'BACK' | 'AUTH_REQUIRED';
    label?: string;
    condition?: string;
  }>;
  autoLayout?: boolean;
}): Promise<{
  success: boolean;
  flow: any;
}> {
  try {
    const apiClient = getAPIClient();
    await apiClient.initialize();

    const response = await apiClient.post(`/api/v1/navigation-flows/${args.flowId}`, {
      name: args.name,
      description: args.description,
      pages: args.pages,
      connections: args.connections,
      autoLayout: args.autoLayout,
    });

    const flow = response.data.data || response.data;

    return {
      success: true,
      flow,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to update navigation flow: ${message}`);
  }
}

/**
 * Tool 11: Delete Navigation Flow
 * Delete a navigation flow diagram
 */
export async function deleteNavigationFlow(args: {
  flowId: string;
}): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const apiClient = getAPIClient();
    await apiClient.initialize();

    await apiClient.post(`/api/v1/navigation-flows/${args.flowId}/delete`, {});

    return {
      success: true,
      message: 'Navigation flow deleted successfully',
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to delete navigation flow: ${message}`);
  }
}

/**
 * Tool 12: Get Enhanced Spec Progress
 * Get progress with subtask breakdown and dependency tracking
 */
export async function getEnhancedSpecProgress(args: {
  specId: string;
}): Promise<{
  spec: any;
  mainTasks: Array<{
    task: any;
    subtasks: Array<any>;
    progress: number;
    blockedBy: string[];
  }>;
  overallProgress: {
    totalTasks: number;
    completedTasks: number;
    percentage: number;
    estimatedHoursRemaining: number;
  };
}> {
  try {
    const apiClient = getAPIClient();
    await apiClient.initialize();

    const response = await apiClient.get(`/api/v1/specs/${args.specId}/progress`);
    const result = response.data.data || response.data;

    return result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to get enhanced spec progress: ${message}`);
  }
}

/**
 * Tool 13: Get Project Navigation Overview
 * Get all navigation flows and page relationships for a project
 */
export async function getProjectNavigationOverview(args: {
  projectId: string;
}): Promise<{
  flows: Array<any>;
  pages: Array<any>;
  totalFlows: number;
  totalPages: number;
  orphanedPages: Array<any>; // Pages not in any flow
}> {
  try {
    const apiClient = getAPIClient();
    await apiClient.initialize();

    const projectId = apiClient.getProjectId();

    const response = await apiClient.get(`/api/v1/projects/${projectId}/navigation-overview`);
    const result = response.data.data || response.data;

    return result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to get project navigation overview: ${message}`);
  }
}

/**
 * Tool 14: Validate Feature Spec Readiness
 * Check if all required artifacts exist before allowing work to start
 * CRITICAL: Must be called before start_work_on_task to ensure complete setup
 */
export async function validateFeatureSpecReadiness(args: {
  specId: string;
}): Promise<{
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
}> {
  try {
    const apiClient = getAPIClient();
    await apiClient.initialize();

    // Try to use backend validation endpoint if available
    try {
      const response = await apiClient.get(`/api/v1/specs/${args.specId}/validate-readiness`);
      return response.data.data || response.data;
    } catch (error) {
      // If backend endpoint doesn't exist yet, perform client-side validation
      console.warn('Backend validation endpoint not available, performing client-side validation');
    }

    // Client-side validation fallback
    const spec = await getFeatureSpec({ specId: args.specId });
    const missingArtifacts: string[] = [];
    const blockers: string[] = [];

    // Check feature spec
    const hasSpec = !!spec.spec;
    const hasPRD = !!spec.spec?.prdDocument;
    const hasPlan = !!spec.spec?.implementationPlan;

    if (!hasSpec) missingArtifacts.push('feature spec');
    if (!hasPRD) missingArtifacts.push('PRD document');
    if (!hasPlan) missingArtifacts.push('implementation plan');

    // Check pages
    const pages = spec.spec?.pages || [];
    const pageCount = pages.length;
    if (pageCount === 0) {
      missingArtifacts.push('pages');
      blockers.push('No pages created - frontend implementation will lack context');
    }

    // Check endpoints (need to fetch separately)
    let endpoints: any[] = [];
    let erDiagrams: any[] = [];
    try {
      const projectId = apiClient.getProjectId();
      const endpointsRes = await apiClient.get(`/api/v1/projects/${projectId}/api-specs`);
      endpoints = endpointsRes.data.data || endpointsRes.data || [];

      const erRes = await apiClient.get(`/api/v1/projects/${projectId}/er-diagrams`);
      erDiagrams = erRes.data.data || erRes.data || [];
    } catch (error) {
      console.warn('Failed to fetch endpoints or ER diagrams:', error);
    }

    if (endpoints.length === 0) {
      missingArtifacts.push('API endpoints');
      blockers.push('No API endpoints defined - backend implementation will lack specification');
    }

    if (erDiagrams.length === 0) {
      missingArtifacts.push('ER diagrams');
      blockers.push('No database schema defined - data models unclear');
    }

    // Check navigation flow
    let hasNavigationFlow = false;
    try {
      const projectId = apiClient.getProjectId();
      const flowsRes = await apiClient.get(`/api/v1/projects/${projectId}/navigation-overview`);
      const flows = flowsRes.data.data?.flows || [];
      hasNavigationFlow = flows.length > 0;
    } catch (error) {
      console.warn('Failed to check navigation flows:', error);
    }

    if (!hasNavigationFlow) {
      missingArtifacts.push('navigation flow');
      blockers.push('No navigation flow defined - page relationships unclear');
    }

    // Check tasks
    const tasks = spec.tasks || [];
    const mainTask = tasks.find((t: any) => t.featureSpecs?.some((fs: any) => fs.featureSpecId === args.specId));
    const subtasks = tasks.filter((t: any) => t.parentTaskId === mainTask?.id);

    const hasMainTask = !!mainTask;
    const subtaskCount = subtasks.length;

    if (!hasMainTask) {
      missingArtifacts.push('main task');
      blockers.push('No main task created - cannot track feature implementation');
    }

    if (subtaskCount === 0) {
      missingArtifacts.push('subtasks');
      blockers.push('No subtasks created - implementation not broken down into manageable work units');
    }

    const ready = missingArtifacts.length === 0;

    return {
      ready,
      checklist: {
        featureSpec: { exists: hasSpec, hasPRD, hasPlan },
        pages: {
          count: pageCount,
          allValid: pageCount > 0,
          list: pages.map((p: any) => p.name || p.path),
        },
        endpoints: {
          count: endpoints.length,
          allValid: endpoints.length > 0,
          list: endpoints.map((e: any) => `${e.method} ${e.path}`),
        },
        erDiagrams: {
          count: erDiagrams.length,
          allValid: erDiagrams.length > 0,
          list: erDiagrams.map((e: any) => e.title || e.name),
        },
        navigationFlow: {
          exists: hasNavigationFlow,
          hasNodes: hasNavigationFlow,
          hasEdges: hasNavigationFlow,
        },
        tasks: {
          mainTask: { exists: hasMainTask, linked: hasMainTask },
          subtasks: {
            count: subtaskCount,
            allLinked: subtaskCount > 0,
            dependenciesSet: subtaskCount > 0,
          },
        },
      },
      missingArtifacts,
      blockers,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to validate feature spec readiness: ${message}`);
  }
}
