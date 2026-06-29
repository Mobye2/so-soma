import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, ArrowRight } from "lucide-react";

interface PurchasedProduct {
  product_id: string;
  granted_at: string;
  expires_at: string | null;
  title: string;
  category: string;
  cover_image: string | null;
  subtitle: string | null;
}

const categoryLabels: Record<string, string> = {
  online_course: "線上課程",
  live_class: "即時課程",
  event: "實體活動",
  ebook: "電子書",
  other: "其他",
};

const MemberPurchases = () => {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<PurchasedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: accessRows } = await supabase
        .from("user_product_access")
        .select("product_id,granted_at,expires_at")
        .eq("user_id", user.sub);

      const now = new Date();
      const valid = (accessRows || []).filter(
        (r) => !r.expires_at || new Date(r.expires_at) > now
      );

      // dedup by product_id
      const seen = new Map<string, typeof valid[0]>();
      valid.forEach((r) => {
        if (!seen.has(r.product_id) || r.granted_at > seen.get(r.product_id)!.granted_at)
          seen.set(r.product_id, r);
      });
      const deduped = Array.from(seen.values());

      if (deduped.length === 0) { setPurchases([]); setLoading(false); return; }

      const productIds = deduped.map((r) => r.product_id);
      const { data: products } = await supabase
        .from("products")
        .select("id,title,subtitle,category,cover_image")
        .in("id", productIds);

      const result: PurchasedProduct[] = deduped
        .map((r) => {
          const p = (products || []).find((p) => p.id === r.product_id);
          if (!p) return null;
          return { ...r, title: p.title, category: p.category, cover_image: p.cover_image, subtitle: p.subtitle };
        })
        .filter(Boolean) as PurchasedProduct[];

      setPurchases(result);
      setLoading(false);
    })();
  }, [user]);

  if (authLoading || loading) return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <section className="py-20 md:py-28">
        <div className="container-brand max-w-5xl px-4">
          <h1 className="font-serif-tc text-2xl md:text-3xl font-semibold mb-2">學習資源</h1>
          <p className="text-muted-foreground mb-8">您已購買的所有商品與內容。</p>

          {purchases.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                尚未購買任何商品。{" "}
                <Link to="/shop" className="underline text-foreground">前往課程總覽</Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {purchases.map((item) => (
                <Link key={item.product_id} to={`/member/purchases/${item.product_id}`}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
                    {item.cover_image ? (
                      <img src={item.cover_image} alt={item.title}
                        className="w-full h-40 object-cover" />
                    ) : (
                      <div className="w-full h-40 bg-mist flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-muted-foreground/30" />
                      </div>
                    )}
                    <CardContent className="p-4 space-y-2">
                      <Badge variant="outline" className="text-xs">
                        {categoryLabels[item.category] || item.category}
                      </Badge>
                      <h3 className="font-serif-tc font-semibold text-sm leading-snug line-clamp-2">
                        {item.title}
                      </h3>
                      {item.subtitle && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{item.subtitle}</p>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.granted_at).toLocaleDateString("zh-TW")}
                        </span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default MemberPurchases;
