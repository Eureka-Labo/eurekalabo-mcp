---
name: react-best-practices
description: Enforces React 18+ best practices including hooks rules, Server Components patterns, performance optimization, and accessibility standards. Use when creating or modifying React/Next.js components.
allowed-tools: Read, Edit, Write, Grep, Glob
---

# React Best Practices Enforcer

Automatically validates and enforces modern React best practices, preventing common mistakes and ensuring high-quality component implementation.

## Auto-Activation Triggers

- **File Extensions**: `.jsx`, `.tsx`, `.js` (in React projects), `.ts` (React components)
- **Keywords**: "React", "component", "hook", "useState", "useEffect", "Next.js"
- **Imports**: Files importing from `react`, `next/*`
- **Context**: Creating or modifying React component files

## Enforcement Categories

### 1. React Hooks Rules ⚠️ CRITICAL

#### Rules
- ✅ **Only call hooks at top level** - Never in loops, conditions, or nested functions
- ✅ **Only call hooks from React functions** - Not from regular JavaScript functions
- ✅ **Exhaustive dependencies** - All dependencies in useEffect/useCallback/useMemo arrays
- ✅ **Stable hook order** - Same hooks in same order on every render

#### Detection Patterns

**❌ Bad: Conditional Hook**
```tsx
function Component({ condition }) {
  if (condition) {
    const [state, setState] = useState(0); // ❌ Hook in condition
  }
}
```

**✅ Good: Unconditional Hook**
```tsx
function Component({ condition }) {
  const [state, setState] = useState(0); // ✅ Always called

  if (condition) {
    // Use state here
  }
}
```

**❌ Bad: Hook in Loop**
```tsx
function Component({ items }) {
  items.forEach(item => {
    const [selected, setSelected] = useState(false); // ❌ Hook in loop
  });
}
```

**✅ Good: State Array**
```tsx
function Component({ items }) {
  const [selectedItems, setSelectedItems] = useState(new Set());

  items.forEach(item => {
    if (selectedItems.has(item.id)) {
      // Handle selected item
    }
  });
}
```

**⚠️ Warning: Missing Dependencies**
```tsx
useEffect(() => {
  fetchData(userId); // ⚠️ userId not in dependencies
}, []); // Should be [userId]
```

### 2. Server Components (Next.js 13+) 🚀

#### Default to Server Components
```tsx
// ✅ Good: Server Component (default)
// app/components/UserList.tsx
export default async function UserList() {
  const users = await fetchUsers(); // Can fetch directly
  return <div>{users.map(...)}</div>;
}
```

#### Mark Client Components Explicitly
```tsx
// ✅ Good: Client Component when needed
'use client'; // Only when using hooks, events, browser APIs

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

#### Detection Rules
- ⚠️ **'use client' without reason** - Server Component could work
- ✅ **'use client' with hooks/events** - Correct usage
- ⚠️ **Missing 'use client'** - Uses interactive features but missing directive

**Auto-Fix Suggestions:**
```
⚠️ Component uses useState but missing 'use client' directive

File: app/components/SearchBar.tsx:1

Add 'use client' at the top of the file:
```tsx
'use client';

import { useState } from 'react';
// ... rest of component
```

### 3. Performance Optimization 🏎️

#### useMemo for Expensive Computations
```tsx
// ❌ Bad: Recalculates every render
function Component({ items }) {
  const sortedItems = items.sort(...); // Runs every render
  return <List items={sortedItems} />;
}

// ✅ Good: Memoized
function Component({ items }) {
  const sortedItems = useMemo(
    () => items.sort(...),
    [items]
  );
  return <List items={sortedItems} />;
}
```

#### useCallback for Function Props
```tsx
// ❌ Bad: New function every render
function Parent() {
  const handleClick = () => { ... }; // New function each render
  return <Child onClick={handleClick} />; // Causes Child re-render
}

// ✅ Good: Memoized callback
function Parent() {
  const handleClick = useCallback(() => { ... }, []);
  return <Child onClick={handleClick} />;
}
```

#### React.memo for Component Optimization
```tsx
// ✅ Good: Prevent unnecessary re-renders
const ExpensiveChild = React.memo(function ExpensiveChild({ data }) {
  // Expensive rendering logic
  return <div>{processData(data)}</div>;
});
```

#### Detection Rules
- ⚠️ **Heavy computation without useMemo** - Array operations, filtering, mapping in render
- ⚠️ **Inline function in props** - Function created every render passed to child
- ✅ **Proper memoization** - useMemo/useCallback with correct dependencies

### 4. Accessibility (a11y) ♿

#### Semantic HTML
```tsx
// ❌ Bad: Non-semantic
<div onClick={handleClick}>Submit</div>

// ✅ Good: Semantic button
<button onClick={handleClick}>Submit</button>
```

