# 로컬 개발 환경에서 토스 앱 테스트 가이드

토스 앱에 빌드를 업로드하지 않고도 로컬 개발 서버에서 바로 테스트할 수 있습니다.

## 🎯 목표

- 코드 수정 후 즉시 토스 앱에서 테스트
- 빌드/배포 없이 빠른 개발 사이클
- 실기기에서 실제 토스 SDK 동작 확인

## 📋 사전 준비

### 1. 토스 샌드박스 앱 설치

- **iOS**: App Store에서 "토스 샌드박스" 검색 후 설치
- **Android**: Play Store에서 "토스 샌드박스" 검색 후 설치

### 2. 개발 환경 확인

- 컴퓨터와 스마트폰이 **같은 Wi-Fi 네트워크**에 연결되어 있어야 합니다
- 방화벽이 로컬 네트워크 접근을 차단하지 않는지 확인

## 🚀 로컬 개발 서버 실행

### 1. 개발 서버 시작

터미널에서 프로젝트 루트에서 실행:

```bash
npm run dev
```

또는

```bash
yarn dev
```

서버가 시작되면 다음과 같은 메시지가 표시됩니다:

```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

**중요**: `Network` 주소를 복사해두세요! (예: `http://192.168.0.100:5173`)

### 2. 컴퓨터의 로컬 IP 주소 확인

#### Windows
```powershell
ipconfig
```
`IPv4 주소`를 찾으세요 (예: `192.168.0.100`)

#### macOS / Linux
```bash
ifconfig | grep "inet "
```
또는
```bash
ip addr show | grep "inet "
```

### 3. Supabase Edge Functions 로컬 실행 (선택사항)

Supabase Edge Functions도 로컬에서 실행할 수 있습니다:

```bash
# Supabase CLI가 설치되어 있어야 합니다
supabase functions serve
```

이렇게 하면 Edge Functions도 로컬에서 실행되어 더 빠르게 테스트할 수 있습니다.

**주의**: 로컬 Edge Functions를 사용하려면 `.env` 파일에서 `VITE_SUPABASE_URL`을 로컬 URL로 변경해야 합니다:
```
VITE_SUPABASE_URL=http://localhost:54321
```

## 📱 토스 샌드박스 앱에서 연결

### 1. 샌드박스 앱 실행

토스 샌드박스 앱을 실행합니다.

### 2. 로컬 네트워크 권한 허용

앱 실행 시 "로컬 네트워크" 권한 요청이 나타나면 **허용**을 선택합니다.

### 3. 서버 주소 입력

샌드박스 앱에서 서버 주소 입력 화면이 나타나면:

