import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, Upload, X, Settings2, Eye } from "lucide-react";
import RichTextEditor from "./RichTextEditor";

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string | null;
  category: string;
  read_time: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  author: string;
}

const CATEGORIES = ["神經系統科普", "正念陰瑜珈練習", "森林療癒", "自我照顧"];
const AUTHORS = ["Kaia", "Owen"];

const slugify = (s: string) =>
  s.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u4e00-\u9fa5-]/g, "").slice(0, 80) || `post-${Date.now()}`;

const empty: Partial<Post> = { title: "", slug: "", excerpt: "", content: "", category: CATEGORIES[0], author: "Kaia", read_time: "5 分鐘", cover_image: "", published: false, published_at: null };

const wordCount = (html: string) => html.replace(/<[^>]+>/g, "").replace(/\s+/g, "").length;

const BlogPostsTab = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Post> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [autoSavedAt, setAutoSavedAt] = useState<Date | null>(null);
  const autoSaveTimer = useRef<number | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
    setPosts((data as Post[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const buildPayload = (p: Partial<Post>, publishOverride?: boolean) => {
    const slug = p.slug?.trim() || slugify(p.title || "");
    const willPublish = publishOverride ?? !!p.published;
    return {
      title: p.title || "未命名草稿",
      slug,
      excerpt: p.excerpt || "",
      content: p.content || "",
      category: p.category || CATEGORIES[0],
      author: p.author || "Kaia",
      read_time: p.read_time || null,
      cover_image: p.cover_image || null,
      published: willPublish,
      published_at: willPublish && !p.published_at ? new Date().toISOString() : p.published_at || null,
    };
  };

  const persist = async (p: Partial<Post>, opts?: { silent?: boolean; publishOverride?: boolean }) => {
    if (!p.title?.trim()) {
      if (!opts?.silent) toast({ title: "請輸入標題", variant: "destructive" });
      return null;
    }
    const payload = buildPayload(p, opts?.publishOverride);
    const res = p.id
      ? await supabase.from("blog_posts").update(payload).eq("id", p.id).select().maybeSingle()
      : await supabase.from("blog_posts").insert(payload).select().maybeSingle();
    if (res.error) {
      if (!opts?.silent) toast({ title: "儲存失敗", description: res.error.message, variant: "destructive" });
      return null;
    }
    return res.data as Post;
  };

  // Autosave (debounced) once title exists
  useEffect(() => {
    if (!editing) return;
    if (!editing.title?.trim()) return;
    if (autoSaveTimer.current) window.clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = window.setTimeout(async () => {
      const saved = await persist(editing, { silent: true });
      if (saved) {
        setAutoSavedAt(new Date());
        if (!editing.id) setEditing((p) => p ? { ...p, id: saved.id, slug: saved.slug } : p);
      }
    }, 1500);
    return () => { if (autoSaveTimer.current) window.clearTimeout(autoSaveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing?.title, editing?.content, editing?.excerpt, editing?.cover_image, editing?.category, editing?.read_time, editing?.slug]);

  const handleSaveDraft = async () => {
    if (!editing) return;
    setSaving(true);
    const saved = await persist(editing, { publishOverride: false });
    setSaving(false);
    if (saved) {
      toast({ title: "已儲存草稿" });
      setEditing(null);
      load();
    }
  };

  const handlePublish = async () => {
    if (!editing) return;
    if (!editing.excerpt?.trim()) {
      toast({ title: "發佈前請填寫摘要", variant: "destructive" });
      return;
    }
    if (!editing.content?.trim() || editing.content === "<p></p>") {
      toast({ title: "內文不可為空", variant: "destructive" });
      return;
    }
    setSaving(true);
    const saved = await persist(editing, { publishOverride: true });
    setSaving(false);
    if (saved) {
      toast({ title: "已發佈", description: `/blog/${saved.slug}` });
      setEditing(null);
      setShowPublish(false);
      load();
    }
  };

  const remove = async (id: string) => {
    if (!confirm("確定要刪除這篇文章？")) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) return toast({ title: "刪除失敗", description: error.message, variant: "destructive" });
    toast({ title: "已刪除" });
    load();
  };

  const uploadCover = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("blog-images").upload(path, file);
    setUploading(false);
    if (error) return toast({ title: "上傳失敗", description: error.message, variant: "destructive" });
    const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
    setEditing((p) => ({ ...p!, cover_image: data.publicUrl }));
  };

  const openNew = () => { setAutoSavedAt(null); setEditing(empty); };
  const openEdit = (p: Post) => { setAutoSavedAt(null); setEditing(p); };
  const closeEditor = () => { setEditing(null); setShowPublish(false); load(); };

  const wc = wordCount(editing?.content || "");
  const readMin = Math.max(1, Math.ceil(wc / 400));

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">部落格文章</h3>
          <Button onClick={openNew}><Plus className="w-4 h-4 mr-1" /> 新增文章</Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">載入中...</p>
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground">尚未有文章</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>標題</TableHead>
                  <TableHead>分類</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>建立時間</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="max-w-[300px] truncate">{p.title}</TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell>
                      {(() => {
                        const scheduled = p.published && p.published_at && new Date(p.published_at) > new Date();
                        if (scheduled) {
                          return (
                            <Badge variant="outline" className="border-primary text-primary">
                              已排程 {p.published_at!.slice(0, 10)}
                            </Badge>
                          );
                        }
                        return (
                          <Badge variant={p.published ? "default" : "secondary"}>
                            {p.published ? "已發布" : "草稿"}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{new Date(p.created_at).toLocaleDateString("zh-TW")}</TableCell>
                    <TableCell className="text-right space-x-1">
                      {(() => {
                        const isScheduled = p.published && p.published_at && new Date(p.published_at) > new Date();
                        const isDraft = !p.published;
                        if (isScheduled || isDraft) {
                          return (
                            <Button
                              size="sm"
                              variant="ghost"
                              title={isScheduled ? "預覽排程文章" : "預覽草稿"}
                              onClick={() => window.open(`/blog/${p.slug}?preview=1`, "_blank")}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          );
                        }
                        return null;
                      })()}
                      <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Fullscreen immersive editor */}
        <Dialog open={!!editing} onOpenChange={(o) => !o && closeEditor()}>
          <DialogContent className="max-w-none w-screen h-screen p-0 rounded-none border-0 sm:rounded-none [&>button]:hidden flex flex-col bg-background">
            {editing && (
              <>
                {/* Top bar */}
                <header className="flex items-center justify-between px-4 md:px-8 py-3 border-b border-border/50">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <button onClick={closeEditor} className="p-2 -ml-2 hover:bg-muted rounded-md" aria-label="關閉">
                      <X className="w-4 h-4" />
                    </button>
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${autoSavedAt ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                      {autoSavedAt
                        ? `${autoSavedAt.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })} 已自動儲存`
                        : "尚未儲存"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleSaveDraft} disabled={saving}>
                      存為草稿
                    </Button>
                    <Button size="sm" onClick={() => setShowPublish(true)} className="bg-rose-500 hover:bg-rose-600 text-white">
                      準備發佈
                    </Button>
                  </div>
                </header>

                {/* Editor canvas */}
                <div className="flex-1 overflow-y-auto">
                  <div className="max-w-3xl mx-auto px-6 md:px-8 pt-12 pb-24">
                    <input
                      type="text"
                      value={editing.title || ""}
                      onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                      placeholder="請輸入文章名稱"
                      className="w-full text-3xl md:text-4xl font-bold font-serif-tc bg-transparent border-0 outline-none placeholder:text-muted-foreground/40 mb-8"
                    />
                    <RichTextEditor
                      value={editing.content || ""}
                      onChange={(html) => setEditing({ ...editing, content: html })}
                      minHeightClass="min-h-[65vh]"
                    />
                  </div>
                </div>

                {/* Footer stats */}
                <footer className="hidden md:flex items-center justify-end px-8 py-2 border-t border-border/50 text-xs text-muted-foreground gap-4">
                  <span>{wc} 個字</span>
                  <span>閱讀 {readMin} 分鐘</span>
                </footer>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Publish settings sheet */}
        <Sheet open={showPublish} onOpenChange={setShowPublish}>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>準備發佈</SheetTitle>
              <SheetDescription>確認文章資訊後即可公開到 /blog</SheetDescription>
            </SheetHeader>
            {editing && (
              <div className="space-y-5 py-6">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>分類</Label>
                    <select
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={editing.category || CATEGORIES[0]}
                      onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                    >
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>作者</Label>
                    <select
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={editing.author || "Kaia"}
                      onChange={(e) => setEditing({ ...editing, author: e.target.value })}
                    >
                      {AUTHORS.map((a) => <option key={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <Label>閱讀時間</Label>
                  <Input value={editing.read_time || ""} onChange={(e) => setEditing({ ...editing, read_time: e.target.value })} placeholder={`${readMin} 分鐘`} />
                </div>
                <div>
                  <Label>發佈日期</Label>
                  <Input
                    type="datetime-local"
                    value={editing.published_at ? editing.published_at.slice(0, 16) : ""}
                    onChange={(e) => setEditing({ ...editing, published_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">留空則自動設為發佈當下時間</p>
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

                {/* SEO 設定區塊 */}
                <div className="border-t border-border/50 pt-5">
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-muted-foreground" /> SEO 設定
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <Label>網址代稱（slug）</Label>
                      <Input value={editing.slug || ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="留空自動生成" />
                      <p className="text-xs text-muted-foreground mt-1">最終網址：/blog/{editing.slug?.trim() || slugify(editing.title || "")}</p>
                    </div>
                    <div>
                      <Label>摘要 *（用於列表與 SEO description）</Label>
                      <Textarea value={editing.excerpt || ""} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} rows={4} maxLength={200} />
                      <p className="text-xs text-muted-foreground mt-1">{(editing.excerpt || "").length}/200</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  <Switch checked={!!editing.published} onCheckedChange={(v) => setEditing({ ...editing, published: v })} />
                  <Label>立即公開發佈</Label>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowPublish(false)}>返回編輯</Button>
                  <Button onClick={handlePublish} disabled={saving} className="bg-rose-500 hover:bg-rose-600 text-white">
                    {saving ? "發佈中..." : editing.published ? "確認發佈" : "儲存設定"}
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </CardContent>
    </Card>
  );
};

export default BlogPostsTab;
