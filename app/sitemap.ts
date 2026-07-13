import type { MetadataRoute } from "next";

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

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" || route === "/tr" || route === "/en" ? 1 : 0.8,
  }));
}
