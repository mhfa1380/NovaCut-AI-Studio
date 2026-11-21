<#
.SYNOPSIS
    Verifies the NovaCut AI Studio Windows install and diagnostics.
    عیب‌یابی جامع نصب نوواکات و اتصالات در ویندوز.
#>

[CmdletBinding()]
param(
    [string] $TempDir = (Join-Path $env:TEMP 'novacut-bridge'),
    [string] $VsCodeConfigPath = (Join-Path $env:APPDATA 'Code\User\mcp.json'),
    [string] $ClaudeConfigPath = (Join-Path $env:APPDATA 'Claude\claude_desktop_config.json'),
    [string] $CursorConfigPath = (Join-Path $env:APPDATA 'Cursor\User\mcp.json'),
    [string] $WindsurfConfigPath = (Join-Path $env:USERPROFILE '.codeium\windsurf\mcp_config.json'),
    [string] $ChatGptConfigPath = (Join-Path $env:APPDATA 'OpenAI\ChatGPT\mcp.json')
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

if ($env:OS -ne 'Windows_NT') {
    throw 'This doctor supports Windows only. Use npm run setup:doctor on macOS.'
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
$cepNovaCutDir = Join-Path $env:APPDATA 'Adobe\CEP\extensions\NovaCutBridgeCEP'
$cepLegacyDir = Join-Path $env:APPDATA 'Adobe\CEP\extensions\MCPBridgeCEP'
$distEntry = Join-Path $repoRoot 'dist\index.js'
$failures = 0

function Pass([string] $Message) {
    Write-Host "  [OK]   $Message" -ForegroundColor Green
}

function Warn([string] $Message) {
    Write-Host "  [WARN] $Message" -ForegroundColor Yellow
}

function Fail([string] $Message) {
    Write-Host "  [FAIL] $Message" -ForegroundColor Red
    $script:failures++
}

function Test-JsonServer([string] $Path, [string] $RootKey) {
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        Warn "$Path not found (optional)"
        return
    }

    $raw = Get-Content -LiteralPath $Path -Raw
    if ([string]::IsNullOrWhiteSpace($raw)) {
        Fail "$Path is empty"
        return
    }

    try {
        $json = $raw | ConvertFrom-Json
    } catch {
        Fail "$Path is not valid JSON"
        return
    }

    $root = $json.PSObject.Properties[$RootKey]
    if (-not $root) {
        Fail "$Path missing $RootKey"
        return
    }

    $server = $root.Value.PSObject.Properties['novacut-premiere']
    if (-not $server) {
        $server = $root.Value.PSObject.Properties['premiere-pro']
    }
    if (-not $server) {
        Fail "$Path missing novacut-premiere or premiere-pro server entry"
        return
    }

    Pass "$Path contains NovaCut MCP server"
}

Write-Host ''
Write-Host '========================================================================' -ForegroundColor Cyan
Write-Host '  [DIAGNOSTICS] NovaCut AI Studio Diagnostics (Windows)' -ForegroundColor Green
Write-Host '  گزارش سلامت و عیب‌یابی نوواکات در ویندوز' -ForegroundColor Yellow
Write-Host '========================================================================' -ForegroundColor Cyan
Write-Host ''

Write-Host '1. Node.js Environment:' -ForegroundColor White
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Fail 'node not found on PATH'
} else {
    $nodeMajor = [int](& $node.Source -p "process.versions.node.split('.')[0]")
    if ($nodeMajor -lt 20) {
        Fail "Node.js 20+ required, found $(& $node.Source -v)"
    } else {
        Pass "Node.js $(& $node.Source -v) located at $($node.Source)"
    }
}

Write-Host '2. MCP Server Build:' -ForegroundColor White
if (Test-Path -LiteralPath $distEntry -PathType Leaf) {
    Pass "dist/index.js found ($distEntry)"
} else {
    Fail "$distEntry missing - run: npm run build"
}

Write-Host '3. Adobe CEP Extension Panel:' -ForegroundColor White
$cepFound = $false
if (Test-Path -LiteralPath (Join-Path $cepNovaCutDir 'CSXS\manifest.xml') -PathType Leaf) {
    Pass "NovaCut CEP extension verified at $cepNovaCutDir"
    $cepFound = $true
}
if (Test-Path -LiteralPath (Join-Path $cepLegacyDir 'CSXS\manifest.xml') -PathType Leaf) {
    Pass "Legacy CEP extension also present at $cepLegacyDir"
    $cepFound = $true
}
if (-not $cepFound) {
    Fail "CEP extension missing - run: npm run setup"
}

Write-Host '4. Adobe PlayerDebugMode (Registry):' -ForegroundColor White
$debugOk = $false
foreach ($version in 9..22) {
    $val = (Get-ItemProperty -Path "HKCU:\Software\Adobe\CSXS.$version" -Name 'PlayerDebugMode' -ErrorAction SilentlyContinue).PlayerDebugMode
    if ($val -eq '1') {
        $debugOk = $true
        break
    }
}
if ($debugOk) {
    Pass 'PlayerDebugMode enabled for Adobe CEP'
} else {
    Fail 'PlayerDebugMode not enabled - run npm run setup'
}

Write-Host '5. AI Client Configurations:' -ForegroundColor White
Test-JsonServer -Path $ClaudeConfigPath -RootKey 'mcpServers'
Test-JsonServer -Path $ChatGptConfigPath -RootKey 'mcpServers'
Test-JsonServer -Path $VsCodeConfigPath -RootKey 'servers'
Test-JsonServer -Path $CursorConfigPath -RootKey 'mcpServers'
Test-JsonServer -Path $WindsurfConfigPath -RootKey 'mcpServers'

Write-Host ''
if ($failures -eq 0) {
    Write-Host '[SUCCESS] All checks passed! NovaCut AI Studio is completely healthy and ready.' -ForegroundColor Green
    Write-Host 'همه تست‌ها با موفقیت پاس شدند! سیستم کاملاً آماده است.' -ForegroundColor Green
} else {
    Write-Host "⚠️  Found $failures issue(s). Run 'npm run setup' to fix them." -ForegroundColor Yellow
}
Write-Host ''
