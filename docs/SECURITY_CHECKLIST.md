# 보안 점검 체크리스트

이 문서는 Solve Climb 프로젝트의 보안을 유지하기 위한 정기적인 점검 항목을 제공합니다.

## 매주 확인 사항

### 의존성 보안
- [ ] `npm run audit` 실행하여 취약점 확인
- [ ] `npm run check:security` 실행하여 moderate 이상 취약점 검사
- [ ] 자동 수정 가능한 취약점은 `npm run audit:fix`로 수정
- [ ] Dependabot이 생성한 보안 업데이트 PR 검토 및 병합

### 환경 변수 관리
- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] `.env.example` 파일이 최신 상태인지 확인
- [ ] 프로덕션 환경 변수가 올바르게 설정되어 있는지 확인
- [ ] 하드코딩된 시크릿이나 API 키가 코드에 없는지 확인

### 코드 리뷰
- [ ] 최근 커밋에서 하드코딩된 값이 없는지 확인
- [ ] 새로운 의존성 추가 시 보안 취약점 확인
- [ ] API 엔드포인트의 인증/인가 로직 확인

## 매월 확인 사항

### API 키 및 시크릿 관리
- [ ] Supabase 키 로테이션 필요 여부 확인
- [ ] 토스 API 키 로테이션 필요 여부 확인
- [ ] 사용하지 않는 API 키 제거
- [ ] 접근 권한이 필요한 최소 권한으로 제한되어 있는지 확인

### 인프라 보안
- [ ] Supabase 프로젝트의 보안 설정 확인
- [ ] 데이터베이스 접근 권한 검토
- [ ] Edge Functions의 인증 로직 확인
- [ ] CORS 설정이 올바른지 확인

### 로그 및 모니터링
- [ ] 에러 로그에서 민감한 정보 노출 여부 확인
- [ ] 비정상적인 접근 패턴 확인
- [ ] 사용자 인증 실패 로그 검토

## 분기별 확인 사항

### 종합 보안 감사
- [ ] 모든 의존성의 최신 보안 패치 적용
- [ ] 프로젝트 전체 코드베이스에서 하드코딩된 시크릿 검색
- [ ] 환경 변수 검증 로직이 올바르게 작동하는지 테스트
- [ ] Content Security Policy(CSP) 설정 검토
- [ ] 인증/인가 플로우의 보안 취약점 검토

### 문서화 업데이트
- [ ] 보안 관련 문서 최신화
- [ ] 새로운 보안 조치 사항 문서화
- [ ] 보안 인시던트 대응 절차 문서화

## 보안 인시던트 대응

보안 문제가 발견된 경우:

1. **즉시 조치**
   - 영향을 받는 서비스나 키를 즉시 비활성화
   - 필요시 관련 기능 일시 중단

2. **문제 파악**
   - 영향 범위 확인
   - 취약점의 심각도 평가

3. **수정 및 배포**
   - 보안 패치 적용
   - 테스트 후 배포

4. **사후 조치**
   - 원인 분석 및 재발 방지 대책 수립
   - 필요시 사용자에게 공지

## 보안 모범 사례

### 환경 변수 사용
- ✅ 모든 시크릿은 환경 변수로 관리
- ✅ `.env` 파일은 절대 커밋하지 않음
- ✅ `.env.example` 파일로 필요한 환경 변수 문서화

### 의존성 관리
- ✅ 정기적인 `npm audit` 실행
- ✅ Dependabot을 통한 자동 업데이트 활용
- ✅ 새로운 의존성 추가 시 보안 검토

### 코드 작성
- ✅ 하드코딩된 시크릿 금지
- ✅ API 키나 토큰을 로그에 출력하지 않음
- ✅ 사용자 입력값 검증 및 sanitization

### 인증 및 인가
- ✅ 모든 API 엔드포인트에 적절한 인증 적용
- ✅ 최소 권한 원칙 준수
- ✅ 세션 관리 및 토큰 만료 정책 준수

## 유용한 명령어

```bash
# 보안 취약점 검사
npm run audit

# 자동 수정 가능한 취약점 수정
npm run audit:fix

# Moderate 이상 취약점만 검사
npm run check:security

# 환경 변수 검증 (코드 내에서)
# src/utils/env.ts의 checkEnv() 함수 사용
```

## 참고 자료

- [npm Security Best Practices](https://docs.npmjs.com/security-best-practices)
- [Supabase Security Guide](https://supabase.com/docs/guides/platform/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)

## 업데이트 이력

- 2024-01-XX: 초기 문서 작성

