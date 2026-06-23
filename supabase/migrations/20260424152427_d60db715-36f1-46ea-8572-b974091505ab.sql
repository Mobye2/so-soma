CREATE TABLE public.quiz_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  state_key TEXT NOT NULL,
  state_name TEXT NOT NULL,
  state_title TEXT NOT NULL,
  dim_body INTEGER NOT NULL,
  dim_emotion INTEGER NOT NULL,
  dim_thought INTEGER NOT NULL,
  dim_behavior INTEGER NOT NULL,
  dim_social INTEGER NOT NULL,
  pct_sym INTEGER NOT NULL,
  pct_dor INTEGER NOT NULL,
  pct_ven INTEGER NOT NULL,
  avg_well INTEGER NOT NULL,
  raw_answers JSONB,
  source TEXT DEFAULT 'website',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert quiz results"
ON public.quiz_results
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view all quiz results"
ON public.quiz_results
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_quiz_results_email ON public.quiz_results(email);
CREATE INDEX idx_quiz_results_created_at ON public.quiz_results(created_at DESC);