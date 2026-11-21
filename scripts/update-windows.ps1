<#
.SYNOPSIS
    NovaCut AI Studio — Automated 1-Click Updater for Windows.
    سیستم به‌روزرسانی خودکار استودیو هوشمند نوواکات برای ویندوز.
#>

[CmdletBinding()]
param(
    [switch] $Force = $false
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

if ($env:OS -ne 'Windows_NT') {
    throw 'This updater supports Windows only. On macOS/Linux use: git pull && npm run build && novacut setup'
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir

function Write-BilingualHeader {
    Write-Host "========================================================================" -ForegroundColor Magenta
    Write-Host "  🎬 NovaCut AI Studio — 1-Click Auto Updater (Windows)" -ForegroundColor Cyan
    Write-Host "  سیستم به‌روزرسانی خودکار استودیو نوواکات (نسخه اختصاصی)" -ForegroundColor Yellow
    Write-Host "========================================================================" -ForegroundColor Magenta
    Write-Host ""
}

function Write-Success([string]$msgFa, [string]$msgEn) {
    Write-Host "  [OK] $msgEn" -ForegroundColor Green
    Write-Host "       $msgFa" -ForegroundColor DarkGreen
}

function Write-Info([string]$msgFa, [string]$msgEn) {
    Write-Host "  [INFO] $msgEn" -ForegroundColor Cyan
    Write-Host "         $msgFa" -ForegroundColor DarkCyan
}

function Write-WarnMsg([string]$msgFa, [string]$msgEn) {
    Write-Host "  [WARN] $msgEn" -ForegroundColor Yellow
    Write-Host "         $msgFa" -ForegroundColor DarkYellow
}

function Write-ErrorMsg([string]$msgFa, [string]$msgEn) {
    Write-Host "  [ERROR] $msgEn" -ForegroundColor Red
    Write-Host "          $msgFa" -ForegroundColor DarkRed
}

Write-BilingualHeader

Set-Location -LiteralPath $repoRoot

# 1. Check Git
Write-Info "بررسی اتصال به مخزن گیت‌هاب..." "Checking Git environment & repository..."
$gitCmd = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitCmd) {
    Write-ErrorMsg "نرم‌افزار Git بر روی سیستم یافت نشد. لطفاً Git را نصب کنید." "Git is not installed or not in PATH."
    exit 1
}

# 2. Fetch remote changes
Write-Info "دریافت آخرین اطلاعات از GitHub..." "Fetching latest commits from GitHub..."
try {
    git fetch origin main 2>&1 | Out-Null
    $localCommit = (git rev-parse HEAD).Trim()
    $remoteCommit = (git rev-parse origin/main).Trim()

    if ($localCommit -eq $remoteCommit -and -not $Force) {
        Write-Success "سیستم شما در حال حاضر به آخرین نسخه موجود در گیت‌هاب به‌روز است." "Your installation is already up to date with origin/main."
        Write-Info "هش کامیت فعلی: $localCommit" "Current commit: $localCommit"
    } else {
        Write-Info "نسخه جدیدتری در گیت‌هاب یافت شد. در حال بارگیری و ادغام تغییرات..." "New changes detected on GitHub. Pulling latest updates..."
        git pull origin main
        Write-Success "تغییرات با موفقیت دریافت شدند." "Successfully pulled latest changes."
    }
} catch {
    Write-WarnMsg "امکان اتصال مستقیم به گیت‌هاب وجود نداشت یا شاخه محلی دارای تغییرات ثبت‌نشده است." "Could not fetch from origin. Continuing with local sync."
}

# 3. Check and update dependencies if package.json was modified
Write-Info "بررسی پکیج‌ها و وابستگی‌ها..." "Checking npm dependencies..."
try {
    npm install --no-audit --no-fund --prefer-offline 2>&1 | Out-Null
    Write-Success "وابستگی‌های برنامه تأیید شدند." "Dependencies are in sync."
} catch {
    Write-WarnMsg "هشدار در هنگام بررسی وابستگی‌ها." "Warning during npm install."
}

# 4. Build TypeScript Server
Write-Info "کامپایل مجدد پروژه با تغییرات جدید..." "Rebuilding NovaCut MCP TypeScript server..."
try {
    npm run build
    Write-Success "سرور MCP با موفقیت بیلد شد." "TypeScript build succeeded (dist/index.js)."
} catch {
    Write-ErrorMsg "خطا در هنگام بیلد پروژه." "Build failed. Please check error log."
    exit 1
}

# 5. Sync updated CEP extension files to Adobe APPDATA
Write-Info "همگام‌سازی اکستنشن پریمیر پرو در پوشه ادوبی..." "Syncing updated CEP extension files to Adobe CEP folder..."

$cepNovaCutDir = Join-Path $env:APPDATA 'Adobe\CEP\extensions\NovaCutBridgeCEP'
$cepLegacyDir = Join-Path $env:APPDATA 'Adobe\CEP\extensions\MCPBridgeCEP'
$cepSourceDir = Join-Path $repoRoot 'cep-plugin'

if (Test-Path -LiteralPath $cepSourceDir) {
    if (-not (Test-Path -LiteralPath $cepNovaCutDir)) {
        New-Item -ItemType Directory -Path $cepNovaCutDir -Force | Out-Null
    }
    Copy-Item -Path "$cepSourceDir\*" -Destination $cepNovaCutDir -Recurse -Force
    Write-Success "اکستنشن NovaCutBridgeCEP به‌روز شد." "NovaCutBridgeCEP extension updated."

    # Also keep legacy folder synced for backward compatibility
    if (-not (Test-Path -LiteralPath $cepLegacyDir)) {
        New-Item -ItemType Directory -Path $cepLegacyDir -Force | Out-Null
    }
    Copy-Item -Path "$cepSourceDir\*" -Destination $cepLegacyDir -Recurse -Force
    Write-Success "اکستنشن قدیمی MCPBridgeCEP نیز همگام‌سازی شد." "Legacy MCPBridgeCEP synced."
} else {
    Write-ErrorMsg "پوشه cep-plugin یافت نشد." "Source directory cep-plugin not found."
    exit 1
}

# 6. Re-verify PlayerDebugMode in Windows Registry
Write-Info "بررسی کلیدهای رجیستری PlayerDebugMode..." "Verifying Adobe CEP PlayerDebugMode registry keys..."
$csxsHives = @(
    "HKCU:\Software\Adobe\CSXS.9",
    "HKCU:\Software\Adobe\CSXS.10",
    "HKCU:\Software\Adobe\CSXS.11",
    "HKCU:\Software\Adobe\CSXS.12",
    "HKCU:\Software\Adobe\CSXS.13",
    "HKCU:\Software\Adobe\CSXS.14",
    "HKCU:\Software\Adobe\CSXS.15",
    "HKCU:\Software\Adobe\CSXS.16",
    "HKCU:\Software\Adobe\CSXS.17",
    "HKCU:\Software\Adobe\CSXS.18",
    "HKCU:\Software\Adobe\CSXS.19",
    "HKCU:\Software\Adobe\CSXS.20",
    "HKCU:\Software\Adobe\CSXS.21",
    "HKCU:\Software\Adobe\CSXS.22"
)

foreach ($hive in $csxsHives) {
    if (-not (Test-Path $hive)) {
        New-Item -Path $hive -Force | Out-Null
    }
    Set-ItemProperty -Path $hive -Name "PlayerDebugMode" -Value "1" -Force
}
Write-Success "تنظیمات رجیستری برای نسخه‌های ادوبی پریمیر ۲۰۲۰ تا ۲۰۲۶+ تأیید شد." "PlayerDebugMode verified across all CSXS versions."

# 7. Run Health Check
Write-Host ""
Write-Info "اجرای تست‌های سلامت سیستم پس از به‌روزرسانی..." "Running system diagnostics..."
node (Join-Path $repoRoot 'dist\cli.js') --doctor

Write-Host ""
Write-Host "========================================================================" -ForegroundColor Magenta
Write-Host "  🎉 UPDATE COMPLETE! NovaCut AI Studio is fully up to date." -ForegroundColor Green
Write-Host "  عملیات به‌روزرسانی با موفقیت به پایان رسید! اکنون می‌توانید از پریمیر استفاده کنید." -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Magenta
Write-Host ""