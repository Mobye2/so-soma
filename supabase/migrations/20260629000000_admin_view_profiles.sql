-- Replace profiles SELECT policy to allow admins to read all profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles selectable by owner or admin" ON public.profiles;

CREATE POLICY "Profiles selectable by owner or admin"
  ON public.profiles FOR SELECT
  USING (
    (id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id::uuid = auth.uid()
      AND role = 'admin'
    )
  );
