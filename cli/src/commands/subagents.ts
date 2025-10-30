/**
 * Sub-Agent Commands
 * CLI commands that leverage Claude Code sub-agents via MCP tools
 */

import { execa } from 'execa';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import * as fs from 'fs';
import * as path from 'path';

interface CommandOptions {
  workspace?: string;
}

interface ClaudeSettings {
  permissions?: {
    allow?: string[];
  };
  enableAllProjectMcpServers?: boolean;
  enabledMcpjsonServers?: string[];
  disabledMcpjsonServers?: string[];
  hooks?: any;
}

/**
 * Get current workspace path
 */
function getWorkspacePath(options: CommandOptions): string {
  return path.resolve(options.workspace || process.cwd());
}

/**
 * Check if directory is a git repository
 */
async function isGitRepo(workspacePath: string): Promise<boolean> {
  try {
    await execa('git', ['rev-parse', '--git-dir'], { cwd: workspacePath });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get staged git diff
 */
async function getStagedDiff(workspacePath: string): Promise<string> {
  try {
    const result = await execa('git', ['diff', '--staged'], { cwd: workspacePath });
    return result.stdout;
  } catch (error: any) {
    throw new Error(`Failed to get git diff: ${error.message}`);
  }
}

/**
 * Get git diff summary for branch
 */
async function getBranchDiffSummary(workspacePath: string, baseBranch: string = 'main'): Promise<string> {
  try {
    const result = await execa('git', ['diff', `${baseBranch}..HEAD`, '--stat'], {
      cwd: workspacePath
    });
    return result.stdout;
  } catch (error: any) {
    throw new Error(`Failed to get branch diff: ${error.message}`);
  }
}

/**
 * Get current branch name
 */
async function getCurrentBranch(workspacePath: string): Promise<string> {
  try {
    const result = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd: workspacePath
    });
    return result.stdout.trim();
  } catch (error: any) {
    throw new Error(`Failed to get current branch: ${error.message}`);
  }
}

/**
 * Command: eurekaclaude commit
 * Generate smart commit message using technical-writer sub-agent
 */
export async function commitCommand(options: CommandOptions) {
  const workspacePath = getWorkspacePath(options);

  console.log(chalk.blue('🤖 Smart Commit Message Generator\n'));

  // Check if git repo
  const spinner = ora('Checking git repository...').start();

  if (!await isGitRepo(workspacePath)) {
    spinner.fail('Not a git repository');
    console.log(chalk.yellow('\nThis command requires a git repository.'));
    process.exit(1);
  }

  spinner.succeed('Git repository found');

  // Get staged changes
  spinner.start('Getting staged changes...');

  const gitDiff = await getStagedDiff(workspacePath);

  if (!gitDiff || gitDiff.trim().length === 0) {
    spinner.fail('No staged changes found');
    console.log(chalk.yellow('\nPlease stage your changes first:'));
    console.log(chalk.gray('  git add <files>'));
    process.exit(1);
  }

  spinner.succeed(`Staged changes found (${gitDiff.split('\n').length} lines)`);

  // Output instructions for Claude Code
  console.log(chalk.green('\n✅ Ready to generate smart commit message!\n'));
  console.log(chalk.bold('📋 Instructions for Claude Code:\n'));
  console.log(chalk.gray('Copy and use the following MCP tool call:\n'));

  console.log(chalk.cyan('await mcp__eureka-tasks__generate_smart_commit_message({'));
  console.log(chalk.cyan('  gitDiff: `'));
  console.log(chalk.gray(gitDiff));
  console.log(chalk.cyan('  `'));
  console.log(chalk.cyan('});'));

  console.log(chalk.gray('\n---\n'));
  console.log(chalk.yellow('💡 Tip: Claude Code will automatically launch the technical-writer sub-agent'));
  console.log(chalk.yellow('   to analyze your changes and generate a professional commit message.'));
  console.log(chalk.gray('\n---\n'));

  // Alternative: Output in a format Claude can easily parse
  console.log(chalk.bold('\n📝 Quick Copy Format:\n'));
  console.log(JSON.stringify({
    action: 'generate_smart_commit_message',
    gitDiff: gitDiff,
    workspace: workspacePath
  }, null, 2));
}

/**
 * Command: eurekaclaude pr
 * Generate smart PR description using technical-writer sub-agent
 */
