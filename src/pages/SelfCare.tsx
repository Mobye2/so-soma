import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Brain, BookOpen, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import selfCareHero from "@/assets/self-care-hero.webp";

type BlogPost = {
  slug: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  cover_image: string | null;
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "自我照顧是什麼意思？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "自我照顧是指有意識地照顧自己的身體、心理和情緒健康的行為。心理師 Kaia 建議從日常小習慣開始，例如規律睡眠、正念呼吸、接觸自然等，逐步建立屬於自己的身心照顧系統。"
      }
    },
    {
      "@type": "Question",
      "name": "如何開始自我照顧？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "建議從三個層面開始：1) 身體層面：規律運動（如瑜伽）、充足睡眠、均衡飲食；2) 心理層面：正念冥想、情緒日記、心理諮商；3) 靈性層面：接觸自然（如森林療癒）、靜心練習。煦日之森提供免費的自我照顧資源和線上課程。"
      }
    },
    {
      "@type": "Question",
      "name": "煦日之森提供哪些自我照顧課程？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "煦日之森提供多元的身心療癒課程，包括：線上瑜伽課程（陰瑜伽、修復瑜伽）、森林療癒體驗（台灣各地）、心理師帶領的正念工作坊，以及一對一心理諮商服務。"
      }
    }
  ]
};

