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

## 폴더 구조 (Vertical Slice Architecture)

본 프로젝트는 도메인 중심의 **Vertical Slice Architecture**를 따릅니다.

```
src/
├── features/         # 도메인별 수직 슬라이스
│   └── [feature]/    # 특정 기능 (예: auth, quiz, debug)
│       ├── components/
│       ├── hooks/
│       ├── stores/
│       ├── utils/
│       ├── types/
│       ├── __tests__/
│       └── index.ts  # Public API (외부 노출 인터페이스)
├── components/       # 도메인 공통 재사용 UI 컴포넌트
├── hooks/            # 전역 커스텀 훅
├── utils/            # 전역 유틸리티 (supabaseClient 등)
├── constants/        # 전역 상수 정의
├── types/            # 전역 TypeScript 타입
└── assets/           # 정적 리소스 (이미지, 폰트 등)
```

## 아키텍처 원칙 (수직 슬라이스 & 3계층 분리)

본 프로젝트는 **Vertical Slice Architecture**를 기반으로 하며, 각 피처 내부는 다음의 3계층으로 엄격히 분리됩니다.

1. **UI 계층 (Dumb Components)**: 화면을 그리는 데만 집중하며, 비즈니스 로직이나 전역 상태에 직접 접근하지 않습니다.
2. **로직 계층 (Hook Bridge)**: UI와 외부 데이터(Store, API) 사이의 브릿지 역할을 수행합니다. (`use[Feature]Bridge` 패턴)
3. **계산 계층 (Pure Functions/Utils)**: React 상태에 의존하지 않는 순수한 비즈니스 계산 및 데이터 가공 로직입니다.

### 핵심 준수 사항

1. **캡슐화 (Encapsulation)**: 각 피처는 자신의 로직과 UI를 소유하며, 외부에서는 오직 `index.ts`를 통해서만 접근 가능합니다. (Barrel Pattern)
2. **Hook Bridge 패턴**: UI 컴포넌트 내부에서 글로벌 상태(`useGameStore` 등)나 API를 직접 호출하지 마십시오. 반드시 `hooks/` 폴더의 브릿지 훅을 통해 주입받아야 합니다.
3. **테스트 무결성**: 모든 변경 사항은 기존 **1,500개 이상의 테스트**를 통과해야 하며, 도메인 내부 테스트 시에는 **엄격한 상대 경로(`../`)**를 사용합니다.

## AI 에이전트 행동 원칙 (Architect Master)

1. **객체 체조 원칙 준수**: 들여쓰기 1단계 제한, `else` 사용 금지 등 극단적인 클린 코드를 지향합니다.
2. **SSOT (Single Source of Truth)**: 모든 DB 관련 타입은 `Database` 타입에서 추출하여 사용하며, 수동 인터페이스 선언을 지양합니다.
3. **현행 코드 분석 우선**: 수정 전 반드시 관련 파일을 읽고 구조 파악을 선행합니다.
4. **계획 승인**: 파일 2개 이상 수정 시 `implementation_plan.md` 작성 후 승인 요청을 합니다.
