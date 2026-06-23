
-- Fix orders SELECT policies: use auth.email() instead of subquery on auth.users
DROP POLICY "Users view own orders" ON public.orders;
CREATE POLICY "Users view own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (customer_email = auth.email());

DROP POLICY "Admins view all orders" ON public.orders;
CREATE POLICY "Admins view all orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Fix event_registrations SELECT policies
DROP POLICY "Users view own registrations" ON public.event_registrations;
CREATE POLICY "Users view own registrations"
  ON public.event_registrations
  FOR SELECT
  TO authenticated
  USING (customer_email = auth.email());

DROP POLICY "Admins view all registrations" ON public.event_registrations;
CREATE POLICY "Admins view all registrations"
  ON public.event_registrations
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Fix order_items SELECT policies
DROP POLICY "Users view own order items" ON public.order_items;
CREATE POLICY "Users view own order items"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.orders
      WHERE customer_email = auth.email()
    )
  );

DROP POLICY "Admins view all order items" ON public.order_items;
CREATE POLICY "Admins view all order items"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
