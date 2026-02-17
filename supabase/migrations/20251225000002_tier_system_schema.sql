-- ============================================================================
-- 티어 시스템 DB 스키마 마이그레이션
-- 작성일: 2025.12.25
-- ============================================================================

-- 1. profiles 테이블에 티어 시스템 컬럼 추가
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_mastery_score BIGINT DEFAULT 0,     -- 모든 테마 최고 점수 합산 (BIGINT: 무한 확장 가능) 💡 **확장성**
ADD COLUMN IF NOT EXISTS current_tier_level INTEGER DEFAULT 0,      -- 현재 티어 레벨 (0~6)
ADD COLUMN IF NOT EXISTS last_game_submit_at TIMESTAMP WITH TIME ZONE,  -- 마지막 게임 제출 시간 (Rate Limit용)
ADD COLUMN IF NOT EXISTS pending_cycle_score BIGINT DEFAULT 0,      -- 다음 사이클 전환 예정중인 점수 (강제 멈춤 방지) 💡 **UX 개선**
ADD COLUMN IF NOT EXISTS cycle_promotion_pending BOOLEAN DEFAULT false;  -- 다음 사이클 승급 예정 상태 (승급 애니메이션용) 💡 **UX 개선**

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
(1, '입산자', '🥾', 1000, '--color-tier-trail'),
(2, '중턱', '🧗', 5000, '--color-tier-mid'),
(3, '고지대', '🏔️', 20000, '--color-tier-high'),
(4, '봉우리', '⛰️', 50000, '--color-tier-peak'),
(5, '정상', '🚩', 100000, '--color-tier-summit'),
(6, '전설', '🏆', 250000, '--color-tier-legend')
ON CONFLICT (level) DO NOTHING;

-- RLS 설정
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
('tier_star_threshold', '5', '점수 표시를 별자리로 변경하는 기준')
ON CONFLICT (key) DO NOTHING;

-- RLS 설정
ALTER TABLE public.game_config ENABLE ROW LEVEL SECURITY;

-- 정책: 모든 사용자가 설정 조회 가능 (읽기 전용)
DROP POLICY IF EXISTS "Game config is viewable by everyone" ON public.game_config;
CREATE POLICY "Game config is viewable by everyone" 
  ON public.game_config FOR SELECT 
  USING (true);

-- 4. game_sessions 테이블 생성 (게임 세션 - 동시성 공격 방지 + 멱등성)
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'playing',  -- 'playing', 'completed', 'expired'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 minutes',
  score INTEGER,  -- 제출된 점수 (검증용)
  questions JSONB NOT NULL,  -- 게임 문제 정보 (정답 포함) 💡 **보안 이슈 - 서버 사이드 채점**
  result JSONB,  -- 처리 결과 저장 (멱등성 구현용) 💡 **UX 개선 - 네트워크 불안정 대비**
  category TEXT,  -- 카테고리 (테마)
  subject TEXT,   -- 주제
  level INTEGER,  -- 레벨
  game_mode TEXT  -- 게임 모드
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON public.game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON public.game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_game_sessions_expires_at ON public.game_sessions(expires_at);

-- 유저당 하나의 활성화 세션만 허용 (부정행위 방지용 인덱스)
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_session 
  ON public.game_sessions(user_id) 
  WHERE status = 'playing';

-- RLS 설정
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

-- 7. user_level_records 테이블 생성 (마스터리 저장) - 파티셔닝 적용
-- 💡 파티셔닝: 처음부터 파티셔닝 적용 (나중에 마이그레이션은 매우 어려움)
-- user_id 해시 기준으로 10개 파티션으로 분할
CREATE TABLE IF NOT EXISTS public.user_level_records (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_code SMALLINT NOT NULL,  -- 최적?? TEXT ?�??SMALLINT (?? 1=math_add, 2=eng_word)
  level INTEGER NOT NULL,
  mode_code SMALLINT NOT NULL,  -- 최적?? TEXT ?�??SMALLINT (1=timeattack, 2=survival)
  best_score INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- ???�마/?�벨/모드 ???�나??최고 기록�?존재
  UNIQUE(user_id, theme_code, level, mode_code),
  PRIMARY KEY (id, user_id)  -- ?�티?????�함
) PARTITION BY HASH (user_id);

