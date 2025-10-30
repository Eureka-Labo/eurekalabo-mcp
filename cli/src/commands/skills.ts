/**
 * Setup and manage Claude Code skills for Eureka Tasks
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync } from 'fs';
import { mkdir, writeFile, readFile, readdir, stat, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface SkillsOptions {
  force?: boolean;
  workspace?: string;
}

interface SkillMetadata {
  name: string;
  description: string;
  category: 'workflow' | 'git' | 'analysis' | 'documentation';
  enabled: boolean;
}

// Available Eureka Tasks skills
const AVAILABLE_SKILLS: SkillMetadata[] = [
  {
    name: 'eureka-task-coding',
    description: 'Auto-manages tasks and work sessions for code changes',
    category: 'workflow',
    enabled: true,
  },
  {
    name: 'eureka-smart-commits',
    description: 'AI-generated conventional commit messages with Japanese summaries',
    category: 'git',
    enabled: true,
  },
  {
    name: 'eureka-session-recovery',
    description: 'Recovers and resumes interrupted work sessions',
    category: 'workflow',
    enabled: true,
  },
];

/**
 * Install skill(s)
 */
export async function installSkillsCommand(skillName: string | undefined, options: SkillsOptions) {
  console.log(chalk.bold.cyan('\n✨ Eureka Tasks Skills Installation\n'));

  const workspace = options.workspace || process.cwd();
  const skillsDir = join(workspace, '.claude', 'skills');

  // If no skill name provided, show selection menu
  if (!skillName) {
    const { selectedSkills } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedSkills',
        message: 'Select skills to install:',
        choices: AVAILABLE_SKILLS.map(skill => ({
          name: `${skill.name} - ${skill.description}`,
          value: skill.name,
          checked: skill.enabled,
        })),
      },
    ]);

    if (selectedSkills.length === 0) {
      console.log(chalk.yellow('No skills selected. Exiting.'));
      return;
    }

    // Install each selected skill
    for (const name of selectedSkills) {
      await installSkill(name, workspace, skillsDir, options.force);
    }
  } else if (skillName === 'all') {
    // Install all skills
    for (const skill of AVAILABLE_SKILLS) {
      await installSkill(skill.name, workspace, skillsDir, options.force);
    }
  } else {
    // Install specific skill
    const skill = AVAILABLE_SKILLS.find(s => s.name === skillName);
    if (!skill) {
      console.log(chalk.red(`\n❌ Unknown skill: ${skillName}`));
      console.log(chalk.dim('Available skills:'));
      AVAILABLE_SKILLS.forEach(s => {
        console.log(chalk.dim(`  - ${s.name}`));
      });
      return;
    }

    await installSkill(skillName, workspace, skillsDir, options.force);
  }

  console.log(chalk.bold.green('\n✅ Skills installation complete!\n'));
  console.log(chalk.cyan('💡 Skills are automatically discovered by Claude Code'));
  console.log(chalk.cyan('   Use `eurekaclaude skills status` to verify\n'));
}

/**
 * Install a single skill
 */
async function installSkill(
  skillName: string,
  workspace: string,
  skillsDir: string,
  force?: boolean
) {
  const spinner = ora(`Installing ${skillName}...`).start();

  try {
    const skillDir = join(skillsDir, skillName);

    // Check if already exists
    if (existsSync(skillDir) && !force) {
      spinner.info(`${skillName} already installed (use --force to overwrite)`);
      return;
    }

    // Ensure skills directory exists
    await mkdir(skillsDir, { recursive: true });

    // Create skill directory
    if (existsSync(skillDir)) {
      await rm(skillDir, { recursive: true });
    }
    await mkdir(skillDir, { recursive: true });

    // Get skill template
    const template = getSkillTemplate(skillName);
    if (!template) {
      spinner.fail(`No template found for ${skillName}`);
      return;
    }

    // Write SKILL.md
    await writeFile(join(skillDir, 'SKILL.md'), template, 'utf-8');

    spinner.succeed(`${skillName} installed`);
  } catch (error: any) {
    spinner.fail(`Failed to install ${skillName}`);
    console.error(chalk.red(error.message));
  }
}

/**
 * List available and installed skills
 */
