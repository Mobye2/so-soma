import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { Leaf, Heart, BookOpen, ArrowRight } from "lucide-react";
import heroForest from "@/assets/hero-forest.webp";
import { supabase } from "@/integrations/supabase/client";
import { apiPost } from "@/lib/api";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { trackNewsletterSubscribe } from "@/lib/analytics";

const faqs = [
  { q: "什麼是森林療癒？和一般爬山有什麼不同？", a: "森林療癒（Forest Therapy）是一種科學實證的自然療法，透過放慢步調、用五感感受森林環境，達到降低皮質醇、舒緩壓力的效果。與一般爬山注重體能不同，森林療癒強調『慢下來』和『感受當下』。" },
  { q: "陰瑜珈適合初學者嗎？需要有瑜珈基礎嗎？", a: "完全適合。陰瑜珈動作緩慢，每個姿勢停留 3–5 分鐘，不需要柔軟度或瑜珈基礎。煦日之森的課程由 Kaia 帶領，特別為初學者設計，從呼吸和身體感知開始引導。" },
  { q: "線上課程和實體課程有什麼差別？", a: "線上課程可隨時隨地學習，適合時間彈性需求；實體課程在台灣自然環境中進行，提供更深度的沉浸體驗。" },
  { q: "煦日之森的駐站首席心理師 Kaia 的資歷和專業背景是什麼？", a: "Kaia 是煦日之森駐站首席心理師，台灣執業諮商心理師，擁有深厚的諮商經驗，同時是美國 ANFT 認證森林療癒師與美國瑜珈聯盟 RYT-200 認證瑜珈老師。" },
  { q: "如何報名課程？有試聽或體驗課嗎？", a: "可透過網站課程頁面直接報名，或加入 LINE@ 了解最新課程資訊。部分課程提供免費體驗場次。" },
];

const pillars = [
  { icon: Leaf, titleZh: "什麼是森林療癒？美國 ANFT 認證森林療癒師帶領的自然身心體驗", titleEn: "Forest Therapy", desc: "在自然中放鬆神經系統，找回身心的平衡與安全感。", detail: "森林療癒源自日本的「森林浴」概念，透過五感體驗大自然的聲音、氣味與光影，幫助降低皮質醇、穩定心率，讓身心回歸最自然的放鬆狀態。", link: "/forest-therapy", linkLabel: "了解森林療癒 →" },
  { icon: Heart, titleZh: "正念陰瑜珈課程｜線上 & 實體，適合所有程度", titleEn: "Somatic Yoga", desc: "透過溫和的瑜珈練習，與身體對話、釋放深層壓力。", detail: "身心瑜珈不追求高難度體式，而是透過緩慢的動作與呼吸引導，喚醒身體的內在感知，釋放長期累積的緊繃與情緒，重建身心的安全連結。", link: "/mindful-yin-yoga", linkLabel: "了解正念陰瑜珈 →" },
  { icon: BookOpen, titleZh: "神經系統自我照顧｜科學實證的身心照顧方法", titleEn: "Nervous System Education", desc: "理解自己的身心反應，用科學角度善待自己。", detail: "當你知道「為什麼我會這樣」，焦慮就少了一點，批判也少了一點。 用得懂的語言，說清楚你身體裡正在發生什麼。", link: "/self-care", linkLabel: "了解自我照顧 →" },
];

