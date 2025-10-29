/**
 * Initialize EurekaClaude framework in current project
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync } from 'fs';
import { mkdir, writeFile, copyFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execa } from 'execa';
import {
  addMcpServer,
  ensureClaudeConfigDir,
  isMcpServerConfigured,
} from '../utils/claude-config.js';
import { detectPlatform, getNpxCommand, getClaudeConfigDir } from '../utils/platform.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface InitOptions {
  apiUrl?: string;
  apiKey?: string;
  workspace?: string;
  gitHooks?: boolean;
  enforcement?: boolean;
}

export async function initCommand(options: InitOptions) {
  console.log(chalk.bold.cyan('\n🚀 EurekaClaude Framework Setup\n'));
  console.log('This will install a complete task-driven development framework with:\n');
  console.log(chalk.dim('  - Eureka Tasks MCP server integration'));
  console.log(chalk.dim('  - Agent orchestration system'));
  console.log(chalk.dim('  - GitHub CI/CD workflows'));
  console.log(chalk.dim('  - Slash commands for workflow'));
  console.log(chalk.dim('  - Git hooks for automation\n'));

  // Check if already configured
  const isConfigured = await isMcpServerConfigured('eureka-tasks');
  if (isConfigured && !options.apiKey) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'Eureka Tasks MCP server is already configured. Overwrite?',
        default: false,
      },
    ]);

    if (!overwrite) {
      console.log(chalk.yellow('Setup cancelled.'));
      return;
    }
  }

  // Interactive prompts
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'apiUrl',
      message: 'Eureka API URL:',
      default: options.apiUrl || 'https://eurekalabo.162-43-92-100.nip.io',
      when: !options.apiUrl,
    },
    {
      type: 'password',
      name: 'apiKey',
      message: 'Eureka API Key:',
      when: !options.apiKey,
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return 'API Key is required';
        }
        if (!input.startsWith('pk_')) {
          return 'API Key should start with pk_';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'workspace',
      message: 'Workspace path (leave empty for current directory):',
      default: options.workspace || process.cwd(),
      when: !options.workspace,
    },
    {
      type: 'confirm',
      name: 'gitHooks',
      message: 'Install git hooks for automated workflow?',
      default: options.gitHooks !== undefined ? options.gitHooks : true,
      when: options.gitHooks === undefined,
    },
    {
      type: 'confirm',
      name: 'enforcement',
      message: 'Enable task enforcement (require task before coding)?',
      default: options.enforcement !== undefined ? options.enforcement : false,
      when: options.enforcement === undefined,
    },
    {
      type: 'confirm',
      name: 'slashCommands',
      message: 'Install workflow slash commands?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'githubWorkflows',
      message: 'Install GitHub CI/CD workflows?',
      default: true,
    },
  ]);

  const config = {
    apiUrl: options.apiUrl || answers.apiUrl,
    apiKey: options.apiKey || answers.apiKey,
    workspace: options.workspace || answers.workspace || process.cwd(),
    gitHooks: options.gitHooks !== undefined ? options.gitHooks : answers.gitHooks,
    enforcement: options.enforcement !== undefined ? options.enforcement : answers.enforcement,
    slashCommands: answers.slashCommands,
    githubWorkflows: answers.githubWorkflows,
  };

  console.log('');

  // Step 1: Install Framework Files
  await installFrameworkFiles();

  // Step 2: Install MCP Server
  await installMcpServer(config);

  // Step 3: Install Slash Commands
  if (config.slashCommands) {
    await installSlashCommands();
  }

  // Step 4: Install Agent Configuration
  await installAgentConfig();

  // Step 5: Install GitHub Workflows
  if (config.githubWorkflows) {
    await installGitHubWorkflows(config.workspace);
  }

  // Step 6: Install Git Hooks
  if (config.gitHooks) {
    await installGitHooks(config.workspace);
  }

  // Step 7: Create Workflow Config
  await createWorkflowConfig(config);

  // Step 8: Install Dependencies (if needed)
  await installDependencies(config.workspace);

  console.log(chalk.bold.green('\n✅ EurekaClaude framework installed successfully!\n'));
  console.log(chalk.cyan('Next steps:'));
  console.log('  1. Restart Claude Code to load the new configuration');
  console.log('  2. Try: ' + chalk.yellow('/eureka init "Add authentication"'));
  console.log('  3. Add GitHub secrets: EUREKA_API_URL and EUREKA_API_KEY');
  console.log('\n' + chalk.dim('Documentation: https://github.com/eurekalabo/eurekaclaude\n'));
}

async function installFrameworkFiles() {
  const spinner = ora('Installing EurekaClaude framework files...').start();

  try {
    const claudeDir = getClaudeConfigDir();
    const templateDir = join(__dirname, '../../templates/framework');

    // Ensure Claude config directory exists
    await ensureClaudeConfigDir();

    // Copy framework files
    const frameworkFiles = ['EUREKACLAUDE.md', 'AGENTS.md'];

    for (const file of frameworkFiles) {
      const sourcePath = join(templateDir, file);
      const destPath = join(claudeDir, file);

      if (existsSync(sourcePath)) {
        await copyFile(sourcePath, destPath);
      }
    }

    spinner.succeed('EurekaClaude framework files installed');
  } catch (error: any) {
    spinner.fail('Failed to install framework files');
    console.error(chalk.red(error.message));
  }
}

async function installMcpServer(config: any) {
  const spinner = ora('Installing Eureka Tasks MCP server...').start();

  try {
    await ensureClaudeConfigDir();

    const platform = detectPlatform();
    const npxCmd = getNpxCommand();

    // Get the parent directory of cli/ (which is the mcp-server root)
    const mcpServerPath = join(__dirname, '../../..');
    const indexPath = join(mcpServerPath, 'src', 'index.ts');

    await addMcpServer('eureka-tasks', {
      command: npxCmd.split(' ')[0],
      args: npxCmd.split(' ').slice(1).concat(['tsx', indexPath]),
      env: {
        EUREKA_API_URL: config.apiUrl,
        EUREKA_API_KEY: config.apiKey,
        WORKSPACE_PATH: config.workspace,
      },
    });

    spinner.succeed('Eureka Tasks MCP server installed');
  } catch (error: any) {
    spinner.fail('Failed to install MCP server');
    console.error(chalk.red(error.message));
    throw error;
  }
}

async function installSlashCommands() {
  const spinner = ora('Installing workflow slash commands...').start();

  try {
    const claudeDir = getClaudeConfigDir();
    const commandsDir = join(claudeDir, 'commands');
    const templateDir = join(__dirname, '../../templates/commands');

    // Ensure commands directory exists
    if (!existsSync(commandsDir)) {
      await mkdir(commandsDir, { recursive: true });
    }

    // Copy eureka.md command
    const sourcePath = join(templateDir, 'eureka.md');
    const destPath = join(commandsDir, 'eureka.md');

    if (existsSync(sourcePath)) {
      await copyFile(sourcePath, destPath);
    }

    spinner.succeed('Workflow slash commands installed');
  } catch (error: any) {
    spinner.fail('Failed to install slash commands');
    console.error(chalk.red(error.message));
  }
}

async function installAgentConfig() {
  const spinner = ora('Installing agent configuration...').start();

  try {
    const claudeDir = getClaudeConfigDir();
    const configDir = join(claudeDir, 'config');

    if (!existsSync(configDir)) {
      await mkdir(configDir, { recursive: true });
    }

    // Create agents.json
    await writeFile(
      join(configDir, 'agents.json'),
      JSON.stringify(
        {
          'task-manager': {
            enabled: true,
            autoCreateTasks: true,
            requireWorkSession: true,
            language: 'ja',
          },
          implementation: {
            enabled: true,
            enforceSession: true,
            autoFormat: true,
            runTests: false,
          },
          analysis: {
            enabled: true,
            prePrReview: true,
            securityScan: true,
            performanceCheck: false,
          },
          automation: {
            enabled: true,
            autoDeployStaging: false,
            notifyTeam: true,
            updateTasks: true,
          },
        },
        null,
        2
      ),
      'utf-8'
    );

    spinner.succeed('Agent configuration installed');
  } catch (error: any) {
    spinner.fail('Failed to install agent config');
    console.error(chalk.red(error.message));
  }
}

async function installGitHubWorkflows(workspace: string) {
  const spinner = ora('Installing GitHub workflows...').start();

  try {
    const workflowsDir = join(workspace, '.github', 'workflows');
    const templateDir = join(__dirname, '../../templates/github-workflows');

    if (!existsSync(workflowsDir)) {
      await mkdir(workflowsDir, { recursive: true });
    }

    // Copy eureka-tasks.yml workflow
    const sourcePath = join(templateDir, 'eureka-tasks.yml');
    const destPath = join(workflowsDir, 'eureka-tasks.yml');

    if (existsSync(sourcePath)) {
      await copyFile(sourcePath, destPath);
      spinner.succeed('GitHub workflows installed');
      console.log(chalk.dim('  Remember to add EUREKA_API_URL and EUREKA_API_KEY to GitHub Secrets'));
    } else {
      spinner.warn('GitHub workflow template not found (will be skipped)');
    }
  } catch (error: any) {
    spinner.warn('Failed to install GitHub workflows (this is optional)');
  }
}

async function installGitHooks(workspace: string) {
  const spinner = ora('Installing git hooks...').start();

  try {
    const hooksDir = join(workspace, '.git', 'hooks');

    if (!existsSync(hooksDir)) {
      spinner.warn('Not a git repository, skipping git hooks');
      return;
    }

    // Pre-commit hook
    await writeFile(
      join(hooksDir, 'pre-commit'),
      `#!/bin/sh
# EurekaClaude Pre-commit Hook
# Check for active work session

echo "🔍 Checking for active work session..."

# Check if @eureka-tasks get_active_sessions returns any active sessions
# This is a placeholder - actual implementation would call the MCP tool

# For now, just show a reminder
echo "💡 Tip: Make sure you have an active task work session"
echo "   Use: /eureka init <title> or start_work_on_task"

exit 0
`,
      'utf-8'
    );

    // Make executable
    try {
      await execa('chmod', ['+x', join(hooksDir, 'pre-commit')]);
    } catch (e) {
      // Ignore chmod errors on Windows
    }

    // Pre-push hook
    await writeFile(
      join(hooksDir, 'pre-push'),
      `#!/bin/sh
# EurekaClaude Pre-push Hook
# Suggest PR creation if tasks are completed

echo "🔍 Checking for completed tasks..."

# Check if there are completed tasks in current branch
# This is a placeholder - actual implementation would call the MCP tool

echo "💡 Tip: Use /eureka pr to create a pull request for your tasks"

exit 0
`,
      'utf-8'
    );

    try {
      await execa('chmod', ['+x', join(hooksDir, 'pre-push')]);
    } catch (e) {
      // Ignore chmod errors on Windows
    }

    spinner.succeed('Git hooks installed');
  } catch (error: any) {
    spinner.fail('Failed to install git hooks');
    console.error(chalk.red(error.message));
  }
}

async function createWorkflowConfig(config: any) {
  const spinner = ora('Creating workflow configuration...').start();

  try {
    const claudeDir = getClaudeConfigDir();
    const configDir = join(claudeDir, 'config');

    if (!existsSync(configDir)) {
      await mkdir(configDir, { recursive: true });
    }

    // Workflow config
    await writeFile(
      join(configDir, 'eureka-workflow.json'),
      JSON.stringify(
        {
          version: '1.0.0',
          workspace: config.workspace,
          taskWorkflow: {
            requireTaskBeforeCoding: config.enforcement,
            autoCompleteOnPR: false,
            prCreationStrategy: 'prompt',
          },
          gitHooks: {
            enabled: config.gitHooks,
            preCommit: {
              enabled: true,
              checkWorkSession: true,
            },
            prePush: {
              enabled: true,
              suggestPR: true,
            },
          },
          notifications: {
            taskCreated: true,
            taskCompleted: true,
            prCreated: true,
          },
          language: {
            primary: 'ja',
            fallback: 'en',
          },
        },
        null,
        2
      ),
      'utf-8'
    );

    spinner.succeed('Workflow configuration created');
  } catch (error: any) {
    spinner.fail('Failed to create workflow config');
    console.error(chalk.red(error.message));
  }
}

async function installDependencies(workspace: string) {
  const spinner = ora('Checking dependencies...').start();

  try {
    const packageJsonPath = join(workspace, 'package.json');

    if (existsSync(packageJsonPath)) {
      // Check if node_modules exists
      if (!existsSync(join(workspace, 'node_modules'))) {
        spinner.text = 'Installing npm dependencies...';
        await execa('npm', ['install'], { cwd: workspace });
      }
    }

    spinner.succeed('Dependencies ready');
  } catch (error: any) {
    spinner.warn('Could not install dependencies (this is optional)');
  }
}
