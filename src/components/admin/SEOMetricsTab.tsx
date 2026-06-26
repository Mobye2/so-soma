import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiPost } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";  // Keep for functions.invoke
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { toast } from "sonner";

interface DailyRow { date: string; clicks: number; impressions: number; ctr: number; position: number; }
interface PageRow { date: string; page_url: string; clicks: number; impressions: number; ctr: number; position: number; }
interface QueryRow { date: string; query: string; clicks: number; impressions: number; ctr: number; position: number; }
interface SyncLog { synced_at: string; status: string; error_message: string | null; rows_inserted: number; }

const fmtPct = (n: number) => `${(n * 100).toFixed(2)}%`;
const fmtPos = (n: number) => n.toFixed(1);

const SEOMetricsTab = () => {
  const { getIdToken } = useAuth();
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [pages, setPages] = useState<PageRow[]>([]);
  const [queries, setQueries] = useState<QueryRow[]>([]);
  const [lastSync, setLastSync] = useState<SyncLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    setLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - 60);
    const sinceStr = since.toISOString().slice(0, 10);

    try {
      const token = await getIdToken();
      const [d, p, q, l] = await Promise.all([
        apiPost("/admin-db", { method: "GET", table: `seo_daily_metrics?date=gte.${sinceStr}&order=date` }, token || undefined),
        apiPost("/admin-db", { method: "GET", table: "seo_page_metrics?order=date.desc,clicks.desc&limit=200" }, token || undefined),
        apiPost("/admin-db", { method: "GET", table: "seo_query_metrics?order=date.desc,clicks.desc&limit=200" }, token || undefined),
        apiPost("/admin-db", { method: "GET", table: "seo_sync_log?order=synced_at.desc&limit=1" }, token || undefined),
      ]);
      if (d) setDaily(Array.isArray(d) ? d as DailyRow[] : []);
      if (p) {
        const pArray = Array.isArray(p) ? p as PageRow[] : [];
        const latestDate = pArray[0]?.date;
        setPages(pArray.filter((r) => r.date === latestDate));
      }
      if (q) {
        const qArray = Array.isArray(q) ? q as QueryRow[] : [];
        const latestDate = qArray[0]?.date;
        setQueries(qArray.filter((r) => r.date === latestDate));
      }
      if (l && Array.isArray(l) && l[0]) setLastSync(l[0] as SyncLog);
    } catch (e) {
      console.error("Failed to load SEO metrics:", e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const sync = async () => {
    setSyncing(true);
    toast.info("正在從 Google Search Console 同步資料…");
    const { data, error } = await supabase.functions.invoke("sync-gsc-metrics");
    setSyncing(false);
    if (error || (data && !data.success)) {
      toast.error(`同步失敗：${error?.message || data?.error}`);
    } else {
      toast.success(`同步完成，寫入 ${data.rows_inserted} 筆`);
      await load();
    }
  };

  // Totals & comparisons
  const totals = useMemo(() => {
    const sortedDaily = [...daily].sort((a, b) => a.date.localeCompare(b.date));
    const last7 = sortedDaily.slice(-7);
    const prev7 = sortedDaily.slice(-14, -7);
    const last28 = sortedDaily.slice(-28);
    const sum = (rows: DailyRow[], k: "clicks" | "impressions") => rows.reduce((s, r) => s + Number(r[k] || 0), 0);
    const avg = (rows: DailyRow[], k: "ctr" | "position") =>
      rows.length ? rows.reduce((s, r) => s + Number(r[k] || 0), 0) / rows.length : 0;
    return {
      last7Clicks: sum(last7, "clicks"),
      prev7Clicks: sum(prev7, "clicks"),
      last7Impr: sum(last7, "impressions"),
      prev7Impr: sum(prev7, "impressions"),
      last7Ctr: avg(last7, "ctr"),
      last7Pos: avg(last7, "position"),
      last28Clicks: sum(last28, "clicks"),
      last28Impr: sum(last28, "impressions"),
    };
  }, [daily]);

  // Insights
  const insights = useMemo(() => {
    const items: { type: string; severity: "high" | "med" | "low"; title: string; detail: string }[] = [];
    pages.forEach((p) => {
      if (p.impressions > 100 && p.ctr < 0.02) {
        items.push({
          type: "low-ctr",
          severity: "high",
          title: "高曝光但低點擊率",
          detail: `${p.page_url}（${p.impressions} 次曝光，CTR ${fmtPct(p.ctr)}）→ 建議優化頁面標題與 meta description`,
        });
      }
    });
    queries.forEach((q) => {
      if (q.position >= 8 && q.position <= 20 && q.impressions > 20) {
        items.push({
          type: "opportunity",
          severity: "med",
          title: "機會關鍵字（排名 8–20）",
          detail: `「${q.query}」排名 ${fmtPos(q.position)}、曝光 ${q.impressions} → 加強相關內容可衝進前 10 名`,
        });
      }
    });
    pages.forEach((p) => {
      if (p.clicks === 0 && p.impressions > 50) {
        items.push({
          type: "no-clicks",
          severity: "med",
          title: "有曝光但無點擊",
          detail: `${p.page_url}（${p.impressions} 次曝光，0 點擊）→ 標題/描述吸引力不足`,
        });
      }
    });
    return items.slice(0, 30);
  }, [pages, queries]);

  const trendBadge = (curr: number, prev: number) => {
    if (prev === 0) return null;
    const pct = ((curr - prev) / prev) * 100;
    const up = pct >= 0;
    return (
      <span className={`inline-flex items-center text-xs ml-2 ${up ? "text-green-600" : "text-red-600"}`}>
        {up ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
        {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">SEO 監控（Google Search Console）</h2>
          {lastSync && (
            <p className="text-sm text-muted-foreground mt-1">
              上次同步：{new Date(lastSync.synced_at).toLocaleString("zh-TW")}
              {" · "}
              <Badge variant={lastSync.status === "success" ? "default" : "destructive"}>
                {lastSync.status === "success" ? "成功" : "失敗"}
              </Badge>
            </p>
          )}
        </div>
        <Button onClick={sync} disabled={syncing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "同步中…" : "立即同步"}
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">載入中…</p>
      ) : daily.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>尚無資料，請點擊「立即同步」從 Google Search Console 抓取資料。</p>
            <p className="text-xs mt-2">（GSC 資料約延遲 2–3 天，新驗證網站可能需數天才有資料）</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">近 7 天點擊</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totals.last7Clicks.toLocaleString()}{trendBadge(totals.last7Clicks, totals.prev7Clicks)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">近 7 天曝光</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totals.last7Impr.toLocaleString()}{trendBadge(totals.last7Impr, totals.prev7Impr)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">近 7 天平均 CTR</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{fmtPct(totals.last7Ctr)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">近 7 天平均排名</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{fmtPos(totals.last7Pos)}</p></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">每日點擊與曝光趨勢（近 28 天）</CardTitle></CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer>
                  <LineChart data={daily.slice(-28)}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="clicks" name="點擊" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="impressions" name="曝光" stroke="hsl(var(--secondary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {insights.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertCircle className="w-4 h-4" />問題與改善建議</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {insights.map((it, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 border border-border rounded-md">
                    <Badge variant={it.severity === "high" ? "destructive" : "secondary"} className="mt-0.5">
                      {it.severity === "high" ? "高" : it.severity === "med" ? "中" : "低"}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{it.title}</p>
                      <p className="text-sm text-muted-foreground break-all">{it.detail}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="pages">
            <TabsList>
              <TabsTrigger value="pages">Top Pages</TabsTrigger>
              <TabsTrigger value="queries">Top Queries</TabsTrigger>
            </TabsList>
            <TabsContent value="pages">
              <Card><CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>頁面</TableHead>
                    <TableHead className="text-right">點擊</TableHead>
                    <TableHead className="text-right">曝光</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">平均排名</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {pages.slice(0, 20).map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="max-w-md truncate"><a href={p.page_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{p.page_url.replace("https://solisforest.com", "") || "/"}</a></TableCell>
                        <TableCell className="text-right">{p.clicks}</TableCell>
                        <TableCell className="text-right">{p.impressions}</TableCell>
                        <TableCell className="text-right">{fmtPct(p.ctr)}</TableCell>
                        <TableCell className="text-right">{fmtPos(p.position)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent></Card>
            </TabsContent>
            <TabsContent value="queries">
              <Card><CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>關鍵字</TableHead>
                    <TableHead className="text-right">點擊</TableHead>
                    <TableHead className="text-right">曝光</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">平均排名</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {queries.slice(0, 30).map((q, i) => (
                      <TableRow key={i}>
                        <TableCell>{q.query}</TableCell>
                        <TableCell className="text-right">{q.clicks}</TableCell>
                        <TableCell className="text-right">{q.impressions}</TableCell>
                        <TableCell className="text-right">{fmtPct(q.ctr)}</TableCell>
                        <TableCell className="text-right">{fmtPos(q.position)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent></Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default SEOMetricsTab;
