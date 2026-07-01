# 🎮 Solve Climb 인게임 흐름도 (Game Flowchart)

이 문서는 사용자가 앱에 진입한 순간부터 퀴즈 게임을 플레이하고, 정산 및 오답 복습을 수행하기까지의 **인게임 화면 이동 및 핵심 로직 흐름**을 시각적으로 나타냅니다.

---

## 🗺️ 인게임 흐름도 (Game Loop Flowchart)

```mermaid
graph TD
  %% 1. 진입 단계
  subgraph Step1 ["🚀 1단계: 진입 및 준비"]
    Home["🏠 홈 화면 (HomePage)"] -->|게임 시작 버튼 클릭| LevelSelect["🥾 레벨/스테이지 선택 (LevelSelectPage)"]
    LevelSelect -->|스테이지 입장| Countdown["📡 카운트다운 (CountdownOverlay - 3초)"]
  end

  %% 2. 게임 플레이 단계
  subgraph Step2 ["🎮 2단계: 메인 게임 플레이 루프 (QuizPage)"]
    Countdown -->|GO! 신호 발생| QuizStart["📝 퀴즈 시작 (QuizPage / QuizLayout)"]
    QuizStart -->|수식 생성 & 대기| InputWait["⌨️ 유저 입력 대기 (CustomKeypad / QwertyKeypad)"]
    InputWait -->|답안 입력 제출| CheckAnswer{"🎯 답안 판정 (Verify)"}
    
    %% 정답 흐름
    CheckAnswer -->|정답! (Correct)| CorrectAction["✅ 정답 처리<br>- 점수 & 피버 게이지 충전<br>- 스태미나 유지/상승"]
    CorrectAction --> NextQuiz{"❓ 다음 문제<br>존재 여부"}
    
    %% 오답 흐름
    CheckAnswer -->|오답/타임아웃| WrongAction["❌ 오답 처리<br>- 스태미나 감소"]
    WrongAction --> StaminaCheck{"🔋 스태미나 > 0 ?"}
    
    StaminaCheck -->|Yes| NextQuiz
    StaminaCheck -->|No| LastChance{"🧗‍♀️ LastChanceModal<br>(부활 기회)"}
    
    %% 부활 분기
    LastChance -->|광고 시청 / 아이템 사용| Revive["⚡ 부활 성공<br>- 스태미나 일부 회복"]
    Revive --> NextQuiz
    
    LastChance -->|포기 / 기회 소진| GameOver["💀 게임 오버"]
    
    %% 다음 문제 분기
    NextQuiz -->|Yes| QuizStart
    NextQuiz -->|No (스테이지 클리어)| GameOver
  end

  %% 3. 결과 및 정산 단계
  subgraph Step3 ["🏆 3단계: 정산 및 피드백"]
    GameOver -->|결과 데이터 전달| ResultPage["📊 결과 정산 (ResultPage)"]
    
    ResultPage -->|점수/경험치 정산 완료| TierCheck{"👑 전설 달성?"}
    TierCheck -->|Yes| Promotion["🥇 승급 모달 (CyclePromotionModal)"]
    TierCheck -->|No| BadgeCheck{"🏅 신규 배지 획득?"}
    Promotion --> BadgeCheck
    
    BadgeCheck -->|Yes| BadgeAlarm["🔔 배지 획득 알림 (BadgeNotification)"]
    BadgeCheck -->|No| ActionSelect["🔄 최종 선택"]
    BadgeAlarm --> ActionSelect
    
    ActionSelect -->|오답 복습 클릭| ReviewPage["📝 오답 노트 (ReviewPage)"]
    ActionSelect -->|처음으로 클릭| Home
    
    ReviewPage -->|복습 완료| Home
  end

  %% 스타일 지정
  style Home fill:#2d3748,stroke:#4a5568,stroke-width:2px,color:#fff
  style QuizStart fill:#2b6cb0,stroke:#3182ce,stroke-width:2px,color:#fff
  style CheckAnswer fill:#d69e2e,stroke:#ecc94b,stroke-width:2px,color:#fff
  style GameOver fill:#9b2c2c,stroke:#e53e3e,stroke-width:2px,color:#fff
  style ResultPage fill:#2c5282,stroke:#4299e1,stroke-width:2px,color:#fff
```

---

## 📝 흐름 상세 설명

### 1. 🚀 진입 및 준비
* 사용자는 **홈 화면**에서 스테이지 입장 버튼을 통해 **레벨 선택 화면**으로 진입합니다.
* 특정 스테이지를 터치하면 화면에 **3초 카운트다운**이 활성화되며 게임 서버 및 수식 생성기가 활성화될 준비를 마칩니다.

### 2. 🎮 메인 게임 플레이 루프
* **답안 판정:** 제출된 수식 답안은 내부 판정 함수를 거쳐 `정답` 혹은 `오답`으로 나뉩니다.
* **피버 시스템:** 연속 정답 시 피버 게이지가 쌓이며 피버 모드에 돌입하면 보너스 점수를 획득합니다.
* **스태미나 시스템:** 오답 혹은 제한 시간 초과 시 스태미나가 깎이며, 0이 되는 순간 게임 오버 위기에 처합니다.
* **부활(Last Chance):** 스태미나가 0이 되어 게임 오버가 되기 직전, 광고를 보거나 부활 아이템을 사용하여 1회 복구할 기회를 제공합니다.

### 3. 🏆 정산 및 피드백
* 게임이 끝나면 **결과 페이지**로 이동해 최종 점수와 상승한 티어 경험치를 정산합니다.
* **전설 승급:** 누적 점수가 임계값을 초과하여 전설 티어에 도달하면 사이클 승급 모달이 팝업됩니다.
* **오답 노트:** 이번 판에 틀린 수학 공식들을 저장해 둔 임시 목록을 결과 화면에서 오답 노트를 눌러 다시 복습할 수 있습니다.
