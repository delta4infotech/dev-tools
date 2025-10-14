"use client";
import { useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { oneDark } from "@codemirror/theme-one-dark";
import { Copy, BrushCleaning, Lock, Unlock } from "lucide-react";
import FAQ, { FAQProps } from "../../(components)/FAQ";
import Example, { ExampleProps } from "../../(components)/Example";

const faqs = [
    {
        id: "1",
        title: "What is Base64 encoding and why is it used?",
        content:
            "Base64 is a binary-to-text encoding scheme that represents binary data using ASCII string format. It's commonly used for encoding data in emails, URLs, and web applications where binary data needs to be transmitted over text-based protocols.",
    },
    {
        id: "2",
        title: "Is my data safe with this tool?",
        content:
            "Yes, absolutely. This tool processes everything locally in your browser without sending any data to servers. Your text and encoded data never leave your device, ensuring complete privacy and security.",
    },
    {
        id: "3",
        title: "What characters can I encode in Base64?",
        content:
            "You can encode any text including special characters, emojis, and Unicode characters. The tool handles UTF-8 encoding automatically, so all international characters are supported.",
    },
    {
        id: "4",
        title: "What's the difference between Base64 and Base64URL?",
        content:
            "Base64URL is a URL-safe variant that replaces '+' with '-' and '/' with '_', and removes padding '=' characters. This tool uses standard Base64 encoding which is most commonly used.",
    },
    {
        id: "5",
        title: "Can I decode malformed Base64 data?",
        content:
            "The tool will display an error message if the Base64 data is malformed or invalid. Common issues include incorrect padding, invalid characters, or incomplete encoding.",
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
        title: "API Authentication",
        description: "Encode credentials for Basic HTTP authentication headers.",
        list: [
            {
                title: "Original",
                content: "A username and password combination that needs to be encoded for HTTP Basic authentication, following the format 'username:password'."
            },
            {
                title: "Encoded",
                content: "The same credentials encoded in Base64 format, ready to be used in Authorization headers for secure API access and authentication."
            },
        ],
        bottomdesc: "Base64 encoding is essential for HTTP Basic authentication and secure credential transmission in web applications."
    },
    {
        title: "Data URLs",
        description: "Create data URLs for embedding content directly in HTML or CSS.",
        list: [
            {
                title: "Text Content",
                content: "Plain text content that needs to be embedded directly in HTML or CSS without external file references, useful for inline content."
            },
            {
                title: "Data URL",
                content: "The same content encoded as a data URL with Base64 encoding, allowing direct embedding in src attributes or CSS properties."
            },
        ],
        bottomdesc: "Data URLs with Base64 encoding allow embedding content directly in HTML and CSS without separate file requests."
    },
    {
        title: "Configuration Storage",
        description: "Encode configuration data for safe storage and transmission.",
        list: [
            {
                title: "Config Data",
                content: "Application configuration with settings, API keys, and parameters that need to be encoded for safe storage in databases or config files."
            },
            {
                title: "Encoded Config",
                content: "The same configuration data encoded in Base64 format, making it safe to store in text-based systems and preventing formatting issues."
            },
        ],
        bottomdesc: "Base64 encoding helps store complex configuration data safely in text-based storage systems."
    },
    {
        title: "Email Attachments",
        description: "Understand how email attachments are encoded for transmission.",
        list: [
            {
                title: "Binary Data",
                content: "Binary file content or attachment data that needs to be transmitted through email protocols that only support text content."
            },
            {
                title: "Email Safe",
                content: "The same binary data encoded in Base64 format, making it safe for email transmission and compatible with MIME standards."
            },
        ],
        bottomdesc: "Email systems use Base64 encoding to safely transmit binary attachments through text-based protocols."
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

const Header = () => {
    return (
        <div className="w-full bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-2xl md:text-3xl font-bold text-center text-foreground">Base64 Encoder & Decoder</h1>
                <p className="text-sm text-muted-foreground text-center">Encode and decode text to Base64 format securely in your browser.</p>
            </div>
        </div>
    )
}

export default function Content() {
    // Encoder states
    const [plainText, setPlainText] = useState('Hello, World! This is a sample text to encode.');
    const [encodedText, setEncodedText] = useState('');

    // Decoder states
    const [base64Input, setBase64Input] = useState('SGVsbG8sIFdvcmxkISBUaGlzIGlzIGEgc2FtcGxlIHRleHQgdG8gZW5jb2RlLg==');
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
            const encoded = btoa(unescape(encodeURIComponent(plainText)));
            setEncodedText(encoded);
        } catch (error) {
            setEncodedText(`Error: ${(error as Error).message}`);
        }
    };

    const handleDecode = () => {
        try {
            const decoded = decodeURIComponent(escape(atob(base64Input)));
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
        setBase64Input('');
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

                        {/* Base64 Encoder Tab */}
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

                                {/* Base64 Output */}
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
                                            basicSetup={{
                                                lineNumbers: true,
                                                foldGutter: true,
                                                highlightActiveLine: true,
                                            }}
                                            style={{ fontSize: `${fontSize}px` }}
                                        />
                                    </div>
                                    <div className="text-sm font-medium mt-3 text-muted-foreground text-center">
                                        Base64 Encoded
                                    </div>
                                </div>
                            </div>
                            {/* Mobile Encode Button */}
                            <div className="flex lg:hidden justify-center mb-6">
                                <Button
                                    onClick={handleEncode}
                                    className="px-6 py-2.5 font-medium"
                                >
                                    <Lock className="w-4 h-4 mr-2" />
                                    Encode
                                </Button>
                            </div>
                        </TabsContent>

                        {/* Base64 Decoder Tab */}
                        <TabsContent value="decoder" className="mt-6 bg-card border border-foreground/10 rounded-lg p-6 shadow-sm">
                            {/* Two Column Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Base64 Input */}
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
                                                onClick={() => navigator.clipboard.writeText(base64Input)}
                                                className="px-3 py-1.5 h-8 text-sm"
                                                size="sm"
                                            >
                                                <Copy className="w-3.5 h-3.5 mr-1.5" />
                                                Copy
                                            </Button>
                                        </div>
                                        <CodeMirror
                                            value={base64Input}
                                            height={`calc(${editorHeight} - 40px)`}
                                            onChange={setBase64Input}
                                            theme={oneDark}
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
                                        Base64 Input
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
                            <div className="flex lg:hidden justify-center mb-6">
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

            {/* Examples Section */}
            <Examples examples={examples} />

            {/* FAQs Section */}
            <FAQs faqs={faqs} />
        </>
    );
}