1. 위에서 확인한 **Network 주소**를 입력합니다
   - 예: `http://192.168.0.100:5173`
   - 또는 `192.168.0.100:5173` (http:// 생략 가능)

2. **저장** 버튼을 누릅니다

### 4. 스키마 실행

서비스의 스키마를 입력하고 실행합니다:

- 스키마 형식: `intoss://[앱이름]`
- 예: `intoss://solve-climb-edu`

**참고**: `granite.config.ts` 파일의 `appName`을 확인하세요.

### 5. 연결 확인

화면 상단에 `Bundling {n}%...` 메시지가 표시되면 로컬 서버에 성공적으로 연결된 것입니다!

## 🔄 개발 워크플로우

### 일반적인 개발 사이클

1. **코드 수정**
   ```bash
   # 파일을 수정하면 자동으로 Hot Module Replacement (HMR)가 작동합니다
   ```

2. **토스 앱에서 확인**
   - 샌드박스 앱이 자동으로 새로고침됩니다
   - 변경사항이 즉시 반영됩니다

3. **로그 확인**
   - 브라우저 개발자 도구를 사용할 수 없으므로
   - `console.log()` 출력은 토스 앱의 로그에서 확인하거나
   - 로컬 개발 서버 터미널에서 확인할 수 있습니다

### 로그인 테스트

1. **로컬 서버 실행 중**
   ```bash
   npm run dev
   ```

2. **토스 샌드박스 앱에서 접속**
   - 위의 단계를 따라 로컬 서버에 연결

3. **MyPage에서 "3초 만에 시작하기" 버튼 클릭**

4. **콘솔 로그 확인**
   - 개발 서버 터미널에서 로그 확인
   - 또는 토스 앱의 개발자 도구 사용 (있는 경우)

## 🐛 문제 해결

### 1. 연결이 안 될 때

**문제**: 샌드박스 앱에서 로컬 서버에 연결할 수 없음

**해결책**:
- 컴퓨터와 스마트폰이 같은 Wi-Fi에 연결되어 있는지 확인
- 방화벽이 포트 5173을 차단하지 않는지 확인
- IP 주소가 올바른지 확인 (ifconfig/ipconfig로 재확인)
- `vite.config.js`에서 `host: '0.0.0.0'` 설정 확인

### 2. Hot Reload가 안 될 때

**문제**: 코드를 수정해도 앱이 자동으로 새로고침되지 않음

**해결책**:
- 샌드박스 앱을 완전히 종료하고 다시 실행
- 개발 서버를 재시작 (`Ctrl+C` 후 `npm run dev`)

### 3. Edge Functions가 작동하지 않을 때

**문제**: 로컬에서 Edge Functions 호출이 실패함

**해결책**:
- Supabase Edge Functions를 로컬에서 실행: `supabase functions serve`
- `.env` 파일의 `VITE_SUPABASE_URL`을 로컬 URL로 변경
- 또는 프로덕션 Supabase URL을 그대로 사용 (느리지만 작동함)

### 4. CORS 오류

**문제**: CORS 관련 오류가 발생함

**해결책**:
- `vite.config.js`에 CORS 설정 추가:
  ```js
  server: {
    cors: true,
    host: '0.0.0.0',
  }
  ```

## 💡 팁

### 1. 빠른 IP 주소 확인

Windows에서 빠르게 IP 주소를 확인하려면:
```powershell
# PowerShell에서
(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi").IPAddress
```

### 2. 여러 기기에서 테스트

같은 Wi-Fi에 연결된 여러 기기에서 동시에 테스트할 수 있습니다.
각 기기에서 같은 로컬 서버 주소로 접속하면 됩니다.

### 3. 네트워크 변경 시

Wi-Fi를 변경하거나 컴퓨터를 재시작하면 IP 주소가 변경될 수 있습니다.
샌드박스 앱에서 서버 주소를 다시 입력해야 합니다.

### 4. 개발 서버 포트 변경

기본 포트(5173)를 변경하려면:
```bash
# 환경 변수로 포트 지정
DEV_PORT=3000 npm run dev
```

또는 `granite.config.ts`에서 포트 설정을 변경하세요.

## 📚 참고 자료

- [토스 앱인토스 개발자센터 - WebView 개발하기](https://developers-apps-in-toss.toss.im/tutorials/webview.html)
- [Vite 개발 서버 설정](https://vitejs.dev/config/server-options.html)

## ✅ 체크리스트

로컬 개발 환경 설정 확인:

- [ ] 토스 샌드박스 앱 설치 완료
- [ ] 컴퓨터와 스마트폰이 같은 Wi-Fi에 연결됨
- [ ] 개발 서버 실행 (`npm run dev`)
- [ ] 로컬 IP 주소 확인 완료
- [ ] 샌드박스 앱에서 서버 주소 입력 완료
- [ ] 스키마 실행 성공 (`intoss://solve-climb-edu`)
- [ ] 앱이 로컬 서버에 연결됨 (Bundling 메시지 확인)
- [ ] 코드 수정 후 Hot Reload 작동 확인

이제 코드를 수정할 때마다 토스 앱에서 즉시 확인할 수 있습니다! 🎉
