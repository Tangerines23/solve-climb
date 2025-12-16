# mTLS 인증서 빠른 시작 가이드

발급받은 `.key`와 `.crt` 파일을 가지고 무엇을 해야 하는지 빠르게 안내합니다.

---

## 🎯 핵심 요약

**현재 상황**: Supabase Edge Functions는 mTLS를 직접 사용하기 어렵습니다.

**권장 방법**: 
1. **먼저 Basic Auth 테스트** (빠른 확인)
2. **작동하지 않으면 프록시 서버 구축**

---

## ⚡ 빠른 체크리스트

### Step 1: 인증서 파일 안전하게 보관 ✅

```bash
# 프로젝트 루트에 cert 폴더 생성 (선택사항)
mkdir cert

# 인증서 파일 이동
mv solve-climb-mtls_public.crt cert/
mv solve-climb-mtls_private.key cert/

# .gitignore 확인 (이미 추가되어 있음)
# *.crt, *.key 파일은 Git에 커밋되지 않습니다
```

### Step 2: Basic Auth 테스트 (5분)

현재 프로젝트가 Basic Auth를 사용하고 있으므로, 먼저 작동하는지 확인:

```bash
# 브라우저 콘솔에서 실행
await window.testTossOAuth();
```

**결과**:
- ✅ **성공**: Basic Auth가 작동함 → 일단 사용 가능
- ❌ **실패**: mTLS 필요 → Step 3으로 진행

### Step 3: 프록시 서버 구축 (필요시)

Basic Auth가 작동하지 않는다면:

1. **프록시 서버 생성** (`proxy-server` 폴더)
2. **인증서 파일 복사** (`proxy-server/cert/`)
3. **프록시 서버 코드 작성** (예제 참고)
4. **프록시 서버 배포** (Vercel 등)
5. **Edge Function 수정** (프록시 서버 URL 사용)

---

## 📁 파일 구조 예시

```
solve-climb/
├── cert/                    # 인증서 파일 보관 (Git 무시됨)
│   ├── solve-climb-mtls_public.crt
│   └── solve-climb-mtls_private.key
├── proxy-server/            # 프록시 서버 (필요시)
│   ├── cert/
│   │   ├── solve-climb-mtls_public.crt
│   │   └── solve-climb-mtls_private.key
│   └── server.js
├── supabase/
│   └── functions/
│       └── toss-oauth/
│           └── index.ts
└── docs/
    └── HOW_TO_USE_MTLS_CERTIFICATE.md  # 상세 가이드
```

---

## 🔒 보안 체크리스트

- [ ] `.key` 파일이 Git에 커밋되지 않았는지 확인
- [ ] `.crt` 파일이 Git에 커밋되지 않았는지 확인
- [ ] `.gitignore`에 `*.key`, `*.crt` 추가되어 있는지 확인
- [ ] 인증서 파일을 안전한 위치에 보관

---

## 📚 상세 가이드

더 자세한 내용은 다음 문서를 참고하세요:

- `docs/HOW_TO_USE_MTLS_CERTIFICATE.md` - 상세 사용 방법
- `docs/MTLS_VS_BASIC_AUTH.md` - mTLS vs Basic Auth 비교

---

## 💡 다음 단계

1. **인증서 파일 보관** ✅ (완료)
2. **Basic Auth 테스트** ⏳ (다음 단계)
3. **프록시 서버 구축** (필요시)

**가장 빠른 방법**: 먼저 `await window.testTossOAuth()` 실행해보세요!

