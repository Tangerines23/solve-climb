-- 안전한 조회 전용 쿼리입니다. (삭제 명령 없음)
-- 이 파일의 내용은 실행해도 데이터가 삭제되지 않습니다.

-- 1. 모든 유저 정보 조회
SELECT * FROM public.profiles;

-- 2. 닉네임이 없는 유저(오류 데이터)만 조회
SELECT * FROM public.profiles 
WHERE nickname IS NULL OR nickname = '';