const Index = () => {
  const { toast } = useToast();
  const [newsletterEmail, setNewsletterEmail] = useState("");




  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    const { error } = await supabase.from("newsletter_subscribers").insert(
      { email: newsletterEmail, source: "homepage", is_active: true }
    );
    if (error?.code === "23505") {
      toast({ title: "你已經訂閱過了 🌿" });
    } else if (error) {
      toast({ title: "訂閱失敗", description: "請稍後再試", variant: "destructive" });
    } else {
      toast({ title: "訂閱成功！", description: "感謝你的訂閱 🌿" });
      trackNewsletterSubscribe("Homepage Footer");
      apiPost("/send-email", {
        templateName: "welcome-member",
        recipientEmail: newsletterEmail,
        templateData: { name: "" },
      }).catch(console.error);
    }
    setNewsletterEmail("");
  };

  return (
    <Layout>
      <SEO
        title="煦日之森｜在最安靜之處，指引靈魂回歸內在安定。｜以科學為基礎的身心療癒平台"
        description="煦日之森｜過載的數位焦慮、懸浮的心、遺忘好好呼吸的身體。我們以自然的語言與身體的覺察為鑰匙，溫柔解鎖累積於神經系統中的慢性疲勞，陪伴你在流動的日光中，重新聽見身體的呼吸。"
        canonicalPath="/"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "煦日之森 Solis Atelier",
            url: "https://www.solisforest.com",
            inLanguage: "zh-Hant",
            potentialAction: {
              "@type": "SearchAction",
              target: "https://www.solisforest.com/blog?q={search_term_string}",
              "query-input": "required name=search_term_string",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "煦日之森",
            alternateName: "Solis Forest",
            url: "https://www.solisforest.com",
            description: "以科學為基礎的身心療癒平台，提供森林療癒、正念陰瑜珈、神經系統自我照顧課程",
            founder: {
              "@type": "Person",
              name: "Owen",
              jobTitle: "煦日之森創辦人",
              description: "本澈行銷創辦人，品牌行銷專業",
            },
            employee: {
              "@type": "Person",
              name: "Kaia",
              jobTitle: "駐站首席心理師",
              description: "諮商心理師，ANFT 認證森林療癒師",
              sameAs: ["https://www.solisforest.com/about"],
            },
            serviceType: ["森林療癒", "正念陰瑜珈", "心理諮商", "自我照顧工作坊"],
            areaServed: "台灣",
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "什麼是森林療癒？和一般爬山有什麼不同？",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "森林療癒（Forest Therapy）是一種科學實證的自然療法，透過放慢步調、用五感感受森林環境，達到降低皮質醇、舒緩壓力的效果。與一般爬山注重體能不同，森林療癒強調『慢下來』和『感受當下』。",
                },
              },
              {
                "@type": "Question",
                name: "陰瑜珈適合初學者嗎？需要有瑜珈基礎嗎？",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "完全適合。陰瑜珈動作緩慢，每個姿勢停留 3–5 分鐘，不需要柔軟度或瑜珈基礎。煦日之森的課程由 Kaia 帶領，特別為初學者設計，從呼吸和身體感知開始引導。",
                },
              },
              {
                "@type": "Question",
                name: "線上課程和實體課程有什麼差別？",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "線上課程可隨時隨地學習，適合時間彈性需求；實體課程在台灣自然環境中進行，提供更深度的沉浸體驗。",
                },
              },
              {
                "@type": "Question",
                name: "煦日之森的駐站首席心理師 Kaia 的資歷和專業背景是什麼？",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Kaia 是煦日之森駐站首席心理師，台灣執業諮商心理師，擁有深厚的諮商經驗，同時是美國 ANFT 認證森林療癒師與美國瑜珈聯盟 RYT-200 認證瑜珈老師。",
                },
              },
              {
                "@type": "Question",
                name: "如何報名課程？有試聽或體驗課嗎？",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "可透過網站課程頁面直接報名，或加入 LINE@ 了解最新課程資訊。部分課程提供免費體驗場次。",
                },
              },
            ],
          },
        ]}
      />

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <img src={heroForest} alt="心理師 Kaia 帶領的森林療癒課程，台灣自然環境中的身心療癒體驗" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1080} fetchPriority="high" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/40 via-foreground/30 to-foreground/60" />
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <h1 className="font-serif-tc md:text-5xl lg:text-6xl font-semibold text-mist leading-tight animate-fade-in-up mb-4 text-4xl">
            煦日之森｜<br />森林療癒 × 正念陰瑜珈 × 神經系統自我照顧
          </h1>

          <p className="text-lg md:text-xl text-mist/90 mb-2 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            回到身體，回到自然，回到你自己
          </p>
          <p className="heading-en text-sm md:text-base text-mist/70 tracking-widest mb-8 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            Solis Atelier — Forest & Somatic Arts
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
            <Button asChild className="bg-sage text-primary-foreground hover:bg-sage/90 text-base px-8 py-6">
              <Link to="/courses">探索課程</Link>
            </Button>
            <Button asChild variant="outline" className="border-mist/60 bg-foreground/20 backdrop-blur-sm text-mist hover:bg-mist hover:text-foreground text-base px-8 py-6">
              <Link to="/about">認識我們</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Value Pillars */}
      <section className="section-padding bg-mist">
        <div className="container-brand">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pillars.map((pillar, i) => (
              <div key={i} className="text-center p-8 rounded-lg bg-background/60 border border-border hover:shadow-lg transition-shadow duration-300">
                <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-sage/15 flex items-center justify-center">
                  <pillar.icon className="w-7 h-7 text-secondary" />
                </div>
                <h2 className="font-serif-tc text-xl font-semibold text-foreground mb-1">{pillar.titleZh}</h2>
                <p className="heading-en text-sm text-muted-foreground mb-3">{pillar.titleEn}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{pillar.desc}</p>
                {"detail" in pillar && pillar.detail && (
                  <p className="text-xs text-muted-foreground leading-relaxed mt-3 pt-3 border-t border-border">{pillar.detail}</p>
                )}
                {"link" in pillar && pillar.link && (
                  <Link to={pillar.link} className="inline-block mt-4 text-sm text-secondary hover:underline">
                    {pillar.linkLabel}
                  </Link>
                )}
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button asChild variant="outline" className="bg-background border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground h-auto py-3 px-6 whitespace-pre-line">
              <Link to="/courses">查看 Solis Signatures ｜{"\n"}煦日體驗與身心提案</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Quiz CTA */}
      <section className="section-padding bg-gradient-to-br from-moss to-secondary text-background">
        <div className="container-brand max-w-3xl">
          <div className="text-center">
            <span className="inline-block text-xs tracking-widest uppercase mb-4 px-3 py-1 rounded-full bg-background/15 text-background">
              ⭐ 最受歡迎的免費測驗
            </span>
            <h2 className="font-serif-tc text-3xl md:text-4xl font-semibold mb-4 text-background">
              你的身心現在需要什麼？
            </h2>
            <p className="text-base md:text-lg text-background/90 mb-3 leading-relaxed">
              神經全景測驗｜你的神經系統需要什麼？<br />
              透過 12 題情境問答，透視當下的自律神經狀態（戰逃/凍結/安全）。我們將為你精準配對最適合的調節練習，找到專屬的放鬆方向。
            </p>
            <p className="text-sm text-background/80 mb-8">
              ⏱ 約 3 分鐘
            </p>
            <Button asChild size="lg" className="bg-background text-foreground hover:bg-background/90 text-base px-10 py-6 shadow-lg">
              <Link to="/quiz">開始免費測驗，尋找專屬配方 <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </div>
        </div>
      </section>



      {/* Email Opt-in */}
      <section className="section-padding bg-cream text-foreground">
        <div className="container-brand max-w-2xl text-center">
          <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold mb-3">
            免費領取：5分鐘神經系統放鬆練習指南
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            一份簡單的日常練習，幫助你的身體找到安全感
          </p>
          <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              required
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            <Button type="submit" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-6 py-3">
              免費領取
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-3">
            訂閱即代表同意收取 煦日之森 電子報
          </p>
        </div>
      </section>


      {/* FAQ */}
      <section className="section-padding bg-background">
        <div className="container-brand max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground mb-2">常見問題</h2>
            <p className="text-sm text-muted-foreground">關於森林療癒、正念陰瑜珈與課程的常見疑問</p>
          </div>
          <Accordion type="single" collapsible className="bg-mist rounded-lg border border-border px-6">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left font-sans-tc text-base">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Social Proof */}
      <section className="section-padding bg-mist">
        <div className="container-brand">
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto text-center">
            {[
              { number: "500+", label: "學員" },
              { number: "12", label: "課程" },
              { number: "1,200+", label: "練習時數" },
            ].map((stat, i) => (
              <div key={i}>
                <p className="heading-en text-3xl md:text-4xl font-light text-secondary">{stat.number}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
