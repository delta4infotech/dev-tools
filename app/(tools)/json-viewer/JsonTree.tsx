"use client";
import { useState, memo } from "react";
import { ChevronRight, Link2, Check } from "lucide-react";

/** Children rendered per batch, so a 100k-item array does not block the page. */
const CHUNK = 100;

export const ROOT_PATH = "$";

const childPath = (parent: string, key: string, isArrayItem: boolean) =>
    isArrayItem ? `${parent}[${key}]` : `${parent}.${key}`;

export interface TreeState {
    expanded: Set<string>;
    toggle: (path: string) => void;
    /** Lowercased search term, empty when not searching. */
    search: string;
    /** Paths to keep while searching: matches plus their ancestors. */
    visible: Set<string> | null;
}

export function isContainer(value: unknown): value is object {
    return value !== null && typeof value === "object";
}

/** Every container path in the tree, for expand-all. Capped to stay responsive. */
export function collectContainerPaths(value: unknown, cap = 20000): { paths: string[]; capped: boolean } {
    const paths: string[] = [];
    let capped = false;

    const walk = (node: unknown, path: string) => {
        if (capped || !isContainer(node)) return;
        paths.push(path);
        if (paths.length >= cap) {
            capped = true;
            return;
        }
        const isArray = Array.isArray(node);
        for (const [key, child] of Object.entries(node)) {
            walk(child, childPath(path, key, isArray));
        }
    };

    walk(value, ROOT_PATH);
    return { paths, capped };
}

/** Paths matching the search, plus their ancestors so the branch stays reachable. */
export function collectMatches(value: unknown, term: string): { visible: Set<string>; count: number } {
    const visible = new Set<string>();
    let count = 0;

    const walk = (node: unknown, path: string, key: string | null): boolean => {
        const keyMatches = key !== null && key.toLowerCase().includes(term);

        if (isContainer(node)) {
            const isArray = Array.isArray(node);
            let childMatches = false;
            for (const [childKey, child] of Object.entries(node)) {
                if (walk(child, childPath(path, childKey, isArray), isArray ? null : childKey)) {
                    childMatches = true;
                }
            }
            if (keyMatches) count++;
            if (keyMatches || childMatches) {
                visible.add(path);
                return true;
            }
            return false;
        }

        const valueMatches = String(node).toLowerCase().includes(term);
        if (keyMatches || valueMatches) {
            count++;
            visible.add(path);
            return true;
        }
        return false;
    };

    walk(value, ROOT_PATH, null);
    return { visible, count };
}

function Highlight({ text, term }: { text: string; term: string }) {
    if (!term) return <>{text}</>;
    const index = text.toLowerCase().indexOf(term);
    if (index === -1) return <>{text}</>;

    return (
        <>
            {text.slice(0, index)}
            <mark className="bg-amber-400/30 text-inherit rounded-sm">
                {text.slice(index, index + term.length)}
            </mark>
            {text.slice(index + term.length)}
        </>
    );
}

function Primitive({ value, term }: { value: unknown; term: string }) {
    if (typeof value === "string") {
        return (
            <span className="text-emerald-300 break-all">
                &quot;<Highlight text={value} term={term} />&quot;
            </span>
        );
    }
    if (typeof value === "number") {
        return (
            <span className="text-amber-300">
                <Highlight text={String(value)} term={term} />
            </span>
        );
    }
    if (typeof value === "boolean") {
        return <span className="text-purple-300">{String(value)}</span>;
    }
    return <span className="text-muted-foreground">null</span>;
}

function CopyPath({ path }: { path: string }) {
    const [copied, setCopied] = useState(false);

    return (
        <button
            type="button"
            title={`Copy path ${path}`}
            aria-label={`Copy path ${path}`}
            onClick={(event) => {
                event.stopPropagation();
                navigator.clipboard.writeText(path);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
            }}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity ml-2 text-muted-foreground hover:text-foreground shrink-0"
        >
            {copied ? <Check className="w-3 h-3" /> : <Link2 className="w-3 h-3" />}
        </button>
    );
}

interface NodeProps {
    path: string;
    name: string | null;
    value: unknown;
    depth: number;
    isArrayItem: boolean;
    state: TreeState;
}

const Node = memo(function Node({ path, name, value, depth, isArrayItem, state }: NodeProps) {
    const [shown, setShown] = useState(CHUNK);

    if (state.visible && !state.visible.has(path)) return null;

    // While searching, matched branches open themselves so hits are on screen.
    const expanded = state.search ? true : state.expanded.has(path);
    const indent = { paddingLeft: `${depth * 14}px` };

    const label = name === null ? null : (
        <span className={isArrayItem ? "text-muted-foreground" : "text-sky-300"}>
            {isArrayItem ? name : <Highlight text={name} term={state.search} />}
            <span className="text-muted-foreground mr-1.5">:</span>
        </span>
    );

    if (!isContainer(value)) {
        return (
            <div className="group flex items-start hover:bg-white/5 rounded px-1" style={indent}>
                <span className="w-4 shrink-0" />
                {label}
                <Primitive value={value} term={state.search} />
                <CopyPath path={path} />
            </div>
        );
    }

    const isArray = Array.isArray(value);
    const entries = Object.entries(value);
    const [open, close] = isArray ? ["[", "]"] : ["{", "}"];
    const summary = isArray
        ? `${entries.length} ${entries.length === 1 ? "item" : "items"}`
        : `${entries.length} ${entries.length === 1 ? "key" : "keys"}`;

    return (
        <>
            <div
                className="group flex items-start hover:bg-white/5 rounded px-1 cursor-pointer select-none"
                style={indent}
                onClick={() => state.toggle(path)}
                role="button"
                tabIndex={0}
                aria-expanded={expanded}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        state.toggle(path);
                    }
                }}
            >
                <ChevronRight
                    className={`w-4 h-4 shrink-0 mt-0.5 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`}
                />
                {label}
                <span className="text-muted-foreground">
                    {open}
                    {!expanded && (
                        <>
                            <span className="mx-1 text-xs">{summary}</span>
                            {close}
                        </>
                    )}
                </span>
                <CopyPath path={path} />
            </div>

            {expanded && (
                <>
                    {entries.slice(0, shown).map(([key, child]) => (
                        <Node
                            key={key}
                            path={childPath(path, key, isArray)}
                            name={key}
                            value={child}
                            depth={depth + 1}
                            isArrayItem={isArray}
                            state={state}
                        />
                    ))}
                    {entries.length > shown && (
                        <div style={{ paddingLeft: `${(depth + 1) * 14}px` }} className="px-1">
                            <button
                                type="button"
                                onClick={() => setShown(shown + CHUNK * 5)}
                                className="text-xs text-primary hover:underline"
                            >
                                Show {Math.min(CHUNK * 5, entries.length - shown)} more of{" "}
                                {entries.length - shown} remaining
                            </button>
                        </div>
                    )}
                    <div style={indent} className="px-1 text-muted-foreground">
                        <span className="w-4 inline-block" />
                        {close}
                    </div>
                </>
            )}
        </>
    );
});

export default function JsonTree({ value, state }: { value: unknown; state: TreeState }) {
    return (
        <div className="font-mono leading-relaxed">
            <Node path={ROOT_PATH} name={null} value={value} depth={0} isArrayItem={false} state={state} />
        </div>
    );
}
