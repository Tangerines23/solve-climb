-- ============================================================================
-- Solve-Climb Local Development Seed Data
-- ============================================================================

-- 0. Dummy Auth Users (Required for Foreign Key Constraints)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, confirmation_token)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'pro@example.com', '', now(), 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', ''),
  ('00000000-0000-0000-0000-000000000002', 'solve@example.com', '', now(), 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', ''),
  ('00000000-0000-0000-0000-000000000003', 'begin@example.com', '', now(), 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', '')
ON CONFLICT (id) DO NOTHING;

-- 1. Initialize Shop Items
SELECT public.restore_default_items();

-- 2. Seed Badge Definitions
SELECT public.debug_seed_badge_definitions('[
  {"id": "first_climb", "name": "First Climb", "description": "첫 번째 등반을 완료했습니다.", "emoji": "🧗", "theme_id": "math"},
  {"id": "perfect_score", "name": "Perfect 100", "description": "100점을 달성했습니다.", "emoji": "💯", "theme_id": "math"},
  {"id": "marathoner", "name": "Marathoner", "description": "100문제를 풀었습니다.", "emoji": "🏃", "theme_id": "math"}
]'::jsonb);

-- 3. Create dummy profiles for ranking visibility
INSERT INTO public.profiles (id, nickname, avatar_url, bio, coins, mastery_exp, level, stamina)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'ProClimber', 'https://api.dicebear.com/7.x/avataaars/svg?seed=1', 'Climbing to the top!', 5000, 1500, 10, 100),
  ('00000000-0000-0000-0000-000000000002', 'SolveMaster', 'https://api.dicebear.com/7.x/avataaars/svg?seed=2', 'Math is fun.', 2000, 800, 5, 80),
  ('00000000-0000-0000-0000-000000000003', 'BeginnerJo', 'https://api.dicebear.com/7.x/avataaars/svg?seed=3', 'Just started.', 100, 50, 1, 50)
ON CONFLICT (id) DO UPDATE SET
  nickname = EXCLUDED.nickname,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  coins = EXCLUDED.coins,
  mastery_exp = EXCLUDED.mastery_exp,
  level = EXCLUDED.level,
  stamina = EXCLUDED.stamina;

-- 4. Add some game records
INSERT INTO public.game_records (user_id, category, subject, level, mode, score, cleared, cleared_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'math', 'add', 1, 'time-attack', 1250, true, now()),
  ('00000000-0000-0000-0000-000000000001', 'math', 'add', 2, 'time-attack', 1500, true, now()),
  ('00000000-0000-0000-0000-000000000002', 'math', 'sub', 1, 'survival', 800, true, now())
ON CONFLICT (user_id, category, subject, level, mode) DO NOTHING;

-- 5. Initialize Daily Challenges
INSERT INTO public.today_challenges (challenge_date, category_id, category_name, topic_id, topic_name, level, mode, title)
VALUES 
  (CURRENT_DATE, 'math', 'Arithmetic', 'add', 'Addition', 5, 'time-attack', 'Daily Addition Challenge'),
  (CURRENT_DATE + 1, 'math', 'Arithmetic', 'sub', 'Subtraction', 3, 'survival', 'Survival Subtraction')
ON CONFLICT (challenge_date) DO NOTHING;

-- 6. Seed User Badges
INSERT INTO public.user_badges (user_id, badge_id)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'first_climb'),
  ('00000000-0000-0000-0000-000000000002', 'first_climb')
ON CONFLICT DO NOTHING;

-- 7. Seed Theme Mapping (If needed by logic)
INSERT INTO public.theme_mapping (code, theme_id, category, name)
VALUES 
  (1, 'math_add', 'math', '덧셈'),
  (2, 'math_sub', 'math', '뺄셈'),
  (3, 'math_mul', 'math', '곱셈'),
  (4, 'math_div', 'math', '나눗셈'),
  (5, 'eng_word', 'english', '영어 단어'),
  (6, 'logic_puzzle', 'logic', '논리 퍼즐'),
  (7, 'math_arithmetic', 'math', '사칙연산'),
  (8, 'math_equations', 'math', '방정식')
ON CONFLICT (code) DO UPDATE SET
  theme_id = EXCLUDED.theme_id,
  category = EXCLUDED.category,
  name = EXCLUDED.name;

