import { Metadata } from "next";
import { ConverterPageConfig } from "./pages";

/** Builds the page metadata for a converter route, matching the other tools. */
export function converterMetadata(config: ConverterPageConfig): Metadata {
    const url = `https://delta4.io/tools/${config.slug}`;

    return {
        title: config.metaTitle,
        description: config.metaDescription,
        keywords: config.keywords,
        authors: [{ name: "Dev Tools" }],
        creator: "Dev Tools",
        publisher: "Dev Tools",
        alternates: { canonical: url },
        formatDetection: {
            email: false,
            address: false,
            telephone: false,
        },
        openGraph: {
            title: config.metaTitle,
            description: config.metaDescription,
            url,
            siteName: "Dev Tools",
            locale: "en_US",
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: config.metaTitle,
            description: config.metaDescription,
            creator: "@delta4io",
        },
    };
}
