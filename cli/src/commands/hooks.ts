/**
 * Setup and manage Eureka Tasks work session hooks
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync } from 'fs';
import { mkdir, writeFile, readFile, copyFile, chmod } from 'fs/promises';
import { join } from 'path';
import { ensureClaudeConfigDir } from '../utils/claude-config.js';
import { getClaudeConfigDir } from '../utils/platform.js';

interface HooksOptions {
  force?: boolean;
  workspace?: string;
  mode?: 'strict' | 'guidance';
}

/**
 * Install work session enforcement hook
 */
export async function installHooksCommand(options: HooksOptions) {
  console.log(chalk.bold.cyan('\n🪝 Eureka Tasks Work Session Hook Setup\n'));

  const workspace = options.workspace || process.cwd();

  // Check if already installed
  const hookPath = join(workspace, '.claude', 'hooks', 'check-work-session.cjs');
  if (existsSync(hookPath) && !options.force) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'Work session hook is already installed. Overwrite?',
        default: false,
      },
    ]);

    if (!overwrite) {
      console.log(chalk.yellow('Installation cancelled.'));
      return;
    }
  }

  // Ask about enforcement mode if not specified
  let mode = options.mode;
  if (!mode) {
    const { selectedMode } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedMode',
        message: 'Select enforcement mode:',
        choices: [
          {
            name: 'Guidance (推奨) - Prompts to create tasks but allows bypass',
            value: 'guidance',
          },
          {
            name: 'Strict - Blocks operations without active session',
            value: 'strict',
          },
        ],
        default: 'guidance',
      },
    ]);
    mode = selectedMode;
  }

  // Installation steps
  await createHookScript(workspace, mode);
  await updateClaudeSettings(workspace);
  await updateGitignore(workspace);

  console.log(chalk.bold.green('\n✅ Work session hook installed successfully!\n'));
  console.log(chalk.cyan(`Mode: ${mode === 'strict' ? 'Strict (Hard Block)' : 'Guidance (Recommended)'}\n`));
  console.log(chalk.cyan('What this does:'));
  if (mode === 'strict') {
    console.log('  - Blocks Write/Edit operations without active work session');
    console.log('  - Hard enforcement of workflow');
  } else {
    console.log('  - Prompts to create tasks before Write/Edit operations');
    console.log('  - Allows bypass but strongly encourages workflow');
  }
  console.log('  - Guides you to create tasks and start sessions');
  console.log('  - Ensures complete audit trail for all code changes\n');
  console.log(chalk.cyan('Required workflow:'));
  console.log('  1. mcp__eureka-tasks__list_boards (get available boards)');
  console.log('  2. mcp__eureka-tasks__list_tasks (search existing)');
  console.log('  3. mcp__eureka-tasks__create_task (if none exists, with boardId)');
  console.log('  4. mcp__eureka-tasks__start_work_on_task (REQUIRED before coding)');
  console.log('  5. Write/Edit operations now allowed');
  console.log('  6. mcp__eureka-tasks__complete_task_work (when done)\n');
  console.log(chalk.dim('Documentation: .claude/hooks/README.md\n'));
}

/**
 * Uninstall work session enforcement hook
 */
export async function uninstallHooksCommand(options: HooksOptions) {
  console.log(chalk.bold.cyan('\n🪝 Uninstalling Eureka Tasks Hook\n'));

  const workspace = options.workspace || process.cwd();
  const settingsPath = join(workspace, '.claude', 'settings.local.json');

  if (!existsSync(settingsPath)) {
    console.log(chalk.yellow('No hooks configuration found.'));
    return;
  }

  const spinner = ora('Removing hook configuration...').start();

  try {
    // Read settings
    const settingsContent = await readFile(settingsPath, 'utf-8');
    const settings = JSON.parse(settingsContent);

    // Remove hooks section
    if (settings.hooks) {
      delete settings.hooks;

      // Write back
      await writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');

      spinner.succeed('Hook configuration removed');
      console.log(chalk.green('\n✅ Work session hook uninstalled\n'));
      console.log(chalk.yellow('⚠️  Note: The hook script file still exists'));
      console.log(chalk.dim('   You can manually delete: .claude/hooks/check-work-session.cjs\n'));
    } else {
      spinner.info('No hooks configuration found');
    }
  } catch (error: any) {
    spinner.fail('Failed to remove hook');
    console.error(chalk.red(error.message));
  }
}

