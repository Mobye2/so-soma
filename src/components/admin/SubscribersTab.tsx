import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiPost } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface Newsletter {
  id: string;
  email: string;
  source: string | null;
  created_at: string;
}

interface LaunchNotify {
  id: string;
  email: string;
  name: string | null;
  product_name: string;
  notified_at: string | null;
  created_at: string;
}

interface QuizResult {
  id: string;
  email: string;
  state_name: string;
  state_title: string;
  pct_sym: number;
  pct_dor: number;
  pct_ven: number;
  created_at: string;
}

const SubscribersTab = () => {
  const { getIdToken } = useAuth();
  const [newsletter, setNewsletter] = useState<Newsletter[]>([]);
  const [launch, setLaunch] = useState<LaunchNotify[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = await getIdToken();
        const [n, l] = await Promise.all([
          apiPost("/admin-db", { method: "GET", table: "newsletter_subscribers?order=created_at.desc" }, token || undefined),
          apiPost("/admin-db", { method: "GET", table: "launch_notify_subscribers?order=created_at.desc" }, token || undefined),
        ]);
        if (n) setNewsletter(Array.isArray(n) ? n as Newsletter[] : []);
        if (l) setLaunch(Array.isArray(l) ? l as LaunchNotify[] : []);
      } catch (e) {
        console.error("Failed to load subscribers:", e);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const exportCsv = (rows: Record<string, unknown>[], filename: string) => {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Tabs defaultValue="newsletter">
      <TabsList className="mb-4">
        <TabsTrigger value="newsletter">電子報訂閱（{newsletter.length}）</TabsTrigger>
        <TabsTrigger value="launch">上架通知（{launch.length}）</TabsTrigger>
      </TabsList>

      <TabsContent value="newsletter">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">電子報訂閱名單</CardTitle>
            <button
              onClick={() => exportCsv(newsletter as unknown as Record<string, unknown>[], "newsletter_subscribers.csv")}
              className="text-sm text-primary hover:underline"
            >
              匯出 CSV
            </button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <p className="p-6 text-muted-foreground">載入中...</p>
            ) : newsletter.length === 0 ? (
              <p className="p-6 text-muted-foreground">目前沒有訂閱者</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>訂閱時間</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>來源</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {newsletter.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(s.created_at).toLocaleString("zh-TW")}
                        </TableCell>
                        <TableCell>{s.email}</TableCell>
                        <TableCell>{s.source || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="launch">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">上架通知名單</CardTitle>
            <button
              onClick={() => exportCsv(launch as unknown as Record<string, unknown>[], "launch_notify_subscribers.csv")}
              className="text-sm text-primary hover:underline"
            >
              匯出 CSV
            </button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <p className="p-6 text-muted-foreground">載入中...</p>
            ) : launch.length === 0 ? (
              <p className="p-6 text-muted-foreground">目前沒有通知訂閱</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>登記時間</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>姓名</TableHead>
                      <TableHead>產品/課程</TableHead>
                      <TableHead>狀態</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {launch.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(s.created_at).toLocaleString("zh-TW")}
                        </TableCell>
                        <TableCell>{s.email}</TableCell>
                        <TableCell>{s.name || "-"}</TableCell>
                        <TableCell>{s.product_name}</TableCell>
                        <TableCell>
                          {s.notified_at ? (
                            <Badge variant="default">已通知</Badge>
                          ) : (
                            <Badge variant="secondary">待通知</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default SubscribersTab;