-- ?�티???�성 (10�??�티??
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

-- 주석: ?�티?�닝 ?�략
COMMENT ON TABLE public.user_level_records IS 
  '?��?�??�마/?�벨/모드 최고 기록. 
   ?�️ 처음부???�티?�닝 ?�용 (user_id ?�시�?기�? 10�??�티??.
   ?�상 증�??? ?��? 1명당 최�? 800??(4?�마 × 2모드 × 100?�벨).
   ?�중???�티?�닝???�용?�는 것�? 매우 ?�려?��?�?처음부???�용 권장.';

-- ?�덱??추�? (조회 ?�능 최적??- ?�장???��?강화)
CREATE INDEX IF NOT EXISTS idx_user_level_records_user_id ON public.user_level_records(user_id);
CREATE INDEX IF NOT EXISTS idx_user_level_records_lookup ON public.user_level_records(user_id, theme_code, level, mode_code);

-- 복합 ?�덱??(?�주 ?�용?�는 조회 ?�턴 최적??
CREATE INDEX IF NOT EXISTS idx_user_level_records_user_theme_mode 
  ON public.user_level_records(user_id, theme_code, mode_code);

-- RLS ?�성??
ALTER TABLE public.user_level_records ENABLE ROW LEVEL SECURITY;

-- ?�책: ?�용?�는 ?�신??기록�?조회/?�정 가??
DROP POLICY IF EXISTS "Users can view own records" ON public.user_level_records;
CREATE POLICY "Users can view own records" 
  ON public.user_level_records FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own records" ON public.user_level_records;
CREATE POLICY "Users can update own records" 
  ON public.user_level_records FOR UPDATE 
  USING (auth.uid() = user_id);

-- 8. user_badges ?�이�??�성 (?�페?�리?�트 ?�장)
CREATE TABLE IF NOT EXISTS public.user_badges (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,  -- ?? 'math_master_v1', 'eng_master_v1'
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- ???��?가 같�? 뱃�?�?중복 ?�득?��? ?�음
  UNIQUE(user_id, badge_id)
);

-- ?�덱??추�?
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);

-- RLS ?�성??
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- ?�책: ?�용?�는 ?�신??뱃�?�?조회 가??
DROP POLICY IF EXISTS "Users can view own badges" ON public.user_badges;
CREATE POLICY "Users can view own badges" 
  ON public.user_badges FOR SELECT 
  USING (auth.uid() = user_id);

-- 9. badge_definitions ?�이�??�성 (뱃�? ?�의)
CREATE TABLE IF NOT EXISTS public.badge_definitions (
  id TEXT PRIMARY KEY,  -- ?? 'math_master_v1'
  name TEXT NOT NULL,   -- ?? '?�학?????�복??
  description TEXT,     -- ?? '?�칙?�산 모든 ?�벨 ?�리??
  emoji TEXT,           -- ?? '?���?
  theme_id TEXT NOT NULL,  -- ?? 'math_add'
  required_levels INTEGER[],  -- ?�수 ?�리???�벨 배열 (?? [1,2,3,4,5])
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS ?�성??
ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;

-- ?�책: 모든 ?�용?��? 뱃�? ?�의 조회 가??
DROP POLICY IF EXISTS "Badge definitions are viewable by everyone" ON public.badge_definitions;
CREATE POLICY "Badge definitions are viewable by everyone" 
  ON public.badge_definitions FOR SELECT 
  USING (true);

-- 10. security_audit_log ?�이�??�성 (보안 감사 로그)
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,  -- 'invalid_score', 'permission_denied', 'rate_limit_exceeded', 'system_error'
  event_data JSONB,
  ip_address INET,  -- ?�라?�언??IP (가?�한 경우)
  user_agent TEXT,  -- ?�라?�언??User-Agent (가?�한 경우)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ?�덱??추�? (조회 ?�능)
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type ON public.security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON public.security_audit_log(created_at);

-- RLS ?�성??
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- ?�책: ?�비????���?조회 가??(?�반 ?�용?�는 ?�근 불�?)
DROP POLICY IF EXISTS "Service role can view audit logs" ON public.security_audit_log;
CREATE POLICY "Service role can view audit logs" 
  ON public.security_audit_log FOR SELECT 
  USING (auth.jwt() ->> 'role' = 'service_role');

