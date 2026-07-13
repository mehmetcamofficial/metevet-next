import Link from "next/link";
import { CalendarDays, Clock, UserRound } from "lucide-react";
import type { BlogPost, Locale } from "@/types";
import { getBlogRoute } from "@/src/lib/routes";
import { ArticleImage } from "@/src/components/blog/article-image";

export function formatBlogDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function ArticleCard({ post, locale }: { post: BlogPost; locale: Locale }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-[#0D2922]/10 bg-white shadow-[0_12px_35px_rgba(13,41,34,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(13,41,34,0.1)]">
      <Link href={getBlogRoute(locale, post.slug)} className="relative block aspect-[16/10] overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#123A30]">
        <ArticleImage src={post.image} alt={post.imageAlt} sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" />
      </Link>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#CDA85F]">{post.category}</p>
        <h2 className="mt-3 text-xl font-semibold leading-snug text-[#0D2922]">
          <Link href={getBlogRoute(locale, post.slug)} className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30">
            {post.title}
          </Link>
        </h2>
        <p className="mt-3 flex-1 text-sm leading-7 text-[#687A75]">{post.description}</p>
        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-[#0D2922]/10 pt-4 text-xs text-[#687A75]">
          <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} />{formatBlogDate(post.publishedAt, locale)}</span>
          <span className="inline-flex items-center gap-1.5"><Clock size={14} />{post.readingTime}</span>
          <span className="inline-flex items-center gap-1.5"><UserRound size={14} />{post.author}</span>
        </div>
        <Link href={getBlogRoute(locale, post.slug)} className="mt-5 w-fit rounded-sm text-sm font-semibold text-[#123A30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30">
          {locale === "tr" ? "Devamını Oku" : "Read Article"}
        </Link>
      </div>
    </article>
  );
}
