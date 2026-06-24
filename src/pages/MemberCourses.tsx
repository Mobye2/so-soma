import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlayCircle, Lock, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CourseRow {
  id: string;
  title: string;
  slug: string;
  cover_image: string | null;
  description: string | null;
}

const MemberCourses = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [accessIds, setAccessIds] = useState<Set<string>>(new Set());
  const [previewIds, setPreviewIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("courses")
        .select("id,title,slug,cover_image,description")
        .order("created_at", { ascending: false });
      setCourses((data as CourseRow[]) || []);

      const { data: access } = await supabase
        .from("user_course_access")
        .select("course_id")
        .eq("user_id", user.sub);
      setAccessIds(new Set((access || []).map((a) => a.course_id)));

      const { data: previews } = await supabase
        .from("course_chapters")
        .select("course_id")
        .eq("is_preview", true);
      setPreviewIds(new Set((previews || []).map((p) => p.course_id)));

      setLoading(false);
    })();
  }, [user]);

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-20 md:py-28">
        <div className="container-brand max-w-5xl px-4">
          <h1 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground mb-2">
            會員課程
          </h1>
          <p className="text-muted-foreground mb-8">
            觀看您的專屬線上課程影片。
          </p>

          {courses.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                目前尚無課程。
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((c) => {
                const hasAccess = accessIds.has(c.id);
                const hasPreview = previewIds.has(c.id);
                return (
                  <Card key={c.id} className={`overflow-hidden ${!hasAccess && !hasPreview ? "opacity-60" : ""}`}>
                    <div className="relative">
                      {c.cover_image && (
                        <img src={c.cover_image} alt={c.title} className="w-full h-44 object-cover" />
                      )}
                      {!hasAccess && !hasPreview && <div className="absolute inset-0 bg-black/25 pointer-events-none" />}
                      <div className="absolute top-2 right-2 flex gap-1">
                        {hasPreview && !hasAccess && (
                          <Badge className="gap-1 bg-sky-500 hover:bg-sky-500 text-white">
                            <Eye className="w-3 h-3" /> 免費試看
                          </Badge>
                        )}
                        {!hasAccess && (
                          <Badge variant="secondary" className="gap-1">
                            <Lock className="w-3 h-3" /> 未購買
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-serif-tc text-lg font-semibold">{c.title}</h3>
                      {c.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                      )}
                      <Button asChild className="w-full" variant={hasAccess ? "default" : "outline"}>
                        <Link to={hasAccess || hasPreview ? `/member/courses/${c.slug}` : "/shop"}>
                          <PlayCircle className="w-4 h-4 mr-1" /> 進入課程
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default MemberCourses;
