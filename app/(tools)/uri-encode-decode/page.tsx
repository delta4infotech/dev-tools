import { Metadata } from "next";
import Content from "./Content";

export const metadata: Metadata = {
    title: "URI Encode Decode - Free Online URL Encoder & Decoder Tool",
    description: "Free online URI encoder and decoder tool for developers. Instantly encode/decode URLs, handle special characters, and process data safely in your browser. No server uploads required.",
    keywords: ["uri encoder", "url decoder", "percent encoding", "uri decode", "url encode", "web development", "developer tools", "uri encoding", "url encoding", "browser tool"],
    authors: [{ name: "Dev Tools" }],
    creator: "Dev Tools",
    publisher: "Dev Tools",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    openGraph: {
        title: "URI Encode Decode - Free Online URL Encoder & Decoder Tool",
        description: "Free online URI encoder and decoder tool for developers. Instantly encode/decode URLs, handle special characters, and process data safely in your browser.",
        url: "https://delta4.io/tools/uri-encode-decode",
        siteName: "Dev Tools",
        images: [
            {
                url: "/og-uri-encode-decode.png",
                width: 1200,
                height: 630,
                alt: "URI Encode Decode Tool",
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "URI Encode Decode - Free Online URL Encoder & Decoder Tool",
        description: "Free online URI encoder and decoder tool for developers. Instantly encode/decode URLs and handle special characters safely.",
        images: ["/og-uri-encode-decode.png"],
        creator: "@delta4io",
    },
};

export default function UriEncodeDecodePage() {
    return <Content />;
}