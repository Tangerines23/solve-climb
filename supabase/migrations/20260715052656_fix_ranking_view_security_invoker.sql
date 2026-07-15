-- ranking_view의 security_invoker 옵션을 off로 설정하여
-- profiles 테이블의 RLS 제약에 가로막히지 않고 전체 랭킹 데이터를 정상 페치하도록 조치합니다.
-- 이 뷰는 애초에 stamina, minerals, last_login_at 등 민감 정보가 완전히 필터링되어 있어 공개되어도 철저히 안전합니다.
ALTER VIEW public.ranking_view SET (security_invoker = off);
