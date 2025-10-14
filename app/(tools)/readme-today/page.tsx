import { Metadata } from "next";
import Content from "./Content";

export const metadata: Metadata = {
    title: "Readme Today - Notion-style Developer Productivity Tool",
    description: "Free online readme generator for developers with task status tracking, PR integration, and markdown export. Perfect for daily stand-ups and progress tracking.",
    keywords: ["readme generator", "developer productivity", "notion-style", "task tracking", "PR tracking", "markdown export", "daily tasks", "kanban", "to-do list"],
    authors: [{ name: "Dev Tools" }],
    creator: "Dev Tools",
    publisher: "Dev Tools",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    openGraph: {
        title: "Readme Today - Notion-style Developer Productivity Tool",
        description: "Free online readme generator for developers with task status tracking, PR integration, and markdown export. Perfect for daily stand-ups and progress tracking.",
        url: "https://delta4.io/tools/readme-today",
        siteName: "Dev Tools",
        images: [
            {
                url: "/og-readme-today.png",
                width: 1200,
                height: 630,
                alt: "Readme Today Tool",
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Readme Today - Notion-style Developer Productivity Tool",
        description: "Free online readme generator for developers with task status tracking, PR integration, and markdown export.",
        images: ["/og-readme-today.png"],
        creator: "@delta4io",
    },
};

export default function Page() {
    return <Content />;
}