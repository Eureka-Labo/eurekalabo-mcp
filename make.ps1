# Eureka Tasks MCP Server - PowerShell Build Script (Windows Alternative to Makefile)
# Usage: .\make.ps1 <command>
# Example: .\make.ps1 build

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

# Color output functions
function Write-Success {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Cyan
}

function Write-Warning {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Red
}

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host $Message -ForegroundColor Magenta
    Write-Host ""
}

# Helper function to check if command succeeded
function Check-LastCommand {
    param([string]$ErrorMessage)
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom $ErrorMessage
        exit 1
    }
}

# Commands
function Show-Help {
    Write-Header "Eureka Tasks MCP Server - PowerShell Commands"

    Write-Info "Installation:"
    Write-Host "  .\make.ps1 install         - Install CLI globally (eurekaclaude command)"
    Write-Host "  .\make.ps1 uninstall       - Uninstall CLI globally"
    Write-Host "  .\make.ps1 quickstart      - Complete setup (deps + build + hooks)"
    Write-Host ""

    Write-Info "Build Commands:"
    Write-Host "  .\make.ps1 build           - Build both MCP server and CLI"
    Write-Host "  .\make.ps1 build-mcp       - Build MCP server only"
    Write-Host "  .\make.ps1 build-cli       - Build CLI only"
    Write-Host "  .\make.ps1 install-deps    - Install all dependencies"
    Write-Host ""

    Write-Info "Hook Management:"
    Write-Host "  .\make.ps1 hooks-install   - Install work session hooks (guidance mode)"
    Write-Host "  .\make.ps1 hooks-strict    - Install work session hooks (strict mode)"
    Write-Host "  .\make.ps1 hooks-uninstall - Uninstall work session hooks"
    Write-Host "  .\make.ps1 hooks-status    - Check hook installation status"
    Write-Host ""

    Write-Info "Development Commands:"
    Write-Host "  .\make.ps1 dev             - Run MCP server in development mode"
    Write-Host "  .\make.ps1 dev-cli         - Run CLI in development mode"
    Write-Host ""

    Write-Info "Utility Commands:"
    Write-Host "  .\make.ps1 clean           - Clean build artifacts"
    Write-Host "  .\make.ps1 clean-all       - Clean build artifacts and node_modules"
    Write-Host "  .\make.ps1 status          - Show system status"
    Write-Host "  .\make.ps1 test            - Run tests (placeholder)"
    Write-Host ""

    Write-Info "Advanced:"
    Write-Host "  .\make.ps1 publish         - Publish CLI to npm (requires auth)"
    Write-Host "  .\make.ps1 link-cli        - Link CLI globally for development"
    Write-Host "  .\make.ps1 rebuild         - Clean and rebuild everything"
    Write-Host ""
}

function Build-MCP {
    Write-Info "🔨 Building MCP server..."
    npm run build
    Check-LastCommand "❌ MCP server build failed"
    Write-Success "✅ MCP server built"
}

function Build-CLI {
    Write-Info "🔨 Building CLI..."
    npm --prefix cli run build
    Check-LastCommand "❌ CLI build failed"
    Write-Success "✅ CLI built"
}

function Build-All {
    Build-MCP
    Build-CLI
    Write-Success "✅ Build complete"
}

function Install-CLI {
    Build-CLI
    Write-Info "📦 Installing eurekaclaude CLI globally..."
    Write-Host ""

    Push-Location cli
    npm link
    Check-LastCommand "❌ CLI installation failed"
    Pop-Location

    Write-Host ""
    Write-Success "✅ Installation complete!"
    Write-Host ""
    Write-Info "You can now use: eurekaclaude [command]"
    Write-Host ""
    Write-Info "Available commands:"
    Write-Host "  eurekaclaude build              - Build MCP server and CLI"
    Write-Host "  eurekaclaude status             - Show system status"
    Write-Host "  eurekaclaude hooks install      - Install work session hooks"
    Write-Host "  eurekaclaude quickstart         - Complete setup"
    Write-Host ""
    Write-Host "Run 'eurekaclaude --help' for full command list"
    Write-Host ""
    Write-Warning "Note: If you get permission errors, run PowerShell as Administrator"
    Write-Host ""
}

function Uninstall-CLI {
    Write-Info "🗑️  Uninstalling eurekaclaude CLI..."
    Push-Location cli
    npm unlink
    Pop-Location
    Write-Success "✅ Uninstallation complete"
}

function Install-Dependencies {
    Write-Info "📦 Installing MCP server dependencies..."
    npm install
    Check-LastCommand "❌ MCP server dependency installation failed"

    Write-Info "📦 Installing CLI dependencies..."
    npm --prefix cli install
    Check-LastCommand "❌ CLI dependency installation failed"

    Write-Success "✅ Dependencies installed"
}

function Clean-Build {
    Write-Info "🧹 Cleaning build artifacts..."

    if (Test-Path "dist") {
        Remove-Item -Recurse -Force "dist"
    }

    if (Test-Path "cli\dist") {
        Remove-Item -Recurse -Force "cli\dist"
    }

    if (Test-Path "node_modules\.cache") {
        Remove-Item -Recurse -Force "node_modules\.cache"
    }

    if (Test-Path ".eureka-active-session") {
        Remove-Item -Force ".eureka-active-session"
    }

    Write-Success "✅ Clean complete"
}

