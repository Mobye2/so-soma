import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowRight } from "lucide-react";
import courseYinYoga from "@/assets/course-yin-yoga.webp";
import yinYogaHero from "@/assets/yin-yoga-hero.webp";

const LINE_URL = "https://lin.ee/WJcPZiC";

const themes = [
  { emoji: "🌙", title: "深層好眠修復", subtitle: "讓亢奮的神經系統在睡前真正卸載，安穩入眠", desc: "給失眠、淺眠、睡前腦袋停不下來的你" },
  { emoji: "🌬", title: "焦慮急救調節", subtitle: "當焦慮襲來，繞過理智，讓身體先找回安全感", desc: "給高壓、慢性焦慮、容易緊繃的你" },
  { emoji: "💼", title: "辦公室高壓釋放", subtitle: "專為久坐、肩頸緊繃的你設計的微型放鬆", desc: "針對長時間坐辦公室、WFH 族設計" },
  { emoji: "🌊", title: "情緒滯留疏通", subtitle: "當情緒卡住時，不強迫對話，讓身體溫柔帶路", desc: "給情緒壓抑、低落、說不清楚哪裡不對的你" },
  { emoji: "🌿", title: "核心與腰背釋放", subtitle: "卸下代償的壓力，給長期腰痠背痛者的溫柔解藥", desc: "針對久坐族、腰背慢性疼痛設計" },
];

const compareCards = [
  {
    title: "一般陰瑜珈",
    items: ["靜態停留，著重身體伸展", "放鬆筋膜與結締組織", "較少強調心理覺察層面", "適合想要深度伸展的人"],
    highlight: false,
  },
  {
    title: "✨ 正念陰瑜珈",
    items: [
      "靜態停留，節奏緩慢",
      "放鬆筋膜與結締組織",
      "啟動副交感神經，深度修復",
      "加入正念覺察引導",
      "適合身心疲憊、需要放鬆的人",
    ],
    highlight: true,
  },
];

const faqs = [
  { q: "沒有瑜珈基礎可以參加嗎？", a: "完全可以。正念陰瑜珈不需要任何瑜珈經驗，也不需要柔軟度。我們強調的是覺察，不是體式的完成度。" },
  { q: "需要很柔軟嗎？", a: "不需要。陰瑜珈的目的不是把身體拉到某個位置，而是在你現在的範圍內靜止停留，讓身體自然釋放。" },
  { q: "正念陰瑜珈和一般陰瑜珈有什麼不同？", a: "正念陰瑜珈在每個體式停留的過程中，加入正念覺察引導——幫助你注意身體的感受、呼吸的節奏，而不只是「撐過去」。這讓練習從身體層面延伸到心理層面。" },
  { q: "線上主題課和直播系列課有什麼不同？", a: "主題課是預錄課程，購買後隨時可以看，依自己的節奏練習。直播系列課是固定時段的即時課程，Kaia 會在線上即時帶領和互動。" },
  { q: "陰瑜珈適合有受傷或慢性疼痛的人嗎？", a: "請在開始前諮詢你的醫療人員。一般來說，陰瑜珈的靜態和緩慢特性對許多慢性疼痛狀況是友善的，但每個人的狀況不同，需要個別評估。" },
];

const mechanisms = [
  {
    title: "深入結締組織與筋膜網絡",
    desc: "以輔具完全支撐身體，每個體式靜止停留 3 到 5 分鐘，溫柔深入筋膜與神經網絡。",
  },
  {
    title: "釋放滯留的壓力與緊繃",
    desc: "壓力與緊繃常儲存在結締組織中。當深層組織在安全中舒展，卡住的感受便隨呼吸釋放。",
  },
  {
    title: "多迷走神經的安全訊號",
    desc: "透過呼吸吐納與不評價的覺察，向大腦發送安全訊號，溫柔關閉交感神經警報，啟動深度修復。",
  },
];

const yyTestimonials = [
  {
    quote: "我終於學會，不用力也是一種選項。",
    body: "我的工作習慣了凡事要「達標」。第一次躺下時，我還在想姿勢對不對，直到 Kaia 說：「在這裡，你只需要允許自己被接住。」那一刻，放鬆從脊椎蔓延開來，我第一次真正感覺到自己的呼吸。",
    author: "M., 品牌行銷總監",
  },
  {
    quote: "在三個微型練習後，緊繃終於鬆開了。",
    body: "長時間盯螢幕讓我的肩頸硬如石頭，晚上翻來覆去。每天睡前 15 分鐘跟著「睡前深層修復」，沒有複雜動作，只有簡單的支撐與停留。我的身體記住了這種「安全感」。",
    author: "L., 資深軟體工程師",
  },
  {
    quote: "那是一種深層的壓力代謝與情緒疏通。",
    body: "在一次「髖部與骨盆腔釋放」中，眼淚不自覺流下。原來身體默默扛下了許多未曾訴說的緊繃。煦日的陰瑜珈不僅舒緩了長期腰痠，更像是幫心靈做了一次溫柔的大掃除。",
    author: "S., 自由接案設計師",
  },
];

