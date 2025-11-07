---
name: api-doc-generator
description: Automatically generates OpenAPI/Swagger documentation from API code. Extracts routes, parameters, responses, and creates comprehensive API specs in Japanese and English. Use when creating or modifying API endpoints.
allowed-tools: Read, Grep, Write, Glob
---

# API Documentation Generator

Automatically extracts API endpoint information from code and generates comprehensive OpenAPI 3.1 specifications with bilingual descriptions (Japanese primary, English secondary).

## Auto-Activation Triggers

- **File Patterns**: `**/routes/*.ts`, `**/api/*.ts`, `**/controllers/*.ts`, `**/*Controller.ts`, `**/endpoints/*.ts`
- **Keywords**: "API", "endpoint", "route", "REST", "GraphQL", "エンドポイント", "API追加"
- **Operations**: After creating/modifying API route files
- **Manual**: "generate API docs", "update swagger", "create OpenAPI spec"

## Supported Frameworks

### 1. Express.js (TypeScript/JavaScript)
```typescript
// Detects patterns like:
router.get('/users/:id', async (req, res) => { ... });
router.post('/auth/login', authController.login);
app.use('/api/v1', routes);
```

### 2. Fastify (TypeScript)
```typescript
// Detects patterns like:
fastify.get('/users/:id', async (request, reply) => { ... });
fastify.post<{ Body: LoginRequest }>('/auth/login', { ... });
```

### 3. Prisma-based APIs
```typescript
// Extracts from:
prisma.user.findMany({ ... });
prisma.task.create({ data: ... });
```

### 4. Next.js API Routes
```typescript
// app/api/users/[id]/route.ts
export async function GET(request: Request) { ... }
export async function POST(request: Request) { ... }
```

### 5. tRPC
```typescript
// Detects procedures:
.query('getUser', { ... })
.mutation('createTask', { ... })
```

## Documentation Extraction

### Step 1: Discover API Files

```javascript
// Find all API-related files
const apiFiles = await Glob("**/{routes,api,controllers,endpoints}/**/*.{ts,js}");

// Filter to actual API definitions
const routeFiles = apiFiles.filter(file =>
  !file.includes('test') &&
  !file.includes('spec') &&
  !file.includes('mock')
);
```

### Step 2: Parse Endpoints

For each file, extract:

```javascript
const endpoint = {
  path: '/api/users/:id',
  method: 'GET',
  summary: extractJSDoc(functionNode, 'summary'),
  description: extractJSDoc(functionNode, 'description'),
  parameters: extractParameters(functionNode),
  requestBody: extractRequestBody(functionNode),
  responses: extractResponses(functionNode),
  tags: detectTags(filePath),
  security: detectAuth(functionNode),
  examples: extractExamples(functionNode)
};
```

### Step 3: Extract Type Information

```typescript
// From TypeScript types
interface CreateUserRequest {
  /** ユーザーのメールアドレス */
  email: string;
  /** ユーザー名 (3-50文字) */
  name: string;
  /** パスワード (最小8文字) */
  password: string;
}

// Converts to OpenAPI schema
{
  "type": "object",
  "required": ["email", "name", "password"],
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "description": "ユーザーのメールアドレス / User's email address"
    },
    "name": {
      "type": "string",
      "minLength": 3,
      "maxLength": 50,
      "description": "ユーザー名 (3-50文字) / Username (3-50 characters)"
    },
    "password": {
      "type": "string",
      "minLength": 8,
      "description": "パスワード (最小8文字) / Password (minimum 8 characters)"
    }
  }
}
```

### Step 4: Detect Authentication

```javascript
// Recognizes auth patterns
if (code.includes('authenticate') || code.includes('requireAuth')) {
  endpoint.security = [{ bearerAuth: [] }];
}

if (code.includes('jwt') || code.includes('JWT')) {
  endpoint.security = [{ JWT: [] }];
}

if (code.includes('ApiKey') || code.includes('X-API-Key')) {
  endpoint.security = [{ apiKey: [] }];
}
```

### Step 5: Extract Response Examples

```javascript
// From code comments or return statements
/**
 * @example
 * {
 *   "id": "user_123",
 *   "email": "user@example.com",
 *   "name": "山田太郎",
 *   "createdAt": "2024-01-15T10:30:00Z"
 * }
 */
```

## OpenAPI Generation

### Full Spec Structure

