GRANT SELECT, INSERT ON public.quiz_results TO authenticated;
GRANT SELECT, INSERT ON public.quiz_results TO anon;
GRANT ALL ON public.quiz_results TO service_role;

GRANT SELECT ON public.newsletter_subscribers TO authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;

GRANT SELECT ON public.launch_notify_subscribers TO authenticated;
GRANT ALL ON public.launch_notify_subscribers TO service_role;