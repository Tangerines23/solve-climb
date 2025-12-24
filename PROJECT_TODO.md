# Project Status & Todo

최종 업데이트: 2025.12.25 (AI Update - Ranking v2 Completed)

## 1. ✅ Completed Tasks (완료된 작업)

### 1.1 Authentication & User System (✅)
- [x] **Supabase Auth Integration**: 이메일/비밀번호 로그인 구현 완료.
- [x] **User Profile**: `profiles` 테이블과 Auth UID 연동 완료.
- [x] **Toss Login Mapping**: 토스 앱 내 로그인 Key 매핑 (`user_migrations`).

### 1.2 Stamina System (✅)
- [x] **Schema**: `stamina`, `last_stamina_update` 컬럼 추가.
- [x] **Mechanics**: 10분 회복, 시작 시 소모, 광고 보상(+1) RPC 구현.
- [x] **UI**: 게이지, 타이머, 모달, 리필 기능.

### 1.3 Item & Shop System (✅)
- [x] **Schema**: `items`, `inventory` 테이블 구현.
- [x] **UI**: 상점(구매), 인벤토리(장착/보기).
- [x] **Effects**:
  - **Oxygen Tank**: +10초.
  - **Power Gel**: 피버 모드.
  - **Safety Rope**: 1회 방어 (Shield).
  - **Flare (Revive)**: 15초 남기고 부활 (Last Chance).
- [x] **Cheats**: 📦 아이콘 (Header), `+/-` 키 치트, Toast 피드백.

---

## 2. 🚧 In Progress (검증 예정)

- [ ] **In-Game Item Verification**:
    - [ ] 게임 내 '안전 로프'와 '부활' 효과 최종 테스트.

---

## 3. 📋 To Do (예정된 작업 - **DB/기획 보완 필수**)

### 3.1 Ranking & Progress System (✅)
- [x] **Database Schema**: `game_records` 및 주간 캐싱 컬럼 추가 완료.
- [x] **Ranking v2 Logic**: `get_ranking_v2` (주간/누적/모드별) 구현 완료.
- [x] **Scheduling**: 매주 월요일 0시 주간 점수 자동 초기화 (`pg_cron`) 설정 완료.
- [x] **Ranking UI**: Premium 3-Layer (Tabs + Switch) 디자인 적용 완료.

### 3.2 Quiz Content Expansion
*현재 '수학/일본어' 외 카테고리는 개발 중 메시지만 나옵니다.*
- [ ] **Logic/Common Sense**: 문제 데이터 구축 (DB 또는 로컬 JSON).
- [ ] **Generator**: `generateLogicQuestion`, `generateGeneralQuestion` 구현.

### 3.3 User History & Statistics
- [ ] **Statistic DB**: `user_statistics` (총 플레이, 승률, 연승 등).
- [ ] **My Page**: '기록(History)' 탭 UI 구현.

### 3.4 Today's Challenge
- [ ] **Logic**: 챌린지 갱신 스케줄러 및 유저 달성 테이블(`user_challenge_progress`) 구현.

---

## 4. 🌐 External / Compliance Tasks

- [ ] **Legal**: 개인정보처리방침(Privacy Policy) 및 이용약관(Terms) 페이지 (스토어 필수).
- [ ] **Account Deletion**: '회원 탈퇴' 기능 구현 (iOS/Android 필수).
- [ ] **AdMob**: 실제 서비스 ID 연동.

---

### *AI Note*
- `game_records` 테이블 및 `get_ranking` RPC 기능이 DB에 정상 적용되었습니다. (닉네임 연동 포함)
- '논리/상식' 퀴즈는 현재 더미 데이터 상태입니다.
