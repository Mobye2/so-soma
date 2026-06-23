
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS author TEXT NOT NULL DEFAULT 'Kaia';
UPDATE public.blog_posts SET author = 'Kaia' WHERE author IS NULL OR author = '';
