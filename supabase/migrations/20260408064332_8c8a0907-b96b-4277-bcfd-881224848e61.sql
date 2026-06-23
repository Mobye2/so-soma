-- Drop and recreate INSERT policies to explicitly include anon role
DROP POLICY IF EXISTS "Orders can be inserted by anyone" ON public.orders;
CREATE POLICY "Orders can be inserted by anyone" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Order items can be inserted by anyone" ON public.order_items;
CREATE POLICY "Order items can be inserted by anyone" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Registrations can be inserted by anyone" ON public.event_registrations;
CREATE POLICY "Registrations can be inserted by anyone" ON public.event_registrations FOR INSERT TO anon, authenticated WITH CHECK (true);