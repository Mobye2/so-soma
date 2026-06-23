import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import ebookCoverBg from "@/assets/ebook-cover-bg.webp";

const EBOOK_TITLE = "不是你不夠努力，是你的神經系統太累了";

const chapters = [
  "第一章：為什麼你總是覺得累？",
  "第二章：認識你的神經系統",
  "第三章：戰或逃，其實是一種保護",
  "第四章：凍結反應——當身體選擇關機",
  "第五章：迷走神經與安全感的秘密",
  "第六章：日常中的神經系統調節練習",
  "第七章：當情緒來敲門——身體的語言",
  "第八章：建立你的身心照顧儀式",
];

const testimonials = [
  { text: "讀完才終於理解為什麼我總是在下班之後整個人垮掉。", name: "小玲，32歲" },
  { text: "很溫柔的文字，沒有說教感，像一個懂你的朋友在說話。", name: "阿凱，28歲" },
  { text: "裡面的練習我每天都在做，真的有感覺身體慢慢放鬆了。", name: "Yi，35歲" },
];

const Ebooks = () => {
  return (
    <Layout>
      <SEO
        title="神經系統・身心療癒電子書 | 煦日之森"
        description="《不是你不夠努力，是你的神經系統太累了》— 由諮商心理師 Kaia 撰寫的神經系統與身心照顧電子書，幫助你理解疲憊、重建身體的安全感。"
        canonicalPath="/ebooks"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Book",
          name: EBOOK_TITLE,
          inLanguage: "zh-Hant",
          author: { "@type": "Person", name: "Kaia" },
          publisher: { "@type": "Organization", name: "煦日之森 Solis Atelier" },
          url: "https://www.solisforest.com/ebooks",
        }}
      />
      <section className="section-padding">
        <div className="container-brand">
          <div className="text-center mb-12">
            <h1 className="font-serif-tc text-3xl md:text-4xl font-semibold text-foreground mb-2">神經系統電子書</h1>
            <p className="heading-en text-sm text-muted-foreground tracking-wider">E-Books · Read at Your Own Pace</p>
            <p className="mt-4 max-w-2xl mx-auto text-sm text-muted-foreground leading-relaxed">
              用閱讀的速度，重新認識你的身體與疲憊。煦日之森電子書由諮商心理師 Kaia 撰寫，把神經系統知識化為日常可實踐的自我照顧。
            </p>
          </div>

          {/* Featured Book */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="flex justify-center">
              <div className="w-64 h-80 rounded-lg shadow-2xl overflow-hidden transform rotate-1 hover:rotate-0 transition-transform relative">
                <img src={ebookCoverBg} alt="電子書封面" className="w-full h-full object-cover" loading="lazy" width={704} height={1024} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex flex-col items-center justify-end p-6 text-center">
                  <h3 className="font-serif-tc text-lg font-semibold leading-tight text-white drop-shadow-md">不是你不夠努力，<br/>是你的神經系統太累了</h3>
                  <p className="text-xs mt-3 text-white/80">Kaia 著</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="font-serif-tc text-2xl md:text-3xl font-semibold text-foreground">
                《不是你不夠努力，是你的神經系統太累了》
              </h2>
              <p className="text-base text-muted-foreground italic">
                寫給每一個明明努力了，身體卻還是很累的人
              </p>

              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">這本書寫給...</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• 經常感到身心疲憊卻找不到原因的你</li>
                  <li>• 想理解自己的情緒與身體反應的你</li>
                  <li>• 想要溫和地照顧自己的你</li>
                </ul>
              </div>

              <div className="flex items-center gap-4">
                <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-8">
                  <Link to={`/contact?subject=${encodeURIComponent(`上架通知：${EBOOK_TITLE}`)}`}>
                    上架通知我
                  </Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">電子書即將上架，留下 email 我們會第一時間通知你</p>
            </div>
          </div>

          {/* TOC */}
          <div className="max-w-2xl mx-auto mb-16">
            <h3 className="font-serif-tc text-xl font-semibold text-foreground mb-6 text-center">目錄預覽</h3>
            <div className="space-y-3">
              {chapters.map((ch, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-md bg-mist border border-border/50">
                  <span className="w-7 h-7 rounded-full bg-sage/15 text-secondary text-xs flex items-center justify-center font-medium shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm text-foreground">{ch}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Excerpt */}
          <div className="max-w-2xl mx-auto bg-mist rounded-lg border border-border p-8 mb-16">
            <p className="text-xs text-muted-foreground mb-3">試閱摘錄</p>
            <blockquote className="font-serif-tc text-base text-foreground leading-loose space-y-4">
              <p>你不是太脆弱，是這個時代讓你很難真正放鬆。</p>
              <p>我在諮商室裡見過太多這樣的人——他們去旅行、做按摩、試過冥想，每一種方法都有一點效果，但就是沒有辦法讓那個「腦子停不下來」的感覺真正消失。</p>
              <p>他們以為是自己的問題。</p>
              <p>但我想告訴你，這不是你的問題。是這個時代的結構，讓壓力週期特別難以完成。</p>
              <p><strong className="font-semibold">第一，邊界消失了。</strong> 工作住在你的口袋裡。下班了，但群組還在傳；睡前了，但那封信還沒回。神經系統需要的那個訊號——「現在安全了，可以復原了」——幾乎永遠不會完整到來。</p>
              <p><strong className="font-semibold">第二，資訊過載。</strong> 光是一個早上滑手機的半小時，你可能已經接觸了幾十則新聞、幾百則訊息。每一則，對神經系統來說都是一個需要評估的刺激。你感覺不到它在耗費你的資源，但它在耗費。</p>
              <p><strong className="font-semibold">第三，通知文化。</strong> 研究顯示，每次被打斷之後，人需要平均二十三分鐘才能完全回到原來的專注狀態。而現代人平均每十一分鐘就收到一次通知。我們的注意力，幾乎從來沒有機會真正深下去。</p>
              <p><strong className="font-semibold">第四，社會比較的常態化。</strong> 社交媒體讓「和別人比較」從偶發的經驗，變成全天候的背景噪音。地位的威脅，對神經系統來說和物理威脅一樣真實。</p>
              <p>這四件事加在一起，造成了一個神經系統幾乎沒有辦法完成壓力週期的環境。</p>
              <p>不是你的問題，是你的神經系統，在一個不停要求它備戰的世界裡，已經太久沒有機會真正放下了。</p>
              <p>這本書，是寫給它的。</p>
            </blockquote>
          </div>

          {/* Testimonials */}
          <div className="max-w-3xl mx-auto">
            <h3 className="font-serif-tc text-xl font-semibold text-foreground mb-6 text-center">讀者回饋</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <div key={i} className="bg-mist rounded-lg border border-border p-5 space-y-3">
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-sage text-sage" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground italic">「{t.text}」</p>
                  <p className="text-xs text-muted-foreground">— {t.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Coming Soon */}
          <div className="max-w-md mx-auto mt-16 text-center p-8 bg-mist rounded-lg border border-border">
            <p className="font-serif-tc text-lg text-foreground mb-3">更多電子書即將推出</p>
            <div className="flex gap-2 max-w-xs mx-auto">
              <input type="email" placeholder="your@email.com" className="flex-1 px-3 py-2 text-sm rounded-md bg-background border border-border focus:outline-none focus:ring-1 focus:ring-sage" />
              <button className="px-4 py-2 text-sm rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90">
                通知我
              </button>
            </div>
          </div>

          {/* Internal links for SEO */}
          <nav aria-label="延伸閱讀" className="mt-16 pt-8 border-t border-border text-center">
            <h2 className="font-serif-tc text-lg font-semibold text-foreground mb-4">延伸閱讀</h2>
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-sage">
              <li><Link to="/about" className="hover:underline">認識作者 Kaia</Link></li>
              <li><Link to="/blog" className="hover:underline">神經系統與身心療癒文章</Link></li>
              <li><Link to="/courses" className="hover:underline">正念陰瑜珈・神經系統線上課程</Link></li>
              <li><Link to="/quiz" className="hover:underline">免費神經全景測驗</Link></li>
              <li><Link to="/shop" className="hover:underline">瀏覽所有商品</Link></li>
            </ul>
          </nav>
        </div>
      </section>
    </Layout>
  );
};

export default Ebooks;
