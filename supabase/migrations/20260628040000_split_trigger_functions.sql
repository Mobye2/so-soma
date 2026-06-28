-- products INSERT: 用 NEW.id 直接授權
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

-- courses INSERT: 用 NEW.product_id 授權（product_id 可能為 null）
CREATE OR REPLACE FUNCTION grant_new_course_product_to_admins()
RETURNS TRIGGER AS $$
BEGIN
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

-- 重建 courses trigger 用新 function
DROP TRIGGER IF EXISTS on_course_created ON courses;
CREATE TRIGGER on_course_created
  AFTER INSERT ON courses
  FOR EACH ROW EXECUTE FUNCTION grant_new_course_product_to_admins();
