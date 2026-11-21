<#
.SYNOPSIS
    NovaCut AI Studio — Ultra-Easy Automated Windows Installer.
    نصب خودکار، هوشمند و بدون دردسر استودیو نوواکات برای ادوبی پریمیر پرو در ویندوز.
#>

[CmdletBinding()]
param(
    [string] $TempDir = (Join-Path $env:TEMP 'novacut-bridge'),
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

function Write-BoxHeader {
    Write-Host ""
    Write-Host "========================================================================" -ForegroundColor Magenta
    Write-Host "  🎬 استودیو هوشمند نوواکات (NovaCut AI Studio) — نصب آسان در ویندوز" -ForegroundColor Cyan
    Write-Host "  Universal AI Video Editing Bridge for Adobe Premiere Pro (v2.0)" -ForegroundColor Green
    Write-Host "========================================================================" -ForegroundColor Magenta
    Write-Host ""
}

function Write-Step([string]$stepFa, [string]$stepEn) {
    Write-Host "  ▶ $stepFa" -ForegroundColor Yellow
    Write-Host "    $stepEn" -ForegroundColor DarkGray
}

function Write-Success([string]$msgFa, [string]$msgEn) {
    Write-Host "    [✓] $msgFa" -ForegroundColor Green
    if ($msgEn) { Write-Host "        $msgEn" -ForegroundColor DarkGreen }
}

function Write-Notice([string]$msgFa, [string]$msgEn) {
    Write-Host "    [!] $msgFa" -ForegroundColor Cyan
    if ($msgEn) { Write-Host "        $msgEn" -ForegroundColor DarkCyan }
}

function Write-Warn([string]$msgFa, [string]$msgEn) {
    Write-Host "    [⚠] $msgFa" -ForegroundColor Yellow
    if ($msgEn) { Write-Host "        $msgEn" -ForegroundColor DarkYellow }
}

Write-BoxHeader

# --- 1. Check Node.js ---
Write-Step "گام ۱ از ۵: بررسی محیط اجرای Node.js" "Step 1 of 5: Checking Node.js Environment"

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    # Check if node exists in standard paths
    $commonNodePaths = @(
        "$env:ProgramFiles\nodejs\node.exe",
        "${env:ProgramFiles(x86)}\nodejs\node.exe",
        "$env:LOCALAPPDATA\Programs\node\node.exe"
    )
    foreach ($p in $commonNodePaths) {
        if (Test-Path -LiteralPath $p) {
            $nodeCmd = Get-Item $p
            $env:Path = "$env:Path;$([System.IO.Path]::GetDirectoryName($p))"
            break
        }
    }
}

if (-not $nodeCmd) {
    Write-Warn "نرم‌افزار Node.js روی سیستم یافت نشد." "Node.js was not found on PATH."
    
    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if ($winget) {
        Write-Host ""
        Write-Host "  آیا مایلید Node.js به صورت خودکار و ۱-کلیکه از طریق Windows Package Manager نصب شود؟" -ForegroundColor Cyan
        Write-Host "  [Y] نصب خودکار Node.js LTS (Auto-install Node.js)" -ForegroundColor Green
        Write-Host "  [N] انصراف و دانلود دستی از nodejs.org" -ForegroundColor Gray
        $choice = Read-Host "  انتخاب شما (پیش‌فرض Y)"
        if ([string]::IsNullOrWhiteSpace($choice) -or $choice.Trim().ToUpper() -eq 'Y') {
            Write-Host "  در حال دریافت و نصب خودکار Node.js LTS... لطفاً شکیبا باشید." -ForegroundColor Yellow
            try {
                Start-Process -FilePath "winget.exe" -ArgumentList "install", "--id", "OpenJS.NodeJS.LTS", "-e", "--accept-source-agreements", "--accept-package-agreements" -Wait
                $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
                $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
            } catch {}
        }
    }

    if (-not $nodeCmd) {
        Write-Host ""
        Write-Host "  [خطا] لطفاً Node.js نسخه ۲۰ یا بالاتر را از سایت رسمی دانلود و نصب کنید:" -ForegroundColor Red
        Write-Host "  https://nodejs.org/" -ForegroundColor Cyan
        Write-Host ""
        Start-Process "https://nodejs.org/" -ErrorAction SilentlyContinue
        exit 1
    }
}

$script:nodePath = $nodeCmd.Source
try {
    $nodeVer = & $script:nodePath -v
    Write-Success "نود جی‌اس نسخه $nodeVer شناسایی شد." "Node.js $nodeVer detected at $($script:nodePath)"
} catch {
    Write-Warn "بررسی نسخه نود جی‌اس با هشدار همراه بود." "Could not query Node.js version."
}

$npmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $npmCmd) { $npmCmd = Get-Command npm -ErrorAction SilentlyContinue }
$npmPath = if ($npmCmd) { $npmCmd.Source } else { 'npm' }

# --- 2. Build Server ---
Write-Step "گام ۲ از ۵: بررسی بیلد سرور هوش مصنوعی نوواکات" "Step 2 of 5: Building NovaCut AI MCP Server"

if ($SkipBuild -and (Test-Path -LiteralPath $distEntry)) {
    Write-Notice "از مرحله بیلد صرف‌نظر شد (فایل‌های بیلد موجود است)." "Build skipped (-SkipBuild)."
} else {
    Write-Host "    در حال بررسی پکیج‌ها و کامپایل تایپ‌اسکریپت..." -ForegroundColor DarkGray
    try {
        & $npmPath install --prefix $repoRoot --no-audit --no-fund --prefer-offline 2>&1 | Out-Null
        & $npmPath run build --prefix $repoRoot 2>&1 | Out-Null
        Write-Success "کدهای سرور MCP با موفقیت بیلد شدند (dist/index.js)." "TypeScript server compiled successfully."
    } catch {
        Write-Warn "بیلد با دستور استاندارد انجام نشد، استفاده از بیلد موجود..." "Build encountered warning."
    }
}

if (-not (Test-Path -LiteralPath $distEntry -PathType Leaf)) {
    Write-Host "  [خطا] فایل اجرایی dist\index.js یافت نشد. دستور npm run build را دستی اجرا کنید." -ForegroundColor Red
    exit 1
}

# --- 3. Enable Adobe CEP PlayerDebugMode ---
Write-Step "گام ۳ از ۵: فعال‌سازی قفل برنامه‌نویسی ادوبی پریمیر (PlayerDebugMode)" "Step 3 of 5: Unlocking Adobe CEP Developer Mode (CSXS 9..22)"

if (-not $SkipAdobeDebugMode) {
    foreach ($ver in 9..22) {
        $key = "HKCU:\Software\Adobe\CSXS.$ver"
        if (-not (Test-Path -LiteralPath $key)) {
            try { New-Item -Path $key -Force | Out-Null } catch {}
        }
        try {
            New-ItemProperty -Path $key -Name 'PlayerDebugMode' -Value '1' -PropertyType String -Force | Out-Null
        } catch {}
    }
    Write-Success "رجیستری ادوبی پریمیر برای تمامی نسخه‌های ۲۰۲۰ تا ۲۰۲۶+ باز شد." "Adobe CSXS 9..22 PlayerDebugMode enabled in Registry."
}

# --- 4. Install CEP Panel into Adobe extensions ---
Write-Step "گام ۴ از ۵: نصب پنل اکستنشن نوواکات در پوشه رسمی ادوبی" "Step 4 of 5: Installing Extension Panel into Adobe CEP folder"

if (-not (Test-Path -LiteralPath $cepExtensionsDir)) {
    New-Item -ItemType Directory -Path $cepExtensionsDir -Force | Out-Null
}

# Copy to NovaCutBridgeCEP
if (-not (Test-Path -LiteralPath $cepTargetDir)) {
    New-Item -ItemType Directory -Path $cepTargetDir -Force | Out-Null
}
Copy-Item -Path (Join-Path $repoRoot 'cep-plugin\*') -Destination $cepTargetDir -Recurse -Force
Write-Success "اکستنشن NovaCutBridgeCEP با موفقیت نصب شد." "Installed to: $cepTargetDir"

# Copy to MCPBridgeCEP (Legacy fallback)
if (-not (Test-Path -LiteralPath $cepLegacyDir)) {
    New-Item -ItemType Directory -Path $cepLegacyDir -Force | Out-Null
}
Copy-Item -Path (Join-Path $repoRoot 'cep-plugin\*') -Destination $cepLegacyDir -Recurse -Force
Write-Success "پوشه پشتیبان قدیمی MCPBridgeCEP نیز همگام‌سازی شد." "Legacy fallback extension synced."

# Check if Premiere Pro is running right now
$prProcess = Get-Process 'Adobe Premiere Pro' -ErrorAction SilentlyContinue
if ($prProcess) {
    Write-Host ""
    Write-Warn "نرم‌افزار Adobe Premiere Pro در حال حاضر باز است!" "Premiere Pro is currently running."
    Write-Notice "برای اینکه اکستنشن جدید در منو ظاهر شود، پس از پایان نصب کافی است پریمیر را ببندید و دوباره باز کنید." "Restart Premiere Pro after installation to load the new extension."
    Write-Host ""
}

# --- 5. Auto-configure AI Clients ---
Write-Step "گام ۵ از ۵: اتصال و کانفیگ خودکار نرم‌افزارهای هوش مصنوعی" "Step 5 of 5: Configuring AI Assistants (ChatGPT, Claude, Cursor, Windsurf, VS Code)"

