import { Metadata } from "next";
import Content from "./Content";

export const metadata: Metadata = {
    title: "JSON Formatter - Format, Validate & Beautify JSON Data",
    description: "Free online JSON formatter and validator. Beautify JSON, or paste a JavaScript object, Python dict or PHP array. Private, in-browser, no signup.",
    keywords: ["JSON formatter", "JSON validator", "JSON beautifier", "JSON prettifier", "format JSON", "JSON syntax", "JSON editor", "JSON5 formatter", "single quote JSON", "JavaScript object to JSON", "Python dict to JSON", "format Python dict", "PHP array to JSON", "Ruby hash to JSON"],
    authors: [{ name: "Dev Tools" }],
    creator: "Dev Tools",
    publisher: "Dev Tools",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    openGraph: {
        title: "JSON Formatter - Format, Validate & Beautify JSON Data",
        description: "Free online JSON formatter, validator and beautifier. Format your JSON data instantly with proper indentation and syntax highlighting. No registration required, completely private and secure.",
        url: "https://delta4.io/tools/json-code-formatter",
        siteName: "Dev Tools",
        images: [
            {
                url: "/og-json-formatter.png",
                width: 1200,
                height: 630,
                alt: "JSON Formatter Tool",
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "JSON Formatter - Format, Validate & Beautify JSON Data",
        description: "Free online JSON formatter and validator. Beautify JSON, or paste a JavaScript object, Python dict or PHP array. Private, in-browser, no signup.",
        images: ["/og-json-formatter.png"],
        creator: "@delta4io",
    },
};

export default function Page() {
    return <Content />;
}