export async function listSkillsCommand(options: SkillsOptions) {
  console.log(chalk.bold.cyan('\n✨ Eureka Tasks Skills\n'));

  const workspace = options.workspace || process.cwd();
  const skillsDir = join(workspace, '.claude', 'skills');

  // Get installed skills
  const installedSkills = existsSync(skillsDir)
    ? await readdir(skillsDir)
    : [];

  console.log(chalk.bold('Available Skills:\n'));

  for (const skill of AVAILABLE_SKILLS) {
    const installed = installedSkills.includes(skill.name);
    const icon = installed ? chalk.green('✅') : chalk.dim('○');
    const status = installed ? chalk.green('installed') : chalk.dim('not installed');

    console.log(`${icon} ${chalk.bold(skill.name)} (${status})`);
    console.log(chalk.dim(`   ${skill.description}`));
    console.log(chalk.dim(`   Category: ${skill.category}\n`));
  }

  console.log('');
}

/**
 * Show skills status
 */
export async function statusSkillsCommand(options: SkillsOptions) {
  console.log(chalk.bold.cyan('\n✨ Eureka Tasks Skills Status\n'));

  const workspace = options.workspace || process.cwd();
  const skillsDir = join(workspace, '.claude', 'skills');

  if (!existsSync(skillsDir)) {
    console.log(chalk.yellow('⚠️  Skills directory not found'));
    console.log(chalk.dim(`   Expected: ${skillsDir}\n`));
    return;
  }

  // Read installed skills
  const entries = await readdir(skillsDir);
  const skills: string[] = [];

  for (const entry of entries) {
    const entryPath = join(skillsDir, entry);
    const stats = await stat(entryPath);

    if (stats.isDirectory()) {
      const skillFile = join(entryPath, 'SKILL.md');
      if (existsSync(skillFile)) {
        skills.push(entry);
      }
    }
  }

  if (skills.length === 0) {
    console.log(chalk.yellow('⚠️  No skills installed'));
    console.log(chalk.dim('   Run `eurekaclaude skills install` to get started\n'));
    return;
  }

  console.log(chalk.green(`✅ Found ${skills.length} skill(s)\n`));

  for (const skillName of skills) {
    const skillPath = join(skillsDir, skillName);
    const skillFile = join(skillPath, 'SKILL.md');

    try {
      const content = await readFile(skillFile, 'utf-8');
      const metadata = parseSkillMetadata(content);

      console.log(chalk.bold(metadata.name || skillName));
      console.log(chalk.dim(`  Description: ${metadata.description || 'N/A'}`));
      console.log(chalk.dim(`  Path: ${skillPath}`));
      console.log('');
    } catch (error) {
      console.log(chalk.yellow(`⚠️  ${skillName} - Could not read metadata`));
    }
  }

  console.log('');
}

/**
 * Uninstall skill
 */
