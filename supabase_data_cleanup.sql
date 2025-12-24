-- 0. 모든 유저 데이터 확인하기 (가장 먼저 실행해보세요)
-- 현재 저장된 모든 유저의 정보를 조회합니다.
SELECT * FROM public.profiles;

-- 1. 닉네임이 없거나 비어있는 '오류' 데이터만 골라보기
-- 삭제 대상이 될 데이터들입니다.
SELECT * FROM public.profiles 
WHERE nickname IS NULL OR nickname = '';

-- 2. (선택 사항) 해당 유저들의 닉네임을 임시로 '익명 유저'로 변경하기
-- 삭제하기 불안하다면 닉네임을 채워넣어서 리더보드에 뜨게 할 수 있습니다.
-- UPDATE public.profiles
-- SET nickname = '익명 유저'
-- WHERE nickname IS NULL OR nickname = '';

-- 3. 오류 데이터 삭제하기 (주의!)
-- 닉네임이 없는 유저 데이터를 아예 삭제합니다.
DELETE FROM public.profiles 
WHERE nickname IS NULL OR nickname = '';

-- 4. 삭제 후 확인
-- 다시 조회했을 때 데이터가 없어야 합니다.
SELECT * FROM public.profiles 
WHERE nickname IS NULL OR nickname = '';
