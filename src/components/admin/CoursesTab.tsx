import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiPost } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";  // Keep for storage only
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, Upload, X } from "lucide-react";
import ChapterManager from "./ChapterManager";

interface Course {
  id: string;
  title: string;
  slug: string;
  course_type: "prerecorded" | "live";
  instructor: string;
  cover_image: string | null;
  description: string | null;
  audience: string[];
  modules: string[];
  launch_label: string | null;
  cta_label: string;
  live_badge: string | null;
  live_schedule: string | null;
  published: boolean;
  sort_order: number;
  created_at: string;
  access_days: number | null;
  product_id: string | null;
  // 商品欄位（從 products 表載入）
  price?: number | null;
  shop_subtitle?: string | null;
  is_active?: boolean;
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u4e00-\u9fa5-]/g, "").slice(0, 80) || `course-${Date.now()}`;

const empty: Partial<Course> = {
  title: "", slug: "", course_type: "prerecorded", instructor: "Kaia（首席心理師）",
  cover_image: "", description: "", audience: [], modules: [],
  launch_label: "", cta_label: "上架通知我", live_badge: "", live_schedule: "",
  published: false, sort_order: 0, access_days: null, product_id: null,
  price: null, shop_subtitle: "", is_active: false,
};

const CoursesTab = () => {
  const { getIdToken } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Course> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      const data = await apiPost("/admin-db", {
        method: "GET",
        table: "courses?order=sort_order,created_at.desc"
      }, token || undefined);
      const courseList = Array.isArray(data) ? data as Course[] : [];

      // 載入關聯的 products 資料
      const productIds = courseList.map((c) => c.product_id).filter(Boolean) as string[];
      if (productIds.length > 0) {
        const products = await apiPost("/admin-db", {
          method: "GET",
          table: `products?id=in.(${productIds.join(",")})&select=id,price,subtitle,is_active`
        }, token || undefined);
        courseList.forEach((c) => {
          const p = (Array.isArray(products) ? products : []).find((p: any) => p.id === c.product_id);
          if (p) {
            c.price = p.price;
            c.shop_subtitle = p.subtitle;
            c.is_active = p.is_active;
          }
        });
      }
      setCourses(courseList);
    } catch (e) {
      console.error("Failed to load courses:", e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openEdit = async (c: Course) => {
    const course = { ...c };
    if (c.product_id) {
      try {
        const token = await getIdToken();
        const p = await apiPost("/admin-db", {
          method: "GET",
          table: `products?id=eq.${c.product_id}&select=price,subtitle,is_active&limit=1`
        }, token || undefined);
        if (p && Array.isArray(p) && p[0]) {
          course.price = p[0].price;
          course.shop_subtitle = p[0].subtitle;
          course.is_active = p[0].is_active;
        }
      } catch (e) {
        console.error("Failed to load product:", e);
      }
    }
    setEditing(course);
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.title?.trim()) return toast({ title: "請輸入課程名稱", variant: "destructive" });
    setSaving(true);

    const courseSlug = editing.slug?.trim() || slugify(editing.title);
    const coursePayload = {
      title: editing.title.trim(),
      slug: courseSlug,
      course_type: editing.course_type || "prerecorded",
      instructor: editing.instructor || "女人迷野專業教練團隊",
      cover_image: editing.cover_image || null,
      description: editing.description || null,
      audience: (editing.audience || []).filter((a) => a.trim()),
      modules: (editing.modules || []).filter((m) => m.trim()),
      launch_label: editing.launch_label || null,
      cta_label: editing.cta_label || "上架通知我",
      live_badge: editing.course_type === "live" ? (editing.live_badge || null) : null,
      live_schedule: editing.course_type === "live" ? (editing.live_schedule || null) : null,
      access_days: editing.access_days ?? null,
      published: !!editing.published,
      sort_order: editing.sort_order ?? 0,
    };

    let courseId = editing.id;

    try {
      const token = await getIdToken();
      // 儲存課程
      if (courseId) {
        await apiPost("/admin-db", {
          method: "PATCH",
          table: "courses",
          payload: coursePayload,
          filters: { id: `eq.${courseId}` }
        }, token || undefined);
      } else {
        const data = await apiPost("/admin-db", {
          method: "POST",
          table: "courses",
          payload: coursePayload
        }, token || undefined);
        if (Array.isArray(data) && data[0]) courseId = data[0].id;
      }

      // 同步 products 表：只要有價格或已有 product_id 就同步
      const productPayload = {
        title: editing.title.trim(),
        subtitle: editing.shop_subtitle || null,
        price: editing.price || 0,
        currency: "TWD",
        category: editing.course_type === "live" ? "live_class" : "online_course",
        cta_label: "立即購買",
        is_active: !!editing.is_active,
        slug: courseSlug,
        cover_image: editing.cover_image || null,
      };

      if (editing.product_id) {
        await apiPost("/admin-db", {
          method: "PATCH",
          table: "products",
          payload: productPayload,
          filters: { id: `eq.${editing.product_id}` }
        }, token || undefined);
      } else if (editing.price != null || editing.is_active) {
        // 有設價格，或主動開上架，就建立 product
        const newProduct = await apiPost("/admin-db", {
          method: "POST",
          table: "products",
          payload: productPayload
        }, token || undefined);
        if (newProduct && Array.isArray(newProduct) && newProduct[0]) {
          await apiPost("/admin-db", {
            method: "PATCH",
            table: "courses",
            payload: { product_id: newProduct[0].id },
            filters: { id: `eq.${courseId}` }
          }, token || undefined);
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

  const remove = async (id: string) => {
    if (!confirm("確定要刪除這堂課程？")) return;
    try {
      const token = await getIdToken();
      await apiPost("/admin-db", {
        method: "DELETE",
        table: "courses",
        filters: { id: `eq.${id}` }
      }, token || undefined);
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

  const updateListItem = (key: "audience" | "modules", i: number, v: string) => {
    const list = [...(editing?.[key] || [])];
    list[i] = v;
    setEditing({ ...editing!, [key]: list });
  };
  const addListItem = (key: "audience" | "modules") =>
    setEditing({ ...editing!, [key]: [...(editing?.[key] || []), ""] });
  const removeListItem = (key: "audience" | "modules", i: number) => {
    const list = [...(editing?.[key] || [])];
    list.splice(i, 1);
    setEditing({ ...editing!, [key]: list });
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">課程管理</h3>
          <Button onClick={() => setEditing(empty)}><Plus className="w-4 h-4 mr-1" /> 新增課程</Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">載入中...</p>
        ) : courses.length === 0 ? (
          <p className="text-muted-foreground">尚未有課程</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>排序</TableHead>
                  <TableHead>標題</TableHead>
                  <TableHead>類型</TableHead>
                  <TableHead>價格</TableHead>
                  <TableHead>商店</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.sort_order}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{c.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{c.course_type === "live" ? "即時課" : "自學課"}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{c.price ? `NT$${c.price.toLocaleString()}` : "-"}</TableCell>
                    <TableCell>
                      <Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "上架中" : "未上架"}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="w-4 h-4" /></Button>
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
              <SheetTitle>{editing?.id ? "編輯課程" : "新增課程"}</SheetTitle>
              <SheetDescription>所有欄位皆可日後修改</SheetDescription>
            </SheetHeader>
            {editing && (
              <div className="space-y-5 py-6">
                <div>
                  <Label>課程類型</Label>
                  <div className="flex gap-2 mt-1">
                    {(["prerecorded", "live"] as const).map((t) => (
                      <Button key={t} type="button" size="sm"
                        variant={editing.course_type === t ? "default" : "outline"}
                        onClick={() => setEditing({ ...editing, course_type: t })}>
                        {t === "prerecorded" ? "自學課程" : "即時課程"}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>課程名稱 *</Label>
                  <Input value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                </div>

                <div>
                  <Label>網址代稱（slug）</Label>
                  <Input value={editing.slug || ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="留空自動生成" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>排序（小到大）</Label>
                    <Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label>觀看期限（天）</Label>
                    <Input type="number" min={1} value={editing.access_days ?? ""}
                      onChange={(e) => setEditing({ ...editing, access_days: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="留空 = 永久" />
                    <p className="text-xs text-muted-foreground mt-1">留空為永久買斷</p>
                  </div>
                </div>

                {/* 商品區塊 */}
                <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/30">
                  <p className="text-sm font-medium">商店設定</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>售價（NT$）</Label>
                      <Input type="number" min={0} value={editing.price ?? ""}
                        onChange={(e) => setEditing({ ...editing, price: e.target.value ? parseInt(e.target.value) : null })}
                        placeholder="輸入售價" />
                    </div>
                    <div>
                      <Label>商店副標題</Label>
                      <Input value={editing.shop_subtitle || ""}
                        onChange={(e) => setEditing({ ...editing, shop_subtitle: e.target.value })}
                        placeholder="例：自學課程｜預錄隨選" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={!!editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                    <Label>在商店上架顯示</Label>
                  </div>
                </div>

                <div>
                  <Label>講師</Label>
                  <Input value={editing.instructor || ""} onChange={(e) => setEditing({ ...editing, instructor: e.target.value })} />
                </div>

                <div>
                  <Label>課程簡介</Label>
                  <Textarea value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} />
                </div>

                <div>
                  <Label>封面圖片</Label>
                  <div className="flex gap-2 items-center mt-1">
                    <Input value={editing.cover_image || ""} onChange={(e) => setEditing({ ...editing, cover_image: e.target.value })} placeholder="圖片網址或上傳" />
                    <label>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); e.target.value = ""; }} />
                      <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
                        <span className="cursor-pointer"><Upload className="w-4 h-4 mr-1" /> {uploading ? "上傳中" : "上傳"}</span>
                      </Button>
                    </label>
                  </div>
                  {editing.cover_image && <img src={editing.cover_image} alt="cover" className="mt-2 w-full h-32 rounded object-cover" />}
                </div>

                {editing.course_type === "live" && (
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

                <div>
                  <div className="flex justify-between items-center">
                    <Label>適合對象</Label>
                    <Button type="button" size="sm" variant="ghost" onClick={() => addListItem("audience")}>
                      <Plus className="w-3 h-3 mr-1" /> 新增
                    </Button>
                  </div>
                  <div className="space-y-2 mt-1">
                    {(editing.audience || []).map((a, i) => (
                      <div key={i} className="flex gap-2">
                        <Input value={a} onChange={(e) => updateListItem("audience", i, e.target.value)} />
                        <Button type="button" size="icon" variant="ghost" onClick={() => removeListItem("audience", i)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <Label>課程大綱</Label>
                    <Button type="button" size="sm" variant="ghost" onClick={() => addListItem("modules")}>
                      <Plus className="w-3 h-3 mr-1" /> 新增
                    </Button>
                  </div>
                  <div className="space-y-2 mt-1">
                    {(editing.modules || []).map((m, i) => (
                      <div key={i} className="flex gap-2">
                        <Input value={m} onChange={(e) => updateListItem("modules", i, e.target.value)} />
                        <Button type="button" size="icon" variant="ghost" onClick={() => removeListItem("modules", i)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>上架狀態文字</Label>
                    <Input value={editing.launch_label || ""} onChange={(e) => setEditing({ ...editing, launch_label: e.target.value })} placeholder="例：預計 2026 冬天上架" />
                  </div>
                  <div>
                    <Label>按鈕文字</Label>
                    <Input value={editing.cta_label || ""} onChange={(e) => setEditing({ ...editing, cta_label: e.target.value })} placeholder="上架通知我" />
                  </div>
                </div>

                {editing.id && <ChapterManager courseId={editing.id} />}

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

export default CoursesTab;
