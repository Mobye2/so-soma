import { MessageCircle } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const LINE_URL = "https://lin.ee/WJcPZiC";

const FloatingLineButton = () => {
  const handleClick = () => {
    const path =
      typeof window !== "undefined" ? window.location.pathname + window.location.search : "";
    trackEvent("floating_line_click", {
      source_page: path,
      destination: LINE_URL,
    });
  };

  return (
    <a
      href={LINE_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      aria-label="加入 LINE@ 取得免費身心照顧資源"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-[#06C755] text-white shadow-lg hover:opacity-90 active:scale-95 transition-all"
    >
      <MessageCircle className="w-5 h-5" strokeWidth={2.2} />
      <span className="text-sm font-medium">加入 LINE@</span>
    </a>
  );
};

export default FloatingLineButton;
