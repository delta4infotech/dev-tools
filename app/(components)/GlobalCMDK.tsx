"use client";

import { Input } from "@/components/ui/input";
import { Search, ExternalLink, ArrowDownUp } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { tools } from "../utils/tools";

// interface Tool {
//     title: string;
//     description: string;
//     link: string;
//     keywords?: string[];
// }

export function GlobalCMDK() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const filteredTools = tools.filter(tool => {
        const searchTerms = query.toLowerCase().split(" ");
        const searchableContent = [
            tool.title,
            tool.description,
            ...(tool.keywords || [])
        ].join(" ").toLowerCase();

        return searchTerms.every(term => searchableContent.includes(term));
    });

    const closeModal = () => {
        setIsOpen(false);
        setQuery("");
        setSelectedIndex(0);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsOpen(prev => !prev);
                if (isOpen) {
                    setQuery("");
                    setSelectedIndex(0);
                }
            } else if (e.key === "Escape") {
                closeModal();
            } else if (isOpen) {
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSelectedIndex(prev =>
                        prev < filteredTools.length - 1 ? prev + 1 : prev
                    );
                } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
                } else if (e.key === "Enter" && filteredTools[selectedIndex]) {
                    e.preventDefault();
                    router.push(filteredTools[selectedIndex].link);
                    closeModal();
                }
            }
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                closeModal();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, filteredTools, selectedIndex, router]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Only render the modal when open - no persistent UI
    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div
                        ref={modalRef}
                        className="bg-card border border-border rounded-lg shadow-lg w-full max-w-2xl max-h-[60vh] overflow-hidden"
                    >
                        <div className="flex items-center border-b border-border px-4">
                            <Search className="w-4 h-4 text-muted-foreground" />
                            <Input
                                ref={inputRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search tools..."
                                className="border-0 outline-0 shadow-none focus-visible:ring-0 px-3 py-4"
                            />
                        </div>

                        <div className="max-h-[400px] overflow-y-auto">
                            {filteredTools.length === 0 ? (
                                <div className="px-4 py-8 text-center text-muted-foreground">
                                    {query ? "No tools found" : "Start typing to search tools..."}
                                </div>
                            ) : (
                                <div className="py-2 space-y-0.5">
                                    {filteredTools.map((tool, index) => (
                                        <button
                                            key={tool.link}
                                            onClick={() => {
                                                router.push(tool.link);
                                                closeModal();
                                            }}
                                            className={`w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center justify-between group hover:cursor-pointer  ${index === selectedIndex ? "bg-card/80" : "bg-card/50"
                                                }`}
                                        >
                                            <div>
                                                <div className="font-medium text-foreground">
                                                    {tool.title}
                                                </div>
                                                <div className="text-sm text-muted-foreground mt-1">
                                                    {tool.description}
                                                </div>
                                            </div>
                                            <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {filteredTools.length > 0 && (
                            <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                        <kbd className="p-1 text-sm bg-primary/10 text-primary rounded">
                                            <ArrowDownUp className="w-3 h-3" />
                                        </kbd>
                                        Navigate
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-2 py-0.5 text-sm bg-primary/10 text-primary rounded">↵</kbd>
                                        Select
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <kbd className="p-1 text-xs bg-primary/10 text-primary rounded">esc</kbd>
                                        Close
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}