import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ShoppingCart, User, LogOut, Settings, UserCircle, ChevronDown, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";

type FeaturedArticle = { slug: string; title: string; category: string };

type MainLink = { label: string; path: string; description?: string };

type MenuGroup = {
  label: string;
  path: string; // landing for the section (used on mobile / click)
  simple?: boolean; // if true, render as plain link with no dropdown
  mainLinks?: MainLink[];
  featuredCategories?: string[];
};

const menuGroups: MenuGroup[] = [
  { label: "關於我們", path: "/about", simple: true },
  { label: "療癒體驗", path: "/courses", simple: true },
  { label: "森林療癒", path: "/forest-therapy", simple: true },
  { label: "正念陰瑜珈", path: "/mindful-yin-yoga", simple: true },
  { label: "自我照顧", path: "/self-care", simple: true },
  { label: "課程總覽", path: "/shop", simple: true },
  { label: "部落格", path: "/blog", simple: true },
];



const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [featured, setFeatured] = useState<FeaturedArticle[]>([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { totalItems, setIsOpen: setCartOpen } = useCart();
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const loading = authLoading || adminLoading;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    supabase
      .from("blog_posts")
      .select("slug,title,category,published_at")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(40)
      .then(({ data }) => {
        if (data) setFeatured(data as FeaturedArticle[]);
      });
  }, []);

  const getFeatured = (categories: string[], limit = 3) =>
    featured.filter((a) => categories.includes(a.category)).slice(0, limit);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="container-brand flex items-center justify-between h-16 md:h-20 px-4 md:px-8">
        <Link to="/" className="flex flex-col leading-tight">
          <span className="font-serif-tc text-lg md:text-xl font-semibold text-foreground tracking-wide">
            煦日之森｜身心學堂
          </span>
          <span className="heading-en text-xs text-muted-foreground tracking-widest">
            Solis Atelier
          </span>
        </Link>

        <div
          className="hidden lg:flex items-center gap-1"
          onMouseLeave={() => setOpenMenu(null)}
        >
          {menuGroups.map((group) => {
            const mainLinks = group.mainLinks ?? [];
            const isActive =
              group.path === location.pathname ||
              mainLinks.some((l) => l.path.split("#")[0] === location.pathname);
            const isOpenNow = openMenu === group.label;

            if (group.simple) {
              return (
                <Link
                  key={group.label}
                  to={group.path}
                  onMouseEnter={() => setOpenMenu(null)}
                  className={`relative px-3 py-2 text-sm font-sans-tc rounded-md transition-colors hover:bg-sage/15 hover:text-secondary after:content-[''] after:absolute after:left-3 after:right-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-secondary after:transition-transform after:origin-center ${
                    isActive
                      ? "text-secondary font-semibold after:scale-x-100"
                      : "text-foreground after:scale-x-0 hover:after:scale-x-100"
                  }`}
                >
                  {group.label}
                </Link>
              );
            }

            return (
              <div
                key={group.label}
                className="relative"
                onMouseEnter={() => setOpenMenu(group.label)}
              >
                <Link
                  to={group.path}
                  className={`flex items-center gap-1 px-3 py-2 text-sm font-sans-tc transition-colors hover:text-secondary ${
                    isActive ? "text-secondary font-medium" : "text-muted-foreground"
                  }`}
                >
                  {group.label}
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </Link>

                {isOpenNow && (
                  <div className="absolute left-0 top-full pt-2 z-50">
                    <div className="w-[560px] bg-background border border-border rounded-md shadow-xl grid grid-cols-5 overflow-hidden animate-fade-in">
                      {/* Left: main links */}
                      <div className="col-span-2 bg-muted/40 p-5 border-r border-border">
                        <p className="text-[11px] tracking-widest text-muted-foreground uppercase mb-3">
                          主要連結
                        </p>
                        <ul className="space-y-1">
                          {mainLinks.map((link) => (
                            <li key={link.path + link.label}>
                              <Link
                                to={link.path}
                                onClick={() => setOpenMenu(null)}
                                className="block p-2 rounded-md hover:bg-background transition-colors group"
                              >
                                <div className="text-sm font-sans-tc text-foreground group-hover:text-secondary">
                                  {link.label}
                                </div>
                                {link.description && (
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {link.description}
                                  </div>
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Right: featured articles */}
                      <div className="col-span-3 p-5">
                        <p className="text-[11px] tracking-widest text-muted-foreground uppercase mb-3">
                          精選文章
                        </p>
                        <ul className="space-y-2">
                          {getFeatured(group.featuredCategories ?? []).map((a) => (
                            <li key={a.slug}>
                              <Link
                                to={`/blog/${a.slug}`}
                                onClick={() => setOpenMenu(null)}
                                className="block p-2 rounded-md hover:bg-muted/60 transition-colors"
                              >
                                <div className="text-sm font-sans-tc text-foreground leading-snug line-clamp-2">
                                  {a.title}
                                </div>
                              </Link>
                            </li>
                          ))}
                          {getFeatured(group.featuredCategories ?? []).length === 0 && (
                            <li className="text-xs text-muted-foreground p-2">
                              文章準備中
                            </li>
                          )}
                        </ul>
                        <Link
                          to="/blog"
                          onClick={() => setOpenMenu(null)}
                          className="inline-block mt-3 text-xs text-secondary hover:underline font-sans-tc"
                        >
                          看全部文章 →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <button
            className="p-2 text-muted-foreground hover:text-foreground transition-colors relative"
            aria-label="購物車"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
          {!loading && (
            <>
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <UserCircle className="w-5 h-5" />
                    <ChevronDown className={`w-3 h-3 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-44 bg-background border border-border rounded-md shadow-lg z-50 py-1">
                      <Link to="/member" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted">
                        <UserCircle className="w-4 h-4" /> 會員中心
                      </Link>
                      <Link to="/member/purchases" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted">
                        <BookOpen className="w-4 h-4" /> 學習資源
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted">
                          <Settings className="w-4 h-4" /> 後台管理
                        </Link>
                      )}
                      <div className="border-t border-border my-1" />
                      <button onClick={() => { signOut(); setUserMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                        <LogOut className="w-4 h-4" /> 登出
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Button asChild variant="outline" size="sm">
                  <Link to="/auth">
                    <User className="w-4 h-4 mr-1" />
                    登入 / 註冊
                  </Link>
                </Button>
              )}
            </>
          )}
          <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-sm px-5">
            <Link to="/yin-yoga-free-trial">免費體驗｜每月一次線上瑜珈</Link>
          </Button>
        </div>

        <div className="flex lg:hidden items-center gap-2">
          <button
            className="p-2 text-muted-foreground hover:text-foreground relative"
            onClick={() => setCartOpen(true)}
            aria-label="購物車"
          >
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
          <button className="p-2 text-foreground" onClick={() => setIsOpen(!isOpen)} aria-label="選單">
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden bg-background border-t border-border animate-fade-in max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="flex flex-col px-4 py-4 gap-1">
            {menuGroups.map((group) => {
              const expanded = mobileExpanded === group.label;
              const mainLinks = group.mainLinks ?? [];
              const featuredList = getFeatured(group.featuredCategories ?? [], 3);

              if (group.simple) {
                return (
                  <Link
                    key={group.label}
                    to={group.path}
                    onClick={() => setIsOpen(false)}
                    className="border-b border-border/50 last:border-0 py-3 px-2 text-sm font-sans-tc text-foreground"
                  >
                    {group.label}
                  </Link>
                );
              }

              return (
                <div key={group.label} className="border-b border-border/50 last:border-0">
                  <button
                    onClick={() => setMobileExpanded(expanded ? null : group.label)}
                    className="w-full flex items-center justify-between py-3 px-2 text-sm font-sans-tc text-foreground"
                  >
                    {group.label}
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                    />
                  </button>
                  {expanded && (
                    <div className="pb-3 pl-2 space-y-2">
                      <div>
                        <p className="text-[10px] tracking-widest text-muted-foreground uppercase mb-1">
                          主要連結
                        </p>
                        {mainLinks.map((link) => (
                          <Link
                            key={link.path + link.label}
                            to={link.path}
                            onClick={() => setIsOpen(false)}
                            className="block py-2 px-2 text-sm text-muted-foreground hover:text-secondary"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                      {featuredList.length > 0 && (
                        <div>
                          <p className="text-[10px] tracking-widest text-muted-foreground uppercase mb-1">
                            精選文章
                          </p>
                          {featuredList.map((a) => (
                            <Link
                              key={a.slug}
                              to={`/blog/${a.slug}`}
                              onClick={() => setIsOpen(false)}
                              className="block py-2 px-2 text-xs text-muted-foreground hover:text-secondary line-clamp-2"
                            >
                              {a.title}
                            </Link>
                          ))}
                          <Link
                            to="/blog"
                            onClick={() => setIsOpen(false)}
                            className="block py-2 px-2 text-xs text-secondary hover:underline"
                          >
                            看全部文章 →
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="border-t border-border mt-2 pt-2 flex flex-col gap-1">
              {!loading && (
                <>
                  {user ? (
                    <>
                      <Link
                        to="/member"
                        onClick={() => setIsOpen(false)}
                        className="py-3 px-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-2"
                      >
                        <UserCircle className="w-4 h-4" />
                        會員中心
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsOpen(false)}
                          className="py-3 px-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-2"
                        >
                          <Settings className="w-4 h-4" />
                          後台管理
                        </Link>
                      )}
                      <button
                        onClick={() => { signOut(); setIsOpen(false); }}
                        className="py-3 px-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-2 text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        登出
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/auth"
                      onClick={() => setIsOpen(false)}
                      className="py-3 px-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      登入 / 註冊
                    </Link>
                  )}
                </>
              )}
              <Link
                to="/yin-yoga-free-trial"
                onClick={() => setIsOpen(false)}
                className="py-3 px-2 mt-2 text-sm rounded-md bg-secondary text-secondary-foreground text-center font-medium"
              >
                免費體驗｜每月一次線上瑜珈
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
