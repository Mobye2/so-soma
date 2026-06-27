-- 修正 orders/order_items RLS
-- 原本用 (SELECT email FROM auth.users WHERE id = auth.uid()) 但 auth.users 沒有 Cognito user
-- 改用 auth.jwt() ->> 'email' 直接從 JWT payload 取 email

-- Orders
DROP POLICY IF EXISTS "Users can view own orders by email" ON public.orders;

CREATE POLICY "Users can view own orders by email"
  ON public.orders FOR SELECT
  USING (
    customer_email = (auth.jwt() ->> 'email') OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Order Items
DROP POLICY IF EXISTS "Users can view own order items by email" ON public.order_items;

CREATE POLICY "Users can view own order items by email"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (
        orders.customer_email = (auth.jwt() ->> 'email') OR
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      )
    )
  );
