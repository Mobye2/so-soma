-- Fix user_product_access RLS policy to use auth.uid() instead of auth.jwt()
-- auth.uid() works with custom fetch token injection, auth.jwt() returns NULL

DROP POLICY IF EXISTS "Users can view own product access" ON user_product_access;

CREATE POLICY "Users can view own product access"
ON user_product_access FOR SELECT
USING (
  user_id = (
    SELECT id::text 
    FROM profiles 
    WHERE supabase_auth_id = auth.uid()
    LIMIT 1
  )
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
);
