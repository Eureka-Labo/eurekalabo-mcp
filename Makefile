# Eureka Tasks MCP Server - Makefile
# Convenient commands for building, installing, and managing the MCP server

.PHONY: help build build-mcp build-cli install uninstall install-deps clean hooks-install hooks-uninstall hooks-status dev test status publish

# Default target - show help
help:
	@echo "Eureka Tasks MCP Server - Make Commands"
	@echo ""
	@echo "Installation:"
	@echo "  make install         - Install CLI globally (eurekaclaude command)"
	@echo "  make uninstall       - Uninstall CLI globally"
	@echo "  make quickstart      - Complete setup (deps + build + hooks)"
	@echo ""
	@echo "Build Commands:"
	@echo "  make build           - Build both MCP server and CLI"
	@echo "  make build-mcp       - Build MCP server only"
	@echo "  make build-cli       - Build CLI only"
	@echo "  make install-deps    - Install all dependencies"
	@echo ""
	@echo "Hook Management:"
	@echo "  make hooks-install   - Install work session hooks (guidance mode)"
	@echo "  make hooks-strict    - Install work session hooks (strict mode)"
	@echo "  make hooks-uninstall - Uninstall work session hooks"
	@echo "  make hooks-status    - Check hook installation status"
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev             - Run MCP server in development mode"
	@echo "  make dev-cli         - Run CLI in development mode"
	@echo ""
	@echo "Utility Commands:"
	@echo "  make clean           - Clean build artifacts"
	@echo "  make status          - Show system status"
	@echo "  make test            - Run tests (placeholder)"
	@echo ""
	@echo "Advanced:"
	@echo "  make publish         - Publish CLI to npm (requires auth)"
	@echo "  make link-cli        - Link CLI globally for development"
	@echo ""

# Build both MCP server and CLI
build: build-mcp build-cli
	@echo "✅ Build complete"

# Build MCP server
build-mcp:
	@echo "🔨 Building MCP server..."
	@npm run build
	@echo "✅ MCP server built"

# Build CLI
build-cli:
	@echo "🔨 Building CLI..."
	@npm --prefix cli run build
	@echo "✅ CLI built"

# Install CLI globally (cross-platform)
install: build-cli
	@echo "📦 Installing eurekaclaude CLI globally..."
	@echo ""
	@cd cli && npm link
	@echo ""
	@echo "✅ Installation complete!"
	@echo ""
	@echo "You can now use: eurekaclaude [command]"
	@echo ""
	@echo "Available commands:"
	@echo "  eurekaclaude build              - Build MCP server and CLI"
	@echo "  eurekaclaude status             - Show system status"
	@echo "  eurekaclaude hooks install      - Install work session hooks"
	@echo "  eurekaclaude quickstart         - Complete setup"
	@echo ""
	@echo "Run 'eurekaclaude --help' for full command list"
	@echo ""
	@echo "Note: If you get permission errors, try:"
	@echo "  - macOS/Linux: sudo make install"
	@echo "  - Windows: Run as Administrator"
	@echo ""

# Uninstall CLI globally
uninstall:
	@echo "🗑️  Uninstalling eurekaclaude CLI..."
	@cd cli && npm unlink
	@echo "✅ Uninstallation complete"

# Install dependencies for both MCP and CLI
install-deps:
	@echo "📦 Installing MCP server dependencies..."
	@npm install
	@echo "📦 Installing CLI dependencies..."
	@npm --prefix cli install
	@echo "✅ Dependencies installed"

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf dist/
	@rm -rf cli/dist/
	@rm -rf node_modules/.cache
	@rm -f .eureka-active-session
	@echo "✅ Clean complete"

# Install hooks in guidance mode (recommended)
hooks-install: build-cli
	@echo "🪝 Installing work session hooks (guidance mode)..."
	@node cli/dist/index.js hooks install --mode guidance
	@echo "✅ Hooks installed"

# Install hooks in strict mode
hooks-strict: build-cli
	@echo "🪝 Installing work session hooks (strict mode)..."
	@node cli/dist/index.js hooks install --mode strict --force
	@echo "✅ Hooks installed (strict mode)"

# Uninstall hooks
hooks-uninstall: build-cli
	@echo "🪝 Uninstalling work session hooks..."
	@node cli/dist/index.js hooks uninstall
	@echo "✅ Hooks uninstalled"

# Check hook status
hooks-status: build-cli
	@node cli/dist/index.js hooks status

# Run MCP server in development mode
dev:
	@echo "🚀 Starting MCP server in development mode..."
	@npm run dev

# Run CLI in development mode
dev-cli:
	@echo "🚀 Starting CLI in development mode..."
	@npm --prefix cli run dev

# Show system status
status:
	@echo "📊 Eureka Tasks MCP Server Status"
	@echo ""
	@echo "Node Version:"
	@node --version
	@echo ""
	@echo "npm Version:"
	@npm --version
	@echo ""
	@echo "Build Status:"
	@if [ -d "dist" ]; then echo "  MCP Server: ✅ Built"; else echo "  MCP Server: ❌ Not built"; fi
	@if [ -d "cli/dist" ]; then echo "  CLI: ✅ Built"; else echo "  CLI: ❌ Not built"; fi
	@echo ""
	@echo "Git Status:"
	@git branch --show-current
	@echo ""
	@if [ -f ".eureka-active-session" ]; then \
		echo "Active Session: ✅ Yes"; \
		cat .eureka-active-session; \
	else \
		echo "Active Session: ⚠️  No"; \
	fi

# Run tests (placeholder for future)
test:
	@echo "🧪 Running tests..."
	@npm test
	@echo "✅ Tests complete"

# Link CLI globally for development
link-cli: build-cli
	@echo "🔗 Linking CLI globally..."
	@cd cli && npm link
	@echo "✅ CLI linked globally"
	@echo ""
	@echo "You can now use: eurekaclaude [command]"

# Publish CLI to npm (requires authentication)
publish: build-cli
	@echo "📦 Publishing CLI to npm..."
	@cd cli && npm publish
	@echo "✅ CLI published"

# Quick start - build everything and install hooks
quickstart: install-deps build hooks-install
	@echo ""
	@echo "🎉 Quick start complete!"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Restart Claude Code"
	@echo "  2. Configure your EUREKA_API_KEY"
	@echo "  3. Start coding - tasks will be created automatically!"
	@echo ""

# Full clean including node_modules
clean-all: clean
	@echo "🧹 Removing node_modules..."
	@rm -rf node_modules/
	@rm -rf cli/node_modules/
	@echo "✅ Full clean complete"

# Rebuild from scratch
rebuild: clean build
	@echo "✅ Rebuild complete"