function Clean-All {
    Clean-Build

    Write-Info "🧹 Removing node_modules..."

    if (Test-Path "node_modules") {
        Remove-Item -Recurse -Force "node_modules"
    }

    if (Test-Path "cli\node_modules") {
        Remove-Item -Recurse -Force "cli\node_modules"
    }

    Write-Success "✅ Full clean complete"
}

function Install-Hooks {
    Build-CLI
    Write-Info "🪝 Installing work session hooks (guidance mode)..."
    node cli\dist\index.js hooks install --mode guidance
    Check-LastCommand "❌ Hook installation failed"
    Write-Success "✅ Hooks installed"
}

function Install-Hooks-Strict {
    Build-CLI
    Write-Info "🪝 Installing work session hooks (strict mode)..."
    node cli\dist\index.js hooks install --mode strict --force
    Check-LastCommand "❌ Hook installation failed"
    Write-Success "✅ Hooks installed (strict mode)"
}

function Uninstall-Hooks {
    Build-CLI
    Write-Info "🪝 Uninstalling work session hooks..."
    node cli\dist\index.js hooks uninstall
    Check-LastCommand "❌ Hook uninstallation failed"
    Write-Success "✅ Hooks uninstalled"
}

function Show-Hooks-Status {
    Build-CLI
    node cli\dist\index.js hooks status
}

function Run-Dev {
    Write-Info "🚀 Starting MCP server in development mode..."
    npm run dev
}

function Run-Dev-CLI {
    Write-Info "🚀 Starting CLI in development mode..."
    npm --prefix cli run dev
}

function Show-Status {
    Write-Header "📊 Eureka Tasks MCP Server Status"

    Write-Info "Node Version:"
    node --version
    Write-Host ""

    Write-Info "npm Version:"
    npm --version
    Write-Host ""

    Write-Info "Build Status:"
    if (Test-Path "dist") {
        Write-Success "  MCP Server: ✅ Built"
    } else {
        Write-Warning "  MCP Server: ❌ Not built"
    }

    if (Test-Path "cli\dist") {
        Write-Success "  CLI: ✅ Built"
    } else {
        Write-Warning "  CLI: ❌ Not built"
    }
    Write-Host ""

    Write-Info "Git Status:"
    $branch = git branch --show-current 2>$null
    if ($branch) {
        Write-Host "  Branch: $branch"
    } else {
        Write-Warning "  Not a git repository"
    }
    Write-Host ""

    if (Test-Path ".eureka-active-session") {
        Write-Success "Active Session: ✅ Yes"
        Get-Content ".eureka-active-session"
    } else {
        Write-Warning "Active Session: ⚠️  No"
    }
    Write-Host ""
}

function Run-Tests {
    Write-Info "🧪 Running tests..."
    npm test
    Write-Success "✅ Tests complete"
}

function Link-CLI {
    Build-CLI
    Write-Info "🔗 Linking CLI globally..."
    Push-Location cli
    npm link
    Check-LastCommand "❌ CLI linking failed"
    Pop-Location

    Write-Success "✅ CLI linked globally"
    Write-Host ""
    Write-Info "You can now use: eurekaclaude [command]"
}

function Publish-CLI {
    Build-CLI
    Write-Info "📦 Publishing CLI to npm..."
    Push-Location cli
    npm publish
    Check-LastCommand "❌ CLI publishing failed"
    Pop-Location
    Write-Success "✅ CLI published"
}

function Quick-Start {
    Install-Dependencies
    Build-All
    Install-Hooks

    Write-Host ""
    Write-Success "🎉 Quick start complete!"
    Write-Host ""
    Write-Info "Next steps:"
    Write-Host "  1. Restart Claude Code"
    Write-Host "  2. Configure your EUREKA_API_KEY"
    Write-Host "  3. Start coding - tasks will be created automatically!"
    Write-Host ""
}

function Rebuild {
    Clean-Build
    Build-All
    Write-Success "✅ Rebuild complete"
}

# Command router
switch ($Command.ToLower()) {
    "help" { Show-Help }
    "build" { Build-All }
    "build-mcp" { Build-MCP }
    "build-cli" { Build-CLI }
    "install" { Install-CLI }
    "uninstall" { Uninstall-CLI }
    "install-deps" { Install-Dependencies }
    "clean" { Clean-Build }
    "clean-all" { Clean-All }
    "hooks-install" { Install-Hooks }
    "hooks-strict" { Install-Hooks-Strict }
    "hooks-uninstall" { Uninstall-Hooks }
    "hooks-status" { Show-Hooks-Status }
    "dev" { Run-Dev }
    "dev-cli" { Run-Dev-CLI }
    "status" { Show-Status }
    "test" { Run-Tests }
    "link-cli" { Link-CLI }
    "publish" { Publish-CLI }
    "quickstart" { Quick-Start }
    "rebuild" { Rebuild }
    default {
        Write-Error-Custom "❌ Unknown command: $Command"
        Write-Host ""
        Show-Help
        exit 1
    }
}
