import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const inputClass = "w-full px-4 py-3 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-sage";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [needConfirm, setNeedConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", name: "", phone: "", code: "" });
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signIn, signUp, confirmSignUp } = useAuth();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (needConfirm) {
        await confirmSignUp(form.email, form.code);
        toast({ title: "驗證成功！", description: "請登入您的帳號。" });
        setNeedConfirm(false);
        setIsLogin(true);
        setForm({ ...form, code: "" });
      } else if (isLogin) {
        await signIn(form.email, form.password);
        toast({ title: "登入成功！" });
        navigate("/");
      } else {
        if (form.password !== form.confirmPassword) {
          toast({ title: "密碼不一致", description: "請確認兩次輸入的密碼相同", variant: "destructive" });
          return;
        }
        await signUp(form.email, form.password, form.name, form.phone);
        setNeedConfirm(true);
        toast({ title: "註冊成功！", description: "請輸入信箱收到的驗證碼。" });
      }
    } catch (err: any) {
      toast({
        title: needConfirm ? "驗證失敗" : isLogin ? "登入失敗" : "註冊失敗",
        description: err.message || "請稍後再試",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const title = needConfirm ? "輸入驗證碼" : isLogin ? "會員登入" : "會員註冊";
  const subtitle = needConfirm ? `驗證碼已發送至 ${form.email}` : isLogin ? "登入後即可快速報名活動" : "註冊成為會員，享受更便捷的報名體驗";
  const btnLabel = needConfirm ? "確認驗證" : isLogin ? "登入" : "註冊";

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-brand max-w-md mx-auto">
          <h1 className="font-serif-tc text-3xl font-semibold text-foreground mb-2 text-center">{title}</h1>
          <p className="text-sm text-muted-foreground text-center mb-8">{subtitle}</p>

          <form onSubmit={handleSubmit} className="space-y-4 bg-mist rounded-lg border border-border p-8">
            {needConfirm ? (
              <input placeholder="驗證碼 *" required value={form.code} onChange={set("code")} className={inputClass} />
            ) : (
              <>
                {!isLogin && (
                  <>
                    <input placeholder="姓名 *" required value={form.name} onChange={set("name")} className={inputClass} />
                    <input placeholder="電話" value={form.phone} onChange={set("phone")} className={inputClass} />
                  </>
                )}
                <input type="email" placeholder="Email *" required value={form.email} onChange={set("email")} className={inputClass} />
                <input type="password" placeholder="密碼 *" required minLength={6} value={form.password} onChange={set("password")} className={inputClass} />
                {!isLogin && (
                  <input type="password" placeholder="確認密碼 *" required minLength={6} value={form.confirmPassword} onChange={set("confirmPassword")} className={inputClass} />
                )}
              </>
            )}

            <Button type="submit" disabled={loading} className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 py-6 text-base">
              {loading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />處理中...</span> : btnLabel}
            </Button>
          </form>

          {!needConfirm && (
            <p className="text-center text-sm text-muted-foreground mt-6">
              {isLogin ? "還沒有帳號？" : "已有帳號？"}
              <button onClick={() => setIsLogin(!isLogin)} className="text-secondary hover:underline ml-1">
                {isLogin ? "立即註冊" : "前往登入"}
              </button>
            </p>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Auth;
