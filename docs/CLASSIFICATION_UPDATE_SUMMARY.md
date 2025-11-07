# Classification Update Summary

## Overview

Updated the Eureka Tasks MCP Server to implement intelligent request classification that distinguishes between:
- **Feature Development** (requires feature specification)
- **Maintenance Tasks** (bug fixes, refactoring - no spec needed)

## Changes Made

### 1. MCP Server Prompt (`src/index.ts`)

**Updated the `task-enforcement` prompt with:**

#### Step 0: Mandatory Classification
- Added classification decision tree
- Clear indicators for feature vs maintenance
- Ambiguous scenario detection and user clarification requirement

#### Workflow A: Feature-Spec-Driven
- Complete workflow for new features
- Includes: `start_feature_development` → `create_feature_spec` → `create_task` → `link_task_to_feature_spec` → `start_work_on_task`

#### Workflow B: Maintenance Task
- Simplified workflow for bug fixes and refactoring
- Includes: `list_boards` → `create_task` → `start_work_on_task`
- **NO feature spec creation**

#### Updated Examples
- Example 1: Clear feature request (automatic workflow A)
- Example 2: Clear maintenance request (automatic workflow B)
- Example 3: Ambiguous request (asks user for clarification)
- Wrong examples showing common mistakes

#### Updated Quick Flow Diagram
- Visual representation of classification decision tree
- Shows branching based on request type

#### Enhanced Error Handling
- Classification errors
- Feature without spec errors
- Maintenance with spec errors (wasteful)

### 2. Work Session Hook (`check-work-session.cjs`)

**Updated both guidance functions:**

#### `buildGuidanceMessage()`
- Added Step 0: Classification requirement
- Includes indicators and examples
- Shows both Workflow A and B
- Emphasizes asking user when ambiguous

#### `denyWithStaleSessionGuidance()`
- Similar classification logic for stale sessions
- Guides Claude to clean up and restart with correct workflow

### 3. Documentation

#### Created: `docs/WORKFLOW_CLASSIFICATION.md`
Comprehensive guide covering:
- Two workflow types explained
- Ambiguous scenarios with examples
- Classification decision tree
- Best practices for users and Claude
- Why classification matters
- Troubleshooting section

#### Updated: `.claude/hooks/README.md`
- Added Step 0: Classification section
- Separated Workflow A and B examples
- Referenced new classification guide

## Key Rules Implemented

### Classification Decision Rules

1. **Feature Indicators** → Workflow A (with spec):
   - "Add X feature", "Implement X", "Create X"
   - New user-facing functionality
   - Requires PRD, pages, endpoints, ER diagrams

2. **Maintenance Indicators** → Workflow B (task only):
   - "Fix X", "Refactor X", "Update X"
   - Bug fixes, code cleanup, optimization
   - Technical improvements

3. **Ambiguous Requests** → Ask User:
   - "Improve X", "Enhance X", "Change X"
   - "Add validation" (could be feature OR fix)
   - "Update authentication" (could be new method OR security fix)

### Critical Instructions

✅ **Always classify before starting any workflow**
✅ **Ask user when not 100% certain**
✅ **Never create feature without spec**
✅ **Never create maintenance with spec (wasteful)**
✅ **All content in Japanese**
✅ **Execute automatically (don't ask for confirmation after classification)**

## Benefits

### For Feature Development
- ✅ Complete PRD documentation
- ✅ AI-generated pages, endpoints, ER diagrams
- ✅ Clear feature tracking and progress
- ✅ Better project organization

### For Maintenance Tasks
- ✅ Faster task creation (no spec overhead)
- ✅ Appropriate for simple fixes
- ✅ No unnecessary documentation
- ✅ More efficient workflow

### For Users
- ✅ Appropriate workflow for each task type
- ✅ Clear guidance when ambiguous
- ✅ Better project organization
- ✅ Reduced overhead for simple tasks

## Testing Scenarios

### Test 1: Clear Feature Request
```
User: "Add user authentication system"
Expected: Automatic Workflow A (with spec)
```

### Test 2: Clear Maintenance Request
```
User: "Fix login bug where users get 500 error"
Expected: Automatic Workflow B (task only)
```

### Test 3: Ambiguous Request
```
User: "Improve the authentication system"
Expected: Ask user for clarification
```

### Test 4: Hook Trigger with Feature
```
User: "Add payment processing" → attempts Write without session
Expected: Hook blocks, guides to Workflow A (with spec)
```

### Test 5: Hook Trigger with Maintenance
```
User: "Fix the logout bug" → attempts Write without session
Expected: Hook blocks, guides to Workflow B (task only)
```

## Migration Notes

### For Existing Users

No breaking changes - this is purely additive:
- Existing workflows continue to work
- New classification step added before workflow selection
- Hook guidance updated to include classification

### For Developers

No code changes needed:
- MCP server API remains unchanged
- All tools function identically
- Only prompt logic updated

## Next Steps

1. **Build and deploy** ✅ (Completed)
2. **Test with real scenarios**
3. **Monitor classification accuracy**
4. **Gather user feedback**
5. **Refine classification indicators if needed**

## Files Modified

```
src/index.ts                              # MCP server prompt updated
.claude/hooks/check-work-session.cjs     # Hook guidance updated
.claude/hooks/README.md                  # Hook documentation updated
docs/WORKFLOW_CLASSIFICATION.md          # New classification guide (created)
docs/CLASSIFICATION_UPDATE_SUMMARY.md    # This file (created)
```

## Build Status

✅ **Build successful** - TypeScript compilation completed without errors

## Rollback Plan

If issues arise, revert these files to previous versions:
- `src/index.ts` (lines 636-1022)
- `.claude/hooks/check-work-session.cjs` (functions at lines 94-247)

## Conclusion

The classification system ensures that:
- Features get proper documentation via feature specs
- Maintenance tasks don't have unnecessary overhead
- Users are asked for clarification when needed
- The system makes intelligent automatic decisions when possible

This creates a more efficient, appropriate workflow for all types of development tasks.
