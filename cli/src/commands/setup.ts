/**
 * Setup and management commands for Eureka Tasks MCP Server
 */

import chalk from 'chalk';
import ora from 'ora';
import { execa } from 'execa';
import { existsSync } from 'fs';
import { join } from 'path';

interface SetupOptions {
  workspace?: string;
}

/**
 * Build MCP server and CLI
 */
export async function buildCommand(options: SetupOptions) {
  console.log(chalk.bold.cyan('\n🔨 Building Eureka Tasks MCP Server\n'));

  const workspace = options.workspace || process.cwd();

  try {
    // Build MCP server
    await buildMcpServer(workspace);

    // Build CLI
    await buildCli(workspace);

    console.log(chalk.bold.green('\n✅ Build complete!\n'));
  } catch (error: any) {
    console.error(chalk.red('\n❌ Build failed:'), error.message);
    process.exit(1);
  }
}

/**
 * Show system status
 */
export async function statusCommand(options: SetupOptions) {
  console.log(chalk.bold.cyan('\n📊 Eureka Tasks MCP Server Status\n'));

  const workspace = options.workspace || process.cwd();

  try {
    // Node version
    const nodeVersion = await execa('node', ['--version']);
    console.log(chalk.cyan('Node Version:'), nodeVersion.stdout);

    // npm version
    const npmVersion = await execa('npm', ['--version']);
    console.log(chalk.cyan('npm Version:'), npmVersion.stdout);

    console.log('');

    // Build status
    console.log(chalk.cyan('Build Status:'));
    const mcpDist = join(workspace, 'dist');
    const cliDist = join(workspace, 'cli', 'dist');

    if (existsSync(mcpDist)) {
      console.log('  MCP Server: ' + chalk.green('✅ Built'));
    } else {
      console.log('  MCP Server: ' + chalk.red('❌ Not built'));
    }

    if (existsSync(cliDist)) {
      console.log('  CLI: ' + chalk.green('✅ Built'));
    } else {
      console.log('  CLI: ' + chalk.red('❌ Not built'));
    }

    console.log('');

    // Git status
    try {
      const branch = await execa('git', ['branch', '--show-current'], { cwd: workspace });
      console.log(chalk.cyan('Git Branch:'), branch.stdout);
    } catch (e) {
      console.log(chalk.yellow('Git: Not a git repository'));
    }

    console.log('');

    // Active session
    const sessionMarker = join(workspace, '.eureka-active-session');
    if (existsSync(sessionMarker)) {
      console.log(chalk.cyan('Active Session:'), chalk.green('✅ Yes'));
      try {
        const fs = await import('fs/promises');
        const content = await fs.readFile(sessionMarker, 'utf-8');
        const session = JSON.parse(content);
        console.log(chalk.dim(`  Task: ${session.taskId}`));
        console.log(chalk.dim(`  Branch: ${session.branch}`));
      } catch (e) {
        // Ignore parse errors
      }
    } else {
      console.log(chalk.cyan('Active Session:'), chalk.yellow('⚠️  No'));
    }

    console.log('');
  } catch (error: any) {
    console.error(chalk.red('Error checking status:'), error.message);
  }
}

/**
 * Install all dependencies
 */
export async function installDepsCommand(options: SetupOptions) {
  console.log(chalk.bold.cyan('\n📦 Installing Dependencies\n'));

  const workspace = options.workspace || process.cwd();

  try {
    // Install MCP server dependencies
    const spinner1 = ora('Installing MCP server dependencies...').start();
    await execa('npm', ['install'], { cwd: workspace });
    spinner1.succeed('MCP server dependencies installed');

    // Install CLI dependencies
    const spinner2 = ora('Installing CLI dependencies...').start();
    await execa('npm', ['install'], { cwd: join(workspace, 'cli') });
    spinner2.succeed('CLI dependencies installed');

    console.log(chalk.bold.green('\n✅ Dependencies installed\n'));
  } catch (error: any) {
    console.error(chalk.red('\n❌ Failed to install dependencies:'), error.message);
    process.exit(1);
  }
}

/**
 * Clean build artifacts
 */
