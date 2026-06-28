import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, BookOpen, Clock, Users, Check,
         PlayCircle, Download, MapPin, Video, Calendar } from "lucide-react";

interface Product {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  category: string;
  cover_image: string | null;
  post_purchase_note: string | null;
  post_purchase_image: string | null;
  ebook_download_url: string | null;
  ebook_file_format: string | null;
  event_datetime: string | null;
  event_location: string | null;
  event_meeting_notes: string | null;
  event_notes: string | null;
  live_stream_url: string | null;
  live_time_notes: string | null;
}

interface Course {
  instructor: string | null;
  audience: string[];
  modules: string[];
  access_days: number | null;
}

interface Access {
  granted_at: string;
  expires_at: string | null;
}

const categoryLabels: Record<string, string> = {
  online_course: "線上課程",
  live_class: "即時課程",
  event: "實體活動",
  ebook: "電子書",
  other: "其他",
};

const MemberPurchase = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [access, setAccess] = useState<Access | null>(null);
  const [courseSlug, setCourseSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user || !productId) return;
    (async () => {
      const { data: p } = await supabase
        .from("products")
        .select("id,title,subtitle,description,category,cover_image,post_purchase_note,post_purchase_image,ebook_download_url,ebook_file_format,event_datetime,event_location,event_meeting_notes,event_notes,live_stream_url,live_time_notes")
        .eq("id", productId)
        .maybeSingle();
      if (!p) { setLoading(false); return; }
      setProduct(p as Product);

      const { data: c } = await supabase
        .from("courses")
        .select("instructor,audience,modules,access_days")
        .eq("product_id", productId)
        .maybeSingle();
      if (c) setCourse(c as Course);

      // 課程類取得 slug
      const { data: slugRow } = await supabase
        .from("courses")
        .select("slug")
        .eq("product_id", productId)
        .maybeSingle();
      if (slugRow) setCourseSlug(slugRow.slug);

      if (!isAdmin) {
        const { data: a } = await supabase
          .from("user_product_access")
          .select("granted_at,expires_at")
          .eq("user_id", user.sub)
          .eq("product_id", productId)
          .maybeSingle();
        if (!a) { navigate("/member/purchases"); return; }
        setAccess(a);
      } else {
        setAccess({ granted_at: new Date().toISOString(), expires_at: null });
      }

      setLoading(false);
    })();
  }, [user, productId, isAdmin]);

  if (authLoading || loading) return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    </Layout>
  );

  if (!product) return (
    <Layout>
      <div className="container-brand py-20 text-center space-y-4">
        <p className="text-muted-foreground">找不到此商品</p>
        <Button asChild variant="outline"><Link to="/member/purchases">回我的購買</Link></Button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-brand max-w-4xl">
          <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
            <Link to="/member/purchases"><ArrowLeft className="w-4 h-4 mr-1" /> 我的購買</Link>
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* 左：圖片 */}
            <div>
              {product.cover_image ? (
                <img src={product.cover_image} alt={product.title}
                  className="w-full rounded-xl object-cover aspect-video" />
              ) : (
                <div className="w-full rounded-xl bg-mist aspect-video flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-muted-foreground/30" />
                </div>
              )}
            </div>

            {/* 右：資訊 */}
            <div className="space-y-5">
              <div className="space-y-2">
                <Badge variant="secondary">{categoryLabels[product.category] || product.category}</Badge>
                <h1 className="font-serif-tc text-2xl md:text-3xl font-semibold leading-snug">
                  {product.title}
                </h1>
                {product.subtitle && <p className="text-muted-foreground">{product.subtitle}</p>}
              </div>

              {product.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
              )}

              {course && (
                <div className="space-y-2 text-sm text-muted-foreground">
                  {course.instructor && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-secondary shrink-0" />
                      <span>講師：{course.instructor}</span>
                    </div>
                  )}
                  {course.access_days ? (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-secondary shrink-0" />
                      <span>購買後 {course.access_days} 天內可觀看</span>
                    </div>
                  ) : product.category === "online_course" && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-secondary shrink-0" />
                      <span>永久觀看</span>
                    </div>
                  )}
                </div>
              )}

              {/* 購買資訊 */}
              <div className="pt-4 border-t border-border space-y-1 text-sm text-muted-foreground">
                {access && (
                  <p>購買日期：{new Date(access.granted_at).toLocaleDateString("zh-TW")}</p>
                )}
                {access?.expires_at && (
                  <p>到期日：{new Date(access.expires_at).toLocaleDateString("zh-TW")}</p>
                )}
              </div>

              {/* 線上課程進入按鈕 */}
              {(product.category === "online_course" || product.category === "live_class") && courseSlug && (
                <Button asChild className="gap-2">
                  <Link to={`/member/courses/${courseSlug}`}>
                    <PlayCircle className="w-4 h-4" /> 進入課程
                  </Link>
                </Button>
              )}
            </div>
          </div>

              {/* 關於你的購買 */}
          {(product.post_purchase_image || product.post_purchase_note ||
            product.ebook_download_url || product.event_datetime || product.event_location ||
            product.live_stream_url) && (
            <div className="mt-10 space-y-4 p-6 border border-border rounded-xl bg-muted/30">
              <h2 className="font-serif-tc text-lg font-semibold">關於你的購買</h2>

              {product.post_purchase_image && (
                <img src={product.post_purchase_image} alt="" className="w-full rounded-lg" />
              )}
              {product.post_purchase_note && (
                <p className="text-sm text-muted-foreground whitespace-pre-line">{product.post_purchase_note}</p>
              )}

              {/* 電子書 */}
              {product.ebook_download_url && (
                <div className="space-y-2">
                  {product.ebook_file_format && (
                    <p className="text-xs text-muted-foreground">格式：{product.ebook_file_format}</p>
                  )}
                  <Button asChild className="gap-2">
                    <a href={product.ebook_download_url} target="_blank" rel="noreferrer">
                      <Download className="w-4 h-4" /> 下載電子書
                    </a>
                  </Button>
                </div>
              )}

              {/* 實體活動 */}
              {(product.event_datetime || product.event_location) && (
                <div className="space-y-2 text-sm">
                  {product.event_datetime && (
                    <div className="flex gap-2 items-center text-muted-foreground">
                      <Calendar className="w-4 h-4 text-secondary shrink-0" />
                      <span>{product.event_datetime}</span>
                    </div>
                  )}
                  {product.event_location && (
                    <div className="flex gap-2 items-center text-muted-foreground">
                      <MapPin className="w-4 h-4 text-secondary shrink-0" />
                      <span>{product.event_location}</span>
                    </div>
                  )}
                  {product.event_meeting_notes && (
                    <p className="text-muted-foreground pl-6">{product.event_meeting_notes}</p>
                  )}
                  {product.event_notes && (
                    <p className="text-muted-foreground whitespace-pre-line pl-6">{product.event_notes}</p>
                  )}
                </div>
              )}

              {/* 即時課程直播 */}
              {product.live_stream_url && (
                <div className="space-y-2">
                  {product.live_time_notes && (
                    <p className="text-sm text-muted-foreground">{product.live_time_notes}</p>
                  )}
                  <Button asChild variant="outline" className="gap-2">
                    <a href={product.live_stream_url} target="_blank" rel="noreferrer">
                      <Video className="w-4 h-4" /> 進入直播間
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* 課程大綱 & 適合對象 */}
          {course && (course.modules?.length > 0 || course.audience?.length > 0) && (
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
              {course.modules?.length > 0 && (
                <div>
                  <h2 className="font-serif-tc text-lg font-semibold mb-4">課程大綱</h2>
                  <ul className="space-y-2">
                    {course.modules.map((m, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-secondary shrink-0 mt-0.5" />{m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {course.audience?.length > 0 && (
                <div>
                  <h2 className="font-serif-tc text-lg font-semibold mb-4">適合對象</h2>
                  <ul className="space-y-2">
                    {course.audience.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-secondary shrink-0 mt-0.5" />{a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default MemberPurchase;
