
CREATE TABLE public.seo_daily_metrics (
  date DATE PRIMARY KEY,
  clicks INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  ctr NUMERIC NOT NULL DEFAULT 0,
  position NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.seo_page_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  page_url TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  ctr NUMERIC NOT NULL DEFAULT 0,
  position NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (date, page_url)
);
CREATE INDEX idx_seo_page_metrics_date ON public.seo_page_metrics(date DESC);

CREATE TABLE public.seo_query_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  query TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  ctr NUMERIC NOT NULL DEFAULT 0,
  position NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (date, query)
);
CREATE INDEX idx_seo_query_metrics_date ON public.seo_query_metrics(date DESC);

CREATE TABLE public.seo_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL,
  error_message TEXT,
  rows_inserted INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER
);
CREATE INDEX idx_seo_sync_log_synced ON public.seo_sync_log(synced_at DESC);

ALTER TABLE public.seo_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_page_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_query_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read seo_daily_metrics" ON public.seo_daily_metrics FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Service write seo_daily_metrics" ON public.seo_daily_metrics FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Admins read seo_page_metrics" ON public.seo_page_metrics FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Service write seo_page_metrics" ON public.seo_page_metrics FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Admins read seo_query_metrics" ON public.seo_query_metrics FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Service write seo_query_metrics" ON public.seo_query_metrics FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Admins read seo_sync_log" ON public.seo_sync_log FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Service write seo_sync_log" ON public.seo_sync_log FOR ALL TO service_role USING (true) WITH CHECK (true);
