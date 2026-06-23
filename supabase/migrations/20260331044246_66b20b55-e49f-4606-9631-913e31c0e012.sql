ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'ecpay';

-- Allow orders to be updated (for payment callback)
CREATE POLICY "Orders can be updated by service role"
ON public.orders FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);