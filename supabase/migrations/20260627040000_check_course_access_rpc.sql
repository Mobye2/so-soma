-- RPC: check if user has access to a course (via user_product_access)
CREATE OR REPLACE FUNCTION check_course_access(p_user_id text, p_course_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_product_access upa
    JOIN courses c ON c.product_id = upa.product_id
    WHERE upa.user_id = p_user_id
      AND c.id = p_course_id
      AND (upa.expires_at IS NULL OR upa.expires_at > now())
  );
$$ LANGUAGE sql SECURITY DEFINER;
