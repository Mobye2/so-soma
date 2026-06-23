
-- Tighten event_registrations INSERT: authenticated users must use own email
DROP POLICY IF EXISTS "Registrations can be inserted by anyone" ON public.event_registrations;
CREATE POLICY "Anon can insert registrations"
ON public.event_registrations FOR INSERT TO anon
WITH CHECK (true);
CREATE POLICY "Authenticated insert own registration"
ON public.event_registrations FOR INSERT TO authenticated
WITH CHECK (customer_email = auth.email());

-- Tighten quiz_results INSERT and add self-read
DROP POLICY IF EXISTS "Anyone can insert quiz results" ON public.quiz_results;
CREATE POLICY "Anon can insert quiz results"
ON public.quiz_results FOR INSERT TO anon
WITH CHECK (true);
CREATE POLICY "Authenticated insert own quiz result"
ON public.quiz_results FOR INSERT TO authenticated
WITH CHECK (email = auth.email());
CREATE POLICY "Users view own quiz results"
ON public.quiz_results FOR SELECT TO authenticated
USING (email = auth.email());
