# 인증서 파일 이름 검토 완료

## ✅ 실제 파일 이름

프로젝트에서 사용하는 실제 mTLS 인증서 파일 이름:

- **인증서 파일**: `solve-climb-mtls_public.crt`
- **키 파일**: `solve-climb-mtls_private.key`

## ✅ 수정 완료된 파일들

모든 문서와 코드가 실제 파일 이름에 맞게 수정되었습니다:

### 코드 파일
- ✅ `proxy-server/server.js` - 키 파일 경로 수정
- ✅ `proxy-server/README.md` - 파일 이름 수정

### 문서 파일
- ✅ `docs/PROXY_SERVER_SETUP.md` - 파일 복사 명령어 수정
- ✅ `docs/HOW_TO_USE_MTLS_CERTIFICATE.md` - 예시 파일 이름 수정
- ✅ `docs/CERTIFICATE_REQUIRED_ERROR.md` - 예시 파일 이름 수정
- ✅ `docs/MTLS_CERTIFICATE_QUICK_START.md` - 파일 이름 수정

## 📋 파일 복사 명령어 (최종)

### Windows (PowerShell)
```powershell
Copy-Item cert\solve-climb-mtls_public.crt proxy-server\cert\
Copy-Item cert\solve-climb-mtls_private.key proxy-server\cert\
```

### Mac/Linux
```bash
cp cert/solve-climb-mtls_public.crt proxy-server/cert/
cp cert/solve-climb-mtls_private.key proxy-server/cert/
```

## ✅ 검토 완료

모든 파일이 실제 파일 이름(`solve-climb-mtls_public.crt`, `solve-climb-mtls_private.key`)에 맞게 수정되었습니다.

