import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, ChevronUp, ChevronDown, Upload, Loader2 } from "lucide-react";
import { apiPost } from "@/lib/api";

interface Chapter {
  id: string; course_id: string; title: string;
  description: string | null; video_url: string | null;
  duration_minutes: number | null; sort_order: number;
  is_preview: boolean; hls_ready: boolean;
}

const ChapterManager = ({ courseId }: { courseId: string }) => {
  const { getIdToken } = useAuth();
  const [items, setItems] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const adminDb = async (method: string, table: string, payload?: object, filters?: object) => {
    const token = await getIdToken();
    return apiPost("/admin-db", { method, table, payload, filters }, token || undefined);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminDb("GET", `course_chapters?course_id=eq.${courseId}&order=sort_order`);
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast({ title: "載入失敗", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [courseId]);

  const add = async () => {
    const nextOrder = (items[items.length - 1]?.sort_order ?? 0) + 1;
    try {
      await adminDb("POST", "course_chapters", { course_id: courseId, title: "新章節", sort_order: nextOrder });
      load();
    } catch (e: any) {
      toast({ title: "新增失敗", description: e.message, variant: "destructive" });
    }
  };

  const update = (id: string, patch: Partial<Chapter>) =>
    setItems(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));

  const save = async (c: Chapter) => {
    try {
      await adminDb("PATCH", "course_chapters", {
        title: c.title, description: c.description, video_url: c.video_url,
        duration_minutes: c.duration_minutes, sort_order: c.sort_order, is_preview: c.is_preview,
      }, { id: `eq.${c.id}` });
      toast({ title: "已儲存" });
    } catch (e: any) {
      toast({ title: "儲存失敗", description: e.message, variant: "destructive" });
    }
  };

  const remove = async (id: string) => {
    if (!confirm("確定刪除此章節？")) return;
    try {
      await adminDb("DELETE", "course_chapters", undefined, { id: `eq.${id}` });
      load();
    } catch (e: any) {
      toast({ title: "刪除失敗", description: e.message, variant: "destructive" });
    }
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    const a = items[idx], b = items[j];
    await adminDb("PATCH", "course_chapters", { sort_order: b.sort_order }, { id: `eq.${a.id}` });
    await adminDb("PATCH", "course_chapters", { sort_order: a.sort_order }, { id: `eq.${b.id}` });
    load();
  };

  const uploadVideo = async (chapter: Chapter, file: File) => {
    setUploadingId(chapter.id);
    try {
      const token = await getIdToken();
      const { upload_url, s3_key } = await apiPost<{ upload_url: string; s3_key: string }>(
        "/upload-url",
        { course_id: courseId, chapter_id: chapter.id, filename: file.name, content_type: file.type || "video/mp4" },
        token || undefined
      );
      const uploadRes = await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "video/mp4",
        },
      });
      if (!uploadRes.ok) throw new Error("S3 上傳失敗");
      await adminDb("PATCH", "course_chapters", { video_url: s3_key, hls_ready: false }, { id: `eq.${chapter.id}` });
      toast({ title: "影片上傳成功", description: "正在轉檔中，完成後自動可播放" });
      load();
    } catch (e: any) {
      toast({ title: "上傳失敗", description: e.message, variant: "destructive" });
    } finally {
      setUploadingId(null);
    }
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
              {c.hls_ready && <span className="text-xs text-green-600">✓ 已轉檔</span>}
              {!c.hls_ready && c.video_url && <span className="text-xs text-amber-500">轉檔中...</span>}
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
                <Label className="text-xs">影片（YouTube 網址或上傳檔案）</Label>
                <div className="flex gap-2">
                  <Input value={c.video_url || ""} onChange={(e) => update(c.id, { video_url: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." />
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
