@echo off
chcp 65001 >nul
title NovaCut AI Studio - 1-Click Auto Updater
cls

echo ========================================================================
echo   🎬 NovaCut AI Studio — Universal Premiere Pro AI Bridge (v2.0)
echo   استودیو هوشمند نوواکات — سیستم به‌روزرسانی خودکار ۱-کلیکه
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

:: Check Git
where git >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [WARN] Git is not found in PATH.
    echo [هشدار] نرم‌افزار Git یافت نشد؛ عملیات همگام‌سازی محلی ادامه می‌یابد.
)

echo [OK] Environment check passed.
echo [INFO] Starting NovaCut 1-Click Update process...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\update-windows.ps1"

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================================
    echo   [SUCCESS] NovaCut AI Studio has been successfully updated!
    echo   به‌روزرسانی با موفقیت به پایان رسید. پریمیر پرو آماده تدوین است.
    echo ========================================================================
) else (
    echo.
    echo [ERROR] Update process encountered an issue. See log above.
    echo [خطا] در فرآیند به‌روزرسانی مشکلی رخ داد. لاگ بالا را بررسی کنید.
)

echo.
pause