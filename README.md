# Solve Climb 🏔️

수학 퀴즈를 통해 산을 오르는 교육용 게임 앱입니다. 사칙연산부터 고급 수학 문제까지 다양한 난이도로 학습할 수 있습니다.

## CI/CD 상태

![CI](https://github.com/Tangerines23/solve-climb/workflows/CI/badge.svg)
![Security](https://img.shields.io/badge/security-0%20vulnerabilities-brightgreen)
![Tests](https://img.shields.io/badge/tests-1379%2F1382%20passed-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-69%25-yellow)
![Test Files](https://img.shields.io/badge/test%20files-120-blue)

## 주요 기능

- 📚 **다양한 카테고리**: 수학의 산, 언어의 산, 미지의 산
- 🎯 **레벨 시스템**: 15단계의 점진적 난이도
- ⏱️ **타임어택 모드**: 시간 제한 내 최대한 많은 문제 해결
- 🏆 **랭킹 시스템**: 다른 플레이어와 경쟁
- 📊 **진행 상황 추적**: 레벨별 진행도 저장
- 🎮 **토스 앱 연동**: 토스 앱에서 게임센터 기능 사용

## 기술 스택

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Routing**: React Router v7
- **UI Framework**: Toss TDS Mobile
- **Backend**: Supabase
- **Platform**: Toss 앱 인앱 (Granite)

## 시작하기

### 필수 조건

- Node.js 18 이상
- npm 또는 yarn
- Supabase 프로젝트
- 토스 앱 개발자 계정 (인앱 배포용)

### 설치

1. 저장소 클론
```bash
git clone <repository-url>
cd solve-climb
```

2. 의존성 설치
```bash
npm install
# 또는
yarn install
```

3. 환경 변수 설정

`.env` 파일을 생성하고 다음 변수를 설정하세요:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

`.env.example` 파일을 참고하세요.

### 개발 서버 실행

```bash
npm run dev
# 또는
yarn dev
```

Granite 개발 서버가 실행되며, 토스 앱에서 테스트할 수 있습니다.

### 빌드

프로덕션 빌드:

```bash
npm run build
# 또는
yarn build
```

빌드된 파일은 `dist` 폴더에 생성됩니다.

### 배포

토스 앱 인앱으로 배포:

```bash
npm run deploy
# 또는
yarn deploy
```

## 프로젝트 구조

```
solve-climb/
├── src/
│   ├── components/     # 재사용 가능한 컴포넌트
│   ├── pages/          # 페이지 컴포넌트
│   ├── stores/         # Zustand 상태 관리
│   ├── utils/          # 유틸리티 함수
│   ├── constants/      # 상수 정의
│   ├── types/          # TypeScript 타입 정의
│   └── config/         # 앱 설정
├── public/             # 정적 파일
├── supabase_schema.sql # Supabase 데이터베이스 스키마
├── supabase_rpc_functions.sql # Supabase RPC 함수
└── package.json
```

## 주요 페이지

- `/` - 홈 페이지
- `/subcategory` - 서브카테고리 선택
- `/level-select` - 레벨 선택
- `/quiz` - 퀴즈 게임 (수학, 언어, 논리, 상식 등 모든 카테고리)
- `/result` - 결과 페이지
- `/ranking` - 랭킹 페이지
- `/my-page` - 마이페이지

## 게임 모드

### 타임어택 모드
- 제한 시간 내 최대한 많은 문제를 풀어 높은 점수를 획득
- 정답: +10점, 오답: -3점 (등반 미끄러짐)

### 서바이벌 모드 (준비 중)
- 연속 정답으로 최고 기록 도전

## 레벨 시스템

### 수학의 산 > 사칙연산
1. 한 자리 덧셈 (결과 ≤ 10)
2. 한 자리 뺄셈 (결과 ≥ 0)
3. 덧셈과 뺄셈 혼합
4. 받아올림 덧셈
5. 받아내림 뺄셈
6. 연속 계산
7. 기초 곱셈 (구구단 2~5단)
8. 심화 곱셈 (구구단 6~9단)
9. 딱 떨어지는 나눗셈
10. 두 자리 연산
11. 세 수의 연산
12. 두 자리 곱셈
13. 혼합 계산 (연산자 우선순위)
14. 빈칸 채우기
15. 괄호 계산

## 데이터베이스

Supabase를 사용하여 다음 데이터를 저장합니다:
- 사용자 프로필
- 레벨 진행도
- 게임 기록
- 랭킹

스키마는 `supabase_schema.sql` 파일을 참고하세요.

## 개발 가이드

### 코드 스타일

- TypeScript strict 모드 사용
- ESLint 규칙 준수
- 함수형 컴포넌트와 Hooks 사용

### 상태 관리

Zustand를 사용하여 전역 상태를 관리합니다:
- `useQuizStore`: 퀴즈 게임 상태
- `useLevelProgressStore`: 레벨 진행도
- `useProfileStore`: 사용자 프로필
- `useSettingsStore`: 앱 설정
- `useFavoriteStore`: 즐겨찾기

### CSS 변수 사용 가이드

모든 스타일은 `src/index.css`에 정의된 CSS 변수를 사용해야 합니다. 하드코딩된 색상, 간격, border-radius 값은 금지됩니다.

#### 색상 변수

**배경 색상:**
- `var(--color-bg-primary)` - 주요 배경 (#1e1e1e)
- `var(--color-bg-secondary)` - 보조 배경 (#2c2c2c)
- `var(--color-bg-tertiary)` - 3차 배경 (#3c3c3c)

**텍스트 색상:**
- `var(--color-text-primary)` - 주요 텍스트 (#ffffff)
- `var(--color-text-secondary)` - 보조 텍스트 (#aaa)

**Primary 색상 (버튼, 링크 등):**
- `var(--color-blue-400)` - 기본 상태 (#00BFA5)
- `var(--color-blue-500)` - hover 상태 (#00a693)
- `var(--color-blue-700)` - active 상태 (#00897a)

**에러/경고 색상:**
- `var(--color-toss-red)` - 토스 빨간색 (#f04452)
- `var(--color-red-500)` - 일반 빨간색 (#ef4444)
- `var(--color-red-600)` - 위험 버튼 hover (#dc2626)

#### 간격 변수

기본 간격:
- `var(--spacing-xs)` - 4px
- `var(--spacing-sm)` - 8px
- `var(--spacing-md)` - 12px
- `var(--spacing-lg)` - 16px
- `var(--spacing-xl)` - 20px
- `var(--spacing-2xl)` - 24px
- `var(--spacing-3xl)` - 32px
- `var(--spacing-4xl)` - 40px

특수 간격:
- `var(--spacing-tiny)` - 6px
- `var(--spacing-small-alt)` - 10px
- `var(--spacing-medium-alt)` - 14px

#### Border Radius 변수

- `var(--rounded-xs)` - 6px
- `var(--rounded-sm)` - 12px
- `var(--rounded-md)` - 20px
- `var(--rounded-lg)` - 32px
- `var(--rounded-card)` - 16px (카드용)
- `var(--rounded-button)` - 12px (버튼용)
- `var(--rounded-toggle)` - 28px (토글 스위치)
- `var(--rounded-large-card)` - 24px (큰 카드)
- `var(--rounded-tiny)` - 2px (매우 작은 요소)
- `var(--rounded-micro)` - 3px (미세한 요소)
- `var(--rounded-small-alt)` - 6px (작은 요소 대체)

#### 사용 예시

```css
/* ✅ 올바른 사용 */
.my-component {
  background-color: var(--color-bg-primary);
  padding: var(--spacing-xl);
  border-radius: var(--rounded-card);
  color: var(--color-text-primary);
}

/* ❌ 잘못된 사용 */
.my-component {
  background-color: #1e1e1e; /* 하드코딩 금지 */
  padding: 20px; /* 하드코딩 금지 */
  border-radius: 16px; /* 하드코딩 금지 */
}
```

**예외 사항:**
- 그래픽/아트워크 요소의 그라데이션 색상
- 브랜드 색상 (Google 등)
- `index.css`의 변수 정의 자체

#### 하드코딩 검사

정기적으로 하드코딩된 값을 검사할 수 있습니다:

```bash
npm run check:css
```

이 명령어는 `src` 폴더의 모든 CSS 파일을 검사하고 하드코딩된 색상, 간격, border-radius 값을 찾아보고합니다.

자세한 내용은 [DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md)를 참고하세요.

## CI/CD

이 프로젝트는 GitHub Actions를 사용하여 자동화된 CI/CD 파이프라인을 구축하고 있습니다.

### CI/CD 문서

- **[CI/CD 시스템 분석](./docs/CI_CD_GAPS_DEEP_ANALYSIS.md)** - 현재 시스템의 부족한 부분 심층 분석 및 개선 방안
- **[CI/CD 실행 계획서](./docs/CI_CD_IMPLEMENTATION_PLAN.md)** - 상세 작업 계획 및 체크리스트

### 현재 상태

- ✅ TypeScript 타입 체크
- ✅ ESLint 코드 검사
- ✅ Prettier 포맷팅 검사
- ✅ CSS 변수 검증
- ✅ 보안 취약점 스캔 (npm audit)
- ✅ 테스트 실행 및 커버리지 리포트
- ✅ 자동 배포 (Vercel)

### 향후 개선 계획

- ⚠️ 테스트 커버리지 80% 달성 (현재 33%)
- ⚠️ 통합 테스트 추가
- ⚠️ E2E 테스트 추가 (Playwright)
- ⚠️ 성능 테스트 (Lighthouse CI)
- ⚠️ 고급 보안 도구 (CodeQL, OWASP ZAP)
- ⚠️ 모니터링 및 알림 강화

자세한 내용은 [CI/CD 실행 계획서](./docs/CI_CD_IMPLEMENTATION_PLAN.md)를 참고하세요.

## 보안

### 보안 스크립트

프로젝트에는 보안 취약점을 검사하는 스크립트가 포함되어 있습니다:

```bash
# 보안 취약점 검사
npm run audit

# 자동 수정 가능한 취약점 수정
npm run audit:fix

# Moderate 이상 취약점만 검사
npm run check:security
```

### 환경 변수 관리

- 모든 시크릿과 API 키는 환경 변수로 관리됩니다
- `.env` 파일은 절대 커밋하지 마세요
- `.env.example` 파일을 참고하여 필요한 환경 변수를 설정하세요

### 보안 점검

정기적인 보안 점검을 위해 [SECURITY_CHECKLIST.md](./docs/SECURITY_CHECKLIST.md)를 참고하세요.

### Dependabot

이 프로젝트는 GitHub Dependabot을 사용하여 의존성 업데이트와 보안 취약점을 자동으로 감지합니다. 주간 스캔이 실행되며, 보안 업데이트 PR이 자동으로 생성됩니다.

## 라이센스

이 프로젝트는 토스 앱 인앱 개발을 위한 예제 프로젝트입니다.

## 기여

이슈와 풀 리퀘스트를 환영합니다!

## 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.