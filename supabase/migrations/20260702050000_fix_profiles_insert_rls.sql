-- Fix profiles INSERT: restrict to service_role only
DROP POLICY IF EXISTS "Allow sync_auth to insert profiles" ON public.profiles;
CREATE POLICY "Allow sync_auth to insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
