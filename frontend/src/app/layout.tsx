import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "@/styles/fitidion-theme.css";
import "./globals.css";
import { QueryProvider } from "@/components/QueryProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BrandHeader } from "@/components/BrandHeader";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";
import { siteMetadata } from "@/lib/siteMetadata";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteMetadata.url),
  title: {
    default: "FitIdion — La plateforme du Fitness Intelligent",
    template: "%s — FitIdion",
  },
  description: siteMetadata.description,
  keywords: [
    "comparateur fitness",
    "compléments sportifs",
    "prix protéines",
    "alertes prix",
    "salles de sport",
  ],
  applicationName: siteMetadata.name,
  authors: [{ name: siteMetadata.name }],
  openGraph: {
    title: "FitIdion — La plateforme du Fitness Intelligent",
    description: siteMetadata.description,
    url: siteMetadata.url,
    siteName: siteMetadata.name,
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FitIdion — La plateforme du Fitness Intelligent",
    description: siteMetadata.description,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF6600",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${poppins.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-transparent font-sans antialiased">
        <ThemeProvider>
          <QueryProvider>
            <div className="flex min-h-screen flex-col">
              <BrandHeader />
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </div>
            <Toaster
              richColors
              position="top-right"
              toastOptions={{ style: { borderRadius: "9999px", fontFamily: "var(--font-poppins)" } }}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