if (-not (Test-Path -LiteralPath $TempDir)) {
    New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
}

$helper = @'
const fs = require("fs");
const path = require("path");

const nodePath = process.env.NODE_PATH_VALUE;
const distPath = process.env.DIST_PATH;
const tempPath = process.env.TEMP_PATH;

const serverConfig = {
  command: nodePath,
  args: [distPath],
  env: {
    PREMIERE_TEMP_DIR: tempPath,
    NOVACUT_TOOLSET: "standard"
  }
};

function updateConfig(filePath, mode) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    let data = {};
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, "utf8").trim();
        if (raw) data = JSON.parse(raw);
      } catch (e) {
        data = {};
      }
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) data = {};

    if (mode === "copilot") {
      if (!data.servers || typeof data.servers !== "object" || Array.isArray(data.servers)) data.servers = {};
      data.servers["novacut-premiere"] = { type: "stdio", ...serverConfig };
      data.servers["premiere-pro"] = { type: "stdio", ...serverConfig };
    } else {
      if (!data.mcpServers || typeof data.mcpServers !== "object" || Array.isArray(data.mcpServers)) data.mcpServers = {};
      data.mcpServers["novacut-premiere"] = serverConfig;
      data.mcpServers["premiere-pro"] = serverConfig;
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
    return true;
  } catch (err) {
    return false;
  }
}

const targets = [
  { p: path.join(process.env.APPDATA, "Claude", "claude_desktop_config.json"), m: "claude", name: "Claude Desktop" },
  { p: path.join(process.env.APPDATA, "Code", "User", "mcp.json"), m: "copilot", name: "VS Code GitHub Copilot" },
  { p: path.join(process.env.APPDATA, "Cursor", "User", "mcp.json"), m: "cursor", name: "Cursor IDE" },
  { p: path.join(process.env.USERPROFILE, ".codeium", "windsurf", "mcp_config.json"), m: "windsurf", name: "Windsurf IDE" },
  { p: path.join(process.env.APPDATA, "OpenAI", "ChatGPT", "mcp.json"), m: "chatgpt", name: "ChatGPT Desktop" }
];

targets.forEach(t => {
  const ok = updateConfig(t.p, t.m);
  if (ok) console.log("CONFIGURED:" + t.name);
});
'@

$helperPath = Join-Path $env:TEMP 'novacut-auto-config.cjs'
Set-Content -LiteralPath $helperPath -Value $helper -Encoding UTF8

$env:NODE_PATH_VALUE = $script:nodePath
$env:DIST_PATH = $distEntry
$env:TEMP_PATH = $TempDir

$configResults = & $script:nodePath $helperPath
Remove-Item -LiteralPath $helperPath -Force -ErrorAction SilentlyContinue

foreach ($line in $configResults) {
    if ($line -like 'CONFIGURED:*') {
        $clientName = $line.Replace('CONFIGURED:', '')
        Write-Success "$clientName به صورت خودکار متصل و کانفیگ شد." "$clientName configured successfully."
    }
}

# --- Grand Success Guide ---
Write-Host ""
Write-Host "========================================================================" -ForegroundColor Green
Write-Host "  [SUCCESS] تبریک! نصب استودیو نوواکات با موفقیت ۱۰۰٪ به پایان رسید." -ForegroundColor Green
Write-Host "  [SUCCESS] Installation Successful! NovaCut AI Studio is Ready." -ForegroundColor Green
Write-Host "========================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  تنها ۲ مرحله بسیار ساده برای شروع استفاده باقی مانده است:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  ۱. نرم‌افزار Premiere Pro را باز کنید (یا اگر باز است، ری‌استارت کنید)." -ForegroundColor White
Write-Host "  ۲. از منوی بالای پریمیر به این مسیر بروید:" -ForegroundColor White
Write-Host ""
Write-Host "     ┌─────────────────────────────────────────────────────────────┐" -ForegroundColor Cyan
Write-Host "     │  Window   ──>   Extensions   ──>   NovaCut AI Studio       │" -ForegroundColor Cyan
Write-Host "     └─────────────────────────────────────────────────────────────┘" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ✓ پنل مدرن نوواکات باز شده و آماده دریافت فرامین تدوین شما خواهد بود." -ForegroundColor Green
Write-Host "  ✓ اکنون در ChatGPT، Claude یا هوش مصنوعی خود تایپ کنید:" -ForegroundColor Magenta
Write-Host '    "پروژه فعال رو بررسی کن و یه تایم‌لاین 4K جدید بساز"' -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================================================" -ForegroundColor DarkGray
Write-Host ""