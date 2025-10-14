import { Metadata } from "next";
import Content from "./Content";

export const metadata: Metadata = {
    title: "JWT Encoder & Decoder - Encode, Decode & Verify JSON Web Tokens",
    description: "Free online JWT encoder and decoder. Encode, decode, and verify JSON Web Tokens securely in your browser. Supports signature verification with HMAC and RSA algorithms. No registration required, completely private and secure.",
    keywords: ["JWT encoder", "JWT decoder", "JSON Web Token", "JWT verifier", "token decoder", "JWT signature", "JWT validation", "encode JWT", "decode JWT", "JWT tool"],
    authors: [{ name: "Dev Tools" }],
    creator: "Dev Tools",
    publisher: "Dev Tools",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    openGraph: {
        title: "JWT Encoder & Decoder - Encode, Decode & Verify JSON Web Tokens",
        description: "Free online JWT encoder and decoder. Encode, decode, and verify JSON Web Tokens securely in your browser. Supports signature verification with HMAC and RSA algorithms. No registration required, completely private and secure.",
        url: "https://delta4.io/tools/jwt-token-encoder-and-decoder",
        siteName: "Dev Tools",
        images: [
            {
                url: "/og-jwt-encoder-decoder.png",
                width: 1200,
                height: 630,
                alt: "JWT Encoder & Decoder Tool",
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "JWT Encoder & Decoder - Encode, Decode & Verify JSON Web Tokens",
        description: "Free online JWT encoder and decoder. Encode, decode, and verify JSON Web Tokens securely in your browser. Supports signature verification.",
        images: ["/og-jwt-encoder-decoder.png"],
        creator: "@delta4io",
    },
};

export default function Page() {
    return <Content />;
}