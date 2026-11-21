@echo off
chcp 65001 >nul
title NovaCut AI Studio - 1-Click Fast Installer (نصب آسان نوواکات)

:: If GUI executable exists and user didn't pass /cli, launch the GUI installer
if "%1"=="" (
    if exist "%~dp0NovaCut-Setup.exe" (
        start "" "%~dp0NovaCut-Setup.exe"
        exit /b 0
    )
)

cls
echo ========================================================================
echo   🎬 NovaCut AI Studio — Universal Premiere Pro AI Bridge (v2.0)
echo   استودیو هوشمند نوواکات — نصب آسان و خودکار برای ادوبی پریمیر پرو
echo ========================================================================
echo.
echo   در حال آماده‌سازی و شروع فرآیند نصب خودکار...
echo   Starting automated installation wizard...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install-windows.ps1"

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Installation encountered an issue.
    echo [خطا] در مراحل نصب مشکلی پیش آمد. متن خطای بالا را مطالعه کنید.
    echo.
    pause
    exit /b %ERRORLEVEL%
)

:MENU
echo.
echo ------------------------------------------------------------------------
echo   عملیات بعدی را انتخاب کنید (Next Action):
echo ------------------------------------------------------------------------
echo   [1] 🩺 اجرای تست سلامت و عیب‌یابی (Run Doctor Diagnostics)
echo   [2] 📋 نمایش کدهای کانفیگ برای چت‌جی‌پی‌تی، جمینای، گروک و کلاد (Configs)
echo   [3] 📁 باز کردن پوشه اکستنشن‌های ادوبی در ویندوز (Open CEP Folder)
echo   [0] 🚪 خروج (Exit)
echo ------------------------------------------------------------------------
set /p ACTION="انتخاب شما [0-3] (پیش‌فرض 0): "

if "%ACTION%"=="1" (
    cls
    call "%~dp0doctor.bat"
    goto MENU
)
if "%ACTION%"=="2" (
    cls
    node "%~dp0dist\cli.js" config all
    echo.
    pause
    goto MENU
)
if "%ACTION%"=="3" (
    explorer "%APPDATA%\Adobe\CEP\extensions\NovaCutBridgeCEP"
    goto MENU
)

echo.
echo با تشکر از انتخاب NovaCut AI Studio! اکنون پریمیر پرو را باز کنید.
echo Good luck with your AI video editing!
timeout /t 3 >nul
exit /b 0