-- Fix profiles RLS: id is Cognito sub (text), auth.uid() is Supabase UUID
-- Must compare auth.uid() against supabase_auth_id, not id

DROP POLICY IF EXISTS "Profiles selectable by owner or admin" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Profiles selectable by owner or admin"
  ON public.profiles FOR SELECT
  USING (
    supabase_auth_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (supabase_auth_id = auth.uid());
