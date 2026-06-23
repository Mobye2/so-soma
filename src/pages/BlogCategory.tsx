import { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Instagram, ArrowLeft } from "lucide-react";

type CategoryName = "神經系統科普" | "正念陰瑜珈練習" | "森林療癒" | "自我照顧";

const CATEGORY_MAP: Record<string, { name: CategoryName; title: string; description: string }> = {
  "nervous-system": {
    name: "神經系統科普",
    title: "神經系統科普文章｜多重迷走神經・自律神經科普｜煦日之森",
    description: "由諮商心理師 Kaia 撰寫的神經系統科普文章。理解多重迷走神經理論、自律神經運作，用科學陪你溫柔地認識自己。",
  },
  "yin-yoga": {
    name: "正念陰瑜珈練習",
    title: "正念陰瑜珈練習筆記｜身體覺察書寫｜煦日之森",
    description: "正念陰瑜珈練習心得、體式筆記與身體覺察書寫。從每一次靜止停留，重新認識身體的智慧。",
  },
  "forest-therapy": {
    name: "森林療癒",
    title: "森林療癒文章｜自然療癒科普與練習｜煦日之森",
    description: "森林療癒科學文獻整理、五感練習指南與在地森林觀察。讓自然成為你日常的修復處方。",
  },
  "self-care": {
    name: "自我照顧",
    title: "自我照顧文章｜日常身心練習筆記｜煦日之森",
    description: "自我照顧的日常練習、情緒陪伴書寫與身心建議。在忙碌的生活裡，把自己也放回照顧名單。",
  },
};

type Post = {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string | null;
  created_at: string;
};

const BlogCategory = () => {
  const { slug } = useParams<{ slug: string }>();
  const config = slug ? CATEGORY_MAP[slug] : undefined;
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (!config) return;
    supabase
      .from("blog_posts")
      .select("slug,title,excerpt,cover_image,published_at,created_at")
      .eq("published", true)
      .eq("category", config.name)
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .then(({ data }) => {
        if (data) setPosts(data as Post[]);
      });
  }, [config]);

  if (!config) return <Navigate to="/blog" replace />;

  return (
    <Layout>
      <SEO
        title={config.title}
        description={config.description}
        canonicalPath={`/blog/category/${slug}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${config.name}文章 | 煦日之森`,
          url: `https://www.solisforest.com/blog/category/${slug}`,
          inLanguage: "zh-Hant",
          about: config.name,
        }}
      />

      <section className="section-padding">
        <div className="container-brand">
          <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-sage hover:underline mb-6">
            <ArrowLeft className="w-4 h-4" /> 回到所有文章
          </Link>
          <div className="text-center mb-10">
            <p className="heading-en text-xs text-muted-foreground tracking-widest mb-2">CATEGORY</p>
            <h1 className="font-serif-tc text-3xl md:text-4xl font-semibold text-foreground mb-2">
              {config.name}
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-sm text-muted-foreground leading-relaxed">
              {config.description}
            </p>
          </div>

          {posts.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">這個分類還沒有文章，請稍後再來看看。</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blog/${p.slug}`}
                  className="bg-mist rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="h-40 overflow-hidden bg-sage/5">
                    {p.cover_image ? (
                      <img src={p.cover_image} alt={p.title} className="w-full h-full object-cover" loading="lazy" width={800} height={512} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sage/10 via-mist to-cream">
                        <Instagram className="w-10 h-10 text-sage/60" />
                      </div>
                    )}
                  </div>
                  <div className="p-5 space-y-2">
                    <span className="text-xs text-sage font-medium">#{config.name}</span>
                    <h2 className="font-serif-tc text-base font-semibold text-foreground line-clamp-2">{p.title}</h2>
                    {p.excerpt && (
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{p.excerpt}</p>
                    )}
                    <span className="text-xs text-sage hover:underline">閱讀全文 →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Internal links */}
          <nav aria-label="其他分類" className="mt-16 pt-8 border-t border-border text-center">
            <h2 className="font-serif-tc text-lg font-semibold text-foreground mb-4">瀏覽其他分類</h2>
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-sage">
              {Object.entries(CATEGORY_MAP)
                .filter(([s]) => s !== slug)
                .map(([s, c]) => (
                  <li key={s}>
                    <Link to={`/blog/category/${s}`} className="hover:underline">#{c.name}</Link>
                  </li>
                ))}
              <li><Link to="/blog" className="hover:underline">所有文章</Link></li>
            </ul>
          </nav>
        </div>
      </section>
    </Layout>
  );
};

export default BlogCategory;
