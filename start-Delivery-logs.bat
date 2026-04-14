@echo off
setlocal

REM Run from this BAT file's folder so npm scripts resolve correctly
cd /d "%~dp0"

echo Starting Delivery Logs System (backend + frontend)...
call npm run start

if errorlevel 1 (
  echo.
  echo Failed to start. Make sure Node.js and dependencies are installed.
  pause
)
