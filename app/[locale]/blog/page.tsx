import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, UserRound } from "lucide-react";
import { notFound } from "next/navigation";
import { BlogExplorer } from "@/src/components/blog/blog-explorer";
import { formatBlogDate } from "@/src/components/blog/article-card";
import { Breadcrumbs } from "@/src/components/shared/breadcrumbs";
import { Footer } from "@/src/components/layout/footer";
import { Navbar } from "@/src/components/layout/navbar";
import { SkipLink } from "@/src/components/shared/skip-link";
import { blogCategories, getBlogPosts, getFeaturedPost } from "@/src/data/blog";
import { isLocale } from "@/src/lib/i18n";
import { getBlogRoute, getRoutePath } from "@/src/lib/routes";
import type { Locale } from "@/types";

const siteUrl = "https://metevet.com.tr";

type BlogPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const resolvedLocale = locale as Locale;
  const isTurkish = resolvedLocale === "tr";
  const title = isTurkish ? "Veteriner Bilgi Merkezi | MeteVet Blog" : "Veterinary Knowledge Center | MeteVet Blog";
  const description = isTurkish
    ? "Kedi ve köpek sağlığı, koruyucu hekimlik, beslenme, bakım ve acil durum işaretleri hakkında veteriner hekim tarafından hazırlanan sorumlu bilgiler."
    : "Responsible veterinarian-authored guidance on cat and dog health, preventive care, nutrition, everyday care, and emergency warning signs.";
  const canonical = `${siteUrl}/${resolvedLocale}/blog`;
  const image = "/images/blog/cat-vaccination.svg";

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    keywords: isTurkish
      ? ["veteriner blog", "kedi sağlığı", "köpek sağlığı", "koruyucu hekimlik", "Kuşadası veteriner"]
      : ["veterinary blog", "cat health", "dog health", "preventive care", "veterinarian in Kuşadası"],
    alternates: {
      canonical,
      languages: { tr: `${siteUrl}/tr/blog`, en: `${siteUrl}/en/blog` },
    },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      siteName: "MeteVet Veteriner Kliniği",
      locale: isTurkish ? "tr_TR" : "en_US",
      images: [{ url: image, width: 1200, height: 675, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function BlogListingPage({ params }: BlogPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const resolvedLocale = locale as Locale;
  const isTurkish = resolvedLocale === "tr";
  const posts = getBlogPosts(resolvedLocale);
  const featured = getFeaturedPost(resolvedLocale);
  if (!featured) notFound();

  return (
    <div className="min-h-screen bg-[#F4F0E8] text-[#0D2922]">
      <SkipLink />
      <Navbar locale={resolvedLocale} />
      <main id="main-content" className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Breadcrumbs items={[{ label: isTurkish ? "Ana Sayfa" : "Home", href: getRoutePath("home", resolvedLocale) }, { label: "Blog" }]} />

          <header className="mt-8 overflow-hidden rounded-[2rem] border border-[#0D2922]/10 bg-[#123A30] px-8 py-12 text-white shadow-[0_20px_60px_rgba(13,41,34,0.12)] sm:px-10 lg:px-14 lg:py-16">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#CDA85F]">MeteVet Blog</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">
              {isTurkish ? "Veteriner Bilgi Merkezi" : "Veterinary Knowledge Center"}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#DDE9E3]">
              {isTurkish
                ? "Patili dostlarınızın sağlığı için güvenilir, anlaşılır ve veteriner muayenesinin önemini merkeze alan bilgiler."
                : "Clear, responsible guidance for your companion animal's health, always centered on the importance of veterinary examination."}
            </p>
          </header>

          <section aria-labelledby="featured-heading" className="mt-10 overflow-hidden rounded-[2rem] border border-[#0D2922]/10 bg-white shadow-[0_20px_60px_rgba(13,41,34,0.08)]">
            <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
              <Link href={getBlogRoute(resolvedLocale, featured.slug)} className="relative min-h-72 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#123A30] lg:min-h-[430px]">
                <Image src={featured.image} alt={featured.imageAlt} fill priority sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" />
              </Link>
              <div className="flex flex-col justify-center p-8 lg:p-10">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#CDA85F]">{isTurkish ? "Öne Çıkan Yazı" : "Featured Article"}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-[#123A30]">{featured.category}</p>
                <h2 id="featured-heading" className="mt-3 text-3xl font-semibold leading-tight text-[#0D2922]">{featured.title}</h2>
                <p className="mt-4 text-base leading-8 text-[#687A75]">{featured.description}</p>
                <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#687A75]">
                  <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} />{formatBlogDate(featured.publishedAt, resolvedLocale)}</span>
                  <span className="inline-flex items-center gap-1.5"><Clock size={15} />{featured.readingTime}</span>
                  <span className="inline-flex items-center gap-1.5"><UserRound size={15} />{featured.author}</span>
                </div>
                <Link href={getBlogRoute(resolvedLocale, featured.slug)} className="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-[#123A30] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123A30]/30">
                  {isTurkish ? "Devamını Oku" : "Read Article"}<ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </section>

          <BlogExplorer posts={posts.filter((post) => post.slug !== featured.slug)} categories={blogCategories[resolvedLocale]} locale={resolvedLocale} />

          <aside className="mt-12 rounded-[1.5rem] border border-[#0D2922]/10 bg-[#DDE9E3] p-6 text-sm leading-7 text-[#0D2922]">
            <strong>{isTurkish ? "Bilgilendirme:" : "Information notice:"}</strong>{" "}
            {isTurkish
              ? "Bu blog genel bilgilendirme amacı taşır. Çevrimiçi bilgiler veteriner hekim muayenesinin, tanının veya bireysel tedavi planının yerini tutmaz. Hayvanınızın sağlığıyla ilgili endişeniz varsa veteriner hekime başvurun."
              : "This blog provides general information. Online guidance does not replace a veterinary examination, diagnosis, or individualized treatment plan. Contact a veterinarian if you are concerned about your animal's health."}
          </aside>
        </div>
      </main>
      <Footer locale={resolvedLocale} />
    </div>
  );
}
