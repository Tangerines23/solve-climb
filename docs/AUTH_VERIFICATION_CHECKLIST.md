# 인증 설정 확인 체크리스트

전체 테스트가 완료된 후, 다음 사항들을 확인하세요.

## ✅ 기본 설정 확인

### 1. Supabase 대시보드 설정
- [ ] **콜백 URL 등록 확인**
  - Supabase Dashboard > Authentication > URL Configuration
  - 다음 URL들이 등록되어 있는지 확인:
    - `https://solve-climb.vercel.app/auth/callback` (프로덕션)
    - `http://localhost:5173/auth/callback` (개발)
  
- [ ] **Site URL 확인**
  - Site URL이 올바르게 설정되어 있는지 확인
  - 프로덕션: `https://solve-climb.vercel.app`
  - 개발: `http://localhost:5173`

### 2. 환경 변수 확인
- [ ] `.env` 파일에 다음 변수들이 설정되어 있는지 확인:
  ```env
  VITE_SUPABASE_URL=your_supabase_url
  VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
  ```

## 🔐 인증 플로우 테스트

### 3. 실제 OAuth 로그인 테스트
- [ ] **Google 로그인 테스트** (OAuth 제공자가 설정된 경우)
  1. 테스트 페이지에서 "Google 로그인 테스트" 클릭
  2. Google 로그인 화면으로 리디렉션되는지 확인
  3. 로그인 후 `/auth/callback`으로 리디렉션되는지 확인
  4. 마이페이지로 자동 이동되는지 확인
  5. 세션이 생성되어 있는지 확인

### 4. 콜백 처리 확인
- [ ] **콜백 페이지 동작 확인**
  1. `/auth/callback` 페이지가 정상적으로 로드되는지 확인
  2. URL에 인증 토큰이 포함되어 있는지 확인
  3. 세션이 자동으로 생성되는지 확인
  4. 에러 없이 마이페이지로 리디렉션되는지 확인

## 💾 데이터 저장 및 동기화 확인

### 5. 게임 기록 저장 테스트
- [ ] **레벨 클리어 후 Supabase 저장 확인**
  1. 로그인 상태에서 게임 플레이
  2. 레벨 클리어
  3. Supabase Dashboard > Table Editor > `game_records` 테이블 확인
  4. 기록이 저장되었는지 확인

- [ ] **최고 점수 업데이트 확인**
  1. 같은 레벨을 다시 플레이하여 더 높은 점수 획득
  2. Supabase에서 점수가 업데이트되었는지 확인

### 6. 데이터 동기화 확인
- [ ] **다른 기기에서 동기화 확인**
  1. 기기 A에서 게임 플레이 및 기록 저장
  2. 기기 B에서 같은 계정으로 로그인
  3. 기기 A의 기록이 기기 B에 표시되는지 확인

- [ ] **로컬 ↔ Supabase 동기화 확인**
  1. 로컬에서 레벨 클리어
  2. `syncProgress()` 함수가 정상 작동하는지 확인
  3. Supabase에 데이터가 동기화되는지 확인

## 📊 통계 및 마이페이지 확인

### 7. 사용자 통계 확인
- [ ] **마이페이지 통계 표시 확인**
  1. 로그인 후 마이페이지 접근
  2. 다음 통계가 표시되는지 확인:
     - 총 높이 (totalHeight)
     - 완등 문제 수 (totalSolved)
     - 최고 레벨 (maxLevel)
     - 주력 분야 (bestSubject)

- [ ] **RPC 함수 작동 확인**
  1. Supabase Dashboard > SQL Editor에서 `get_user_game_stats` 함수가 생성되어 있는지 확인
  2. 함수가 정상적으로 통계를 반환하는지 확인

## 🌐 프로덕션 환경 확인

### 8. 프로덕션 배포 후 확인
- [ ] **Vercel 배포 확인**
  1. `https://solve-climb.vercel.app`에서 앱이 정상 작동하는지 확인
  2. 콜백 URL이 프로덕션 도메인으로 설정되어 있는지 확인

- [ ] **프로덕션 환경 변수 확인**
  1. Vercel Dashboard > Settings > Environment Variables
  2. `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`가 설정되어 있는지 확인

- [ ] **프로덕션에서 인증 테스트**
  1. 프로덕션 URL에서 로그인 시도
  2. 콜백이 정상적으로 작동하는지 확인

## 🔒 보안 확인

### 9. 보안 설정 확인
- [ ] **Row Level Security (RLS) 확인**
  1. Supabase Dashboard > Authentication > Policies
  2. `game_records` 테이블의 RLS 정책이 활성화되어 있는지 확인
  3. 사용자가 자신의 데이터만 접근할 수 있는지 확인

- [ ] **환경 변수 보안 확인**
  1. `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
  2. 프로덕션 환경 변수가 안전하게 관리되고 있는지 확인

## 🐛 문제 해결

### 10. 일반적인 문제 확인
- [ ] **콜백 URL 오류**
  - 콜백 URL이 Supabase 대시보드에 정확히 등록되어 있는지 확인
  - URL에 오타나 슬래시 누락이 없는지 확인

- [ ] **세션 생성 실패**
  - 브라우저 콘솔에서 에러 메시지 확인
  - Supabase Dashboard > Authentication > Logs에서 에러 확인

- [ ] **데이터 저장 실패**
  - RLS 정책이 올바르게 설정되어 있는지 확인
  - 사용자 ID가 올바르게 전달되는지 확인

## 📝 추가 확인 사항

### 11. 로그아웃 기능 확인
- [ ] **로그아웃 테스트**
  1. 로그인 상태에서 로그아웃 클릭
  2. Supabase 세션이 제대로 삭제되는지 확인
  3. 로컬 세션도 삭제되는지 확인

### 12. 데이터 초기화 확인
- [ ] **데이터 초기화 테스트**
  1. 마이페이지에서 "초기화" 클릭
  2. Supabase의 `game_records` 테이블에서 데이터가 삭제되는지 확인
  3. 로컬 저장소도 초기화되는지 확인

## ✅ 최종 확인

모든 체크리스트를 완료한 후:
- [ ] 모든 테스트가 통과했는지 확인
- [ ] 프로덕션 환경에서도 정상 작동하는지 확인
- [ ] 사용자 경험이 원활한지 확인

---

## 문제 발생 시

문제가 발생하면:
1. 브라우저 콘솔에서 에러 메시지 확인
2. Supabase Dashboard > Logs에서 서버 로그 확인
3. 테스트 페이지의 상세 정보 확인
4. 필요시 Supabase 문서 참고: https://supabase.com/docs

