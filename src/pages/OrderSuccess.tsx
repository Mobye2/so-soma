import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { trackPurchase } from "@/lib/analytics";

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId") || searchParams.get("MerchantTradeNo") || "";
  const amountParam = searchParams.get("amount") || searchParams.get("TradeAmt") || "0";

  useEffect(() => {
    if (!orderId) return;
    const dedupeKey = `ga_purchase_${orderId}`;
    if (sessionStorage.getItem(dedupeKey)) return;
    const value = Number(amountParam) || 0;
    trackPurchase({ transactionId: orderId, value });
    sessionStorage.setItem(dedupeKey, "1");
  }, [orderId, amountParam]);

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-brand max-w-lg text-center space-y-6">
          <CheckCircle className="w-16 h-16 text-sage mx-auto" />
          <h1 className="font-serif-tc text-3xl font-semibold text-foreground">訂單已送出！</h1>
          <p className="text-muted-foreground">
            感謝你的訂購！我們的營運團隊將在 2 個工作天內透過 Email 與你確認付款方式。
          </p>
          <p className="text-sm text-muted-foreground">
            如有任何問題，歡迎透過聯絡我們頁面與營運團隊聯繫。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Link to="/">回到首頁</Link>
            </Button>
            <Button asChild variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
              <Link to="/shop">繼續瀏覽</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default OrderSuccess;
