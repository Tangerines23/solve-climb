# 오늘의 챌린지 서버 설정 가이드

오늘의 챌린지 기능을 서버 기반으로 사용하기 위한 설정 가이드입니다.

## 1. Supabase 테이블 생성

### 방법 A: Supabase Dashboard 사용

1. Supabase Dashboard 접속
2. SQL Editor 열기
3. `supabase/migrations/create_today_challenges.sql` 파일의 내용을 복사하여 실행

### 방법 B: Supabase CLI 사용

```bash
supabase db push
```

## 2. 자동 생성 설정

오늘의 챌린지를 자동으로 생성하는 방법은 두 가지가 있습니다.

### 방법 A: Supabase Edge Function (권장)

1. Edge Function 배포:
```bash
supabase functions deploy create-today-challenge
```

2. Cron Job 설정 (매일 자정 실행):
   - GitHub Actions, Vercel Cron, 또는 다른 스케줄러 사용
   - `https://your-project.supabase.co/functions/v1/create-today-challenge` 호출

### 방법 B: 수동 생성

Supabase Dashboard에서 직접 챌린지를 생성할 수 있습니다:

```sql
INSERT INTO today_challenges (
  challenge_date,
  category_id,
  category_name,
  topic_id,
  topic_name,
  level,
  mode,
  title
) VALUES (
  CURRENT_DATE,
  'math',
  '수학',
  'arithmetic',
  '사칙연산',
  5,
  'time_attack',
  '사칙연산 받아올림 덧셈!'
);
```

## 3. 테스트

### 클라이언트에서 테스트

1. 앱 실행
2. 홈페이지에서 "오늘의 챌린지" 카드 확인
3. 서버에 챌린지가 있으면 서버 데이터 사용
4. 없으면 로컬 폴백 사용

### API 테스트

```bash
# 오늘의 챌린지 조회
curl https://your-project.supabase.co/rest/v1/today_challenges?challenge_date=eq.2024-01-15 \
  -H "apikey: YOUR_ANON_KEY"
```

## 4. 동작 방식

1. **서버 우선**: 클라이언트는 먼저 Supabase에서 오늘의 챌린지를 조회합니다.
2. **로컬 캐시**: 같은 날짜면 로컬 캐시를 먼저 반환하고, 백그라운드에서 서버 확인합니다.
3. **폴백**: 서버에 챌린지가 없거나 네트워크 오류 시 로컬에서 생성합니다.

## 5. 문제 해결

### 챌린지가 생성되지 않는 경우

1. Supabase 테이블이 생성되었는지 확인
2. RLS 정책이 올바르게 설정되었는지 확인
3. Edge Function이 배포되었는지 확인
4. Cron Job이 정상 작동하는지 확인

### 모든 사용자가 다른 챌린지를 받는 경우

1. 서버에 챌린지가 제대로 저장되었는지 확인
2. 날짜 형식이 올바른지 확인 (YYYY-MM-DD)
3. 클라이언트 캐시를 초기화해보세요

## 6. 수동 챌린지 생성 스크립트

필요시 수동으로 챌린지를 생성할 수 있습니다:

```typescript
// src/utils/challenge-admin.ts (개발용)
import { challengeApi } from './api';

// 오늘의 챌린지 수동 생성 (서버에 없을 때만)
async function createTodayChallengeManually() {
  const today = new Date().toISOString().split('T')[0];
  const existing = await challengeApi.getTodayChallenge(today);
  
  if (existing) {
    console.log('Challenge already exists:', existing);
    return;
  }
  
  // Edge Function 호출하여 생성
  // 또는 직접 Supabase에 INSERT
}
```

