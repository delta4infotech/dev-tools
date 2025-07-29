"use client";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

import { Copy, RotateCcw, Search, Replace, CaseSensitive, WholeWord, Regex } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import FAQ, { FAQProps } from "../../(components)/FAQ";
import Example, { ExampleProps } from "../../(components)/Example";

const faqs = [
    {
        id: "1",
        title: "How does the highlighting work in real-time?",
        content:
            "The tool uses an overlay system that synchronizes with your text area to highlight matches in real-time as you type. All processing happens locally in your browser for privacy and speed.",
    },
    {
        id: "2",
        title: "Is my text data stored anywhere?",
        content:
            "No, absolutely not. All find and replace operations happen entirely in your browser. Your text never leaves your device, ensuring complete privacy and security.",
    },
    {
        id: "3",
        title: "What regex patterns are supported?",
        content:
            "The tool supports standard JavaScript regex patterns including character classes, quantifiers, groups, and lookaheads. Invalid regex patterns are handled gracefully without breaking the tool.",
    },
    {
        id: "4",
        title: "Can I use this for large text files?",
        content:
            "Yes, the tool is optimized for performance and can handle large text files efficiently. Since everything runs locally, performance depends only on your device capabilities.",
    },
    {
        id: "5",
        title: "What's the difference between 'Replace First' and 'Replace All'?",
        content:
            "'Replace First' replaces only the first match found in your text, while 'Replace All' replaces every occurrence. This gives you precise control over your replacements.",
    },
    {
        id: "6",
        title: "How do the match options work together?",
        content:
            "Match Case makes the search case-sensitive, Match Word finds whole words only, and Use Regex enables pattern matching. These options can be combined for precise searching.",
    },
    {
        id: "7",
        title: "How does multi-line search work?",
        content:
            "Multi-line search allows you to find and replace content that spans multiple lines. Simply paste or type your multi-line pattern in the search field - including actual line breaks. Perfect for finding code blocks, multi-line comments, or any text that spans multiple lines.",
    }
];

const examples = [
    {
        title: "Code Refactoring",
        description: "Rename variables, functions, or update API endpoints across large codebases.",
        list: [
            {
                title: "Before",
                content: "Manually searching through files to find and replace function names, risking missed instances or typos in large codebases."
            },
            {
                title: "After",
                content: "Use regex patterns to find exact matches with word boundaries, ensuring precise replacements without affecting similar names."
            },
        ],
        bottomdesc: "Efficiently refactor code by finding exact variable names and function calls with precision using word matching and regex patterns."
    },
    {
        title: "Multi-line Code Patterns",
        description: "Find and replace multi-line code blocks, function definitions, or structured text.",
        list: [
            {
                title: "Before",
                content: "Struggling to find and replace code blocks that span multiple lines, like function definitions or comment blocks."
            },
            {
                title: "After",
                content: "Simply copy the exact multi-line pattern (including line breaks) into the search field to find and replace entire code blocks, comments, or structured text."
            },
        ],
        bottomdesc: "Handle complex multi-line patterns for code refactoring, comment updates, and structured text transformations with ease."
    },
    {
        title: "Text Processing & Cleanup",
        description: "Clean up formatted text, remove unwanted characters, or standardize formatting.",
        list: [
            {
                title: "Before",
                content: "Inconsistent formatting with mixed spaces, tabs, and line breaks making text difficult to process or read properly."
            },
            {
                title: "After",
                content: "Use regex patterns to find and replace multiple spaces with single spaces, standardize line breaks, and clean up formatting consistently."
            },
        ],
        bottomdesc: "Streamline text processing with regex patterns to clean, format, and standardize large amounts of text efficiently."
    },
    {
        title: "Data Transformation",
        description: "Convert data formats, update URLs, or transform CSV/JSON structures.",
        list: [
            {
                title: "Before",
                content: "Manually updating hundreds of URLs or data field names in configuration files, prone to human error and very time-consuming."
            },
            {
                title: "After",
                content: "Use precise pattern matching to update URL schemes, transform field names, or convert between data formats with confidence."
            },
        ],
        bottomdesc: "Transform data structures and formats quickly using powerful find and replace with regex support for complex pattern matching."
    },
    {
        title: "Content Management",
        description: "Update documentation, change terminology, or modify large text documents.",
        list: [
            {
                title: "Before",
                content: "Updating product names or terminology across multiple documents manually, missing instances and creating inconsistencies."
            },
            {
                title: "After",
                content: "Use word matching to ensure you're replacing complete terms only, avoiding partial matches that could break context."
            },
        ],
        bottomdesc: "Maintain consistency in documentation and content by using word boundaries and case-sensitive matching for precise updates."
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
                <h1 className="text-2xl md:text-3xl font-bold text-center text-foreground">Find & Replace Tool</h1>
                <p className="text-sm text-muted-foreground text-center">Powerful text search and replace with regex support, highlighting, and advanced options.</p>
            </div>
        </div>
    )
}

