import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

interface AccessRow {
  id: string;
  user_id: string;
  product_id: string;
  granted_at: string;
  product?: { title: string; category: string };
  profile?: { email: string | null; display_name: string | null };
}

interface Product { id: string; title: string; category: string; }

const CourseEnrollmentsTab = () => {
  const [list, setList] = useState<AccessRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [email, setEmail] = useState("");
  const [productId, setProductId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [accessRes, productsRes] = await Promise.all([
      supabase.from("user_product_access").select("*").order("granted_at", { ascending: false }),
      supabase.from("products").select("id,title,category").order("title"),
    ]);

    const rows: AccessRow[] = accessRes.data || [];
    const userIds = [...new Set(rows.map((r) => r.user_id))];
    const productIds = [...new Set(rows.map((r) => r.product_id))];

    const [profilesRes, productsDetailRes] = await Promise.all([
      userIds.length ? supabase.from("profiles").select("id,email,display_name").in("id", userIds) : Promise.resolve({ data: [] }),
      productIds.length ? supabase.from("products").select("id,title,category").in("id", productIds) : Promise.resolve({ data: [] }),
    ]);

    const pMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]));
    const cMap = new Map((productsDetailRes.data || []).map((c: any) => [c.id, c]));

    setList(rows.map((r) => ({ ...r, profile: pMap.get(r.user_id) as any, product: cMap.get(r.product_id) as any })));
    setProducts(productsRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const grant = async () => {
    if (!email.trim() || !productId) return toast({ title: "請填寫 Email 與選擇商品", variant: "destructive" });
    setSaving(true);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,email")
      .ilike("email", email.trim())
      .limit(1);

    if (!profiles || profiles.length === 0) {
      setSaving(false);
      return toast({
        title: "找不到會員帳號",
        description: "此 Email 尚未建立 Profile。請請會員先登入一次再授權",
        variant: "destructive",
      });
    }

    const finalUserId = profiles[0].id;

    const { error } = await supabase.from("user_product_access").insert({
      user_id: finalUserId,
      product_id: productId,
    });

    setSaving(false);
    if (error) {
      if (error.code === "23505") return toast({ title: "已有授權", description: "此會員已有該商品的存取權", variant: "destructive" });
      return toast({ title: "授權失敗", description: error.message, variant: "destructive" });
    }
    toast({ title: "授權成功" });
    setEmail(""); setProductId("");
    load();
  };

  const revoke = async (id: string) => {
    if (!confirm("確定撤銷此授權？")) return;
    const { error } = await supabase.from("user_product_access").delete().eq("id", id);
    if (error) return toast({ title: "撤銷失敗", description: error.message, variant: "destructive" });
    toast({ title: "已撤銷" });
    load();
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <h3 className="text-lg font-semibold">學習資源授權管理</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end border-b pb-4">
          <div>
            <Label>會員 Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="member@example.com" />
          </div>
          <div>
            <Label>選擇商品</Label>
            <select className="w-full h-10 border rounded px-3 bg-background text-sm" value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">-- 選擇 --</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <Button onClick={grant} disabled={saving}>{saving ? "授權中..." : "授權"}</Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">載入中...</p>
        ) : list.length === 0 ? (
          <p className="text-muted-foreground">尚未有授權紀錄</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>會員</TableHead>
                <TableHead>商品</TableHead>
                <TableHead>分類</TableHead>
                <TableHead>授權時間</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="text-sm">{r.profile?.email || r.user_id}</div>
                    {r.profile?.display_name && <div className="text-xs text-muted-foreground">{r.profile.display_name}</div>}
                  </TableCell>
                  <TableCell>{r.product?.title || r.product_id}</TableCell>
                  <TableCell><span className="text-xs text-muted-foreground">{r.product?.category || "-"}</span></TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{new Date(r.granted_at).toLocaleString("zh-TW")}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => revoke(r.id)}><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default CourseEnrollmentsTab;
