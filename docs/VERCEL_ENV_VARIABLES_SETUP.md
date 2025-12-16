# Vercel Environment Variables 설정 가이드

프록시 서버를 Vercel에 배포할 때 인증서 파일을 Environment Variables로 설정하는 방법입니다.

---

## 📋 사전 준비

프록시 서버 코드가 환경 변수에서 인증서를 읽도록 수정되었습니다.

---

## 🔑 Step 1: 인증서 파일 내용 읽기

터미널에서 실행:

```powershell
# Windows (PowerShell)
Get-Content cert\solve-climb-mtls_public.crt -Raw
Get-Content cert\solve-climb-mtls_private.key -Raw
```

**중요**: 
- `-Raw` 옵션을 사용하여 전체 내용을 한 번에 읽어야 합니다
- 줄바꿈을 포함한 전체 내용을 복사해야 합니다
- `-----BEGIN CERTIFICATE-----`부터 `-----END CERTIFICATE-----`까지 모두 포함
- `-----BEGIN PRIVATE KEY-----`부터 `-----END PRIVATE KEY-----`까지 모두 포함

---

## 🔧 Step 2: Vercel Environment Variables 설정

### 2-1. Vercel 대시보드 접속

1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. `solve-climb-proxy` 프로젝트 선택

### 2-2. Environment Variables 메뉴 이동

1. 프로젝트 페이지에서 **Settings** 탭 클릭
2. 왼쪽 메뉴에서 **Environment Variables** 클릭

### 2-3. 인증서 변수 추가

#### 변수 1: TOSS_MTLS_CERT

1. **Key** 입력: `TOSS_MTLS_CERT`
2. **Value** 입력: 인증서 파일 전체 내용 붙여넣기
   ```
   -----BEGIN CERTIFICATE-----
   MIIF... (전체 인증서 내용)
   -----END CERTIFICATE-----
   ```
3. **Environment** 선택:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
4. **Add** 클릭

#### 변수 2: TOSS_MTLS_KEY

1. **Key** 입력: `TOSS_MTLS_KEY`
2. **Value** 입력: 키 파일 전체 내용 붙여넣기
   ```
   -----BEGIN PRIVATE KEY-----
   MIIE... (전체 키 내용)
   -----END PRIVATE KEY-----
   ```
3. **Environment** 선택:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
4. **Add** 클릭

### 2-4. 저장 확인

두 변수가 모두 추가되었는지 확인:
- ✅ `TOSS_MTLS_CERT`
- ✅ `TOSS_MTLS_KEY`

---

## 🚀 Step 3: 재배포

Environment Variables를 추가한 후에는 **재배포**가 필요합니다:

1. Vercel 대시보드에서 프로젝트 선택
2. **Deployments** 탭 클릭
3. 최신 배포의 **"..."** 메뉴 클릭
4. **Redeploy** 선택
5. 또는 코드를 푸시하면 자동으로 재배포됩니다

---

## ✅ 확인 방법

### 방법 1: 배포 로그 확인

1. Vercel 대시보드 > Deployments
2. 최신 배포 클릭
3. **Build Logs** 확인
4. 다음 메시지가 보이면 성공:
   ```
   ✅ mTLS 인증서 로드 완료 (환경 변수에서)
   ```

### 방법 2: Health Check 엔드포인트 테스트

프록시 서버 URL로 요청:

```bash
curl https://your-proxy-server.vercel.app/health
```

성공 응답:
```json
{
  "status": "ok",
  "service": "toss-oauth-proxy",
  "timestamp": "2025-12-16T..."
}
```

---

## 🔍 문제 해결

### 문제 1: "환경 변수에서 인증서를 찾을 수 없습니다" 오류

**원인**: Environment Variables가 설정되지 않았거나 재배포되지 않음

**해결**:
1. Vercel 대시보드에서 Environment Variables 확인
2. 변수 이름이 정확한지 확인 (`TOSS_MTLS_CERT`, `TOSS_MTLS_KEY`)
3. 재배포 실행

### 문제 2: 인증서 형식 오류

**원인**: 인증서 내용에 줄바꿈이 제대로 포함되지 않음

**해결**:
1. PowerShell에서 `-Raw` 옵션 사용하여 다시 읽기
2. 전체 내용을 복사 (줄바꿈 포함)
3. Vercel Environment Variables에 다시 붙여넣기

### 문제 3: 환경 변수가 적용되지 않음

**원인**: 재배포가 되지 않음

**해결**:
1. 코드를 푸시하여 자동 재배포
2. 또는 수동으로 Redeploy

---

## 📝 체크리스트

- [ ] 인증서 파일 내용 읽기 완료
- [ ] Vercel Environment Variables에 `TOSS_MTLS_CERT` 추가 완료
- [ ] Vercel Environment Variables에 `TOSS_MTLS_KEY` 추가 완료
- [ ] 모든 Environment (Production, Preview, Development) 선택 완료
- [ ] 재배포 완료
- [ ] Health Check 엔드포인트 테스트 성공

---

## 💡 참고

- 로컬 개발 환경에서는 파일 시스템에서 인증서를 읽습니다 (`cert/` 폴더)
- Vercel 배포 환경에서는 Environment Variables에서 인증서를 읽습니다
- 두 방법 모두 지원하므로 로컬과 배포 환경 모두에서 작동합니다

---

## 🔒 보안 주의사항

- Environment Variables는 Vercel에서 암호화되어 저장됩니다
- 하지만 민감한 정보이므로 주의하세요
- Vercel 대시보드에서만 관리하고, 절대 공개하지 마세요

