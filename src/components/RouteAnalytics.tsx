import { useEffect } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_ID = "G-ENHQYN0M2R";

const RouteAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag !== "function") return;
    const page_path = location.pathname + location.search + location.hash;
    window.gtag("config", GA_ID, {
      page_path,
      page_title: document.title,
    });
  }, [location.pathname, location.search, location.hash]);

  // Scroll to hash anchor when navigating (React Router doesn't do this by default)
  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      return;
    }
    const id = decodeURIComponent(location.hash.slice(1));
    // Wait for the page content to render
    const tryScroll = (attempt = 0) => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (attempt < 20) {
        setTimeout(() => tryScroll(attempt + 1), 100);
      }
    };
    tryScroll();
  }, [location.pathname, location.hash]);

  return null;
};

export default RouteAnalytics;