#### ARIA Labels
```tsx
// ❌ Bad: No label
<button onClick={handleDelete}>🗑️</button>

// ✅ Good: Accessible
<button onClick={handleDelete} aria-label="タスクを削除">
  🗑️
</button>
```

#### Keyboard Navigation
```tsx
// ❌ Bad: onClick only
<div onClick={handleClick}>Click me</div>

// ✅ Good: Keyboard support
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
  Click me
</div>
```

#### Detection Rules
- ⚠️ **Interactive div without role** - Should use button or add role="button"
- ⚠️ **Missing alt on images** - All `<img>` must have alt attribute
- ⚠️ **onClick without keyboard handler** - Interactive elements need onKeyDown
- ⚠️ **Icon button without label** - Buttons with only icons need aria-label

### 5. Component Structure 📐

#### Props Interface
```tsx
// ✅ Good: Typed props
interface UserCardProps {
  userId: string;
  name: string;
  onSelect?: (id: string) => void;
}

export default function UserCard({ userId, name, onSelect }: UserCardProps) {
  // ...
}
```

#### Default Props
```tsx
// ✅ Good: Default values
function Pagination({ page = 1, pageSize = 20 }: PaginationProps) {
  // ...
}
```

#### Key Props in Lists
```tsx
// ❌ Bad: Index as key
{items.map((item, index) => (
  <Item key={index} {...item} /> // ❌ Unstable key
))}

// ✅ Good: Stable unique key
{items.map((item) => (
  <Item key={item.id} {...item} /> // ✅ Unique identifier
))}
```

### 6. Code Organization 🗂️

#### File Structure
```
components/
├── UserCard/
│   ├── index.tsx          // Main component
│   ├── UserCard.test.tsx  // Tests
│   ├── UserCard.css       // Styles (if not using CSS-in-JS)
│   └── types.ts           // TypeScript types
```

#### Export Patterns
```tsx
// ✅ Good: Named + default export
export interface UserCardProps { ... }
export function UserCard(props: UserCardProps) { ... }
export default UserCard;
```

## Validation Process

### Step 1: File Analysis
```javascript
// When editing React file
const fileContent = await Read(filePath);
const ast = parseTypeScript(fileContent);

// Extract components
const components = ast.body.filter(node =>
  isFunctionComponent(node) || isClassComponent(node)
);
```

### Step 2: Rule Checking

For each component:
```javascript
const issues = [];

// Check hooks rules
issues.push(...validateHooksRules(component));

// Check Server Component patterns
issues.push(...validateServerComponentUsage(component));

// Check performance patterns
issues.push(...validatePerformancePatterns(component));

// Check accessibility
issues.push(...validateAccessibility(component));

// Check component structure
issues.push(...validateComponentStructure(component));
```

### Step 3: Issue Reporting

```
🔍 React Best Practices Check: UserProfile.tsx

Issues Found (3):

❌ CRITICAL: Hook in conditional statement
   Line 15: useState called inside if block
   Fix: Move hook to top level of component

⚠️ WARNING: Missing dependency in useEffect
   Line 23: 'userId' is used but not in dependency array
   Fix: Add userId to dependencies: [userId]

💡 SUGGESTION: Consider using useMemo
   Line 45: Heavy array filtering on every render
   Fix: Wrap in useMemo(() => items.filter(...), [items])

Would you like me to auto-fix these issues?
```

### Step 4: Auto-Fix (Optional)

```javascript
// User confirms auto-fix
✅ Auto-fixing issues...

1. ✅ Moved useState to top level
2. ✅ Added missing dependency
3. ✅ Wrapped computation in useMemo

Changes applied to UserProfile.tsx
```

## Integration with Workflow

### Pre-Commit Validation
```javascript
// Before committing React files
User: "Commit these changes"

→ Detects .tsx files in staged changes
→ react-best-practices activates (THIS SKILL)
→ Validates all React components
→ Reports issues
→ Blocks commit if CRITICAL issues found
→ Allows commit with WARNINGS (logs them)
```

### Live Editing Guidance
```javascript
// While editing component
User: "Add a button that deletes tasks"

→ Skill monitors edits
→ Detects new onClick handler
→ Suggests: "Add aria-label for accessibility"
→ Detects missing keyboard support
→ Suggests: "Add onKeyDown handler for Enter key"
```

## Smart Features

### 1. Context-Aware Suggestions

```tsx
// Detects pattern: list rendering
{users.map((user) => (
  <UserCard {...user} />  // ⚠️ Missing key
))}

// Suggests:
"Add key prop to UserCard. Best practice: use unique identifier like user.id"

// Auto-fix:
{users.map((user) => (
  <UserCard key={user.id} {...user} />
))}
```

### 2. Framework-Specific Rules

