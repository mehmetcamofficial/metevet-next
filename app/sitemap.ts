import type { MetadataRoute } from "next";
import { blogPosts } from "@/src/data/blog";

const baseUrl = "https://metevet.com.tr";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/tr",
    "/en",
    "/tr/hakkimizda",
    "/en/about",
    "/tr/hizmetler",
    "/en/services",
    "/tr/randevu",
    "/en/appointment",
    "/tr/blog",
    "/en/blog",
    "/tr/iletisim",
    "/en/contact",
  ];

  const staticRoutes: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" || route === "/tr" || route === "/en" ? 1 : 0.8,
  }));

  const articleRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => {
    const alternateLocale = post.locale === "tr" ? "en" : "tr";
    const canonical = `${baseUrl}/${post.locale}/blog/${post.slug}`;
    const alternate = `${baseUrl}/${alternateLocale}/blog/${post.translationSlug}`;

    return {
      url: canonical,
      lastModified: post.updatedAt,
      changeFrequency: "monthly",
      priority: post.featured ? 0.8 : 0.7,
      images: [`${baseUrl}${post.image}`],
      alternates: {
        languages: post.locale === "tr"
          ? { tr: canonical, en: alternate }
          : { tr: alternate, en: canonical },
      },
    };
  });

  return [...staticRoutes, ...articleRoutes];
}