export async function prCommand(options: CommandOptions & { baseBranch?: string }) {
  const workspacePath = getWorkspacePath(options);
  const baseBranch = options.baseBranch || 'main';

  console.log(chalk.blue('🤖 Smart PR Description Generator\n'));

  // Check if git repo
  const spinner = ora('Checking git repository...').start();

  if (!await isGitRepo(workspacePath)) {
    spinner.fail('Not a git repository');
    console.log(chalk.yellow('\nThis command requires a git repository.'));
    process.exit(1);
  }

  spinner.succeed('Git repository found');

  // Get current branch
  spinner.start('Getting branch information...');
  const currentBranch = await getCurrentBranch(workspacePath);

  if (currentBranch === baseBranch) {
    spinner.fail(`Currently on base branch (${baseBranch})`);
    console.log(chalk.yellow('\nPlease switch to a feature branch first.'));
    process.exit(1);
  }

  spinner.succeed(`Feature branch: ${currentBranch}`);

  // Get diff summary
  spinner.start('Analyzing changes...');
  const gitDiff = await getBranchDiffSummary(workspacePath, baseBranch);
  spinner.succeed('Changes analyzed');

  // Output instructions for Claude Code
  console.log(chalk.green('\n✅ Ready to generate smart PR description!\n'));
  console.log(chalk.bold('📋 Instructions for Claude Code:\n'));
  console.log(chalk.gray('Step 1: Get branch tasks\n'));

  console.log(chalk.cyan('const branchTasks = await mcp__eureka-tasks__list_branch_tasks();'));

  console.log(chalk.gray('\nStep 2: Generate smart PR description\n'));

  console.log(chalk.cyan('await mcp__eureka-tasks__generate_smart_pr_description({'));
  console.log(chalk.cyan('  branchTasks: branchTasks.tasks,'));
  console.log(chalk.cyan('  gitDiff: `'));
  console.log(chalk.gray(gitDiff));
  console.log(chalk.cyan('  `,'));
  console.log(chalk.cyan(`  baseBranch: '${baseBranch}'`));
  console.log(chalk.cyan('});'));

  console.log(chalk.gray('\n---\n'));
  console.log(chalk.yellow('💡 Tip: The technical-writer sub-agent will create a comprehensive'));
  console.log(chalk.yellow('   PR description with Japanese/English summaries and testing checklist.'));
  console.log(chalk.gray('\n---\n'));

  // Quick copy format
  console.log(chalk.bold('\n📝 Branch Info:\n'));
  console.log(JSON.stringify({
    action: 'generate_smart_pr_description',
    currentBranch,
    baseBranch,
    gitDiff,
    workspace: workspacePath
  }, null, 2));
}

/**
 * Command: eurekaclaude validate
 * Validate setup using devops-architect sub-agent
 */
export async function validateCommand(options: CommandOptions) {
  const workspacePath = getWorkspacePath(options);

  console.log(chalk.blue('🔍 EurekaClaude Setup Validator\n'));

  const spinner = ora('Checking environment...').start();

  // Perform basic checks
  const checks = {
    nodeVersion: process.version,
    gitInstalled: false,
    gitRepo: false,
    hasEnvVars: false,
  };

  // Check git
  try {
    await execa('git', ['--version']);
    checks.gitInstalled = true;
  } catch {
    checks.gitInstalled = false;
  }

  // Check if git repo
  checks.gitRepo = await isGitRepo(workspacePath);

  // Check environment variables
  checks.hasEnvVars = !!(process.env.EUREKA_API_KEY || process.env.EUREKA_API_URL);

  spinner.succeed('Basic checks completed');

  // Display results
  console.log(chalk.bold('\n📊 Quick Validation Results:\n'));
  console.log(`${checks.nodeVersion >= 'v18' ? '✅' : '⚠️'}  Node.js: ${checks.nodeVersion}`);
  console.log(`${checks.gitInstalled ? '✅' : '❌'}  Git: ${checks.gitInstalled ? 'Installed' : 'Not found'}`);
  console.log(`${checks.gitRepo ? '✅' : '⚠️'}  Git Repository: ${checks.gitRepo ? 'Yes' : 'No'}`);
  console.log(`${checks.hasEnvVars ? '✅' : '⚠️'}  Env Variables: ${checks.hasEnvVars ? 'Configured' : 'Not configured'}`);

  // Output instructions for comprehensive validation
  console.log(chalk.green('\n✅ For comprehensive validation, use Claude Code:\n'));
  console.log(chalk.bold('📋 Instructions:\n'));

  console.log(chalk.cyan('await mcp__eureka-tasks__validate_setup({'));
  console.log(chalk.cyan(`  projectPath: '${workspacePath}'`));
  console.log(chalk.cyan('});'));

  console.log(chalk.gray('\n---\n'));
  console.log(chalk.yellow('💡 Tip: The devops-architect sub-agent will perform comprehensive'));
  console.log(chalk.yellow('   checks including MCP configuration, work sessions, and system health.'));
  console.log(chalk.gray('\n---\n'));

  // Quick copy format
  console.log(chalk.bold('\n📝 Validation Request:\n'));
  console.log(JSON.stringify({
    action: 'validate_setup',
    projectPath: workspacePath,
    quickChecks: checks
  }, null, 2));
}