const SelfCare = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    supabase
      .from("blog_posts")
      .select("slug,title,excerpt,category,cover_image")
      .eq("published", true)
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (data) setPosts(data as BlogPost[]);
      });
  }, []);

  return (
    <Layout>
      <SEO
        title="自我照顧指南｜心理師推薦的身心療癒方法 - 煦日之森"
        description="由 Kaia 心理師精選的自我照顧方法，結合正念、瑜伽與森林療癒，幫助你在忙碌生活中找回身心平衡。免費下載自我照顧清單。"
        canonicalPath="/self-care"
        jsonLd={faqJsonLd}
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src={selfCareHero}
          alt="神經系統自我照顧工作坊，結合心理學與自然療癒的深度體驗"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
        <div className="relative container-brand section-padding text-center max-w-3xl mx-auto">
          <h1 className="font-serif-tc md:text-5xl font-semibold text-white mb-4 drop-shadow-md text-center text-5xl">心理師推薦的自我照顧方法</h1>
          <p className="text-base md:text-lg text-white/90 mb-8 drop-shadow-sm">知識可以讀完，但身體的改變需要一次又一次的練習</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <a href="#courses">瀏覽課程</a>
            </Button>
            <Button size="lg" variant="outline" className="bg-white border-secondary text-secondary hover:bg-secondary/10" onClick={() => setDialogOpen(true)}>
              免費領取 城市裡的森林療癒指南
            </Button>
          </div>
        </div>
      </section>

      {/* 什麼是真正的自我照顧？ */}
      <section className="section-padding bg-mist">
        <div className="container-brand max-w-3xl mx-auto">
          <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground mb-8 text-center">什麼是真正的自我照顧？</h2>
          <div className="space-y-6 text-base text-muted-foreground leading-relaxed">
            <p>很多人以為自我照顧是泡澡、買東西、吃美食，這些都好，只是如果隔天醒來身體還是很緊、腦袋還是停不下來，那只是暫時的逃離。</p>
            <p>我們生活在一個焦慮源比以前多好幾倍的時代。訊息永遠看不完、工作和生活的邊界越來越模糊、身體長期處於低度警戒的狀態，卻說不清楚自己哪裡不對勁。</p>
            <p>這不是你太脆弱，是現代生活的節奏本來就超出了神經系統的負荷範圍。</p>
            <p>正因為焦慮源這麼多，自我照顧不再是「有空再說」的事，而是一個需要主動練習、慢慢建立的習慣。神經系統不會因為你「知道要放鬆」就真的放鬆，它需要一次又一次的練習，才能重新學會什麼是「安全」、什麼是「休息」。</p>
            <p>煦日之森的每一堂課，都不只是給你知識，而是帶你真正練習—從身體開始，建立屬於你的自我照顧習慣。</p>
          </div>
        </div>
      </section>

      {/* 身體層面的自我照顧 */}
      <section className="section-padding bg-background">
        <div className="container-brand max-w-3xl mx-auto">
          <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground mb-8 text-center">身體層面的自我照顧</h2>
          <div className="space-y-6 text-base text-muted-foreground leading-relaxed">
            <p>身體不會說謊。當長期處於壓力狀態，肩頸僵硬、呼吸變淺、睡眠品質下降，都是神經系統發出的求救訊號。</p>
            <p>煦日之森從身體出發，透過正念陰瑜珈、Somatic 身體覺察練習，帶你重新連結身體的感受。不需要高難度的動作，而是在緩慢、溫柔的練習中，讓緊繃的神經系統找到放鬆的節奏。</p>
            <p>每天花 10 分鐘做幾個簡單的伸展、專注於呼吸的流動，長期下來就能明顯感受到身體狀態的改變。</p>
          </div>
        </div>
      </section>

      {/* 心理層面的自我照顧 */}
      <section className="section-padding bg-mist">
        <div className="container-brand max-w-3xl mx-auto">
          <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground mb-8 text-center">心理層面的自我照顧</h2>
          <div className="space-y-6 text-base text-muted-foreground leading-relaxed">
            <p>焦慮、低落、情緒起伏，很多時候不是因為我們「不夠堅強」，而是心理也需要被照顧，就像身體需要休息一樣。</p>
            <p>心理師 Kaia 建議從正念冥想與情緒覺察開始：每天給自己一段安靜的時間，不滑手機、不回訊息，只是靜靜地感受當下的情緒流動。透過森林療癒與心理諮商，我們可以更溫柔地理解自己的內在防衛機制，找到真正的平靜。</p>
            <p>心理的自我照顧不是逃避問題，而是為自己建立一個穩定的內在基地，在面對生活挑戰時更有韌性。</p>
          </div>
        </div>
      </section>

      {/* 神經系統測驗 */}
      <section className="section-padding">
        <div className="container-brand">
          <div className="bg-sage/15 rounded-2xl border border-sage/30 p-8 md:p-12 text-center max-w-3xl mx-auto">
            <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground mb-3">神經全景測驗｜你的神經系統需要什麼？</h2>
            <p className="text-base text-muted-foreground mb-6 max-w-xl mx-auto">花 3 分鐘，透視當下的自律神經狀態（戰逃/凍結/安全）。我們將為你精準配對最適合的調節練習，找到專屬的放鬆方向。</p>
            <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Link to="/quiz">開始免費測驗，尋找專屬配方 <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 課程 */}
      <section id="courses" className="section-padding bg-mist">
        <div className="container-brand max-w-5xl mx-auto">
          <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground mb-10 text-center">為你推薦的練習</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-background border-border">
              <CardContent className="p-8 flex flex-col h-full">
                <div className="w-12 h-12 rounded-full bg-sage/15 flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="font-serif-tc text-xl font-semibold text-foreground mb-1">🧠 Somatic Reset ｜ 神經系統放鬆居家調節線上課</h3>
                <p className="text-sm text-secondary mb-3">結合多迷走神經科學的居家調節指南</p>
                <p className="text-base text-muted-foreground leading-relaxed flex-1 mb-4">
                  專為總是緊繃、深感慢性疲勞卻說不清為什麼的你設計，從科學解析到日常練習，預錄隨選，隨時隨地找回內在的煞車鍵。
                </p>
                <p className="text-xs text-muted-foreground mb-4">自學課程｜預錄隨選</p>
                <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90 self-start">
                  <Link to="/courses#nervous-system-intro">了解課程</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-background border-border">
              <CardContent className="p-8 flex flex-col h-full">
                <div className="w-12 h-12 rounded-full bg-sage/15 flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="font-serif-tc text-xl font-semibold text-foreground mb-1">📖 電子書</h3>
                <p className="text-sm text-secondary mb-3">《你不是太脆弱，是神經系統太累了》</p>
                <p className="text-base text-muted-foreground leading-relaxed flex-1 mb-4">
                  12 個章節的深度對話，帶你跳脫「不夠努力」的自我苛責。從神經科學的視角，重新溫柔擁抱並理解自己的身心防衛反應。
                </p>
                <p className="text-xs text-muted-foreground mb-4">電子書｜隨時閱讀</p>
                <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90 self-start">
                  <Link to="/ebooks">了解更多</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 文章 */}
      <section className="section-padding">
        <div className="container-brand max-w-6xl mx-auto">
          <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground mb-10 text-center">延伸閱讀</h2>
          {posts.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">文章準備中</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {posts.map((p) => (
                <Link key={p.slug} to={`/blog/${p.slug}`} className="group block">
                  <Card className="bg-background border-border h-full overflow-hidden hover:shadow-lg transition-shadow">
                    {p.cover_image && (
                      <img src={p.cover_image} alt={p.title} className="w-full h-44 object-cover" loading="lazy" />
                    )}
                    <CardContent className="p-5">
                      {p.category && (
                        <p className="text-xs text-secondary tracking-wide mb-2">{p.category}</p>
                      )}
                      <h3 className="font-serif-tc text-lg font-semibold text-foreground mb-2 group-hover:text-secondary line-clamp-2">{p.title}</h3>
                      {p.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{p.excerpt}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
          <div className="text-center mt-10">
            <Button asChild variant="outline" className="border-secondary text-secondary hover:bg-secondary/10">
              <Link to="/blog">看全部文章 <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 也許你也會喜歡 */}
      <section className="section-padding bg-background">

        <div className="container-brand max-w-4xl mx-auto">
          <h2 className="font-serif-tc text-xl md:text-2xl font-semibold text-foreground mb-6 text-center">也許你也會喜歡</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/forest-therapy" className="block p-5 rounded-lg bg-mist border border-border hover:shadow-md transition-shadow">
              <h3 className="font-serif-tc text-base font-semibold text-foreground mb-1">森林療癒課程</h3>
              <p className="text-xs text-muted-foreground">在自然中放鬆神經系統</p>
            </Link>
            <Link to="/mindful-yin-yoga" className="block p-5 rounded-lg bg-mist border border-border hover:shadow-md transition-shadow">
              <h3 className="font-serif-tc text-base font-semibold text-foreground mb-1">正念陰瑜珈課程</h3>
              <p className="text-xs text-muted-foreground">透過身體找到深度修復</p>
            </Link>
            <Link to="/blog/category/self-care" className="block p-5 rounded-lg bg-mist border border-border hover:shadow-md transition-shadow">
              <h3 className="font-serif-tc text-base font-semibold text-foreground mb-1">自我照顧文章</h3>
              <p className="text-xs text-muted-foreground">日常的身心照顧練習筆記</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="section-padding bg-cream">
        <div className="container-brand max-w-2xl mx-auto text-center">
          <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground mb-3">每個月，給自己一份身心照顧禮物</h2>
          <p className="text-base text-muted-foreground mb-8">加入 LINE@，每月收到免費身心照顧資源和活動通知。</p>
          <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
            <a href="https://lin.ee/5LJidzG" target="_blank" rel="noopener noreferrer">加入 LINE@</a>
          </Button>
        </div>
      </section>

      {/* LINE@ Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>免費領取 城市裡的森林療癒指南</DialogTitle>
            <DialogDescription>
              加入 LINE@，即可免費領取《城市裡的森林療癒指南》。
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-sm text-muted-foreground text-center">
              加入 LINE@ 後，你將每月收到免費身心照顧資源和活動通知。
            </p>
            <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <a href="https://lin.ee/5LJidzG" target="_blank" rel="noopener noreferrer" onClick={() => setDialogOpen(false)}>加入 LINE@</a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default SelfCare;
