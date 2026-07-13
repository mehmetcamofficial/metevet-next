"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { BlogPost, Locale } from "@/types";
import { ArticleCard } from "@/src/components/blog/article-card";

export function BlogExplorer({
  posts,
  categories,
  locale,
}: {
  posts: BlogPost[];
  categories: string[];
  locale: Locale;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const allLabel = locale === "tr" ? "Tümü" : "All";

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(locale === "tr" ? "tr-TR" : "en-US");

    return posts.filter((post) => {
      const matchesCategory = category === "all" || post.category === category;
      const searchable = [post.title, post.description, post.category, ...post.tags, ...post.keywords]
        .join(" ")
        .toLocaleLowerCase(locale === "tr" ? "tr-TR" : "en-US");
      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [category, locale, posts, query]);

  return (
    <section aria-labelledby="all-articles-heading" className="mt-14">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#CDA85F]">{locale === "tr" ? "Bilgi Arşivi" : "Knowledge Library"}</p>
          <h2 id="all-articles-heading" className="mt-3 text-3xl font-semibold tracking-tight text-[#0D2922]">{locale === "tr" ? "Tüm Yazılar" : "All Articles"}</h2>
        </div>
        <label className="relative block w-full lg:max-w-sm">
          <span className="sr-only">{locale === "tr" ? "Yazılarda ara" : "Search articles"}</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#687A75]" size={18} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={locale === "tr" ? "Yazılarda ara..." : "Search articles..."}
            className="w-full rounded-full border border-[#0D2922]/15 bg-white py-3 pl-11 pr-4 text-sm text-[#0D2922] outline-none transition placeholder:text-[#687A75] focus:border-[#123A30] focus:ring-2 focus:ring-[#123A30]/15"
          />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label={locale === "tr" ? "Yazı kategorileri" : "Article categories"}>
        {["all", ...categories].map((item) => {
          const active = category === item;
          return (
            <button
              key={item}
              type="button"
              aria-pressed={active}
              onClick={() => setCategory(item)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30 ${
                active ? "border-[#123A30] bg-[#123A30] text-white" : "border-[#0D2922]/10 bg-white text-[#0D2922] hover:border-[#123A30]/40"
              }`}
            >
              {item === "all" ? allLabel : item}
            </button>
          );
        })}
      </div>

      <p className="mt-5 text-sm text-[#687A75]" aria-live="polite">
        {locale === "tr" ? `${filteredPosts.length} yazı gösteriliyor` : `Showing ${filteredPosts.length} articles`}
      </p>

      {filteredPosts.length > 0 ? (
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredPosts.map((post) => <ArticleCard key={post.slug} post={post} locale={locale} />)}
        </div>
      ) : (
        <div className="mt-6 rounded-[1.6rem] border border-dashed border-[#123A30]/25 bg-white p-10 text-center">
          <h3 className="text-xl font-semibold text-[#0D2922]">{locale === "tr" ? "Eşleşen yazı bulunamadı" : "No matching articles found"}</h3>
          <p className="mt-3 text-sm leading-7 text-[#687A75]">{locale === "tr" ? "Arama ifadenizi veya seçili kategoriyi değiştirerek tekrar deneyin." : "Try changing your search term or selected category."}</p>
        </div>
      )}
    </section>
  );
}
