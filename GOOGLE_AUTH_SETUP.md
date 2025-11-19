# 구글 로그인 설정 가이드

어드민 계정에 구글 로그인을 사용하려면 다음 단계를 따라주세요.

## 1. Google Cloud Console에서 OAuth 2.0 클라이언트 ID 생성

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택 또는 새 프로젝트 생성
3. **API 및 서비스** > **사용자 인증 정보** 메뉴로 이동
4. 상단의 **+ 사용자 인증 정보 만들기** 클릭
5. **OAuth 2.0 클라이언트 ID** 선택
6. 애플리케이션 유형: **웹 애플리케이션** 선택
7. 이름 입력 (예: "Solve Climb Admin")
8. **승인된 리디렉션 URI** 추가:
   - 개발 환경: `http://localhost:5173`
   - 프로덕션 환경: `https://yourdomain.com`
9. **만들기** 클릭
10. 생성된 **클라이언트 ID** 복사

## 2. 환경변수 설정

### 방법 1: .env 파일 사용 (권장)

`frontend` 폴더에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
```

예시:
```env
VITE_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
```

### 방법 2: app.ts에 직접 입력 (개발용)

`frontend/src/config/app.ts` 파일에서 다음 줄을 수정하세요:

```typescript
GOOGLE_CLIENT_ID: 'your-google-client-id-here',
```

## 3. 어드민 이메일 설정

`frontend/src/config/app.ts` 파일의 `ADMIN_EMAILS` 배열에 어드민 이메일을 추가하세요:

```typescript
ADMIN_EMAILS: [
  'admin@yourdomain.com',
  'another-admin@yourdomain.com',
],
```

## 4. 개발 서버 재시작

환경변수를 변경한 경우 개발 서버를 재시작해야 합니다:

```bash
# 서버 중지 (Ctrl+C)
# 서버 재시작
npm run dev
```

## 5. 테스트

1. 프로필 만들기 페이지에서 닉네임을 "admin"으로 입력
2. "구글로 로그인" 버튼 클릭
3. 구글 계정 선택 및 로그인
4. 어드민 이메일로 로그인하면 자동으로 어드민 권한이 부여됩니다

## 문제 해결

### "Google Client ID가 설정되지 않았습니다" 에러

- `.env` 파일이 `frontend` 폴더에 있는지 확인
- 환경변수 이름이 `VITE_GOOGLE_CLIENT_ID`인지 확인 (대소문자 구분)
- 개발 서버를 재시작했는지 확인
- `.env` 파일이 `.gitignore`에 포함되어 있는지 확인 (보안상 권장)

### "어드민 계정만 구글 로그인을 사용할 수 있습니다" 에러

- `ADMIN_EMAILS` 배열에 로그인한 이메일이 포함되어 있는지 확인
- 이메일 주소가 정확히 일치하는지 확인 (대소문자 무시)

### 구글 로그인 팝업이 열리지 않음

- 브라우저의 팝업 차단 설정 확인
- Google Cloud Console에서 승인된 리디렉션 URI가 올바르게 설정되었는지 확인

