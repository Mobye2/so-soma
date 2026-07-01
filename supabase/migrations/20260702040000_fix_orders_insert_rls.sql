-- Fix orders/order_items INSERT: restrict to service_role only
DROP POLICY IF EXISTS "Service can insert orders" ON public.orders;
CREATE POLICY "Service can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service can insert order items" ON public.order_items;
CREATE POLICY "Service can insert order items"
  ON public.order_items FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
