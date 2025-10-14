"use client";
import { useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { oneDark } from "@codemirror/theme-one-dark";
import { Copy, BrushCleaning, Lock, Unlock } from "lucide-react";
import { EditorView } from "@codemirror/view";
import FAQ, { FAQProps } from "../../(components)/FAQ";
import Example, { ExampleProps } from "../../(components)/Example";
import RelatedTools from "../../(components)/RelatedTools";
import KeyboardShortcutHint from "../../(components)/KeyboardShortcutHint";

const faqs = [
    {
        id: "1",
        title: "What is URI encoding and why is it used?",
        content:
            "URI encoding converts characters that are not allowed in a URI into a format that is valid. It replaces unsafe ASCII characters with a '%' followed by two hexadecimal digits. This is essential for transmitting data in URLs where certain characters have special meaning.",
    },
    {
        id: "2",
        title: "Is my data safe with this tool?",
        content:
            "Yes, absolutely. This tool processes everything locally in your browser without sending any data to servers. Your text and encoded data never leave your device, ensuring complete privacy and security.",
    },
    {
        id: "3",
        title: "What characters need to be URI encoded?",
        content:
            "Characters that need to be encoded include spaces, non-alphanumeric characters like !, @, #, $, %, and special URL characters like ?, &, =, +. International characters and emojis are also encoded to ensure proper URL formatting.",
    },
    {
        id: "4",
        title: "What's the difference between URI encoding and URL encoding?",
        content:
            "URI (Uniform Resource Identifier) encoding and URL (Uniform Resource Locator) encoding are essentially the same thing. URL is a type of URI, and they both use the same encoding scheme defined in RFC 3986.",
    },
    {
        id: "5",
        title: "When should I decode a URI?",
        content:
            "You should decode a URI when you need to extract information from a URL parameter or when processing data that has been transmitted through a URL. Decoding converts the percent-encoded characters back to their original form.",
    },
    {
        id: "6",
        title: "Is there a size limit for encoding/decoding?",
        content:
            "There's no specific size limit imposed by the tool, but very large data may be limited by your browser's memory. For typical use cases, the tool handles large text content efficiently.",
    }
];

const examples = [
    {
        title: "URL Parameters",
        description: "Encode parameters for use in URLs.",
        list: [
            {
                title: "Original",
                content: "Query string with special characters like spaces, &, and = that need to be encoded for proper URL formation."
            },
            {
                title: "Encoded",
                content: "The same string encoded for safe use in URLs, with spaces becoming %20 and other special characters replaced with percent encoding."
            },
        ],
        bottomdesc: "URI encoding ensures that URL parameters are properly formatted and transmitted without breaking the URL structure."
    },
    {
        title: "Internationalization",
        description: "Handle non-ASCII characters in URLs.",
        list: [
            {
                title: "Text Content",
                content: "Text containing non-English characters, accents, or other Unicode symbols that need to be used in a URL."
            },
            {
                title: "Encoded URL",
                content: "The same content with all special characters encoded, making it safe for use in URLs across different systems."
            },
        ],
        bottomdesc: "URI encoding allows websites to handle international characters in URLs while maintaining compatibility."
    },
    {
        title: "Form Submissions",
        description: "Process form data for safe transmission.",
        list: [
            {
                title: "Form Data",
                content: "User input from forms that may contain special characters or spaces that need to be properly encoded."
            },
            {
                title: "Encoded Form",
                content: "The same form data encoded for safe transmission in HTTP requests, ensuring all characters are properly handled."
            },
        ],
        bottomdesc: "URI encoding is crucial for transmitting form data without losing or corrupting special characters."
    },
    {
        title: "API Integration",
        description: "Properly format API request parameters.",
        list: [
            {
                title: "API Parameter",
                content: "Parameters for API requests that may contain special characters, JSON strings, or complex query structures."
            },
            {
                title: "Encoded Parameter",
                content: "The same parameters encoded for safe use in API requests, ensuring proper transmission and processing."
            },
        ],
        bottomdesc: "API integrations rely on proper URI encoding to ensure parameters are correctly passed and processed."
    }
];

const FAQs = ({ faqs }: { faqs: FAQProps[] }) => {
    return (
        <div className="w-full bg-background py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-foreground">Frequently Asked Questions</h2>
                <FAQ faqs={faqs} />
            </div>
        </div>
    )
}

const Examples = ({ examples }: { examples: ExampleProps[] }) => {
    return (
        <div className="w-full py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-foreground">Examples & Use Cases</h2>
                <Example examples={examples} />
            </div>
        </div>
    )
}

const relatedTools = [
    {
        title: "Base64 Encoder & Decoder",
        description: "Quickly encode and decode Base64 strings for data transmission.",
        link: "/base64-encoder-and-decoder"
    },
    {
        title: "JWT Token Encoder & Decoder",
        description: "Encode and decode JWT tokens with detailed payload inspection.",
        link: "/jwt-token-encoder-and-decoder"
    },
    {
        title: "Find & Replace",
        description: "Quickly find and replace text in code with ease.",
        link: "/find-and-replace"
    }
];

const Header = () => {
    return (
        <div className="w-full bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-2xl md:text-3xl font-bold text-center text-foreground">URI Encoder & Decoder</h1>
                <p className="text-sm text-muted-foreground text-center mt-2">Encode and decode text to URI format securely in your browser.</p>
            </div>
        </div>
    )
}

export default function Content() {
    // Encoder states
    const [plainText, setPlainText] = useState('Hello, World! This is a sample text with special characters: ?&=#+%');
    const [encodedText, setEncodedText] = useState('');

    // Decoder states
    const [uriInput, setUriInput] = useState('Hello%2C%20World!%20This%20is%20a%20sample%20text%20with%20special%20characters%3A%20%3F%26%3D%23%2B%25');
    const [decodedText, setDecodedText] = useState('');

    const [editorHeight, setEditorHeight] = useState('500px');
    const [fontSize, setFontSize] = useState(14);

    // Calculate dynamic height and font size
    useEffect(() => {
        const calculateHeight = () => {
            const headerHeight = 80;
            const buttonHeight = 60;
            const padding = 64;
            const margin = 64;
            const labelHeight = 50;
            const bottomBuffer = 20;

            const availableHeight = window.innerHeight - headerHeight - buttonHeight - padding - margin - labelHeight - bottomBuffer;

            let minHeight, maxHeightPercent;

            if (window.innerWidth >= 2560) {
                minHeight = 1000;
                maxHeightPercent = 0.85;
            } else if (window.innerWidth >= 1920) {
                minHeight = 850;
                maxHeightPercent = 0.80;
            } else if (window.innerWidth >= 1440) {
                minHeight = 750;
                maxHeightPercent = 0.75;
            } else {
                minHeight = 550;
                maxHeightPercent = 0.75;
            }

            const maxHeight = window.innerHeight * maxHeightPercent;
            return Math.max(Math.min(availableHeight, maxHeight), minHeight);
        };

        const calculateFontSize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            let baseSize = 14;

            if (width >= 3840) baseSize = 20;
            else if (width >= 2560) baseSize = 18;
            else if (width >= 1920) baseSize = 16;
            else if (width >= 1440) baseSize = 15;
            else if (width >= 1024) baseSize = 14;
            else if (width >= 768) baseSize = 13;
            else baseSize = 12;

            if (height >= 1440) baseSize = Math.min(baseSize + 2, 22);
            else if (height >= 1080) baseSize = Math.min(baseSize + 1, 20);
            else if (height < 600) baseSize = Math.max(baseSize - 1, 11);

            const viewportArea = width * height;
            if (viewportArea > 4000000) {
                baseSize = Math.min(baseSize + 1, 22);
            }

            return baseSize;
        };

        const updateDimensions = () => {
            setEditorHeight(`${calculateHeight()}px`);
            setFontSize(calculateFontSize());
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    const handleEncode = () => {
        try {
            const encoded = encodeURIComponent(plainText);
            setEncodedText(encoded);
        } catch (error) {
            setEncodedText(`Error: ${(error as Error).message}`);
        }
    };

    const handleDecode = () => {
        try {
            const decoded = decodeURIComponent(uriInput);
            setDecodedText(decoded);
        } catch (error) {
            setDecodedText(`Error: ${(error as Error).message}`);
        }
    };

    const handleClearEncoder = () => {
        setPlainText('');
        setEncodedText('');
    };

    const handleClearDecoder = () => {
        setUriInput('');
        setDecodedText('');
    };

    return (
        <>
            <Header />
            {/* Main Tool Content */}
            <div className="flex-1 bg-background w-full h-full">
                <div className="mx-auto px-4 md:px-10 py-8">

                    <Tabs defaultValue="encoder" className="w-full ">
                        <TabsList>
                            <TabsTrigger value="encoder">
                                <Lock className="w-4 h-4 mr-2" />
                                Encoder
                            </TabsTrigger>
                            <TabsTrigger value="decoder">
                                <Unlock className="w-4 h-4 mr-2" />
                                Decoder
                            </TabsTrigger>
                        </TabsList>

                        {/* URI Encoder Tab */}
                        <TabsContent value="encoder" className="mt-6 bg-card border border-foreground/10 rounded-lg p-6 shadow-sm">
                            {/* Two Column Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Plain Text Input */}
                                <div className="flex flex-col">
                                    <div className="border border-foreground/40 rounded-lg overflow-hidden shadow-sm" style={{ height: editorHeight }}>
                                        <div className="bg-card p-2 flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={handleClearEncoder}
                                                className="px-3 py-1.5 h-8 text-sm"
                                                size="sm"
                                            >
                                                <BrushCleaning className="w-3.5 h-3.5 mr-1.5" />
                                                Clear
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => navigator.clipboard.writeText(plainText)}
                                                className="px-3 py-1.5 h-8 text-sm"
                                                size="sm"
                                            >
                                                <Copy className="w-3.5 h-3.5 mr-1.5" />
                                                Copy
                                            </Button>
                                        </div>
                                        <CodeMirror
                                            value={plainText}
                                            height={`calc(${editorHeight} - 40px)`}
                                            onChange={setPlainText}
                                            theme={oneDark}
                                            extensions={[EditorView.lineWrapping]}
                                            basicSetup={{
                                                lineNumbers: true,
                                                foldGutter: true,
                                                highlightActiveLine: true,
                                                highlightSelectionMatches: true,
                                            }}
                                            style={{ fontSize: `${fontSize}px` }}
                                        />
                                    </div>
                                    <div className="text-sm font-medium mt-3 text-muted-foreground text-center">
                                        Plain Text
                                    </div>
                                </div>

                                {/* Encode Button Between Editors */}
                                <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 transform -mt-8">
                                    <Button
                                        onClick={handleEncode}
                                        className="px-6 py-2.5 font-medium rounded-full shadow-md"
                                    >
                                        <Lock className="w-4 h-4 mr-2" />
                                        Encode
                                    </Button>
                                </div>

                                {/* URI Output */}
                                <div className="flex flex-col">
                                    <div className="border border-foreground/40 rounded-lg overflow-hidden shadow-sm" style={{ height: editorHeight }}>
                                        <div className="bg-card p-2 flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => setEncodedText('')}
                                                className="px-3 py-1.5 h-8 text-sm"
                                                size="sm"
                                            >
                                                <BrushCleaning className="w-3.5 h-3.5 mr-1.5" />
                                                Clear
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => navigator.clipboard.writeText(encodedText)}
                                                className="px-3 py-1.5 h-8 text-sm"
                                                size="sm"
                                                disabled={!encodedText}
                                            >
                                                <Copy className="w-3.5 h-3.5 mr-1.5" />
                                                Copy
                                            </Button>
                                        </div>
                                        <CodeMirror
                                            value={encodedText}
                                            height={`calc(${editorHeight} - 40px)`}
                                            readOnly
                                            theme={oneDark}
                                            extensions={[EditorView.lineWrapping]}
                                            basicSetup={{
                                                lineNumbers: true,
                                                foldGutter: true,
                                                highlightActiveLine: true,
                                            }}
                                            style={{ fontSize: `${fontSize}px` }}
                                        />
                                    </div>
                                    <div className="text-sm font-medium mt-3 text-muted-foreground text-center">
                                        URI Encoded
                                    </div>
                                </div>
                            </div>
                            {/* Mobile Encode Button */}
                            <div className="flex lg:hidden justify-center mt-6">
                                <Button
                                    onClick={handleEncode}
                                    className="px-6 py-2.5 font-medium"
                                >
                                    <Lock className="w-4 h-4 mr-2" />
                                    Encode
                                </Button>
                            </div>
                        </TabsContent>

                        {/* URI Decoder Tab */}
                        <TabsContent value="decoder" className="mt-6 bg-card border border-foreground/10 rounded-lg p-6 shadow-sm">
                            {/* Two Column Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* URI Input */}
                                <div className="flex flex-col">
                                    <div className="border border-foreground/40 rounded-lg overflow-hidden shadow-sm" style={{ height: editorHeight }}>
                                        <div className="bg-card p-2 flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={handleClearDecoder}
                                                className="px-3 py-1.5 h-8 text-sm"
                                                size="sm"
                                            >
                                                <BrushCleaning className="w-3.5 h-3.5 mr-1.5" />
                                                Clear
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => navigator.clipboard.writeText(uriInput)}
                                                className="px-3 py-1.5 h-8 text-sm"
                                                size="sm"
                                            >
                                                <Copy className="w-3.5 h-3.5 mr-1.5" />
                                                Copy
                                            </Button>
                                        </div>
                                        <CodeMirror
                                            value={uriInput}
                                            height={`calc(${editorHeight} - 40px)`}
                                            onChange={setUriInput}
                                            theme={oneDark}
                                            extensions={[EditorView.lineWrapping]}
                                            basicSetup={{
                                                lineNumbers: true,
                                                foldGutter: true,
                                                highlightActiveLine: true,
                                                highlightSelectionMatches: true,
                                            }}
                                            style={{ fontSize: `${fontSize}px` }}
                                        />
                                    </div>
                                    <div className="text-sm font-medium mt-3 text-muted-foreground text-center">
                                        URI Input
                                    </div>
                                </div>

                                {/* Decode Button Between Editors */}
                                <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 transform -mt-8">
                                    <Button
                                        onClick={handleDecode}
                                        className="px-6 py-2.5 font-medium rounded-full shadow-md"
                                    >
                                        <Unlock className="w-4 h-4 mr-2" />
                                        Decode
                                    </Button>
                                </div>

                                {/* Decoded Text Output */}
                                <div className="flex flex-col">
                                    <div className="border border-foreground/40 rounded-lg overflow-hidden shadow-sm" style={{ height: editorHeight }}>
                                        <div className="bg-card p-2 flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => setDecodedText('')}
                                                className="px-3 py-1.5 h-8 text-sm"
                                                size="sm"
                                            >
                                                <BrushCleaning className="w-3.5 h-3.5 mr-1.5" />
                                                Clear
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => navigator.clipboard.writeText(decodedText)}
                                                className="px-3 py-1.5 h-8 text-sm"
                                                size="sm"
                                                disabled={!decodedText}
                                            >
                                                <Copy className="w-3.5 h-3.5 mr-1.5" />
                                                Copy
                                            </Button>
                                        </div>
                                        <CodeMirror
                                            value={decodedText}
                                            height={`calc(${editorHeight} - 40px)`}
                                            readOnly
                                            theme={oneDark}
                                            extensions={[EditorView.lineWrapping]}
                                            basicSetup={{
                                                lineNumbers: true,
                                                foldGutter: true,
                                                highlightActiveLine: true,
                                            }}
                                            style={{ fontSize: `${fontSize}px` }}
                                        />
                                    </div>
                                    <div className="text-sm font-medium mt-3 text-muted-foreground text-center">
                                        Decoded Text
                                    </div>
                                </div>
                            </div>
                            {/* Mobile Decode Button */}
                            <div className="flex lg:hidden justify-center mt-6">
                                <Button
                                    onClick={handleDecode}
                                    className="px-6 py-2.5 font-medium"
                                >
                                    <Unlock className="w-4 h-4 mr-2" />
                                    Decode
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Keyboard Shortcut Hint */}
            <KeyboardShortcutHint />

            {/* Examples Section */}
            <Examples examples={examples} />

            {/* FAQs Section */}
            <FAQs faqs={faqs} />

            {/* Related Tools Section */}
            <RelatedTools tools={relatedTools} />
        </>
    );
}
