import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";

const Quiz = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(900);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data && e.data.type === "quiz-height" && typeof e.data.height === "number") {
        setHeight(Math.max(600, e.data.height + 32));
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  useEffect(() => {
    // Same-origin iframe: poll content height as a fallback in case
    // the embedded HTML doesn't postMessage its height.
    const interval = window.setInterval(() => {
      const iframe = iframeRef.current;
      if (!iframe) return;
      try {
        const doc = iframe.contentDocument;
        if (!doc) return;
        const h = Math.max(
          doc.documentElement.scrollHeight,
          doc.body?.scrollHeight ?? 0,
        );
        if (h && Math.abs(h - height) > 4) {
          setHeight(Math.max(600, h + 32));
        }
        if (!completed && doc.querySelector(".result-title")) {
          setCompleted(true);
        }
      } catch {
        // cross-origin: ignore
      }
    }, 400);
    return () => window.clearInterval(interval);
  }, [height, completed]);

  return (
    <Layout>
      <SEO
        title="神經全景測驗｜你的神經系統需要什麼？ | 煦日之森"
        description="花 3 分鐘，透視當下的自律神經狀態（戰逃/凍結/安全）。我們將為你精準配對最適合的調節練習，找到專屬的放鬆方向。"
        canonicalPath="/quiz"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "神經全景測驗｜你的神經系統需要什麼？",
          url: "https://www.solisforest.com/quiz",
          inLanguage: "zh-Hant",
          isPartOf: { "@type": "WebSite", name: "煦日之森 Solis Atelier", url: "https://www.solisforest.com" },
          about: { "@type": "Thing", name: "神經系統與身心狀態自我覺察" },
        }}
      />
      <div className="container-brand px-4 py-8">
        <div className="text-center mb-8 max-w-2xl mx-auto">
          <h1 className="font-serif-tc text-3xl md:text-4xl font-semibold text-foreground mb-2">神經全景測驗｜你的神經系統需要什麼？</h1>
          <p className="heading-en text-sm text-muted-foreground tracking-wider">Nervous System Self-Check</p>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            花 3 分鐘，透視當下的自律神經狀態（戰逃/凍結/安全）。我們將為你精準配對最適合的調節練習，找到專屬的放鬆方向。
          </p>
        </div>

        <iframe
          ref={iframeRef}
          src="/nervous-system-quiz.html"
          title="神經全景測驗｜你的神經系統需要什麼？"
          width="100%"
          style={{ border: "none", minHeight: 800, height }}
          scrolling="no"
        />

        {completed && (
          <nav aria-label="延伸練習" className="mt-12 pt-8 border-t border-border text-center">
            <h2 className="font-serif-tc text-lg font-semibold text-foreground mb-4">測驗完，下一步</h2>
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-sage">
              <li><Link to="/courses" className="hover:underline">挑選適合你的線上課程</Link></li>
              <li><Link to="/events" className="hover:underline">參加森林療癒活動</Link></li>
              <li><Link to="/blog" className="hover:underline">閱讀神經系統文章</Link></li>
              <li><Link to="/ebooks" className="hover:underline">身心療癒電子書</Link></li>
              <li><Link to="/about" className="hover:underline">認識諮商心理師 Kaia</Link></li>
            </ul>
          </nav>
        )}
      </div>
    </Layout>
  );
};

export default Quiz;
