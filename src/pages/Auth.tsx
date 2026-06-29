import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Leaf } from "lucide-react";

const inputClass = "w-full px-4 py-3 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-sage";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [needConfirm, setNeedConfirm] = useState(false);
  const [forgotStep, setForgotStep] = useState<"off" | "email" | "code">("off");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", name: "", phone: "", code: "", newPassword: "", newPasswordConfirm: "" });
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const { signIn, signUp, confirmSignUp, completeNewPassword, needsNewPassword, forgotPassword, confirmForgotPassword } = useAuth();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (forgotStep === "email") {
        await forgotPassword(form.email);
        setForgotStep("code");
        toast({ title: "驗證碼已寄出", description: "請檢查您的信箱" });
      } else if (forgotStep === "code") {
        if (form.newPassword !== form.newPasswordConfirm) {
          toast({ title: "密碼不一致", description: "請確認兩次輸入的密碼相同", variant: "destructive" });
          return;
        }
        await confirmForgotPassword(form.email, form.code, form.newPassword);
        toast({ title: "密碼重設成功！", description: "請使用新密碼登入" });
        setForgotStep("off");
        setIsLogin(true);
      } else if (needsNewPassword) {
        if (form.newPassword !== form.newPasswordConfirm) {
          toast({ title: "密碼不一致", description: "請確認兩次輸入的密碼相同", variant: "destructive" });
          return;
        }
        await completeNewPassword(form.newPassword);
        toast({ title: "密碼設定成功！" });
        navigate("/");
      } else if (needConfirm) {
        await confirmSignUp(form.email, form.code);
        toast({ title: "驗證成功！", description: "請登入您的帳號。" });
        setNeedConfirm(false);
        setIsLogin(true);
        setForm({ ...form, code: "" });
        navigate(redirectTo);
      } else if (isLogin) {
        await signIn(form.email, form.password);
        toast({ title: "登入成功！" });
        navigate(redirectTo);
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

  const title = forgotStep !== "off" ? "重設密碼" : needsNewPassword ? "設定新密碼" : needConfirm ? "輸入驗證碼" : isLogin ? "會員登入" : "會員註冊";
  const subtitle = forgotStep === "email" ? "請輸入您的帳號 Email" : forgotStep === "code" ? `驗證碼已發送至 ${form.email}` : needsNewPassword ? "請設定您的新密碼" : needConfirm ? `驗證碼已發送至 ${form.email}` : isLogin ? "登入後即可快速報名活動" : "註冊成為會員，享受更便捷的報名體驗";
  const btnLabel = forgotStep === "email" ? "寄送驗證碼" : forgotStep === "code" ? "確認重設密碼" : needsNewPassword ? "確認新密碼" : needConfirm ? "確認驗證" : isLogin ? "登入" : "註冊";

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-brand max-w-md mx-auto">
          <h1 className="font-serif-tc text-3xl font-semibold text-foreground mb-2 text-center">{title}</h1>
          <p className="text-sm text-muted-foreground text-center mb-8">{subtitle}</p>

          <form onSubmit={handleSubmit} className="space-y-4 bg-mist rounded-lg border border-border p-8">
            {forgotStep === "email" ? (
              <input type="email" placeholder="Email *" required value={form.email} onChange={set("email")} className={inputClass} />
            ) : forgotStep === "code" ? (
              <>
                <input placeholder="驗證碼 *" required value={form.code} onChange={set("code")} className={inputClass} />
                <input type="password" placeholder="新密碼 *" required minLength={8} value={form.newPassword} onChange={set("newPassword")} className={inputClass} />
                <input type="password" placeholder="確認新密碼 *" required minLength={8} value={form.newPasswordConfirm} onChange={set("newPasswordConfirm")} className={inputClass} />
              </>
            ) : needsNewPassword ? (
              <>
                <input type="password" placeholder="新密碼 *" required minLength={8} value={form.newPassword} onChange={set("newPassword")} className={inputClass} />
                <input type="password" placeholder="確認新密碼 *" required minLength={8} value={form.newPasswordConfirm} onChange={set("newPasswordConfirm")} className={inputClass} />
              </>
            ) : needConfirm ? (
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

          {!needConfirm && forgotStep === "off" && (
            <p className="text-center text-sm text-muted-foreground mt-6">
              {isLogin ? "還沒有帳號？" : "已有帳號？"}
              <button onClick={() => setIsLogin(!isLogin)} className="text-secondary hover:underline ml-1">
                {isLogin ? "立即註冊" : "前往登入"}
              </button>
            </p>
          )}
          {isLogin && forgotStep === "off" && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              <button onClick={() => setForgotStep("email")} className="text-secondary hover:underline">
                忘記密碼？
              </button>
            </p>
          )}
          {forgotStep !== "off" && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              <button onClick={() => setForgotStep("off")} className="text-secondary hover:underline">
                返回登入
              </button>
            </p>
          )}

          <div className="mt-10 flex flex-col items-center gap-3">
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 h-px bg-border" />
              <Leaf className="w-3.5 h-3.5 text-sage/50 shrink-0" />
              <div className="flex-1 h-px bg-border" />
            </div>
            <p className="text-xs text-muted-foreground">不想辦會員？</p>
            <a
              href="/about#contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-sage/40 text-sm text-secondary bg-sage/5 hover:bg-sage/15 transition-colors"
            >
              直接聯絡營運團隊
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Auth;
