---
description: Solve Climb 프로젝트 개요 및 핵심 비즈니스 로직
globs: ['**/*']
alwaysApply: true
---

# 프로젝트 개요

**Solve Climb**은 수학 퀴즈를 풀며 산을 오르는 교육용 게임 앱입니다.

## 핵심 사용자 흐름

1. 홈(`/`) → 카테고리 선택(`/subcategory`) → 레벨 선택(`/level-select`)
2. 퀴즈 플레이(`/quiz`) → 결과 확인(`/result`)
3. 랭킹(`/ranking`), 마이페이지(`/my-page`)

## 폴더 구조

```
src/
├── components/   # 재사용 UI 컴포넌트
├── pages/        # 라우트별 페이지 컴포넌트
├── stores/       # Zustand 상태 관리
├── hooks/        # 커스텀 훅
├── utils/        # 유틸리티 함수
├── constants/    # 상수 정의
├── types/        # TypeScript 타입
└── services/     # API 서비스 레이어
```

## 주요 상태 관리 (Zustand)

### 핵심 스토어

- `useUserStore` - 사용자 정보 및 인증 상태
- `useQuizStore` - 퀴즈 게임 상태
- `useLevelProgressStore` - 레벨 진행도
- `useProfileStore` - 사용자 프로필
- `useGameStore` - 게임 세션 상태

### 보조 스토어

- `useSettingsStore` - 앱 설정
- `useAuthStore` - 인증 흐름
- `useBadgeStore` - 뱃지/업적 시스템
- `useToastStore` - 알림 메시지
- `useLoadingStore` - 로딩 상태
- `useFavoriteStore` - 즐겨찾기

## AI 에이전트 행동 원칙

1. **현행 코드 분석 우선** - 수정 전 반드시 관련 파일을 읽고 구조 파악
2. **점진적 수정** - 파일 전체 덮어쓰기 금지, Diff 중심 수정
3. **계획 승인** - 파일 2개 이상 수정 시 `implementation_plan.md` 작성 후 승인 요청
4. **Safe Editing** - 기존 코드 삭제/변경 최소화, 확장 우선
