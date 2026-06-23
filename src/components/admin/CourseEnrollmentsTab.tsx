import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  source: string;
  granted_at: string;
  expires_at: string | null;
  course?: { title: string; slug: string };
  profile?: { email: string | null; display_name: string | null };
}
interface Course { id: string; title: string; slug: string; }

const CourseEnrollmentsTab = () => {
  const [list, setList] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [email, setEmail] = useState("");
  const [courseId, setCourseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [enrRes, courseRes] = await Promise.all([
      supabase.from("course_enrollments").select("*").order("granted_at", { ascending: false }),
      supabase.from("courses").select("id,title,slug").order("sort_order"),
    ]);
    const enrollments = (enrRes.data as Enrollment[]) || [];
    const userIds = [...new Set(enrollments.map((e) => e.user_id))];
    const courseIds = [...new Set(enrollments.map((e) => e.course_id))];
    const [profiles, coursesData] = await Promise.all([
      userIds.length ? supabase.from("profiles").select("id,email,display_name").in("id", userIds) : Promise.resolve({ data: [] }),
      courseIds.length ? supabase.from("courses").select("id,title,slug").in("id", courseIds) : Promise.resolve({ data: [] }),
    ]);
    const pMap = new Map((profiles.data || []).map((p: any) => [p.id, p]));
    const cMap = new Map(((coursesData as any).data || []).map((c: any) => [c.id, c]));
    setList(enrollments.map((e) => ({ ...e, profile: pMap.get(e.user_id) as any, course: cMap.get(e.course_id) as any })));
    setCourses((courseRes.data as Course[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const grant = async () => {
    if (!email.trim() || !courseId) return toast({ title: "請填寫 Email 與選擇課程", variant: "destructive" });
    setSaving(true);
    const { data: prof, error: pErr } = await supabase.from("profiles").select("id").eq("email", email.trim().toLowerCase()).maybeSingle();
    if (pErr || !prof) {
      setSaving(false);
      return toast({ title: "找不到此會員", description: "請確認該 Email 已註冊", variant: "destructive" });
    }
    const { error } = await supabase.from("course_enrollments").insert({
      user_id: prof.id, course_id: courseId, source: "manual",
    });
    setSaving(false);
    if (error) return toast({ title: "授權失敗", description: error.message, variant: "destructive" });
    toast({ title: "授權成功" });
    setEmail(""); setCourseId("");
    load();
  };

  const revoke = async (id: string) => {
    if (!confirm("確定撤銷此授權？")) return;
    const { error } = await supabase.from("course_enrollments").delete().eq("id", id);
    if (error) return toast({ title: "撤銷失敗", description: error.message, variant: "destructive" });
    toast({ title: "已撤銷" });
    load();
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <h3 className="text-lg font-semibold">課程授權管理</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end border-b pb-4">
          <div>
            <Label>會員 Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="member@example.com" />
          </div>
          <div>
            <Label>選擇課程</Label>
            <select className="w-full h-10 border rounded px-3 bg-background" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              <option value="">-- 選擇 --</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <Button onClick={grant} disabled={saving}>{saving ? "授權中..." : "授權課程"}</Button>
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
                <TableHead>課程</TableHead>
                <TableHead>來源</TableHead>
                <TableHead>授權時間</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <div className="text-sm">{e.profile?.email || e.user_id}</div>
                    {e.profile?.display_name && <div className="text-xs text-muted-foreground">{e.profile.display_name}</div>}
                  </TableCell>
                  <TableCell>{e.course?.title || e.course_id}</TableCell>
                  <TableCell><span className="text-xs">{e.source}</span></TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{new Date(e.granted_at).toLocaleString("zh-TW")}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => revoke(e.id)}><Trash2 className="w-4 h-4" /></Button>
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
