"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Copy, BrushCleaning } from "lucide-react";
import FAQ, { FAQProps } from "../../(components)/FAQ";
import Example, { ExampleProps } from "../../(components)/Example";
import * as Diff from "diff";

const faqs = [
    {
        id: "1",
        title: "What makes this code comparator different from others?",
        content:
            "This code comparator prioritizes privacy and simplicity. It processes your code entirely client-side without storing any data, provides instant difference detection without requiring accounts or uploads, and is completely free and open source.",
    },
    {
        id: "2",
        title: "Is my code stored or saved anywhere?",
        content:
            "No, absolutely not. This comparator processes everything locally in your browser. Your code never leaves your device, ensuring complete privacy and security of your sensitive data.",
    },
    {
        id: "3",
        title: "Can I compare large code files?",
        content:
            "Yes, the comparator can handle large code files efficiently. Since it runs entirely in your browser without network requests, comparison speed depends only on your device's performance.",
    },
    {
        id: "4",
        title: "What types of differences can the tool detect?",
        content:
            "The comparator detects line additions, removals, and modifications, with clear visual indicators for each type of change. It can also highlight character-level differences within modified lines.",
    },
    {
        id: "5",
        title: "Can I customize the comparison view?",
        content:
            "Currently, the comparator uses a standard side-by-side view. Future versions may include configurable options for unified diffs and other viewing preferences.",
    },
    {
        id: "6",
        title: "How accurate is the difference detection?",
        content:
            "The comparator uses an advanced algorithm to accurately detect even subtle changes between code versions, providing reliable line-by-line and character-level comparisons.",
    }
]

const examples = [
    {
        title: "Code Review & Bug Fixing",
        description: "Compare code versions to identify bugs and review changes before merging.",
        list: [
            {
                title: "Before",
                content: "Unformatted code with bug fixes and improvements mixed together, making it difficult to isolate changes that fixed specific issues."
            },
            {
                title: "After",
                content: "Clear visualization of exactly what changed between versions, with added, removed, and modified lines highlighted differently for easy review."
            },
        ],
        bottomdesc: "Quickly identify what changed between versions, making code reviews and bug fixing significantly more efficient."
    },
    {
        title: "Collaborative Development",
        description: "Track changes between different developers' contributions for better collaboration.",
        list: [
            {
                title: "Before",
                content: "Manually tracking changes across different developer versions with no clear way to see what each person contributed to the codebase."
            },
            {
                title: "After",
                content: "Side-by-side comparison showing exactly what each developer changed, with clear highlighting of additions, removals, and modifications."
            },
        ],
        bottomdesc: "Facilitate better team collaboration by clearly visualizing each contributor's changes to the shared codebase."
    },
    {
        title: "Version Comparison",
        description: "Compare different versions of your code to track evolution and changes.",
        list: [
            {
                title: "Before",
                content: "Difficulty understanding what changed between software versions with no easy way to visualize the evolution of code over time."
            },
            {
                title: "After",
                content: "Clear side-by-side comparison of different versions with highlighted differences showing the progression and improvements."
            },
        ],
        bottomdesc: "Track the evolution of your code through different versions with visual highlighting of all changes between iterations."
    },
    {
        title: "Learning & Code Analysis",
        description: "Compare different approaches to solving the same problem.",
        list: [
            {
                title: "Before",
                content: "Struggling to understand different algorithms or implementation approaches by looking at complete solutions separately."
            },
            {
                title: "After",
                content: "Side-by-side comparison highlighting the structural and logical differences between different approaches to the same problem."
            },
        ],
        bottomdesc: "Improve your understanding of different coding approaches and algorithms by visually comparing alternative implementations."
    }
]

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
                <h1 className="text-2xl md:text-3xl font-bold text-center text-foreground">Code Comparator</h1>
                <p className="text-sm text-muted-foreground text-center">Compare code versions and visualize differences with line-by-line analysis.</p>
            </div>
        </div>
    )
}

