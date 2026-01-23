# solve-climb 광고 도입 전략 (Ad Strategy)

이 문서는 게임의 리텐션(Retention)을 해치지 않으면서 수익을 극대화하고 유저에게 가치를 제공하기 위한 광고 배치 전략을 제안합니다.

---

## 1. 광고 배치 포인트 (Placement Points)

### 1.1 스테미너 충전 (Rewarded Ad)
- **위치**: 홈 화면의 스테미너 게이지 옆 '+' 버튼 혹은 스테미너 부족 팝업.
- **내용**: 스테미너(산소통)가 0일 때, 광고를 시청하면 즉시 1~2개를 충전.
- **기대 효과**: 과금 없이 계속 플레이하고 싶은 유저에게 활로를 제공하여 체류 시간 증대.

### 1.2 마지막 기회: 부활 (Rewarded Ad)
- **위치**: 퀴즈 도중 모든 하트를 소모했을 때 나타나는 'Last Chance' 모달.
- **내용**: 기존의 아이템 사용/미네랄 결제 외에 **"광고 보고 부활"** 옵션 추가.
- **기대 효과**: 고득점 중인 유저의 절박함을 활용하여 높은 광고 시청 완료율(Completion Rate) 유도.

### 1.3 출석 보상 및 결과 보상 배수 (Multipliers)
- **출석 보상 2배**: `DailyRewardModal`에서 기본 보상을 받은 후 광고를 보면 2배로 지급.
- **결제 보상 2배**: 게임 종료 후 획득한 미네랄을 광고 시청 시 2배로 뻥튀기. (가장 효과적)

### 1.4 미네랄 직접 충전 (Direct Minerals)
- **위치**: 상점(Shop) 혹은 헤더의 미네랄 표시 옆.
- **내용**: 미네랄이 부족할 때 광고 시청 시 즉시 300~500💎 지급 (하루 제한 3~5회).
- **기대 효과**: 과금 없이도 아이템을 구매하고 싶은 유저의 욕구 충족.

### 1.5 랜덤 아이템 박스 (Loot Box)
- **위치**: 홈 화면 혹은 상단 이벤트 배너.
- **내용**: 광고 시청 시 신호탄, 산소통 등 게임 아이템 중 하나를 무작위로 획득.
- **기대 효과**: 가치 있는 아이템을 무료로 얻을 수 있다는 기대감으로 매일 시청 유도.

### 1.6 무료 힌트 (Free Hints)
- **위치**: 퀴즈 화면 상단.
- **내용**: 너무 어려운 문제에서 광고 시청 시 정답의 일부 혹은 결정적 힌트 제공.
- **기대 효과**: 이탈하기 쉬운 고난도 구간에서 유저를 붙잡아두는 역할.

---

## 2. 기술적 구현 로직 (Pseudocode)

### 2.1 통합 API 인터페이스
```typescript
async function handleAdAction(placement: 'stamina' | 'revive' | 'daily') {
  const result = await AdService.showRewardedAd();
  
  if (result.success) {
    switch(placement) {
      case 'stamina': await userStore.recoverStaminaAds(); break;
      case 'revive': await quizStore.revivePlayer(); break;
      case 'daily': await rewardStore.doubleDailyReward(); break;
    }
    showToast("보상이 지급되었습니다!");
  }
}
```

---

## 3. 단계별 도입 로드맵 (Roadmap)

### [1단계] 기반 구축 (Infrastructure)
- `AdService` 유틸리티 생성 (Toss/Web 환경 분기 로직 포함).
- 테스트 ID를 활용한 연동 테스트 및 오류 핸들러 구현.

### [2단계] 핵심 보상형 광고 적용 (Core Rewards)
- 스테미너 부족 시 광고 충전 기능 구현.
- `QuizModals`에 부활 광고 옵션 추가.

### [3단계] 사용자 경험 고도화 (Optimization)
- 출석 보상 2배 버튼 추가.
- 광고 시청 시 햅틱 피드백 연동.
- 광고 노출 빈도 및 보상 밸런싱 조절.

---

## 4. 성공 지표 (KPIs)
- **Ad DAU**: 전체 유저 중 하루에 광고를 한 번이라도 본 유저의 비율.
- **Views per User**: 유저당 하루 평균 광고 시청 횟수.
- **Retention**: 광고 도입 전후의 유저 재방문율 변화 관찰.

---
**Antigravity 제안**: 우선 유저 반발이 적고 환영받는 **'스테미너 충전'**과 **'부활 광고'**부터 도입하는 것을 추천합니다.
