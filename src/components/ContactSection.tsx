import { Button } from "@/components/ui/button";
import { Instagram, Mail, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { trackContactSubmit } from "@/lib/analytics";

interface ContactSectionProps {
  showHeading?: boolean;
}

const ContactSection = ({ showHeading = true }: ContactSectionProps) => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ name: "", email: "", subject: "", content: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const presetSubject = searchParams.get("subject");
    if (presetSubject) {
      setForm((prev) => ({
        ...prev,
        subject: "launch-notify",
        content: prev.content || `我想收到「${presetSubject.replace(/^上架通知：/, "")}」的上架通知，謝謝！`,
      }));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const id = crypto.randomUUID();
      const { error } = await supabase.from("contact_messages").insert({
        id,
        name: form.name,
        email: form.email,
        subject: form.subject,
        content: form.content,
      });
      if (error) throw error;

      if (form.subject === "launch-notify") {
        const productMatch = form.content.match(/「(.+?)」/);
        const productName = productMatch?.[1] ?? "未指定";
        await supabase.from("launch_notify_subscribers").insert({
          email: form.email,
          name: form.name,
          product_name: productName,
        });
      }

      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-confirmation",
          recipientEmail: form.email,
          idempotencyKey: `contact-confirm-${id}`,
          templateData: { name: form.name, subject: form.subject },
        },
      }).catch((err) => console.error("Email send failed", err));

      trackContactSubmit(form.subject);
      toast({ title: "已送出！", description: "感謝你的訊息，我們將在2個工作天內回覆。" });
      setForm({ name: "", email: "", subject: "", content: "" });
    } catch {
      toast({ title: "送出失敗", description: "請稍後再試", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-brand max-w-3xl mx-auto">
      {showHeading && (
        <div className="text-center mb-12">
          <h2 className="font-serif-tc text-3xl md:text-4xl font-semibold text-foreground mb-2">聯絡我們</h2>
          <p className="heading-en text-sm text-muted-foreground tracking-wider">Contact</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
        <div className="bg-background rounded-lg border border-border p-6 space-y-4">
          <h3 className="font-serif-tc text-lg font-semibold text-foreground">課程與內容</h3>
          <p className="text-sm text-muted-foreground">關於課程內容，歡迎追蹤並私訊 Kaia</p>
          <a
            href="https://instagram.com/for_rest_journey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-sage/15 text-secondary hover:bg-sage/25 transition-colors text-sm"
          >
            <Instagram className="w-4 h-4" />
            @for_rest_journey
          </a>
          <p className="text-xs text-muted-foreground">駐站心理師 Kaia 的個人創作帳號</p>
        </div>

        <div className="bg-background rounded-lg border border-border p-6 space-y-4">
          <h3 className="font-serif-tc text-lg font-semibold text-foreground">報名、付款、合作</h3>
          <p className="text-sm text-muted-foreground">報名確認、付款問題、企業合作，請聯繫營運團隊</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="w-4 h-4" />
            solissomatic@gmail.com
          </div>
          <p className="text-xs text-muted-foreground">我們將在 2 個工作天內回覆</p>
        </div>
      </div>

      <div className="bg-background rounded-lg border border-border p-8">
        <h3 className="font-serif-tc text-xl font-semibold text-foreground mb-6 text-center">聯繫營運團隊</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input placeholder="姓名" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-sage" />
            <input type="email" placeholder="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-sage" />
          </div>
          <select required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full px-4 py-3 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-sage">
            <option value="">選擇主旨</option>
            <option value="launch-notify">上架通知</option>
            <option value="registration">課程報名</option>
            <option value="payment">付款問題</option>
            <option value="business">企業合作</option>
            <option value="other">其他</option>
          </select>
          <textarea placeholder="內容" required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full px-4 py-3 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-sage min-h-[120px]" />
          <Button type="submit" disabled={loading} className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
            {loading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />送出中...</span> : "送出"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ContactSection;
