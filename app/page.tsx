import { appContent } from "@/utils/variants";
import Content from "./(components)/Content";
import type { Metadata } from 'next';
import Header from "@/components/header";

export const metadata: Metadata = {
  title: 'Free Developer Tools - Delta4 | Code Formatter, JSON Validator & More',
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
    url: 'https://delta4.io/tools',
    title: 'Free Developer Tools - Delta4 | Code Formatter, JSON Validator & More',
    description: 'Boost your productivity with our collection of free, web-based developer tools. Format JavaScript, TypeScript, JSX, and JSON code instantly. No downloads required.',
    siteName: 'Delta4',
    images: [
      {
        url: 'https://delta4.io/tools-og.png', // You may need to create this image
        width: 1200,
        height: 630,
        alt: 'Delta4 Free Developer Tools - Code Formatter and More',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Developer Tools - Delta4 | Code Formatter, JSON Validator & More',
    description: 'Boost your productivity with our collection of free, web-based developer tools. Format code instantly in your browser.',
    images: ['/tools-og.png'], // You may need to create this image
    creator: '@delta4io', // Update with your actual Twitter handle
  },
  alternates: {
    canonical: 'https://delta4.io/tools',
  },
  category: 'technology',
};

export default function ToolsPage() {
  return (
    <>
      <Header />
      <div className={appContent()}>
        <Content />
      </div>
    </>
  );
}