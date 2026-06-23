
-- Step 1: Tighten orders anon SELECT policy
DROP POLICY IF EXISTS "Anon can select own orders by email" ON public.orders;
CREATE POLICY "Anon can select recent own orders"
  ON public.orders FOR SELECT TO anon
  USING (created_at > now() - interval '5 minutes');

-- Step 2: Tighten order_items anon SELECT policy
DROP POLICY IF EXISTS "Anon can select own order items" ON public.order_items;
CREATE POLICY "Anon can select recent own order items"
  ON public.order_items FOR SELECT TO anon
  USING (created_at > now() - interval '5 minutes');
