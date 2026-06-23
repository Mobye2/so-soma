import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Leaf } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { Link } from "react-router-dom";
import courseNervousSystem from "@/assets/course-nervous-system.webp";
import courseYinYoga from "@/assets/course-yin-yoga.webp";
import courseForestHealing from "@/assets/course-forest-healing.webp";
import courseLiveYin from "@/assets/course-live-yin.webp";
import courseLiveTrial from "@/assets/course-live-trial.webp";
import eventForestHealing from "@/assets/event-forest-healing.webp";
import eventYogaWorkshop from "@/assets/event-yoga-workshop.webp";
import ebookCover from "@/assets/ebook-cover-bg.webp";

const productImageMap: Record<string, string> = {
  "170fd0ce-6375-41ca-a058-492019c0c03b": courseNervousSystem,
  "92ea4d6b-fd51-465a-84eb-c59b81be3079": courseYinYoga,
  "51a39a96-a9eb-48b5-a14c-9d90fd45e8c5": courseForestHealing,
  "e061d896-26a1-4491-94e7-6a368c60845c": courseLiveYin,
  "0c4495e8-8281-47a9-acf0-3a31609dc242": courseLiveTrial,
  "66cdf858-b590-4c9e-8134-ea3ddc53a019": ebookCover,
  "d95105aa-ef69-4b6f-b27f-b576ef251b45": eventForestHealing,
  "3aaf6e2c-bcbb-438a-9d5b-73976da31e3b": eventYogaWorkshop,
};

const categoryFallbackImage: Record<string, string> = {
  online_course: courseNervousSystem,
  live_class: courseLiveYin,
  event: eventForestHealing,
  ebook: ebookCover,
};

const categoryMap: Record<string, string> = {
  全部: "",
  線上課程: "online_course",
  即時課程: "live_class",
  實體活動: "event",
  電子書: "ebook",
};

const categoryLabels: Record<string, string> = {
  online_course: "線上課程",
  live_class: "即時課程",
  event: "實體活動",
  ebook: "電子書",
};

const categories = ["全部", "線上課程", "即時課程", "實體活動", "電子書"];

const Shop = () => {
  const [active, setActive] = useState("全部");
  const { addItem } = useCart();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const filtered = active === "全部"
    ? products
    : products.filter((p) => p.category === categoryMap[active]);

  return (
    <Layout>
      <SEO
        title="身心練習商品・線上課程・電子書 | 煦日之森"
        description="瀏覽煦日之森全系列身心練習商品：正念陰瑜珈與神經系統線上課程、森林療癒實體活動、身心療癒電子書。由諮商心理師 Kaia 親自設計。"
        canonicalPath="/shop"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "煦日之森 全商品",
          url: "https://www.solisforest.com/shop",
          inLanguage: "zh-Hant",
          isPartOf: { "@type": "WebSite", name: "煦日之森 Solis Atelier", url: "https://www.solisforest.com" },
        }}
      />
      <section className="section-padding">
        <div className="container-brand">
          <div className="text-center mb-10">
            <h1 className="font-serif-tc text-3xl md:text-4xl font-semibold text-foreground mb-2">身心練習課程總覽</h1>
            <p className="heading-en text-sm text-muted-foreground tracking-wider">Courses · Events · Ebooks</p>
            <p className="mt-4 max-w-2xl mx-auto text-sm text-muted-foreground leading-relaxed">
              一次瀏覽煦日之森所有身心練習：正念陰瑜珈與神經系統線上課程、森林療癒實體活動、自我照顧電子書，找到最適合此刻的你。
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`px-5 py-2 rounded-full text-sm transition-colors ${
                  active === cat
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="text-center text-muted-foreground py-12">載入中...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((product) => (
                <div key={product.id} className="bg-mist rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-44 bg-sage/10 overflow-hidden">
                    {productImageMap[product.id] || categoryFallbackImage[product.category] ? (
                      <img
                        src={productImageMap[product.id] || categoryFallbackImage[product.category]}
                        alt={product.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        width={640}
                        height={352}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Leaf className="w-10 h-10 text-sage/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-5 space-y-2">
                    <span className="text-xs text-sage font-medium">{categoryLabels[product.category] || product.category}</span>
                    <h3 className="font-serif-tc text-base font-semibold text-foreground">{product.title}</h3>
                    {product.subtitle && <p className="text-xs text-muted-foreground">{product.subtitle}</p>}
                    <div className="flex items-center justify-end pt-2">
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground text-xs"
                      >
                        <Link to={`/contact?subject=${encodeURIComponent(`上架通知：${product.title}`)}`}>
                          上架通知我
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Internal links for SEO */}
          <nav aria-label="延伸瀏覽" className="mt-16 pt-8 border-t border-border text-center">
            <h2 className="font-serif-tc text-lg font-semibold text-foreground mb-4">繼續探索身心練習</h2>
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-sage">
              <li><Link to="/courses" className="hover:underline">所有線上課程</Link></li>
              <li><Link to="/events" className="hover:underline">森林療癒實體活動</Link></li>
              <li><Link to="/ebooks" className="hover:underline">身心療癒電子書</Link></li>
              <li><Link to="/quiz" className="hover:underline">免費身心測驗</Link></li>
              <li><Link to="/blog" className="hover:underline">身心療癒文章</Link></li>
              <li><Link to="/about" className="hover:underline">關於 Kaia</Link></li>
            </ul>
          </nav>
        </div>
      </section>
    </Layout>
  );
};

export default Shop;
