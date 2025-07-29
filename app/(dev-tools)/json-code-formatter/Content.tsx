"use client";
import { useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { Button } from "@/components/ui/button";
import { oneDark } from "@codemirror/theme-one-dark";
import { Copy, BrushCleaning, ArrowRightLeft } from "lucide-react";
import FAQ, { FAQProps } from "../../(components)/FAQ";
import Example, { ExampleProps } from "../../(components)/Example";

const faqs = [
    {
        id: "1",
        title: "What makes this JSON formatter different from others?",
        content:
            "This JSON formatter prioritizes privacy and simplicity. It processes your JSON data entirely client-side without storing any data, provides instant formatting without requiring accounts or uploads, and is completely free and open source.",
    },
    {
        id: "2",
        title: "Is my JSON data stored or saved anywhere?",
        content:
            "No, absolutely not. This formatter processes everything locally in your browser. Your JSON data never leaves your device, ensuring complete privacy and security of your sensitive data.",
    },
    {
        id: "3",
        title: "Can I format large JSON files?",
        content:
            "Yes, the formatter can handle large JSON files efficiently. Since it runs entirely in your browser without network requests, formatting speed depends only on your device's performance.",
    },
    {
        id: "4",
        title: "What if my JSON is invalid?",
        content:
            "The formatter will display an error message if your JSON is invalid, helping you identify syntax errors like missing commas, brackets, or quotes. This makes it a useful tool for debugging JSON syntax.",
    },
    {
        id: "5",
        title: "Can I customize the indentation?",
        content:
            "Currently, the formatter uses 2-space indentation by default. Future versions may include configurable options for indentation size and other formatting preferences.",
    },
    {
        id: "6",
        title: "Does the formatter preserve my JSON structure?",
        content:
            "Yes, the formatter only modifies whitespace, indentation, and formatting without changing your JSON data structure or values. It's designed to be safe for production use.",
    }
]

const examples = [
    {
        title: "API Response Data Formatting",
        description: "Format API responses and data structures for better readability and debugging.",
        list: [
            {
                title: "Before",
                content: "A compressed API response with nested user data, settings, and arrays all on one line making it impossible to understand the data structure and relationships."
            },
            {
                title: "After",
                content: "The same API response with proper indentation, clear object hierarchy, and readable nested structures that make data relationships and values obvious."
            },
        ],
        bottomdesc: "Properly formatted JSON makes API responses easier to understand and debug, especially when working with complex nested objects and arrays."
    },
    {
        title: "Configuration File Beautification",
        description: "Transform minified configuration files into readable, well-structured JSON documents.",
        list: [
            {
                title: "Before",
                content: "A minified config file with database settings, application parameters, and nested configurations all compressed into a single line without any formatting."
            },
            {
                title: "After",
                content: "The same configuration with proper indentation, organized sections, and clear hierarchy that makes it easy to modify settings and understand the structure."
            },
        ],
        bottomdesc: "Well-formatted configuration files are easier to maintain, debug, and modify without introducing syntax errors."
    },
    {
        title: "Data Export Formatting",
        description: "Format exported data for better presentation and analysis.",
        list: [
            {
                title: "Before",
                content: "Exported data with complex nested objects, arrays of user records, and metadata all compressed without proper spacing or structure."
            },
            {
                title: "After",
                content: "The same exported data with clear object hierarchy, readable nested structures, and proper indentation that makes data analysis and review much easier."
            },
        ],
        bottomdesc: "Formatted data exports are easier to review, analyze, and share with team members or stakeholders."
    },
    {
        title: "JSON Schema Validation",
        description: "Format and validate JSON schemas for better documentation and development.",
        list: [
            {
                title: "Before",
                content: "A compressed JSON schema with complex type definitions, validation rules, and nested properties all on one line creating confusion about the expected data structure."
            },
            {
                title: "After",
                content: "The same schema with proper line breaks, aligned properties, readable nested objects, and clear type annotations that document the expected data structure."
            },
        ],
        bottomdesc: "Well-formatted JSON schemas improve documentation and make complex data structures much easier to understand and implement."
    }
]

const FAQs = ({ faqs }: { faqs: FAQProps[] }) => {
    return (
        <div className="w-full bg-muted/20 py-16">
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
                <h1 className="text-2xl md:text-3xl font-bold text-center text-foreground">JSON Formatter</h1>
                <p className="text-sm text-muted-foreground text-center">Format, validate and beautify your JSON data instantly.</p>
            </div>
        </div>
    )
}

export default function Content() {
    const [inputJSON, setInputJSON] = useState('{ "name":"Alice","age": 30,"city":"New York","professions":["developer","musician"]}');
    const [formattedJSON, setFormattedJSON] = useState('');
    const [editorHeight, setEditorHeight] = useState('500px');
    const [fontSize, setFontSize] = useState(14);

    // Calculate dynamic height and font size for CodeMirror
    useEffect(() => {
        const calculateHeight = () => {
            const headerHeight = 80; // Approximate header height
            const buttonHeight = 60; // Approximate button area height
            const padding = 64; // Padding (py-8 = 32px top + 32px bottom)
            const margin = 64; // Margin (mb-16 = 64px)
            const labelHeight = 50; // Space for labels to be visible
            const bottomBuffer = 20; // Extra buffer to ensure labels are fully visible

            // Calculate available height ensuring labels are always visible
            const availableHeight = window.innerHeight - headerHeight - buttonHeight - padding - margin - labelHeight - bottomBuffer;

            // Enhanced sizing for very large displays
            let minHeight, maxHeightPercent;

            if (window.innerWidth >= 2560) { // 4K and ultra-wide displays
                minHeight = 1000;
                maxHeightPercent = 0.85;
            } else if (window.innerWidth >= 1920) { // Large displays
                minHeight = 850;
                maxHeightPercent = 0.80;
            } else if (window.innerWidth >= 1440) { // Medium-large displays
                minHeight = 750;
                maxHeightPercent = 0.75;
            } else { // Smaller displays
                minHeight = 550;
                maxHeightPercent = 0.75;
            }

            const maxHeight = window.innerHeight * maxHeightPercent;

            return Math.max(Math.min(availableHeight, maxHeight), minHeight);
        };

        const calculateFontSize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            // Enhanced font size calculation for very large displays
            let baseSize = 14;

            if (width >= 3840) baseSize = 20; // 4K ultra-wide displays
            else if (width >= 2560) baseSize = 18; // 4K and ultra-wide displays
            else if (width >= 1920) baseSize = 16; // Large displays
            else if (width >= 1440) baseSize = 15; // Medium-large screens
            else if (width >= 1024) baseSize = 14; // Medium screens
            else if (width >= 768) baseSize = 13; // Small-medium screens
            else baseSize = 12; // Mobile screens

            // Enhanced height-based adjustments for very large displays
            if (height >= 1440) baseSize = Math.min(baseSize + 2, 22); // Very tall displays
            else if (height >= 1080) baseSize = Math.min(baseSize + 1, 20); // Tall displays
            else if (height < 600) baseSize = Math.max(baseSize - 1, 11); // Short displays

            // Additional zoom-level detection (larger viewport = likely zoomed out)
            const viewportArea = width * height;
            if (viewportArea > 4000000) { // Very large viewport area
                baseSize = Math.min(baseSize + 1, 22);
            }

            return baseSize;
        };

        const updateDimensions = () => {
            setEditorHeight(`${calculateHeight()}px`);
            setFontSize(calculateFontSize());
        };

        // Set initial dimensions
        updateDimensions();

        // Update on window resize
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    const handleFormat = () => {
        try {
            // Parse and stringify with proper indentation
            const parsed = JSON.parse(inputJSON);
            const formatted = JSON.stringify(parsed, null, 2);
            setFormattedJSON(formatted);
        } catch (error) {
            setFormattedJSON(`Error: ${(error as Error).message}`);
        }
    };

    const handleClear = () => {
        setInputJSON('');
        setFormattedJSON('');
    };

    return (
        <>
            <Header />
            {/* Main Tool Content */}
            <div className="flex-1 bg-background w-full h-full">
                <div className="mx-auto px-4 md:px-10  py-8">
                    {/* JSON Editor */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
                        <div className="flex flex-col">
                            <div className="border border-border/50 rounded-lg overflow-hidden shadow-sm" style={{ height: editorHeight }}>
                                <div className="bg-[#282c34] p-2 flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={handleClear}
                                        className="px-3 py-1.5 h-8 text-sm"
                                        size="sm"
                                    >
                                        <BrushCleaning className="w-3.5 h-3.5 mr-1.5" />
                                        Clear
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => navigator.clipboard.writeText(inputJSON)}
                                        className="px-3 py-1.5 h-8 text-sm"
                                        size="sm"
                                    >
                                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                                        Copy
                                    </Button>
                                </div>
                                <CodeMirror
                                    value={inputJSON}
                                    height={`calc(${editorHeight} - 40px)`}
                                    extensions={[json()]}
                                    onChange={setInputJSON}
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
                                JSON Input
                            </div>
                        </div>

                        {/* Format Button Between Editors */}
                        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 transform -mt-8">
                            <Button
                                onClick={handleFormat}
                                className="px-6 py-2.5 font-medium rounded-full shadow-md"
                            >
                                <ArrowRightLeft className="w-4 h-4 mr-2" />
                                Format
                            </Button>
                        </div>

                        <div className="flex flex-col">
                            <div className="border border-border/50 rounded-lg overflow-hidden shadow-sm" style={{ height: editorHeight }}>
                                <div className="bg-[#282c34] p-2 flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setFormattedJSON('')}
                                        className="px-3 py-1.5 h-8 text-sm"
                                        size="sm"
                                    >
                                        <BrushCleaning className="w-3.5 h-3.5 mr-1.5" />
                                        Clear
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => navigator.clipboard.writeText(formattedJSON)}
                                        className="px-3 py-1.5 h-8 text-sm"
                                        size="sm"
                                    >
                                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                                        Copy
                                    </Button>
                                </div>
                                <CodeMirror
                                    value={formattedJSON}
                                    height={`calc(${editorHeight} - 40px)`}
                                    extensions={[json()]}
                                    readOnly
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
                                Formatted JSON
                            </div>
                        </div>
                    </div>
                    {/* Mobile Format Button */}
                    <div className="flex lg:hidden justify-center mb-6">
                        <Button
                            onClick={handleFormat}
                            className="px-6 py-2.5 font-medium"
                        >
                            <ArrowRightLeft className="w-4 h-4 mr-2" />
                            Format
                        </Button>
                    </div>
                </div>
            </div>

            {/* Examples Section */}
            <Examples examples={examples} />

            {/* FAQs Section */}
            <FAQs faqs={faqs} />
        </>
    );
}
