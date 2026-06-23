import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Leaf, Heart, Brain, Wind } from "lucide-react";
import heroForest from "@/assets/hero-forest.webp";
import eventForestHealing from "@/assets/event-forest-healing.webp";
import eventYogaWorkshop from "@/assets/event-yoga-workshop.webp";

const LINE_URL = "https://lin.ee/WJcPZiC";

const science = [
  {
    icon: Heart,
    title: "多迷走神經理論的自然實踐",
    desc: "透過極緩慢的正念步行與五感開啟，向大腦發送安全訊號。喚醒腹側迷走神經，讓身體從高壓防禦，溫柔切換至深度修復模式。",
  },
  {
    icon: Leaf,
    title: "芬多精與免疫系統的化學共舞",
    desc: "醫學研究證實，樹木釋放的芬多精能顯著降低壓力荷爾蒙。短暫沈浸林間，即可活化自然殺手細胞，從根本提升身心免疫力。",
  },
  {
    icon: Brain,
    title: "大腦預設模式網絡（DMN）的降噪效應",
    desc: "焦慮源自大腦 DMN 過度活躍。觀察樹葉紋理等自然幾何，能引發「柔軟迷戀」，讓過載運轉的思緒獲得真正的停頓。",
  },
  {
    icon: Wind,
    title: "副交感神經的深度啟動",
    desc: "林間的低頻聲音與綠光波長，能直接降低心率與血壓。強制啟動副交感神經，帶來一般冥想 App 難以企及的深層平靜。",
  },
];

const testimonials = [
  {
    quote: "我終於可以卸下防備，把重量交給一棵樹。",
    body: "長期的專案高壓讓我隨時處於備戰狀態。直到觸碰老樟樹的那一刻，眼淚毫無預警地潰堤。我感覺到『這裡很安全，不再有人要求我交出績效了。』那一晚，我找回了三年來第一次的安穩睡眠。",
    author: "C., 跨國科技業高階主管",
  },
  {
    quote: "原來真正的休息，不需要大腦下指令。",
    body: "試過重訓與昂貴 SPA，深層的疲憊卻始終都在。在煦日的林間，隨著緩慢的步行與五感開啟，大自然溫柔接手了我的神經系統。那份隨時都在焦慮未來的緊繃感徹底消散，讓我體驗到全然的平靜。",
    author: "W., 企業創辦人",
  },
];

const faqs = [
  { q: "森林療癒和森林浴（Shinrin-yoku）有什麼不同？", a: "森林浴是 1982 年由日本提出、強調五感浸潤森林氛圍的概念。森林療癒則是後續發展出的系統化引導實踐，加入神經系統覺察與療癒師引導，目的不只是放鬆，而是讓自律神經、情緒與身體感知重新整合。" },
  { q: "森林療癒對身體真的有科學依據嗎？", a: "有。多項研究指出，在森林環境中停留 2 小時以上可降低皮質醇 12–15%、降低心率與血壓，並提高副交感神經活性。芬多精也被證實能提升 NK 自然殺手細胞活性，效果可持續 7 天以上。" },
  { q: "不住在山上、沒時間去森林，也能做森林療癒嗎？", a: "可以。森林療癒的核心是「神經系統的下沉狀態」。在都市的公園、行道樹甚至陽台植栽，配合慢呼吸與身體掃描，也能啟動部分副交感反應。若想完整體驗，歡迎報名實體活動。" },
  { q: "我有焦慮／失眠／自律神經失調，森林療癒適合我嗎？", a: "森林療癒對於交感神經長期過度活躍（焦慮、淺眠、肩頸緊繃）特別有幫助。但它屬於自我照顧練習，不替代專業醫療或心理治療。若正在治療中，建議將其視為輔助。" },
  { q: "煦日之森的森林療癒和坊間導覽有什麼不同？", a: "多數森林導覽偏向知識介紹（樹種、生態）。煦日之森採身心學（Somatic）取向，引導你練習如何「感覺」自己的身體在自然中的變化，把森林當作回到身體智慧的入口。" },
];

