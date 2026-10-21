import { Metadata } from "next";
import Content from "./Content";
import { faqs } from "./faqs";

const title = "PHP2Shell Checker (CVE-2026-109618): Is My Site Affected?";
const description =
    "Free, passive PHP2Shell check (CVE-2026-109618 / CVE-2026-109619). See your site's PHP version, platform and Cloudflare status, with clear next steps.";
const url = "https://delta4.io/tools/php2shell-exposure-checker";
const image = {
    url: "https://delta4.io/tools-og.png",
    width: 1200,
    height: 630,
    alt: "Delta4 Free Developer Tools",
};

export const metadata: Metadata = {
    title,
    description,
    keywords: [
        "php2shell",
        "php2shell checker",
        "CVE-2026-109618",
        "CVE-2026-109619",
        "php vulnerability checker",
        "check php version of website",
        "is my wordpress site vulnerable",
        "woocommerce php vulnerability",
        "php security check",
        "website php version checker",
    ],
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
        title,
        description,
        url,
        siteName: "Dev Tools",
        locale: "en_US",
        type: "website",
        images: [image],
    },
    twitter: {
        card: "summary_large_image",
        title,
        description,
        creator: "@delta4io",
        images: [image.url],
    },
};

const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "WebApplication",
            name: "PHP2Shell Exposure Checker",
            url,
            description,
            applicationCategory: "SecurityApplication",
            operatingSystem: "Any",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            publisher: { "@type": "Organization", name: "Delta4", url: "https://delta4.io" },
        },
        {
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
                "@type": "Question",
                name: faq.title,
                acceptedAnswer: { "@type": "Answer", text: faq.content },
            })),
        },
    ],
};

export default function Page() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
            />
            <Content />
        </>
    );
}
