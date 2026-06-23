import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Facebook, Instagram, Share2, Eye } from "lucide-react";
import { useAdminCheck } from "@/hooks/useAdminCheck";

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string | null;
  category: string;
  read_time: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  author: string;
}


const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const previewParam = searchParams.get("preview") === "1";
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const previewMode = previewParam && isAdmin;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    // Wait for admin check to settle when preview is requested
    if (previewParam && adminLoading) return;

    const run = async () => {
      setLoading(true);
      let query = supabase.from("blog_posts").select("*").eq("slug", slug);
      if (!previewMode) {
        query = query.eq("published", true).lte("published_at", new Date().toISOString());
      }
      const { data } = await query.maybeSingle();
      setPost((data as Post | null) ?? null);
      setNotFound(!data);
      setLoading(false);
    };
    run();
  }, [slug, previewMode, previewParam, adminLoading]);

  if (loading) return <Layout><div className="section-padding text-center text-muted-foreground">載入中...</div></Layout>;
  // If preview was requested but user isn't admin, redirect to blog
  if (previewParam && !adminLoading && !isAdmin) return <Navigate to="/blog" replace />;
  if (notFound || !post) return <Navigate to="/blog" replace />;

  const date = (post.published_at || post.created_at).slice(0, 10);
  const url = `https://www.solisforest.com/blog/${post.slug}`;
  const scheduled = post.published && post.published_at && new Date(post.published_at) > new Date();
  const isDraft = !post.published;

  return (
    <Layout>
      <SEO
        title={`${post.title} | 煦日之森`}
        description={post.excerpt}
        canonicalPath={`/blog/${post.slug}`}
        image={post.cover_image || undefined}
        type="article"
        noindex={previewMode}
        jsonLd={previewMode ? undefined : {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt,
          image: post.cover_image || undefined,
          datePublished: date,
          author: { "@type": "Person", name: post.author || "Kaia" },
          publisher: {
            "@type": "Organization",
            name: "煦日之森 Solis Atelier",
            url: "https://www.solisforest.com",
          },
          articleSection: post.category,
          inLanguage: "zh-Hant",
          mainEntityOfPage: url,
        }}
      />

      {previewMode && (
        <div className="sticky top-0 z-40 bg-amber-100 border-b border-amber-300 text-amber-900 text-xs md:text-sm">
          <div className="container-brand py-2 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <strong>預覽模式</strong>
              {scheduled && <span>· 已排程於 {post.published_at!.slice(0, 16).replace("T", " ")} 公開</span>}
              {isDraft && <span>· 草稿（尚未發佈）</span>}
              {!scheduled && !isDraft && <span>· 文章已公開</span>}
            </span>
            <span className="text-amber-800/80">此頁不會被搜尋引擎索引，僅限管理員預覽</span>
          </div>
        </div>
      )}

      <article className="section-padding">
        <div className="container-brand max-w-3xl">
          <nav className="text-xs text-muted-foreground mb-6">
            <Link to="/" className="hover:text-sage">首頁</Link>
            <span className="mx-2">/</span>
            <Link to="/blog" className="hover:text-sage">專欄</Link>
            <span className="mx-2">/</span>
            <span>{post.title}</span>
          </nav>

          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 rounded-full bg-sage/10 text-xs text-sage font-medium">#{post.category}</span>
            <span className="text-xs text-muted-foreground">{date}</span>
            {post.read_time && <span className="text-xs text-muted-foreground">· 閱讀 {post.read_time}</span>}
          </div>

          <h1 className="font-serif-tc text-3xl md:text-4xl font-semibold text-foreground leading-snug mb-4">
            {post.title}
          </h1>
          <p className="text-xs text-muted-foreground mb-6">文｜{post.author || "Kaia"}・煦日之森</p>

          {post.cover_image && (
            <img src={post.cover_image} alt={post.title} className="w-full rounded-lg mb-8 object-cover max-h-[480px]" loading="lazy" />
          )}

          <div className="flex items-center gap-3 mb-8">
            <span className="text-xs text-muted-foreground">分享至</span>
            <button onClick={() => window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`, '_blank')} className="w-8 h-8 rounded-full bg-[#06C755] flex items-center justify-center text-white hover:opacity-80" aria-label="LINE"><Share2 className="w-4 h-4" /></button>
            <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')} className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center text-white hover:opacity-80" aria-label="Facebook"><Facebook className="w-4 h-4" /></button>
            <button onClick={() => { navigator.clipboard.writeText(url); alert('連結已複製！'); }} className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] flex items-center justify-center text-white hover:opacity-80" aria-label="Instagram"><Instagram className="w-4 h-4" /></button>
          </div>

          <div
            className="prose prose-sm md:prose-base max-w-none prose-headings:font-serif-tc prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-a:text-sage prose-img:rounded-lg"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className="mt-12 pt-8 border-t border-border text-xs text-muted-foreground">
            <p>本文內容為一般身心保健分享，不能替代醫療診斷或治療。如有身心困擾，請諮詢專業醫療人員。</p>
          </div>

          <div className="mt-8 text-center">
            <Link to="/blog" className="text-sm text-sage hover:underline">← 回到專欄列表</Link>
          </div>
        </div>
      </article>
    </Layout>
  );
};

export default BlogPost;
