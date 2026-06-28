import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Hls from "hls.js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, PlayCircle, Loader2, ArrowLeft } from "lucide-react";
import { apiPost } from "@/lib/api";

interface Course { id: string; title: string; slug: string; description: string | null; }
interface Chapter {
  id: string; title: string; description: string | null;
  video_url: string | null; duration_minutes: number | null;
  sort_order: number; is_preview: boolean; hls_ready: boolean;
}

const MemberCourse = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, getIdToken, isAdmin } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

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

      const { data: ch } = await supabase
        .from("course_chapters").select("*")
        .eq("course_id", (c as Course).id).order("sort_order");
      const chapters = (ch as Chapter[]) || [];
      setChapters(chapters);

      if (isAdmin) {
        setHasAccess(true);
      } else {
        const token = await getIdToken();
        const { has_access } = await apiPost<{ has_access: boolean }>(
          "/course-access", { course_id: (c as Course).id }, token || undefined
        );
        setHasAccess(has_access);
      }
      setActiveId(chapters[0]?.id || null);
      setLoading(false);
    })();
  }, [user, slug]);

  // Load video when active chapter changes
  useEffect(() => {
    if (!activeId || !user) return;
    const chapter = chapters.find(c => c.id === activeId);
    if (!chapter) return;

    const canPlay = hasAccess || chapter.is_preview;
    if (!canPlay) return;

    // YouTube: embed directly
    if (chapter.video_url && /youtube\.com|youtu\.be/.test(chapter.video_url)) return;

    // Not HLS ready yet
    if (!chapter.hls_ready) return;

    loadHls(chapter.id);
  }, [activeId, hasAccess, chapters]);

  const loadHls = async (chapterId: string) => {
    setVideoLoading(true);
    setVideoError(null);

    try {
      const token = await getIdToken();
      const res = await apiPost<{
        hls_url: string;
        cookies: Record<string, string>;
      }>("/issue-cookie", { chapter_id: chapterId }, token || undefined);

      // Use signed URL directly (no need to set cookies)
      // CloudFront will verify the signature from URL query parameters

      // Init HLS.js
      const video = videoRef.current;
      if (!video) return;

      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

      // Extract signature parameters from the signed URL
      const url = new URL(res.hls_url);
      const policy = url.searchParams.get('Policy');
      const signature = url.searchParams.get('Signature');
      const keyPairId = url.searchParams.get('Key-Pair-Id');

      if (Hls.isSupported()) {
        const hls = new Hls({
          xhrSetup: (xhr, url) => {
            // Add CloudFront signature to all segment requests
            const segmentUrl = new URL(url);
            if (policy) segmentUrl.searchParams.set('Policy', policy);
            if (signature) segmentUrl.searchParams.set('Signature', signature);
            if (keyPairId) segmentUrl.searchParams.set('Key-Pair-Id', keyPairId);
            xhr.open('GET', segmentUrl.toString(), true);
          }
        });
        hlsRef.current = hls;
        hls.loadSource(res.hls_url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => { setVideoLoading(false); video.play().catch(() => {}); });
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) setVideoError("影片載入失敗，請重新整理");
          setVideoLoading(false);
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari native HLS
        video.src = res.hls_url;
        video.load();
        setVideoLoading(false);
      } else {
        setVideoError("此瀏覽器不支援 HLS 播放");
        setVideoLoading(false);
      }
    } catch (e: any) {
      setVideoError(e.message || "無法載入影片");
      setVideoLoading(false);
    }
  };

  // Cleanup HLS on unmount
  useEffect(() => {
    return () => { hlsRef.current?.destroy(); };
  }, []);

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
          <Button asChild variant="outline"><Link to="/member/purchases">回我的購買</Link></Button>
        </div>
      </Layout>
    );
  }

  const active = chapters.find(c => c.id === activeId);
  const canPlay = active ? (hasAccess || active.is_preview) : false;
  const isYouTube = active?.video_url ? /youtube\.com|youtu\.be/.test(active.video_url) : false;

  // YouTube embed URL
  const youtubeEmbed = isYouTube && canPlay && active?.video_url ? (() => {
    try {
      const u = new URL(active.video_url!);
      let id = "";
      if (u.hostname.includes("youtu.be")) id = u.pathname.slice(1);
      else id = u.searchParams.get("v") || "";
      return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1` : null;
    } catch { return null; }
  })() : null;

  return (
    <Layout>
      <section className="py-10 md:py-16">
        <div className="container-brand px-4">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link to="/member/purchases"><ArrowLeft className="w-4 h-4 mr-1" /> 我的購買</Link>
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
              <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center relative">
                {/* YouTube */}
                {youtubeEmbed && (
                  <iframe src={youtubeEmbed} title={active?.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen />
                )}

                {/* HLS video */}
                {!isYouTube && canPlay && (
                  <video ref={videoRef} controls controlsList="nodownload"
                    className="w-full h-full" playsInline />
                )}

                {/* Loading overlay */}
                {videoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <Loader2 className="w-8 h-8 animate-spin text-white/70" />
                  </div>
                )}

                {/* Error */}
                {videoError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80">
                    <p className="text-white/70 text-sm">{videoError}</p>
                    <Button size="sm" variant="outline" onClick={() => active && loadHls(active.id)}>重試</Button>
                  </div>
                )}

                {/* Not ready */}
                {!isYouTube && canPlay && active && !active.hls_ready && !videoLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-white/50" />
                    <p className="text-white/50 text-sm">影片處理中，請稍後再試</p>
                  </div>
                )}

                {/* No access */}
                {!canPlay && (
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
                  <button key={c.id} onClick={() => setActiveId(c.id)}
                    className={`w-full text-left p-3 rounded border transition ${
                      isActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                    }`}>
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
                          {!c.hls_ready && !locked && <span className="text-amber-500">處理中</span>}
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
