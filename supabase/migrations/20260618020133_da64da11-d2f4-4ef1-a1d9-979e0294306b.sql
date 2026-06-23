DROP POLICY IF EXISTS "Users view own quiz results" ON public.quiz_results;
REVOKE SELECT ON public.quiz_results FROM anon, authenticated;
GRANT INSERT ON public.quiz_results TO anon, authenticated;