import { Metadata } from "next";
import Content from "./Content";

export const metadata: Metadata = {
    title: "LinkedIn Text Formatter - Format Posts with Bold, Italic & Professional Styling",
    description: "Free LinkedIn text formatter tool. Make your LinkedIn posts stand out with bold, italic, underline, and special formatting. Create professional-looking posts that boost engagement and visibility.",
    keywords: ["LinkedIn text formatter", "LinkedIn post formatter", "LinkedIn bold text", "LinkedIn italic text", "LinkedIn formatting", "social media formatting", "LinkedIn post styling"],
    authors: [{ name: "Dev Tools" }],
    creator: "Dev Tools",
    publisher: "Dev Tools",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    openGraph: {
        title: "LinkedIn Text Formatter - Format Posts with Bold, Italic & Professional Styling",
        description: "Free LinkedIn text formatter tool. Make your LinkedIn posts stand out with bold, italic, underline, and special formatting. Create professional-looking posts that boost engagement and visibility.",
        url: "https://delta4.io/tools/linkedin-text-formatter",
        siteName: "Dev Tools",
        images: [
            {
                url: "/og-linkedin-formatter.png",
                width: 1200,
                height: 630,
                alt: "LinkedIn Text Formatter Tool",
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "LinkedIn Text Formatter - Format Posts with Bold, Italic & Professional Styling",
        description: "Free LinkedIn text formatter tool. Make your LinkedIn posts stand out with bold, italic, underline, and special formatting.",
        images: ["/og-linkedin-formatter.png"],
        creator: "@delta4io",
    },
};

export default function Page() {
    return <Content />;
}