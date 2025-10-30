#!/usr/bin/env node

/**
 * EurekaClaude CLI
 * Task-driven development framework with Eureka Tasks integration
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { installCommand } from './commands/install.js';
import { installHooksCommand, uninstallHooksCommand, statusHooksCommand } from './commands/hooks.js';
import {
  installSkillsCommand,
  listSkillsCommand,
  statusSkillsCommand,
  uninstallSkillsCommand,
} from './commands/skills.js';
import {
  buildCommand,
  statusCommand,
  installDepsCommand,
  cleanCommand,
  quickstartCommand,
  linkCommand,
} from './commands/setup.js';
import {
  commitCommand,
  prCommand,
  validateCommand,
  smartSetupCommand,
  configureSubAgentsCommand,
} from './commands/subagents.js';

const program = new Command();

program
  .name('eurekaclaude')
  .description('Task-driven development framework with Eureka Tasks integration')
  .version('1.0.0');

// Init command
program
  .command('init')
  .description('Initialize EurekaClaude framework in current project')
  .option('--api-url <url>', 'Eureka API URL')
  .option('--api-key <key>', 'Eureka API Key')
  .option('--workspace <path>', 'Workspace path (default: current directory)')
  .option('--git-hooks', 'Install git hooks')
  .option('--no-git-hooks', 'Skip git hooks installation')
  .option('--enforcement', 'Enable task enforcement')
  .option('--no-enforcement', 'Disable task enforcement')
  .action(initCommand);

// Install command
program
  .command('install')
  .description('Interactive installation wizard for CLI and components')
  .option('-w, --workspace <path>', 'Workspace path (default: current directory)')
  .option('--all', 'Install all components without prompting')
  .action(installCommand);

// Setup commands
program
  .command('build')
  .description('Build MCP server and CLI')
  .option('-w, --workspace <path>', 'Workspace path (default: current directory)')
  .action(buildCommand);

program
  .command('status')
  .description('Show system status')
  .option('-w, --workspace <path>', 'Workspace path (default: current directory)')
  .action(statusCommand);

program
  .command('install-deps')
  .description('Install all dependencies')
  .option('-w, --workspace <path>', 'Workspace path (default: current directory)')
  .action(installDepsCommand);

program
  .command('clean')
  .description('Clean build artifacts')
  .option('-w, --workspace <path>', 'Workspace path (default: current directory)')
  .option('-a, --all', 'Also remove node_modules')
  .action(cleanCommand);

program
  .command('quickstart')
  .description('Complete setup (install deps, build, install hooks)')
  .option('-w, --workspace <path>', 'Workspace path (default: current directory)')
  .action(quickstartCommand);

program
  .command('link')
  .description('Link CLI globally for eurekaclaude command')
  .option('-w, --workspace <path>', 'Workspace path (default: current directory)')
  .action(linkCommand);

// Hooks command group
const hooks = program.command('hooks').description('Manage work session enforcement hooks');

hooks
  .command('install')
  .description('Install work session enforcement hook')
  .option('-f, --force', 'Force overwrite existing hook')
  .option('-w, --workspace <path>', 'Workspace path (default: current directory)')
  .option('-m, --mode <mode>', 'Enforcement mode: guidance or strict')
  .action(installHooksCommand);

hooks
  .command('uninstall')
  .description('Uninstall work session enforcement hook')
  .option('-w, --workspace <path>', 'Workspace path (default: current directory)')
  .action(uninstallHooksCommand);

hooks
  .command('status')
  .description('Check work session hook installation status')
  .option('-w, --workspace <path>', 'Workspace path (default: current directory)')
  .action(statusHooksCommand);

// Skills command group
const skills = program.command('skills').description('Manage Claude Code skills for Eureka Tasks');

skills
  .command('install [skill-name]')
  .description('Install Eureka Tasks skill(s) (all, or specific skill name)')
  .option('-f, --force', 'Force overwrite existing skills')
  .option('-w, --workspace <path>', 'Workspace path (default: current directory)')
  .action(installSkillsCommand);

skills
  .command('list')
  .description('List available Eureka Tasks skills')
  .option('-w, --workspace <path>', 'Workspace path (default: current directory)')
  .action(listSkillsCommand);

skills
  .command('status')
  .description('Show installed skills status')
  .option('-w, --workspace <path>', 'Workspace path (default: current directory)')
  .action(statusSkillsCommand);

skills
  .command('uninstall <skill-name>')
  .description('Uninstall a skill')
  .option('-w, --workspace <path>', 'Workspace path (default: current directory)')
  .action(uninstallSkillsCommand);

// Sub-Agent commands
const subagents = program.command('subagents').description('AI-powered sub-agent tools');

subagents
  .command('configure')
  .description('Configure sub-agent tool permissions in Claude Code')
  .option('-w, --workspace <path>', 'Workspace path (default: current directory)')
  .option('-f, --force', 'Force reconfiguration even if already configured')
  .action(configureSubAgentsCommand);

program
  .command('commit')
  .description('Generate smart commit message using technical-writer sub-agent')
  .option('-w, --workspace <path>', 'Workspace path (default: current directory)')
  .action(commitCommand);

program
  .command('pr')
  .description('Generate smart PR description using technical-writer sub-agent')
  .option('-w, --workspace <path>', 'Workspace path (default: current directory)')
  .option('-b, --base-branch <branch>', 'Base branch to compare against (default: main)')
  .action(prCommand);

program
  .command('validate')
  .description('Validate eurekaclaude setup using devops-architect sub-agent')
  .option('-w, --workspace <path>', 'Workspace path (default: current directory)')
  .action(validateCommand);

const setup = program.command('setup').description('Setup and configuration commands');

setup
  .command('smart')
  .description('Generate smart setup configuration using system-architect sub-agent')
  .option('-w, --workspace <path>', 'Workspace path (default: current directory)')
  .option('-t, --type <type>', 'Project type (react, vue, python, go, etc.)')
  .action(smartSetupCommand);

// Parse arguments
program.parse();