export async function cleanCommand(options: SetupOptions & { all?: boolean }) {
  console.log(chalk.bold.cyan('\n🧹 Cleaning Build Artifacts\n'));

  const workspace = options.workspace || process.cwd();

  try {
    const fs = await import('fs/promises');

    // Remove dist directories
    const spinner = ora('Removing build artifacts...').start();

    const mcpDist = join(workspace, 'dist');
    const cliDist = join(workspace, 'cli', 'dist');
    const sessionMarker = join(workspace, '.eureka-active-session');

    if (existsSync(mcpDist)) {
      await fs.rm(mcpDist, { recursive: true, force: true });
    }

    if (existsSync(cliDist)) {
      await fs.rm(cliDist, { recursive: true, force: true });
    }

    if (existsSync(sessionMarker)) {
      await fs.unlink(sessionMarker);
    }

    spinner.succeed('Build artifacts removed');

    // Remove node_modules if --all flag
    if (options.all) {
      const spinner2 = ora('Removing node_modules...').start();

      const mcpNodeModules = join(workspace, 'node_modules');
      const cliNodeModules = join(workspace, 'cli', 'node_modules');

      if (existsSync(mcpNodeModules)) {
        await fs.rm(mcpNodeModules, { recursive: true, force: true });
      }

      if (existsSync(cliNodeModules)) {
        await fs.rm(cliNodeModules, { recursive: true, force: true });
      }

      spinner2.succeed('node_modules removed');
    }

    console.log(chalk.bold.green('\n✅ Clean complete\n'));
  } catch (error: any) {
    console.error(chalk.red('\n❌ Clean failed:'), error.message);
    process.exit(1);
  }
}

/**
 * Quick start - complete setup
 */
export async function quickstartCommand(options: SetupOptions) {
  console.log(chalk.bold.cyan('\n🚀 Eureka Tasks MCP Server - Quick Start\n'));

  const workspace = options.workspace || process.cwd();

  try {
    // Step 1: Install dependencies
    console.log(chalk.bold.yellow('Step 1/3: Installing dependencies\n'));
    await installDepsCommand({ workspace });

    // Step 2: Build
    console.log(chalk.bold.yellow('\nStep 2/3: Building MCP server and CLI\n'));
    await buildCommand({ workspace });

    // Step 3: Install hooks
    console.log(chalk.bold.yellow('\nStep 3/3: Installing work session hooks\n'));
    const { installHooksCommand } = await import('./hooks.js');
    await installHooksCommand({ workspace, mode: 'guidance' });

    console.log(chalk.bold.green('\n🎉 Quick start complete!\n'));
    console.log(chalk.cyan('Next steps:'));
    console.log('  1. Configure EUREKA_API_KEY in your environment');
    console.log('  2. Restart Claude Code to load the MCP server');
    console.log('  3. Start coding - tasks will be created automatically!');
    console.log('');
  } catch (error: any) {
    console.error(chalk.red('\n❌ Quick start failed:'), error.message);
    process.exit(1);
  }
}

/**
 * Link CLI globally
 */
export async function linkCommand(options: SetupOptions) {
  console.log(chalk.bold.cyan('\n🔗 Linking CLI Globally\n'));

  const workspace = options.workspace || process.cwd();

  try {
    // Build CLI first
    await buildCli(workspace);

    // Link globally
    const spinner = ora('Linking CLI globally...').start();
    await execa('npm', ['link'], { cwd: join(workspace, 'cli') });
    spinner.succeed('CLI linked globally');

    console.log(chalk.bold.green('\n✅ CLI linked!\n'));
    console.log(chalk.cyan('You can now use: eurekaclaude [command]'));
    console.log('');
  } catch (error: any) {
    console.error(chalk.red('\n❌ Link failed:'), error.message);
    process.exit(1);
  }
}

// Helper functions

async function buildMcpServer(workspace: string) {
  const spinner = ora('Building MCP server...').start();
  try {
    await execa('npm', ['run', 'build'], { cwd: workspace });
    spinner.succeed('MCP server built');
  } catch (error) {
    spinner.fail('MCP server build failed');
    throw error;
  }
}

async function buildCli(workspace: string) {
  const spinner = ora('Building CLI...').start();
  try {
    await execa('npm', ['run', 'build'], { cwd: join(workspace, 'cli') });
    spinner.succeed('CLI built');
  } catch (error) {
    spinner.fail('CLI build failed');
    throw error;
  }
}
