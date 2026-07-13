import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Clock, Info, Mail, TriangleAlert, UserRound } from "lucide-react";
import { notFound } from "next/navigation";
import { ArticleCard, formatBlogDate } from "@/src/components/blog/article-card";
import { Breadcrumbs } from "@/src/components/shared/breadcrumbs";
import { Footer } from "@/src/components/layout/footer";
import { Navbar } from "@/src/components/layout/navbar";
import { SkipLink } from "@/src/components/shared/skip-link";
import { blogPosts, getAdjacentPosts, getBlogPostBySlug, getRelatedPosts } from "@/src/data/blog";
import { isLocale } from "@/src/lib/i18n";
import { getBlogRoute, getRoutePath } from "@/src/lib/routes";
import type { Locale } from "@/types";

const siteUrl = "https://metevet.com.tr";

type BlogPostPageProps = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return blogPosts.map((post) => ({ locale: post.locale, slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const resolvedLocale = locale as Locale;
  const post = getBlogPostBySlug(slug, resolvedLocale);
  if (!post) notFound();

  const canonical = `${siteUrl}/${resolvedLocale}/blog/${post.slug}`;
  const alternateLocale = resolvedLocale === "tr" ? "en" : "tr";
  const alternateUrl = `${siteUrl}/${alternateLocale}/blog/${post.translationSlug}`;

  return {
    metadataBase: new URL(siteUrl),
    title: `${post.title} | MeteVet Blog`,
    description: post.description,
    keywords: post.keywords,
    authors: [{ name: post.author }],
    alternates: {
      canonical,
      languages: resolvedLocale === "tr"
        ? { tr: canonical, en: alternateUrl }
        : { tr: alternateUrl, en: canonical },
    },
    openGraph: {
      type: "article",
      url: canonical,
      title: post.title,
      description: post.description,
      siteName: "MeteVet Veteriner Kliniği",
      locale: resolvedLocale === "tr" ? "tr_TR" : "en_US",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author],
      tags: post.tags,
      images: [{ url: post.image, width: 1200, height: 675, alt: post.imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [post.image],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const resolvedLocale = locale as Locale;
  const post = getBlogPostBySlug(slug, resolvedLocale);
  if (!post) notFound();

  const isTurkish = resolvedLocale === "tr";
  const related = getRelatedPosts(post);
  const adjacent = getAdjacentPosts(post);
  const articleUrl = `${siteUrl}/${resolvedLocale}/blog/${post.slug}`;
  const encodedUrl = encodeURIComponent(articleUrl);
  const encodedTitle = encodeURIComponent(post.title);
  const disclaimer = isTurkish
    ? "Bu içerik genel bilgilendirme amacı taşır ve veteriner hekim muayenesinin, tanının veya hayvanınıza özel tedavi planının yerini tutmaz."
    : "This content is for general information and does not replace a veterinary examination, diagnosis, or an individualized treatment plan.";

  const blogPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: `${siteUrl}${post.image}`,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    inLanguage: resolvedLocale === "tr" ? "tr-TR" : "en-US",
    mainEntityOfPage: articleUrl,
    keywords: post.keywords.join(", "),
    author: { "@type": "Person", name: post.author },
    publisher: { "@type": "Organization", name: "MeteVet Veteriner Kliniği", url: siteUrl },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: isTurkish ? "Ana Sayfa" : "Home", item: `${siteUrl}/${resolvedLocale}` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}/${resolvedLocale}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: articleUrl },
    ],
  };

  return (
    <div className="min-h-screen bg-[#F4F0E8] text-[#0D2922]">
      <SkipLink />
      <Navbar locale={resolvedLocale} />
      <main id="main-content" className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Breadcrumbs items={[
            { label: isTurkish ? "Ana Sayfa" : "Home", href: getRoutePath("home", resolvedLocale) },
            { label: "Blog", href: getRoutePath("blog", resolvedLocale) },
            { label: post.title },
          ]} />

          <article className="mt-8">
            <header className="rounded-[2rem] border border-[#0D2922]/10 bg-white p-8 shadow-[0_20px_60px_rgba(13,41,34,0.08)] lg:p-12">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#CDA85F]">{post.category}</p>
              <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-[#0D2922] sm:text-5xl">{post.title}</h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-[#687A75]">{post.description}</p>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 border-t border-[#0D2922]/10 pt-6 text-sm text-[#687A75]">
                <span className="inline-flex items-center gap-1.5"><UserRound size={16} />{post.author}</span>
                <span className="inline-flex items-center gap-1.5"><CalendarDays size={16} />{isTurkish ? "Yayınlandı:" : "Published:"} {formatBlogDate(post.publishedAt, resolvedLocale)}</span>
                <span className="inline-flex items-center gap-1.5"><CalendarDays size={16} />{isTurkish ? "Güncellendi:" : "Updated:"} {formatBlogDate(post.updatedAt, resolvedLocale)}</span>
                <span className="inline-flex items-center gap-1.5"><Clock size={16} />{post.readingTime}</span>
              </div>
            </header>

            <div className="relative mt-8 aspect-[16/8] overflow-hidden rounded-[2rem] border border-[#0D2922]/10 bg-white shadow-[0_20px_60px_rgba(13,41,34,0.08)]">
              <Image src={post.image} alt={post.imageAlt} fill priority sizes="(max-width: 1280px) 100vw, 1280px" className="object-cover" />
            </div>

            <div className="mt-10 grid gap-10 lg:grid-cols-[0.72fr_2fr] lg:items-start">
              <aside className="rounded-[1.5rem] border border-[#0D2922]/10 bg-white p-6 lg:sticky lg:top-28">
                <h2 className="text-sm font-semibold uppercase tracking-[0.28em] text-[#CDA85F]">{isTurkish ? "İçindekiler" : "Table of Contents"}</h2>
                <nav className="mt-5" aria-label={isTurkish ? "Makale içindekiler" : "Article table of contents"}>
                  <ol className="space-y-3 text-sm leading-6 text-[#687A75]">
                    {post.tableOfContents.map((item, index) => (
                      <li key={item.id}>
                        <a href={`#${item.id}`} className="flex gap-3 rounded-sm transition hover:text-[#123A30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30">
                          <span className="font-semibold text-[#CDA85F]">{String(index + 1).padStart(2, "0")}</span>{item.title}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
                <div className="mt-7 border-t border-[#0D2922]/10 pt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#123A30]">{isTurkish ? "Paylaş" : "Share"}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} target="_blank" rel="noopener noreferrer" aria-label={isTurkish ? "LinkedIn'de paylaş" : "Share on LinkedIn"} className="rounded-full border border-[#0D2922]/10 bg-[#F4F0E8] px-3 py-2 text-xs font-semibold text-[#123A30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30">LinkedIn</a>
                    <a href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`} target="_blank" rel="noopener noreferrer" aria-label={isTurkish ? "X'te paylaş" : "Share on X"} className="rounded-full border border-[#0D2922]/10 bg-[#F4F0E8] px-3 py-2 text-xs font-semibold text-[#123A30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30">X</a>
                    <a href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`} aria-label={isTurkish ? "E-posta ile paylaş" : "Share by email"} className="flex items-center rounded-full border border-[#0D2922]/10 bg-[#F4F0E8] px-3 py-2 text-[#123A30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30"><Mail size={15} /></a>
                  </div>
                </div>
              </aside>

              <div className="rounded-[2rem] border border-[#0D2922]/10 bg-white p-8 shadow-[0_20px_60px_rgba(13,41,34,0.06)] lg:p-12">
                <div className="mb-10 flex items-start gap-3 rounded-[1.3rem] border border-[#123A30]/10 bg-[#DDE9E3] p-5 text-sm leading-7 text-[#0D2922]">
                  <Info className="mt-1 shrink-0 text-[#123A30]" size={19} />
                  <p>{disclaimer}</p>
                </div>

                <div className="space-y-10">
                  {post.sections.map((section) => {
                    const highlighted = section.tone && section.tone !== "default";
                    return (
                      <section
                        key={section.id}
                        id={section.id}
                        className={`scroll-mt-28 ${highlighted ? `rounded-[1.4rem] border p-6 ${section.tone === "warning" ? "border-[#CDA85F]/40 bg-[#FFF8E8]" : "border-[#123A30]/10 bg-[#F4F0E8]"}` : ""}`}
                      >
                        <div className="flex items-start gap-3">
                          {section.tone === "warning" ? <TriangleAlert className="mt-1 shrink-0 text-[#9A6D17]" size={21} /> : section.tone === "information" ? <Info className="mt-1 shrink-0 text-[#123A30]" size={21} /> : null}
                          <div>
                            <h2 className="text-2xl font-semibold leading-snug text-[#0D2922] sm:text-3xl">{section.title}</h2>
                            <div className="mt-5 space-y-5 text-[1.05rem] leading-8 text-[#536A64]">
                              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                            </div>
                          </div>
                        </div>
                      </section>
                    );
                  })}
                </div>

                <aside className="mt-12 rounded-[1.4rem] border border-[#CDA85F]/40 bg-[#FFF8E8] p-6">
                  <div className="flex items-start gap-3">
                    <TriangleAlert className="mt-1 shrink-0 text-[#9A6D17]" size={21} />
                    <div>
                      <h2 className="text-xl font-semibold text-[#0D2922]">{isTurkish ? "Ne zaman veteriner hekime başvurmalısınız?" : "When should you contact a veterinarian?"}</h2>
                      <p className="mt-3 text-sm leading-7 text-[#536A64]">
                        {isTurkish
                          ? "Belirtiler şiddetliyse, hızla kötüleşiyorsa veya hayvanınızın genel durumu konusunda endişeniz varsa çevrimiçi bilgiyle yetinmeyin. Gecikmeden veteriner hekimle iletişime geçin."
                          : "If signs are severe, worsening quickly, or you are concerned about your animal's general condition, do not rely on online information alone. Contact a veterinarian promptly."}
                      </p>
                    </div>
                  </div>
                </aside>

                <div className="mt-10 border-t border-[#0D2922]/10 pt-8 text-sm leading-7 text-[#687A75]">
                  <strong className="text-[#0D2922]">{isTurkish ? "Veteriner muayenesi hakkında:" : "About veterinary examination:"}</strong>{" "}{disclaimer}
                </div>
              </div>
            </div>
          </article>

          <nav aria-label={isTurkish ? "Önceki ve sonraki yazı" : "Previous and next article"} className="mt-10 grid gap-4 md:grid-cols-2">
            {adjacent.previous ? (
              <Link href={getBlogRoute(resolvedLocale, adjacent.previous.slug)} className="rounded-[1.4rem] border border-[#0D2922]/10 bg-white p-6 transition hover:border-[#123A30]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#CDA85F]"><ArrowLeft size={14} />{isTurkish ? "Önceki Yazı" : "Previous Article"}</span>
                <span className="mt-3 block font-semibold text-[#0D2922]">{adjacent.previous.title}</span>
              </Link>
            ) : <span />}
            {adjacent.next ? (
              <Link href={getBlogRoute(resolvedLocale, adjacent.next.slug)} className="rounded-[1.4rem] border border-[#0D2922]/10 bg-white p-6 text-right transition hover:border-[#123A30]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#CDA85F]">{isTurkish ? "Sonraki Yazı" : "Next Article"}<ArrowRight size={14} /></span>
                <span className="mt-3 block font-semibold text-[#0D2922]">{adjacent.next.title}</span>
              </Link>
            ) : null}
          </nav>

          <section aria-labelledby="related-heading" className="mt-14">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#CDA85F]">MeteVet Blog</p>
                <h2 id="related-heading" className="mt-3 text-3xl font-semibold text-[#0D2922]">{isTurkish ? "İlgili Yazılar" : "Related Articles"}</h2>
              </div>
              <Link href={getRoutePath("blog", resolvedLocale)} className="inline-flex items-center gap-2 rounded-sm text-sm font-semibold text-[#123A30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30"><ArrowLeft size={16} />{isTurkish ? "Bloga Dön" : "Back to Blog"}</Link>
            </div>
            <div className="mt-7 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {related.map((item) => <ArticleCard key={item.slug} post={item} locale={resolvedLocale} />)}
            </div>
          </section>
        </div>
      </main>
      <Footer locale={resolvedLocale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
