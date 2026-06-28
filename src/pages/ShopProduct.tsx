import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Loader2, ArrowLeft, Check, Clock, Users, BookOpen } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  price: number;
  category: string;
  cta_label: string;
  slug: string;
}

interface Course {
  id: string;
  instructor: string;
  audience: string[];
  modules: string[];
  access_days: number | null;
  cover_image: string | null;
  description: string | null;
}

const categoryLabels: Record<string, string> = {
  online_course: "線上課程",
  live_class: "即時課程",
  event: "實體活動",
  ebook: "電子書",
};

const ShopProduct = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem, setIsOpen } = useCart();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: p } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (!p) { setLoading(false); return; }
      setProduct(p as Product);

      // 找關聯課程
      const { data: c } = await supabase
        .from("courses")
        .select("id, instructor, audience, modules, access_days, cover_image, description")
        .eq("product_id", p.id)
        .maybeSingle();
      if (c) setCourse(c as Course);

      setLoading(false);
    })();
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      category: product.category,
      ctaLabel: product.cta_label,
    });
    setAdded(true);
    toast({ title: "已加入購物車", description: product.title });
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return (
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
        <Button asChild variant="outline"><Link to="/shop">回到商品總覽</Link></Button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-brand max-w-4xl">
          <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
            <Link to="/shop"><ArrowLeft className="w-4 h-4 mr-1" /> 所有商品</Link>
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* 左側：圖片 */}
            <div>
              {product.cover_image ? (
                <img src={product.cover_image} alt={product.title} className="w-full rounded-xl object-cover aspect-video" />
              ) : (
                <div className="w-full rounded-xl bg-mist aspect-video flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-muted-foreground/30" />
                </div>
              )}
            </div>

            {/* 右側：資訊 */}
            <div className="space-y-5">
              <div className="space-y-2">
                <Badge variant="secondary">{categoryLabels[product.category] || product.category}</Badge>
                <h1 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground leading-snug">
                  {product.title}
                </h1>
                {product.subtitle && (
                  <p className="text-muted-foreground">{product.subtitle}</p>
                )}
              </div>

              {product.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
              )}

              {/* 課程資訊 */}
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

              {/* 價格 + 加入購物車 */}
              <div className="pt-4 border-t border-border space-y-3">
                <div className="text-3xl font-semibold text-foreground">
                  NT${product.price.toLocaleString()}
                </div>
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 py-6 text-base"
                  disabled={added}
                >
                  {added ? (
                    <><Check className="w-4 h-4 mr-2" /> 已加入購物車</>
                  ) : (
                    <><ShoppingCart className="w-4 h-4 mr-2" /> 加入購物車</>
                  )}
                </Button>
                <Button
                  onClick={() => { handleAddToCart(); navigate("/checkout"); }}
                  variant="outline"
                  className="w-full py-6 text-base border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
                  disabled={added}
                >
                  直接購買
                </Button>
              </div>
            </div>
          </div>

          {/* 課程大綱 & 適合對象 */}
          {course && (course.modules?.length > 0 || course.audience?.length > 0) && (
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
              {course.modules?.length > 0 && (
                <div>
                  <h2 className="font-serif-tc text-lg font-semibold mb-4">課程大綱</h2>
                  <ul className="space-y-2">
                    {course.modules.map((m, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                        {m}
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
                        <Check className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                        {a}
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

export default ShopProduct;
