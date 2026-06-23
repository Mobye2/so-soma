import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Search, Facebook, Instagram, Share2, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import InstagramEmbed from "@/components/InstagramEmbed";
import { toast } from "@/hooks/use-toast";


type Category = "神經系統科普" | "正念陰瑜珈練習" | "森林療癒" | "自我照顧";
const categories: Array<"全部" | Category> = ["全部", "神經系統科普", "正念陰瑜珈練習", "森林療癒", "自我照顧"];

type BlogItem = {
  kind: "ig" | "db";
  title: string;
  excerpt: string;
  content: string;
  categories: Category[];
  date: string;
  image?: string;
  ig_url?: string;
  slug?: string;
  featured?: boolean;
  author?: string;
};

const toSortKey = (d: string) => d.replace(/[-.]/g, "");

const Blog = () => {
  const navigate = useNavigate();
  const [activeTag, setActiveTag] = useState<"全部" | Category>("全部");
  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<BlogItem | null>(null);
  const [igItems, setIgItems] = useState<BlogItem[]>([]);
  const [dbItems, setDbItems] = useState<BlogItem[]>([]);
  const [subEmail, setSubEmail] = useState("");
  const [subbing, setSubbing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = subEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "請輸入正確的 Email", variant: "destructive" });
      return;
    }
    setSubbing(true);
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email, source: "blog" });
    setSubbing(false);
    if (error && !/duplicate|unique/i.test(error.message)) {
      toast({ title: "訂閱失敗", description: error.message, variant: "destructive" });
      return;
    }
    setSubEmail("");
    toast({ title: "訂閱成功", description: "新文章上線時，我們會寄信通知你。" });
  };

  const handleOpen = (item: BlogItem) => {
    if (item.kind === "db" && item.slug) {
      navigate(`/blog/${item.slug}`);
    } else {
      setSelectedArticle(item);
    }
  };

  useEffect(() => {
    supabase
      .from("ig_posts")
      .select("*")
      .eq("published", true)
      .order("post_date", { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        setIgItems(
          data.map((p: any) => ({
            kind: "ig" as const,
            title: p.title,
            excerpt: p.excerpt,
            content: p.content || "",
            categories: (p.categories || []) as Category[],
            date: p.post_date,
            ig_url: p.ig_url,
          }))
        );
      });

    supabase
      .from("blog_posts")
      .select("*")
      .eq("published", true)
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        setDbItems(
          data.map((p: any) => ({
            kind: "db" as const,
            title: p.title,
            excerpt: p.excerpt,
            content: p.content || "",
            categories: [p.category as Category],
            date: (p.published_at || p.created_at).slice(0, 10),
            image: p.cover_image || undefined,
            slug: p.slug,
            author: p.author || "Kaia",
          }))
        );
      });
  }, []);

  const allItems: BlogItem[] = [...igItems, ...dbItems].sort(
    (a, b) => toSortKey(b.date).localeCompare(toSortKey(a.date))
  );

  const filtered = allItems.filter((a) => {
    const matchTag = activeTag === "全部" || a.categories.includes(activeTag);
    const matchSearch = a.title.includes(search) || a.excerpt.includes(search);
    return matchTag && (search === "" || matchSearch);
  });

  const featured = dbItems[0];

  // Dynamic SEO: when an article is opened, override page meta with article meta
  const seoTitle = selectedArticle
    ? `${selectedArticle.title} | 煦日之森`
    : "身心療癒知識庫｜煦日之森部落格";
  const seoDescription = selectedArticle
    ? selectedArticle.excerpt
    : "由 Kaia 心理師撰寫的身心療癒、瑜伽、森林療癒專業文章，幫助你建立健康的自我照顧習慣。";
  const seoImage = selectedArticle?.image;
  const seoType: "website" | "article" = selectedArticle ? "article" : "website";
  const seoJsonLd = selectedArticle && selectedArticle.kind === "db"
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: selectedArticle.title,
        description: selectedArticle.excerpt,
        image: selectedArticle.image,
        datePublished: selectedArticle.date.replace(/\./g, "-"),
        author: { "@type": "Person", name: selectedArticle.author || "Kaia" },
        publisher: {
          "@type": "Organization",
          name: "煦日之森 Solis Atelier",
          url: "https://www.solisforest.com",
        },
        articleSection: selectedArticle.categories.join(", "),
        inLanguage: "zh-Hant",
      }
    : {
        "@context": "https://schema.org",
        "@type": "Blog",
        name: "煦日之森 身心專欄",
        url: "https://www.solisforest.com/blog",
        inLanguage: "zh-Hant",
        publisher: { "@type": "Organization", name: "煦日之森 Solis Atelier", url: "https://www.solisforest.com" },
      };

  return (
    <Layout>
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonicalPath="/blog"
        image={seoImage}
        type={seoType}
        jsonLd={seoJsonLd}
      />
      <section className="section-padding">
        <div className="container-brand">
          <div className="text-center mb-10">
            <h1 className="font-serif-tc text-3xl md:text-4xl font-semibold text-foreground mb-2">身心療癒專欄文章</h1>
            <p className="heading-en text-sm text-muted-foreground tracking-wider">Journal · Somatic Writing</p>
            <p className="mt-4 max-w-2xl mx-auto text-sm text-muted-foreground leading-relaxed">
              神經系統科普、正念陰瑜珈練習筆記、森林療癒觀察與自我照顧書寫，用溫柔的語言，陪你慢慢回到身體。
            </p>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="搜尋文章..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-md bg-mist border border-border text-sm focus:outline-none focus:ring-1 focus:ring-sage"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center items-center gap-2 mb-4" role="tablist" aria-label="文章分類">
            {categories.map((cat) => (
              <button
                key={cat}
                role="tab"
                aria-selected={activeTag === cat}
                onClick={() => setActiveTag(cat)}
                className={`px-4 py-1.5 rounded-full text-xs transition-colors ${
                  activeTag === cat ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mb-10 text-xs text-muted-foreground">
            <span>專屬分類頁：</span>
            <Link to="/blog/category/nervous-system" className="text-sage hover:underline">#神經系統科普</Link>
            <Link to="/blog/category/yin-yoga" className="text-sage hover:underline">#正念陰瑜珈練習</Link>
            <Link to="/blog/category/forest-therapy" className="text-sage hover:underline">#森林療癒</Link>
            <Link to="/blog/category/self-care" className="text-sage hover:underline">#自我照顧</Link>
          </div>

          {/* Featured */}
          {featured && activeTag === "全部" && search === "" && (
            <div
              className="mb-10 bg-mist rounded-lg border border-border overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleOpen(featured)}
            >
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="h-56 md:h-auto overflow-hidden">
                  <img src={featured.image} alt={featured.title} className="w-full h-full object-cover" loading="lazy" width={800} height={512} />
                </div>
                <div className="p-6 md:p-8 flex flex-col justify-center space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      {featured.categories.map((c) => (
                        <span key={c} className="text-xs text-sage font-medium">#{c}</span>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{featured.date}</span>
                  </div>
                  <h2 className="font-serif-tc text-xl md:text-2xl font-semibold text-foreground">{featured.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{featured.excerpt}</p>
                  <span className="text-xs text-sage hover:underline">閱讀全文 →</span>
                </div>
              </div>
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.filter((a) => (activeTag !== "全部" || search !== "") || !(featured && a.kind === "db" && a.slug === featured.slug)).map((article, i) => (
              <div
                key={i}
                className="bg-mist rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleOpen(article)}
              >
                <div className="h-40 overflow-hidden bg-sage/5 relative">
                  {article.image ? (
                    <img src={article.image} alt={article.title} className="w-full h-full object-cover" loading="lazy" width={800} height={512} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sage/10 via-mist to-cream">
                      <Instagram className="w-10 h-10 text-sage/60" />
                    </div>
                  )}
                  {article.kind === "ig" && (
                    <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/90 text-[10px] text-sage border border-sage/20">
                      <Instagram className="w-3 h-3" /> IG
                    </span>
                  )}
                </div>
                <div className="p-5 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      {article.categories.map((c) => (
                        <span key={c} className="text-xs text-sage font-medium">#{c}</span>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{article.date}</span>
                  </div>
                  <h3 className="font-serif-tc text-base font-semibold text-foreground line-clamp-2">{article.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{article.excerpt}</p>
                  <span className="text-xs text-sage hover:underline">{article.kind === "ig" ? "查看貼文 →" : "閱讀全文 →"}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Internal links for SEO */}
          {/* Subscribe to new posts */}
          <section aria-labelledby="blog-subscribe-heading" className="mt-16 bg-mist border border-border rounded-lg p-6 md:p-8 max-w-2xl mx-auto text-center">
            <Mail className="w-6 h-6 text-sage mx-auto mb-3" />
            <h2 id="blog-subscribe-heading" className="font-serif-tc text-xl md:text-2xl font-semibold text-foreground mb-2">
              訂閱新文章通知
            </h2>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              留下 Email，當煦日之森有新的身心療癒文章上線時，我們會第一時間寄信通知你。
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input
                type="email"
                required
                value={subEmail}
                onChange={(e) => setSubEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-4 py-2.5 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-sage"
              />
              <button
                type="submit"
                disabled={subbing}
                className="px-5 py-2.5 rounded-md bg-sage text-white text-sm hover:bg-sage/90 disabled:opacity-60 transition-colors"
              >
                {subbing ? "訂閱中..." : "訂閱"}
              </button>
            </form>
            <p className="text-[11px] text-muted-foreground mt-3">隨時可以取消訂閱，我們不會發送無關訊息。</p>
          </section>

          <nav aria-label="延伸閱讀" className="mt-16 pt-8 border-t border-border text-center">
            <h2 className="font-serif-tc text-lg font-semibold text-foreground mb-4">延伸閱讀</h2>
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-sage">
              <li><Link to="/about" className="hover:underline">認識諮商心理師 Kaia</Link></li>
              <li><Link to="/courses" className="hover:underline">正念陰瑜珈・神經系統線上課程</Link></li>
              <li><Link to="/events" className="hover:underline">森林療癒實體活動</Link></li>
              <li><Link to="/ebooks" className="hover:underline">身心療癒電子書</Link></li>
              <li><Link to="/quiz" className="hover:underline">3 分鐘神經全景測驗</Link></li>
              <li><Link to="/shop" className="hover:underline">所有身心練習商品</Link></li>
            </ul>
          </nav>
        </div>
      </section>

      {/* Article Dialog */}
      <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
        <DialogContent className="max-w-3xl p-0 gap-0 max-h-[90vh] overflow-hidden">
          {selectedArticle && (
            <ScrollArea className="max-h-[90vh]">
              {selectedArticle.image && (
                <div className="relative">
                  <img
                    src={selectedArticle.image}
                    alt={selectedArticle.title}
                    className="w-full h-56 md:h-72 object-cover"
                    width={800}
                    height={512}
                  />
                </div>
              )}
              <div className="p-6 md:p-10 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {selectedArticle.categories.map((c) => (
                      <span key={c} className="px-3 py-1 rounded-full bg-sage/10 text-xs text-sage font-medium">#{c}</span>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">{selectedArticle.date}</span>
                </div>
                <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground leading-snug">
                  {selectedArticle.title}
                </h2>
                <p className="text-xs text-muted-foreground">文｜{selectedArticle.author || "Kaia"}・煦日之森</p>

                {/* Share Buttons */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">分享至</span>
                  <button
                    onClick={() => window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(window.location.origin + '/blog?article=' + encodeURIComponent(selectedArticle.title))}`, '_blank')}
                    className="w-8 h-8 rounded-full bg-[#06C755] flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                    aria-label="分享到 LINE"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/blog?article=' + encodeURIComponent(selectedArticle.title))}`, '_blank')}
                    className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                    aria-label="分享到 Facebook"
                  >
                    <Facebook className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin + '/blog?article=' + encodeURIComponent(selectedArticle.title));
                      alert('連結已複製，請打開 Instagram 貼上分享！');
                    }}
                    className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                    aria-label="分享到 Instagram"
                  >
                    <Instagram className="w-4 h-4" />
                  </button>
                </div>

                {selectedArticle.kind === "ig" && selectedArticle.ig_url && (
                  <div className="my-4">
                    <InstagramEmbed url={selectedArticle.ig_url} />
                  </div>
                )}

                {selectedArticle.content && (
                  selectedArticle.kind === "db" ? (
                    <article
                      className="prose prose-sm max-w-none prose-headings:font-serif-tc prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-a:text-sage prose-img:rounded-lg"
                      dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                    />
                  ) : (
                    <article className="prose prose-sm max-w-none">
                      {selectedArticle.content.split("\n\n").map((paragraph, i) => {
                        const trimmed = paragraph.trim();
                        const headingMatch = trimmed.match(/^【(.+)】$/);
                        if (headingMatch) {
                          return (
                            <h3
                              key={i}
                              className="font-serif-tc text-base md:text-lg font-semibold text-foreground mt-6 mb-2"
                            >
                              {headingMatch[1]}
                            </h3>
                          );
                        }
                        return (
                          <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-4">
                            {paragraph}
                          </p>
                        );
                      })}
                    </article>
                  )
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Blog;
