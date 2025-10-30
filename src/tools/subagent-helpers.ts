/**
 * Sub-Agent Integration Helpers
 * Provides reusable patterns for launching Claude Code sub-agents via MCP tools
 */

/**
 * Sub-agent types available in Claude Code
 */
export type SubAgentType =
  | 'technical-writer'
  | 'system-architect'
  | 'devops-architect'
  | 'quality-engineer'
  | 'security-engineer'
  | 'performance-engineer'
  | 'pm-agent'
  | 'root-cause-analyst'
  | 'requirements-analyst'
  | 'deep-research-agent';

/**
 * Generate a sub-agent task prompt for commit message generation
 */
export function generateCommitMessagePrompt(gitDiff: string, taskContext?: any): string {
  return `Analyze git changes and generate an intelligent commit message.

## Git Changes
\`\`\`diff
${gitDiff}
\`\`\`

${taskContext ? `## Task Context
${JSON.stringify(taskContext, null, 2)}
` : ''}

## Requirements
Generate a commit message that:
1. Follows Conventional Commits format (e.g., "feat:", "fix:", "refactor:")
2. Includes Japanese summary in the body (必須)
3. Is clear and descriptive (explains WHAT and WHY)
4. Uses emoji sparingly and only if appropriate
5. Keeps subject line under 72 characters
6. Includes detailed body if changes are complex

## Output Format
Return ONLY the commit message text, formatted and ready to use with git commit.
Do not include explanations, code blocks, or extra commentary.
**IMPORTANT**: Always include a Japanese summary (日本語の説明) in the commit body.

Example output:
\`\`\`
feat: Add user authentication with JWT

JWT 認証機能を実装しました。すべての API ルートを保護する認証ミドルウェアを追加し、
bcrypt によるパスワードハッシュ化とリフレッシュトークンのサポートを含みます。

Implement JWT-based authentication middleware for all API routes.
Includes bcrypt password hashing and refresh token support.

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
\`\`\`
`;
}

/**
 * Generate a sub-agent task prompt for PR description
 */
export function generatePRDescriptionPrompt(
  branchTasks: any[],
  gitDiff: string,
  baseBranch: string = 'main'
): string {
  return `Generate a comprehensive Pull Request description from branch tasks and git changes.

## Branch Tasks (${branchTasks.length} tasks)
${branchTasks.map((task, idx) => `
### Task ${idx + 1}: ${task.title}
- **Status**: ${task.status}
- **Summary**: ${task.summary || 'N/A'}
- **Changes**: ${task.filesChanged || 0} files, +${task.linesAdded || 0}/-${task.linesRemoved || 0}
`).join('\n')}

## Git Changes Summary
\`\`\`
${gitDiff}
\`\`\`

## Requirements
Generate a PR description that:
1. **タイトル**: 明確で簡潔な変更内容の説明（50-72文字）
2. **概要**: 実装内容を2-3文で説明
3. **変更内容**: 主要な変更のリスト
4. **テストチェックリスト**: 確認すべき項目のリスト
5. **破壊的変更**: 破壊的変更がある場合はそのセクション
6. **関連タスク**: 上記で言及されたタスクIDへのリンク

## Output Format
Return the PR description in GitHub-flavored markdown, formatted and ready to paste.
**IMPORTANT**: All content must be in Japanese.

Example output:
\`\`\`markdown
## 概要
ユーザー認証機能を実装しました。JWT トークンベースの認証ミドルウェアを追加し、すべての API ルートを保護します。

## 変更内容
- JWT 認証ミドルウェアを追加
- bcrypt によるパスワードハッシュ化を実装
- リフレッシュトークンのサポートを追加
- API エンドポイントを保護

## テストチェックリスト
- [ ] ログインフローが正しく動作する
- [ ] トークンの更新が機能する
- [ ] 保護されたルートで認証が必要になる
- [ ] パスワードハッシュ化が安全である

## 破壊的変更
なし

## 関連タスク
- Task #123: ユーザー認証機能の実装

---
🤖 Generated with Claude Code
\`\`\`
`;
}

/**
 * Generate a sub-agent task prompt for setup validation
 */
