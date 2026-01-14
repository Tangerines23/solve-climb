# 사용자 알림 및 가이드 요소 가이드 (UI Notification Guide)

Solve Climb 프로젝트 내에서 사용자에게 정보를 제공하거나, 액션을 유도하거나, 가이드하는 모든 UI 요소를 정리했습니다.

## 1. 🪟 모달 (Modals & Blocking Overlays)
사용자의 상호작용을 차단하고 중요한 결정을 내리거나 정보를 확인하게 하는 요소입니다.

| 이름 | 경로 | 상황 및 목적 |
| :--- | :--- | :--- |
| **AlertModal** | `src/components/AlertModal.tsx` | 범용 시스템 안내 및 경고 (확인 버튼). |
| **ConfirmModal** | `src/components/ConfirmModal.tsx` | 중대한 결정 전 최종 확인 (종료, 삭제 등 / 예-아니오). |
| **PauseModal** | `src/components/game/PauseModal.tsx` | 게임 중 일시정지 메뉴 (재개, 종료). |
| **LastChanceModal** | `src/components/LastChanceModal.tsx` | 게임 오버 위기 시 부활 아이템(신호탄 등) 구매 및 사용 유도. |
| **ModeSelectModal** | `src/components/ModeSelectModal.tsx` | 게임 모드(타임어택, 서바이벌) 선택. |
| **GameTipModal** | `src/components/GameTipModal.tsx` | 게임 시작 직전, 카테고리별 팁 안내 및 아이템 장착. |
| **StaminaWarningModal** | `src/components/game/StaminaWarningModal.tsx` | 스태미나 부족 시 경고 및 광고 시청(충전) 유도. |
| **TierUpgradeModal** | `src/components/TierUpgradeModal.tsx` | 티어 승급 성공 시 축하 및 결과 안내. |
| **KeyboardInfoModal** | `src/components/KeyboardInfoModal.tsx` | 조작법 및 키보드 종류(커스텀/시스템) 설정 안내. |
| **UnderDevelopmentModal** | `src/components/UnderDevelopmentModal.tsx` | 구현 예정 기능 클릭 시 안내. |
| **BackpackBottomSheet** | `src/components/game/BackpackBottomSheet.tsx` | 인게임 보유 아이템 목록 확인 및 사용. |
| **RoadmapOverlay** | `src/components/roadmap/RoadmapOverlay.tsx` | 등반 경로 및 마일스톤 전체 현황 확인. |

## 2. 💬 토스트 및 알림 (Toasts & Notifications)
방해하지 않고 가볍게 메시지를 전달한 후 사라지는 요소입니다.

| 이름 | 경로 | 상황 및 목적 |
| :--- | :--- | :--- |
| **Toast** | `src/components/Toast.tsx` | 범용 하단 토스트 메시지 (예: "저장되었습니다"). |
| **BadgeNotification** | `src/components/BadgeNotification.tsx` | 새로운 뱃지 획득 시 상단 팝업 알림. |
| **SlideToast** (인라인) | `src/pages/QuizPage.tsx` | 퀴즈 중 "뒤로 가려면 한 번 더 누르세요" 등의 일시적 가이드. |
| **ItemFeedbackOverlay** | `src/components/game/ItemFeedbackOverlay.tsx` | 아이템 사용 시 효과 텍스트 출력 (예: "OXYGEN UP!"). |

## 3. 🎮 인게임 피드백 (In-Game Feedback Overlays)
게임 플레이 중 즉각적인 시각적 피드백을 제공하는 요소입니다.

| 이름 | 경로 | 상황 및 목적 |
| :--- | :--- | :--- |
| **CountdownOverlay** | `src/components/CountdownOverlay.tsx` | 게임 시작 또는 부활 직후 카운트다운(3, 2, 1). |
| **SafetyRopeOverlay** | `src/components/game/SafetyRopeOverlay.tsx` | 안전 로프 아이템 발동 시 오답 방어 애니메이션. |
| **GameOverlay** | `src/components/game/GameOverlay.tsx` | 게임 화면 전체 피드백 레이어. |
| **TimerCircle** | `src/components/TimerCircle.tsx` | 남은 시간 시각화 및 위험 상태(빨간색) 피드백. |

## 4. 📚 가이드 및 안내성 카드 (Guidance & Info Cards)
페이지 내에서 정적으로 정보를 제공하거나 사용자를 안내하는 요소입니다.

| 이름 | 경로 | 상황 및 목적 |
| :--- | :--- | :--- |
| **ChallengeCard** | `src/components/ChallengeCard.tsx` | 도전 과제 및 보상 정보 안내. |
| **MyRecordCard** | `src/components/MyRecordCard.tsx` | 나의 등반 기록 및 분석 결과 안내. |
| **UnknownMountainCard** | `src/components/UnknownMountainCard.tsx` | 잠겨있는 레벨/산에 대한 정보 안내. |
| **StatusCard** | `src/components/StatusCard.tsx` | 현재 스태미나, 미네랄, 티어 상태 요약 정보. |

## 🛠️ 관리 및 통합 방식
- **QuizModals**: `src/components/quiz/QuizModals.tsx`에서 인게임용 모달들을 통합하여 관리합니다.
- **useQuizAnimations**: 퀴즈 페이지 내의 다양한 하이라이트, 진동, 토스트 효과를 훅으로 관리합니다.
- **Typography & Theme**: 모든 요소는 현재 **Dark Glassmorphism** 스타일로 통일되어 프리미엄한 UX를 제공합니다.
