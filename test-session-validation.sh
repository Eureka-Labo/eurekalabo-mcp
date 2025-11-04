#!/bin/bash

# Test session validation functionality

echo "=== Testing Session Validation ==="
echo ""

# Test 1: Hook should block without session
echo "Test 1: Hook blocks Write operation without session"
cat > /tmp/test-hook-input.json << 'EOF'
{
  "tool_name": "Write",
  "tool_input": {
    "file_path": "test.txt",
    "content": "test"
  },
  "cwd": "/Users/yujirohikawa/workspace/eurekalabo/mcp-server",
  "session_id": "test-session-new-123"
}
EOF

echo "  Input: Write operation, session_id=test-session-new-123, no marker file"
result=$(cat /tmp/test-hook-input.json | node .claude/hooks/check-work-session.cjs)
decision=$(echo "$result" | jq -r '.hookSpecificOutput.permissionDecision')
echo "  Result: $decision"
if [ "$decision" = "deny" ]; then
  echo "  ✅ PASS: Correctly denied operation"
else
  echo "  ❌ FAIL: Should have denied operation"
fi
echo ""

# Test 2: Create session marker with Claude session ID
echo "Test 2: Create session marker with Claude session ID"
cat > .eureka-active-session << 'EOF'
{
  "taskId": "test-task-123",
  "startedAt": "2025-11-04T12:00:00.000Z",
  "gitTracked": true,
  "branch": "main",
  "gitBaseline": "abc123",
  "claudeSessionId": "test-session-new-123"
}
EOF
echo "  Created marker with claudeSessionId=test-session-new-123"
echo ""

# Test 3: Hook should allow with matching session ID
echo "Test 3: Hook allows operation with matching Claude session ID"
result=$(cat /tmp/test-hook-input.json | node .claude/hooks/check-work-session.cjs)
decision=$(echo "$result" | jq -r '.hookSpecificOutput.permissionDecision')
echo "  Result: $decision"
if [ "$decision" = "allow" ]; then
  echo "  ✅ PASS: Correctly allowed operation"
else
  echo "  ❌ FAIL: Should have allowed operation"
fi
echo ""

# Test 4: Hook should deny with mismatched session ID
echo "Test 4: Hook denies operation with different Claude session ID"
cat > /tmp/test-hook-input-different.json << 'EOF'
{
  "tool_name": "Write",
  "tool_input": {
    "file_path": "test.txt",
    "content": "test"
  },
  "cwd": "/Users/yujirohikawa/workspace/eurekalabo/mcp-server",
  "session_id": "test-session-different-456"
}
EOF

result=$(cat /tmp/test-hook-input-different.json | node .claude/hooks/check-work-session.cjs)
decision=$(echo "$result" | jq -r '.hookSpecificOutput.permissionDecision')
reason=$(echo "$result" | jq -r '.hookSpecificOutput.permissionDecisionReason' | head -3)
echo "  Result: $decision"
echo "  Reason: $reason"
if [ "$decision" = "deny" ]; then
  echo "  ✅ PASS: Correctly denied stale session"
else
  echo "  ❌ FAIL: Should have denied stale session"
fi
echo ""

# Test 5: Session ID storage hook
echo "Test 5: Session ID storage hook"
rm -f .claude-session-id
cat > /tmp/test-session-store.json << 'EOF'
{
  "session_id": "stored-session-789",
  "cwd": "/Users/yujirohikawa/workspace/eurekalabo/mcp-server",
  "prompt": "test prompt"
}
EOF

cat /tmp/test-session-store.json | node .claude/hooks/store-session-id.cjs
if [ -f ".claude-session-id" ]; then
  stored_id=$(cat .claude-session-id)
  echo "  Stored session ID: $stored_id"
  if [ "$stored_id" = "stored-session-789" ]; then
    echo "  ✅ PASS: Session ID correctly stored"
  else
    echo "  ❌ FAIL: Wrong session ID stored"
  fi
else
  echo "  ❌ FAIL: Session ID file not created"
fi
echo ""

# Cleanup
echo "Cleanup: Removing test files"
rm -f .eureka-active-session .claude-session-id /tmp/test-hook-input.json /tmp/test-hook-input-different.json /tmp/test-session-store.json
echo ""
echo "=== Test Complete ==="
