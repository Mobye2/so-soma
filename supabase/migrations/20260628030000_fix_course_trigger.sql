CREATE OR REPLACE FUNCTION grant_new_product_to_admins()
RETURNS TRIGGER AS $$
BEGIN
  -- courses INSERT 時，用 product_id 授權給所有 admin
  IF NEW.product_id IS NOT NULL THEN
    INSERT INTO user_product_access (user_id, product_id, granted_at, expires_at)
    SELECT r.user_id::text, NEW.product_id, now(), NULL
    FROM user_roles r
    WHERE r.role = 'admin'
    ON CONFLICT (user_id, product_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
