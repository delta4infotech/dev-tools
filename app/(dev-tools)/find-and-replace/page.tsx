import { Metadata } from "next";
import Content from "./Content";

export const metadata: Metadata = {
    title: "Find & Replace Tool - Powerful Text Search and Replace with Regex Support",
    description: "Free online find and replace tool with regex support, case sensitivity, and word matching. Replace text efficiently with real-time highlighting and match counting.",
    keywords: ["find and replace", "text replace", "regex replace", "text search", "find replace tool", "text editor", "bulk replace"],
    authors: [{ name: "Dev Tools" }],
    creator: "Dev Tools",
    publisher: "Dev Tools",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    openGraph: {
        title: "Find & Replace Tool - Powerful Text Search and Replace with Regex Support",
        description: "Free online find and replace tool with regex support, case sensitivity, and word matching. Replace text efficiently with real-time highlighting and match counting.",
        url: "https://delta4.io/dev-tools/find-and-replace",
        siteName: "Dev Tools",
        images: [
            {
                url: "/og-find-replace.png",
                width: 1200,
                height: 630,
                alt: "Find & Replace Tool",
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Find & Replace Tool - Powerful Text Search and Replace with Regex Support",
        description: "Free online find and replace tool with regex support, case sensitivity, and word matching.",
        images: ["/og-find-replace.png"],
        creator: "@delta4io",
    },
};

export default function Page() {
    return <Content />;
}
