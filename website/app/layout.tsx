import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://getcatchy.dev";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Catchy — Console Error Toasts for Chrome",
    template: "%s | Catchy",
  },
  description:
    "Catchy shows JavaScript console errors as in-page toasts. No DevTools needed. Free Chrome extension for developers and QA testers.",
  keywords: [
    "chrome extension",
    "console error",
    "javascript error",
    "error toast",
    "devtools",
    "debugging",
    "developer tool",
    "console.error",
    "error notification",
    "catchy",
  ],
  authors: [{ name: "Ionut", url: SITE_URL }],
  creator: "Ionut",
  publisher: "Ionut",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Catchy",
    title: "Catchy — Never Miss a Console Error Again",
    description:
      "Chrome extension that shows JavaScript console errors as clean, in-page toasts. Free, no config required.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Catchy — Console Error Toasts for Chrome",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Catchy — Console Error Toasts for Chrome",
    description:
      "Chrome extension that shows JavaScript console errors as in-page toasts. Free, no DevTools needed.",
    images: ["/og-image.png"],
    creator: "@ionutcnu",
  },
  icons: {
    icon: [
      { url: "/icon-128.png", sizes: "128x128", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "128x128", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
