import { Metadata } from "next";
import Content from "./Content";

export const metadata: Metadata = {
    title: "Code Comparator - Compare Code Differences with Line-by-Line Analysis",
    description: "Free online code comparison tool. Compare two versions of code side by side with detailed difference highlighting. No registration required, completely private and secure.",
    keywords: ["code comparator", "code diff", "diff viewer", "code comparison", "compare code", "code differences", "code diff tool"],
    authors: [{ name: "Dev Tools" }],
    creator: "Dev Tools",
    publisher: "Dev Tools",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    openGraph: {
        title: "Code Comparator - Compare Code Differences with Line-by-Line Analysis",
        description: "Free online code comparison tool. Compare two versions of code side by side with detailed difference highlighting. No registration required, completely private and secure.",
        url: "https://delta4.io/tools/code-comparator",
        siteName: "Dev Tools",
        images: [
            {
                url: "/og-code-comparator.png",
                width: 1200,
                height: 630,
                alt: "Code Comparator Tool",
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Code Comparator - Compare Code Differences with Line-by-Line Analysis",
        description: "Free online code comparison tool. Compare two versions of code side by side with detailed difference highlighting.",
        images: ["/og-code-comparator.png"],
        creator: "@delta4io",
    },
};

export default function Page() {
    return <Content />;
}
