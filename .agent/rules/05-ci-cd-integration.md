---
description: CI/CD 연동 및 커밋 전 검증 가이드
globs: ["**/*"]
alwaysApply: true
---

# CI/CD 연동 가이드

## 커밋 전 필수 검증

> **핵심**: 모든 코드 수정 후 반드시 `npm run validate` 실행

### Pre-commit 자동 체크 항목
1. 의존성 무결성 체크 (`scripts/check-dependency-integrity.js`)
2. TypeScript 타입 체크
3. ESLint 린팅
4. Prettier 포맷 체크
5. CSS 변수 검증
6. 네비게이션 체크

### 수동 검증 명령어
```bash
# 전체 검증 (커밋 전 필수)
npm run validate

# 빠른 검증 (린트만)
npm run validate:quick

# 전체 검증 + 테스트 + DB
npm run validate:full
```

## CI 파이프라인 구조

GitHub Actions에서 다음 작업들이 **병렬**로 실행됩니다:

| Job | 역할 | 필수 통과 |
|-----|------|----------|
| `setup` | 의존성 설치 및 캐싱 | ✅ |
| `validate` | 타입/린트/포맷 체크 | ✅ |
| `unit-test` | 단위 테스트 | ✅ |
| `security-db` | 보안 감사 + DB 검증 | ✅ |
| `build` | 프로덕션 빌드 | ✅ |

## AI 작업 완료 체크리스트

코드 수정 완료 후 반드시:

1. [ ] `npm run type-check` 통과 확인
2. [ ] `npm run lint` 오류 없음 확인
3. [ ] 새 CSS 작성 시 변수 사용 여부 확인
4. [ ] 테스트 파일 수정 시 `npm run test:all` 실행
5. [ ] 모든 검증 통과 후 사용자에게 보고

## 환경 변수 필수 항목

배포 환경에서 반드시 설정해야 하는 변수:
- `VITE_SUPABASE_URL` - Supabase 프로젝트 URL
- `VITE_SUPABASE_ANON_KEY` - Supabase 익명 키

## 브랜치 보호 규칙

`main` 브랜치는 다음 조건을 만족해야 머지 가능:
- CI 전체 통과
- 최소 1명 리뷰 승인
- 최신 커밋 기준 테스트 통과
