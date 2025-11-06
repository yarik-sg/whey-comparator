import type { Metadata } from "next";

const DEFAULT_SITE_URL = "https://fitidion.com";
const SITE_NAME = "FitIdion";
const SITE_TAGLINE = "FitIdion — Comparez, progressez, performez dans le fitness.";
const SITE_DESCRIPTION = `${SITE_TAGLINE} La plateforme du fitness intelligent : comparez les prix, trouvez des salles et activez des alertes personnalisées.`;

export interface MetadataParams {
  title: string;
  description?: string;
  path?: string;
  image?: string;
}

function buildDescription(customDescription?: string) {
  if (!customDescription) {
    return SITE_TAGLINE;
  }

  return `${SITE_TAGLINE} ${customDescription}`;
}

function resolveUrl(path?: string | null) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;
  try {
    if (!path) {
      return new URL(baseUrl).toString();
    }

    return new URL(path, baseUrl).toString();
  } catch (error) {
    return `${baseUrl.replace(/\/$/, "")}${path ?? ""}`;
  }
}

export function createMetadata({
  title,
  description,
  path,
  image = "/FitIdion_Banner.png",
}: MetadataParams): Metadata {
  const url = resolveUrl(path);
  const resolvedDescription = buildDescription(description);

  return {
    title,
    description: resolvedDescription,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description: resolvedDescription,
      type: "website",
      url,
      siteName: SITE_NAME,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} – ${title}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: resolvedDescription,
      images: [image],
    },
  };
}

export const siteMetadata = {
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: resolveUrl(),
};
