@echo off
setlocal

echo ================================================================
echo   Setup Auto Git Pull - Windows Task Scheduler
echo ================================================================
echo.
echo Script ini akan bikin scheduled task supaya run-auto-pull.bat
echo jalan sendiri secara berkala, tanpa perlu kamu buka manual.
echo.
echo PENTING: Pastikan kamu sudah edit auto-git-pull.ps1 dulu
echo (isi RepoPath dengan path folder project kamu yang benar).
echo.

set TASK_NAME=AutoGitPull-PoliteknikSSR
set SCRIPT_DIR=%~dp0

set /p INTERVAL="Masukkan interval pull dalam menit (contoh: 10): "

schtasks /Create /TN "%TASK_NAME%" /TR "\"%SCRIPT_DIR%run-auto-pull.bat\"" /SC MINUTE /MO %INTERVAL% /RL LIMITED /F

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Berhasil! Task "%TASK_NAME%" akan jalan otomatis tiap %INTERVAL% menit.
    echo.
    echo Cara cek / edit / hapus:
    echo   - Buka "Task Scheduler" ^(ketik taskschd.msc di Run^)
    echo   - Cari task bernama "%TASK_NAME%"
    echo.
    echo Cara hapus lewat command juga bisa:
    echo   schtasks /Delete /TN "%TASK_NAME%" /F
) else (
    echo.
    echo Gagal membuat scheduled task.
    echo Coba klik kanan file ini, lalu "Run as administrator".
)

echo.
pause