```yaml
openapi: 3.1.0
info:
  title: Eureka Tasks API
  description: |
    Eureka Tasks プロジェクト管理システムのREST API

    Project management system REST API for Eureka Tasks
  version: 1.0.0
  contact:
    name: Eureka Labo Team
    email: support@eurekalabo.com
    url: https://eurekalabo.com

servers:
  - url: https://api.eurekalabo.com/v1
    description: Production server
  - url: https://staging-api.eurekalabo.com/v1
    description: Staging server
  - url: http://localhost:3000/api/v1
    description: Development server

tags:
  - name: Users
    description: ユーザー管理 / User management
  - name: Tasks
    description: タスク管理 / Task management
  - name: Projects
    description: プロジェクト管理 / Project management

paths:
  /users/{id}:
    get:
      summary: ユーザー情報取得
      description: |
        指定されたIDのユーザー情報を取得します。

        Retrieves user information for the specified ID.
      tags:
        - Users
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
          description: ユーザーID / User ID
      responses:
        '200':
          description: 成功 / Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
              examples:
                user:
                  value:
                    id: "user_123"
                    email: "yamada@example.com"
                    name: "山田太郎"
                    createdAt: "2024-01-15T10:30:00Z"
        '404':
          description: ユーザーが見つかりません / User not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          description: ユーザーID / User ID
        email:
          type: string
          format: email
          description: メールアドレス / Email address
        name:
          type: string
          description: ユーザー名 / Username
        createdAt:
          type: string
          format: date-time
          description: 作成日時 / Creation timestamp
      required:
        - id
        - email
        - name

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT認証トークン / JWT authentication token

security:
  - bearerAuth: []
```

## Smart Features

### 1. Bilingual Descriptions

Automatically generates both Japanese and English descriptions:

```typescript
/**
 * ユーザーを作成します
 */
async function createUser() { ... }

// Generates:
{
  "summary": "ユーザー作成",
  "description": "新しいユーザーを作成します。\n\nCreates a new user."
}
```

### 2. Type-to-Schema Conversion

```typescript
// From TypeScript interface
interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  assigneeId: string | null;
  dueDate: Date | null;
}

// To OpenAPI schema
{
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "title": { "type": "string" },
    "status": {
      "type": "string",
      "enum": ["todo", "in_progress", "done"]
    },
    "priority": {
      "type": "string",
      "enum": ["low", "medium", "high"],
      "nullable": true
    },
    "assigneeId": {
      "type": "string",
      "nullable": true
    },
    "dueDate": {
      "type": "string",
      "format": "date-time",
      "nullable": true
    }
  },
  "required": ["id", "title", "status"]
}
```

### 3. Validation Rules Extraction

```typescript
// From validation decorators or Zod schemas
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(3).max(50),
  age: z.number().int().min(0).max(150).optional()
});

// To OpenAPI
{
  "email": {
    "type": "string",
    "format": "email"
  },
  "name": {
    "type": "string",
    "minLength": 3,
    "maxLength": 50
  },
  "age": {
    "type": "integer",
    "minimum": 0,
    "maximum": 150,
    "nullable": true
  }
}
```

### 4. Error Response Standardization

```javascript
// Detects common error patterns
const standardErrors = {
  400: {
    description: "リクエストが不正です / Bad request",
    schema: { $ref: '#/components/schemas/ValidationError' }
  },
  401: {
    description: "認証が必要です / Authentication required",
    schema: { $ref: '#/components/schemas/AuthError' }
  },
  403: {
    description: "アクセスが拒否されました / Access forbidden",
    schema: { $ref: '#/components/schemas/ForbiddenError' }
  },
  404: {
    description: "リソースが見つかりません / Resource not found",
    schema: { $ref: '#/components/schemas/NotFoundError' }
  },
  500: {
    description: "サーバーエラーが発生しました / Internal server error",
    schema: { $ref: '#/components/schemas/ServerError' }
  }
};
```

### 5. Tag Auto-Detection

```javascript
// From file structure
const tagMapping = {
  'routes/users': ['Users'],
  'routes/tasks': ['Tasks'],
  'routes/projects': ['Projects'],
  'routes/auth': ['Authentication'],
  'routes/admin': ['Admin']
};
```

## Output Files

### 1. OpenAPI Specification
```
docs/api/openapi.yaml  (primary)
docs/api/openapi.json  (alternative)
```

### 2. Swagger UI Integration
```html
<!-- docs/api/index.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Eureka Tasks API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: './openapi.yaml',
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [SwaggerUIBundle.presets.apis],
      layout: "BaseLayout"
    });
  </script>
</body>
</html>
```

### 3. Postman Collection Export
```json
// docs/api/postman-collection.json
{
  "info": {
    "name": "Eureka Tasks API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/"
  },
  "item": [...]
}
```

## Integration with Workflow

### Auto-Generate on API Changes

```javascript
// After editing API file
User: "Add POST /api/tasks endpoint"

→ eureka-task-coding creates task
→ User implements endpoint in routes/tasks.ts
→ api-doc-generator activates (THIS SKILL)
→ Extracts new endpoint
→ Updates openapi.yaml
→ Generates Swagger UI
→ Notifies user: "API documentation updated"
```

