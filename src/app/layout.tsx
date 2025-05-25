import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ThemeProvider from "@/components/ThemeProvider";
import ClientLayout from "@/components/ClientLayout";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Coinbull | Create Solana Meme Coins",
  description: "Create verified Solana meme coins with pictures, links, and descriptions. Launch your token with liquidity pools on Raydium in minutes.",
  
  // Open Graph tags for rich previews in iMessage, WhatsApp, Facebook, etc.
  openGraph: {
    title: "Coinbull | Create Solana Meme Coins",
    description: "Create verified Solana meme coins with pictures, links, and descriptions. Launch your token with liquidity pools on Raydium in minutes.",
    url: "https://coinbull.app",
    siteName: "Coinbull",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "https://coinbull.app/images/logo.png",
        width: 1200,
        height: 630,
        alt: "Coinbull - Create Solana Meme Coins",
        type: "image/png",
      },
      {
        url: "https://coinbull.app/logo.svg", 
        width: 1000,
        height: 1000,
        alt: "Coinbull Logo",
        type: "image/svg+xml",
      }
    ],
  },
  
  // Twitter Card tags
  twitter: {
    card: "summary_large_image",
    title: "Coinbull | Create Solana Meme Coins",
    description: "Create verified Solana meme coins with pictures, links, and descriptions. Launch your token with liquidity pools on Raydium in minutes.",
    site: "@coinbull",
    creator: "@coinbull", 
    images: ["https://coinbull.app/images/logo.png"],
  },
  
  // Additional metadata for better SEO and previews
  keywords: [
    "Solana",
    "meme coins", 
    "cryptocurrency",
    "token creation",
    "DeFi",
    "Raydium",
    "liquidity pools",
    "Phantom wallet",
    "blockchain",
    "crypto tokens"
  ],
  
  authors: [{ name: "Coinbull" }],
  creator: "Coinbull",
  publisher: "Coinbull",
  
  // Robots and indexing
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  
  // Icons for various platforms
  icons: {
    icon: [
      { url: '/logo.svg', type: 'image/svg+xml' },
      { url: '/images/logo.png', type: 'image/png' }
    ],
    apple: '/images/logo.png',
    shortcut: '/logo.svg',
  },
  
  // Additional properties
  category: "Finance",
  classification: "Cryptocurrency Platform",
  
  // Verification (you can add these if you have them)
  verification: {
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // yahoo: 'your-yahoo-verification-code',
  },
  
  // App-specific metadata
  appleWebApp: {
    capable: true,
    title: "Coinbull",
    statusBarStyle: "black-translucent",
  },
  
  // Manifest for PWA
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
