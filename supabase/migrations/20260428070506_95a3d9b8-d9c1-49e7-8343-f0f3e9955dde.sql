-- Remove overly permissive anon SELECT policies that exposed all recent customer orders
DROP POLICY IF EXISTS "Anon can select recent own orders" ON public.orders;
DROP POLICY IF EXISTS "Anon can select recent own order items" ON public.order_items;

-- Lock down newsletter subscriber email list to admins only (read)
CREATE POLICY "Admins can view newsletter subscribers"
ON public.newsletter_subscribers
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));