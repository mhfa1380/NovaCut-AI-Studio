<#
.SYNOPSIS
    Installs the NovaCut AI Studio MCP server and CEP bridge panel on Windows.
    نصب خودکار بریج و پنل اکستنشن نوواکات برای ادوبی پریمیر پرو در ویندوز.
#>

[CmdletBinding()]
param(
    [string] $TempDir = (Join-Path $env:TEMP 'novacut-bridge'),
    [string] $VsCodeConfigPath = (Join-Path $env:APPDATA 'Code\User\mcp.json'),
    [string] $ClaudeConfigPath = (Join-Path $env:APPDATA 'Claude\claude_desktop_config.json'),
    [string] $CursorConfigPath = (Join-Path $env:APPDATA 'Cursor\User\mcp.json'),
    [string] $WindsurfConfigPath = (Join-Path $env:USERPROFILE '.codeium\windsurf\mcp_config.json'),
    [switch] $SkipBuild,
    [switch] $SkipAdobeDebugMode
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

if ($env:OS -ne 'Windows_NT') {
    throw 'This installer supports Windows only. Use ./scripts/install-macos.sh on macOS.'
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
$cepExtensionsDir = Join-Path $env:APPDATA 'Adobe\CEP\extensions'
$cepTargetDir = Join-Path $cepExtensionsDir 'NovaCutBridgeCEP'
$cepLegacyDir = Join-Path $cepExtensionsDir 'MCPBridgeCEP'
$distEntry = Join-Path $repoRoot 'dist\index.js'

function Resolve-CommandPath([string] $Name) {
    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if (-not $command) { return $null }
    return $command.Source
}

function Update-JsonWithNode([string] $ConfigPath, [string] $Mode) {
    $configDir = Split-Path -Parent $ConfigPath
    if (-not (Test-Path -LiteralPath $configDir)) {
        try { New-Item -ItemType Directory -Path $configDir -Force | Out-Null } catch {}
    }

    $helper = @'
const fs = require("fs");

const configPath = process.env.CONFIG_PATH;
const mode = process.env.CONFIG_MODE;
const nodePath = process.env.NODE_PATH_VALUE;
const distPath = process.env.DIST_PATH;
const tempPath = process.env.TEMP_PATH;

let data = {};
if (fs.existsSync(configPath)) {
  const raw = fs.readFileSync(configPath, "utf8").trim();
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch (error) {
      console.warn(`Note: ${configPath} is not valid JSON, creating fresh.`);
      data = {};
    }
  }
}

if (!data || typeof data !== "object" || Array.isArray(data)) {
  data = {};
}

const serverConfig = {
  command: nodePath,
  args: [distPath],
  env: {
    PREMIERE_TEMP_DIR: tempPath,
    NOVACUT_TOOLSET: "standard"
  }
};

if (mode === "copilot") {
  if (!data.servers || typeof data.servers !== "object" || Array.isArray(data.servers)) {
    data.servers = {};
  }
  data.servers["novacut-premiere"] = {
    type: "stdio",
    ...serverConfig
  };
  data.servers["premiere-pro"] = {
    type: "stdio",
    ...serverConfig
  };
} else {
  if (!data.mcpServers || typeof data.mcpServers !== "object" || Array.isArray(data.mcpServers)) {
    data.mcpServers = {};
  }
  data.mcpServers["novacut-premiere"] = serverConfig;
  data.mcpServers["premiere-pro"] = serverConfig;
}

try {
  fs.writeFileSync(configPath, `${JSON.stringify(data, null, 2)}\n`);
} catch (e) {
  console.warn(`Could not write to ${configPath}: ${e.message}`);
}
'@

    $helperPath = Join-Path $env:TEMP 'novacut-mcp-config-update.cjs'
    Set-Content -LiteralPath $helperPath -Value $helper -Encoding UTF8

    $oldConfigPath = $env:CONFIG_PATH
    $oldConfigMode = $env:CONFIG_MODE
    $oldNodePathValue = $env:NODE_PATH_VALUE
    $oldDistPath = $env:DIST_PATH
    $oldTempPath = $env:TEMP_PATH
    try {
        $env:CONFIG_PATH = $ConfigPath
        $env:CONFIG_MODE = $Mode
        $env:NODE_PATH_VALUE = $script:nodePath
        $env:DIST_PATH = $distEntry
        $env:TEMP_PATH = $TempDir
        & $script:nodePath $helperPath
    } catch {
        Write-Warning "Could not update config at $ConfigPath"
    } finally {
        $env:CONFIG_PATH = $oldConfigPath
        $env:CONFIG_MODE = $oldConfigMode
        $env:NODE_PATH_VALUE = $oldNodePathValue
        $env:DIST_PATH = $oldDistPath
        $env:TEMP_PATH = $oldTempPath
        Remove-Item -LiteralPath $helperPath -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ''
Write-Host '========================================================================' -ForegroundColor Cyan
Write-Host '  🎬 NovaCut AI Studio — Automated Windows Setup' -ForegroundColor Green
Write-Host '  نصب و راه‌اندازی خودکار استودیو هوشمند نوواکات برای ادوبی پریمیر پرو' -ForegroundColor Yellow
Write-Host '========================================================================' -ForegroundColor Cyan
Write-Host ''

$script:nodePath = Resolve-CommandPath 'node'
if (-not $script:nodePath) {
    throw "Node.js 20+ is required but 'node' was not found on PATH. Please install Node.js from https://nodejs.org/"
}

$nodeMajor = [int](& $script:nodePath -p "process.versions.node.split('.')[0]")
if ($nodeMajor -lt 20) {
    throw "Node.js 20+ is required. Found: $(& $script:nodePath -v)"
}
Write-Host "[OK] Node.js version $(& $script:nodePath -v) detected." -ForegroundColor Green

$npmPath = Resolve-CommandPath 'npm.cmd'
if (-not $npmPath) { $npmPath = Resolve-CommandPath 'npm' }
if (-not $npmPath) {
    throw "npm was not found on PATH."
}

if ($SkipBuild) {
    Write-Host '[INFO] Skipping npm install/build (-SkipBuild).' -ForegroundColor Gray
} else {
    Write-Host '[1/5] Checking and installing dependencies...' -ForegroundColor Cyan
    & $npmPath install --prefix $repoRoot
    if ($LASTEXITCODE -ne 0) { throw 'npm install failed.' }

    Write-Host '[2/5] Building NovaCut MCP server...' -ForegroundColor Cyan
    & $npmPath run build --prefix $repoRoot
    if ($LASTEXITCODE -ne 0) { throw 'npm run build failed.' }
}

if (-not (Test-Path -LiteralPath $distEntry -PathType Leaf)) {
    throw "Built entrypoint not found: $distEntry"
}

if ($SkipAdobeDebugMode) {
    Write-Host '[INFO] Skipping Adobe CEP debug mode.' -ForegroundColor Gray
} else {
    Write-Host '[3/5] Enabling Adobe CEP Debug Mode (CSXS 9..22 in Registry)...' -ForegroundColor Cyan
    foreach ($version in 9..22) {
        $key = "HKCU:\Software\Adobe\CSXS.$version"
        if (-not (Test-Path -LiteralPath $key)) {
            try { New-Item -Path $key -Force | Out-Null } catch {}
        }
        try {
            New-ItemProperty -Path $key -Name 'PlayerDebugMode' -Value '1' -PropertyType String -Force | Out-Null
        } catch {}
    }
    Write-Host '      [OK] Adobe CEP Developer Mode unlocked.' -ForegroundColor Green
}

Write-Host '[4/5] Installing CEP Extension into Adobe directory...' -ForegroundColor Cyan
if (-not (Test-Path -LiteralPath $cepExtensionsDir)) {
    New-Item -ItemType Directory -Path $cepExtensionsDir -Force | Out-Null
}

# Install as NovaCutBridgeCEP
if (-not (Test-Path -LiteralPath $cepTargetDir)) {
    New-Item -ItemType Directory -Path $cepTargetDir -Force | Out-Null
}
Copy-Item -Path (Join-Path $repoRoot 'cep-plugin\*') -Destination $cepTargetDir -Recurse -Force
Write-Host "      [OK] Installed to: $cepTargetDir" -ForegroundColor Green

# Also install/link to legacy folder for backward compatibility
if (-not (Test-Path -LiteralPath $cepLegacyDir)) {
    New-Item -ItemType Directory -Path $cepLegacyDir -Force | Out-Null
}
Copy-Item -Path (Join-Path $repoRoot 'cep-plugin\*') -Destination $cepLegacyDir -Recurse -Force

Write-Host "[5/5] Configuring AI Clients (Claude, Cursor, Windsurf, VS Code)..." -ForegroundColor Cyan
if (-not (Test-Path -LiteralPath $TempDir)) {
    New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
}

# Claude Desktop
Update-JsonWithNode -ConfigPath $ClaudeConfigPath -Mode 'claude'
Write-Host '      [OK] Claude Desktop config updated.' -ForegroundColor Green

# VS Code Copilot
Update-JsonWithNode -ConfigPath $VsCodeConfigPath -Mode 'copilot'
Write-Host '      [OK] VS Code Copilot config updated.' -ForegroundColor Green

# Cursor
Update-JsonWithNode -ConfigPath $CursorConfigPath -Mode 'cursor'
Write-Host '      [OK] Cursor config updated.' -ForegroundColor Green

# Windsurf
Update-JsonWithNode -ConfigPath $WindsurfConfigPath -Mode 'windsurf'
Write-Host '      [OK] Windsurf config updated.' -ForegroundColor Green

Write-Host ''
Write-Host '========================================================================' -ForegroundColor Green
Write-Host '  🎉 Installation Complete! / نصب با موفقیت انجام شد!' -ForegroundColor Green
Write-Host '========================================================================' -ForegroundColor Green
Write-Host ''
Write-Host '  Next steps / مراحل بعدی:' -ForegroundColor White
Write-Host '  1. Open/Restart Adobe Premiere Pro.' -ForegroundColor Yellow
Write-Host '  2. In Premiere Pro, open: Window > Extensions > NovaCut AI Studio' -ForegroundColor Cyan
Write-Host '     (در پریمیر منوی Window > Extensions > NovaCut AI Studio را باز کنید)' -ForegroundColor Gray
Write-Host '  3. The bridge starts automatically! (بریج به صورت خودکار متصل می‌شود)' -ForegroundColor Green
Write-Host '  4. Restart your AI client (ChatGPT, Claude, Cursor, Windsurf, Copilot).' -ForegroundColor Yellow
Write-Host ''
Write-Host "  Bridge Temp Directory: $TempDir" -ForegroundColor Gray
Write-Host ''
