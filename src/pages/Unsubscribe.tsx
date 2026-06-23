import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type State = "loading" | "valid" | "already" | "invalid" | "submitting" | "success" | "error";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON_KEY } }
        );
        const data = await res.json();
        if (res.ok && data.valid) setState("valid");
        else if (data.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      } catch {
        setState("invalid");
      }
    })();
  }, [token]);

  const handleConfirm = async () => {
    if (!token) return;
    setState("submitting");
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
      if (error) throw error;
      if (data?.success) setState("success");
      else if (data?.reason === "already_unsubscribed") setState("already");
      else setState("error");
    } catch {
      setState("error");
    }
  };

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-brand max-w-lg mx-auto text-center">
          <h1 className="font-serif-tc text-3xl font-semibold text-foreground mb-2">取消訂閱</h1>
          <p className="heading-en text-sm text-muted-foreground tracking-wider mb-10">Unsubscribe</p>

          <div className="bg-mist rounded-lg border border-border p-8 space-y-6">
            {state === "loading" && (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
                <p className="text-sm">驗證連結中...</p>
              </div>
            )}

            {state === "valid" && (
              <>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  確認後，我們將不再寄送通知信至此 Email。<br/>
                  你仍會收到帳號相關的重要訊息（如密碼重設）。
                </p>
                <Button onClick={handleConfirm} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  確認取消訂閱
                </Button>
              </>
            )}

            {state === "submitting" && (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
                <p className="text-sm">處理中...</p>
              </div>
            )}

            {state === "success" && (
              <div className="flex flex-col items-center gap-3">
                <CheckCircle2 className="w-10 h-10 text-sage" />
                <p className="text-sm text-muted-foreground">已成功取消訂閱。願你一切安好。</p>
              </div>
            )}

            {state === "already" && (
              <div className="flex flex-col items-center gap-3">
                <CheckCircle2 className="w-10 h-10 text-sage" />
                <p className="text-sm text-muted-foreground">此 Email 先前已取消訂閱。</p>
              </div>
            )}

            {(state === "invalid" || state === "error") && (
              <div className="flex flex-col items-center gap-3">
                <XCircle className="w-10 h-10 text-destructive" />
                <p className="text-sm text-muted-foreground">
                  {state === "invalid" ? "連結無效或已過期。" : "處理失敗，請稍後再試。"}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Unsubscribe;
