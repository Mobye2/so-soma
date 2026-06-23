import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Trash2, CreditCard, Loader2, User, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { trackBeginCheckout } from "@/lib/analytics";
import { apiPost } from "@/lib/api";

const Checkout = () => {
  const { items, totalAmount, clearCart, removeItem } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const ecpayFormRef = useRef<HTMLDivElement>(null);

  // Auto-fill form when user is logged in
  useEffect(() => {
    if (user && profile) {
      setForm((prev) => ({
        ...prev,
        name: profile.display_name || user.user_metadata?.display_name || "",
        email: profile.email || user.email || "",
        phone: profile.phone || user.user_metadata?.phone || "",
      }));
    }
  }, [user, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    trackBeginCheckout(items, totalAmount);
    setLoading(true);
    try {
      // Create order + items server-side (validated, prices re-checked)
      const token = user?.signInUserSession?.idToken?.jwtToken;
      const createData = await apiPost("/orders", {
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone || null,
        notes: form.notes || null,
        items: items.map((i) => ({
          id: i.id,
          title: i.title,
          quantity: i.quantity,
          price: i.price,
          category: i.category,
        })),
      }, token);
      const orderId = createData.orderId as string;

      // Update profile if logged in
      if (user) {
        await supabase.from("profiles").update({
          display_name: form.name,
          phone: form.phone,
        }).eq("id", user.id);
      }

      // Call ECPay payment function
      const paymentData = await apiPost("/ecpay-create-payment", { orderId }, token);

      const { paymentUrl, params } = paymentData;
      const formEl = document.createElement("form");
      formEl.method = "POST";
      formEl.action = paymentUrl;

      Object.entries(params).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value as string;
        formEl.appendChild(input);
      });

      document.body.appendChild(formEl);
      clearCart();
      formEl.submit();
    } catch (err) {
      console.error(err);
      toast({
        title: "訂單送出失敗",
        description: "請稍後再試或聯繫我們。",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const isLoggedIn = !!user;

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-brand max-w-2xl">
          <h1 className="font-serif-tc text-3xl font-semibold text-foreground mb-8 text-center">結帳</h1>

          {items.length === 0 ? (
            <p className="text-center text-muted-foreground">購物車是空的</p>
          ) : (
            <div className="space-y-8">
              {/* Cart Summary */}
              <div className="bg-mist rounded-lg border border-border p-6 space-y-3">
                <h3 className="font-serif-tc text-base font-semibold text-foreground mb-3">訂單明細</h3>
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm py-2 border-b border-border/50 last:border-0">
                    <div className="flex-1">
                      <span className="text-foreground">{item.title}</span>
                      <span className="text-muted-foreground ml-2">× {item.quantity}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-secondary">NT${(item.price * item.quantity).toLocaleString()}</span>
                      <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-3 text-base font-semibold">
                  <span>合計</span>
                  <span className="text-secondary">NT${totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Member / Guest Mode */}
              <div className="bg-mist rounded-lg border border-border p-6">
                <h3 className="font-serif-tc text-base font-semibold text-foreground mb-3">報名方式</h3>
                {isLoggedIn ? (
                  <div className="flex items-center gap-3 p-3 rounded-md border-2 border-secondary bg-secondary/5">
                    <User className="w-5 h-5 text-secondary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">會員身份</p>
                      <p className="text-xs text-muted-foreground">已登入為 {user.email}，資料已自動帶入</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-md border border-border bg-background">
                      <UserPlus className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">訪客報名</p>
                        <p className="text-xs text-muted-foreground">請填寫以下個人資料完成報名</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/auth")}
                        className="text-xs"
                      >
                        登入 / 註冊
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-mist rounded-lg border border-border p-6">
                <h3 className="font-serif-tc text-base font-semibold text-foreground mb-3">付款方式</h3>
                <div className="flex items-center gap-3 p-3 rounded-md border-2 border-secondary bg-secondary/5">
                  <CreditCard className="w-5 h-5 text-secondary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">綠界 ECPay</p>
                    <p className="text-xs text-muted-foreground">支援信用卡、ATM、超商付款</p>
                  </div>
                </div>
              </div>

              {/* Customer Info Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-serif-tc text-base font-semibold text-foreground">聯絡資訊</h3>
                <input
                  placeholder="姓名 *"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-md bg-mist border border-border text-sm focus:outline-none focus:ring-1 focus:ring-sage"
                />
                <input
                  type="email"
                  placeholder="Email *"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-md bg-mist border border-border text-sm focus:outline-none focus:ring-1 focus:ring-sage"
                />
                <input
                  placeholder="電話"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-md bg-mist border border-border text-sm focus:outline-none focus:ring-1 focus:ring-sage"
                />
                <textarea
                  placeholder="備註（選填）"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-md bg-mist border border-border text-sm focus:outline-none focus:ring-1 focus:ring-sage min-h-[80px]"
                />

                <p className="text-xs text-muted-foreground">
                  點擊「前往付款」後，將跳轉至綠界安全付款頁面完成支付。
                </p>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 py-6 text-base"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      處理中...
                    </span>
                  ) : (
                    "前往付款"
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>
      </section>
      <div ref={ecpayFormRef} className="hidden" />
    </Layout>
  );
};

export default Checkout;
