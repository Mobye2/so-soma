-- 修正 uuid → text cast
CREATE OR REPLACE FUNCTION grant_new_product_to_admins()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_product_access (user_id, product_id, granted_at, expires_at)
  SELECT r.user_id::text, NEW.id, now(), NULL
  FROM user_roles r
  WHERE r.role = 'admin'
  ON CONFLICT (user_id, product_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION grant_admin_all_products()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    INSERT INTO user_product_access (user_id, product_id, granted_at, expires_at)
    SELECT NEW.user_id::text, p.id, now(), NULL
    FROM products p
    ON CONFLICT (user_id, product_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
