import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ThemeProvider from "@/components/ThemeProvider";
import ClientLayout from "@/components/ClientLayout";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://redbullcoins.com'),
  title: "Redbull Coins | Create Solana Meme Coins",
  description: "Create verified Solana meme coins that display correctly in wallets with custom images, links, and descriptions.",
  
  // Open Graph tags for rich previews in iMessage, WhatsApp, Facebook, etc.
  openGraph: {
    title: "Redbull Coins | Create Solana Meme Coins",
    description: "Create verified Solana meme coins that display correctly in wallets with custom images, links, and descriptions.",
    url: "https://redbullcoins.com",
    siteName: "Redbull Coins",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "https://redbullcoins.com/images/logo.png",
        width: 1200,
        height: 630,
        alt: "Redbull Coins - Create Solana Meme Coins",
        type: "image/png",
      },
      {
        url: "https://redbullcoins.com/logo.svg", 
        width: 1000,
        height: 1000,
        alt: "Redbull Coins Logo",
        type: "image/svg+xml",
      }
    ],
  },
  
  // Twitter Card tags
  twitter: {
    card: "summary_large_image",
    title: "Redbull Coins | Create Solana Meme Coins",
    description: "Create verified Solana meme coins with pictures, links, and descriptions. Launch your token with liquidity pools on Raydium in minutes.",
    site: "@redbull_coins",
    creator: "@redbull_coins", 
    images: ["https://redbullcoins.com/images/logo.png"],
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
  
  authors: [{ name: "Redbull Coins" }],
  creator: "Redbull Coins",
  publisher: "Redbull Coins",
  
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
    title: "Redbull Coins",
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