export async function uninstallSkillsCommand(skillName: string, options: SkillsOptions) {
  console.log(chalk.bold.cyan('\n✨ Uninstalling Skill\n'));

  if (!skillName) {
    console.log(chalk.red('❌ Skill name required'));
    console.log(chalk.dim('   Usage: eurekaclaude skills uninstall <skill-name>\n'));
    return;
  }

  const workspace = options.workspace || process.cwd();
  const skillPath = join(workspace, '.claude', 'skills', skillName);

  if (!existsSync(skillPath)) {
    console.log(chalk.yellow(`⚠️  Skill not found: ${skillName}\n`));
    return;
  }

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Remove ${skillName}?`,
      default: false,
    },
  ]);

  if (!confirm) {
    console.log(chalk.yellow('Cancelled.\n'));
    return;
  }

  const spinner = ora(`Removing ${skillName}...`).start();

  try {
    await rm(skillPath, { recursive: true });
    spinner.succeed(`${skillName} removed`);
    console.log('');
  } catch (error: any) {
    spinner.fail('Failed to remove skill');
    console.error(chalk.red(error.message));
  }
}

/**
 * Parse skill metadata from SKILL.md frontmatter
 */
function parseSkillMetadata(content: string): { name?: string; description?: string } {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return {};
  }

  const frontmatter = frontmatterMatch[1];
  const nameMatch = frontmatter.match(/name:\s*(.+)/);
  const descMatch = frontmatter.match(/description:\s*(.+)/);

  return {
    name: nameMatch ? nameMatch[1].trim() : undefined,
    description: descMatch ? descMatch[1].trim() : undefined,
  };
}

/**
 * Get skill template by name
 */
function getSkillTemplate(skillName: string): string | null {
  const templates: Record<string, string> = {
    'eureka-task-coding': `---
name: eureka-task-coding
description: Manages Eureka Tasks workflow for code changes. Automatically creates tasks and starts work sessions before any Write/Edit operations. Use when user requests code implementation, bug fixes, or file modifications.
---

# Eureka Task-Aware Coding

Automatically integrates Eureka Tasks workflow with code changes.

## Auto-Activation Triggers

This skill activates when user requests:
- **Implementation**: "add", "implement", "create", "build"
- **Modifications**: "fix", "refactor", "update", "modify", "change"
- **Features**: "add feature", "new feature", "implement feature"

## Automatic Workflow

### 1. Search Existing Tasks
\`\`\`
mcp__eureka-tasks__list_tasks({
  search: "keywords extracted from user request"
})
\`\`\`

Extract relevant keywords from user's request for intelligent search.

### 2. Create Task if Needed

**CRITICAL: Always use Japanese for title and description**

\`\`\`
mcp__eureka-tasks__create_task({
  title: "ユーザーの依頼を日本語で簡潔に要約",
  description: "実装する内容と技術的アプローチを日本語で詳しく記述",
  priority: "medium" // or "high", "low" based on context
})
\`\`\`

### 3. Start Work Session
\`\`\`
mcp__eureka-tasks__start_work_on_task({ taskId: task.id })
\`\`\`

This creates \`.eureka-active-session\` marker that allows Write/Edit operations.

### 4. Implement Code Changes

Now proceed with requested Write/Edit operations.

### 5. User Communication

**Tell the user what you did:**
\`\`\`
タスク「{task.title}」を作成して作業を開始しました。実装します...
\`\`\`

## Integration with Hooks

This skill works seamlessly with the PreToolUse hook:
- Hook checks for \`.eureka-active-session\`
- Skill creates session before Write/Edit
- Operations proceed without user intervention

## Error Handling

### Session Already Active
\`\`\`
if (activeSessionExists) {
  // Ask user: complete existing or create new task?
  // Offer: complete_task_work or cancel_work_session
}
\`\`\`

### Task Creation Fails
\`\`\`
// Retry with simpler title/description
// Or ask user for manual task creation
\`\`\`

## Examples

**User Request**: "Add JWT authentication to the API"

**Skill Actions**:
1. Search tasks: "JWT", "認証", "auth", "API"
2. No match found → Create: "APIにJWT認証を追加"
3. Start session with task ID
4. Tell user: "タスク「APIにJWT認証を追加」を作成して作業を開始しました"
5. Proceed with implementation

---

**User Request**: "Fix the bug in user validation"

**Skill Actions**:
1. Search tasks: "bug", "validation", "バグ", "検証"
2. Found existing task → Use that task
3. Start session
4. Tell user: "既存のタスクで作業を開始しました"
5. Fix the bug
`,

    'eureka-smart-commits': `---
name: eureka-smart-commits
description: Generates conventional commit messages with Japanese summaries using technical-writer analysis. Use when committing changes or completing task work sessions.
---

# Eureka Smart Commits

AI-powered commit message generation following Conventional Commits with Japanese summaries.

## Auto-Activation Triggers

- User says: "commit", "create commit", "commit these changes"
- Completing task work session
- Manual git commit requests

## Workflow

### 1. Analyze Changes
\`\`\`bash
git diff --staged
# or
git diff HEAD
\`\`\`

### 2. Generate Smart Commit Message
\`\`\`
mcp__eureka-tasks__generate_smart_commit_message({
  gitDiff: "<diff output>",
  taskContext: {
    taskId: "current-task-id",
    title: "task title",
    description: "task description"
  }
})
\`\`\`

### 3. Commit Format

The generated message follows this structure:

\`\`\`
<type>(<scope>): <subject>

<body with Japanese summary>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
\`\`\`

**Types**: feat, fix, refactor, docs, test, chore, style, perf

### 4. Execute Commit
\`\`\`bash
git commit -m "$(cat <<'EOF'
<generated message>
EOF
)"
\`\`\`

## Examples

### Feature Addition
\`\`\`
feat(auth): Add JWT authentication middleware

APIにJWT認証ミドルウェアを追加しました。
トークン検証とユーザー認証フローを実装。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
\`\`\`

### Bug Fix
\`\`\`
fix(validation): Correct email validation regex

メール検証の正規表現エラーを修正しました。
特殊文字を含むメールアドレスに対応。

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
\`\`\`

## Integration with Task Completion

When completing a task work session:
\`\`\`
mcp__eureka-tasks__complete_task_work({
  taskId: "task-id",
  summary: "実装内容の日本語サマリー"
})
\`\`\`

The skill can generate commit message from:
- Git changes since session start
- Task context (title, description, summary)
- Technical-writer analysis
`,

    'eureka-session-recovery': `---
name: eureka-session-recovery
description: Recovers and resumes interrupted work sessions. Use when detecting orphaned session markers, git status shows uncommitted changes, or user mentions interrupted work.
---

# Eureka Session Recovery

Automatically detect and recover interrupted work sessions.

## Auto-Activation Triggers

- Session marker exists but no clear context
- User says: "what was I working on?", "resume work", "continue"
- Uncommitted changes detected in git status
- Session conflicts detected

## Detection

### Check for Orphaned Sessions
\`\`\`
1. Check if .eureka-active-session exists
2. Read session metadata
3. Check git status for uncommitted changes
4. Verify task still exists in system
\`\`\`

### Get Active Sessions
\`\`\`
mcp__eureka-tasks__get_active_sessions()
\`\`\`

## Recovery Actions

### Option 1: Complete Session
\`\`\`
mcp__eureka-tasks__complete_task_work({
  taskId: "task-id",
  summary: "作業内容のサマリーを日本語で"
})
\`\`\`

**When to use**: Changes are complete and ready to commit

### Option 2: Cancel Session
\`\`\`
mcp__eureka-tasks__cancel_work_session({
  taskId: "task-id"
})
\`\`\`

**When to use**:
- Work was experimental/temporary
- Want to start fresh
- Session is corrupted

### Option 3: Resume Session
\`\`\`
// Session already active - just continue
// No action needed, inform user of current task
\`\`\`

## Recovery Workflow

### 1. Detect Session State
\`\`\`typescript
const sessionMarker = '.eureka-active-session';
if (exists(sessionMarker)) {
  const session = readJSON(sessionMarker);
  const gitStatus = execSync('git status --short').toString();

  if (gitStatus.trim()) {
    // Has uncommitted changes - offer to complete
  } else {
    // No changes - offer to cancel
  }
}
\`\`\`

### 2. Analyze Changes
\`\`\`bash
git diff HEAD
git diff --stat
\`\`\`

### 3. Offer User Options
\`\`\`
タスク「{task.title}」のセッションが残っています。

変更内容:
{git diff summary}

アクション:
1. セッションを完了する（変更をコミット）
2. セッションをキャンセルする（変更を保持）
3. 作業を続ける
\`\`\`

## Conflict Resolution

### Multiple Active Sessions
\`\`\`
// Should not happen, but if it does:
1. List all active sessions
2. Show task details for each
3. Cancel stale sessions
4. Keep only the current one
\`\`\`

### Stale Sessions (>24 hours)
\`\`\`
if (sessionAge > 24 * 60 * 60 * 1000) {
  console.log('⚠️  Session is older than 24 hours');
  // Offer to cancel automatically
}
\`\`\`

## Examples

### Scenario 1: Resume After Restart

**Detection**:
- Claude Code restarts
- Session marker exists
- Uncommitted changes present

**Action**:
\`\`\`
セッション「APIに認証を追加」を検出しました。

変更ファイル:
- src/auth.ts (新規作成)
- src/index.ts (変更)

作業を続けますか？
[Y] 続ける  [C] 完了する  [X] キャンセル
\`\`\`

### Scenario 2: Clean Up Stale Session

**Detection**:
- Session marker exists
- No uncommitted changes
- Session is 48 hours old

**Action**:
\`\`\`
古いセッションを検出しました（48時間前）。
変更内容がないため、セッションをキャンセルします。
\`\`\`

### Scenario 3: Conflict Resolution

**Detection**:
- User tries to start new session
- Active session already exists

**Action**:
\`\`\`
既存のセッション「{existing.title}」があります。

オプション:
1. 既存セッションを完了して新規セッションを開始
2. 既存セッションをキャンセルして新規セッションを開始
3. 既存セッションを続ける
\`\`\`
`,
  };

  return templates[skillName] || null;
}
