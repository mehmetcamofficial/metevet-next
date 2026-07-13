import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getDictionary } from "@/src/lib/i18n";
import { getBlogPosts } from "@/src/data/blog";
import { getBlogRoute, getRoutePath } from "@/src/lib/routes";
import type { Locale } from "@/types";
import { Reveal } from "@/src/components/ui/reveal";

export function BlogPreview({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const posts = getBlogPosts(locale).slice(0, 3);

  return (
    <section className="px-6 py-20 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#CDA85F]">{dict.home.blog.title}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#0D2922] sm:text-4xl">{dict.home.blog.description}</h2>
          </div>
          <Link href={getRoutePath("blog", locale)} className="inline-flex items-center gap-2 text-sm font-semibold text-[#123A30] transition hover:text-[#0D2922]">
            {dict.home.blog.viewAll}
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {posts.map((post, index) => (
            <Reveal key={post.slug} delay={index * 0.04}>
              <article className="group h-full rounded-[1.7rem] border border-[#0D2922]/10 bg-white p-7 shadow-[0_15px_40px_rgba(13,41,34,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(13,41,34,0.12)]">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#CDA85F]">{post.category}</p>
                <h3 className="mt-4 text-xl font-semibold text-[#0D2922]">{post.title}</h3>
                <p className="mt-4 text-base leading-8 text-[#687A75]">{post.description}</p>
                <div className="mt-6 flex items-center justify-between text-sm text-[#687A75]">
                  <span>{post.readingTime}</span>
                  <Link href={getBlogRoute(locale, post.slug)} className="font-semibold text-[#123A30] transition group-hover:gap-2">
                    {dict.common.readMore}
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