const YinYoga = () => {
  return (
    <Layout>
      <SEO
        title="正念陰瑜珈課程｜線上 & 實體｜適合初學者｜煦日之森"
        description="煦日之森線上瑜伽課程，由心理師設計的陰瑜伽與修復瑜伽。結合正念心理學，幫助你在家釋放壓力、改善睡眠品質。立即免費體驗。"
        canonicalPath="/mindful-yin-yoga"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src={yinYogaHero}
          alt="正念陰瑜珈課程，心理師 Kaia 帶領的小班制瑜珈教學"
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background/80" />
        <div className="relative container-brand section-padding text-center max-w-3xl mx-auto">
          <h1 className="font-serif-tc text-3xl md:text-5xl font-semibold text-foreground mb-4">
            正念陰瑜珈課程｜線上與實體，適合所有程度
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mb-8">
            正念陰瑜珈——用覺察帶領身體，讓神經系統真正放鬆下來
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <a href="#themes">瀏覽課程</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-background/80 border-secondary text-secondary hover:bg-background">
              <Link to="/quiz">身心壓力全景測驗</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 導言 */}
      <section className="section-padding">
        <div className="container-brand max-w-3xl mx-auto">
          <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground mb-8 text-center">
            不用力的修復，才是最深的安頓
          </h2>
          <div className="space-y-5 text-base text-muted-foreground leading-loose">
            <p>你是否也曾有過這樣的經驗：當感到壓力很大時，跑去上了一堂大汗淋漓的激烈運動課，或是進行深度的筋骨伸展，當下雖然覺得暢快，但隔天醒來，那種深層的疲憊與無力感卻依然揮之不去？</p>
            <p>對於長期處於高壓、神經系統已經極度過載的現代人來說，身體需要的往往不是「更多的刺激」與「更用力的伸展」，而是學會如何安全地「放手與臣服」。</p>
            <p>這正是『煦日正念陰瑜珈（Mindful Yin Yoga）』誕生的初衷。我們結合了正念認知療法（MBCT）的覺察力，以及陰瑜珈的深層組織修復，為你在日常的縫隙中，打造一座隨時可以躲入的微型庇護所。</p>
          </div>
        </div>
      </section>

      {/* 課程詳情與機制 */}
      <section className="section-padding bg-background">
        <div className="container-brand max-w-5xl mx-auto">
          <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground mb-3 text-center">課程詳情與機制｜為什麼是「陰」瑜珈？</h2>
          <p className="text-base text-muted-foreground leading-loose text-center max-w-3xl mx-auto mb-10">
            與常見強調肌肉力量、流動與心肺耐力的陽性瑜珈不同，陰瑜珈是一種極度緩慢、向內探索的實踐。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mechanisms.map((m) => (
              <Card key={m.title} className="bg-background border-border">
                <CardContent className="p-7">
                  <h3 className="font-serif-tc text-lg font-semibold text-foreground mb-3">{m.title}</h3>
                  <p className="text-sm text-muted-foreground leading-loose">{m.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

        </div>
      </section>

      {/* 真實迴響 */}
      <section className="section-padding">
        <div className="container-brand max-w-6xl mx-auto">
          <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground mb-3 text-center">在呼吸之間，找回自己</h2>
          <p className="text-sm text-muted-foreground text-center mb-10">以下為煦日學員真實體驗回饋，隱私皆已妥善處理。</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {yyTestimonials.map((t) => (
              <Card key={t.author} className="bg-background border-border">
                <CardContent className="p-7 flex flex-col h-full">
                  <p className="font-serif-tc text-base text-secondary mb-4 leading-relaxed">「{t.quote}」</p>
                  <p className="text-sm text-muted-foreground leading-loose mb-4 flex-1">{t.body}</p>
                  <p className="text-xs text-muted-foreground/80">—— {t.author}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 比較 */}
      <section className="section-padding bg-mist">
        <div className="container-brand">
          <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground mb-10 text-center">
            和一般瑜珈有什麼不同？
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {compareCards.map((c) => (
              <Card
                key={c.title}
                className={
                  c.highlight
                    ? "bg-background border-2 border-secondary shadow-lg md:scale-105"
                    : "bg-background border-border"
                }
              >
                <CardContent className="p-6">
                  <h3 className={`font-serif-tc text-lg font-semibold mb-4 ${c.highlight ? "text-secondary" : "text-foreground"}`}>
                    {c.title}
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-2 leading-relaxed">
                    {c.items.map((it) => (
                      <li key={it} className="flex gap-2">
                        <span className="text-secondary mt-0.5">•</span>
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>


      {/* 主題課 */}
      <section id="themes" className="section-padding bg-mist">
        <div className="container-brand">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground mb-2">
              身心正念陰瑜珈主題課
            </h2>
            <p className="text-sm text-muted-foreground">選一個你現在最需要的主題，從一堂開始</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {themes.map((t) => (
              <Card key={t.title} className="bg-background border-border">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="text-3xl mb-3">{t.emoji}</div>
                  <h3 className="font-serif-tc text-lg font-semibold text-foreground mb-1">{t.title}</h3>
                  <p className="text-sm text-secondary mb-2">{t.subtitle}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">{t.desc}</p>
                  <Button asChild variant="outline" size="sm" className="border-secondary text-secondary hover:bg-secondary/10 self-start">
                    <Link to={`/contact?subject=${encodeURIComponent(`上架通知：${t.title}`)}`}>即將上架</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 捆包方案 */}
      <section className="section-padding bg-sage/15">
        <div className="container-brand">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground mb-3">
              任選三堂，組合成你的身心練習計畫
            </h2>
            <p className="text-base text-muted-foreground mb-6 max-w-xl mx-auto">
              每個人需要的不一樣。選擇三個最符合你現在狀態的主題，依照自己的節奏練習。
            </p>
            <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <a href={LINE_URL} target="_blank" rel="noopener noreferrer">接收上架通知與專屬提案</a>
            </Button>
          </div>
        </div>
      </section>

      {/* 免費體驗 */}
      <section className="section-padding">
        <div className="container-brand max-w-4xl mx-auto">
          <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground mb-8 text-center">
            免費體驗｜每月一次線上瑜珈
          </h2>
          <Card className="bg-background border-border overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <img src={courseYinYoga} alt="免費線上正念陰瑜珈體驗" className="w-full h-full object-cover min-h-[240px]" loading="lazy" />
              <CardContent className="p-8 flex flex-col justify-center">
                <p className="text-base text-muted-foreground leading-relaxed mb-5">
                  每月一次的線上正念陰瑜珈直播，由 Kaia 即時帶領。不需要瑜珈經驗，也不需要柔軟度，只需要願意給自己一段安靜的時間。
                </p>
                <ul className="text-sm text-muted-foreground space-y-1.5 mb-6">
                  <li>🎥 線上即時直播</li>
                  <li>🌙 每月一次，完全免費</li>
                  <li>💌 加入 LINE@ 領取開課連結</li>
                </ul>
                <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90 self-start">
                  <Link to="/yin-yoga-free-trial">了解免費體驗 <ArrowRight className="w-4 h-4 ml-1" /></Link>
                </Button>
              </CardContent>
            </div>
          </Card>
        </div>
      </section>

      {/* 實體活動預告 */}
      <section className="section-padding bg-moss text-background">
        <div className="container-brand max-w-4xl mx-auto text-center">
          <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold mb-3 text-background">
            由 ANFT 國際森林療癒師親自引領。透過五感邀請、靜默漫步與自然冥想，在純粹的林間卸下數位焦慮，找回失落的專注與深層平靜。
          </h2>
          <p className="text-base text-background/80 mb-8 max-w-2xl mx-auto">
            Solis Retreat｜兩天一夜山林療癒與深度修復之旅，結合深度森林療癒與正念陰瑜珈的極致自我照顧。包含住宿與餐食，讓交感神經在兩日中徹底卸載重擔，完成一場深度的大休息。
          </p>
          <Button asChild size="lg" className="bg-background text-foreground hover:bg-background/90">
            <Link to="/forest-therapy">了解更多 <ArrowRight className="w-4 h-4 ml-1" /></Link>
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-mist">
        <div className="container-brand max-w-3xl mx-auto">
          <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground mb-8 text-center">
            常見問題
          </h2>
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
            <Link to="/forest-therapy" className="block p-5 rounded-lg bg-mist border border-border hover:shadow-md transition-shadow">
              <h3 className="font-serif-tc text-base font-semibold text-foreground mb-1">森林療癒課程</h3>
              <p className="text-xs text-muted-foreground">用自然啟動副交感神經</p>
            </Link>
            <Link to="/self-care" className="block p-5 rounded-lg bg-mist border border-border hover:shadow-md transition-shadow">
              <h3 className="font-serif-tc text-base font-semibold text-foreground mb-1">神經系統自我照顧</h3>
              <p className="text-xs text-muted-foreground">建立你的身心照顧日常</p>
            </Link>
            <Link to="/blog/category/yin-yoga" className="block p-5 rounded-lg bg-mist border border-border hover:shadow-md transition-shadow">
              <h3 className="font-serif-tc text-base font-semibold text-foreground mb-1">正念陰瑜珈文章</h3>
              <p className="text-xs text-muted-foreground">練習筆記與身體覺察書寫</p>
            </Link>
          </div>
        </div>
      </section>

      {/* 結尾 CTA */}
      <section className="section-padding bg-moss text-background">
        <div className="container-brand max-w-2xl mx-auto text-center">
          <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold mb-3 text-background">
            邀請你，為自己停下來
          </h2>
          <p className="text-base text-background/85 mb-8 leading-loose">
            不論這個世界要求你跑得多快，你永遠有權利為自己按下暫停鍵。展開你的煦日瑜珈墊，這是一場不需要任何基礎、不需要任何柔軟度的自我陪伴。只需要你帶著真實的疲憊赴約，讓我們在呼吸的起伏間，一起溫柔地卸下世界的重量。
          </p>
          <Button asChild size="lg" className="bg-background text-foreground hover:bg-background/90">
            <Link to="/yin-yoga-free-trial">了解免費體驗</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default YinYoga;
