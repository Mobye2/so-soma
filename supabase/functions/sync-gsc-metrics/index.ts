import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://solisforest.com/";
const GATEWAY_BASE = "https://connector-gateway.lovable.dev/google_search_console/webmasters/v3";

interface GscRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

async function gscQuery(dimension: string, startDate: string, endDate: string): Promise<GscRow[]> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const GSC_KEY = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
  if (!GSC_KEY) throw new Error("GOOGLE_SEARCH_CONSOLE_API_KEY missing");

  const url = `${GATEWAY_BASE}/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GSC_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions: [dimension],
      rowLimit: 1000,
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`GSC ${dimension} [${res.status}]: ${text}`);
  const data = JSON.parse(text);
  return data.rows ?? [];
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const t0 = Date.now();
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const end = new Date();
    end.setUTCDate(end.getUTCDate() - 2); // GSC lag ~2 days
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 28);
    const startDate = fmtDate(start);
    const endDate = fmtDate(end);

    const [dailyRows, pageRows, queryRows] = await Promise.all([
      gscQuery("date", startDate, endDate),
      gscQuery("page", startDate, endDate),
      gscQuery("query", startDate, endDate),
    ]);

    let inserted = 0;

    if (dailyRows.length) {
      const payload = dailyRows.map((r) => ({
        date: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await supabase.from("seo_daily_metrics").upsert(payload, { onConflict: "date" });
      if (error) throw new Error(`daily upsert: ${error.message}`);
      inserted += payload.length;
    }

    // page/query: snapshot whole window per sync — use endDate as the snapshot date for aggregate
    if (pageRows.length) {
      const payload = pageRows.map((r) => ({
        date: endDate,
        page_url: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await supabase.from("seo_page_metrics").upsert(payload, { onConflict: "date,page_url" });
      if (error) throw new Error(`page upsert: ${error.message}`);
      inserted += payload.length;
    }

    if (queryRows.length) {
      const payload = queryRows.map((r) => ({
        date: endDate,
        query: r.keys[0],
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await supabase.from("seo_query_metrics").upsert(payload, { onConflict: "date,query" });
      if (error) throw new Error(`query upsert: ${error.message}`);
      inserted += payload.length;
    }

    await supabase.from("seo_sync_log").insert({
      status: "success",
      rows_inserted: inserted,
      duration_ms: Date.now() - t0,
    });

    return new Response(
      JSON.stringify({ success: true, rows_inserted: inserted, start: startDate, end: endDate }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("sync-gsc-metrics error:", msg);
    await supabase.from("seo_sync_log").insert({
      status: "error",
      error_message: msg,
      duration_ms: Date.now() - t0,
    });
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
