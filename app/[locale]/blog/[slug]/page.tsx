import { Navbar } from "@/src/components/layout/navbar";
import { Footer } from "@/src/components/layout/footer";
import { SkipLink } from "@/src/components/shared/skip-link";
import { Breadcrumbs } from "@/src/components/shared/breadcrumbs";
import { getBlogPostBySlug, getRelatedPosts } from "@/src/data/blog";
import { getDictionary, isLocale } from "@/src/lib/i18n";
import { buildMetadata } from "@/src/lib/metadata";
import type { Locale } from "@/types";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const resolvedLocale = locale as Locale;
  const post = getBlogPostBySlug(slug, resolvedLocale);
  if (!post) notFound();

  return buildMetadata({
    locale: resolvedLocale,
    title: `${post.title} | MeteVet`,
    description: post.description,
    path: resolvedLocale === "tr" ? `/blog/${slug}` : `/blog/${slug}`,
    image: "/images/onur-metehan-cakir.jpg",
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const resolvedLocale = locale as Locale;
  const dict = getDictionary(resolvedLocale);
  const post = getBlogPostBySlug(slug, resolvedLocale);
  if (!post) notFound();
  const related = getRelatedPosts(slug, resolvedLocale);

  return (
    <div className="min-h-screen bg-[#F4F0E8] text-[#0D2922]">
      <SkipLink />
      <Navbar locale={resolvedLocale} />
      <main id="main-content" className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Breadcrumbs items={[{ label: resolvedLocale === "tr" ? "Ana Sayfa" : "Home", href: resolvedLocale === "tr" ? "/tr" : "/en" }, { label: dict.blogPage.title, href: resolvedLocale === "tr" ? "/tr/blog" : "/en/blog" }, { label: post.title }]} />
          <article className="mt-8 rounded-[2rem] border border-[#0D2922]/10 bg-white p-8 shadow-[0_20px_60px_rgba(13,41,34,0.08)] lg:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#CDA85F]">{post.category}</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#0D2922] sm:text-4xl">{post.title}</h1>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#687A75]">
              <span>{post.author}</span>
              <span>{post.publishedAt}</span>
              <span>{post.readingTime}</span>
            </div>
            <div className="mt-8 space-y-6 text-lg leading-8 text-[#687A75]">
              {post.content.map((section) => section.type === "heading" ? <h2 key={section.value} className="text-2xl font-semibold text-[#0D2922]">{section.value}</h2> : <p key={section.value}>{section.value}</p>)}
            </div>
            <div className="mt-10 rounded-[1.3rem] border border-[#0D2922]/10 bg-[#F4F0E8] p-6 text-sm leading-8 text-[#687A75]">
              {dict.common.disclaimer}
            </div>
          </article>

          <div className="mt-10">
            <h2 className="text-2xl font-semibold text-[#0D2922]">{resolvedLocale === "tr" ? "İlgili Yazılar" : "Related Articles"}</h2>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {related.map((item) => (
                <Link key={item.slug} href={resolvedLocale === "tr" ? `/tr/blog/${item.slug}` : `/en/blog/${item.slug}`} className="rounded-[1.5rem] border border-[#0D2922]/10 bg-white p-6 shadow-[0_15px_40px_rgba(13,41,34,0.08)]">
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#CDA85F]">{item.category}</p>
                  <h3 className="mt-3 text-xl font-semibold text-[#0D2922]">{item.title}</h3>
                  <p className="mt-3 text-base leading-8 text-[#687A75]">{item.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer locale={resolvedLocale} />
    </div>
  );
}
