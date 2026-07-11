@echo off
REM Launcher buat auto-git-pull.ps1
REM Bisa di-double-click langsung, atau dipanggil oleh Task Scheduler

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0auto-git-pull.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Ada error, cek auto-pull.log di folder repo untuk detail.
)
