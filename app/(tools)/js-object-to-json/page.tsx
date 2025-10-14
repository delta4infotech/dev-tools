import { Metadata } from "next";
import Content from "./Content";

export const metadata: Metadata = {
    title: 'JS Object to JSON Converter | Free Online Tool | Delta4',
    description: 'Convert JavaScript objects to valid JSON format instantly. Free, private, and secure. No registration required. Handles nested objects, arrays, and complex data structures.',
    keywords: [
        'js object to json',
        'javascript to json',
        'object to json converter',
        'js to json online',
        'convert javascript to json',
        'javascript object converter',
        'json converter',
        'object literal to json',
        'js object converter',
        'javascript json tool'
    ],
    openGraph: {
        title: 'JS Object to JSON Converter | Delta4',
        description: 'Convert JavaScript objects to valid JSON format instantly. Free, private, and secure.',
        url: 'https://delta4.io/tools/js-object-to-json',
    },
};

export default function Page() {
    return <Content />;
}
