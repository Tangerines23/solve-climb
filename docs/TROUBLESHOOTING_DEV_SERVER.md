# 개발 서버 문제 해결 가이드

`npm run dev`가 실행되지 않을 때 해결 방법을 안내합니다.

---

## 🚨 문제: 포트가 이미 사용 중 (EADDRINUSE)

### 증상

```
Error: listen EADDRINUSE: address already in use 0.0.0.0:8081
```

### 원인

다른 프로세스가 이미 해당 포트를 사용하고 있습니다.

---

## ✅ 해결 방법

### 방법 1: 포트를 사용하는 프로세스 종료 (권장)

#### Windows

```powershell
# 1. 포트를 사용하는 프로세스 찾기
netstat -ano | findstr :8081

# 2. 출력 예시:
# TCP    0.0.0.0:8081           0.0.0.0:0              LISTENING       13280
#                                                                    ↑ PID

# 3. 프로세스 종료
taskkill /PID 13280 /F
```

#### Mac/Linux

```bash
# 1. 포트를 사용하는 프로세스 찾기
lsof -i :8081

# 2. 프로세스 종료
kill -9 <PID>
```

### 방법 2: 다른 포트 사용

환경 변수로 다른 포트 지정:

```bash
# Windows (PowerShell)
$env:DEV_PORT=5174; npm run dev

# Windows (CMD)
set DEV_PORT=5174 && npm run dev

# Mac/Linux
DEV_PORT=5174 npm run dev
```

또는 `.env` 파일에 추가:

```env
DEV_PORT=5174
```

### 방법 3: 포트 변경 (영구적)

`granite.config.ts` 파일 수정:

```typescript
web: {
  host: process.env.DEV_HOST || 'localhost',
  port: parseInt(process.env.DEV_PORT || '5174', 10), // 5173 → 5174로 변경
  // ...
}
```

---

## 🔍 다른 일반적인 문제

### 문제 1: 모듈을 찾을 수 없음

```
Error: Cannot find module 'xxx'
```

**해결**:
```bash
npm install
```

### 문제 2: 권한 오류

```
Error: EACCES: permission denied
```

**해결**:
- 관리자 권한으로 실행
- 또는 다른 포트 사용

### 문제 3: 메모리 부족

```
JavaScript heap out of memory
```

**해결**:
```bash
# Node.js 메모리 증가
set NODE_OPTIONS=--max-old-space-size=4096
npm run dev
```

---

## 📋 체크리스트

- [ ] 포트를 사용하는 프로세스 확인
- [ ] 프로세스 종료 또는 다른 포트 사용
- [ ] `npm install` 실행 (의존성 설치)
- [ ] `.env` 파일 확인
- [ ] 개발 서버 재시작

---

## 💡 예방 방법

### 개발 서버 종료 시

항상 `Ctrl + C`로 정상 종료하세요.

### 포트 확인

서버 시작 전에 포트 사용 여부 확인:

```bash
# Windows
netstat -ano | findstr :5173

# Mac/Linux
lsof -i :5173
```

---

## 📚 참고

- `granite.config.ts` - Granite 설정 파일
- `vite.config.js` - Vite 설정 파일
- `package.json` - npm 스크립트 정의