interface MatchResult {
    count: number;
    highlightedContent: string;
}

export default function Content() {
    const [content, setContent] = useState(`// Find & Replace Testing Examples

// 1. MATCH CASE Testing:
const user = "john";
const User = "ADMIN";
const USER_ID = 12345;
const userProfile = { name: "Jane" };

// Try searching "user" with Match Case ON/OFF

// 2. MATCH WORD Testing:
const sum = 100;
const summary = "Monthly report";
const consume = true;
const assumption = "test";

// Try searching "sum" with Match Word ON/OFF

// 3. MULTI-LINE Testing Examples:
const user = "john";
const User = "ADMIN";

function oldFunction() {
    console.log("This is old");
    return true;
}

function anotherOldFunction() {
    console.log("Another old one");
    return false;
}

/* Multi-line comment
   that spans multiple
   lines for testing */

// Try these multi-line patterns:
// Copy this exactly (including line breaks):
const user = "john";
const User = "ADMIN";

// Or this function block:
function oldFunction() {
    console.log("This is old");
    return true;
}

// 4. REGEX Testing Examples:
const phone1 = "123-456-7890";
const phone2 = "(555) 123-4567";
const email1 = "test@example.com";
const email2 = "admin@company.org";

// Try these regex patterns:
// \\d{3}-\\d{3}-\\d{4}  (matches 123-456-7890)
// \\w+@\\w+\\.\\w+      (matches emails)
// \\b[A-Z]+\\b          (matches all-caps words)

// 5. Combined Testing:
const data = {
  id: 1,
  ID: 2,
  dataId: 3,
  myDataObject: "test"
};

// Try "id" with different combinations:
// Match Case OFF + Match Word OFF = finds all
// Match Case ON + Match Word ON = finds only exact "id"`);
    const [findText, setFindText] = useState('');
    const [replaceText, setReplaceText] = useState('');
    const [matchCase, setMatchCase] = useState(false);
    const [matchWord, setMatchWord] = useState(false);
    const [useRegex, setUseRegex] = useState(false);

    const [editorHeight, setEditorHeight] = useState('400px');
    const [fontSize, setFontSize] = useState(14);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    // Calculate responsive heights and font sizes based on viewport size
    useEffect(() => {
        const calculateDimensions = () => {
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;

            // Base calculations
            const headerHeight = 120; // Header + padding
            const controlsHeight = 200; // Search controls section
            const statusHeight = 60; // Status section
            const bottomSections = 200; // Space for examples/FAQs
            const availableHeight = viewportHeight - headerHeight - controlsHeight - statusHeight - bottomSections;

            // Responsive height calculation
            let editorHeight;

            if (viewportWidth >= 2560) { // 4K and ultra-wide displays
                editorHeight = Math.max(600, Math.min(availableHeight * 0.6, 900));
            } else if (viewportWidth >= 1920) { // Large displays
                editorHeight = Math.max(500, Math.min(availableHeight * 0.65, 800));
            } else if (viewportWidth >= 1440) { // Medium-large displays
                editorHeight = Math.max(450, Math.min(availableHeight * 0.7, 700));
            } else { // Smaller displays
                editorHeight = Math.max(400, Math.min(availableHeight * 0.75, 600));
            }

            // Additional height boost for very tall displays
            if (viewportHeight >= 1440) {
                editorHeight += 100;
            } else if (viewportHeight >= 1080) {
                editorHeight += 50;
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
            setFontSize(baseFontSize);
        };

        // Set initial dimensions
        calculateDimensions();

        // Update on window resize
        window.addEventListener('resize', calculateDimensions);
        return () => window.removeEventListener('resize', calculateDimensions);
    }, []);

    // Helper function to build regex based on options
    const buildRegex = useCallback((searchText: string): RegExp | null => {
        if (!searchText) return null;

        try {
            let pattern = searchText;

            // If not using regex, escape special characters but preserve newlines
            if (!useRegex) {
                pattern = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                // Don't escape newlines - we want them to match literally
            }

            // Add word boundaries if match word is enabled
            if (matchWord) {
                pattern = `\\b${pattern}\\b`;
            }

            // Build flags
            let flags = 'g';
            if (!matchCase) {
                flags += 'i';
            }
            // Always add 's' flag to make . match newlines for multi-line patterns
            flags += 's';

            return new RegExp(pattern, flags);
        } catch {
            // Invalid regex, return null
            return null;
        }
    }, [matchWord, matchCase, useRegex]);

    // Calculate matches and create highlighted content
    const matchResult: MatchResult = useMemo(() => {
        if (!findText || !content) {
            return { count: 0, highlightedContent: content };
        }

        const regex = buildRegex(findText);
        if (!regex) {
            return { count: 0, highlightedContent: content };
        }

        // Count matches
        const matches = content.match(regex);
        const count = matches ? matches.length : 0;

        // Create highlighted content for overlay
        if (count > 0) {
            let highlighted = content;
            const parts: string[] = [];
            let lastIndex = 0;
            let match;

            // Reset regex lastIndex
            regex.lastIndex = 0;

            while ((match = regex.exec(content)) !== null) {
                // Add text before match
                if (match.index > lastIndex) {
                    parts.push(content.slice(lastIndex, match.index));
                }

                // Add highlighted match
                parts.push(`<mark class="bg-yellow-300/60 text-yellow-900 dark:bg-yellow-600/40 dark:text-yellow-100">${match[0]}</mark>`);
                lastIndex = match.index + match[0].length;

                // Prevent infinite loop for zero-length matches
                if (match.index === regex.lastIndex) {
                    regex.lastIndex++;
                }
            }

            // Add remaining text
            if (lastIndex < content.length) {
                parts.push(content.slice(lastIndex));
            }

            highlighted = parts.join('');
            return { count, highlightedContent: highlighted };
        }

        return { count: 0, highlightedContent: content };
    }, [content, findText, buildRegex]);

    const handleContentChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(event.target.value);
        // Sync scroll after content change
        setTimeout(handleScroll, 0);
    }, []);

    const handleReplaceFirst = useCallback(() => {
        if (!findText || !content) return;

        const regex = buildRegex(findText);
        if (!regex) return;

        // Remove global flag for single replacement
        const singleRegex = new RegExp(regex.source, regex.flags.replace('g', ''));
        const updatedContent = content.replace(singleRegex, replaceText);
        setContent(updatedContent);
    }, [content, findText, replaceText, buildRegex]);

    const handleReplaceAll = useCallback(() => {
        if (!findText || !content) return;

        const regex = buildRegex(findText);
        if (!regex) return;

        const updatedContent = content.replace(regex, replaceText);
        setContent(updatedContent);
    }, [content, findText, replaceText, buildRegex]);

    const handleReset = useCallback(() => {
        setContent("");
        setFindText("");
        setReplaceText("");
        setMatchCase(false);
        setMatchWord(false);
        setUseRegex(false);
    }, []);

    const handleCopy = useCallback((text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            // Could add a toast notification here
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }, []);

    // Sync scrolling between textarea and overlay
    const handleScroll = useCallback(() => {
        if (textareaRef.current && overlayRef.current) {
            const textarea = textareaRef.current;
            const overlay = overlayRef.current;
            overlay.scrollTop = textarea.scrollTop;
            overlay.scrollLeft = textarea.scrollLeft;
        }
    }, []);

    // Effect to sync scroll position on mount and content changes
    useEffect(() => {
        handleScroll();
    }, [matchResult.highlightedContent, handleScroll]);

    const isReplaceDisabled = !findText.trim() || matchResult.count === 0;

    return (
        <TooltipProvider>
            <Header />
            {/* Main Tool Content */}
            <div className="flex-1 bg-background w-full h-full">
                <div className="mx-auto px-4 md:px-10 py-8">
                    {/* Content Section */}
                    <div className="mb-8">
                        <div className="border border-border/50 rounded-lg overflow-hidden shadow-sm">
                            <div className="bg-card p-2 mx-1 flex justify-between items-center">
                                <span className="text-white text-sm font-medium">Content</span>
                                <Button
                                    variant="outline"
                                    onClick={() => handleCopy(content)}
                                    className="px-3 py-1.5 h-8 text-sm"
                                    size="sm"
                                    disabled={!content}
                                >
                                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                                    Copy
                                </Button>
                            </div>
                            <div className="p-1 relative">
                                {/* Highlight overlay */}
                                <div
                                    ref={overlayRef}
                                    className="absolute inset-1 p-2 font-mono pointer-events-none overflow-hidden whitespace-pre-wrap z-10 text-transparent bg-card/50"
                                    style={{
                                        height: editorHeight,
                                        fontSize: `${fontSize}px`,
                                        lineHeight: '1.5',
                                        wordWrap: 'break-word'
                                    }}
                                    dangerouslySetInnerHTML={{ __html: matchResult.highlightedContent }}
                                />
                                <textarea
                                    ref={textareaRef}
                                    className="w-full p-2 bg-card text-foreground font-mono border-none resize-none focus:outline-none focus:ring-2 focus:ring-ring rounded relative z-20"
                                    style={{
                                        height: editorHeight,
                                        fontSize: `${fontSize}px`,
                                        lineHeight: '1.5',
                                        backgroundColor: 'transparent'
                                    }}
                                    placeholder="Paste or type your content here..."
                                    value={content}
                                    onChange={handleContentChange}
                                    onScroll={handleScroll}
                                    spellCheck={false}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Search Controls Section */}
                    <div className="border border-border/50 rounded-lg overflow-hidden shadow-sm mb-16">
                        <div className="bg-card p-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column - Search and Replace Inputs */}
                                <div className="space-y-4">
                                    {/* Find Input with Inline Options */}
                                    <div className="space-y-2 w-full">
                                        <label htmlFor="find-input" className="text-sm font-medium text-foreground flex items-center">
                                            <Search className="w-4 h-4 mr-2" />
                                            Find
                                        </label>
                                        <div className="w-full">
                                            <div className="relative border border-foreground/10 rounded-md w-full">
                                                <textarea
                                                    id="find-input"
                                                    placeholder="Search"
                                                    value={findText}
                                                    onChange={(e) => setFindText(e.target.value)}
                                                    className="font-mono pr-32 w-full min-h-[80px] max-h-[200px] p-3 bg-card text-foreground border-none resize-y focus:outline-none focus:ring-2 focus:ring-ring rounded"
                                                    rows={3}
                                                />
                                                {/* Inline Toggle Options */}
                                                <div className="absolute right-2 top-2 flex items-center gap-1">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                onClick={() => setMatchCase(!matchCase)}
                                                                className={`p-1.5 rounded transition-colors ${matchCase
                                                                    ? 'bg-primary/20 text-primary border border-primary/30'
                                                                    : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                                                    }`}
                                                            >
                                                                <CaseSensitive className="w-5 h-5" />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Match case (Aa)</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                onClick={() => setMatchWord(!matchWord)}
                                                                className={`p-1.5 rounded transition-colors ${matchWord
                                                                    ? 'bg-primary/20 text-primary border border-primary/30'
                                                                    : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                                                    }`}
                                                            >
                                                                <WholeWord className="w-5 h-5" />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Match whole word</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                onClick={() => setUseRegex(!useRegex)}
                                                                className={`p-1.5 rounded transition-colors ${useRegex
                                                                    ? 'bg-primary/20 text-primary border border-primary/30'
                                                                    : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                                                    }`}
                                                            >
                                                                <Regex className="w-5 h-5" />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Use regular expressions (.*)</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Replace Input */}
                                    <div className="space-y-2">
                                        <label htmlFor="replace-input" className="text-sm font-medium text-foreground flex items-center">
                                            <Replace className="w-4 h-4 mr-2" />
                                            Replace with
                                        </label>
                                        <textarea
                                            id="replace-input"
                                            placeholder="Replace"
                                            value={replaceText}
                                            onChange={(e) => setReplaceText(e.target.value)}
                                            className="font-mono border border-foreground/10 rounded-md w-full min-h-[80px] max-h-[200px] p-3 bg-card text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                                            rows={3}
                                        />
                                    </div>
                                </div>

                                {/* Right Column - Actions and Status */}
                                <div className="space-y-4">
                                    {/* Match Count Status */}
                                    <div className="p-3 bg-muted/20 rounded-lg border border-border/30">
                                        <div className="text-sm font-medium text-foreground mb-1">Search Results</div>
                                        <div className="text-lg font-bold">
                                            {matchResult.count > 0 ? (
                                                <span className="text-green-500">{matchResult.count} matches found</span>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    {findText ? "No matches" : "Enter search term"}
                                                </span>
                                            )}
                                        </div>
                                        {matchResult.count > 0 && (
                                            <div className="text-xs text-muted-foreground mt-1">
                                                Real-time highlighting active
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 flex-wrap">
                                        <Button
                                            onClick={handleReplaceFirst}
                                            disabled={isReplaceDisabled}
                                            className="px-4 py-2"
                                            size="sm"
                                        >
                                            Replace First
                                        </Button>
                                        <Button
                                            onClick={handleReplaceAll}
                                            disabled={isReplaceDisabled}
                                            className="px-4 py-2"
                                            size="sm"
                                        >
                                            Replace All
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={handleReset}
                                            className="px-3 py-2"
                                            size="sm"
                                        >
                                            <RotateCcw className="w-4 h-4 mr-1" />
                                            Reset
                                        </Button>
                                    </div>
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
        </TooltipProvider>
    );
}
