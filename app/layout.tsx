import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Dev Tools | Delta4',
  description: 'Boost your productivity with our collection of free, web-based developer tools. Format JavaScript, TypeScript, JSX, and JSON code instantly. No downloads required - everything runs in your browser.',
  keywords: [
    'free developer tools',
    'code formatter',
    'javascript formatter',
    'typescript formatter',
    'jsx formatter',
    'json formatter',
    'online code formatter',
    'web developer tools',
    'programming tools',
    'code beautifier',
    'tidy code',
    'developer productivity',
    'browser based tools',
    'no installation tools'
  ],
  authors: [{ name: 'Delta4' }],
  creator: 'Delta4',
  publisher: 'Delta4',
  icons: {
    icon: '/dev-tools/delta4-icon-footer.svg',
    shortcut: '/dev-tools/delta4-icon-footer.svg',
    apple: '/dev-tools/delta4-icon-footer.svg',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://delta4.io/dev-tools',
    title: 'Dev Tools | Delta4',
    description: 'Boost your productivity with our collection of free, web-based developer tools. Format JavaScript, TypeScript, JSX, and JSON code instantly. No downloads required.',
    siteName: 'Delta4',
    images: [
      {
        url: 'https://delta4.io/tools-og.png',
        width: 1200,
        height: 630,
        alt: 'Delta4 Free Developer Tools - Code Formatter and More',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dev Tools | Delta4',
    description: 'Boost your productivity with our collection of free, web-based developer tools. Format code instantly in your browser.',
    images: ['/tools-og.png'],
    creator: '@delta4io',
  },
  alternates: {
    canonical: 'https://delta4.io/dev-tools',
  },
  category: 'technology',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Footer />
      </body>
    </html>
  );
}
