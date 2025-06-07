import { QueryProvider } from '@/lib/providers/QueryProvider';
import { AuthProvider } from '@/lib/providers/AuthProvider';
import { LanguageProvider } from '@/lib/providers/LanguageProvider';
import { Toaster } from '@/components/Toaster';
import { ThemeProvider } from 'next-themes';
import type { Metadata } from "next";
import { Oswald } from "next/font/google";
import "./globals.css";
import { Chat } from '@/components/chat/chat';

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
      { url: '/logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo.png', sizes: '16x16', type: 'image/png' },
      { url: '/logo.png', sizes: '48x48', type: 'image/png' }
    ],
    apple: [
      { url: '/logo.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: '/logo.png'
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
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" sizes="any" />
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${oswald.variable} antialiased min-h-full flex flex-col bg-background dark:bg-gray-950 text-black dark:text-white`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <LanguageProvider>
            <QueryProvider>
              <AuthProvider>
                {children}
                <Toaster />
                <Chat />
              </AuthProvider>
            </QueryProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