export default function Content() {
    const [originalCode, setOriginalCode] = useState('function calculateTotal(items) {\n  let sum = 0;\n  for (let i = 0; i < items.length; i++) {\n    sum += items[i].price;\n  }\n  return sum;\n}');
    const [modifiedCode, setModifiedCode] = useState('function calculateTotal(items) {\n  // Calculate the total price of all items\n  return items.reduce((sum, item) => {\n    return sum + item.price;\n  }, 0);\n}');
    const [isLoading, setIsLoading] = useState(false);
    const [editorHeight, setEditorHeight] = useState('400px');
    const [diffHeight, setDiffHeight] = useState('300px');
    const [fontSize, setFontSize] = useState(14);

    // Calculate responsive heights and font sizes based on viewport size
    useEffect(() => {
        const calculateDimensions = () => {
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;

            // Base calculations
            const headerHeight = 120; // Header + padding
            const sectionPadding = 64; // Padding between sections
            const bottomSections = 200; // Space for examples/FAQs
            const availableHeight = viewportHeight - headerHeight - sectionPadding - bottomSections;

            // Responsive height calculation
            let editorHeight, diffHeight;

            if (viewportWidth >= 2560) { // 4K and ultra-wide displays
                editorHeight = Math.max(600, Math.min(availableHeight * 0.4, 800));
                diffHeight = Math.max(400, Math.min(availableHeight * 0.3, 600));
            } else if (viewportWidth >= 1920) { // Large displays
                editorHeight = Math.max(500, Math.min(availableHeight * 0.45, 700));
                diffHeight = Math.max(350, Math.min(availableHeight * 0.35, 500));
            } else if (viewportWidth >= 1440) { // Medium-large displays
                editorHeight = Math.max(450, Math.min(availableHeight * 0.5, 650));
                diffHeight = Math.max(300, Math.min(availableHeight * 0.4, 450));
            } else { // Smaller displays
                editorHeight = Math.max(400, Math.min(availableHeight * 0.55, 600));
                diffHeight = Math.max(250, Math.min(availableHeight * 0.45, 400));
            }

            // Additional height boost for very tall displays
            if (viewportHeight >= 1440) {
                editorHeight += 100;
                diffHeight += 80;
            } else if (viewportHeight >= 1080) {
                editorHeight += 50;
                diffHeight += 40;
            }

            // Responsive font size calculation
            let baseFontSize = 14;

            if (viewportWidth >= 3840) { // 4K ultra-wide displays
                baseFontSize = 20;
            } else if (viewportWidth >= 2560) { // 4K and ultra-wide displays
                baseFontSize = 18;
            } else if (viewportWidth >= 1920) { // Large displays
                baseFontSize = 16;
            } else if (viewportWidth >= 1440) { // Medium-large screens
                baseFontSize = 15;
            } else if (viewportWidth >= 1024) { // Medium screens
                baseFontSize = 14;
            } else if (viewportWidth >= 768) { // Small-medium screens
                baseFontSize = 13;
            } else { // Mobile screens
                baseFontSize = 12;
            }

            // Additional font size adjustments for very large displays
            if (viewportHeight >= 1440) {
                baseFontSize = Math.min(baseFontSize + 2, 22);
            } else if (viewportHeight >= 1080) {
                baseFontSize = Math.min(baseFontSize + 1, 20);
            }

            // Additional zoom-level detection (larger viewport = likely zoomed out)
            const viewportArea = viewportWidth * viewportHeight;
            if (viewportArea > 4000000) { // Very large viewport area
                baseFontSize = Math.min(baseFontSize + 1, 22);
            }

            setEditorHeight(`${editorHeight}px`);
            setDiffHeight(`${diffHeight}px`);
            setFontSize(baseFontSize);
        };

        // Set initial dimensions
        calculateDimensions();

        // Update on window resize
        window.addEventListener('resize', calculateDimensions);
        return () => window.removeEventListener('resize', calculateDimensions);
    }, []);

    // Calculate diff using jsdiff library
    const diffResult = useMemo(() => {
        const trimmedOriginal = originalCode.trim();
        const trimmedModified = modifiedCode.trim();

        if (!trimmedOriginal && !trimmedModified) {
            return { lines: [], stats: { added: 0, removed: 0, modified: 0 }, characterDiff: null };
        }

        setIsLoading(true);

        try {
            const diff = Diff.diffLines(originalCode, modifiedCode);
            const lines: Array<{ number: number; content: string; type: 'added' | 'removed' | 'unchanged' }> = [];
            let lineNumber = 1;
            const stats = { added: 0, removed: 0, modified: 0 };

            diff.forEach((part: Diff.Change) => {
                const text = part.value;
                const lineCount = (text.match(/\n/g) || []).length;

                if (part.added) {
                    stats.added += lineCount || (text.length > 0 ? 1 : 0);
                    const textLines = text.split('\n');
                    textLines.forEach((line: string, index: number) => {
                        if (index < textLines.length - 1 || (index === textLines.length - 1 && line.length > 0)) {
                            lines.push({
                                number: lineNumber++,
                                content: line,
                                type: 'added'
                            });
                        }
                    });
                } else if (part.removed) {
                    stats.removed += lineCount || (text.length > 0 ? 1 : 0);
                    const textLines = text.split('\n');
                    textLines.forEach((line: string, index: number) => {
                        if (index < textLines.length - 1 || (index === textLines.length - 1 && line.length > 0)) {
                            lines.push({
                                number: lineNumber,
                                content: line,
                                type: 'removed'
                            });
                        }
                    });
                } else {
                    const textLines = text.split('\n');
                    textLines.forEach((line: string, index: number) => {
                        if (index < textLines.length - 1 || (index === textLines.length - 1 && line.length > 0)) {
                            lines.push({
                                number: lineNumber++,
                                content: line,
                                type: 'unchanged'
                            });
                        }
                    });
                }
            });

            // Character-level diff for modified lines
            const characterDiff = Diff.diffChars(originalCode, modifiedCode);
            let hasCharacterChanges = false;

            characterDiff.forEach((part: Diff.Change) => {
                if (part.added || part.removed) {
                    hasCharacterChanges = true;
                    if (part.added || part.removed) stats.modified++;
                }
            });

            setTimeout(() => setIsLoading(false), 100);

            return { lines, stats, characterDiff: hasCharacterChanges ? characterDiff : null };
        } catch (error) {
            console.error('Diff calculation error:', error);
            setIsLoading(false);
            return { lines: [], stats: { added: 0, removed: 0, modified: 0 }, characterDiff: null };
        }
    }, [originalCode, modifiedCode]);

    const handleCopy = useCallback((text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            // Could add a toast notification here
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }, []);

    const handleClear = useCallback(() => {
        setOriginalCode('');
        setModifiedCode('');
    }, []);

    const renderDiffViewer = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center h-full px-1 bg-card" style={{ minHeight: diffHeight }}>
                    <div className="text-muted-foreground">Calculating differences...</div>
                </div>
            );
        }

        const trimmedOriginal = originalCode.trim();
        const trimmedModified = modifiedCode.trim();

        if (!trimmedOriginal && !trimmedModified) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground mx-1 bg-card" style={{ minHeight: diffHeight }}>
                    <div className="text-4xl mb-2">⚖️</div>
                    <div className="text-lg font-medium">No code to compare</div>
                    <div className="text-sm mt-2">
                        Enter code in both panels above to see the differences
                    </div>
                </div>
            );
        }

        if (diffResult.characterDiff) {
            return (
                <div className="p-4 h-full overflow-auto bg-card" style={{ minHeight: diffHeight, maxHeight: `calc(${diffHeight} + 200px)` }}>
                    <div className="flex items-start">
                        <div className="w-8 text-right mr-4 text-muted-foreground select-none font-mono" style={{ fontSize: `${fontSize}px` }}>1</div>
                        <div className="flex-1 font-mono whitespace-pre-wrap" style={{ fontSize: `${fontSize}px` }}>
                            {diffResult.characterDiff.map((part: Diff.Change, index: number) => {
                                if (part.added) {
                                    return (
                                        <span key={index} className="bg-green-600/20 text-green-400">
                                            {part.value}
                                        </span>
                                    );
                                } else if (part.removed) {
                                    return (
                                        <span key={index} className="bg-red-600/20 text-red-400 line-through">
                                            {part.value}
                                        </span>
                                    );
                                } else {
                                    return (
                                        <span key={index} className="text-foreground">
                                            {part.value}
                                        </span>
                                    );
                                }
                            })}
                        </div>
                    </div>
                </div >
            );
        }

        return (
            <div className="p-4 h-full overflow-auto" style={{ minHeight: diffHeight, maxHeight: `calc(${diffHeight} + 200px)` }}>
                <div className="text-muted-foreground text-center">
                    No character-level differences detected
                </div>
            </div>
        );
    };

    return (
        <>
            <Header />
            {/* Main Tool Content */}
            <div className="flex-1 bg-background w-full h-full">
                <div className="mx-auto px-4 md:px-10 py-8">
                    {/* Code Input Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Original Code */}
                        <div className="flex flex-col">
                            <div className="border border-border/50 rounded-lg overflow-hidden shadow-sm">
                                <div className="bg-card p-2 mx-1 flex justify-between items-center">
                                    <span className="text-white text-sm font-medium">Original Code</span>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleCopy(originalCode)}
                                        className="px-3 py-1.5 h-8 text-sm"
                                        size="sm"
                                        disabled={!originalCode}
                                    >
                                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                                        Copy
                                    </Button>
                                </div>
                                <div className="p-1">
                                    <textarea
                                        className="w-full p-2 bg-card text-foreground font-mono border-none resize-none focus:outline-none focus:ring-2 focus:ring-ring rounded"
                                        style={{ height: editorHeight, fontSize: `${fontSize}px` }}
                                        placeholder="Paste your original code here..."
                                        value={originalCode}
                                        onChange={(e) => setOriginalCode(e.target.value)}
                                        spellCheck={false}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modified Code */}
                        <div className="flex flex-col">
                            <div className="border border-border/50 rounded-lg overflow-hidden shadow-sm">
                                <div className="bg-card p-2 mx-1 flex justify-between items-center">
                                    <span className="text-white text-sm font-medium">Modified Code</span>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleCopy(modifiedCode)}
                                        className="px-3 py-1.5 h-8 text-sm"
                                        size="sm"
                                        disabled={!modifiedCode}
                                    >
                                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                                        Copy
                                    </Button>
                                </div>
                                <div className="p-1">
                                    <textarea
                                        className="w-full p-2 bg-card text-foreground font-mono border-none resize-none focus:outline-none focus:ring-2 focus:ring-ring rounded"
                                        style={{ height: editorHeight, fontSize: `${fontSize}px` }}
                                        placeholder="Paste your modified code here..."
                                        value={modifiedCode}
                                        onChange={(e) => setModifiedCode(e.target.value)}
                                        spellCheck={false}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Diff Viewer Section */}
                    <div className="border border-border/50 rounded-lg overflow-hidden shadow-sm mb-16">
                        <div className="bg-card p-2  flex justify-between items-center w-full">
                            <div className="text-white font-medium">Differences</div>

                            <Button
                                variant="outline"
                                onClick={handleClear}
                                className="px-3 py-1.5 h-8 text-sm ml-4"
                                size="sm"
                                disabled={!originalCode && !modifiedCode}
                            >
                                <BrushCleaning className="w-3.5 h-3.5 mr-1.5" />
                                Clear All
                            </Button>
                            
                        </div>
                        <div className="bg-card text-white p-1">
                            {renderDiffViewer()}
                            <div className="flex items-center justify-end gap-4 pr-4 pb-4">
                                <div className="text-green-500 text-xs md:text-sm flex items-center">
                                    <span className="w-2 h-2 md:w-3 md:h-3 inline-block bg-green-500 rounded-full mr-1.5 opacity-70"></span>
                                    + {diffResult.stats.added} lines
                                </div>
                                <div className="text-red-500 text-xs md:text-sm flex items-center">
                                    <span className="w-2 h-2 md:w-3 md:h-3 inline-block bg-red-500 rounded-full mr-1.5 opacity-70"></span>
                                    - {diffResult.stats.removed} lines
                                </div>
                                <div className="text-yellow-500 text-xs md:text-sm flex items-center">
                                    <span className="w-2 h-2 md:w-3 md:h-3 inline-block bg-yellow-500 rounded-full mr-1.5 opacity-70"></span>
                                    ~ {diffResult.stats.modified} changes
                                </div>
                            </div>
                        </div>
                        
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

