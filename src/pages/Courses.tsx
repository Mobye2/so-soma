import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MapPin, Users, Clock } from "lucide-react";
import coursesHeroTree from "@/assets/courses-hero-tree.webp";

const LINE_URL = "https://lin.ee/WJcPZiC";

type StatusTone = "soon" | "future";

const StatusBadge = ({ label, tone = "soon" }: { label: string; tone?: StatusTone }) => (
  <span
    className={`inline-block text-xs font-medium px-3 py-1 rounded-full ${
      tone === "future"
        ? "bg-sage/20 text-secondary"
        : "bg-secondary/10 text-secondary"
    }`}
  >
    {label}
  </span>
);

const SectionHeader = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="mb-8">
    <h2 className="font-serif-tc text-xl md:text-3xl font-semibold text-foreground mb-2 leading-snug break-keep">
      {title}
    </h2>
    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{description}</p>
  </div>
);

const Courses = () => {
  const bodyPracticeCards = [
    { emoji: "😴", title: "深層好眠修復", desc: "讓亢奮的神經系統在睡前真正卸載，安穩入眠" },
    { emoji: "🌬", title: "焦慮急救調節", desc: "當焦慮襲來，繞過理智，讓身體先找回安全感" },
    { emoji: "💼", title: "辦公室高壓釋放", desc: "專為久坐、肩頸緊繃的你設計的微型放鬆" },
    { emoji: "💭", title: "情緒滯留疏通", desc: "當情緒卡住時，不強迫對話，讓身體溫柔帶路" },
    { emoji: "🌿", title: "核心與腰背釋放", desc: "卸下代償的壓力，給長期腰痠背痛者的溫柔解藥" },
  ];

  return (
    <Layout>
      <SEO
        title="Solis Signatures ｜ 煦日體驗與身心提案｜煦日之森"
        description="森林療癒、身體練習、認識自己、免費體驗——褪去必須時刻堅強的防衛，讓身體溫柔帶路。結合自律神經科學與自然介入，我們為疲憊的身心設計了深淺不同的專屬提案。從線上的微型調節到山林的深度沈浸，陪你一步步找回久違的平靜。"
        canonicalPath="/courses"
      />

      {/* Hero */}
      <section
        className="relative section-padding bg-mist bg-cover bg-center"
        style={{ backgroundImage: `url(${coursesHeroTree})` }}
      >
        <div className="absolute inset-0 bg-background/55" aria-hidden="true" />
        <div className="container-brand text-center max-w-2xl mx-auto relative">
          <h1 className="font-serif-tc text-3xl md:text-5xl font-semibold text-foreground mb-3 drop-shadow-sm whitespace-pre-line leading-snug break-keep">
            Solis Signatures ｜{"\n"}煦日體驗與身心提案
          </h1>
          <p className="text-sm md:text-lg text-foreground/80 whitespace-pre-line leading-relaxed break-keep">
            褪去必須時刻堅強的防衛，讓身體溫柔帶路。{"\n"}結合自律神經科學與自然介入，我們為疲憊的身心設計了深淺不同的專屬提案。{"\n"}從線上的微型調節到山林的深度沈浸，陪你一步步找回久違的平靜。
          </p>
        </div>
      </section>

      {/* 區塊一：走進自然 */}
      <section className="section-padding">
        <div className="container-brand max-w-5xl mx-auto">
          <SectionHeader
            title="🌲 走進自然"
            description="由 ANFT 國際森林療癒師親自引領。透過五感邀請、靜默漫步與自然冥想，在純粹的林間卸下數位焦慮，找回失落的專注與深層平靜。"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 卡片一 */}
            <div className="bg-background border border-border rounded-2xl p-6 md:p-8 flex flex-col">
              <h3 className="font-serif-tc text-lg md:text-xl font-semibold text-foreground mb-3 leading-snug break-keep">
                Green Prescription｜煦日森林半日沈浸體驗
              </h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                ANFT 認證療癒師帶領，感官邀請、靜默漫步與自然冥想
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 mb-5">
                <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-secondary" /> 自然場域</li>
                <li className="flex items-center gap-2"><Users className="w-4 h-4 text-secondary" /> 小班制</li>
                <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-secondary" /> 約 3 小時</li>
              </ul>
              <div className="mt-auto flex flex-wrap items-center gap-3">
                <StatusBadge label="預計 2026 Q4 開課" />
                <Button asChild size="sm" variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
                  <a href={LINE_URL} target="_blank" rel="noopener noreferrer">接收上架通知與專屬提案</a>
                </Button>
              </div>
            </div>

            {/* 卡片二 */}
            <div className="bg-background border border-border rounded-2xl p-6 md:p-8 flex flex-col">
              <h3 className="font-serif-tc text-lg md:text-xl font-semibold text-foreground mb-3 leading-snug break-keep">
                Solis Retreat｜兩天一夜山林療癒與深度修復之旅
              </h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                結合深度森林療癒與正念陰瑜珈的極致自我照顧。包含住宿與餐食，讓交感神經在兩日中徹底卸載重擔，完成一場深度的大休息。
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 mb-5">
                <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-secondary" /> 台灣森林山區</li>
                <li className="flex items-center gap-2"><Users className="w-4 h-4 text-secondary" /> 小班制</li>
                <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-secondary" /> 兩天一夜</li>
              </ul>
              <div className="mt-auto flex flex-wrap items-center gap-3">
                <StatusBadge label="不定期開課" tone="future" />
                <Button asChild size="sm" variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
                  <a href={LINE_URL} target="_blank" rel="noopener noreferrer">接收上架通知與專屬提案</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 區塊二：認識自己，自我照顧 */}
      <section className="section-padding bg-mist">
        <div className="container-brand max-w-6xl mx-auto">
          <SectionHeader
            title="🧠Somatic Practice ｜ 專屬狀態的正念陰瑜珈引導"
            description="不需要任何柔軟度，只需要你願意為自己停下來。"
          />

          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory md:grid md:grid-cols-5 md:overflow-visible md:mx-0 md:px-0">
            {bodyPracticeCards.map((c) => (
              <div
                key={c.title}
                className="min-w-[240px] md:min-w-0 snap-start bg-background border border-border rounded-2xl p-6 flex flex-col"
              >
                <div className="text-3xl mb-3">{c.emoji}</div>
                <h3 className="font-serif-tc text-lg font-semibold text-foreground mb-2">
                  {c.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed flex-1">
                  {c.desc}
                </p>
                <div className="space-y-3">
                  <StatusBadge label="即將上架" />
                  <Button asChild size="sm" variant="outline" className="w-full border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
                    <a href={LINE_URL} target="_blank" rel="noopener noreferrer">訂閱通知</a>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Bundle banner */}
          <div className="mt-8 bg-sage/15 border border-sage/30 rounded-2xl p-6 md:p-8 text-center">
            <h3 className="font-serif-tc text-base md:text-2xl font-semibold text-foreground mb-4 leading-snug break-keep">
              Solis Bundle ｜ 任選三堂微型修復，享專屬組合優惠
            </h3>
            <p className="text-sm text-muted-foreground mb-6 whitespace-pre-line leading-relaxed break-keep">
              為自己準備一套完整的微型修復工具箱，{"\n"}讓身體在不同時刻都能被安穩接住。
            </p>
            <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <a href={LINE_URL} target="_blank" rel="noopener noreferrer">接收上架通知與專屬提案</a>
            </Button>
          </div>
        </div>
      </section>

      {/* 區塊三：認識自己 */}
      <section className="section-padding">
        <div className="container-brand max-w-5xl mx-auto">
          <SectionHeader
            title="🧠Inner Wisdom ｜ 遇見身體的智慧"
            description="從神經系統開始，重新理解真實的自己。"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-background border border-border rounded-2xl p-6 md:p-8 flex flex-col">
              <h3 className="font-serif-tc text-lg md:text-xl font-semibold text-foreground mb-3 leading-snug break-keep">
                Somatic Reset ｜ 神經系統放鬆居家調節線上課
              </h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed whitespace-pre-line break-keep">
                結合多迷走神經科學的居家調節指南。{"\n"}專為總是緊繃、深感慢性疲勞卻說不清為什麼的你設計，從科學解析到日常練習，預錄隨選，隨時隨地找回內在的煞車鍵。
              </p>
              <p className="text-xs text-muted-foreground mb-5">自學課程｜預錄隨選</p>
              <div className="mt-auto flex flex-wrap items-center gap-3">
                <StatusBadge label="即將上架" />
                <Button asChild size="sm" variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
                  <a href={LINE_URL} target="_blank" rel="noopener noreferrer">訂閱通知</a>
                </Button>
              </div>
            </div>
            <div className="bg-background border border-border rounded-2xl p-6 md:p-8 flex flex-col">
              <h3 className="font-serif-tc text-lg md:text-xl font-semibold text-foreground mb-3 leading-snug break-keep">
                電子書《你不是太脆弱，是神經系統太累了》
              </h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                12 個章節的深度對話，帶你跳脫「不夠努力」的自我苛責。從神經科學的視角，重新溫柔擁抱並理解自己的身心防衛反應。
              </p>
              <p className="text-xs text-muted-foreground mb-5">電子書｜隨時閱讀</p>
              <div className="mt-auto flex flex-wrap items-center gap-3">
                <StatusBadge label="即將上架" />
                <Button asChild size="sm" variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
                  <a href={LINE_URL} target="_blank" rel="noopener noreferrer">訂閱通知</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 區塊四：免費體驗 */}
      <section className="section-padding bg-mist">
        <div className="container-brand max-w-5xl mx-auto">
          <SectionHeader
            title="🆓 Welcome Gift ｜ 初識煦日・免費體驗"
            description="每個人承受疲憊的方式都不盡相同。如果你還不確定身體的需要，請從這裡開始。我們為你準備了完全免費的專屬見面禮，陪你安心、無負擔地跨出自我照顧的第一步。"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-background border border-border rounded-2xl p-6 md:p-8 flex flex-col">
              <h3 className="font-serif-tc text-lg md:text-xl font-semibold text-foreground mb-3 leading-snug break-keep">
                每月一次｜Solis 正念陰瑜珈直播
              </h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed flex-1">
                每月一次 45 分鐘的線上綠洲。無需任何瑜珈基礎或柔軟度，只需帶著真實的自己赴約，在呼吸間釋放累積的緊繃。
              </p>
              <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90 self-start">
                <a href={LINE_URL} target="_blank" rel="noopener noreferrer">免費加入 LINE 空間，領取專屬連結</a>
              </Button>
            </div>
            <div className="bg-background border border-border rounded-2xl p-6 md:p-8 flex flex-col">
              <h3 className="font-serif-tc text-lg md:text-xl font-semibold text-foreground mb-3 leading-snug break-keep">
                神經全景測驗｜你的神經系統需要什麼？
              </h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed flex-1">
                花 3 分鐘，透視當下的自律神經狀態（戰逃/凍結/安全）。我們將為你精準配對最適合的調節練習，找到專屬的放鬆方向。
              </p>
              <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90 self-start">
                <Link to="/quiz">開始免費測驗，尋找專屬配方</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Courses;
