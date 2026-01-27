-- Enable RLS on all user_level_records partitions
-- Although they inherit from parent, enabling it explicitly ensures the validation script passes and is safer.

ALTER TABLE public.user_level_records_0 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_level_records_1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_level_records_2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_level_records_3 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_level_records_4 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_level_records_5 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_level_records_6 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_level_records_7 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_level_records_8 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_level_records_9 ENABLE ROW LEVEL SECURITY;
