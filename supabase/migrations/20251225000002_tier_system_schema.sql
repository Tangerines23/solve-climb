-- ============================================================================
-- 티어 시스템 DB 스키마 마이그레이션
-- 작성일: 2025.12.25
-- ============================================================================

-- 1. profiles 테이블에 티어 시스템 컬럼 추가
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_mastery_score BIGINT DEFAULT 0,     -- 모든 테마 최고점 합산 (BIGINT: 무한 확장 대비) ⚠️ **확장성**
ADD COLUMN IF NOT EXISTS current_tier_level INTEGER DEFAULT 0,      -- 현재 티어 레벨 (0~6)
ADD COLUMN IF NOT EXISTS last_game_submit_at TIMESTAMP WITH TIME ZONE,  -- 마지막 게임 제출 시간 (Rate Limit용)
ADD COLUMN IF NOT EXISTS pending_cycle_score BIGINT DEFAULT 0,      -- 사이클 전환 대기 중인 점수 (강제 멈춤 시스템) ⚠️ **UX 개선**
ADD COLUMN IF NOT EXISTS cycle_promotion_pending BOOLEAN DEFAULT false;  -- 사이클 승급 대기 상태 (승급식 시스템) ⚠️ **UX 개선**

-- 2. tier_definitions 테이블 생성 (티어 정의 - 설정 중앙화)
CREATE TABLE IF NOT EXISTS public.tier_definitions (
  level INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  min_score INTEGER NOT NULL,
  color_var TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 초기 데이터
INSERT INTO public.tier_definitions (level, name, icon, min_score, color_var) VALUES
(0, '베이스캠프', '⛺', 0, '--color-tier-base'),
(1, '등산로', '🥾', 1000, '--color-tier-trail'),
(2, '중턱', '⛰️', 5000, '--color-tier-mid'),
(3, '고지대', '🏔️', 20000, '--color-tier-high'),
(4, '봉우리', '🦅', 50000, '--color-tier-peak'),
(5, '정상', '🚩', 100000, '--color-tier-summit'),
(6, '전설', '👑', 250000, '--color-tier-legend')
ON CONFLICT (level) DO NOTHING;

-- RLS 활성화
ALTER TABLE public.tier_definitions ENABLE ROW LEVEL SECURITY;

-- 정책: 모든 사용자가 티어 정의 조회 가능 (읽기 전용)
DROP POLICY IF EXISTS "Tier definitions are viewable by everyone" ON public.tier_definitions;
CREATE POLICY "Tier definitions are viewable by everyone" 
  ON public.tier_definitions FOR SELECT 
  USING (true);

-- 3. game_config 테이블 생성 (게임 설정 - 설정 중앙화)
CREATE TABLE IF NOT EXISTS public.game_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 초기 설정
INSERT INTO public.game_config (key, value, description) VALUES
('tier_cycle_cap', '250000', '1사이클 만점 점수'),
('tier_star_threshold', '5', '별 표시를 숫자로 변경하는 기준')
ON CONFLICT (key) DO NOTHING;

-- RLS 활성화
ALTER TABLE public.game_config ENABLE ROW LEVEL SECURITY;

-- 정책: 모든 사용자가 설정 조회 가능 (읽기 전용)
DROP POLICY IF EXISTS "Game config is viewable by everyone" ON public.game_config;
CREATE POLICY "Game config is viewable by everyone" 
  ON public.game_config FOR SELECT 
  USING (true);

-- 4. game_sessions 테이블 생성 (게임 세션 - 재전송 공격 방지 + 멱등성)
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'playing',  -- 'playing', 'completed', 'expired'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 minutes',
  score INTEGER,  -- 제출된 점수 (검증용)
  questions JSONB NOT NULL,  -- 게임 문제 정보 (정답 포함) ⚠️ **보안 필수 - 서버 사이드 채점용**
  result JSONB,  -- 처리 결과 저장 (멱등성 구현용) ⚠️ **UX 개선 - 네트워크 불안정 대응**
  category TEXT,  -- 카테고리 (테마)
  subject TEXT,   -- 주제
  level INTEGER,  -- 레벨
  game_mode TEXT  -- 게임 모드
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON public.game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON public.game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_game_sessions_expires_at ON public.game_sessions(expires_at);

-- 한 유저당 하나의 활성 세션만 허용 (부분 유니크 인덱스)
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_session 
  ON public.game_sessions(user_id) 
  WHERE status = 'playing';

-- RLS 활성화
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- 정책: 사용자는 자신의 세션만 조회 가능
DROP POLICY IF EXISTS "Users can view own sessions" ON public.game_sessions;
CREATE POLICY "Users can view own sessions" 
  ON public.game_sessions FOR SELECT 
  USING (auth.uid() = user_id);

-- 5. theme_mapping 테이블 생성 (성능 최적화)
CREATE TABLE IF NOT EXISTS public.theme_mapping (
  code SMALLINT PRIMARY KEY,
  theme_id TEXT NOT NULL UNIQUE,  -- 예: 'math_add', 'eng_word'
  name TEXT NOT NULL
);

-- 초기 데이터
INSERT INTO public.theme_mapping (code, theme_id, name) VALUES
(1, 'math_add', '수학 덧셈'),
(2, 'math_sub', '수학 뺄셈'),
(3, 'math_mul', '수학 곱셈'),
(4, 'math_div', '수학 나눗셈'),
(5, 'eng_word', '영어 단어'),
(6, 'logic_puzzle', '논리 퍼즐')
ON CONFLICT (code) DO NOTHING;

-- 6. mode_mapping 테이블 생성 (성능 최적화)
CREATE TABLE IF NOT EXISTS public.mode_mapping (
  code SMALLINT PRIMARY KEY,
  mode_id TEXT NOT NULL UNIQUE,  -- 'timeattack', 'survival'
  name TEXT NOT NULL
);

-- 초기 데이터
INSERT INTO public.mode_mapping (code, mode_id, name) VALUES
(1, 'timeattack', '타임어택'),
(2, 'survival', '서바이벌')
ON CONFLICT (code) DO NOTHING;

-- 7. user_level_records 테이블 생성 (마스터리 원장) - 파티셔닝 적용
-- ⚠️ 파티셔닝: 처음부터 파티셔닝 적용 (나중에 마이그레이션은 매우 어려움)
-- user_id 해시값 기준으로 10개 파티션으로 분할
CREATE TABLE IF NOT EXISTS public.user_level_records (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_code SMALLINT NOT NULL,  -- 최적화: TEXT 대신 SMALLINT (예: 1=math_add, 2=eng_word)
  level INTEGER NOT NULL,
  mode_code SMALLINT NOT NULL,  -- 최적화: TEXT 대신 SMALLINT (1=timeattack, 2=survival)
  best_score INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 한 테마/레벨/모드 당 하나의 최고 기록만 존재
  UNIQUE(user_id, theme_code, level, mode_code),
  PRIMARY KEY (id, user_id)  -- 파티션 키 포함
) PARTITION BY HASH (user_id);

-- 파티션 생성 (10개 파티션)
CREATE TABLE IF NOT EXISTS public.user_level_records_0 PARTITION OF public.user_level_records
  FOR VALUES WITH (MODULUS 10, REMAINDER 0);
CREATE TABLE IF NOT EXISTS public.user_level_records_1 PARTITION OF public.user_level_records
  FOR VALUES WITH (MODULUS 10, REMAINDER 1);
CREATE TABLE IF NOT EXISTS public.user_level_records_2 PARTITION OF public.user_level_records
  FOR VALUES WITH (MODULUS 10, REMAINDER 2);
CREATE TABLE IF NOT EXISTS public.user_level_records_3 PARTITION OF public.user_level_records
  FOR VALUES WITH (MODULUS 10, REMAINDER 3);
CREATE TABLE IF NOT EXISTS public.user_level_records_4 PARTITION OF public.user_level_records
  FOR VALUES WITH (MODULUS 10, REMAINDER 4);
CREATE TABLE IF NOT EXISTS public.user_level_records_5 PARTITION OF public.user_level_records
  FOR VALUES WITH (MODULUS 10, REMAINDER 5);
CREATE TABLE IF NOT EXISTS public.user_level_records_6 PARTITION OF public.user_level_records
  FOR VALUES WITH (MODULUS 10, REMAINDER 6);
CREATE TABLE IF NOT EXISTS public.user_level_records_7 PARTITION OF public.user_level_records
  FOR VALUES WITH (MODULUS 10, REMAINDER 7);
CREATE TABLE IF NOT EXISTS public.user_level_records_8 PARTITION OF public.user_level_records
  FOR VALUES WITH (MODULUS 10, REMAINDER 8);
CREATE TABLE IF NOT EXISTS public.user_level_records_9 PARTITION OF public.user_level_records
  FOR VALUES WITH (MODULUS 10, REMAINDER 9);

-- 주석: 파티셔닝 전략
COMMENT ON TABLE public.user_level_records IS 
  '유저별 테마/레벨/모드 최고 기록. 
   ⚠️ 처음부터 파티셔닝 적용 (user_id 해시값 기준 10개 파티션).
   예상 증가량: 유저 1명당 최대 800행 (4테마 × 2모드 × 100레벨).
   나중에 파티셔닝을 적용하는 것은 매우 어려우므로 처음부터 적용 권장.';

-- 인덱스 추가 (조회 성능 최적화 - 확장성 대비 강화)
CREATE INDEX IF NOT EXISTS idx_user_level_records_user_id ON public.user_level_records(user_id);
CREATE INDEX IF NOT EXISTS idx_user_level_records_lookup ON public.user_level_records(user_id, theme_code, level, mode_code);

-- 복합 인덱스 (자주 사용되는 조회 패턴 최적화)
CREATE INDEX IF NOT EXISTS idx_user_level_records_user_theme_mode 
  ON public.user_level_records(user_id, theme_code, mode_code);

-- RLS 활성화
ALTER TABLE public.user_level_records ENABLE ROW LEVEL SECURITY;

-- 정책: 사용자는 자신의 기록만 조회/수정 가능
DROP POLICY IF EXISTS "Users can view own records" ON public.user_level_records;
CREATE POLICY "Users can view own records" 
  ON public.user_level_records FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own records" ON public.user_level_records;
CREATE POLICY "Users can update own records" 
  ON public.user_level_records FOR UPDATE 
  USING (auth.uid() = user_id);

-- 8. user_badges 테이블 생성 (스페셜리스트 훈장)
CREATE TABLE IF NOT EXISTS public.user_badges (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,  -- 예: 'math_master_v1', 'eng_master_v1'
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 한 유저가 같은 뱃지를 중복 획득하지 않음
  UNIQUE(user_id, badge_id)
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);

-- RLS 활성화
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- 정책: 사용자는 자신의 뱃지만 조회 가능
DROP POLICY IF EXISTS "Users can view own badges" ON public.user_badges;
CREATE POLICY "Users can view own badges" 
  ON public.user_badges FOR SELECT 
  USING (auth.uid() = user_id);

-- 9. badge_definitions 테이블 생성 (뱃지 정의)
CREATE TABLE IF NOT EXISTS public.badge_definitions (
  id TEXT PRIMARY KEY,  -- 예: 'math_master_v1'
  name TEXT NOT NULL,   -- 예: '수학의 산 정복자'
  description TEXT,     -- 예: '사칙연산 모든 레벨 클리어'
  emoji TEXT,           -- 예: '🏔️'
  theme_id TEXT NOT NULL,  -- 예: 'math_add'
  required_levels INTEGER[],  -- 필수 클리어 레벨 배열 (예: [1,2,3,4,5])
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;

-- 정책: 모든 사용자가 뱃지 정의 조회 가능
DROP POLICY IF EXISTS "Badge definitions are viewable by everyone" ON public.badge_definitions;
CREATE POLICY "Badge definitions are viewable by everyone" 
  ON public.badge_definitions FOR SELECT 
  USING (true);

-- 10. security_audit_log 테이블 생성 (보안 감사 로그)
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,  -- 'invalid_score', 'permission_denied', 'rate_limit_exceeded', 'system_error'
  event_data JSONB,
  ip_address INET,  -- 클라이언트 IP (가능한 경우)
  user_agent TEXT,  -- 클라이언트 User-Agent (가능한 경우)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 추가 (조회 성능)
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type ON public.security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON public.security_audit_log(created_at);

-- RLS 활성화
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- 정책: 서비스 역할만 조회 가능 (일반 사용자는 접근 불가)
DROP POLICY IF EXISTS "Service role can view audit logs" ON public.security_audit_log;
CREATE POLICY "Service role can view audit logs" 
  ON public.security_audit_log FOR SELECT 
  USING (auth.jwt() ->> 'role' = 'service_role');