/**
 * Check hook installation status
 */
export async function statusHooksCommand(options: HooksOptions) {
  console.log(chalk.bold.cyan('\n🪝 Eureka Tasks Hook Status\n'));

  const workspace = options.workspace || process.cwd();
  const hookPath = join(workspace, '.claude', 'hooks', 'check-work-session.cjs');
  const settingsPath = join(workspace, '.claude', 'settings.local.json');
  const markerPath = join(workspace, '.eureka-active-session');

  // Check hook script
  if (existsSync(hookPath)) {
    console.log(chalk.green('✅ Hook script: Installed'));
    console.log(chalk.dim(`   ${hookPath}`));
  } else {
    console.log(chalk.red('❌ Hook script: Not found'));
  }

  // Check settings configuration
  if (existsSync(settingsPath)) {
    try {
      const settingsContent = await readFile(settingsPath, 'utf-8');
      const settings = JSON.parse(settingsContent);

      if (settings.hooks && settings.hooks.PreToolUse) {
        const preToolHooks = settings.hooks.PreToolUse;
        const hookConfigured = preToolHooks.some((h: any) =>
          h.matcher && h.matcher.includes('Write') && h.matcher.includes('Edit')
        );

        if (hookConfigured) {
          // Check if NotebookEdit is also included (v1.1+)
          const hasNotebookEdit = preToolHooks.some((h: any) =>
            h.matcher && h.matcher.includes('NotebookEdit')
          );

          if (hasNotebookEdit) {
            console.log(chalk.green('✅ Hook configuration: Active (Write|Edit|NotebookEdit)'));
          } else {
            console.log(chalk.yellow('⚠️  Hook configuration: Active (Write|Edit only - consider updating)'));
          }
        } else {
          console.log(chalk.yellow('⚠️  Hook configuration: Incomplete'));
        }
      } else {
        console.log(chalk.red('❌ Hook configuration: Not configured'));
      }
    } catch (error) {
      console.log(chalk.red('❌ Hook configuration: Parse error'));
    }
  } else {
    console.log(chalk.red('❌ Settings file: Not found'));
  }

  // Check active session
  if (existsSync(markerPath)) {
    try {
      const markerContent = await readFile(markerPath, 'utf-8');
      const marker = JSON.parse(markerContent);
      console.log(chalk.green('✅ Active session: Yes'));
      console.log(chalk.dim(`   Task: ${marker.taskId}`));
      console.log(chalk.dim(`   Started: ${new Date(marker.startedAt).toLocaleString('ja-JP')}`));
      console.log(chalk.dim(`   Branch: ${marker.branch}`));
    } catch (error) {
      console.log(chalk.yellow('⚠️  Active session marker exists but unreadable'));
    }
  } else {
    console.log(chalk.yellow('⚠️  Active session: No'));
  }

  console.log('');
}

/**
 * Create the hook script file
 */
