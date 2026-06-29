-- Allow admins to insert/update/delete user_product_access
DROP POLICY IF EXISTS "Admins can manage user_product_access" ON user_product_access;

CREATE POLICY "Admins can manage user_product_access"
  ON user_product_access FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id::uuid = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id::uuid = auth.uid()
      AND role = 'admin'
    )
  );
