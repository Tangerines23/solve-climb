@echo off
REM UTF-8 인코딩으로 설정
chcp 65001 > nul
setlocal enabledelayedexpansion

REM --- (0) 실제 파일이 있는 폴더 (스크립트 실행 위치 기준) ---
set "FRONTEND_DIR=frontend"

REM --- (1) 출력 파일 이름을 지정하세요 ---
set "OUTPUT_FILE=project_context.md"

REM --- (2) 여기에 'frontend' 폴더 내부의 파일 목록을 수정하세요 ---
set "REQUIRED_FILES="
set "REQUIRED_FILES=%REQUIRED_FILES% src/pages/MathQuizPage.tsx"
set "REQUIRED_FILES=%REQUIRED_FILES% src/pages/MathQuizPage.css"
set "REQUIRED_FILES=%REQUIRED_FILES% src/components/Timer.tsx"
set "REQUIRED_FILES=%REQUIRED_FILES% src/components/ModeSelector.tsx"
set "REQUIRED_FILES=%REQUIRED_FILES% src/components/LevelUnlock.tsx"
set "REQUIRED_FILES=%REQUIRED_FILES% src/main.tsx"

set "OPTIONAL_FILES="
set "OPTIONAL_FILES=%OPTIONAL_FILES% src/App.tsx"
set "OPTIONAL_FILES=%OPTIONAL_FILES% src/pages/ResultPage.tsx"
set "OPTIONAL_FILES=%OPTIONAL_FILES% src/styles/global.css"
set "OPTIONAL_FILES=%OPTIONAL_FILES% src/context/GameContext.tsx"
set "OPTIONAL_FILES=%OPTIONAL_FILES% vite.config.ts"
set "OPTIONAL_FILES=%OPTIONAL_FILES% tsconfig.json"
set "OPTIONAL_FILES=%OPTIONAL_FILES% tsconfig.node.json"
REM --- 파일 목록 수정 끝 ---


echo %OUTPUT_FILE% 파일을 생성/덮어쓰기 합니다...
echo.

REM [수정됨] 1. 파일 덮어쓰기 (첫 번째 echo만 > 사용)
(echo # 🎯 AI 컨텍스트: 프로젝트 파일) > %OUTPUT_FILE%
REM [수정됨] 2. 이후 모든 echo는 >> (덧붙이기) 사용
(echo.) >> %OUTPUT_FILE%
(echo ---) >> %OUTPUT_FILE%
(echo ## 필수 파일) >> %OUTPUT_FILE%
(echo.) >> %OUTPUT_FILE%

REM '필수' 목록 처리
for %%F in (%REQUIRED_FILES%) do (
    set "FILE_EXT=%%~xF"
    set "LANG=!FILE_EXT:~1!"
    set "FULL_PATH=%FRONTEND_DIR%\%%F"
    set "FULL_PATH=!FULL_PATH:/=\!"

    (echo ### `%%F`) >> %OUTPUT_FILE%
    (echo.) >> %OUTPUT_FILE%
    (echo ```!LANG!) >> %OUTPUT_FILE%
    
    REM [수정됨] 3. 'type' 명령의 결과를 직접 파일에 덧붙입니다.
    if exist "!FULL_PATH!" (
        type "!FULL_PATH!" >> %OUTPUT_FILE%
        REM 파일 끝에 개행 문자가 없어도 ```가 새 줄에 오도록
        (echo.) >> %OUTPUT_FILE%
    ) else (
        (echo [오류] '!FULL_PATH!' 파일을 찾을 수 없습니다.) >> %OUTPUT_FILE%
    )
    
    (echo ```) >> %OUTPUT_FILE%
    (echo.) >> %OUTPUT_FILE%
)

(echo.) >> %OUTPUT_FILE%
(echo ---) >> %OUTPUT_FILE%
(echo ## 추가 파일) >> %OUTPUT_FILE%
(echo.) >> %OUTPUT_FILE%

REM '추가' 목록 처리
for %%F in (%OPTIONAL_FILES%) do (
    set "FILE_EXT=%%~xF"
    set "LANG=!FILE_EXT:~1!"
    set "FULL_PATH=%FRONTEND_DIR%\%%F"
    set "FULL_PATH=!FULL_PATH:/=\!"

    (echo ### `%%F`) >> %OUTPUT_FILE%
    (echo.) >> %OUTPUT_FILE%
    (echo ```!LANG!) >> %OUTPUT_FILE%
    
    if exist "!FULL_PATH!" (
        type "!FULL_PATH!" >> %OUTPUT_FILE%
        (echo.) >> %OUTPUT_FILE%
    ) else (
        (echo [오류] '!FULL_PATH!' 파일을 찾을 수 없습니다.) >> %OUTPUT_FILE%
    )
    
    (echo ```) >> %OUTPUT_FILE%
    (echo.) >> %OUTPUT_FILE%
)

endlocal

echo.
echo ---------------------------------------------------
echo  ✅ %OUTPUT_FILE% 파일 생성이 완료되었습니다.
echo  (위치: %cd%\%OUTPUT_FILE%)
echo ---------------------------------------------------
echo.
pause