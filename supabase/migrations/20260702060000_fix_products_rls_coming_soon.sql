-- 允許 coming_soon 商品也可被公開讀取
DROP POLICY IF EXISTS "products_public_read" ON products;

CREATE POLICY "products_public_read" ON products
  FOR SELECT
  USING (is_active = true OR coming_soon = true);
