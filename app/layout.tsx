import { QueryProvider } from '@/lib/providers/QueryProvider';
import { AuthProvider } from '@/lib/providers/AuthProvider';
import { Toaster } from '@/components/Toaster';
import type { Metadata } from "next";
import { Oswald } from "next/font/google";
import "./globals.css";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Haru's Library - Discover, Read, and Share Books",
  description: "A platform for book lovers to discover, read, and share their favorite books.",
  keywords: "books, reading, literature, ebooks, book reviews, Haru's Library",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    apple: [
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ]
  },
  manifest: '/manifest.json',
  themeColor: '#6366F1',
  appleWebApp: {
    title: "Haru's Library",
    statusBarStyle: "default"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${oswald.variable} antialiased min-h-full flex flex-col`}
      >
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
