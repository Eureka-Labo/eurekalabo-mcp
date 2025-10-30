# Work Session Completion Checklist

## ⚠️ CRITICAL: Complete This Checklist BEFORE Calling `complete_task_work`

### 1. Code Quality Verification

- [ ] **Build succeeds**: `npm run build` passes without errors
- [ ] **Type checking passes**: No TypeScript errors
- [ ] **Linting passes**: `npm run lint` (if configured)
- [ ] **No console errors**: Check for unintended console.log statements

### 2. Testing Verification

- [ ] **Unit tests pass**: `npm test` or equivalent
- [ ] **Integration tests pass**: If applicable
- [ ] **Manual testing complete**: Test the actual feature/fix
- [ ] **Edge cases tested**: Test boundary conditions
- [ ] **Error cases tested**: Verify error handling works

### 3. Documentation Updates

- [ ] **README updated**: If public API or setup changed
- [ ] **CHANGELOG updated**: Document the change
- [ ] **Code comments added**: Complex logic explained
- [ ] **API docs updated**: If endpoints/methods changed
- [ ] **Migration guide created**: If breaking changes

### 4. Task Metadata Verification

- [ ] **Task description accurate**: Reflects what was actually done
- [ ] **Task title correct**: Matches the work completed
- [ ] **Completion summary prepared**: Clear, concise, in Japanese
- [ ] **File changes listed**: Know what files were modified

### 5. Git Hygiene

- [ ] **No unintended changes**: Review git diff carefully
- [ ] **No debug code**: Remove console.log, debugger statements
- [ ] **No commented code**: Clean up old code blocks
- [ ] **No sensitive data**: Check for API keys, passwords

### 6. Integration Verification

- [ ] **Dependencies updated**: package.json reflects changes
- [ ] **Breaking changes documented**: If any
- [ ] **Backward compatibility checked**: Old code still works
- [ ] **MCP server restartable**: If MCP changes made

### 7. Hook-Specific Checks (for this project)

- [ ] **Hook script executable**: `chmod +x .claude/hooks/*.cjs`
- [ ] **Hook JSON valid**: Test with sample input
- [ ] **All file operations covered**: Write/Edit/NotebookEdit
- [ ] **Session marker works**: Test create/delete

## Complete Work Session Template

Only after ALL checks pass:

```typescript
await mcp__eureka-tasks__complete_task_work({
  taskId: "task-id",
  summary: `
  [Brief description of what was accomplished]

  実装内容:
  1. [Feature 1]
  2. [Feature 2]
  3. [Feature 3]

  修正したファイル:
  - file1.ts (purpose)
  - file2.ts (purpose)

  作成したドキュメント:
  - DOC1.md (purpose)
  - DOC2.md (purpose)

  テスト結果:
  - ✅ Build: Success
  - ✅ Manual testing: Verified
  - ✅ Integration: Working
  `
});
```

## Example: Good vs Bad Session Completion

### ❌ Bad (Too Early)

```typescript
// Immediately after last code change
await complete_task_work({
  taskId: "123",
  summary: "Fixed the hook"
});
// Result: Might have broken tests, incomplete docs
```

### ✅ Good (After Verification)

```typescript
// After running checklist:
// 1. npm run build ✅
// 2. Tested hook manually ✅
// 3. Verified all file operations ✅
// 4. Updated documentation ✅
// 5. Reviewed git diff ✅

await complete_task_work({
  taskId: "123",
  summary: `CLIフックインストール機能の包括的な修正を完了

実装内容:
1. 拡張子を.jsから.cjsに変更（CommonJS互換性）
2. permissionDecisionを"ask"から"deny"に修正（適切な実行制御）
3. NotebookEdit対応を追加（完全なカバレッジ）

検証完了:
✅ CLI build: 成功
✅ Hook execution: 正常動作確認
✅ NotebookEdit blocking: 動作確認
✅ Documentation: 完成

修正ファイル:
- .claude/hooks/check-work-session.cjs
- cli/src/commands/hooks.ts
- .claude/settings.local.json

作成ドキュメント:
- cli/INSTALLATION.md
- HOOK_FIX_SUMMARY.md
- HOOK_PERMISSION_FIX.md
- NOTEBOOKEDIT_SUPPORT.md`
});
```

## Common Mistakes to Avoid

### 1. Completing Too Early
❌ Complete right after last code change
✅ Complete after verification and testing

### 2. Vague Summary
❌ "Fixed the bug"
✅ "修正内容の詳細説明 + テスト結果 + 変更ファイル一覧"

### 3. Skipping Tests
❌ "Looks good, ship it"
✅ Run all tests, verify manually

### 4. Incomplete Documentation
❌ Code only, no docs
✅ Code + README + migration guide + examples

### 5. Not Reviewing Changes
❌ Trust that everything is fine
✅ Review git diff, check for unintended changes

## Automation Ideas

### Pre-completion Hook (Future Enhancement)

```typescript
// Before complete_task_work is allowed:
async function preCompletionChecks() {
  // Run build
  const buildResult = await exec('npm run build');
  if (buildResult.exitCode !== 0) {
    throw new Error('Build failed - fix errors before completing');
  }

  // Run tests
  const testResult = await exec('npm test');
  if (testResult.exitCode !== 0) {
    throw new Error('Tests failed - fix tests before completing');
  }

  // Check for console.log
  const hasConsoleLog = await exec('grep -r "console.log" src/');
  if (hasConsoleLog.stdout) {
    console.warn('⚠️ Warning: console.log statements found');
  }

  // Verify documentation
  const docsExist = await checkDocsUpdated();
  if (!docsExist) {
    console.warn('⚠️ Warning: Documentation may need updating');
  }

  return true;
}
```

### CLI Enhancement

```bash
# Future CLI command
eurekaclaude session complete --verify

# Would run:
# 1. Build verification
# 2. Test suite
# 3. Lint checks
# 4. Documentation checks
# 5. Git diff review
# 6. Then prompt for summary
# 7. Call complete_task_work
```

## Benefits of Proper Completion

1. **Quality Assurance**: Catch bugs before they're "done"
2. **Better Documentation**: Complete record of what was done
3. **Team Communication**: Others understand the change
4. **Audit Trail**: Clear history of verification steps
5. **Professionalism**: Demonstrates thorough work

## Integration with Hook System

The work session hook should eventually enforce this checklist:

```javascript
// Future enhancement: Pre-completion validation
if (tool_name === 'complete_task_work') {
  // Run automated checks
  const checksPass = await runPreCompletionChecks();

  if (!checksPass) {
    return {
      permissionDecision: 'deny',
      permissionDecisionReason: 'Complete the checklist first:\n' +
        '- ❌ Build failed\n' +
        '- ❌ Tests not run\n' +
        '- ⚠️ Documentation incomplete'
    };
  }
}
```

## Conclusion

**Never complete a work session without:**
1. ✅ Verification (tests, build, manual testing)
2. ✅ Documentation (updated, accurate, complete)
3. ✅ Quality checks (lint, type-check, review)
4. ✅ Detailed summary (what, why, how, results)

This ensures every task completion represents truly finished, verified, documented work.
