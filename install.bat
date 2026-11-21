@echo off
chcp 65001 >nul
title NovaCut AI Studio - 1-Click Installer
cls
echo ========================================================================
echo   🎬 NovaCut AI Studio - Universal Premiere Pro AI Bridge (v2.0)
echo   استودیو هوشمند نوواکات - نصب خودکار برای ادوبی پریمیر پرو
echo ========================================================================
echo.

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo [خطا] نود جی‌اس بر روی سیستم شما یافت نشد.
    echo Please install Node.js 20+ from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js is ready.
echo [INFO] Starting automated setup via PowerShell...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install-windows.ps1"

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================================
    echo   [SUCCESS] NovaCut AI Studio is ready to use!
    echo   نصب با موفقیت انجام شد. پریمیر پرو را باز کنید.
    echo ========================================================================
) else (
    echo.
    echo [ERROR] Installation encountered an issue. See log above.
)

echo.
pause
