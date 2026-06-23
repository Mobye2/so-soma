import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, ChevronUp, ChevronDown, Upload, Loader2 } from "lucide-react";

interface Chapter {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  sort_order: number;
  is_preview: boolean;
}

const ChapterManager = ({ courseId }: { courseId: string }) => {
  const [items, setItems] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const uploadVideo = async (chapter: Chapter, file: File) => {
    setUploadingId(chapter.id);
    const ext = file.name.split(".").pop();
    const path = `${courseId}/${chapter.id}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("course-videos").upload(path, file, { upsert: true });
    if (upErr) {
      setUploadingId(null);
      return toast({ title: "上傳失敗", description: upErr.message, variant: "destructive" });
    }
    const { data } = supabase.storage.from("course-videos").getPublicUrl(path);
    const { error } = await supabase.from("course_chapters").update({ video_url: data.publicUrl }).eq("id", chapter.id);
    setUploadingId(null);
    if (error) return toast({ title: "儲存失敗", description: error.message, variant: "destructive" });
    toast({ title: "影片已上傳" });
    load();
  };

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("course_chapters")
      .select("*")
      .eq("course_id", courseId)
      .order("sort_order");
    setItems((data as Chapter[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [courseId]);

  const add = async () => {
    const nextOrder = (items[items.length - 1]?.sort_order ?? 0) + 1;
    const { error } = await supabase.from("course_chapters").insert({
      course_id: courseId, title: "新章節", sort_order: nextOrder,
    });
    if (error) return toast({ title: "新增失敗", description: error.message, variant: "destructive" });
    load();
  };

  const update = async (id: string, patch: Partial<Chapter>) => {
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const save = async (c: Chapter) => {
    const { error } = await supabase.from("course_chapters").update({
      title: c.title, description: c.description, video_url: c.video_url,
      duration_minutes: c.duration_minutes, sort_order: c.sort_order, is_preview: c.is_preview,
    }).eq("id", c.id);
    if (error) return toast({ title: "儲存失敗", description: error.message, variant: "destructive" });
    toast({ title: "已儲存" });
  };

  const remove = async (id: string) => {
    if (!confirm("確定刪除此章節？")) return;
    const { error } = await supabase.from("course_chapters").delete().eq("id", id);
    if (error) return toast({ title: "刪除失敗", description: error.message, variant: "destructive" });
    load();
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    const a = items[idx], b = items[j];
    await supabase.from("course_chapters").update({ sort_order: b.sort_order }).eq("id", a.id);
    await supabase.from("course_chapters").update({ sort_order: a.sort_order }).eq("id", b.id);
    load();
  };

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold">章節管理</h4>
        <Button size="sm" type="button" onClick={add}><Plus className="w-3 h-3 mr-1" /> 新增章節</Button>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">載入中...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">尚未有章節</p>
      ) : (
        items.map((c, i) => (
          <div key={c.id} className="border rounded p-3 space-y-2 bg-muted/30">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">#{c.sort_order}</span>
              <Button size="icon" variant="ghost" type="button" onClick={() => move(i, -1)}><ChevronUp className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" type="button" onClick={() => move(i, 1)}><ChevronDown className="w-4 h-4" /></Button>
              <div className="flex-1" />
              <Button size="icon" variant="ghost" type="button" onClick={() => remove(c.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
            <div>
              <Label className="text-xs">章節標題</Label>
              <Input value={c.title} onChange={(e) => update(c.id, { title: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">章節介紹</Label>
              <Textarea rows={2} value={c.description || ""} onChange={(e) => update(c.id, { description: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div>
                <Label className="text-xs">影片網址（YouTube 或上傳檔案後自動填入）</Label>
                <div className="flex gap-2">
                  <Input value={c.video_url || ""} onChange={(e) => update(c.id, { video_url: e.target.value })} placeholder="https://www.youtube.com/watch?v=... 或留空後上傳影片" />
                  <label>
                    <input type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadVideo(c, f); e.target.value = ""; }} />
                    <Button type="button" variant="outline" size="sm" disabled={uploadingId === c.id} asChild>
                      <span className="cursor-pointer shrink-0">
                        {uploadingId === c.id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
                        {uploadingId === c.id ? "上傳中" : "上傳影片"}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
              <div>
                <Label className="text-xs">時長（分鐘）</Label>
                <Input type="number" value={c.duration_minutes ?? ""} onChange={(e) => update(c.id, { duration_minutes: e.target.value ? parseInt(e.target.value) : null })} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={c.is_preview} onCheckedChange={(v) => update(c.id, { is_preview: v })} />
                <Label className="text-xs">免費試看</Label>
              </div>
              <Button size="sm" type="button" onClick={() => save(c)}>儲存此章節</Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ChapterManager;
