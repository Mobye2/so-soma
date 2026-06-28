import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiPost } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, Upload, X } from "lucide-react";
import ChapterManager from "./ChapterManager";

const CATEGORIES = [
  { value: "online_course", label: "線上課程" },
  { value: "live_class",    label: "即時課程" },
  { value: "ebook",         label: "電子書" },
  { value: "event",         label: "實體活動" },
];

const isCourse = (cat: string) => cat === "online_course" || cat === "live_class";

const slugify = (s: string) =>
  s.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u4e00-\u9fa5-]/g, "").slice(0, 80) || `product-${Date.now()}`;

interface Product {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  price: number;
  category: string;
  cta_label: string;
  is_active: boolean;
  sort_order: number;
  slug: string;
  cover_image: string | null;
  // 課程專屬（從 courses 載入）
  course_id?: string | null;
  instructor?: string;
  audience?: string[];
  modules?: string[];
  access_days?: number | null;
  live_badge?: string | null;
  live_schedule?: string | null;
  published?: boolean;
  course_sort_order?: number;
}

const emptyProduct: Partial<Product> = {
  title: "", subtitle: "", description: "", price: 0,
  category: "online_course", cta_label: "立即購買",
  is_active: false, sort_order: 0, slug: "", cover_image: "",
  instructor: "Kaia（首席心理師）", audience: [], modules: [],
  access_days: null, live_badge: "", live_schedule: "",
  published: false, course_sort_order: 0,
};