**Next.js App Router:**
```tsx
// Detects Next.js 13+ app directory
// Applies Server Component rules

// app/page.tsx
export default function Page() { ... }
// ✅ Server Component by default - OK to fetch data directly
```

**Next.js Pages Router:**
```tsx
// pages/index.tsx
export default function Page() { ... }
// ✅ Client Component - getServerSideProps/getStaticProps pattern
```

### 3. Dependency Array Helper

```tsx
// Before
useEffect(() => {
  fetchUser(userId, projectId);
  updateCache(cache);
}, []); // ⚠️ Missing: userId, projectId, cache

// Skill detects and suggests:
useEffect(() => {
  fetchUser(userId, projectId);
  updateCache(cache);
}, [userId, projectId, cache]); // ✅ Complete dependencies
```

### 4. Performance Profiling Hints

```tsx
// Detects potential performance issues
⚠️ Component re-renders frequently (5+ props, no memoization)

Suggestions:
1. Wrap component in React.memo
2. Use useCallback for event handlers
3. Extract heavy computations to useMemo

Estimated improvement: 60% fewer re-renders
```

## Examples

### Example 1: Fix Hooks Violations

**Before:**
```tsx
function TaskList({ filter }) {
  if (filter) {
    const [tasks, setTasks] = useState([]); // ❌ Conditional hook
  }

  useEffect(() => {
    fetchTasks(filter); // ⚠️ Missing dependency
  }, []);

  return <div>...</div>;
}
```

**After Auto-Fix:**
```tsx
function TaskList({ filter }) {
  const [tasks, setTasks] = useState([]); // ✅ Top level

  useEffect(() => {
    if (filter) { // ✅ Condition inside useEffect
      fetchTasks(filter);
    }
  }, [filter]); // ✅ Complete dependencies

  return <div>...</div>;
}
```

### Example 2: Add Accessibility

**Before:**
```tsx
function DeleteButton({ onDelete }) {
  return (
    <div onClick={onDelete} className="delete-btn">
      🗑️
    </div>
  );
}
```

**After Auto-Fix:**
```tsx
function DeleteButton({ onDelete }) {
  return (
    <button
      onClick={onDelete}
      onKeyDown={(e) => e.key === 'Enter' && onDelete()}
      aria-label="削除"
      className="delete-btn"
    >
      🗑️
    </button>
  );
}
```

### Example 3: Optimize Performance

**Before:**
```tsx
function UserList({ users, searchTerm }) {
  const filteredUsers = users.filter(u =>
    u.name.includes(searchTerm)
  ); // ❌ Runs every render

  const handleSelect = (id) => { ... }; // ❌ New function every render

  return (
    <div>
      {filteredUsers.map(user => (
        <UserCard
          key={user.id}
          user={user}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
}
```

**After Auto-Fix:**
```tsx
function UserList({ users, searchTerm }) {
  const filteredUsers = useMemo(
    () => users.filter(u => u.name.includes(searchTerm)),
    [users, searchTerm]
  ); // ✅ Memoized

  const handleSelect = useCallback((id) => { ... }, []); // ✅ Stable callback

  return (
    <div>
      {filteredUsers.map(user => (
        <UserCard
          key={user.id}
          user={user}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
}
```

## Configuration

### Custom Rules File

`.claude/react-rules-config.json`:
```json
{
  "strictness": "standard",
  "rules": {
    "hooks": {
      "enforceRulesOfHooks": "error",
      "exhaustiveDeps": "warn",
      "noConditionalHooks": "error"
    },
    "serverComponents": {
      "preferServerComponents": true,
      "warnOnUnnecessaryClientComponents": true
    },
    "performance": {
      "suggestMemo": "warn",
      "suggestCallback": "warn",
      "warnOnInlineFunctions": "info"
    },
    "accessibility": {
      "requireAltText": "error",
      "requireAriaLabels": "warn",
      "enforceSemanticHTML": "warn",
      "requireKeyboardSupport": "warn"
    }
  },
  "autofix": {
    "enabled": true,
    "confirmBeforeFix": true,
    "fixCriticalOnly": false
  },
  "ignore": [
    "**/test/**",
    "**/*.test.tsx",
    "**/stories/**"
  ]
}
```

## Best Practices

1. **Run validation before commits** - Catch issues early
2. **Review auto-fixes** - Understand what changed and why
3. **Enable strict mode** - For production code
4. **Permissive for prototypes** - Less strict during exploration
5. **Team alignment** - Share configuration across team

## Performance

- File analysis: 1-2 seconds per component
- Rule checking: < 1 second per component
- Auto-fix generation: 1-2 seconds
- Total: ~3-5 seconds for typical component

## Permissions Required

- Read: Component files, TypeScript types
- Edit: Fix violations in components
- Grep: Search for patterns across files
- Glob: Find all React components in project