/**
 * Command: eurekaclaude setup smart
 * Generate smart setup configuration using system-architect sub-agent
 */
export async function smartSetupCommand(options: CommandOptions & { type?: string }) {
  const workspacePath = getWorkspacePath(options);
  const projectType = options.type;

  console.log(chalk.blue('⚙️  Smart Setup Generator\n'));

  const spinner = ora('Analyzing project...').start();

  // Detect project type if not provided
  let detectedType = projectType;
  if (!detectedType) {
    const packageJsonPath = path.join(workspacePath, 'package.json');
    const requirementsTxtPath = path.join(workspacePath, 'requirements.txt');
    const goModPath = path.join(workspacePath, 'go.mod');

    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        if (pkg.dependencies?.react) detectedType = 'react';
        else if (pkg.dependencies?.vue) detectedType = 'vue';
        else if (pkg.dependencies?.next) detectedType = 'next';
        else if (pkg.dependencies?.express) detectedType = 'express';
        else detectedType = 'node';
      } catch {
        detectedType = 'node';
      }
    } else if (fs.existsSync(requirementsTxtPath)) {
      detectedType = 'python';
    } else if (fs.existsSync(goModPath)) {
      detectedType = 'go';
    } else {
      detectedType = 'unknown';
    }
  }

  spinner.succeed(`Project type detected: ${detectedType}`);

  // Output instructions
  console.log(chalk.green('\n✅ Ready to generate smart setup!\n'));
  console.log(chalk.bold('📋 Instructions for Claude Code:\n'));

  console.log(chalk.cyan('await mcp__eureka-tasks__generate_smart_setup({'));
  console.log(chalk.cyan(`  projectPath: '${workspacePath}',`));
  if (detectedType && detectedType !== 'unknown') {
    console.log(chalk.cyan(`  projectType: '${detectedType}'`));
  }
  console.log(chalk.cyan('});'));

  console.log(chalk.gray('\n---\n'));
  console.log(chalk.yellow('💡 Tip: The system-architect sub-agent will analyze your project'));
  console.log(chalk.yellow('   and generate optimal configuration, hooks, and task templates.'));
  console.log(chalk.gray('\n---\n'));

  // Quick copy format
  console.log(chalk.bold('\n📝 Setup Request:\n'));
  console.log(JSON.stringify({
    action: 'generate_smart_setup',
    projectPath: workspacePath,
    projectType: detectedType,
    detectedFromManifest: !projectType
  }, null, 2));
}

/**
 * Command: eurekaclaude subagents configure
 * Configure sub-agent tools in Claude Code settings
 */
