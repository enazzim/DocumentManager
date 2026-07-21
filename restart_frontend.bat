@echo off
set "PROJECT_ROOT=%~dp0"

echo ========================================================
echo  [DMS Frontend] Terminating Port 5173/5174 and Restarting
echo ========================================================

for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r /c:":5173 .*LISTENING"') do (
    echo Stopping PID %%a on port 5173...
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r /c:":5174 .*LISTENING"') do (
    echo Stopping PID %%a on port 5174...
    taskkill /F /PID %%a >nul 2>&1
)

timeout /t 2 /nobreak >nul

echo Moving to dms-frontend directory...
cd /d "%PROJECT_ROOT%dms-frontend"
echo Current Working Directory: %CD%

echo Starting Vite Frontend Server...
call npm run dev -- --port 5173

pause
