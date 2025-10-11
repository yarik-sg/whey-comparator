import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/QueryProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BrandHeader } from "@/components/BrandHeader";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";

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
  metadataBase: new URL("https://fitidion.io"),
  title: {
    default: "FitIdion — Plateforme du Fitness Intelligent",
    template: "%s · FitIdion",
  },
  description:
    "FitIdion — Plateforme du Fitness Intelligent. Comparez les meilleures offres fitness, produits et salles de sport en un clic.",
  keywords: [
    "FitIdion",
    "comparateur fitness",
    "prix whey",
    "suivi prix sport",
    "alertes nutrition",
  ],
  openGraph: {
    title: "FitIdion — Plateforme du Fitness Intelligent",
    description:
      "Comparez les meilleures offres fitness, produits et salles de sport en un clic grâce à FitIdion.",
    siteName: "FitIdion",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FitIdion — Plateforme du Fitness Intelligent",
    description:
      "Comparez les meilleures offres fitness, produits et salles de sport en un clic.",
  },
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