export function generateSetupValidationPrompt(projectPath: string): string {
  return `Validate the eurekaclaude MCP server installation and configuration.

## Project Path
${projectPath}

## Validation Checklist
Perform these checks and report status:

1. **Environment Variables**
   - Check EUREKA_API_KEY exists and is non-empty
   - Check EUREKA_API_URL (optional, has default)

2. **Git Repository**
   - Verify project is a git repository
   - Check git is installed and accessible
   - Verify clean working directory status

3. **Claude Code Integration**
   - Check if claude_desktop_config.json exists
   - Verify eurekaclaude MCP server is configured
   - Validate configuration syntax

4. **Work Session State**
   - Check for active work sessions
   - Verify .eureka-sessions directory exists
   - Check for any orphaned sessions

5. **CLI Tool Accessibility**
   - Verify eurekaclaude CLI is installed
   - Check node/npm versions
   - Validate CLI can execute

## Output Format
Return a structured health report:

\`\`\`markdown
# 🔍 EurekaClaude Setup Validation Report

## ✅ Passing Checks
- Environment: EUREKA_API_KEY configured
- Git: Repository initialized, clean working directory
- MCP: Configured in Claude Desktop

## ⚠️ Warnings
- No active work sessions (this may be normal)

## ❌ Critical Issues
None detected

## 🔧 Recommended Actions
1. Run: \`eurekaclaude --version\` to verify CLI
2. Consider: Creating your first task with \`mcp__eureka-tasks__create_task\`

## 📊 System Info
- Node: v20.x.x
- Git: 2.x.x
- Workspace: ${projectPath}
\`\`\`
`;
}

/**
 * Generate a sub-agent task prompt for project setup
 */
export function generateSmartSetupPrompt(
  projectPath: string,
  projectType?: string
): string {
  return `Analyze the project and generate optimal eurekaclaude MCP server configuration.

## Project Path
${projectPath}

${projectType ? `## Project Type Hint
${projectType}
` : ''}

## Analysis Tasks
1. **Detect Project Type**
   - Analyze package.json, requirements.txt, or other manifest files
   - Identify framework (React, Vue, Python, Go, etc.)
   - Determine project structure patterns

2. **Generate Configuration**
   - Create claude_desktop_config.json entry
   - Set optimal environment variables
   - Configure workspace paths

3. **Recommend Hooks**
   - Suggest pre-commit hooks based on project type
   - Recommend commit message validation
   - Propose test running hooks

4. **Create Task Templates**
   - Generate common task patterns for this project
   - Create workflow automation suggestions

## Output Format
Return a JSON object with configuration:

\`\`\`json
{
  "claudeConfig": {
    "mcpServers": {
      "eureka-tasks": {
        "command": "node",
        "args": ["/path/to/mcp-server/dist/index.js"],
        "env": {
          "EUREKA_API_KEY": "your-api-key-here",
          "EUREKA_API_URL": "https://api.eurekalabo.com",
          "EUREKA_WORKSPACE_PATH": "${projectPath}"
        }
      }
    }
  },
  "recommendedHooks": [
    {
      "name": "pre-commit",
      "description": "Validate code before commit",
      "script": "npm run lint && npm test"
    }
  ],
  "taskTemplates": [
    {
      "title": "バグ修正",
      "description": "バグの修正作業",
      "priority": "high"
    }
  ],
  "setupSteps": [
    "1. Copy claude_desktop_config.json to ~/Library/Application Support/Claude/",
    "2. Set EUREKA_API_KEY environment variable",
    "3. Restart Claude Desktop",
    "4. Test with mcp__eureka-tasks__list_tasks"
  ]
}
\`\`\`
`;
}

/**
 * Create a sub-agent invocation instruction for Claude Code
 * This returns text that tells Claude Code to launch a sub-agent
 */
export function createSubAgentInvocation(
  agentType: SubAgentType,
  prompt: string,
  description: string
): string {
  return `🤖 Launch Claude Code Sub-Agent

Please use the Task tool to launch a specialized sub-agent:

**Sub-Agent Type**: ${agentType}
**Task Description**: ${description}

**Prompt**:
${prompt}

**Instructions**:
1. Use the Task tool with subagent_type="${agentType}"
2. Pass the prompt above
3. Return the sub-agent's response as the tool result
4. The sub-agent will work autonomously and return when complete
`;
}

/**
 * Parse sub-agent response
 * Since sub-agents return their full analysis, we may need to extract specific parts
 */
export function parseSubAgentResponse(response: string, expectedFormat: 'text' | 'json' | 'markdown'): any {
  if (expectedFormat === 'json') {
    // Try to extract JSON from response
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        // Fall through to return raw response
      }
    }
    // Try to parse entire response as JSON
    try {
      return JSON.parse(response);
    } catch {
      return { raw: response };
    }
  }

  if (expectedFormat === 'markdown') {
    // Extract markdown content if wrapped in code blocks
    const mdMatch = response.match(/```markdown\n([\s\S]*?)\n```/);
    if (mdMatch) {
      return mdMatch[1];
    }
  }

  return response;
}
