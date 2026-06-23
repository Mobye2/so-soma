import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface CourseRow {
  id: string;
  title: string;
  slug: string;
  cover_image: string | null;
  description: string | null;
}

const MyCoursesTab = ({ user }: { user: User }) => {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: enr } = await supabase
        .from("course_enrollments")
        .select("course_id")
        .eq("user_id", user.id);
      const ids = (enr || []).map((e: any) => e.course_id);
      if (ids.length === 0) {
        setCourses([]); setLoading(false); return;
      }
      const { data } = await supabase
        .from("courses")
        .select("id,title,slug,cover_image,description")
        .in("id", ids);
      setCourses((data as CourseRow[]) || []);
      setLoading(false);
    })();
  }, [user.id]);

  if (loading) return <p className="text-muted-foreground">載入中...</p>;
  if (courses.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          您尚未擁有任何課程的觀看權限。
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {courses.map((c) => (
        <Card key={c.id} className="overflow-hidden">
          {c.cover_image && (
            <img src={c.cover_image} alt={c.title} className="w-full h-40 object-cover" />
          )}
          <CardContent className="p-4 space-y-3">
            <h3 className="font-serif-tc text-lg font-semibold">{c.title}</h3>
            {c.description && <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>}
            <Button asChild className="w-full">
              <Link to={`/member/courses/${c.slug}`}><PlayCircle className="w-4 h-4 mr-1" /> 開始觀看</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MyCoursesTab;
