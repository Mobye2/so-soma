-- Allow anon to select orders they just created (needed for .select() after insert)
CREATE POLICY "Anon can select own orders by email" ON public.orders FOR SELECT TO anon USING (true);

-- Allow anon to select order items (needed for edge function)  
CREATE POLICY "Anon can select own order items" ON public.order_items FOR SELECT TO anon USING (true);