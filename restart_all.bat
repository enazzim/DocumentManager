@echo off
set "PROJECT_ROOT=%~dp0"

echo ========================================================
echo  [DMS System] Restarting Backend and Frontend
echo ========================================================

start "DMS Backend Server (8080)" cmd /c "%PROJECT_ROOT%restart_backend.bat"
start "DMS Frontend Server (5173)" cmd /c "%PROJECT_ROOT%restart_frontend.bat"

echo Backend and Frontend windows launched successfully!
