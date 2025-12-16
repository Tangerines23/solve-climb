-- 게임 로그인 마이그레이션 테이블 생성
-- 토스 로그인 userKey와 게임 로그인 hash를 매핑하는 테이블

CREATE TABLE IF NOT EXISTS user_migrations (
  -- 게임 로그인 hash (기본 키)
  hash TEXT PRIMARY KEY,
  
  -- 토스 로그인 userKey
  toss_user_key BIGINT NOT NULL,
  
  -- 생성 시간
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 업데이트 시간
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 고유 제약: 동일한 userKey는 하나의 hash만 가질 수 있음
  CONSTRAINT unique_toss_user_key UNIQUE (toss_user_key)
);

-- 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_user_migrations_toss_user_key ON user_migrations(toss_user_key);
CREATE INDEX IF NOT EXISTS idx_user_migrations_created_at ON user_migrations(created_at);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 업데이트 트리거
DROP TRIGGER IF EXISTS update_user_migrations_updated_at ON user_migrations;
CREATE TRIGGER update_user_migrations_updated_at
  BEFORE UPDATE ON user_migrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 정책 설정
ALTER TABLE user_migrations ENABLE ROW LEVEL SECURITY;

-- Service Role만 접근 가능하도록 정책 설정
-- (Edge Functions에서 Service Role Key로 접근)
CREATE POLICY "Service role can manage user_migrations"
  ON user_migrations
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 주석 추가
COMMENT ON TABLE user_migrations IS '토스 로그인 userKey와 게임 로그인 hash 매핑 테이블';
COMMENT ON COLUMN user_migrations.hash IS '게임 로그인 hash (getUserKeyForGame으로 발급)';
COMMENT ON COLUMN user_migrations.toss_user_key IS '토스 로그인 userKey';
COMMENT ON COLUMN user_migrations.created_at IS '매핑 생성 시간';
COMMENT ON COLUMN user_migrations.updated_at IS '매핑 업데이트 시간';
