# 토스 OAuth mTLS 프록시 서버

토스 OAuth API를 호출하기 위한 mTLS 프록시 서버입니다.

## 📋 사전 준비

1. mTLS 인증서 파일 준비:
   - `cert/solve-climb-mtls_public.crt` (인증서 파일)
   - `cert/solve-climb-mtls_private.key` (키 파일)

2. 인증서 파일 복사:
   ```bash
   # 프로젝트 루트의 cert 폴더에서 복사
   cp ../cert/solve-climb-mtls_public.crt cert/
   cp ../cert/solve-climb-mtls_private.key cert/
   ```

## 🚀 실행 방법

### 로컬 개발

```bash
# 의존성 설치
npm install

# 서버 실행
npm start
```

서버가 `http://localhost:3000`에서 실행됩니다.

### 배포

#### Vercel 배포

1. Vercel에 로그인
2. 새 프로젝트 추가
3. `proxy-server` 폴더 선택
4. 배포

#### 환경 변수 설정

Vercel 대시보드에서:

- `PORT`: 포트 번호 (선택사항, 기본값: 3000)

## 📡 API 엔드포인트

### POST /api/toss-oauth/generate-token

토스 OAuth AccessToken을 받기 위한 프록시 엔드포인트입니다.

**요청**:

```json
{
  "authorizationCode": "인가코드",
  "referrer": "DEFAULT"
}
```

**응답**:

```json
{
  "resultType": "SUCCESS",
  "success": {
    "accessToken": "...",
    "refreshToken": "...",
    "tokenType": "bearer",
    "expiresIn": "3600",
    "scope": "..."
  }
}
```

### GET /health

서버 상태 확인 엔드포인트입니다.

**응답**:

```json
{
  "status": "ok",
  "service": "toss-oauth-proxy",
  "timestamp": "2025-12-16T..."
}
```

## 🔒 보안

- 인증서 파일은 `.gitignore`에 추가되어 Git에 커밋되지 않습니다
- 배포 시 인증서 파일을 안전하게 관리하세요
- Vercel Secrets 또는 환경 변수로 관리하는 것을 권장합니다

## 📚 참고

- [토스 API 사용하기](https://developers-apps-in-toss.toss.im/development/integration-process.html)
- `../docs/CERTIFICATE_REQUIRED_ERROR.md` - 오류 해결 가이드
