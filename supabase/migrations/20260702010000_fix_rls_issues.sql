-- Fix 1: user_course_access 不應該完全公開
DROP POLICY IF EXISTS "anon_select_user_course_access" ON public.user_course_access;

CREATE POLICY "Users can view own course access"
  ON public.user_course_access FOR SELECT
  USING (
    user_id = (
      SELECT id::text FROM profiles
      WHERE supabase_auth_id = auth.uid()
      LIMIT 1
    )
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Fix 2: course_chapters 移除過於寬鬆的 public read policy
DROP POLICY IF EXISTS "public read chapters" ON public.course_chapters;

-- Fix 3: newsletter_subscribers 移除重複的 INSERT policy
DROP POLICY IF EXISTS "allow public insert" ON public.newsletter_subscribers;
