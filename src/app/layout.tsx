import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ThemeProvider from "@/components/ThemeProvider";
import ClientLayout from "@/components/ClientLayout";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Coinbull | Create Solana Meme Coins",
  description: "Create verified Solana meme coins with pictures, links, and descriptions",
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
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
