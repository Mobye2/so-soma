import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, PlayCircle, Loader2, ArrowLeft } from "lucide-react";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

interface Course { id: string; title: string; slug: string; description: string | null; }
interface Chapter {
  id: string; title: string; description: string | null;
  video_url: string | null; duration_minutes: number | null;
  sort_order: number; is_preview: boolean;
}

const MemberCourse = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user || !slug) return;
    (async () => {
      const { data: c } = await supabase
        .from("courses").select("id,title,slug,description")
        .eq("slug", slug).maybeSingle();
      if (!c) { setLoading(false); return; }
      setCourse(c as Course);

      const chRes = await supabase
        .from("course_chapters").select("*")
        .eq("course_id", (c as Course).id).order("sort_order");
      const ch = (chRes.data as Chapter[]) || [];
      setChapters(ch);
      setHasAccess(true);
      setActiveId(ch[0]?.id || null);
      setLoading(false);
    })();
  }, [user, slug]);

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }
  if (!course) {
    return (
      <Layout>
        <div className="container-brand py-20 text-center">
          <p className="text-muted-foreground mb-4">找不到此課程</p>
          <Button asChild variant="outline"><Link to="/member-courses">回會員課程</Link></Button>
        </div>
      </Layout>
    );
  }

  const active = chapters.find((c) => c.id === activeId);
  const canPlay = active ? (hasAccess || active.is_preview) : false;
  const videoUrl = active?.video_url || "";
  const isYouTube = /youtube\.com|youtu\.be/.test(videoUrl);
  const embed = canPlay && isYouTube ? getYouTubeEmbedUrl(videoUrl) : null;
  const fileUrl = canPlay && !isYouTube && videoUrl ? videoUrl : null;

  return (
    <Layout>
      <section className="py-10 md:py-16">
        <div className="container-brand px-4">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link to="/member-courses"><ArrowLeft className="w-4 h-4 mr-1" /> 會員課程</Link>
          </Button>
          <h1 className="font-serif-tc text-2xl md:text-3xl font-semibold mb-2">{course.title}</h1>
          {course.description && <p className="text-muted-foreground mb-6">{course.description}</p>}

          {!hasAccess && (
            <Card className="mb-6 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="p-4 text-sm">
                您尚未取得此課程的觀看權限，僅能觀看免費試看章節。
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                {embed ? (
                  <iframe
                    src={embed}
                    title={active?.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : fileUrl ? (
                  <video src={fileUrl} controls controlsList="nodownload" className="w-full h-full" />
                ) : (
                  <div className="text-white/70 text-sm flex flex-col items-center gap-2">
                    <Lock className="w-8 h-8" />
                    {active ? "此章節需要課程權限" : "尚未選擇章節"}
                  </div>
                )}
              </div>
              {active && (
                <div>
                  <h2 className="font-semibold text-lg mb-2">{active.title}</h2>
                  {active.description && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{active.description}</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">章節列表</h3>
              {chapters.length === 0 && <p className="text-sm text-muted-foreground">尚未有章節</p>}
              {chapters.map((c, i) => {
                const locked = !hasAccess && !c.is_preview;
                const isActive = c.id === activeId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className={`w-full text-left p-3 rounded border transition ${
                      isActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-muted-foreground mt-1">{i + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{c.title}</span>
                          {c.is_preview && <Badge variant="secondary" className="text-xs">試看</Badge>}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {locked ? <Lock className="w-3 h-3" /> : <PlayCircle className="w-3 h-3" />}
                          {c.duration_minutes ? `${c.duration_minutes} 分鐘` : ""}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default MemberCourse;
