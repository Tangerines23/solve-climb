# Select-String 멈춤 문제 해결 방법

## 문제
```powershell
npm run test:coverage:components 2>&1 | Select-String -Pattern "..." | Select-Object -First 20
```
이 명령어가 멈추는 이유: `Select-String`이 파이프로 연결되면 입력 스트림이 끝날 때까지 대기합니다.

## 해결 방법

### 방법 1: 파일로 저장 후 필터링 (가장 안정적)
```powershell
$f="out.txt"; npm run test:coverage:components 2>&1 | Tee-Object -FilePath $f; Get-Content $f | Select-String -Pattern "solve-climb/src/components|Statements|Branches|Functions|Lines" | Select-Object -First 20
```

**장점:**
- 가장 안정적
- 전체 출력도 파일에 저장되어 나중에 확인 가능
- 테스트가 완료된 후 필터링하므로 멈추지 않음

### 방법 2: Out-String 사용
```powershell
(npm run test:coverage:components 2>&1 | Out-String) | Select-String -Pattern "solve-climb/src/components|Statements|Branches|Functions|Lines" | Select-Object -First 20
```

**장점:**
- 한 줄로 해결
- 파일 생성 없음

**단점:**
- 모든 출력을 메모리에 저장하므로 큰 출력에는 부적합

### 방법 3: 백그라운드 Job 사용
```powershell
$job = Start-Job { Set-Location "C:\Users\ghkdd\gemini-projects\solve-climb"; npm run test:coverage:components 2>&1 }
Wait-Job $job
Receive-Job $job | Select-String -Pattern "solve-climb/src/components|Statements|Branches|Functions|Lines" | Select-Object -First 20
Remove-Job $job
```

**장점:**
- 백그라운드에서 실행
- 다른 작업 가능

**단점:**
- 복잡함
- 디렉토리 경로 지정 필요

## 권장 방법
**방법 1 (파일 저장 후 필터링)**을 권장합니다. 가장 안정적이고 실용적입니다.

## 사용 예시
```powershell
# 기본 사용
$f="test_out.txt"; npm run test:coverage:components 2>&1 | Tee-Object -FilePath $f; Get-Content $f | Select-String -Pattern "solve-climb/src/components|Statements|Branches|Functions|Lines" | Select-Object -First 20

# 커스텀 패턴
$f="test_out.txt"; npm run test:coverage:components 2>&1 | Tee-Object -FilePath $f; Get-Content $f | Select-String -Pattern "원하는패턴" | Select-Object -First 30
```

