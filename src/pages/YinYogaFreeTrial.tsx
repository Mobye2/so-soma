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
import { CheckCircle2, ArrowRight, MessageCircle, ClipboardList, Monitor } from "lucide-react";
import { trackJoinLine, trackSignUpTrial } from "@/lib/analytics";

const LINE_URL = "https://lin.ee/5LJidzG";

const handleLineTrialClick = (label: string) => {
  trackJoinLine(label);
  trackSignUpTrial(label);
};

const includes = [
  { title: "60 分鐘線上直播", desc: "Kaia 親自帶領，從呼吸、覺察到體式停留，一次完整體驗。" },
  { title: "正念引導語", desc: "全程中文引導，幫助你慢下來，把注意力放回身體。" },
  { title: "輕量陰瑜珈體式", desc: "4–5 個基礎體式，每個停留 3–5 分鐘，不需要柔軟度。" },
  { title: "課後 Q&A 時間", desc: "保留 10 分鐘，回應你練習中遇到的疑問與身體感受。" },
];

const flow = [
  {
    step: "01",
    icon: MessageCircle,
    title: "加入 LINE@",
    desc: "點擊下方按鈕加入煦日之森官方 LINE@，每月開課前會收到上課連結。",
  },
  {
    step: "02",
    icon: ClipboardList,
    title: "準備你的練習空間",
    desc: "找一個安靜舒適的地方，準備好：",
    items: ["瑜珈墊", "毯子", "長形枕頭（瑜珈磚亦可）"],
  },
  {
    step: "03",
    icon: Monitor,
    title: "上課當天加入",
    desc: "點擊 LINE@ 的上課連結，跟著 Kaia 一起練習。",
  },
];

const forWho = [
  "工作壓力大、晚上難放鬆的人",
  "想嘗試瑜珈但擔心自己「不夠柔軟」",
  "對正念、神經系統調節有興趣",
  "想先認識駐站心理師 Kaia 的引導風格再決定要不要購買課程",
  "希望每個月有一段安靜、屬於自己的時間",
];

const notFor = [
  "正在急性受傷或疼痛恢復期（請先諮詢醫療人員）",
  "期待高強度運動、流汗、訓練肌力的人",
  "無法在 60 分鐘內保持安靜的環境",
];

const faqs = [
  { q: "真的完全免費嗎？", a: "是的。這是煦日之森每月一次的回饋活動，加入 LINE@ 收到通知後就能免費報名，不需要任何費用。" },
  { q: "我完全沒有瑜珈經驗，可以參加嗎？", a: "可以。免費體驗特別為初學者設計，所有體式都會提供替代版本與輔具建議（毯子、抱枕、瑜珈磚皆可）。" },
  { q: "需要準備什麼設備？", a: "一塊瑜珈墊或大毛巾、一條毯子或大浴巾、一個抱枕。穿著舒服好活動的衣服即可。" },
  { q: "如果當天臨時不能參加怎麼辦？", a: "沒關係，這是免費體驗。當月若無法參加，下個月開課時 LINE@ 會再發送通知。" },
  { q: "免費體驗和付費課程差在哪裡？", a: "免費體驗是 60 分鐘單堂入門課；付費的主題課與五堂系列課則會針對特定主題（如深層好眠修復、焦慮急救調節）做更完整、有層次的設計。" },
];

