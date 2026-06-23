-- Create ig_posts table for Instagram-embedded blog content
CREATE TABLE public.ig_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ig_url TEXT NOT NULL,
  ig_shortcode TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT,
  categories TEXT[] NOT NULL DEFAULT '{}',
  post_date DATE NOT NULL DEFAULT CURRENT_DATE,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ig_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read published posts
CREATE POLICY "Published IG posts are viewable by everyone"
ON public.ig_posts
FOR SELECT
USING (published = true);

-- Admins can read all (incl. drafts)
CREATE POLICY "Admins can view all IG posts"
ON public.ig_posts
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert
CREATE POLICY "Admins can insert IG posts"
ON public.ig_posts
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update
CREATE POLICY "Admins can update IG posts"
ON public.ig_posts
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete
CREATE POLICY "Admins can delete IG posts"
ON public.ig_posts
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Auto-update updated_at
CREATE TRIGGER update_ig_posts_updated_at
BEFORE UPDATE ON public.ig_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_ig_posts_published_date ON public.ig_posts (published, post_date DESC);