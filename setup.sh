#!/bin/bash

# Eureka Labo MCP Server Setup Script
# Usage: ./setup.sh

set -e

echo "🚀 Eureka Labo MCP Server Setup"
echo "================================"
echo ""

# Check if .env already exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists."
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

# Get API URL
echo ""
echo "📍 Step 1: API URL"
read -p "Enter Eureka API URL [default: http://xeu:3000]: " API_URL
API_URL=${API_URL:-http://xeu:3000}

# Get API Key
echo ""
echo "🔑 Step 2: API Key"
echo "   Go to: ${API_URL}/projects/YOUR_PROJECT/settings"
echo "   Click 'Create API Key' and copy it here"
echo ""
read -p "Enter your API Key (pk_live_...): " API_KEY

if [[ ! $API_KEY =~ ^pk_live_ ]]; then
    echo "❌ Error: API key should start with 'pk_live_'"
    exit 1
fi

# Create .env file
echo ""
echo "📝 Creating .env file..."
cat > .env << EOF
# Eureka Labo API Configuration
EUREKA_API_URL=${API_URL}
EUREKA_API_KEY=${API_KEY}

# Workspace is auto-detected from Claude Code's current directory
# Only uncomment if you need to override:
# WORKSPACE_PATH=/path/to/your/project
EOF

echo "✅ .env file created!"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed!"
fi

# Get MCP server absolute path
MCP_SERVER_PATH="$(cd "$(dirname "$0")" && pwd)"

# Configure Claude Code
echo ""
echo "🔧 Step 3: Claude Code Configuration"
echo ""
echo "Add this to your ~/.claude/mcp.json:"
echo ""
echo "================================================"
cat << EOF
{
  "mcpServers": {
    "eureka-tasks": {
      "command": "npx",
      "args": [
        "tsx",
        "${MCP_SERVER_PATH}/src/index.ts"
      ],
      "env": {
        "EUREKA_API_URL": "${API_URL}",
        "EUREKA_API_KEY": "${API_KEY}"
      }
    }
  }
}
EOF
echo "================================================"
echo ""

read -p "Would you like me to automatically add this to ~/.claude/mcp.json? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    CLAUDE_MCP_PATH="$HOME/.claude/mcp.json"

    # Create .claude directory if it doesn't exist
    mkdir -p "$HOME/.claude"

    # Check if mcp.json exists
    if [ ! -f "$CLAUDE_MCP_PATH" ]; then
        # Create new file
        cat > "$CLAUDE_MCP_PATH" << EOF
{
  "mcpServers": {
    "eureka-tasks": {
      "command": "npx",
      "args": [
        "tsx",
        "${MCP_SERVER_PATH}/src/index.ts"
      ],
      "env": {
        "EUREKA_API_URL": "${API_URL}",
        "EUREKA_API_KEY": "${API_KEY}"
      }
    }
  }
}
EOF
        echo "✅ Created ~/.claude/mcp.json"
    else
        echo "⚠️  ~/.claude/mcp.json already exists. Please add the configuration manually."
        echo "   Or run: cat ~/.claude/mcp.json to see current config"
    fi
fi

# Test configuration
echo ""
echo "🧪 Testing configuration..."
echo ""

# Test API connection
echo -n "Testing API connection... "
if curl -s -H "X-API-Key: ${API_KEY}" "${API_URL}/api/v1/tasks" > /dev/null 2>&1; then
    echo "✅ Connected!"
else
    echo "❌ Failed"
    echo "   Check if API is running at ${API_URL}"
    echo "   Check if API key is valid"
fi

# Check if current directory is a git repo
echo -n "Checking git repository... "
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo "✅ Git repository detected"
else
    echo "⚠️  Not a git repository"
    echo "   MCP server needs to run in a git repository to track changes"
fi

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Restart Claude Code if it's running"
echo "2. Open Claude Code in your project directory"
echo "3. Try: @eureka-tasks list_tasks"
echo ""
echo "For help, see: ${MCP_SERVER_PATH}/README.md"
