-- Phase 1: Purchase Delivery System DB Migration

-- 1. products 加欄位
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS post_purchase_note  text,
  ADD COLUMN IF NOT EXISTS post_purchase_image text;

-- 2. product_deliverables
CREATE TABLE IF NOT EXISTS product_deliverables (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('video_course','ebook_url','event_info','live_link','download')),
  title       text NOT NULL,
  content     text,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 3. user_product_access
CREATE TABLE IF NOT EXISTS user_product_access (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text NOT NULL,
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_id    uuid REFERENCES orders(id) ON DELETE SET NULL,
  granted_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz,
  UNIQUE(user_id, product_id)
);

-- 4. 遷移 user_course_access → user_product_access
INSERT INTO user_product_access (id, user_id, product_id, order_id, granted_at, expires_at)
SELECT
  uca.id,
  uca.user_id,
  c.product_id,
  uca.order_id,
  uca.granted_at,
  uca.expires_at
FROM user_course_access uca
JOIN courses c ON c.id = uca.course_id
WHERE c.product_id IS NOT NULL
ON CONFLICT (user_id, product_id) DO NOTHING;

-- 5. 遷移現有課程 → product_deliverables
INSERT INTO product_deliverables (product_id, type, title, content, sort_order)
SELECT
  c.product_id,
  'video_course',
  p.title,
  c.slug,
  0
FROM courses c
JOIN products p ON p.id = c.product_id
WHERE c.product_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 6. RLS
ALTER TABLE user_product_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own product access"
  ON user_product_access FOR SELECT
  USING (user_id = auth.uid()::text OR auth.jwt() ->> 'email' = (
    SELECT email FROM auth.users WHERE id = auth.uid()
  ));

-- 使用 email-based RLS 與 Cognito 橋接一致
DROP POLICY IF EXISTS "Users can view own product access" ON user_product_access;
CREATE POLICY "Users can view own product access"
  ON user_product_access FOR SELECT
  USING (user_id = auth.uid()::text);

ALTER TABLE product_deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users with access can view deliverables"
  ON product_deliverables FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_product_access upa
      WHERE upa.user_id = auth.uid()::text
        AND upa.product_id = product_deliverables.product_id
        AND (upa.expires_at IS NULL OR upa.expires_at > now())
    )
  );

-- service role 可讀寫（Lambda 使用）
CREATE POLICY "Service role full access on user_product_access"
  ON user_product_access FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on product_deliverables"
  ON product_deliverables FOR ALL
  USING (auth.role() = 'service_role');

-- 7. 更新 admin triggers
-- 新 admin 加入時取得所有商品存取權
CREATE OR REPLACE FUNCTION grant_admin_all_products()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    INSERT INTO user_product_access (user_id, product_id, granted_at, expires_at)
    SELECT NEW.user_id, p.id, now(), NULL
    FROM products p
    ON CONFLICT (user_id, product_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_admin_role_granted_product ON user_roles;
CREATE TRIGGER on_admin_role_granted_product
  AFTER INSERT ON user_roles
  FOR EACH ROW EXECUTE FUNCTION grant_admin_all_products();

-- 新商品上架時自動給所有 admin
CREATE OR REPLACE FUNCTION grant_new_product_to_admins()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_product_access (user_id, product_id, granted_at, expires_at)
  SELECT r.user_id, NEW.id, now(), NULL
  FROM user_roles r
  WHERE r.role = 'admin'
  ON CONFLICT (user_id, product_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_product_created ON products;
CREATE TRIGGER on_product_created
  AFTER INSERT ON products
  FOR EACH ROW EXECUTE FUNCTION grant_new_product_to_admins();