export async function configureSubAgentsCommand(options: CommandOptions & { force?: boolean }) {
  const workspacePath = getWorkspacePath(options);
  const claudeSettingsPath = path.join(workspacePath, '.claude', 'settings.local.json');

  console.log(chalk.blue('⚙️  Sub-Agent Configuration Setup\n'));

  // Check if .claude directory exists
  const claudeDir = path.join(workspacePath, '.claude');
  if (!fs.existsSync(claudeDir)) {
    console.log(chalk.yellow('⚠️  .claude directory not found\n'));

    const { createDir } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'createDir',
        message: 'Create .claude directory?',
        default: true
      }
    ]);

    if (!createDir) {
      console.log(chalk.gray('Configuration cancelled.'));
      process.exit(0);
    }

    fs.mkdirSync(claudeDir, { recursive: true });
    console.log(chalk.green('✅ Created .claude directory\n'));
  }

  // Load existing settings or create new
  let settings: ClaudeSettings = {};

  if (fs.existsSync(claudeSettingsPath)) {
    try {
      const content = fs.readFileSync(claudeSettingsPath, 'utf-8');
      settings = JSON.parse(content);
      console.log(chalk.green('✅ Loaded existing settings\n'));
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not parse existing settings, creating new\n'));
    }
  } else {
    console.log(chalk.blue('📝 Creating new settings file\n'));
  }

  // Initialize permissions array if needed
  if (!settings.permissions) {
    settings.permissions = { allow: [] };
  }
  if (!settings.permissions.allow) {
    settings.permissions.allow = [];
  }

  // Sub-agent tool permissions to add
  const subAgentTools = [
    'mcp__eureka-tasks__generate_smart_commit_message',
    'mcp__eureka-tasks__generate_smart_pr_description',
    'mcp__eureka-tasks__validate_setup',
    'mcp__eureka-tasks__generate_smart_setup'
  ];

  // Check which tools are already configured
  const existingTools = subAgentTools.filter(tool =>
    settings.permissions!.allow!.includes(tool)
  );

  const newTools = subAgentTools.filter(tool =>
    !settings.permissions!.allow!.includes(tool)
  );

  console.log(chalk.bold('📊 Current Status:\n'));
  console.log(`${chalk.green('✅')} Already configured: ${existingTools.length} tools`);
  console.log(`${chalk.yellow('➕')} To be added: ${newTools.length} tools\n`);

  if (existingTools.length > 0) {
    console.log(chalk.gray('Already configured:'));
    existingTools.forEach(tool => {
      console.log(chalk.gray(`  - ${tool}`));
    });
    console.log();
  }

  if (newTools.length > 0) {
    console.log(chalk.yellow('Will add:'));
    newTools.forEach(tool => {
      console.log(chalk.yellow(`  + ${tool}`));
    });
    console.log();
  }

  if (newTools.length === 0 && !options.force) {
    console.log(chalk.green('✅ All sub-agent tools already configured!'));
    console.log(chalk.gray('\nUse --force to reconfigure\n'));
    return;
  }

  // Confirm before modifying
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: newTools.length > 0
        ? `Add ${newTools.length} sub-agent tool permissions?`
        : 'Reconfigure all sub-agent tool permissions?',
      default: true
    }
  ]);

  if (!confirm) {
    console.log(chalk.gray('Configuration cancelled.'));
    process.exit(0);
  }

  const spinner = ora('Updating configuration...').start();

  // Add new tools
  newTools.forEach(tool => {
    if (!settings.permissions!.allow!.includes(tool)) {
      settings.permissions!.allow!.push(tool);
    }
  });

  // Ensure eureka-tasks MCP server is enabled
  if (!settings.enableAllProjectMcpServers) {
    if (!settings.enabledMcpjsonServers) {
      settings.enabledMcpjsonServers = [];
    }
    if (!settings.enabledMcpjsonServers.includes('eureka-tasks')) {
      settings.enabledMcpjsonServers.push('eureka-tasks');
    }

    // Remove from disabled if present
    if (settings.disabledMcpjsonServers) {
      settings.disabledMcpjsonServers = settings.disabledMcpjsonServers.filter(
        server => server !== 'eureka-tasks'
      );
    }
  }

  // Write updated settings
  try {
    fs.writeFileSync(
      claudeSettingsPath,
      JSON.stringify(settings, null, 2) + '\n',
      'utf-8'
    );
    spinner.succeed('Configuration updated successfully!');
  } catch (error: any) {
    spinner.fail(`Failed to write settings: ${error.message}`);
    process.exit(1);
  }

  // Display summary
  console.log(chalk.green('\n✅ Sub-Agent Configuration Complete!\n'));
  console.log(chalk.bold('📋 Configured Tools:\n'));
  subAgentTools.forEach(tool => {
    console.log(chalk.green(`  ✓ ${tool}`));
  });

  console.log(chalk.bold('\n🚀 Next Steps:\n'));
  console.log(chalk.gray('1. Restart Claude Desktop to apply changes'));
  console.log(chalk.gray('2. Use sub-agent commands:'));
  console.log(chalk.cyan('   eurekaclaude commit'));
  console.log(chalk.cyan('   eurekaclaude pr'));
  console.log(chalk.cyan('   eurekaclaude validate'));
  console.log(chalk.cyan('   eurekaclaude setup smart'));
  console.log();
  console.log(chalk.yellow('💡 Tip: Run these commands to get instructions for Claude Code'));
  console.log();
}
