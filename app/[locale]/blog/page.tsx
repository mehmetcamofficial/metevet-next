import { Navbar } from "@/src/components/layout/navbar";
import { Footer } from "@/src/components/layout/footer";
import { SkipLink } from "@/src/components/shared/skip-link";
import { Breadcrumbs } from "@/src/components/shared/breadcrumbs";
import { getBlogPosts } from "@/src/data/blog";
import { getDictionary, isLocale } from "@/src/lib/i18n";
import { buildMetadata } from "@/src/lib/metadata";
import type { Locale } from "@/types";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const resolvedLocale = locale as Locale;
  const dict = getDictionary(resolvedLocale);

  return buildMetadata({
    locale: resolvedLocale,
    title: `${dict.blogPage.title} | MeteVet`,
    description: dict.blogPage.description,
    path: resolvedLocale === "tr" ? "/blog" : "/blog",
  });
}

export default async function BlogListingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const resolvedLocale = locale as Locale;
  const dict = getDictionary(resolvedLocale);
  const posts = getBlogPosts(resolvedLocale);

  return (
    <div className="min-h-screen bg-[#F4F0E8] text-[#0D2922]">
      <SkipLink />
      <Navbar locale={resolvedLocale} />
      <main id="main-content" className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Breadcrumbs items={[{ label: resolvedLocale === "tr" ? "Ana Sayfa" : "Home", href: resolvedLocale === "tr" ? "/tr" : "/en" }, { label: dict.blogPage.title }]} />
          <div className="mt-8 rounded-[2rem] border border-[#0D2922]/10 bg-white p-8 shadow-[0_20px_60px_rgba(13,41,34,0.08)] lg:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#CDA85F]">{dict.blogPage.title}</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#0D2922] sm:text-4xl">{dict.blogPage.description}</h1>
            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              {posts.map((post) => (
                <article key={post.slug} className="rounded-[1.5rem] border border-[#0D2922]/10 bg-[#F4F0E8] p-7">
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#CDA85F]">{post.category}</p>
                  <h2 className="mt-4 text-xl font-semibold text-[#0D2922]">{post.title}</h2>
                  <p className="mt-4 text-base leading-8 text-[#687A75]">{post.description}</p>
                  <div className="mt-6 flex items-center justify-between text-sm text-[#687A75]">
                    <span>{post.readingTime}</span>
                    <Link href={resolvedLocale === "tr" ? `/tr/blog/${post.slug}` : `/en/blog/${post.slug}`} className="font-semibold text-[#123A30]">{dict.common.readMore}</Link>
                  </div>
                </article>
              ))}
            </div>
            <p className="mt-8 text-sm leading-8 text-[#687A75]">{dict.common.disclaimer}</p>
          </div>
        </div>
      </main>
      <Footer locale={resolvedLocale} />
    </div>
  );
}
