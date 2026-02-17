-- ?�늘??챌린지 ?�이�??�성
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

-- ?�덱??추�? (?�짜�?빠른 조회)
CREATE INDEX IF NOT EXISTS idx_today_challenges_date ON today_challenges(challenge_date);

-- RLS ?�책 (모든 ?�용?��? ?�기 가??
ALTER TABLE today_challenges ENABLE ROW LEVEL SECURITY;

-- ?�기 ?�책: 모든 ?�용?��? ?�늘??챌린지�??�을 ???�음
DROP POLICY IF EXISTS "Anyone can read today challenges" ON today_challenges;
CREATE POLICY "Anyone can read today challenges" ON today_challenges
  FOR SELECT USING (true);

-- ?�기 ?�책: ?�비????���??????�음 (Edge Function ?�는 관리자�?
-- ?�반 ?�용?�는 ?�기�?가??

-- updated_at ?�동 ?�데?�트 ?�리�?
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

