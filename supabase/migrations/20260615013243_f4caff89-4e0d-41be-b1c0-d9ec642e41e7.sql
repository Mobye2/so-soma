
-- Remove guest direct-insert policies; orders/items now created server-side via create-order edge function
DROP POLICY IF EXISTS "Guests can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Guests insert items into recent guest orders" ON public.order_items;

-- Admin read access to suppression list
CREATE POLICY "Admins can view suppressed emails"
  ON public.suppressed_emails
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
