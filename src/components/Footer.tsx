import { Link } from "react-router-dom";
import { Instagram, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-accent text-accent-foreground">
      <div className="container-brand section-padding">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {/* Left: Logo + Tagline */}
          <div className="space-y-4">
            <div>
              <h3 className="font-serif-tc text-xl font-semibold">煦日之森｜身心學堂</h3>
              <p className="heading-en text-sm text-accent-foreground/70 mt-1">Solis Atelier — Forest & Somatic Arts</p>
            </div>
            <p className="text-sm text-accent-foreground/80 leading-relaxed">
              回到身體，回到自然，回到你自己
            </p>
          </div>

          {/* Center: Quick Links */}
          <div className="space-y-4">
            <h4 className="font-serif-tc text-sm font-semibold tracking-wide uppercase text-accent-foreground/60">
              快速連結
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "關於我們", path: "/about" },
                { label: "森林療癒", path: "/forest-therapy" },
                { label: "線上課程", path: "/courses" },
                { label: "實體活動", path: "/events" },
                { label: "電子書", path: "/ebooks" },
                { label: "身心測驗", path: "/quiz" },
                { label: "文章", path: "/blog" },
                { label: "聯絡我們", path: "/about#contact" },
              ].map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-sm text-accent-foreground/70 hover:text-accent-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: Social + Contact */}
          <div className="space-y-4">
            <h4 className="font-serif-tc text-sm font-semibold tracking-wide uppercase text-accent-foreground/60">
              聯繫我們
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-accent-foreground/70">
                <Instagram className="w-4 h-4" />
                <span>煦日之森 官方 IG：敬請期待 🌿</span>
              </div>
              <a
                href="https://instagram.com/for_rest_journey"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-accent-foreground/70 hover:text-accent-foreground transition-colors"
              >
                <Instagram className="w-4 h-4" />
                <span>Kaia 個人創作：@for_rest_journey</span>
              </a>
              <div className="flex items-center gap-2 text-accent-foreground/70">
                <Mail className="w-4 h-4" />
                <span>營運聯繫：solissomatic@gmail.com</span>
              </div>
            </div>

            {/* Newsletter mini signup */}
            <div className="mt-4">
              <p className="text-xs text-accent-foreground/50 mb-2">訂閱電子報</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 px-3 py-2 text-xs rounded-md bg-accent-foreground/10 border border-accent-foreground/20 text-accent-foreground placeholder:text-accent-foreground/40 focus:outline-none focus:ring-1 focus:ring-sage"
                />
                <button className="px-3 py-2 text-xs rounded-md bg-sage text-primary-foreground hover:bg-sage/90 transition-colors">
                  訂閱
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-accent-foreground/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-accent-foreground/50">
            <p className="font-medium whitespace-pre-line">
              © 2025 煦日之森 Solis Forest. All rights reserved.
              <br />
              平台創辦人：Owen ｜ 網站營運：本澈行銷團隊
              <br />
              <br />
            </p>
            <p className="text-center max-w-xl">
              課程內容由煦日之森與駐站心理師 Kaia 共同設計，僅供教育與自我照顧參考，不替代專業醫療或心理諮詢建議。
            </p>
            <div className="flex gap-4">
              <Link to="/privacy" className="hover:text-accent-foreground transition-colors">隱私政策</Link>
              <Link to="/terms" className="hover:text-accent-foreground transition-colors">服務條款</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
