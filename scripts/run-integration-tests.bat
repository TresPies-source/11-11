@echo off
REM Integration Testing Script for Supervisor Router
REM This script starts the dev server and runs integration tests

echo ====================================
echo Supervisor Router Integration Tests
echo ====================================
echo.

echo Starting dev server...
start /B npm run dev > dev-server.log 2>&1
set DEV_PID=%ERRORLEVEL%

echo Waiting for dev server to start (10 seconds)...
timeout /t 10 /nobreak > nul

echo.
echo Running manual integration tests...
echo.

npx tsx scripts/test-routing-manual.ts

set TEST_EXIT_CODE=%ERRORLEVEL%

echo.
echo Stopping dev server...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq npm*" > nul 2>&1

if %TEST_EXIT_CODE% EQU 0 (
  echo.
  echo ====================================
  echo All tests passed!
  echo ====================================
  exit /b 0
) else (
  echo.
  echo ====================================
  echo Some tests failed!
  echo ====================================
  exit /b 1
)
