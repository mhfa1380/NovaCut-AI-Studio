@echo off
chcp 65001 >nul
title NovaCut AI Studio - Health Check and Diagnostics
cls
echo ========================================================================
echo   NovaCut AI Studio - Diagnostics and Health Check
echo   عیب‌یابی هوشمند وضعیت سیستم، پریمیر و هوش مصنوعی
echo ========================================================================
echo.

node "%~dp0dist\cli.js" doctor

echo.
pause