const ProductsTab = () => {
  const { getIdToken } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      const data = await apiPost("/admin-db", {
        method: "GET",
        table: "products?order=sort_order,created_at.desc"
      }, token || undefined);
      const list = Array.isArray(data) ? data as Product[] : [];

      // 載入課程資料
      const productIds = list.map((p) => p.id);
      if (productIds.length > 0) {
        const courses = await apiPost("/admin-db", {
          method: "GET",
          table: `courses?product_id=in.(${productIds.join(",")})&select=id,product_id,instructor,audience,modules,access_days,live_badge,live_schedule,published,sort_order`
        }, token || undefined);
        list.forEach((p) => {
          const c = (Array.isArray(courses) ? courses : []).find((c: any) => c.product_id === p.id);
          if (c) {
            p.course_id = c.id;
            p.instructor = c.instructor;
            p.audience = c.audience;
            p.modules = c.modules;
            p.access_days = c.access_days;
            p.live_badge = c.live_badge;
            p.live_schedule = c.live_schedule;
            p.published = c.published;
            p.course_sort_order = c.sort_order;
          }
        });
      }
      setProducts(list);
    } catch (e) {
      console.error("Failed to load products:", e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openEdit = (p: Product) => setEditing({ ...p });

  const save = async () => {
    if (!editing) return;
    if (!editing.title?.trim()) return toast({ title: "請輸入商品名稱", variant: "destructive" });
    setSaving(true);

    const productSlug = editing.slug?.trim() || slugify(editing.title!);
    const productPayload = {
      title: editing.title!.trim(),
      subtitle: editing.subtitle || null,
      description: editing.description || null,
      price: editing.price || 0,
      currency: "TWD",
      category: editing.category,
      cta_label: editing.cta_label || "立即購買",
      is_active: !!editing.is_active,
      sort_order: editing.sort_order ?? 0,
      slug: productSlug,
      cover_image: editing.cover_image || null,
    };

    try {
      const token = await getIdToken();
      let productId = editing.id;

      // 儲存 product
      if (productId) {
        await apiPost("/admin-db", { method: "PATCH", table: "products", payload: productPayload, filters: { id: `eq.${productId}` } }, token || undefined);
      } else {
        const res = await apiPost("/admin-db", { method: "POST", table: "products", payload: productPayload }, token || undefined);
        if (Array.isArray(res) && res[0]) productId = res[0].id;
      }

      // 課程類別：同步 courses 表
      if (isCourse(editing.category!) && productId) {
        const coursePayload = {
          title: editing.title!.trim(),
          slug: productSlug,
          course_type: editing.category === "live_class" ? "live" : "prerecorded",
          instructor: editing.instructor || "Kaia（首席心理師）",
          cover_image: editing.cover_image || null,
          description: editing.description || null,
          audience: (editing.audience || []).filter((a) => a.trim()),
          modules: (editing.modules || []).filter((m) => m.trim()),
          live_badge: editing.category === "live_class" ? (editing.live_badge || null) : null,
          live_schedule: editing.category === "live_class" ? (editing.live_schedule || null) : null,
          access_days: editing.access_days ?? null,
          published: !!editing.published,
          sort_order: editing.course_sort_order ?? 0,
          product_id: productId,
        };

        if (editing.course_id) {
          await apiPost("/admin-db", { method: "PATCH", table: "courses", payload: coursePayload, filters: { id: `eq.${editing.course_id}` } }, token || undefined);
        } else {
          await apiPost("/admin-db", { method: "POST", table: "courses", payload: coursePayload }, token || undefined);
        }
      }

      toast({ title: "已儲存" });
      setEditing(null);
      load();
    } catch (error: any) {
      toast({ title: "儲存失敗", description: error.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const remove = async (p: Product) => {
    if (!confirm(`確定要刪除「${p.title}」？`)) return;
    try {
      const token = await getIdToken();
      if (p.course_id) {
        await apiPost("/admin-db", { method: "DELETE", table: "courses", filters: { id: `eq.${p.course_id}` } }, token || undefined);
      }
      await apiPost("/admin-db", { method: "DELETE", table: "products", filters: { id: `eq.${p.id}` } }, token || undefined);
      toast({ title: "已刪除" });
      load();
    } catch (error: any) {
      toast({ title: "刪除失敗", description: error.message, variant: "destructive" });
    }
  };

  const uploadCover = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `courses/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("blog-images").upload(path, file);
    setUploading(false);
    if (error) return toast({ title: "上傳失敗", description: error.message, variant: "destructive" });
    const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
    setEditing((p) => ({ ...p!, cover_image: data.publicUrl }));
  };

  const updateList = (key: "audience" | "modules", i: number, v: string) => {
    const list = [...(editing?.[key] || [])];
    list[i] = v;
    setEditing({ ...editing!, [key]: list });
  };
  const addList = (key: "audience" | "modules") =>
    setEditing({ ...editing!, [key]: [...(editing?.[key] || []), ""] });
  const removeList = (key: "audience" | "modules", i: number) => {
    const list = [...(editing?.[key] || [])];
    list.splice(i, 1);
    setEditing({ ...editing!, [key]: list });
  };

  const catLabel = (cat: string) => CATEGORIES.find((c) => c.value === cat)?.label || cat;

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">商品管理</h3>
          <Button onClick={() => setEditing(emptyProduct)}><Plus className="w-4 h-4 mr-1" /> 新增商品</Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">載入中...</p>
        ) : products.length === 0 ? (
          <p className="text-muted-foreground">尚未有商品</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>排序</TableHead>
                  <TableHead>名稱</TableHead>
                  <TableHead>分類</TableHead>
                  <TableHead>價格</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.sort_order}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{p.title}</TableCell>
                    <TableCell><Badge variant="outline">{catLabel(p.category)}</Badge></TableCell>
                    <TableCell>NT${p.price.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "上架中" : "未上架"}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(p)}><Trash2 className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editing?.id ? "編輯商品" : "新增商品"}</SheetTitle>
              <SheetDescription>所有欄位皆可日後修改</SheetDescription>
            </SheetHeader>
            {editing && (
              <div className="space-y-5 py-6">

                {/* 基本欄位 */}
                <div>
                  <Label>商品分類 *</Label>
                  <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>商品名稱 *</Label>
                  <Input value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                </div>

                <div>
                  <Label>副標題</Label>
                  <Input value={editing.subtitle || ""} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} placeholder="例：自學課程｜預錄隨選" />
                </div>

                <div>
                  <Label>商品描述</Label>
                  <Textarea value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>售價（NT$）</Label>
                    <Input type="number" min={0} value={editing.price ?? ""} onChange={(e) => setEditing({ ...editing, price: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label>排序（小到大）</Label>
                    <Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>

                <div>
                  <Label>網址代稱（slug）</Label>
                  <Input value={editing.slug || ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="留空自動生成" />
                </div>

                <div>
                  <Label>封面圖片</Label>
                  <div className="flex gap-2 items-center mt-1">
                    <Input value={editing.cover_image || ""} onChange={(e) => setEditing({ ...editing, cover_image: e.target.value })} placeholder="圖片網址或上傳" />
                    <label>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); e.target.value = ""; }} />
                      <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
                        <span className="cursor-pointer"><Upload className="w-4 h-4 mr-1" />{uploading ? "上傳中" : "上傳"}</span>
                      </Button>
                    </label>
                  </div>
                  {editing.cover_image && <img src={editing.cover_image} alt="cover" className="mt-2 w-full h-32 rounded object-cover" />}
                </div>

                <div className="flex items-center gap-2">
                  <Switch checked={!!editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                  <Label>在商店上架顯示</Label>
                </div>

                {/* 課程專屬欄位 */}
                {isCourse(editing.category || "") && (
                  <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/30">
                    <p className="text-sm font-medium">課程設定</p>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>講師</Label>
                        <Input value={editing.instructor || ""} onChange={(e) => setEditing({ ...editing, instructor: e.target.value })} />
                      </div>
                      <div>
                        <Label>觀看期限（天）</Label>
                        <Input type="number" min={1} value={editing.access_days ?? ""}
                          onChange={(e) => setEditing({ ...editing, access_days: e.target.value ? parseInt(e.target.value) : null })}
                          placeholder="留空 = 永久" />
                      </div>
                    </div>

                    {editing.category === "live_class" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>即時課標籤</Label>
                          <Input value={editing.live_badge || ""} onChange={(e) => setEditing({ ...editing, live_badge: e.target.value })} placeholder="例：每月方案" />
                        </div>
                        <div>
                          <Label>上課時段</Label>
                          <Input value={editing.live_schedule || ""} onChange={(e) => setEditing({ ...editing, live_schedule: e.target.value })} placeholder="例：每週固定時段" />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Switch checked={!!editing.published} onCheckedChange={(v) => setEditing({ ...editing, published: v })} />
                      <Label>課程頁面公開顯示</Label>
                    </div>

                    <div>
                      <div className="flex justify-between items-center">
                        <Label>適合對象</Label>
                        <Button type="button" size="sm" variant="ghost" onClick={() => addList("audience")}><Plus className="w-3 h-3 mr-1" />新增</Button>
                      </div>
                      <div className="space-y-2 mt-1">
                        {(editing.audience || []).map((a, i) => (
                          <div key={i} className="flex gap-2">
                            <Input value={a} onChange={(e) => updateList("audience", i, e.target.value)} />
                            <Button type="button" size="icon" variant="ghost" onClick={() => removeList("audience", i)}><X className="w-4 h-4" /></Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center">
                        <Label>課程大綱</Label>
                        <Button type="button" size="sm" variant="ghost" onClick={() => addList("modules")}><Plus className="w-3 h-3 mr-1" />新增</Button>
                      </div>
                      <div className="space-y-2 mt-1">
                        {(editing.modules || []).map((m, i) => (
                          <div key={i} className="flex gap-2">
                            <Input value={m} onChange={(e) => updateList("modules", i, e.target.value)} />
                            <Button type="button" size="icon" variant="ghost" onClick={() => removeList("modules", i)}><X className="w-4 h-4" /></Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {editing.course_id && <ChapterManager courseId={editing.course_id} />}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setEditing(null)}>取消</Button>
                  <Button onClick={save} disabled={saving}>{saving ? "儲存中..." : "儲存"}</Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </CardContent>
    </Card>
  );
};

export default ProductsTab;
