-- Fix: products table has RLS policies but RLS was not enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