### Validation Before Completion

```javascript
// Before completing task with API changes
await mcp__eureka-tasks__complete_task_work({ ... });

→ Skill checks for API changes
→ If found: "Generate/update API docs?"
→ User confirms
→ Docs generated and committed with task
```

## Examples

### Example 1: Express.js Endpoint

**Input Code** (`routes/tasks.ts`):
```typescript
/**
 * タスク一覧を取得
 * Get task list
 *
 * @param {string} status - Filter by status (optional)
 * @param {string} assigneeId - Filter by assignee (optional)
 * @returns {Task[]} Array of tasks
 */
router.get('/tasks', authenticate, async (req, res) => {
  const { status, assigneeId } = req.query;

  const tasks = await prisma.task.findMany({
    where: {
      ...(status && { status }),
      ...(assigneeId && { assigneeId })
    }
  });

  res.json(tasks);
});
```

**Generated OpenAPI**:
```yaml
paths:
  /tasks:
    get:
      summary: タスク一覧を取得
      description: |
        タスク一覧を取得します。ステータスや担当者でフィルタリング可能です。

        Get task list. Can be filtered by status or assignee.
      tags:
        - Tasks
      security:
        - bearerAuth: []
      parameters:
        - name: status
          in: query
          required: false
          schema:
            type: string
            enum: [todo, in_progress, done]
          description: ステータスでフィルタ / Filter by status
        - name: assigneeId
          in: query
          required: false
          schema:
            type: string
          description: 担当者IDでフィルタ / Filter by assignee ID
      responses:
        '200':
          description: 成功 / Success
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Task'
```

### Example 2: Next.js API Route

**Input Code** (`app/api/users/[id]/route.ts`):
```typescript
/**
 * ユーザー情報を取得
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await prisma.user.findUnique({
    where: { id: params.id }
  });

  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(user);
}
```

**Generated OpenAPI**:
```yaml
paths:
  /users/{id}:
    get:
      summary: ユーザー情報を取得
      description: Get user information
      tags:
        - Users
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
          description: ユーザーID / User ID
      responses:
        '200':
          description: 成功 / Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          description: ユーザーが見つかりません / User not found
```

## Error Handling

### No API Files Found
```
ℹ️ API endpoints not detected in this change.

Searched patterns:
- routes/**/*.ts
- api/**/*.ts
- controllers/**/*.ts

Skipping API documentation generation.
```

### Parsing Errors
```
⚠️ Could not parse endpoint: routes/complex-route.ts:45

Reason: Complex dynamic routing pattern not supported

Manual documentation may be required for:
- Dynamic route generation
- Custom middleware chains
- Programmatic route registration

Add JSDoc comments to help parser understand the endpoint.
```

### Type Information Missing
```
⚠️ Type information incomplete for endpoint: POST /api/tasks

Missing:
- Request body schema (add TypeScript interface)
- Response schema (add return type annotation)

Recommendation:
interface CreateTaskRequest {
  title: string;
  description: string;
}

router.post<CreateTaskRequest>('/tasks', async (req, res) => {
  const task: Task = await createTask(req.body);
  res.json(task);
});
```

## Configuration

### Custom Configuration File

`.claude/api-doc-config.json`:
```json
{
  "output": {
    "format": "yaml",
    "path": "docs/api/openapi.yaml",
    "generateSwagger": true,
    "generatePostman": true
  },
  "servers": [
    {
      "url": "https://api.eurekalabo.com/v1",
      "description": "Production"
    }
  ],
  "info": {
    "title": "Eureka Tasks API",
    "version": "1.0.0",
    "contact": {
      "email": "support@eurekalabo.com"
    }
  },
  "includePatterns": [
    "src/routes/**/*.ts",
    "src/api/**/*.ts"
  ],
  "excludePatterns": [
    "**/*.test.ts",
    "**/*.spec.ts"
  ],
  "bilingual": true,
  "primaryLanguage": "ja",
  "secondaryLanguage": "en"
}
```

## Best Practices

1. **Add JSDoc comments**: Helps skill extract accurate descriptions
2. **Use TypeScript types**: Enables automatic schema generation
3. **Consistent error handling**: Standardized error responses
4. **Example responses**: Add @example tags for better docs
5. **Authentication docs**: Clearly mark auth requirements

## Performance

- Parsing: 2-5 seconds for 50 endpoints
- Schema generation: 1-2 seconds
- File writing: < 1 second
- Total: Usually < 10 seconds for full API documentation

## Permissions Required

- Read: API route files, type definitions
- Write: OpenAPI spec files, Swagger UI files
- Glob: Search for API files in project
