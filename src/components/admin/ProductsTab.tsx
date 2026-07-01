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
  { value: "other",         label: "其他" },
];

const isCourse = (cat: string) => cat === "online_course" || cat === "live_class";

const slugify = (s: string) =>
  (s.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u4e00-\u9fa5-]/g, "").slice(0, 60) || "product") + `-${Date.now()}`;

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
  coming_soon: boolean;
  launch_date?: string | null;
  post_purchase_note?: string | null;
  post_purchase_image?: string | null;
  // ebook
  ebook_download_url?: string | null;
  ebook_file_format?: string | null;
  // event
  event_datetime?: string | null;
  event_location?: string | null;
  event_meeting_notes?: string | null;
  event_notes?: string | null;
  // live_class extras
  live_stream_url?: string | null;
  live_time_notes?: string | null;
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
  is_active: false, coming_soon: false, launch_date: "", sort_order: 0, slug: "", cover_image: "",
  post_purchase_note: "", post_purchase_image: "",
  ebook_download_url: "", ebook_file_format: "",
  event_datetime: "", event_location: "", event_meeting_notes: "", event_notes: "",
  live_stream_url: "", live_time_notes: "",
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

    // 記錄儲存前的上架狀態，用來偵測是否剛上架
    const wasInactive = editing.id
      ? products.find((p) => p.id === editing.id)?.is_active === false
      : false;
    const justActivated = wasInactive && !!editing.is_active;

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
      coming_soon: !!editing.coming_soon,
      launch_date: editing.launch_date || null,
      sort_order: editing.sort_order ?? 0,
      slug: productSlug,
      cover_image: editing.cover_image || null,
      post_purchase_note: editing.post_purchase_note || null,
      post_purchase_image: editing.post_purchase_image || null,
      ebook_download_url: editing.ebook_download_url || null,
      ebook_file_format: editing.ebook_file_format || null,
      event_datetime: editing.event_datetime || null,
      event_location: editing.event_location || null,
      event_meeting_notes: editing.event_meeting_notes || null,
      event_notes: editing.event_notes || null,
      live_stream_url: editing.live_stream_url || null,
      live_time_notes: editing.live_time_notes || null,
    };

    try {
      const token = await getIdToken();
      let productId = editing.id;

      if (productId) {
        await apiPost("/admin-db", { method: "PATCH", table: "products", payload: productPayload, filters: { id: `eq.${productId}` } }, token || undefined);
      } else {
        const res = await apiPost("/admin-db", { method: "POST", table: "products", payload: productPayload }, token || undefined);
        if (Array.isArray(res) && res[0]) productId = res[0].id;
      }

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

        // 確認 course_id 在 DB 是否真的存在
        let confirmedCourseId = editing.course_id;
        if (confirmedCourseId) {
          const existing = await apiPost("/admin-db", {
            method: "GET",
            table: `courses?id=eq.${confirmedCourseId}&select=id`
          }, token || undefined);
          if (!Array.isArray(existing) || existing.length === 0) confirmedCourseId = undefined;
        }

        if (confirmedCourseId) {
          await apiPost("/admin-db", { method: "PATCH", table: "courses", payload: coursePayload, filters: { id: `eq.${confirmedCourseId}` } }, token || undefined);
        } else {
          await apiPost("/admin-db", { method: "POST", table: "courses", payload: coursePayload }, token || undefined);
        }
      }

      toast({ title: "已儲存" });

      // 上架通知：is_active 從 false → true 時，寄信給訂閱該商品的名單
      if (justActivated && editing.title) {
        try {
          const token = await getIdToken();
          const subs = await apiPost("/admin-db", {
            method: "GET",
            table: `launch_notify_subscribers?product_name=eq.${encodeURIComponent(editing.title.trim())}&notified_at=is.null&select=id,email,name`,
          }, token || undefined);

          if (Array.isArray(subs) && subs.length > 0) {
            const productUrl = `https://www.solisforest.com/shop/${editing.slug?.trim() || ""}`;
            for (const sub of subs) {
              try {
                await apiPost("/send-email", {
                  templateName: "launch-notify",
                  recipientEmail: sub.email,
                  templateData: { name: sub.name || "", product_name: editing.title.trim(), url: productUrl },
                });
                // 更新 notified_at
                await apiPost("/admin-db", {
                  method: "PATCH",
                  table: "launch_notify_subscribers",
                  payload: { notified_at: new Date().toISOString() },
                  filters: { id: `eq.${sub.id}` },
                }, token || undefined);
              } catch (e) {
                console.error(`launch notify failed for ${sub.email}:`, e);
              }
            }
            toast({ title: `已寄送 ${subs.length} 封上架通知` });
          }
        } catch (e) {
          console.error("launch notify fetch failed:", e);
        }
      }

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
        await apiPost("/admin-db", { method: "DELETE", table: "user_course_access", filters: { course_id: `eq.${p.course_id}` } }, token || undefined);
        await apiPost("/admin-db", { method: "DELETE", table: "course_enrollments", filters: { course_id: `eq.${p.course_id}` } }, token || undefined);
        await apiPost("/admin-db", { method: "DELETE", table: "course_chapters", filters: { course_id: `eq.${p.course_id}` } }, token || undefined);
        await apiPost("/admin-db", { method: "DELETE", table: "courses", filters: { id: `eq.${p.course_id}` } }, token || undefined);
      }
      await apiPost("/admin-db", { method: "DELETE", table: "order_items", filters: { product_id: `eq.${p.id}` } }, token || undefined);
      await apiPost("/admin-db", { method: "DELETE", table: "products", filters: { id: `eq.${p.id}` } }, token || undefined);
      toast({ title: "已刪除" });
      load();
    } catch (error: any) {
      console.error("remove error:", error);
      toast({ title: "刪除失敗", description: error.message, variant: "destructive" });
    }
  };

  const uploadCover = async (file: File) => {
    setUploading(true);
    try {
      const token = await getIdToken();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const contentType = file.type || "image/jpeg";

      // 拿 presigned URL
      const { upload_url, public_url } = await apiPost("/upload-url", {
        type: "image",
        filename: `cover.${ext}`,
        content_type: contentType,
        folder: "products",
      }, token || undefined);

      // 直接 PUT 到 S3
      await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": contentType },
      });

      setEditing((p) => ({ ...p!, cover_image: public_url }));
    } catch (err: any) {
      toast({ title: "上傳失敗", description: err.message, variant: "destructive" });
    }
    setUploading(false);
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
  const e = (key: keyof Product) => (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setEditing({ ...editing!, [key]: ev.target.value });

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
                      <Badge variant={p.is_active ? "default" : p.coming_soon ? "outline" : "secondary"}>
                        {p.is_active ? "上架中" : p.coming_soon ? "即將上架" : "未上架"}
                      </Badge>
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
                  <Input value={editing.title || ""} onChange={e("title")} />
                </div>

                <div>
                  <Label>副標題</Label>
                  <Input value={editing.subtitle || ""} onChange={e("subtitle")} placeholder="例：自學課程｜預錄隨選" />
                </div>

                <div>
                  <Label>商品描述</Label>
                  <Textarea value={editing.description || ""} onChange={e("description")} rows={3} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>售價（NT$）</Label>
                    <Input type="number" min={0} value={editing.price ?? ""} onChange={(ev) => setEditing({ ...editing, price: parseInt(ev.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label>排序（小到大）</Label>
                    <Input type="number" value={editing.sort_order ?? 0} onChange={(ev) => setEditing({ ...editing, sort_order: parseInt(ev.target.value) || 0 })} />
                  </div>
                </div>

                <div>
                  <Label>網址代稱（slug）</Label>
                  <Input value={editing.slug || ""} onChange={e("slug")} placeholder="留空自動生成" />
                </div>

                <div>
                  <Label>封面圖片</Label>
                  <div className="flex gap-2 items-center mt-1">
                    <Input value={editing.cover_image || ""} onChange={e("cover_image")} placeholder="圖片網址或上傳" />
                    <label>
                      <input type="file" accept="image/*" className="hidden" onChange={(ev) => { const f = ev.target.files?.[0]; if (f) uploadCover(f); ev.target.value = ""; }} />
                      <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
                        <span className="cursor-pointer"><Upload className="w-4 h-4 mr-1" />{uploading ? "上傳中" : "上傳"}</span>
                      </Button>
                    </label>
                  </div>
                  {editing.cover_image && <img src={editing.cover_image} alt="cover" className="mt-2 w-full h-32 rounded object-cover" />}
                </div>

                <div className="space-y-3 border border-border rounded-lg p-4">
                  <p className="text-sm font-medium">上架狀態</p>
                  <div className="flex items-center gap-2">
                    <Switch checked={!!editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v, coming_soon: v ? false : editing.coming_soon })} />
                    <Label>正式上架（可購買）</Label>
                  </div>
                  {!editing.is_active && (
                    <>
                      <div className="flex items-center gap-2">
                        <Switch checked={!!editing.coming_soon} onCheckedChange={(v) => setEditing({ ...editing, coming_soon: v })} />
                        <Label>即將上架（顯示卡片 + 訂閱通知按鈕）</Label>
                      </div>
                      {editing.coming_soon && (
                        <div>
                          <Label>預計上架時間（選填）</Label>
                          <Input
                            value={editing.launch_date || ""}
                            onChange={(e) => setEditing({ ...editing, launch_date: e.target.value })}
                            placeholder="例：2026 Q4、8 月中旬"
                            className="mt-1"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* 其他 */}
                {editing.category === "other" && (
                  <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/30">
                    <p className="text-sm font-medium">購買設定</p>
                    <div>
                      <Label>購買說明</Label>
                      <Textarea value={editing.post_purchase_note || ""} onChange={e("post_purchase_note")} rows={3} placeholder="購買後會員頁顯示的說明文字" />
                    </div>
                  </div>
                )}

                {/* 電子書 */}
                {editing.category === "ebook" && (
                  <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/30">
                    <p className="text-sm font-medium">電子書設定</p>
                    <div>
                      <Label>下載連結 *</Label>
                      <Input value={editing.ebook_download_url || ""} onChange={e("ebook_download_url")} placeholder="https://..." />
                    </div>
                    <div>
                      <Label>檔案格式說明</Label>
                      <Input value={editing.ebook_file_format || ""} onChange={e("ebook_file_format")} placeholder="例：PDF、ePub" />
                    </div>
                    <div>
                      <Label>購買說明</Label>
                      <Textarea value={editing.post_purchase_note || ""} onChange={e("post_purchase_note")} rows={2} placeholder="選填，顯示在下載連結旁" />
                    </div>
                  </div>
                )}

                {/* 實體活動 */}
                {editing.category === "event" && (
                  <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/30">
                    <p className="text-sm font-medium">活動設定</p>
                    <div>
                      <Label>活動日期時間 *</Label>
                      <Input value={editing.event_datetime || ""} onChange={e("event_datetime")} placeholder="例：2026/08/15（六）14:00–17:00" />
                    </div>
                    <div>
                      <Label>活動地點 *</Label>
                      <Input value={editing.event_location || ""} onChange={e("event_location")} placeholder="例：台中市西區 XX 路 XX 號" />
                    </div>
                    <div>
                      <Label>集合說明</Label>
                      <Input value={editing.event_meeting_notes || ""} onChange={e("event_meeting_notes")} placeholder="例：請提前 10 分鐘到場" />
                    </div>
                    <div>
                      <Label>注意事項</Label>
                      <Textarea value={editing.event_notes || ""} onChange={e("event_notes")} rows={2} placeholder="例：請穿著舒適衣物、自備水" />
                    </div>
                  </div>
                )}

                {/* 課程類 */}
                {isCourse(editing.category || "") && (
                  <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/30">
                    <p className="text-sm font-medium">課程設定</p>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>講師</Label>
                        <Input value={editing.instructor || ""} onChange={e("instructor")} />
                      </div>
                      <div>
                        <Label>觀看期限（天）</Label>
                        <Input type="number" min={1} value={editing.access_days ?? ""}
                          onChange={(ev) => setEditing({ ...editing, access_days: ev.target.value ? parseInt(ev.target.value) : null })}
                          placeholder="留空 = 永久" />
                      </div>
                    </div>

                    {editing.category === "live_class" && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>即時課標籤</Label>
                            <Input value={editing.live_badge || ""} onChange={e("live_badge")} placeholder="例：每月方案" />
                          </div>
                          <div>
                            <Label>上課時段</Label>
                            <Input value={editing.live_schedule || ""} onChange={e("live_schedule")} placeholder="例：每週固定時段" />
                          </div>
                        </div>
                        <div>
                          <Label>直播連結</Label>
                          <Input value={editing.live_stream_url || ""} onChange={e("live_stream_url")} placeholder="Zoom / Google Meet URL" />
                        </div>
                        <div>
                          <Label>直播時間說明</Label>
                          <Input value={editing.live_time_notes || ""} onChange={e("live_time_notes")} placeholder="例：每週四晚上 8:00–9:00" />
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
                            <Input value={a} onChange={(ev) => updateList("audience", i, ev.target.value)} />
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
                            <Input value={m} onChange={(ev) => updateList("modules", i, ev.target.value)} />
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
