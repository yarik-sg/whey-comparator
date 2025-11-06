import type { MetadataRoute } from "next";

const DEFAULT_BASE_URL = "https://fitidion.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? DEFAULT_BASE_URL;
  const now = new Date();

  const paths = [
    "",
    "/products",
    "/catalogue",
    "/comparateur",
    "/comparison",
    "/alerts",
    "/analyse",
    "/gyms",
    "/equipements",
    "/programmes",
    "/search",
    "/favoris",
    "/dashboard",
    "/about",
    "/legal",
  ];

  const staticRoutes: Array<MetadataRoute.Sitemap[number]> = paths.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "daily",
    priority: path === "" ? 1 : path === "/legal" ? 0.5 : 0.7,
  }));

  return staticRoutes;
}
