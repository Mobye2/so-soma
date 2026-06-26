import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiPost } from "@/lib/api";
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
  const { getIdToken } = useAuth();
  const [list, setList] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [email, setEmail] = useState("");
  const [courseId, setCourseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      const [enrollments, coursesData] = await Promise.all([
        apiPost("/admin-db", { method: "GET", table: "course_enrollments?order=granted_at.desc" }, token || undefined),
        apiPost("/admin-db", { method: "GET", table: "courses?order=sort_order&select=id,title,slug" }, token || undefined),
      ]);
      const enrList = Array.isArray(enrollments) ? enrollments as Enrollment[] : [];
      const userIds = [...new Set(enrList.map((e: Enrollment) => e.user_id))];
      const courseIds = [...new Set(enrList.map((e: Enrollment) => e.course_id))];
      
      const [profiles, coursesDetail] = await Promise.all([
        userIds.length ? apiPost("/admin-db", { method: "GET", table: `profiles?id=in.(${userIds.join(",")})&select=id,email,display_name` }, token || undefined) : Promise.resolve([]),
        courseIds.length ? apiPost("/admin-db", { method: "GET", table: `courses?id=in.(${courseIds.join(",")})&select=id,title,slug` }, token || undefined) : Promise.resolve([]),
      ]);
      
      const pMap = new Map((Array.isArray(profiles) ? profiles : []).map((p: any) => [p.id, p]));
      const cMap = new Map((Array.isArray(coursesDetail) ? coursesDetail : []).map((c: any) => [c.id, c]));
      setList(enrList.map((e) => ({ ...e, profile: pMap.get(e.user_id) as any, course: cMap.get(e.course_id) as any })));
      setCourses(Array.isArray(coursesData) ? coursesData as Course[] : []);
    } catch (e) {
      console.error("Failed to load enrollments:", e);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const grant = async () => {
    if (!email.trim() || !courseId) return toast({ title: "請填寫 Email 與選擇課程", variant: "destructive" });
    setSaving(true);
    try {
      const token = await getIdToken();
      const prof = await apiPost("/admin-db", {
        method: "GET",
        table: `profiles?email=eq.${encodeURIComponent(email.trim().toLowerCase())}&select=id&limit=1`
      }, token || undefined);
      
      if (!prof || !Array.isArray(prof) || prof.length === 0) {
        setSaving(false);
        return toast({ title: "找不到此會員", description: "請確認該 Email 已註冊", variant: "destructive" });
      }
      
      await apiPost("/admin-db", {
        method: "POST",
        table: "course_enrollments",
        payload: { user_id: prof[0].id, course_id: courseId, source: "manual" }
      }, token || undefined);
      
      toast({ title: "授權成功" });
      setEmail(""); setCourseId("");
      load();
    } catch (error: any) {
      toast({ title: "授權失敗", description: error.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const revoke = async (id: string) => {
    if (!confirm("確定撤銷此授權？")) return;
    try {
      const token = await getIdToken();
      await apiPost("/admin-db", {
        method: "DELETE",
        table: "course_enrollments",
        filters: { id: `eq.${id}` }
      }, token || undefined);
      toast({ title: "已撤銷" });
      load();
    } catch (error: any) {
      toast({ title: "撤銷失敗", description: error.message, variant: "destructive" });
    }
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