const YinYogaFreeTrial = () => {
  return (
    <Layout>
      <SEO
        title="免費體驗｜每月一次線上瑜珈｜每月一次線上正念陰瑜珈直播｜煦日之森"
        description="加入煦日之森 LINE@ 即可報名每月一次免費正念陰瑜珈線上直播，由 Kaia 帶領 60 分鐘體驗，從呼吸、覺察到體式停留，適合零基礎與壓力大的你。"
        canonicalPath="/yin-yoga-free-trial"
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-mist">
        <div className="container-brand section-padding text-center max-w-3xl mx-auto">
          <p className="inline-block text-xs tracking-widest text-secondary uppercase mb-4 px-3 py-1 rounded-full bg-secondary/10">
            每月一次 · 完全免費
          </p>
          <h1 className="font-serif-tc text-3xl md:text-5xl font-semibold text-foreground mb-4">
            免費體驗｜每月一次線上瑜珈
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mb-8">
            60 分鐘線上直播，跟著 Kaia 一起練——慢下來，把注意力放回身體
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <a href={LINE_URL} target="_blank" rel="noopener noreferrer" onClick={() => handleLineTrialClick("Hero - 加入 LINE@ 領取開課連結")}>加入 LINE@ 領取開課連結</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-secondary text-secondary hover:bg-secondary/10">
              <a href="#includes">課程內容</a>
            </Button>
          </div>
        </div>
      </section>

      {/* 包含什麼 */}
      <section id="includes" className="section-padding">
        <div className="container-brand max-w-4xl mx-auto">
          <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground mb-10 text-center">
            這 60 分鐘，你會體驗到什麼
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {includes.map((it) => (
              <Card key={it.title} className="bg-background border-border">
                <CardContent className="p-6 flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-secondary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-serif-tc text-base font-semibold text-foreground mb-1">{it.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{it.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 報名流程 */}
      <section className="section-padding bg-mist">
        <div className="container-brand max-w-5xl mx-auto">
          <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground mb-10 text-center">
            如何參加？三個步驟
          </h2>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {flow.map((s) => {
              const Icon = s.icon;
              return (
                <li key={s.step}>
                  <Card className="bg-background border-border h-full">
                    <CardContent className="p-6 flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div className="font-serif-en text-lg tracking-widest text-secondary">{s.step}</div>
                        <Icon className="w-8 h-8 text-secondary" strokeWidth={1.5} />
                      </div>
                      <h3 className="font-serif-tc text-lg font-semibold text-foreground mb-2">{s.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                      {s.items && (
                        <ul className="mt-3 space-y-1.5">
                          {s.items.map((it) => (
                            <li key={it} className="flex gap-2 text-sm text-muted-foreground">
                              <span className="text-secondary">•</span>
                              <span>{it}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ol>
          <div className="mt-10 flex justify-center">
            <Button asChild size="lg" className="bg-moss text-white hover:bg-moss/90 rounded-full px-8">
              <a href={LINE_URL} target="_blank" rel="noopener noreferrer" onClick={() => handleLineTrialClick("Flow - 立即加入 LINE@")}>立即加入 LINE@</a>
            </Button>
          </div>
        </div>
      </section>

      {/* 適合 / 不適合 */}
      <section className="section-padding">
        <div className="container-brand max-w-5xl mx-auto">
          <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground mb-10 text-center">
            適合誰？也想先說清楚不適合誰
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-sage/10 border-sage/30">
              <CardContent className="p-6">
                <h3 className="font-serif-tc text-lg font-semibold text-foreground mb-4">✨ 適合這樣的你</h3>
                <ul className="space-y-3">
                  {forWho.map((t) => (
                    <li key={t} className="flex gap-2 text-sm text-muted-foreground leading-relaxed">
                      <span className="text-secondary mt-0.5">•</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-background border-border">
              <CardContent className="p-6">
                <h3 className="font-serif-tc text-lg font-semibold text-foreground mb-4">這次可能不太適合</h3>
                <ul className="space-y-3">
                  {notFor.map((t) => (
                    <li key={t} className="flex gap-2 text-sm text-muted-foreground leading-relaxed">
                      <span className="text-muted-foreground/60 mt-0.5">•</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
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

      {/* 結尾 CTA */}
      <section className="section-padding bg-moss text-background">
        <div className="container-brand max-w-2xl mx-auto text-center">
          <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold mb-3 text-background">
            準備好給自己 60 分鐘了嗎？
          </h2>
          <p className="text-base text-background/80 mb-8">
            加入 LINE@，下次開課時，我們會第一時間通知你。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="bg-background text-foreground hover:bg-background/90">
              <a href={LINE_URL} target="_blank" rel="noopener noreferrer" onClick={() => handleLineTrialClick("CTA - 加入 LINE@ 免費體驗")}>加入 LINE@ 免費體驗</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-background text-background hover:bg-background/10">
              <Link to="/mindful-yin-yoga">了解完整課程 <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default YinYogaFreeTrial;
