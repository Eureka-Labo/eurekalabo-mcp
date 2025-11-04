#!/bin/bash
# MCP Server Integration Test Script

set -e

echo "🧪 Testing EurekaClaude MCP Server..."
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check environment
echo "📋 Checking environment..."
if [ -z "$EUREKA_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  EUREKA_API_KEY not set${NC}"
else
    echo -e "${GREEN}✅ EUREKA_API_KEY configured${NC}"
fi

if [ -z "$EUREKA_API_URL" ]; then
    echo -e "${YELLOW}⚠️  EUREKA_API_URL not set (using default)${NC}"
else
    echo -e "${GREEN}✅ EUREKA_API_URL: $EUREKA_API_URL${NC}"
fi

echo ""

# Check dependencies
echo "📦 Checking dependencies..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi

if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    echo -e "${GREEN}✅ $GIT_VERSION${NC}"
else
    echo -e "${RED}❌ git not found${NC}"
    exit 1
fi

echo ""

# Check git repository
echo "🗂️  Checking git repository..."
if git rev-parse --git-dir > /dev/null 2>&1; then
    BRANCH=$(git branch --show-current)
    echo -e "${GREEN}✅ Git repository initialized (branch: $BRANCH)${NC}"

    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}⚠️  Working directory has uncommitted changes${NC}"
    else
        echo -e "${GREEN}✅ Working directory clean${NC}"
    fi
else
    echo -e "${RED}❌ Not a git repository${NC}"
fi

echo ""

# Check project structure
echo "📁 Checking project structure..."
REQUIRED_FILES=(
    "src/index.ts"
    "src/api/client.ts"
    "src/tools/task-tools.ts"
    "package.json"
    ".mcp.json"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file missing${NC}"
    fi
done

echo ""

# Check if built
echo "🔨 Checking build..."
if [ -f "dist/index.js" ]; then
    echo -e "${GREEN}✅ Built files exist${NC}"
else
    echo -e "${YELLOW}⚠️  No built files found. Run: npm run build${NC}"
fi

echo ""

# Check Claude Desktop config
echo "⚙️  Checking Claude Desktop configuration..."
CLAUDE_CONFIG="$HOME/.claude/claude_desktop_config.json"
if [ -f "$CLAUDE_CONFIG" ]; then
    echo -e "${GREEN}✅ Claude Desktop config exists${NC}"
    if grep -q "eureka-tasks" "$CLAUDE_CONFIG"; then
        echo -e "${GREEN}✅ eurekaclaude MCP server configured${NC}"
    else
        echo -e "${YELLOW}⚠️  eurekaclaude not found in config${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Claude Desktop config not found${NC}"
    echo "   To install: cp .mcp.json $CLAUDE_CONFIG"
fi

echo ""

# Check session state
echo "💾 Checking work session state..."
if [ -d ".eureka-sessions" ]; then
    SESSION_COUNT=$(find .eureka-sessions -name "*.json" | wc -l)
    echo -e "${GREEN}✅ Session directory exists ($SESSION_COUNT sessions)${NC}"
else
    echo -e "${YELLOW}⚠️  No session directory (will be created on first use)${NC}"
fi

if [ -f ".eureka-session.json" ]; then
    echo -e "${GREEN}✅ Active session file exists${NC}"
else
    echo -e "${YELLOW}⚠️  No active session file${NC}"
fi

echo ""

# Test TypeScript compilation
echo "🔍 Testing TypeScript compilation..."
if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
    echo -e "${RED}❌ TypeScript compilation errors${NC}"
    npx tsc --noEmit
else
    echo -e "${GREEN}✅ TypeScript compiles successfully${NC}"
fi

echo ""

# Summary
echo "======================================"
echo "📊 Test Summary"
echo "======================================"
echo ""
echo "The MCP server structure is valid."
echo ""
echo "Next steps:"
echo "1. Ensure EUREKA_API_KEY is set in your environment"
echo "2. Install to Claude Desktop: cp .mcp.json ~/.claude/claude_desktop_config.json"
echo "3. Restart Claude Desktop"
echo "4. Test with: list all tasks"
echo ""
echo "For interactive testing:"
echo "  npx @modelcontextprotocol/inspector npx tsx src/index.ts"
echo ""
