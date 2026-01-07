# Cursor SSL 인증서 문제 해결 스크립트
# 관리자 권한으로 실행 필요

Write-Host "`n=== Cursor SSL 인증서 문제 해결 ===" -ForegroundColor Yellow
Write-Host "`n문제: 호스트 파일로 인한 SSL 인증서 불일치" -ForegroundColor Red

# 관리자 권한 확인
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "`n❌ 관리자 권한이 필요합니다!" -ForegroundColor Red
    Write-Host "PowerShell을 관리자 권한으로 실행해주세요." -ForegroundColor Yellow
    exit
}

$hostsPath = "$env:WINDIR\System32\drivers\etc\hosts"

# 현재 호스트 파일 확인
Write-Host "`n현재 호스트 파일 내용:" -ForegroundColor Cyan
Get-Content $hostsPath | Select-String -Pattern "cursor" | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }

Write-Host "`n해결 방법 선택:" -ForegroundColor Yellow
Write-Host "1. 호스트 파일에서 api.cursor.sh 제거 (권장)" -ForegroundColor Green
Write-Host "2. api.cursor.com으로 변경" -ForegroundColor Yellow
Write-Host "3. 취소" -ForegroundColor Red

$choice = Read-Host "`n선택 (1-3)"

switch ($choice) {
    "1" {
        Write-Host "`n호스트 파일에서 api.cursor.sh 제거 중..." -ForegroundColor Cyan
        $content = Get-Content $hostsPath | Where-Object { $_ -notmatch "api\.cursor\.sh" }
        $content | Set-Content $hostsPath
        Write-Host "✅ 제거 완료" -ForegroundColor Green
    }
    "2" {
        Write-Host "`napi.cursor.com으로 변경 중..." -ForegroundColor Cyan
        # 기존 항목 제거
        $content = Get-Content $hostsPath | Where-Object { $_ -notmatch "api\.cursor" }
        $content | Set-Content $hostsPath
        # api.cursor.com 추가
        $newEntry = "3.223.196.161 api.cursor.com"
        Add-Content -Path $hostsPath -Value $newEntry -Force
        Write-Host "✅ 변경 완료: $newEntry" -ForegroundColor Green
    }
    "3" {
        Write-Host "취소되었습니다." -ForegroundColor Yellow
        exit
    }
    default {
        Write-Host "잘못된 선택입니다." -ForegroundColor Red
        exit
    }
}

# DNS 캐시 플러시
Write-Host "`nDNS 캐시 플러시 중..." -ForegroundColor Cyan
ipconfig /flushdns | Out-Null
Write-Host "✅ 완료" -ForegroundColor Green

# 확인
Write-Host "`n변경된 호스트 파일 내용:" -ForegroundColor Cyan
Get-Content $hostsPath | Select-String -Pattern "cursor" | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }

Write-Host "`n✅ 완료! Cursor를 재시작하세요." -ForegroundColor Green

