"use client";
import { useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { Button } from "@/components/ui/button";
import { oneDark } from "@codemirror/theme-one-dark";
import { Copy, BrushCleaning, ArrowRightLeft } from "lucide-react";
import FAQ, { FAQProps } from "../../(components)/FAQ";
import Example, { ExampleProps } from "../../(components)/Example";
import RelatedTools from "../../(components)/RelatedTools";
import KeyboardShortcutHint from "../../(components)/KeyboardShortcutHint";
import ToolHeader from "../../(components)/ToolHeader";

const faqs: FAQProps[] = [
    {
        id: "1",
        title: "What's the difference between a JS object and JSON?",
        content:
            "JavaScript objects can contain functions, undefined values, and use single quotes. JSON is a strict data format that only supports strings, numbers, booleans, arrays, objects, and null. This tool converts valid JavaScript object literals to proper JSON format.",
    },
    {
        id: "2",
        title: "Is my code stored or saved anywhere?",
        content:
            "No, absolutely not. This converter processes everything locally in your browser. Your JavaScript code never leaves your device, ensuring complete privacy and security.",
    },
    {
        id: "3",
        title: "Can I convert objects with functions?",
        content:
            "Functions and undefined values will be omitted from the JSON output since JSON doesn't support them. Only serializable data (strings, numbers, booleans, arrays, objects, null) will be converted.",
    },
    {
        id: "4",
        title: "What if my JavaScript object is invalid?",
        content:
            "The converter will display an error message if your JavaScript object has syntax errors or can't be evaluated. Make sure to paste valid JavaScript object syntax.",
    },
    {
        id: "5",
        title: "Can I use single quotes in my JS object?",
        content:
            "Yes! JavaScript objects support both single and double quotes. The converter will automatically convert everything to proper JSON format with double quotes.",
    },
    {
        id: "6",
        title: "Does it work with nested objects and arrays?",
        content:
            "Yes, the converter handles deeply nested objects and arrays without any limitations. Complex data structures are fully supported.",
    }
];

const examples: ExampleProps[] = [
    {
        title: "API Response Conversion",
        description: "Convert JavaScript object literals from code to valid JSON for API testing or documentation.",
        list: [
            {
                title: "Before",
                content: "A JavaScript object with single quotes, trailing commas, and mixed formatting that needs to be converted to valid JSON for API requests."
            },
            {
                title: "After",
                content: "A properly formatted JSON string with double quotes, no trailing commas, and correct indentation ready for API consumption."
            },
        ],
        bottomdesc: "Perfect for converting hardcoded JS objects in your code to JSON format for API testing tools like Postman or curl."
    },
    {
        title: "Configuration to JSON",
        description: "Transform JavaScript configuration objects into JSON format for config files.",
        list: [
            {
                title: "Before",
                content: "A JavaScript config object with single quotes and shorthand properties that needs to be converted to a JSON config file."
            },
            {
                title: "After",
                content: "A valid JSON configuration file with proper double quotes and formatting ready to be saved and used in your project."
            },
        ],
        bottomdesc: "Easily convert JavaScript config objects to JSON format for use in package.json, tsconfig.json, or other configuration files."
    },
    {
        title: "Data Export",
        description: "Convert JavaScript object literals to JSON for data export or storage.",
        list: [
            {
                title: "Before",
                content: "JavaScript object data with complex nested structures, arrays, and mixed quote styles that needs to be exported."
            },
            {
                title: "After",
                content: "Clean, valid JSON output with consistent formatting perfect for saving to files or storing in databases."
            },
        ],
        bottomdesc: "Quickly convert data structures from your JavaScript code to JSON format for export, storage, or transmission."
    }
];

const relatedTools = [
    {
        title: "JSON Code Formatter",
        description: "Format and validate JSON with proper indentation and syntax highlighting.",
        link: "/json-code-formatter"
    },
    {
        title: "Base64 Encoder & Decoder",
        description: "Quickly encode and decode Base64 strings for data transmission.",
        link: "/base64-encoder-and-decoder"
    },
    {
        title: "JWT Token Encoder & Decoder",
        description: "Encode and decode JWT tokens with detailed payload inspection.",
        link: "/jwt-token-encoder-and-decoder"
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
    );
};

const Examples = ({ examples }: { examples: ExampleProps[] }) => {
    return (
        <div className="w-full py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-foreground">Examples & Use Cases</h2>
                <Example examples={examples} />
            </div>
        </div>
    );
};

export default function Content() {
    const [inputJS, setInputJS] = useState(`{ name: 'Alice', age: 30, city: 'New York', professions: ['developer', 'musician'] }`);
    const [outputJSON, setOutputJSON] = useState('');
    const [editorHeight, setEditorHeight] = useState('500px');
    const [fontSize, setFontSize] = useState(14);

    // Calculate dynamic height and font size for CodeMirror
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

    const handleConvert = () => {
        try {
            // Wrap the input in parentheses and evaluate it as a JS expression
            // This allows both {key: value} and const obj = {key: value} formats
            let jsObject;

            // Try to evaluate as a direct object literal first
            try {
                jsObject = eval(`(${inputJS})`);
            } catch {
                // If that fails, try evaluating as is (might be a statement)
                jsObject = eval(inputJS);
            }

            // Convert to JSON with formatting
            const jsonOutput = JSON.stringify(jsObject, null, 2);
            setOutputJSON(jsonOutput);
        } catch (error) {
            setOutputJSON(`Error: ${(error as Error).message}\n\nPlease ensure your input is a valid JavaScript object.`);
        }
    };

    const handleClear = () => {
        setInputJS('');
        setOutputJSON('');
    };

    return (
        <>
            <ToolHeader
                title="JS Object to JSON Converter"
                description="Convert JavaScript objects to valid JSON format instantly."
            />
            {/* Main Tool Content */}
            <div className="flex-1 bg-background w-full h-full">
                <div className="mx-auto px-4 md:px-10 py-8">
                    {/* Editor Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
                        {/* Input Editor */}
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
                                        onClick={() => navigator.clipboard.writeText(inputJS)}
                                        className="px-3 py-1.5 h-8 text-sm"
                                        size="sm"
                                    >
                                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                                        Copy
                                    </Button>
                                </div>
                                <CodeMirror
                                    value={inputJS}
                                    height={`calc(${editorHeight} - 40px)`}
                                    extensions={[javascript()]}
                                    onChange={setInputJS}
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
                                JavaScript Object Input
                            </div>
                        </div>

                        {/* Convert Button Between Editors (Desktop) */}
                        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 transform -mt-8">
                            <Button
                                onClick={handleConvert}
                                className="px-6 py-2.5 font-medium rounded-full shadow-md"
                            >
                                <ArrowRightLeft className="w-4 h-4 mr-2" />
                                Convert
                            </Button>
                        </div>

                        {/* Output Editor */}
                        <div className="flex flex-col">
                            <div className="border border-border/50 rounded-lg overflow-hidden shadow-sm" style={{ height: editorHeight }}>
                                <div className="bg-[#282c34] p-2 flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setOutputJSON('')}
                                        className="px-3 py-1.5 h-8 text-sm"
                                        size="sm"
                                    >
                                        <BrushCleaning className="w-3.5 h-3.5 mr-1.5" />
                                        Clear
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => navigator.clipboard.writeText(outputJSON)}
                                        className="px-3 py-1.5 h-8 text-sm"
                                        size="sm"
                                    >
                                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                                        Copy
                                    </Button>
                                </div>
                                <CodeMirror
                                    value={outputJSON}
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
                                JSON Output
                            </div>
                        </div>
                    </div>

                    {/* Mobile Convert Button */}
                    <div className="flex lg:hidden justify-center mb-6">
                        <Button
                            onClick={handleConvert}
                            className="px-6 py-2.5 font-medium"
                        >
                            <ArrowRightLeft className="w-4 h-4 mr-2" />
                            Convert
                        </Button>
                    </div>
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
