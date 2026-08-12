"use client";
import { useState, useEffect, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { Copy, BrushCleaning, ArrowRightLeft, CircleAlert, Info, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseJsonLoose } from "@/lib/converter/parse";
import { serialize, LanguageId } from "@/lib/converter/serialize";
import { LANGUAGES, LANGUAGE_BY_ID, detectLanguage } from "@/lib/converter/languages";

interface ObjectConverterProps {
    /** Starting input, usually a sample in the page's source dialect. */
    initialInput: string;
    /** Output dialect the page opens on. */
    initialTarget: LanguageId;
}

type Status = { type: "error" | "notice"; message: string } | null;

/** Matches the sizing the other editor tools use. */
function useEditorMetrics() {
    const [editorHeight, setEditorHeight] = useState("500px");
    const [fontSize, setFontSize] = useState(14);

    useEffect(() => {
        const calculateHeight = () => {
            const chrome = 80 + 60 + 64 + 64 + 50 + 20; // header, buttons, padding, margin, labels
            const available = window.innerHeight - chrome;

            let minHeight, maxHeightPercent;
            if (window.innerWidth >= 2560) [minHeight, maxHeightPercent] = [1000, 0.85];
            else if (window.innerWidth >= 1920) [minHeight, maxHeightPercent] = [850, 0.8];
            else if (window.innerWidth >= 1440) [minHeight, maxHeightPercent] = [750, 0.75];
            else [minHeight, maxHeightPercent] = [550, 0.75];

            return Math.max(Math.min(available, window.innerHeight * maxHeightPercent), minHeight);
        };

        const calculateFontSize = () => {
            const { innerWidth: width, innerHeight: height } = window;

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

            if (width * height > 4000000) baseSize = Math.min(baseSize + 1, 22);
            return baseSize;
        };

        const update = () => {
            setEditorHeight(`${calculateHeight()}px`);
            setFontSize(calculateFontSize());
        };

        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    return { editorHeight, fontSize };
}

function CopyButton({ value }: { value: string }) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return;
        const timer = setTimeout(() => setCopied(false), 1500);
        return () => clearTimeout(timer);
    }, [copied]);

    return (
        <Button
            variant="outline"
            onClick={() => {
                navigator.clipboard.writeText(value);
                setCopied(true);
            }}
            className="px-3 py-1.5 h-8 text-sm"
            size="sm"
        >
            {copied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
            {copied ? "Copied" : "Copy"}
        </Button>
    );
}

export default function ObjectConverter({ initialInput, initialTarget }: ObjectConverterProps) {
    const [input, setInput] = useState(initialInput);
    const [output, setOutput] = useState("");
    const [target, setTarget] = useState<LanguageId>(initialTarget);
    const [status, setStatus] = useState<Status>(null);
    const { editorHeight, fontSize } = useEditorMetrics();

    const detected = useMemo(() => detectLanguage(input), [input]);

    const convert = (to: LanguageId = target) => {
        try {
            const { value } = parseJsonLoose(input);
            setOutput(serialize(value, to, LANGUAGE_BY_ID[to].indent));
            setStatus(null);
        } catch (error) {
            setOutput("");
            setStatus({ type: "error", message: (error as Error).message });
        }
    };

    const handleTargetChange = (to: LanguageId) => {
        setTarget(to);
        // Keep the output in step with the picker once there is something to show.
        if (output || status) convert(to);
    };

    const handleClear = () => {
        setInput("");
        setOutput("");
        setStatus(null);
    };

    const editorExtensions = (language: LanguageId) => [language === "json" ? json() : javascript()];

    return (
        <div className="flex-1 bg-background w-full h-full">
            <div className="mx-auto px-4 md:px-10 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
                    {/* Input */}
                    <div className="flex flex-col">
                        <div
                            className="border border-border/50 rounded-lg overflow-hidden shadow-sm"
                            style={{ height: editorHeight }}
                        >
                            <div className="bg-[#282c34] p-2 flex items-center justify-between gap-2">
                                <span className="text-xs text-muted-foreground pl-1 truncate">
                                    {detected
                                        ? `Detected: ${LANGUAGE_BY_ID[detected].noun}`
                                        : "Paste JSON, a JS object, a Python dict, a PHP array or a Ruby hash"}
                                </span>
                                <div className="flex gap-2 shrink-0">
                                    <Button
                                        variant="outline"
                                        onClick={handleClear}
                                        className="px-3 py-1.5 h-8 text-sm"
                                        size="sm"
                                    >
                                        <BrushCleaning className="w-3.5 h-3.5 mr-1.5" />
                                        Clear
                                    </Button>
                                    <CopyButton value={input} />
                                </div>
                            </div>
                            <CodeMirror
                                value={input}
                                height={`calc(${editorHeight} - 40px)`}
                                extensions={editorExtensions(detected ?? "javascript")}
                                onChange={setInput}
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
                            Input (auto-detected)
                        </div>
                    </div>

                    {/* Convert button between the editors, desktop only */}
                    <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 transform -mt-8">
                        <Button
                            onClick={() => convert()}
                            className="px-6 py-2.5 font-medium rounded-full shadow-md"
                        >
                            <ArrowRightLeft className="w-4 h-4 mr-2" />
                            Convert
                        </Button>
                    </div>

                    {/* Output */}
                    <div className="flex flex-col">
                        <div
                            className="border border-border/50 rounded-lg overflow-hidden shadow-sm"
                            style={{ height: editorHeight }}
                        >
                            <div className="bg-[#282c34] p-2 flex items-center justify-between gap-2">
                                <div className="min-w-0 flex-1 flex items-center gap-1.5 text-xs pl-1">
                                    {status && (
                                        <>
                                            {status.type === "error" ? (
                                                <CircleAlert className="w-3.5 h-3.5 shrink-0 text-red-400" />
                                            ) : (
                                                <Info className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                                            )}
                                            <span
                                                className={`truncate ${status.type === "error" ? "text-red-400" : "text-amber-400"}`}
                                                title={status.message}
                                            >
                                                {status.type === "error"
                                                    ? `Could not parse: ${status.message}`
                                                    : status.message}
                                            </span>
                                        </>
                                    )}
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <CopyButton value={output} />
                                </div>
                            </div>
                            <CodeMirror
                                value={output}
                                height={`calc(${editorHeight} - 40px)`}
                                extensions={editorExtensions(target)}
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
                        <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                            <span className="text-sm font-medium text-muted-foreground">Convert to</span>
                            {LANGUAGES.map((language) => (
                                <button
                                    key={language.id}
                                    type="button"
                                    onClick={() => handleTargetChange(language.id)}
                                    aria-pressed={target === language.id}
                                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                                        target === language.id
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
                                    }`}
                                >
                                    {language.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Convert button for narrow screens */}
                <div className="flex lg:hidden justify-center mb-6">
                    <Button onClick={() => convert()} className="px-6 py-2.5 font-medium">
                        <ArrowRightLeft className="w-4 h-4 mr-2" />
                        Convert
                    </Button>
                </div>
            </div>
        </div>
    );
}
