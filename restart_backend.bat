@echo off
set "PROJECT_ROOT=%~dp0"

echo ========================================================
echo  [DMS Backend] Terminating Port 8080 and Restarting
echo ========================================================

for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r /c:":8080 .*LISTENING"') do (
    echo Stopping PID %%a on port 8080...
    taskkill /F /PID %%a >nul 2>&1
)

timeout /t 2 /nobreak >nul

echo Moving to dms-backend directory...
cd /d "%PROJECT_ROOT%dms-backend"
echo Current Working Directory: %CD%

echo Starting Spring Boot Backend via Gradle Wrapper (gradlew)...
if exist "gradlew.bat" (
    call gradlew.bat bootRun
) else (
    call gradle bootRun
)

pause