async function createHookScript(workspace: string, mode: 'strict' | 'guidance' = 'guidance') {
  const spinner = ora(`Creating hook script (${mode} mode)...`).start();

  try {
    const hooksDir = join(workspace, '.claude', 'hooks');

    // Ensure hooks directory exists
    if (!existsSync(hooksDir)) {
      await mkdir(hooksDir, { recursive: true });
    }

    const hookScript = `#!/usr/bin/env node

/**
 * Eureka Tasks Work Session Enforcement Hook
 *
 * This PreToolUse hook ensures that a work session is active before
 * allowing Write or Edit operations.
 */

const fs = require('fs');
const path = require('path');

// Read hook input from stdin
let inputData = '';

process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    const hookInput = JSON.parse(inputData);
    processHook(hookInput);
  } catch (error) {
    // If we can't parse input, allow operation (fail open)
    console.error(\`Hook error: \${error.message}\`);
    process.exit(0);
  }
});

function processHook(hookInput) {
  const { tool_name, tool_input, cwd } = hookInput;

  // Only enforce for file modification operations
  if (tool_name !== 'Write' && tool_name !== 'Edit' && tool_name !== 'NotebookEdit') {
    process.exit(0);
    return;
  }

  // Check for active session marker file
  const sessionMarkerPath = path.join(cwd, '.eureka-active-session');
  const sessionExists = fs.existsSync(sessionMarkerPath);

  if (!sessionExists) {
    // No active session - block with guidance (both modes use 'deny' for proper enforcement)
    const response = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: buildGuidanceMessage(tool_name, tool_input)
      },
      suppressOutput: false,
      systemMessage: '⚠️ 作業セッションがありません。'
    };

    console.log(JSON.stringify(response, null, 2));
    process.exit(0);
  } else {
    // Session exists - allow with context
    try {
      const sessionInfo = JSON.parse(fs.readFileSync(sessionMarkerPath, 'utf8'));
      const allowResponse = {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'allow',
          permissionDecisionReason: \`✅ Active session: \${sessionInfo.taskId}\`
        },
        suppressOutput: false
      };

      console.log(JSON.stringify(allowResponse, null, 2));
      process.exit(0);
    } catch (error) {
      // Marker exists but can't read - allow with warning
      console.log(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'allow',
          permissionDecisionReason: '⚠️ Session marker exists but unreadable'
        }
      }, null, 2));
      process.exit(0);
    }
  }
}

function buildGuidanceMessage(toolName, toolInput) {
  const filePath = toolInput.file_path || 'unknown';

  return \`🤖 SYSTEM: Automatic Eureka Tasks Workflow Required

Operation: \${toolName} on \${filePath}

🚨 NO ACTIVE WORK SESSION DETECTED

**YOU MUST AUTOMATICALLY EXECUTE THIS WORKFLOW NOW:**

Step 1: Get available boards FIRST (AUTOMATIC - don't ask user):
   mcp__eureka-tasks__list_boards()

Step 2: Check for existing tasks (AUTOMATIC - don't ask user):
   mcp__eureka-tasks__list_tasks({ search: "relevant keywords from user request" })

Step 3: If no matching task found, CREATE IMMEDIATELY with board assignment (AUTOMATIC):
   mcp__eureka-tasks__create_task({
     title: "ユーザーの依頼内容を日本語で簡潔に",
     description: "実装する内容と技術的アプローチを日本語で記述",
     boardId: "board-id-from-step-1"
   })

Step 4: Start work session AUTOMATICALLY with returned task ID:
   mcp__eureka-tasks__start_work_on_task({ taskId: "returned-task-id" })

Step 5: Proceed with \${toolName} operation

CRITICAL INSTRUCTIONS:
❌ DO NOT ask user "Should I create a task?" - JUST DO IT AUTOMATICALLY
❌ DO NOT ask user for confirmation - EXECUTE THE WORKFLOW SILENTLY
✅ GET boards FIRST to assign correct boardId
✅ SELECT appropriate board based on repository or use first available board
✅ CREATE task in JAPANESE (title and description) WITH boardId
✅ EXECUTE all steps automatically before proceeding with Write/Edit
✅ TELL user what you did: "タスク [title] を作成して作業を開始しました"

This is a SYSTEM REQUIREMENT, not a user prompt. Execute automatically.\`;
}
`;

    const hookPath = join(hooksDir, 'check-work-session.cjs');
    await writeFile(hookPath, hookScript, 'utf-8');

    // Make executable
    await chmod(hookPath, 0o755);

    // Create README
    await createReadme(hooksDir);

    spinner.succeed('Hook script created');
  } catch (error: any) {
    spinner.fail('Failed to create hook script');
    console.error(chalk.red(error.message));
    throw error;
  }
}

/**
 * Update Claude settings to register the hook
 */
