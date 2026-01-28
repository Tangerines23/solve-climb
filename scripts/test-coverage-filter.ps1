# 테스트 커버리지 실행 및 필터링 스크립트
# Select-String이 입력 스트림을 기다리며 멈추는 문제 해결

param(
    [string]$Pattern = "solve-climb/src/components|Statements|Branches|Functions|Lines",
    [int]$First = 20
)

# 스크립트 파일이 있는 디렉토리로 이동
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location "$scriptDir/.."

$outputFile = "reports/test_output_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"

Write-Host "`n=== 테스트 실행 중... ===" -ForegroundColor Yellow
Write-Host "출력 파일: $outputFile" -ForegroundColor Cyan

# 테스트 실행 및 출력을 파일로 저장
npm run test:coverage:components 2>&1 | Tee-Object -FilePath $outputFile

Write-Host "`n=== 커버리지 리포트 요약 ===" -ForegroundColor Yellow

# 파일 내용 읽기
$content = Get-Content $outputFile -Raw
$lines = $content -split "`n"

# 커버리지 리포트 테이블만 추출
$inTable = $false
$tableLines = @()

foreach ($line in $lines) {
    # 테이블 시작
    if ($line -match "% Coverage report") {
        $inTable = $true
        continue
    }
    
    # 테이블 내부
    if ($inTable) {
        # 헤더 라인
        if ($line -match "^-+\|") {
            $tableLines += $line
            continue
        }
        
        # 데이터 라인 (components 또는 pages 포함)
        if ($line -match "solve-climb/src/(components|pages)" -and $line -match "\|") {
            $tableLines += $line
            continue
        }
        
        # 섹션 헤더 (All files, ...src/components, ...limb/src/pages)
        if ($line -match "^(All files|\.\.\.src/components|\.\.\.limb/src/pages)") {
            $tableLines += $line
            continue
        }
        
        # 테이블 종료 (ERROR 메시지 전까지)
        if ($line -match "^ERROR:" -or $line -match "^Test Files") {
            break
        }
    }
}

# 결과 표시
if ($tableLines.Count -gt 0) {
    Write-Host "`n[커버리지 요약]:" -ForegroundColor Cyan
    $tableLines | ForEach-Object { Write-Host $_ }
    
    # 에러 메시지도 표시
    $errorLines = $lines | Select-String -Pattern "^ERROR:" | Select-Object -First 4
    if ($errorLines) {
        Write-Host "`n[에러]:" -ForegroundColor Red
        $errorLines | ForEach-Object { Write-Host $_ -ForegroundColor Red }
    }
}
else {
    Write-Host "커버리지 리포트를 찾을 수 없습니다." -ForegroundColor Yellow
    Write-Host "전체 출력에서 검색 중..." -ForegroundColor Gray
    $filtered = $lines | Select-String -Pattern $Pattern | Select-Object -First $First
    if ($filtered) {
        $filtered | ForEach-Object { Write-Host $_ }
    }
}

Write-Host "`n출력 파일: $outputFile" -ForegroundColor Gray
Write-Host "전체 결과를 보려면: Get-Content $outputFile" -ForegroundColor Gray

# 원래 디렉토리로 복귀
Pop-Location

