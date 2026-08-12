"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";
import {
    Copy, BrushCleaning, Upload, Search, ChevronsDownUp, ChevronsUpDown,
    CircleAlert, Check, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseJsonLoose } from "@/lib/converter/parse";
import JsonTree, {
    TreeState, ROOT_PATH, collectContainerPaths, collectMatches, isContainer,
} from "./JsonTree";
import FAQ, { FAQProps } from "../../(components)/FAQ";
import Example, { ExampleProps } from "../../(components)/Example";
import RelatedTools from "../../(components)/RelatedTools";
import KeyboardShortcutHint from "../../(components)/KeyboardShortcutHint";
import ToolHeader from "../../(components)/ToolHeader";

const SAMPLE = `{
  "id": "ord_8213",
  "status": "shipped",
  "total": 149.99,
  "paid": true,
  "coupon": null,
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "address": { "city": "Austin", "country": "US", "zip": "78701" }
  },
  "items": [
    { "sku": "TS-001", "title": "T-shirt", "qty": 2, "price": 24.5 },
    { "sku": "MG-114", "title": "Mug", "qty": 1, "price": 12.0 }
  ],
  "tags": ["priority", "gift"]
}`;

/** Node and depth counts, shown so you can size up an unfamiliar payload. */
function measure(value: unknown): { nodes: number; depth: number } {
    let nodes = 0;
    let depth = 0;

    const walk = (node: unknown, level: number) => {
        nodes++;
        if (level > depth) depth = level;
        if (isContainer(node)) {
            for (const child of Object.values(node)) walk(child, level + 1);
        }
    };

    walk(value, 1);
    return { nodes, depth };
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const faqs: FAQProps[] = [
    {
        id: "1",
        title: "Is my JSON uploaded to a server?",
        content:
            "No. The file is read and rendered by your own browser - there is no upload and no network request, so even a file full of production data never leaves your machine. It keeps working offline once the page has loaded.",
    },
    {
        id: "2",
        title: "How large a JSON file can it open?",
        content:
            "Multi-megabyte files are fine. Only the branches you actually expand are rendered, and long arrays are drawn in batches with a 'show more' control, so opening a big file does not try to paint hundreds of thousands of rows at once.",
    },
    {
        id: "3",
        title: "Can I search inside the JSON?",
        content:
            "Yes. The search box matches both keys and values, keeps the branches that contain a hit, opens them automatically and highlights the matching text. Clear the box to go back to the tree as you left it.",
    },
    {
        id: "4",
        title: "How do I get the path to a value?",
        content:
            "Hover any row and click the link icon next to it. That copies the JSONPath for the value, like $.customer.address.city or $.items[0].sku, which you can paste into jq, a JSONPath query or your own code.",
    },
    {
        id: "5",
        title: "Does it accept JSON that is not quite valid?",
        content:
            "Yes. Single quotes, unquoted keys, trailing commas and comments all work, as do Python dicts, PHP arrays and Ruby hashes - useful when you are looking at something a log printed rather than a real API response.",
    },
    {
        id: "6",
        title: "Can I open a .json file from my computer?",
        content:
            "Yes. Use the Upload button or drag the file onto the left pane. The file is read locally with the browser's file reader; nothing is sent anywhere.",
    },
];

const examples: ExampleProps[] = [
    {
        title: "Inspecting an unfamiliar API response",
        description:
            "A response you have never seen before is hard to read as raw text, especially when the interesting field is buried four levels down.",
        list: [
            {
                title: "Before",
                content:
                    "Scrolling a wall of minified JSON, counting brackets to work out which object a field belongs to, and losing your place every time you scroll.",
            },
            {
                title: "After",
                content:
                    "A collapsible tree where you can close the noise, open only the branch you care about, and copy the exact path to the field you need.",
            },
        ],
        bottomdesc: "The fastest way to understand the shape of a payload you did not design.",
    },
    {
        title: "Finding a value in a large export",
        description:
            "Data exports and log dumps are often megabytes of JSON where you need one record out of thousands.",
        list: [
            {
                title: "Before",
                content:
                    "Ctrl+F in a text editor, landing on dozens of irrelevant matches with no idea which record each one belongs to.",
            },
            {
                title: "After",
                content:
                    "Search filters the tree to the branches that actually contain the hit, with the surrounding structure intact so you can see which record it came from.",
            },
        ],
        bottomdesc: "Works on files far too big to read top to bottom.",
    },
];

const relatedTools = [
    {
        title: "JSON Formatter",
        description: "Format, validate and beautify JSON with syntax highlighting.",
        link: "/json-code-formatter",
    },
    {
        title: "Object to JSON Converter",
        description: "Convert between JSON, JavaScript, Python, PHP and Ruby objects.",
        link: "/object-to-json",
    },
    {
        title: "Code Comparator",
        description: "Compare two code versions side by side with difference highlighting.",
        link: "/code-comparator",
    },
];

export default function Content() {
    const [input, setInput] = useState(SAMPLE);
    const [parsed, setParsed] = useState<{ value: unknown } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<Set<string>>(new Set([ROOT_PATH]));
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [notice, setNotice] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const [copied, setCopied] = useState(false);
    const [paneHeight, setPaneHeight] = useState("600px");
    const fileInput = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const update = () => {
            const available = window.innerHeight - 320;
            setPaneHeight(`${Math.max(Math.min(available, window.innerHeight * 0.75), 480)}px`);
        };
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    // Parsing is debounced so typing in a large document stays smooth.
    useEffect(() => {
        const timer = setTimeout(() => {
            if (input.trim() === "") {
                setParsed(null);
                setError(null);
                return;
            }
            try {
                const { value } = parseJsonLoose(input);
                setParsed({ value });
                setError(null);
            } catch (parseError) {
                setParsed(null);
                setError((parseError as Error).message);
            }
        }, 250);
        return () => clearTimeout(timer);
    }, [input]);

    useEffect(() => {
        const timer = setTimeout(() => setSearch(searchInput.trim().toLowerCase()), 200);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const stats = useMemo(
        () => (parsed ? { ...measure(parsed.value), bytes: new Blob([input]).size } : null),
        [parsed, input]
    );

    const matches = useMemo(
        () => (parsed && search ? collectMatches(parsed.value, search) : null),
        [parsed, search]
    );

    const toggle = useCallback((path: string) => {
        setExpanded((current) => {
            const next = new Set(current);
            if (next.has(path)) next.delete(path);
            else next.add(path);
            return next;
        });
    }, []);

    const treeState: TreeState = {
        expanded,
        toggle,
        search,
        visible: matches ? matches.visible : null,
    };

    const expandAll = () => {
        if (!parsed) return;
        const { paths, capped } = collectContainerPaths(parsed.value);
        setExpanded(new Set(paths));
        setNotice(
            capped
                ? `Expanded the first ${paths.length.toLocaleString()} branches - expand the rest as you go`
                : null
        );
    };

    const collapseAll = () => {
        setExpanded(new Set([ROOT_PATH]));
        setNotice(null);
    };

    const readFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            setInput(String(reader.result ?? ""));
            setExpanded(new Set([ROOT_PATH]));
            setNotice(`Loaded ${file.name} (${formatBytes(file.size)})`);
        };
        reader.onerror = () => setNotice(`Could not read ${file.name}`);
        reader.readAsText(file);
    };

    const download = () => {
        if (!parsed) return;
        const blob = new Blob([JSON.stringify(parsed.value, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "data.json";
        link.click();
        URL.revokeObjectURL(url);
    };

    const copyJson = () => {
        if (!parsed) return;
        navigator.clipboard.writeText(JSON.stringify(parsed.value, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <>
            <ToolHeader
                title="JSON Viewer"
                description="View JSON as a collapsible tree, search keys and values, and copy the path to any field. Files stay in your browser."
            />

            <div className="flex-1 bg-background w-full">
                <div className="mx-auto px-4 md:px-10 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Raw JSON, paste or drop a file */}
                        <div className="flex flex-col">
                            <div
                                className={`border rounded-lg overflow-hidden shadow-sm transition-colors ${dragging ? "border-primary border-2" : "border-border/50"}`}
                                style={{ height: paneHeight }}
                                onDragOver={(event) => {
                                    event.preventDefault();
                                    setDragging(true);
                                }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={(event) => {
                                    event.preventDefault();
                                    setDragging(false);
                                    const file = event.dataTransfer.files[0];
                                    if (file) readFile(file);
                                }}
                            >
                                <div className="bg-[#282c34] p-2 flex items-center justify-between gap-2">
                                    <span className="text-xs text-muted-foreground pl-1 truncate">
                                        {dragging ? "Drop the file to open it" : "Paste JSON or drop a .json file"}
                                    </span>
                                    <div className="flex gap-2 shrink-0">
                                        <input
                                            ref={fileInput}
                                            type="file"
                                            accept=".json,.txt,application/json,text/plain"
                                            className="hidden"
                                            onChange={(event) => {
                                                const file = event.target.files?.[0];
                                                if (file) readFile(file);
                                                event.target.value = "";
                                            }}
                                        />
                                        <Button
                                            variant="outline"
                                            onClick={() => fileInput.current?.click()}
                                            className="px-3 py-1.5 h-8 text-sm"
                                            size="sm"
                                        >
                                            <Upload className="w-3.5 h-3.5 mr-1.5" />
                                            Upload
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setInput("");
                                                setNotice(null);
                                                setSearchInput("");
                                            }}
                                            className="px-3 py-1.5 h-8 text-sm"
                                            size="sm"
                                        >
                                            <BrushCleaning className="w-3.5 h-3.5 mr-1.5" />
                                            Clear
                                        </Button>
                                    </div>
                                </div>
                                <CodeMirror
                                    value={input}
                                    height={`calc(${paneHeight} - 40px)`}
                                    extensions={[json()]}
                                    onChange={setInput}
                                    theme={oneDark}
                                    basicSetup={{
                                        lineNumbers: true,
                                        foldGutter: true,
                                        highlightActiveLine: true,
                                        highlightSelectionMatches: true,
                                    }}
                                    style={{ fontSize: "13px" }}
                                />
                            </div>
                            <div className="text-sm font-medium mt-3 text-muted-foreground text-center">
                                Raw JSON
                            </div>
                        </div>

                        {/* Tree */}
                        <div className="flex flex-col">
                            <div
                                className="border border-border/50 rounded-lg overflow-hidden shadow-sm flex flex-col"
                                style={{ height: paneHeight }}
                            >
                                <div className="bg-[#282c34] p-2 flex items-center gap-2 flex-wrap">
                                    <div className="relative flex-1 min-w-[140px]">
                                        <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="search"
                                            value={searchInput}
                                            onChange={(event) => setSearchInput(event.target.value)}
                                            placeholder="Search keys and values"
                                            aria-label="Search keys and values"
                                            className="w-full h-8 pl-7 pr-2 text-sm bg-background/40 border border-border/50 rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                    <Button variant="outline" onClick={expandAll} className="px-2 py-1.5 h-8 text-sm" size="sm" title="Expand all">
                                        <ChevronsUpDown className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button variant="outline" onClick={collapseAll} className="px-2 py-1.5 h-8 text-sm" size="sm" title="Collapse all">
                                        <ChevronsDownUp className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button variant="outline" onClick={copyJson} className="px-2 py-1.5 h-8 text-sm" size="sm" title="Copy formatted JSON">
                                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    </Button>
                                    <Button variant="outline" onClick={download} className="px-2 py-1.5 h-8 text-sm" size="sm" title="Download as .json">
                                        <Download className="w-3.5 h-3.5" />
                                    </Button>
                                </div>

                                <div className="flex-1 overflow-auto p-2 text-[13px] bg-[#282c34]">
                                    {error && (
                                        <div className="flex items-start gap-1.5 text-red-400 text-sm p-2">
                                            <CircleAlert className="w-4 h-4 shrink-0 mt-0.5" />
                                            <span>Could not parse: {error}</span>
                                        </div>
                                    )}
                                    {!error && !parsed && (
                                        <div className="text-muted-foreground text-sm p-2">
                                            Paste JSON on the left, or drop a file, to see it as a tree.
                                        </div>
                                    )}
                                    {!error && parsed && search && matches?.count === 0 && (
                                        <div className="text-muted-foreground text-sm p-2">
                                            No key or value matches &quot;{search}&quot;.
                                        </div>
                                    )}
                                    {!error && parsed && <JsonTree value={parsed.value} state={treeState} />}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-3">
                                {stats ? (
                                    <>
                                        <span>{formatBytes(stats.bytes)}</span>
                                        <span>{stats.nodes.toLocaleString()} nodes</span>
                                        <span>depth {stats.depth}</span>
                                        {matches && (
                                            <span>
                                                {matches.count.toLocaleString()}{" "}
                                                {matches.count === 1 ? "match" : "matches"}
                                            </span>
                                        )}
                                        {notice && <span className="text-amber-400">{notice}</span>}
                                    </>
                                ) : (
                                    <span>Tree view</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <KeyboardShortcutHint />

            <div className="w-full py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-foreground">
                        Examples &amp; Use Cases
                    </h2>
                    <Example examples={examples} />
                </div>
            </div>

            <div className="w-full bg-background py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-foreground">
                        Frequently Asked Questions
                    </h2>
                    <FAQ faqs={faqs} />
                </div>
            </div>

            <RelatedTools tools={relatedTools} />
        </>
    );
}
