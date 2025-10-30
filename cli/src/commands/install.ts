/**
 * Interactive installation command with component selection
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync } from 'fs';
import { join } from 'path';
import { execa } from 'execa';
import { installHooksCommand } from './hooks.js';
import { installSkillsCommand } from './skills.js';
import { configureSubAgentsCommand } from './subagents.js';
import { buildCommand } from './setup.js';

interface InstallOptions {
  workspace?: string;
  all?: boolean;
}

export async function installCommand(options: InstallOptions) {
  console.log(chalk.bold.cyan('\n📦 Eureka Tasks Installation Wizard\n'));

  const workspace = options.workspace || process.cwd();

  // If --all flag, install everything
  if (options.all) {
    await installAllComponents(workspace);
    return;
  }

  // Interactive component selection
  const { components } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'components',
      message: 'Select components to install:',
      choices: [
        {
          name: 'CLI globally (eurekaclaude command available everywhere)',
          value: 'cli',
          checked: true,
        },
        {
          name: 'Work session hooks (task enforcement in current project)',
          value: 'hooks',
          checked: false,
        },
        {
          name: 'Claude Code skills (auto-workflow, smart commits, session recovery)',
          value: 'skills',
          checked: true,
        },
        {
          name: 'Sub-agents configuration (technical-writer, devops-architect, system-architect)',
          value: 'subagents',
          checked: true,
        },
        {
          name: 'Build MCP server and CLI (required for first time)',
          value: 'build',
          checked: true,
        },
      ],
    },
  ]);

  if (components.length === 0) {
    console.log(chalk.yellow('\n⚠️  No components selected. Exiting.\n'));
    return;
  }

  console.log(chalk.cyan('\n📋 Installation Plan:'));
  components.forEach((comp: string) => {
    const labels: Record<string, string> = {
      cli: '  ✓ Install CLI globally',
      hooks: '  ✓ Install work session hooks',
      skills: '  ✓ Install Claude Code skills',
      subagents: '  ✓ Configure sub-agents',
      build: '  ✓ Build MCP server and CLI',
    };
    console.log(chalk.dim(labels[comp]));
  });
  console.log('');

  // Confirm installation
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Proceed with installation?',
      default: true,
    },
  ]);

  if (!confirm) {
    console.log(chalk.yellow('\n⚠️  Installation cancelled.\n'));
    return;
  }

  // Execute installation
  try {
    // Build first if selected
    if (components.includes('build')) {
      console.log(chalk.bold.yellow('\n📦 Step 1: Building components...\n'));
      await buildCommand({ workspace });
    }

    // Install CLI globally
    if (components.includes('cli')) {
      console.log(chalk.bold.yellow('\n🔗 Step 2: Installing CLI globally...\n'));
      await installCliGlobally(workspace);
    }

    // Install hooks
    if (components.includes('hooks')) {
      console.log(chalk.bold.yellow('\n🪝 Step 3: Installing work session hooks...\n'));

      // Ask for hook mode
      const { hookMode } = await inquirer.prompt([
        {
          type: 'list',
          name: 'hookMode',
          message: 'Select enforcement mode:',
          choices: [
            {
              name: 'Guidance (recommended) - Prompts to create tasks but allows bypass',
              value: 'guidance',
            },
            {
              name: 'Strict - Hard blocks operations without active session',
              value: 'strict',
            },
          ],
          default: 'guidance',
        },
      ]);

      await installHooksCommand({ workspace, mode: hookMode });
    }

    // Install skills
    if (components.includes('skills')) {
      console.log(chalk.bold.yellow('\n✨ Step 4: Installing Claude Code skills...\n'));
      await installSkillsCommand('all', { workspace, force: false });
    }

    // Configure sub-agents
    if (components.includes('subagents')) {
      console.log(chalk.bold.yellow('\n🤖 Step 5: Configuring sub-agents...\n'));
      await configureSubAgentsCommand({ workspace, force: false });
    }

    // Installation complete
    console.log(chalk.bold.green('\n✅ Installation complete!\n'));

    // Show next steps
    console.log(chalk.cyan('Next steps:'));

    if (components.includes('cli')) {
      console.log('  1. The eurekaclaude command is now available globally');
      console.log(chalk.dim('     Try: eurekaclaude --help'));
    }

    if (components.includes('hooks')) {
      console.log('  2. Work session hooks are active');
      console.log(chalk.dim('     Tasks will be required before Write/Edit operations'));
    }

    if (components.includes('skills')) {
      console.log('  3. Claude Code skills are installed');
      console.log(chalk.dim('     Auto-workflow, smart commits, and session recovery'));
    }

    if (components.includes('subagents')) {
      console.log('  4. Sub-agents are configured');
      console.log(chalk.dim('     technical-writer, devops-architect, system-architect'));
    }

    console.log('  5. Configure your EUREKA_API_KEY in environment or mcp.json');
    console.log('  6. Restart Claude Code to activate all features');
    console.log('');

  } catch (error: any) {
    console.error(chalk.red('\n❌ Installation failed:'), error.message);
    process.exit(1);
  }
}

async function installAllComponents(workspace: string) {
  console.log(chalk.bold.cyan('Installing all components...\n'));

  try {
    // Build
    console.log(chalk.bold.yellow('📦 Building components...\n'));
    await buildCommand({ workspace });

    // Install CLI
    console.log(chalk.bold.yellow('\n🔗 Installing CLI globally...\n'));
    await installCliGlobally(workspace);

    // Install hooks (guidance mode)
    console.log(chalk.bold.yellow('\n🪝 Installing work session hooks...\n'));
    await installHooksCommand({ workspace, mode: 'guidance' });

    // Install skills
    console.log(chalk.bold.yellow('\n✨ Installing Claude Code skills...\n'));
    await installSkillsCommand('all', { workspace, force: false });

    // Configure sub-agents
    console.log(chalk.bold.yellow('\n🤖 Configuring sub-agents...\n'));
    await configureSubAgentsCommand({ workspace, force: false });

    console.log(chalk.bold.green('\n✅ All components installed!\n'));
    console.log(chalk.cyan('Next steps:'));
    console.log('  1. Configure EUREKA_API_KEY in your environment');
    console.log('  2. Restart Claude Code');
    console.log('  3. Start coding - tasks will be created automatically!');
    console.log('  4. Skills and sub-agents are active for enhanced workflow');
    console.log('');

  } catch (error: any) {
    console.error(chalk.red('\n❌ Installation failed:'), error.message);
    process.exit(1);
  }
}

async function installCliGlobally(workspace: string) {
  const spinner = ora('Installing CLI globally...').start();

  try {
    const cliPath = join(workspace, 'cli');

    // Check if CLI is built
    const cliDistPath = join(cliPath, 'dist');
    if (!existsSync(cliDistPath)) {
      spinner.fail('CLI not built');
      throw new Error('CLI must be built before installation. Run: npm run build');
    }

    // Run npm link
    await execa('npm', ['link'], { cwd: cliPath });

    spinner.succeed('CLI installed globally');

    console.log(chalk.green('\n  ✓ eurekaclaude command is now available'));
    console.log(chalk.dim('  Run: eurekaclaude --help'));

  } catch (error: any) {
    spinner.fail('Failed to install CLI globally');

    // Provide helpful error messages
    if (error.message.includes('EACCES') || error.message.includes('permission denied')) {
      console.log(chalk.yellow('\n  Permission error detected. Try:'));
      console.log(chalk.dim('    - macOS/Linux: sudo make install'));
      console.log(chalk.dim('    - Windows: Run as Administrator'));
    }

    throw error;
  }
}
