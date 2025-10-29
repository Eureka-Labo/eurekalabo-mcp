# EurekaClaude Agent Configuration

Agent orchestration for optimal task-driven development workflow.

## Available Agents

### 🎯 Task Management Agent
**Purpose**: Handles all Eureka Tasks operations and workflow enforcement

**Triggers**:
- Task creation requests
- Work session management
- Task completion operations
- PR creation with task linking

**Capabilities**:
- Create and manage tasks
- Track work sessions with git integration
- Enforce task-driven workflow
- Auto-generate Japanese descriptions
- Link PRs to tasks

**When to use**:
- Starting new development work
- Completing tasks
- Creating pull requests
- Checking task status

---

### 🔧 Implementation Agent
**Purpose**: Executes coding tasks with proper tracking

**Triggers**:
- Active work session exists
- User requests code changes
- Feature implementation
- Bug fixes

**Capabilities**:
- File editing and creation
- Code refactoring
- Test writing
- Documentation updates

**Requirements**:
- Must have active work session
- All changes tracked to task
- Follows project conventions

---

### 📊 Analysis Agent
**Purpose**: Code review and quality analysis

**Triggers**:
- Pre-PR creation
- Code review requests
- Quality checks

**Capabilities**:
- Code quality analysis
- Security scanning
- Performance review
- Best practices validation

**Integration**:
- Runs before PR creation
- Adds findings to task comments
- Suggests improvements

---

### 🤖 Automation Agent
**Purpose**: Handles CI/CD and automated workflows

**Triggers**:
- PR creation
- Code push to main branches
- Scheduled tasks

**Capabilities**:
- Run tests automatically
- Deploy to staging/production
- Update task status from CI results
- Notify team of build status

**GitHub Integration**:
- Workflow execution
- Status updates
- Deployment automation

---

## Agent Orchestration

### Workflow Sequence

```
User Request
    ↓
Task Management Agent
    ├─ Create/Update Task
    ├─ Start Work Session
    ↓
Implementation Agent
    ├─ Make Code Changes
    ├─ Track to Task
    ↓
Analysis Agent (Pre-PR)
    ├─ Code Review
    ├─ Quality Checks
    ↓
Task Management Agent
    ├─ Complete Task
    ├─ Create PR
    ↓
Automation Agent
    ├─ Run CI/CD
    ├─ Deploy
    └─ Update Task Status
```

### Agent Communication

Agents share context through:
- Task metadata
- Work session data
- Git commit messages
- PR descriptions

---

## Configuration

Agents are configured in `~/.claude/config/agents.json`:

```json
{
  "task-manager": {
    "enabled": true,
    "auto-create-tasks": true,
    "require-work-session": true,
    "language": "ja"
  },
  "implementation": {
    "enabled": true,
    "enforce-session": true,
    "auto-format": true,
    "run-tests": false
  },
  "analysis": {
    "enabled": true,
    "pre-pr-review": true,
    "security-scan": true,
    "performance-check": false
  },
  "automation": {
    "enabled": true,
    "auto-deploy-staging": false,
    "notify-team": true,
    "update-tasks": true
  }
}
```

## Agent Priorities

1. **Task Management Agent** (Highest)
   - Always runs first
   - Enforces workflow
   - Blocks invalid operations

2. **Implementation Agent**
   - Runs when session active
   - Makes actual code changes
   - Respects task boundaries

3. **Analysis Agent**
   - Runs on demand
   - Pre-PR validation
   - Quality gates

4. **Automation Agent** (Background)
   - Responds to events
   - Async operations
   - Status updates

---

## Best Practices

### ✅ Do
- Let Task Management Agent enforce workflow
- Use Implementation Agent for all code changes
- Run Analysis Agent before creating PRs
- Enable Automation Agent for CI/CD

### ❌ Don't
- Bypass Task Management Agent
- Make code changes without work session
- Skip Analysis Agent reviews
- Disable agents without good reason

---

## Troubleshooting

### Agent Not Responding
1. Check if agent is enabled in config
2. Verify MCP server is running
3. Restart Claude Code
4. Check logs in `~/.claude/logs/`

### Workflow Blocked
1. Ensure active work session exists
2. Check task status in Eureka
3. Verify git repository is clean
4. Review agent configuration

### Agent Conflicts
1. Check agent priority settings
2. Review execution order
3. Disable conflicting agents
4. Contact support if needed

---

For more information: https://github.com/eurekalabo/eurekaclaude/docs/agents
