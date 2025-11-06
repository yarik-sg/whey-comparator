import type { MetadataRoute } from "next";

const DEFAULT_BASE_URL = "https://whey-comparator.example.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? DEFAULT_BASE_URL;
  const now = new Date();

  const staticRoutes: Array<MetadataRoute.Sitemap[number]> = [
    "",
    "/products",
    "/comparison",
    "/alerts",
    "/gyms",
    "/favoris",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: path === "" ? 1 : 0.7,
  }));

  return staticRoutes;
}
