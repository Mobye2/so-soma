import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import ContactSection from "@/components/ContactSection";
import { Instagram, GraduationCap, Leaf, Heart, Briefcase, Sparkles, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import kaiaPortrait from "@/assets/kaia-portrait-new.webp";
import aboutForest from "@/assets/about-forest.webp";

const About = () => {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash === "#contact") {
      const el = document.getElementById("contact");
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [hash]);

  return (
    <Layout>
      <SEO
        title="關於煦日之森｜回到身體，回到自然，回到你自己"
        description="關於煦日之森。過載的數位焦慮、懸浮的心、遺忘好好呼吸的身體。我們總是在照料世界，卻忘了自己的靈魂也需要一處能容納脆弱的庇護所。這裡是一座結合 臨床心理處遇經驗與歐美經驗的綠色織網。"
        canonicalPath="/about"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Person",
            name: "Kaia",
            jobTitle: "駐站首席心理師",
            description: "台灣諮商心理師，美國 ANFT 認證森林療癒師，煦日之森駐站首席心理師",
            worksFor: { "@type": "Organization", name: "煦日之森 Solis Atelier" },
            url: "https://www.solisforest.com/about",
            knowsAbout: ["諮商心理", "森林療癒", "正念陰瑜珈", "神經系統教育"],
          },
          {
            "@context": "https://schema.org",
            "@type": "Person",
            name: "Owen",
            jobTitle: "煦日之森創辦人",
            worksFor: { "@type": "Organization", name: "煦日之森" },
            description: "本澈行銷創辦人，品牌行銷專業，煦日之森平台創辦人",
            knowsAbout: ["品牌行銷", "身心療癒平台", "健康品牌策略"],
          },
        ]}
      />
      {/* Brand Story */}
      <section className="section-padding">
        <div className="container-brand max-w-3xl mx-auto">
          <h1 className="font-serif-tc text-3xl md:text-4xl font-semibold text-foreground mb-3 text-center">
            認識煦日之森
          </h1>
          <p className="text-base md:text-lg text-muted-foreground text-center mb-10">
            以科學為基礎的身心療癒平台
          </p>

          <img src={aboutForest} alt="台灣森林步道，煦日之森森林療癒場域" className="w-full rounded-lg mb-10 object-cover max-h-80" loading="lazy" width={1200} height={800} />

          <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground mb-4">
            關於煦日之森｜回到身體，回到自然，回到你自己
          </h2>
          <div className="text-base text-muted-foreground leading-loose space-y-4">
            <p>過載的數位焦慮、懸浮的心、遺忘好好呼吸的身體。<br />我們總是在照料世界，卻忘了自己的靈魂也需要一處能容納脆弱的庇護所。</p>
            <p>這裡是一座結合 臨床心理處遇經驗與歐美經驗的綠色織網。<br />我們以自然的語言與身體的覺察為鑰匙，溫柔解鎖累積於神經系統中的慢性疲勞，陪伴你在流動的日光中，重新聽見身體的呼吸。</p>
            <p className="text-right text-sm text-secondary font-medium pt-4"></p>
          </div>
        </div>
      </section>



      {/* Meet Owen */}
      <section className="section-padding bg-background">
        <div className="container-brand max-w-3xl mx-auto">
          <div className="mb-6">
            <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground mb-1">
              Owen｜煦日之森創辦人 × 本澈行銷創辦人
            </h2>
            <p className="text-sm text-secondary font-medium">平台創辦人 ｜ 品牌策略與營運負責人</p>
          </div>

          <div className="text-base text-muted-foreground leading-loose space-y-4 whitespace-pre-line">
            {`一個品牌的誕生，往往源於對理想生活美學的執著。Owen 帶著對自然永續的熱愛與系統化營運的視野，一手創立了『煦日之森』。
在喧囂的世界中，他深知現代菁英對「內在安全感」與「自我照顧（Self-care）」的極致追求。他將歐洲頂級 Retreat 的五感美學引入台灣，從場地的挑選、光影的流動，到每一次與大自然共處的細節，Owen 以最嚴謹的款待標準，在喧囂的島嶼上，為渴望停頓的靈魂，打造了一座能全然交付脆弱的身心庇護所。他負責守護這座森林的基石，讓所有走進來的步伐，都能感到安心。`}
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            {[
              { icon: Sparkles, label: "煦日之森 創辦人" },
              { icon: Briefcase, label: "本澈行銷 創辦人" },
              { icon: TrendingUp, label: "品牌行銷專業" },
            ].map((cred, i) => (
              <span key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage/10 text-sm text-secondary border border-sage/20">
                <cred.icon className="w-4 h-4" /> {cred.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Meet Kaia */}
      <section className="section-padding bg-mist">
        <div className="container-brand">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <img src={kaiaPortrait} alt="煦日之森駐站首席心理師 Kaia，專業諮商經驗" className="w-full max-w-md mx-auto rounded-lg shadow-lg object-cover" loading="lazy" width={800} height={1000} />
            </div>
            <div className="space-y-6">
              <div>
                <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground mb-1">駐站首席心理師 Kaia</h2>
                <h3 className="text-sm text-secondary font-medium">台灣第一位持有美國 ANFT 認證森林療癒師的諮商心理師</h3>
              </div>

              <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                {`「走得再遠，都是為了找到一條安穩回家的路。」

Kaia 具備逾十年臨床心理與危機處遇底蘊。為尋求更深層的修復路徑，她將目光投向歐洲，揉合葡萄牙辛特拉老森林的跨國自然介入經驗，與英國前沿的環境藝術治療視野。

她結合多迷走神經科學，捨棄生硬的診斷標籤。以自然的語言為鑰匙，溫柔繞過理性的防衛，陪伴過載疲憊的身心在光影流動中，重新聽見呼吸，安穩歸來。`}
              </p>

              {/* Credentials */}
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: GraduationCap, label: "國家高考諮商心理師" },
                  { icon: Leaf, label: "美國ANFT 認證森林療癒師" },
                  { icon: Heart, label: "RYT-200 美國瑜珈聯盟認證瑜珈教師" },
                ].map((cred, i) => (
                  <span key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage/10 text-sm text-secondary border border-sage/20">
                    <cred.icon className="w-4 h-4" /> {cred.label}
                  </span>
                ))}
              </div>

              {/* Personal IG */}
              <a
                href="https://instagram.com/for_rest_journey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-secondary hover:text-secondary/80 transition-colors"
              >
                <Instagram className="w-4 h-4" />
                <span>Kaia 個人創作帳號 @for_rest_journey</span>
              </a>
            </div>
          </div>
        </div>
        <div className="container-brand max-w-3xl mx-auto mt-16 p-6 rounded-lg bg-background border border-border">
          <h3 className="font-serif-tc text-xl font-semibold text-foreground mb-2">持續成長的療癒師團隊</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">煦日之森持續邀請各領域的專業人士加入，共同為您提供更多元的身心療癒選擇。</p>
        </div>
      </section>

      {/* Philosophy */}
      <section className="section-padding">
        <div className="container-brand max-w-2xl mx-auto text-center">
          <blockquote className="mb-8">
            <p className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground leading-relaxed">
              「練習，而非學習」
            </p>
            <p className="heading-en text-lg text-muted-foreground mt-2 italic">
              Practice, Not Just Learn
            </p>
          </blockquote>
          <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-line">
            {`你讀過很多，也知道該怎麼做。
但當壓力真的來的時候，身體還是照舊——肩膀緊、呼吸短淺、腦袋停不下來。
不是你不夠努力。是因為知識停留在腦袋，而疲憊住在身體裡。
填上這段距離的，不是再讀一篇文章，而是一次又一次帶著覺察的練習。
煦日之森設計的每一堂課、每一本書，都相信：改變不來自「學更多」，而來自「練得夠深」。`}
          </p>
        </div>
      </section>

      {/* Social Strip */}
      <section className="section-padding bg-mist">
        <div className="container-brand">
          <h3 className="font-serif-tc text-xl font-semibold text-foreground text-center mb-2">
            駐站心理師 Kaia 的個人創作
          </h3>
          <a
            href="https://instagram.com/for_rest_journey"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-sm text-secondary hover:underline mb-8"
          >
            @for_rest_journey
          </a>

          {/* Embedded IG profile */}
          <div className="max-w-lg mx-auto">
            <iframe
              src="https://www.instagram.com/for_rest_journey/embed"
              className="w-full border-0 rounded-lg"
              style={{ minHeight: 600 }}
              allowTransparency
              loading="lazy"
              title="Instagram @for_rest_journey"
            />
          </div>

          <div className="text-center mt-10 p-6 bg-background rounded-lg border border-border max-w-md mx-auto">
            <p className="text-sm text-muted-foreground mb-3">煦日之森官方帳號 敬請期待 🌿</p>
            <div className="flex gap-2 max-w-xs mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-3 py-2 text-sm rounded-md bg-mist border border-border focus:outline-none focus:ring-1 focus:ring-sage"
              />
              <button className="px-4 py-2 text-sm rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors">
                通知我
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="section-padding bg-mist scroll-mt-24">
        <ContactSection />
      </section>
    </Layout>
  );
};

export default About;
