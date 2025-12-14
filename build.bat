@echo off
chcp 65001 >nul
echo ========================================
echo   Solve Climb 빌드 스크립트
echo ========================================
echo.

echo Granite 빌드 시작...
call npx granite build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ 빌드 실패!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ 빌드 완료!
echo   .ait 파일이 생성되었습니다.
echo ========================================
echo.
pause

