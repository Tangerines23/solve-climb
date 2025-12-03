# Solve Climb 🏔️

수학 퀴즈를 통해 산을 오르는 교육용 게임 앱입니다. 사칙연산부터 고급 수학 문제까지 다양한 난이도로 학습할 수 있습니다.

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
- `/category-select` - 카테고리 선택
- `/level-select` - 레벨 선택
- `/math-quiz` - 수학 퀴즈 게임
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

## 라이센스

이 프로젝트는 토스 앱 인앱 개발을 위한 예제 프로젝트입니다.

## 기여

이슈와 풀 리퀘스트를 환영합니다!

## 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.