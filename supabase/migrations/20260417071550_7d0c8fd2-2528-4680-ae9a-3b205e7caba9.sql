-- Create launch_notify_subscribers table
CREATE TABLE public.launch_notify_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  product_name TEXT NOT NULL,
  notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_launch_notify_email ON public.launch_notify_subscribers(email);
CREATE INDEX idx_launch_notify_product ON public.launch_notify_subscribers(product_name);

ALTER TABLE public.launch_notify_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe to launch notify"
ON public.launch_notify_subscribers
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view all launch notify subscribers"
ON public.launch_notify_subscribers
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update launch notify subscribers"
ON public.launch_notify_subscribers
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));