import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "", phone: "" });
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(form.email, form.password);
        toast({ title: "登入成功！" });
        navigate("/");
      } else {
        await signUp(form.email, form.password, form.name, form.phone);
        toast({
          title: "註冊成功！",
          description: "請前往信箱點擊驗證連結以完成註冊。",
        });
      }
    } catch (err: any) {
      toast({
        title: isLogin ? "登入失敗" : "註冊失敗",
        description: err.message || "請稍後再試",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-brand max-w-md mx-auto">
          <h1 className="font-serif-tc text-3xl font-semibold text-foreground mb-2 text-center">
            {isLogin ? "會員登入" : "會員註冊"}
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-8">
            {isLogin ? "登入後即可快速報名活動" : "註冊成為會員，享受更便捷的報名體驗"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 bg-mist rounded-lg border border-border p-8">
            {!isLogin && (
              <>
                <input
                  placeholder="姓名 *"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-sage"
                />
                <input
                  placeholder="電話"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-sage"
                />
              </>
            )}
            <input
              type="email"
              placeholder="Email *"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-sage"
            />
            <input
              type="password"
              placeholder="密碼 *"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-sage"
            />
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
              ) : isLogin ? "登入" : "註冊"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isLogin ? "還沒有帳號？" : "已有帳號？"}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-secondary hover:underline ml-1"
            >
              {isLogin ? "立即註冊" : "前往登入"}
            </button>
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default Auth;
