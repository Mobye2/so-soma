-- Trigger 1: 新 admin 加入 user_roles 時，自動取得所有課程
CREATE OR REPLACE FUNCTION grant_admin_all_courses()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    INSERT INTO user_course_access (id, user_id, course_id, order_id, granted_at, expires_at)
    SELECT gen_random_uuid(), NEW.user_id, c.id, NULL, now(), NULL
    FROM courses c
    WHERE c.id NOT IN (
      SELECT course_id FROM user_course_access WHERE user_id = NEW.user_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_admin_role_granted ON user_roles;
CREATE TRIGGER on_admin_role_granted
  AFTER INSERT ON user_roles
  FOR EACH ROW EXECUTE FUNCTION grant_admin_all_courses();


-- Trigger 2: 新課程建立時，自動給所有現有 admin
CREATE OR REPLACE FUNCTION grant_new_course_to_admins()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_course_access (id, user_id, course_id, order_id, granted_at, expires_at)
  SELECT gen_random_uuid(), r.user_id, NEW.id, NULL, now(), NULL
  FROM user_roles r
  WHERE r.role = 'admin'
  AND r.user_id NOT IN (
    SELECT user_id FROM user_course_access WHERE course_id = NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_course_created ON courses;
CREATE TRIGGER on_course_created
  AFTER INSERT ON courses
  FOR EACH ROW EXECUTE FUNCTION grant_new_course_to_admins();
