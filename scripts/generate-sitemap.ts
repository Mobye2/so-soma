// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
// Ensures every URL uses the canonical www host for SEO consistency.

import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://www.solisforest.com";
const today = new Date().toISOString().slice(0, 10);

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: string;
}

// Public, indexable static routes (mirror src/App.tsx).
// Excludes /auth, /admin, /member, /checkout, /order-success, /unsubscribe (already blocked in robots.txt).
const staticEntries: SitemapEntry[] = [
  { path: "/", lastmod: today, changefreq: "weekly", priority: "1.0" },
  { path: "/about", lastmod: today, changefreq: "monthly", priority: "0.8" },
  { path: "/forest-therapy", lastmod: today, changefreq: "monthly", priority: "0.9" },
  { path: "/mindful-yin-yoga", lastmod: today, changefreq: "monthly", priority: "0.9" },
  { path: "/yin-yoga-free-trial", lastmod: today, changefreq: "monthly", priority: "0.8" },
  { path: "/self-care", lastmod: today, changefreq: "monthly", priority: "0.8" },
  { path: "/courses", lastmod: today, changefreq: "weekly", priority: "0.9" },
  { path: "/events", lastmod: today, changefreq: "weekly", priority: "0.9" },
  { path: "/ebooks", lastmod: today, changefreq: "monthly", priority: "0.7" },
  { path: "/shop", lastmod: today, changefreq: "weekly", priority: "0.7" },
  { path: "/quiz", lastmod: today, changefreq: "monthly", priority: "0.8" },
  { path: "/blog", lastmod: today, changefreq: "weekly", priority: "0.7" },
  { path: "/blog/category/nervous-system", lastmod: today, changefreq: "weekly", priority: "0.7" },
  { path: "/blog/category/yin-yoga", lastmod: today, changefreq: "weekly", priority: "0.7" },
  { path: "/blog/category/forest-therapy", lastmod: today, changefreq: "weekly", priority: "0.7" },
  { path: "/blog/category/self-care", lastmod: today, changefreq: "weekly", priority: "0.7" },
  { path: "/contact", lastmod: today, changefreq: "monthly", priority: "0.6" },
];

async function fetchBlogEntries(): Promise<SitemapEntry[]> {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn("[sitemap] Supabase env not available — skipping blog entries.");
    return [];
  }

  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from("blog_posts")
      .select("slug, updated_at")
      .eq("published", true)
      .lte("published_at", new Date().toISOString());

    if (error) {
      console.warn("[sitemap] Failed to load blog posts:", error.message);
      return [];
    }

    return (data ?? []).map((row) => ({
      path: `/blog/${row.slug}`,
      lastmod: row.updated_at ? new Date(row.updated_at).toISOString().slice(0, 10) : today,
      changefreq: "monthly",
      priority: "0.6",
    }));
  } catch (err) {
    console.warn("[sitemap] Unexpected error loading blog posts:", err);
    return [];
  }
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
    ``,
  ].join("\n");
}

async function main() {
  const blogEntries = await fetchBlogEntries();
  const entries = [...staticEntries, ...blogEntries];
  writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
  console.log(`sitemap.xml written (${entries.length} entries)`);
}

main();
