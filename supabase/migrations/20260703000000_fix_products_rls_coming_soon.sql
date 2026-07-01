-- Fix products RLS: allow public to see active OR coming_soon products
DROP POLICY IF EXISTS "Active products viewable by everyone" ON public.products;

CREATE POLICY "Active products viewable by everyone"
  ON public.products FOR SELECT
  USING (is_active = true OR coming_soon = true);
