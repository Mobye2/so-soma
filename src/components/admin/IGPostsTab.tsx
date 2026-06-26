import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiPost } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { extractIGShortcode } from "@/components/InstagramEmbed";
import { Pencil, Trash2, Plus, ExternalLink } from "lucide-react";

const CATEGORIES = ["神經系統科普", "正念陰瑜珈練習", "森林療癒", "自我照顧"] as const;
type Category = (typeof CATEGORIES)[number];

interface IGPost {
  id: string;
  ig_url: string;
  ig_shortcode: string;
  title: string;
  excerpt: string;
  content: string | null;
  categories: string[];
  post_date: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

const emptyForm = {
  ig_url: "",
  title: "",
  excerpt: "",
  content: "",
  categories: [] as string[],
  post_date: new Date().toISOString().slice(0, 10),
  published: false,
};

const IGPostsTab = () => {
  const { toast } = useToast();
  const { getIdToken } = useAuth();
  const [posts, setPosts] = useState<IGPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      const data = await apiPost("/admin-db", {
        method: "GET",
        table: "ig_posts?order=post_date.desc"
      }, token || undefined);
      setPosts(Array.isArray(data) ? data as IGPost[] : []);
    } catch (error: any) {
      toast({ title: "載入失敗", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (p: IGPost) => {
    setEditingId(p.id);
    setForm({
      ig_url: p.ig_url,
      title: p.title,
      excerpt: p.excerpt,
      content: p.content || "",
      categories: p.categories,
      post_date: p.post_date,
      published: p.published,
    });
    setDialogOpen(true);
  };

  const toggleCategory = (cat: Category) => {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter((c) => c !== cat)
        : [...f.categories, cat],
    }));
  };

  const submit = async () => {
    if (!form.ig_url.trim() || !form.title.trim() || !form.excerpt.trim()) {
      toast({ title: "請填寫必填欄位", description: "IG 連結、標題、摘要為必填", variant: "destructive" });
      return;
    }
    const shortcode = extractIGShortcode(form.ig_url.trim());
    if (!shortcode) {
      toast({
        title: "IG 連結格式錯誤",
        description: "請貼上完整連結，如 https://www.instagram.com/p/XXXX/",
        variant: "destructive",
      });
      return;
    }
    if (form.categories.length === 0) {
      toast({ title: "請至少選一個分類", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload = {
      ig_url: form.ig_url.trim(),
      ig_shortcode: shortcode,
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      content: form.content.trim() || null,
      categories: form.categories,
      post_date: form.post_date,
      published: form.published,
    };

    try {
      const token = await getIdToken();
      if (editingId) {
        await apiPost("/admin-db", {
          method: "PATCH",
          table: "ig_posts",
          payload,
          filters: { id: `eq.${editingId}` }
        }, token || undefined);
      } else {
        await apiPost("/admin-db", {
          method: "POST",
          table: "ig_posts",
          payload
        }, token || undefined);
      }
      toast({ title: editingId ? "已更新" : "已建立" });
      setDialogOpen(false);
      load();
    } catch (error: any) {
      toast({ title: "儲存失敗", description: error.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const togglePublish = async (p: IGPost) => {
    try {
      const token = await getIdToken();
      await apiPost("/admin-db", {
        method: "PATCH",
        table: "ig_posts",
        payload: { published: !p.published },
        filters: { id: `eq.${p.id}` }
      }, token || undefined);
      load();
    } catch (error: any) {
      toast({ title: "更新失敗", description: error.message, variant: "destructive" });
    }
  };

  const remove = async (p: IGPost) => {
    if (!confirm(`確定刪除「${p.title}」?`)) return;
    try {
      const token = await getIdToken();
      await apiPost("/admin-db", {
        method: "DELETE",
        table: "ig_posts",
        filters: { id: `eq.${p.id}` }
      }, token || undefined);
      toast({ title: "已刪除" });
      load();
    } catch (error: any) {
      toast({ title: "刪除失敗", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Instagram 貼文</h2>
            <p className="text-sm text-muted-foreground mt-1">
              貼上 IG 連結，照片由 Instagram 官方嵌入顯示。
            </p>
          </div>
          <Button onClick={openNew}>
            <Plus className="w-4 h-4 mr-2" /> 新增 IG 貼文
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground py-6">載入中...</p>
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground py-6">目前還沒有 IG 貼文。</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日期</TableHead>
                  <TableHead>標題</TableHead>
                  <TableHead>分類</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>IG</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="whitespace-nowrap">{p.post_date}</TableCell>
                    <TableCell className="max-w-[260px] truncate">{p.title}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {p.categories.map((c) => (
                          <Badge key={c} variant="secondary" className="text-xs">
                            #{c}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={p.published} onCheckedChange={() => togglePublish(p)} />
                        <span className="text-xs text-muted-foreground">
                          {p.published ? "公開" : "草稿"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <a
                        href={p.ig_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-secondary hover:underline inline-flex items-center gap-1 text-xs"
                      >
                        開啟 <ExternalLink className="w-3 h-3" />
                      </a>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(p)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "編輯 IG 貼文" : "新增 IG 貼文"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>IG 貼文連結 *</Label>
                <Input
                  placeholder="https://www.instagram.com/p/XXXX/"
                  value={form.ig_url}
                  onChange={(e) => setForm({ ...form, ig_url: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  支援 /p/、/reel/、/tv/ 連結
                </p>
              </div>
              <div>
                <Label>標題 *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <Label>摘要 * (1–2 句，會顯示在 Blog 卡片)</Label>
                <Textarea
                  rows={2}
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                />
              </div>
              <div>
                <Label>分類 * (可多選)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {CATEGORIES.map((c) => (
                    <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={form.categories.includes(c)}
                        onCheckedChange={() => toggleCategory(c)}
                      />
                      {c}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label>補充說明 (選填，顯示在 IG embed 下方)</Label>
                <Textarea
                  rows={5}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>發布日期</Label>
                  <Input
                    type="date"
                    value={form.post_date}
                    onChange={(e) => setForm({ ...form, post_date: e.target.value })}
                  />
                </div>
                <div className="flex items-end gap-2 pb-2">
                  <Switch
                    checked={form.published}
                    onCheckedChange={(v) => setForm({ ...form, published: v })}
                  />
                  <Label>{form.published ? "公開發布" : "草稿"}</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                  取消
                </Button>
                <Button onClick={submit} disabled={saving}>
                  {saving ? "儲存中..." : "儲存"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default IGPostsTab;
