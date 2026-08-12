/**
 * Serializers that render a parsed value as a literal in each language the
 * converter targets. The parser in ./parse.ts reads any of these dialects; this
 * is the write side of the same table.
 */

export type LanguageId = "json" | "javascript" | "python" | "php" | "ruby";

interface Dialect {
    /** Renders a string literal, quotes included. */
    string: (value: string) => string;
    /** Renders an object key in `key: value` position, quotes included. */
    key: (value: string) => string;
    /** Separator between a key and its value. */
    keySeparator: string;
    true: string;
    false: string;
    null: string;
    /** Spelling for a missing value, which only JavaScript distinguishes. */
    undefined: string;
    nan: string;
    infinity: string;
    negativeInfinity: string;
    objectBrackets: [string, string];
    arrayBrackets: [string, string];
    /** Trailing comma after the last member, where the language allows it. */
    trailingComma: boolean;
}

const CONTROL_ESCAPES: Record<string, string> = {
    "\b": "\\b",
    "\f": "\\f",
    "\n": "\\n",
    "\r": "\\r",
    "\t": "\\t",
    "\v": "\\v",
};

/** Escapes the characters that are special inside a quoted string. */
function escapeString(value: string, quote: string, extra: Record<string, string> = {}): string {
    let out = "";
    for (const ch of value) {
        if (extra[ch]) out += extra[ch];
        else if (ch === quote || ch === "\\") out += "\\" + ch;
        else if (CONTROL_ESCAPES[ch]) out += CONTROL_ESCAPES[ch];
        else if (ch < " ") out += "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0");
        else out += ch;
    }
    return out;
}

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

const DIALECTS: Record<Exclude<LanguageId, "json">, Dialect> = {
    javascript: {
        string: (v) => `'${escapeString(v, "'")}'`,
        // Bare keys where they are valid, quoted otherwise.
        key: (v) => (IDENTIFIER.test(v) ? v : `'${escapeString(v, "'")}'`),
        keySeparator: ": ",
        true: "true",
        false: "false",
        null: "null",
        undefined: "undefined",
        nan: "NaN",
        infinity: "Infinity",
        negativeInfinity: "-Infinity",
        objectBrackets: ["{", "}"],
        arrayBrackets: ["[", "]"],
        trailingComma: true,
    },
    python: {
        string: (v) => `'${escapeString(v, "'")}'`,
        key: (v) => `'${escapeString(v, "'")}'`,
        keySeparator: ": ",
        true: "True",
        false: "False",
        null: "None",
        undefined: "None",
        // Python has no NaN literal; these are the constructor forms.
        nan: "float('nan')",
        infinity: "float('inf')",
        negativeInfinity: "float('-inf')",
        objectBrackets: ["{", "}"],
        arrayBrackets: ["[", "]"],
        trailingComma: true,
    },
    php: {
        // Double quotes, because PHP single quoted strings do not interpret \n.
        // `$` has to be escaped as well or it starts interpolation.
        string: (v) => `"${escapeString(v, '"', { $: "\\$" })}"`,
        key: (v) => `"${escapeString(v, '"', { $: "\\$" })}"`,
        keySeparator: " => ",
        true: "true",
        false: "false",
        null: "null",
        undefined: "null",
        nan: "NAN",
        infinity: "INF",
        negativeInfinity: "-INF",
        objectBrackets: ["[", "]"],
        arrayBrackets: ["[", "]"],
        trailingComma: true,
    },
    ruby: {
        // `#{` would start interpolation inside a double quoted Ruby string.
        string: (v) => `"${escapeString(v, '"', { "#": "\\#" })}"`,
        key: (v) => `"${escapeString(v, '"', { "#": "\\#" })}"`,
        keySeparator: " => ",
        true: "true",
        false: "false",
        null: "nil",
        undefined: "nil",
        nan: "Float::NAN",
        infinity: "Float::INFINITY",
        negativeInfinity: "-Float::INFINITY",
        objectBrackets: ["{", "}"],
        arrayBrackets: ["[", "]"],
        trailingComma: false,
    },
};

function formatNumber(value: number, dialect: Dialect): string {
    if (Number.isNaN(value)) return dialect.nan;
    if (value === Infinity) return dialect.infinity;
    if (value === -Infinity) return dialect.negativeInfinity;
    // Object.is keeps the sign of negative zero, which String() drops.
    return Object.is(value, -0) ? "-0" : String(value);
}

function emit(value: unknown, dialect: Dialect, indent: string, depth: number): string {
    const pad = indent.repeat(depth + 1);
    const closePad = indent.repeat(depth);

    if (value === undefined) return dialect.undefined;
    if (value === null) return dialect.null;
    if (typeof value === "boolean") return value ? dialect.true : dialect.false;
    if (typeof value === "number") return formatNumber(value, dialect);
    if (typeof value === "string") return dialect.string(value);

    const comma = dialect.trailingComma ? "," : "";

    if (Array.isArray(value)) {
        const [open, close] = dialect.arrayBrackets;
        if (value.length === 0) return open + close;
        const items = value.map((item) => pad + emit(item, dialect, indent, depth + 1));
        return `${open}\n${items.join(",\n")}${comma}\n${closePad}${close}`;
    }

    const [open, close] = dialect.objectBrackets;
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return open + close;
    const members = entries.map(
        ([key, item]) =>
            pad + dialect.key(key) + dialect.keySeparator + emit(item, dialect, indent, depth + 1)
    );
    return `${open}\n${members.join(",\n")}${comma}\n${closePad}${close}`;
}

/**
 * Renders a parsed value as a literal in the requested language. JSON goes
 * through JSON.stringify so the output is exactly the standard spelling.
 */
export function serialize(value: unknown, language: LanguageId, indentSize = 2): string {
    if (language === "json") return JSON.stringify(value, null, indentSize) ?? "null";
    return emit(value, DIALECTS[language], " ".repeat(indentSize), 0);
}
