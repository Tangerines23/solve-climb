@echo off
chcp 65001 >nul
echo ========================================
echo   Solve Climb 배포 자동화 스크립트
echo ========================================
echo.

echo [1/2] Granite 빌드 시작...
call npx granite build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ 빌드 실패!
    pause
    exit /b 1
)

echo.
echo ✅ 빌드 완료!
echo.

echo [2/2] 배포 시작...
call npx ait deploy

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ 배포 실패!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ 배포 완료!
echo ========================================
echo.
pause

