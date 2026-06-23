
-- Replace permissive INSERT policy on orders
DROP POLICY IF EXISTS "Orders can be inserted by anyone" ON public.orders;

CREATE POLICY "Guests can insert orders"
ON public.orders
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Authenticated users insert orders with own email"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (customer_email = auth.email());

-- Replace permissive INSERT policy on order_items
DROP POLICY IF EXISTS "Order items can be inserted by anyone" ON public.order_items;

CREATE POLICY "Guests insert items into recent guest orders"
ON public.order_items
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.created_at > now() - interval '10 minutes'
  )
);

CREATE POLICY "Authenticated users insert items into own orders"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.customer_email = auth.email()
  )
);
