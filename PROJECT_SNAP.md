# 🧭 PROJECT SNAP: Solve-Climb (AI Context Guide)

이 파일은 AI 에이전트가 이 프로젝트를 가장 효율적으로 이해하고 작업하기 위해 작성된 요약 지도입니다.

## 🛠 Tech Stack (AI 필수 인지)
- **Frontend**: React (TS) + Vite
- **UI Framework**: `@tosspayments/tds-mobile` (TDS Mobile)
- **State Management**: `zustand`
- **Backend/DB**: Supabase (PostgreSQL)
- **Routing**: `react-router-dom`
- **Testing**: Playwright (E2E/Visual), Vitest (Unit)

## 📁 Key Directory Structure
- `src/components`: UI 컴포넌트 (TDS 기반)
- `src/pages`: 페이지 진입점
- `src/stores`: Zustand 전역 상태 관리
- `src/hooks`: 비즈니스 로직 훅
- `src/utils`: 유틸리티 (로거, 내비게이션 등)
- `src/types`: 공유 타입 정의
- `supabase/migrations`: 데이터베이스 스키마 및 RPC 정의

## 📜 Dev Standards (AI 준수 사항)
- **Path Alias**: 반드시 `@/` 절대 경로를 사용합니다.
- **Logging**: `logger.info()`, `logger.error()` 등 `src/utils/logger.ts`를 사용합니다.
- **Navigation**: 직접 `navigate('/...')`를 호출하지 않고 `src/utils/navigation.ts`의 `urls` 객체를 사용합니다.
- **Design**: 하드코딩된 색상/간격을 피하고 `src/index.css`의 CSS 변수를 사용합니다.

## 💡 Core Business Logic (Domain)
- **Theme/Mountain**: 수학(덧셈), 언어(히라가나/가타카나) 등의 거대 카테고리.
- **World/Category**: 산 내부에 존재하는 세부 단계 및 주제.
- **Survival Mode**: 한 번 틀리면 게임오버되는 무한 도전 모드.
- **Stamina System**: 게임 플레이 시 소모되며 광고 시청 등을 통해 충전 가능한 시스템.

## ⚠️ Important Files
- `src/utils/navigation.ts`: 모든 페이지 이동 링크의 원천 (Type-safe)
- `src/config/app.ts`: 프로젝트 전체의 상수 및 테마 설정
- `database.types.ts`: (예정) DB 스키마 타입 정의

---
> [!NOTE]
> 이 파일은 AI의 컨텍스트 파악을 돕기 위한 것이며, 실제 변경 사항은 각 코드 파일과 `docs/` 내의 상세 문서를 참조하세요.
