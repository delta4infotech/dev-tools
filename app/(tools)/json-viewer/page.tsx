import { Metadata } from "next";
import Content from "./Content";

const title = "JSON Viewer - View, Search & Browse JSON Online";
const description =
    "Free online JSON viewer. Open a JSON file as a collapsible tree, search keys and values, copy any path. Handles large files, in your browser, no signup.";
const url = "https://delta4.io/tools/json-viewer";

export const metadata: Metadata = {
    title,
    description,
    keywords: [
        "json viewer",
        "online json viewer",
        "json viewer online",
        "json file viewer",
        "json tree viewer",
        "large json viewer",
        "json viewer for large files",
        "view json online",
        "json viewer and formatter",
        "json browser",
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
    },
    twitter: {
        card: "summary_large_image",
        title,
        description,
        creator: "@delta4io",
    },
};

export default function Page() {
    return <Content />;
}