const ForestTherapy = () => {
  return (
    <Layout>
      <SEO
        title="森林療癒引導體驗｜心理師帶你走進自然療癒 - 煦日之森"
        description="源自日本森林浴概念、由 ANFT 認證發展的森林療癒引導法，在台灣由心理師 Kaia 帶領。研究證實定期接觸森林可降低皮質醇、改善焦慮與睡眠。立即預約體驗。"
        canonicalPath="/forest-therapy"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "森林療癒和一般爬山有什麼不同？",
              acceptedAnswer: {
                "@type": "Answer",
                text: "森林療癒不是運動 ，而是一種感官引導體驗。一般爬山以抵達目的地為目標，森林療癒則是在引導師的帶領下，放慢腳步，用五感慢速感受森林環境。研究顯示，即使在森林中靜坐，也能獲得顯著的壓力降低效果。",
              },
            },
            {
              "@type": "Question",
              name: "什麼是 ANFT 森林療癒？",
              acceptedAnswer: {
                "@type": "Answer",
                text: "ANFT（美國自然與森林療法協會）是全球最具規模的森林療癒引導師認證機構，以日本森林浴的科學研究為基礎，發展出一套系統化的引導方法。ANFT 認證引導師受過嚴格訓練，能夠帶領參與者透過自然感官體驗達到身心療癒的效果。",
              },
            },
            {
              "@type": "Question",
              name: "森林療癒對壓力和焦慮有效嗎？",
              acceptedAnswer: {
                "@type": "Answer",
                text: "根據多項研究，在森林環境中停留可顯著降低皮質醇（壓力荷爾蒙）濃度，改善免疫功能、情緒狀態與睡眠品質。煦日之森的課程由心理師 Kaia 設計，結合 ANFT 引導方法與心理學專業，特別適合長期處於高壓、焦慮或身心疲憊的現代人。",
              },
            },
          ],
        }}
      />

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0">
          <img src={heroForest} alt="森林療癒活動照片，學員在森林中進行正念感官體驗" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-foreground/50" />
        </div>
        <div className="relative container-brand section-padding text-center text-white max-w-3xl mx-auto">
          <h1 className="font-serif-tc text-3xl md:text-5xl font-semibold mb-4">森林療癒課程｜在自然中療癒身心的科學方法</h1>
          <p className="text-lg md:text-xl mb-4 opacity-95">一場身體與自然的深度對話</p>
          <p className="text-sm opacity-85 max-w-2xl mx-auto mb-8 leading-relaxed">
            由台灣唯一同時持有諮商心理師執照與美國 ANFT 認證的森林療癒師帶領，結合神經系統科學與身心學實踐設計每一場活動。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <a href="#activities">查看活動</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-background/95 border-secondary text-secondary hover:bg-background">
              <a href={LINE_URL} target="_blank" rel="noopener noreferrer">領取｜城市裡的森林療癒指南</a>
            </Button>
          </div>
        </div>
      </section>

      {/* 什麼是森林療癒 */}
      <section className="section-padding">
        <div className="container-brand max-w-3xl mx-auto">
          <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground mb-8 text-center">當大腦過載，讓自然接手</h2>
          <div className="space-y-5 text-base text-muted-foreground leading-loose">
            <p>森林浴（Shinrin-yoku）這個概念源自 1982 年日本農林水產省的健康推廣計畫，意指「沐浴在森林的氛圍中」。這個概念後來影響了全球的自然療癒實踐，美國自然與森林療法協會（ANFT）在此基礎上發展出一套完整的引導訓練體系，並在全球培訓認證引導師。</p>
            <p>Kaia 心理師持有 ANFT（美國自然與森林療法協會）認證，是台灣少數同時具備諮商心理師執照與 ANFT 森林療癒師資格的帶領者。煦日之森的森林療癒課程以 ANFT 的引導方法為核心，帶你在台灣的自然環境中體驗這份療癒力量。</p>
          </div>
        </div>
      </section>

      {/* 身體科學 */}
      <section className="section-padding bg-mist">
        <div className="container-brand max-w-5xl mx-auto">
          <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground mb-6 text-center">森林療癒的科學底蘊</h2>
          <p className="max-w-3xl mx-auto text-base text-muted-foreground leading-loose text-center mb-10">
            許多人以為森林療癒只是單純的「踏青」，但事實上，這是一場精密且具備大量科學文獻支持的身心介入方案。作為台灣首位具備 ANFT 認證的諮商心理師， Kaia 將嚴謹的科學實證帶入這片林間。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {science.map((s) => (
              <Card key={s.title} className="bg-background border-border">
                <CardContent className="p-6 flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-sage/15 flex items-center justify-center shrink-0">
                    <s.icon className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-serif-tc text-lg font-semibold text-foreground mb-2">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 真實迴響 */}
      <section className="section-padding">
        <div className="container-brand max-w-5xl mx-auto">
          <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground mb-3 text-center">林間的眼淚，是神經系統融化的聲音</h2>
          <p className="text-sm text-muted-foreground text-center mb-10">以下為煦日學員真實體驗回饋，隱私皆已妥善處理。</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((t) => (
              <Card key={t.author} className="bg-background border-border">
                <CardContent className="p-7">
                  <p className="font-serif-tc text-lg text-secondary mb-4 leading-relaxed">「{t.quote}」</p>
                  <p className="text-sm text-muted-foreground leading-loose mb-4">{t.body}</p>
                  <p className="text-xs text-muted-foreground/80">—— {t.author}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>


      {/* 即將開放活動 */}
      <section id="activities" className="section-padding">
        <div className="container-brand max-w-5xl mx-auto">
          <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground mb-10 text-center">即將開放的活動</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card id="activity" className="bg-background border-border overflow-hidden scroll-mt-24">
              <img src={eventForestHealing} alt="Green Prescription｜煦日森林半日沈浸體驗活動，ANFT 認證森林療癒師帶領的自然感官漫步，台灣近郊自然場域" className="w-full h-56 object-cover" loading="lazy" />
              <CardContent className="p-6">
                <h3 className="font-serif-tc text-xl font-semibold text-foreground mb-3">🌲 Green Prescription｜煦日森林半日沈浸體驗</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  由 ANFT 國際森林療癒師親自引領。透過五感邀請、靜默漫步與自然冥想，在純粹的林間卸下數位焦慮，找回失落的專注與深層平靜。
                </p>
                <ul className="text-sm text-muted-foreground space-y-1.5 mb-4">
                  <li>📍 近都市自然場域</li>
                  <li>👥 小班制</li>
                  <li>⏱ 半日（約 3 小時）</li>
                </ul>
                <span className="inline-block px-3 py-1 rounded-full text-xs bg-sage/20 text-secondary mb-4">預計 2026 Q4 開放</span>
                <Button asChild className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  <a href={LINE_URL} target="_blank" rel="noopener noreferrer">接收上架通知與專屬提案</a>
                </Button>
              </CardContent>
            </Card>

            <Card id="retreat" className="bg-background border-border overflow-hidden scroll-mt-24">
              <img src={eventYogaWorkshop} alt="兩天一夜森林療癒與正念陰瑜珈深度工作坊，郊山自然環境中的身心療癒體驗，6–8 人小班制" className="w-full h-56 object-cover" loading="lazy" />
              <CardContent className="p-6">
                <h3 className="font-serif-tc text-xl font-semibold text-foreground mb-3">🏕 Solis Retreat｜兩天一夜山林療癒與深度修復之旅</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  結合深度森林療癒與正念陰瑜珈的極致自我照顧。包含住宿與餐食，讓交感神經在兩日中徹底卸載重擔，完成一場深度的大休息。
                </p>
                <ul className="text-sm text-muted-foreground space-y-1.5 mb-4">
                  <li>📍 郊山</li>
                  <li>👥 6–8 人小班</li>
                  <li>⏱ 兩天一夜</li>
                  <li>🍱 含住宿餐食</li>
                </ul>
                <span className="inline-block px-3 py-1 rounded-full text-xs bg-sage/20 text-secondary mb-4">預計 2026 Q4 開放</span>
                <Button asChild className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  <a href={LINE_URL} target="_blank" rel="noopener noreferrer">接收上架通知與專屬提案</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-mist">
        <div className="container-brand max-w-3xl mx-auto">
          <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground mb-8 text-center">常見問題</h2>
          <Accordion type="single" collapsible className="bg-background rounded-lg border border-border px-6">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left font-sans-tc text-base">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* 也許你也會喜歡 */}
      <section className="section-padding bg-background">
        <div className="container-brand max-w-4xl mx-auto">
          <h2 className="font-serif-tc text-xl md:text-2xl font-semibold text-foreground mb-6 text-center">也許你也會喜歡</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/mindful-yin-yoga" className="block p-5 rounded-lg bg-mist border border-border hover:shadow-md transition-shadow">
              <h3 className="font-serif-tc text-base font-semibold text-foreground mb-1">正念陰瑜珈課程</h3>
              <p className="text-xs text-muted-foreground">在身體裡找到柔軟的修復</p>
            </Link>
            <Link to="/self-care" className="block p-5 rounded-lg bg-mist border border-border hover:shadow-md transition-shadow">
              <h3 className="font-serif-tc text-base font-semibold text-foreground mb-1">神經系統自我照顧</h3>
              <p className="text-xs text-muted-foreground">理解身體反應，溫柔對待自己</p>
            </Link>
            <Link to="/blog/category/forest-therapy" className="block p-5 rounded-lg bg-mist border border-border hover:shadow-md transition-shadow">
              <h3 className="font-serif-tc text-base font-semibold text-foreground mb-1">森林療癒文章</h3>
              <p className="text-xs text-muted-foreground">閱讀更多自然療癒科普</p>
            </Link>
          </div>
        </div>
      </section>

      {/* 結尾 CTA */}
      <section className="section-padding">
        <div className="container-brand max-w-2xl mx-auto text-center">
          <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground mb-3">展開你的綠色處方箋</h2>
          <p className="text-base text-muted-foreground mb-8 leading-loose">森林沒有評價，沒有期待，只有永恆的包容。無論你正背負著什麼樣的重擔，煦日之森都準備好為你敞開這座綠色庇護所。讓我們在日光與微風中，溫柔地把你找回來。</p>
          <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
            <a href={LINE_URL} target="_blank" rel="noopener noreferrer">領取｜城市裡的森林療癒指南</a>
          </Button>
        </div>
      </section>

    </Layout>
  );
};

export default ForestTherapy;
