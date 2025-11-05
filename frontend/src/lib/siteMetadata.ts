import type { Metadata } from "next";

const DEFAULT_SITE_URL = "https://fitidion.com";
const SITE_NAME = "FitIdion";
const SITE_DESCRIPTION =
  "La plateforme du fitness intelligent : comparez les prix, trouvez des salles et activez des alertes personnalisées.";

export interface MetadataParams {
  title: string;
  description?: string;
  path?: string;
  image?: string;
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
  description = SITE_DESCRIPTION,
  path,
  image = "/FitIdion_Banner.png",
}: MetadataParams): Metadata {
  const url = resolveUrl(path);

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
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
      description,
      images: [image],
    },
  };
}

export const siteMetadata = {
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: resolveUrl(),
};
