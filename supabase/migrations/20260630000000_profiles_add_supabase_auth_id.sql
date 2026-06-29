-- profiles 加入 supabase_auth_id 欄位，對應 auth.users.id
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS supabase_auth_id uuid;
CREATE INDEX IF NOT EXISTS profiles_supabase_auth_id_idx ON profiles(supabase_auth_id);

-- 修正 user_product_access RLS，透過 supabase_auth_id 對應 Cognito sub
DROP POLICY IF EXISTS "Users can view own product access" ON user_product_access;

CREATE POLICY "Users can view own product access"
  ON user_product_access FOR SELECT
  USING (
    user_id = (
      SELECT id::text FROM profiles
      WHERE supabase_auth_id = auth.uid()
      LIMIT 1
    )
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id::uuid = auth.uid()
      AND role = 'admin'
    )
  );
