-- 오늘의 챌린지 테이블 생성
CREATE TABLE IF NOT EXISTS today_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date DATE UNIQUE NOT NULL,
  category_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  topic_name TEXT NOT NULL,
  level INTEGER NOT NULL,
  mode TEXT NOT NULL DEFAULT 'time_attack',
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 추가 (날짜로 빠른 조회)
CREATE INDEX IF NOT EXISTS idx_today_challenges_date ON today_challenges(challenge_date);

-- RLS 정책 (모든 사용자가 읽기 가능)
ALTER TABLE today_challenges ENABLE ROW LEVEL SECURITY;

-- 읽기 정책: 모든 사용자가 오늘의 챌린지를 읽을 수 있음
DROP POLICY IF EXISTS "Anyone can read today challenges" ON today_challenges;
CREATE POLICY "Anyone can read today challenges" ON today_challenges
  FOR SELECT USING (true);

-- 쓰기 정책: 서비스 역할만 쓸 수 있음 (Edge Function 또는 관리자만)
-- 일반 사용자는 읽기만 가능

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_today_challenges_updated_at ON today_challenges;
CREATE TRIGGER update_today_challenges_updated_at
  BEFORE UPDATE ON today_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