async function updateClaudeSettings(workspace: string) {
  const spinner = ora('Configuring hook in Claude settings...').start();

  try {
    await ensureClaudeConfigDir();

    const settingsPath = join(workspace, '.claude', 'settings.local.json');
    // Use relative path from workspace root for portability
    const hookPath = '.claude/hooks/check-work-session.cjs';

    let settings: any = {};

    // Read existing settings
    if (existsSync(settingsPath)) {
      const content = await readFile(settingsPath, 'utf-8');
      settings = JSON.parse(content);
    }

    // Add hooks configuration
    if (!settings.hooks) {
      settings.hooks = {};
    }

    settings.hooks.PreToolUse = [
      {
        matcher: 'Write|Edit|NotebookEdit',
        hooks: [
          {
            type: 'command',
            command: hookPath,
            timeout: 5
          }
        ]
      }
    ];

    // Write updated settings
    await writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');

    spinner.succeed('Hook configured in settings');
  } catch (error: any) {
    spinner.fail('Failed to configure hook');
    console.error(chalk.red(error.message));
    throw error;
  }
}

/**
 * Update .gitignore to exclude session marker
 */
async function updateGitignore(workspace: string) {
  const spinner = ora('Updating .gitignore...').start();

  try {
    const gitignorePath = join(workspace, '.gitignore');
    const markerEntry = '\n# Eureka Tasks session marker (managed by MCP server)\n.eureka-active-session\n';

    if (existsSync(gitignorePath)) {
      const content = await readFile(gitignorePath, 'utf-8');

      // Check if already has the entry
      if (content.includes('.eureka-active-session')) {
        spinner.info('.gitignore already configured');
        return;
      }

      // Append entry
      await writeFile(gitignorePath, content + markerEntry, 'utf-8');
      spinner.succeed('.gitignore updated');
    } else {
      // Create new .gitignore
      await writeFile(gitignorePath, markerEntry, 'utf-8');
      spinner.succeed('.gitignore created');
    }
  } catch (error: any) {
    spinner.warn('Could not update .gitignore (this is optional)');
  }
}

/**
 * Create README documentation
 */
async function createReadme(hooksDir: string) {
  const readme = `# Eureka Tasks Work Session Hook

## Overview

This PreToolUse hook enforces the Eureka Tasks workflow by ensuring that all code modifications (Write/Edit operations) happen within an active work session.

## How It Works

### Session Marker File

When you start a work session with \`start_work_on_task\`, the MCP server creates a marker file:

\`\`\`
.eureka-active-session
\`\`\`

### Hook Validation

Before every Write or Edit operation, the hook:
1. Checks if \`.eureka-active-session\` exists
2. **If NO session**: Blocks the operation with detailed guidance
3. **If session exists**: Allows operation and shows current task info

## Required Workflow

\`\`\`bash
# Step 1: Get available boards
mcp__eureka-tasks__list_boards()

# Step 2: Search for existing tasks
mcp__eureka-tasks__list_tasks({ search: "認証" })

# Step 3: Create task if none exists (Japanese content with board assignment)
mcp__eureka-tasks__create_task({
  title: "APIにJWT認証を追加",
  description: "認証ミドルウェアを実装し、全エンドポイントを保護する",
  boardId: "board-abc123"
})

# Step 4: Start work session (REQUIRED before code changes)
mcp__eureka-tasks__start_work_on_task({ taskId: "task-123" })

# Step 5: Now Write/Edit operations are allowed
Write({ file_path: "src/auth.ts", content: "..." })

# Step 6: Complete work session (Japanese summary)
mcp__eureka-tasks__complete_task_work({
  taskId: "task-123",
  summary: "JWT認証ミドルウェアを実装しました"
})
\`\`\`

## Benefits

- ✅ Complete audit trail for all code changes
- ✅ Automatic git integration and change tracking
- ✅ Team visibility via Eureka Tasks dashboard
- ✅ Enforced workflow (no accidental bypassing)
- ✅ Automatic board assignment for task organization

## Troubleshooting

### Hook not working?

\`\`\`bash
# Check hook is executable
chmod +x .claude/hooks/check-work-session.cjs

# Verify configuration
cat .claude/settings.local.json | grep -A 10 "hooks"
\`\`\`

### Session marker exists but no active session?

\`\`\`bash
# Manually remove stale marker
rm .eureka-active-session
\`\`\`

## Management Commands

\`\`\`bash
# Install hook
eurekaclaude hooks install

# Check status
eurekaclaude hooks status

# Uninstall hook
eurekaclaude hooks uninstall
\`\`\`
`;

  await writeFile(join(hooksDir, 'README.md'), readme, 'utf-8');
}
