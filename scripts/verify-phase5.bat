@echo off
echo ========================================
echo PHASE 5 FINAL VALIDATION
echo ========================================
echo.
echo [1/3] Running ESLint...
call npm run lint
echo.
echo [2/3] Running TypeScript type check...
call npm run type-check
echo.
echo [3/3] Running logger tests...
call npm run test:ai-gateway-logger
echo.
echo ========================================
echo VALIDATION COMPLETE
echo ========================================
