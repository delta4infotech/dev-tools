/**
 * A tolerant JSON parser for JSON-ish object literals pasted from real code.
 *
 * Strict JSON.parse rejects input developers paste all the time. This parser
 * accepts it and returns a plain JS value that can be handed to JSON.stringify:
 *
 *   JavaScript  single quotes, unquoted keys, trailing commas, line and block
 *               comments, undefined, NaN, Infinity, hex/underscore numbers
 *   Python      None / True / False, single quotes, triple quoted strings,
 *               r"" b"" f"" prefixes, tuples, sets, # comments, nan / inf
 *   PHP         ["a" => 1] and array("a" => 1), null / true / false
 *   Ruby        nil, {"a" => 1} hash rockets
 *   SQL / misc  NULL, TRUE, FALSE casing
 *
 * It is a hand written recursive descent parser on purpose - no eval, so
 * pasted input can never execute in the user's browser.
 */

export class LenientJsonError extends Error {
    line: number;
    column: number;

    constructor(message: string, line: number, column: number) {
        super(`${message} (line ${line}, column ${column})`);
        this.name = "LenientJsonError";
        this.line = line;
        this.column = column;
    }
}

const isDigit = (ch: string) => ch >= "0" && ch <= "9";
const isHexDigit = (ch: string) =>
    isDigit(ch) || (ch >= "a" && ch <= "f") || (ch >= "A" && ch <= "F");

// Identifier chars for unquoted keys. Anything non-ASCII is allowed through so
// keys like accented or CJK identifiers work without unicode regex escapes.
const isIdentStart = (ch: string) =>
    (ch >= "a" && ch <= "z") ||
    (ch >= "A" && ch <= "Z") ||
    ch === "_" ||
    ch === "$" ||
    ch.charCodeAt(0) >= 0x80;
const isIdentPart = (ch: string) => isIdentStart(ch) || isDigit(ch);

// Whitespace, matching JS: ASCII spaces, NBSP, the unicode space separators,
// the line separators and the BOM.
const isWhitespace = (ch: string) => {
    const code = ch.charCodeAt(0);
    return (
        code === 0x20 || code === 0x09 || code === 0x0a || code === 0x0d ||
        code === 0x0b || code === 0x0c || code === 0xa0 || code === 0x1680 ||
        (code >= 0x2000 && code <= 0x200a) || code === 0x2028 || code === 0x2029 ||
        code === 0x202f || code === 0x205f || code === 0x3000 || code === 0xfeff
    );
};

const SINGLE_CHAR_ESCAPES: Record<string, string> = {
    '"': '"',
    "'": "'",
    "`": "`",
    "\\": "\\",
    "/": "/",
    b: "\b",
    f: "\f",
    n: "\n",
    r: "\r",
    t: "\t",
    v: "\v",
    "0": "\0",
};

const RADIX_DIGITS: Record<number, RegExp> = {
    16: /^[0-9a-fA-F]+$/,
    8: /^[0-7]+$/,
    2: /^[01]+$/,
};

// Bare words that stand for a value, across the languages we accept.
const KEYWORDS = new Map<string, unknown>([
    // JSON / JavaScript
    ["true", true], ["false", false], ["null", null],
    ["undefined", undefined], ["NaN", NaN], ["Infinity", Infinity],
    // Python
    ["True", true], ["False", false], ["None", null],
    ["nan", NaN], ["inf", Infinity], ["infinity", Infinity],
    // Ruby / Lua
    ["nil", null],
    // SQL / PHP / YAML casing
    ["TRUE", true], ["FALSE", false], ["NULL", null], ["Null", null],
    ["INF", Infinity], ["NAN", NaN],
]);

// Python string prefixes: r"", b"", u"", f"", and two letter combos like rb"".
const isStringPrefix = (ch: string) => "rbufRBUF".includes(ch);
const isQuote = (ch: string) => ch === '"' || ch === "'" || ch === "`";

type Closer = "}" | "]" | ")";
const CLOSERS: Record<string, Closer> = { "{": "}", "[": "]", "(": ")" };
const LABELS: Record<Closer, string> = { "}": "object", "]": "array", ")": "tuple" };

// Returned by wordValue for a word that is not a value, e.g. an unquoted key.
const MISSING = Symbol("missing");

class Parser {
    private src: string;
    private pos = 0;

    constructor(src: string) {
        this.src = src;
    }

    parse(): unknown {
        this.skipBlank();
        const value = this.parseValue();
        this.skipBlank();
        if (this.pos < this.src.length) {
            this.fail(`Unexpected character ${JSON.stringify(this.peek())} after the parsed value`);
        }
        return value;
    }

    private peek(offset = 0): string {
        return this.src[this.pos + offset] ?? "";
    }

    private fail(message: string, at = this.pos): never {
        let line = 1;
        let lineStart = 0;
        for (let i = 0; i < at && i < this.src.length; i++) {
            if (this.src[i] === "\n") {
                line++;
                lineStart = i + 1;
            }
        }
        throw new LenientJsonError(message, line, at - lineStart + 1);
    }

    /** Skips whitespace plus `//`, `#` and block comments. */
    private skipBlank(): void {
        for (;;) {
            while (this.pos < this.src.length && isWhitespace(this.src[this.pos])) this.pos++;

            // Python / YAML / shell style line comment.
            if (this.peek() === "#") {
                while (this.pos < this.src.length && this.src[this.pos] !== "\n") this.pos++;
                continue;
            }

            if (this.peek() === "/" && this.peek(1) === "/") {
                this.pos += 2;
                while (this.pos < this.src.length && this.src[this.pos] !== "\n") this.pos++;
                continue;
            }

            if (this.peek() === "/" && this.peek(1) === "*") {
                const start = this.pos;
                this.pos += 2;
                const end = this.src.indexOf("*/", this.pos);
                if (end === -1) this.fail("Unterminated comment", start);
                this.pos = end + 2;
                continue;
            }

            return;
        }
    }

    private parseValue(): unknown {
        const ch = this.peek();

        if (ch === "") this.fail("Unexpected end of input");
        if (ch === "{" || ch === "[" || ch === "(") {
            this.pos++;
            return this.parseContainer(CLOSERS[ch]);
        }
        if (isQuote(ch) || this.stringPrefixLength() > 0) return this.parseString();
        if (isDigit(ch) || ch === "-" || ch === "+" || ch === ".") return this.parseNumber();

        const start = this.pos;
        const word = this.readWord();
        const value = this.wordValue(word);
        if (value !== MISSING) return value;

        this.fail(`Unexpected token ${JSON.stringify(word || ch)}`, start);
    }

    /**
     * Turns a bare word into a value: a literal such as `None` or `nil`, or a
     * constructor form - PHP's `array(...)` and Python's empty `set()`.
     * Returns MISSING when the word does not stand for a value, which is how
     * an unquoted key like `name` in `{name: 1}` is recognised.
     */
    private wordValue(word: string): unknown {
        if (KEYWORDS.has(word)) return KEYWORDS.get(word);

        // Ruby writes its special floats as Float::NAN and Float::INFINITY.
        if (word === "Float" && this.peek() === ":" && this.peek(1) === ":") {
            const at = this.pos;
            this.pos += 2;
            const constant = this.readWord();
            if (constant === "NAN") return NaN;
            if (constant === "INFINITY") return Infinity;
            this.fail(`Unknown Float constant ${JSON.stringify(constant)}`, at);
        }

        const probe = this.pos;
        this.skipBlank();

        if (this.peek() === "(") {
            const lower = word.toLowerCase();
            // Python has no NaN literal, so it writes float('nan') / float('inf').
            if (lower === "float") {
                this.pos++;
                this.skipBlank();
                const argument = isQuote(this.peek()) || this.stringPrefixLength() > 0
                    ? this.parseString().trim().toLowerCase()
                    : "";
                this.skipBlank();
                if (this.peek() === ")") {
                    this.pos++;
                    if (argument === "nan") return NaN;
                    if (argument === "inf" || argument === "infinity" || argument === "+inf") {
                        return Infinity;
                    }
                    if (argument === "-inf" || argument === "-infinity") return -Infinity;
                }
                this.fail("Only float('nan'), float('inf') and float('-inf') are supported", probe);
            }
            if (lower === "array") {
                this.pos++;
                return this.parseContainer(")", "array");
            }
            if (lower === "set" || lower === "frozenset") {
                this.pos++;
                this.skipBlank();
                if (this.peek() === ")") {
                    this.pos++;
                    return [];
                }
                this.fail(`Only the empty ${lower}() form is supported`, probe);
            }
        }

        this.pos = probe;
        return MISSING;
    }

    private readWord(): string {
        const start = this.pos;
        while (this.pos < this.src.length && isIdentPart(this.src[this.pos])) this.pos++;
        return this.src.slice(start, this.pos);
    }

    /** True when the cursor sits on `:` or on a Ruby/PHP `=>` hash rocket. */
    private atKeySeparator(): boolean {
        return this.peek() === ":" || (this.peek() === "=" && this.peek(1) === ">");
    }

    /** Renders a parsed key literal the way JSON.stringify would spell it. */
    private keyToString(value: unknown): string {
        if (typeof value === "string") return value;
        if (value === undefined) return "undefined";
        if (typeof value === "number" || typeof value === "boolean" || value === null) {
            return String(value);
        }
        return JSON.stringify(value) ?? String(value);
    }

    /**
     * Parses a container body once its opening bracket has been consumed. One
     * routine covers every shape the accepted languages write, because the
     * bracket alone does not decide the result:
     *
     *   {a: 1} object      {1, 2} Python set -> array
     *   [1, 2] array       ["a" => 1] PHP associative array -> object
     *   (1, 2) Python tuple -> array
     */
    private parseContainer(close: Closer, labelOverride?: string): unknown {
        const label = labelOverride ?? LABELS[close];
        const members: { key: string | null; value: unknown }[] = [];
        let keyed = false;

        for (;;) {
            this.skipBlank();

            // Also covers the empty container and a trailing comma.
            if (this.peek() === close) {
                this.pos++;
                break;
            }
            if (this.peek() === "") this.fail(`Unterminated ${label}, expected "${close}"`);

            const member = this.parseMember();
            if (member.key !== null) keyed = true;
            members.push(member);

            this.skipBlank();
            const next = this.peek();
            if (next === ",") {
                this.pos++;
                continue;
            }
            if (next === close) {
                this.pos++;
                break;
            }
            this.fail(
                next === ""
                    ? `Unterminated ${label}, expected "${close}"`
                    : `Expected "," or "${close}" in ${label}`
            );
        }

        // With no `key:` in sight, braces hold a set and the other brackets
        // hold a list - except for `{}`, which is an empty object everywhere.
        if (!keyed) {
            return close === "}" && members.length === 0 ? {} : members.map((m) => m.value);
        }

        // PHP gives unkeyed elements the next integer index, and json_encode
        // turns a 0, 1, 2... run back into an array. Only `[...]` and
        // `array(...)` can be PHP, so `{...}` always stays an object.
        const indexed = members.map((m, i) => ({ key: m.key ?? String(i), value: m.value }));
        if (close !== "}" && indexed.every((m, i) => m.key === String(i))) {
            return indexed.map((m) => m.value);
        }

        const result: Record<string, unknown> = {};
        for (const { key, value } of indexed) result[key] = value;
        return result;
    }

    /**
     * Parses one container member: either `value` or `key: value`. Keys are a
     * subset of values, so the member is parsed once and only reinterpreted as
     * a key when a separator turns up after it - no backtracking.
     */
    private parseMember(): { key: string | null; value: unknown } {
        const start = this.pos;
        let bareKey: string | null = null;
        let first: unknown;

        if (isIdentStart(this.peek()) && this.stringPrefixLength() === 0) {
            const word = this.readWord();
            const value = this.wordValue(word);
            // A word that is not a value can only be an unquoted key.
            if (value === MISSING) bareKey = word;
            else first = value;
        } else {
            first = this.parseValue();
        }

        this.skipBlank();

        if (this.atKeySeparator()) {
            this.pos += this.peek() === ":" ? 1 : 2;
            this.skipBlank();
            return { key: bareKey ?? this.keyToString(first), value: this.parseValue() };
        }

        if (bareKey !== null) this.fail(`Unexpected token ${JSON.stringify(bareKey)}`, start);
        return { key: null, value: first };
    }

    /**
     * Length of a Python string prefix at the cursor (r"", b"", rb"" and so
     * on), or 0 when the cursor is not on a prefixed string.
     */
    private stringPrefixLength(): number {
        for (let len = 1; len <= 2; len++) {
            let allPrefix = true;
            for (let i = 0; i < len; i++) {
                if (!isStringPrefix(this.peek(i))) allPrefix = false;
            }
            if (allPrefix && isQuote(this.peek(len))) return len;
        }
        return 0;
    }

    private parseString(): string {
        const start = this.pos;

        // Python prefixes: r/b/u/f, in any case and up to two of them.
        const prefixLength = this.stringPrefixLength();
        const prefix = this.src.slice(this.pos, this.pos + prefixLength).toLowerCase();
        const raw = prefix.includes("r");
        this.pos += prefixLength;

        const quote = this.src[this.pos];
        // Python triple quoted strings may span lines and contain lone quotes.
        const triple = this.peek(1) === quote && this.peek(2) === quote;
        const terminator = triple ? quote.repeat(3) : quote;
        // Backticks and triple quotes are the multi line forms.
        const multiline = triple || quote === "`";
        this.pos += terminator.length;
        let out = "";

        for (;;) {
            if (this.pos >= this.src.length) this.fail("Unterminated string", start);

            const ch = this.src[this.pos];

            if (ch === quote && this.src.startsWith(terminator, this.pos)) {
                this.pos += terminator.length;
                return out;
            }

            if (ch === "\\") {
                if (raw) {
                    // Raw strings keep the backslash, but it still escapes the
                    // quote for the purpose of finding the end of the string.
                    out += ch + (this.peek(1) ?? "");
                    this.pos += 2;
                    continue;
                }
                out += this.parseEscape();
                continue;
            }

            if ((ch === "\n" || ch === "\r") && !multiline) {
                this.fail("Unterminated string", start);
            }

            if (quote === "`" && ch === "$" && this.peek(1) === "{") {
                this.fail("Template literal placeholders (${...}) are not supported");
            }

            out += ch;
            this.pos++;
        }
    }

    private parseEscape(): string {
        this.pos++; // consume '\'
        const ch = this.src[this.pos];
        if (ch === undefined) this.fail("Unterminated escape sequence");

        // Line continuation: a backslash before a line break emits nothing.
        const code = ch.charCodeAt(0);
        if (ch === "\n" || code === 0x2028 || code === 0x2029) {
            this.pos++;
            return "";
        }
        if (ch === "\r") {
            this.pos++;
            if (this.peek() === "\n") this.pos++;
            return "";
        }

        if (ch === "u") {
            this.pos++;
            // \u{1F600}
            if (this.peek() === "{") {
                const start = this.pos;
                this.pos++;
                let hex = "";
                while (isHexDigit(this.peek())) hex += this.src[this.pos++];
                if (this.peek() !== "}" || hex === "") this.fail("Invalid unicode escape sequence", start);
                this.pos++;
                const code = parseInt(hex, 16);
                if (code > 0x10ffff) this.fail("Invalid unicode escape sequence", start);
                return String.fromCodePoint(code);
            }
            return String.fromCharCode(this.readHex(4, "unicode"));
        }

        if (ch === "x") {
            this.pos++;
            return String.fromCharCode(this.readHex(2, "hex"));
        }

        const mapped = SINGLE_CHAR_ESCAPES[ch];
        this.pos++;
        // Unknown escapes fall back to the escaped character itself, like JS does.
        return mapped ?? ch;
    }

    private readHex(length: number, kind: string): number {
        const start = this.pos;
        let hex = "";
        for (let i = 0; i < length; i++) {
            const ch = this.peek();
            if (!isHexDigit(ch)) this.fail(`Invalid ${kind} escape sequence`, start);
            hex += ch;
            this.pos++;
        }
        return parseInt(hex, 16);
    }

    private parseNumber(): number {
        const start = this.pos;

        let sign = 1;
        if (this.peek() === "+" || this.peek() === "-") {
            if (this.src[this.pos] === "-") sign = -1;
            this.pos++;
        }

        // Infinity / NaN may carry a sign, in every spelling the languages use:
        // Infinity, inf, INF, Float::INFINITY, float('inf').
        if (isIdentStart(this.peek())) {
            const word = this.readWord();
            const value = this.wordValue(word);
            if (value === Infinity) return sign * Infinity;
            if (typeof value === "number" && Number.isNaN(value)) return NaN;
            this.fail(`Unexpected token ${JSON.stringify(word)}`, start);
        }

        // Hex, octal and binary literals.
        if (this.peek() === "0" && /[xXoObB]/.test(this.peek(1))) {
            const radixChar = this.peek(1).toLowerCase();
            const radix = radixChar === "x" ? 16 : radixChar === "o" ? 8 : 2;
            this.pos += 2;
            const digitsStart = this.pos;
            while (isHexDigit(this.peek()) || this.peek() === "_") this.pos++;
            const digits = this.src.slice(digitsStart, this.pos).replace(/_/g, "");
            if (!RADIX_DIGITS[radix].test(digits)) this.fail("Invalid number", start);
            return sign * parseInt(digits, radix);
        }

        while (isDigit(this.peek()) || this.peek() === "_") this.pos++;
        if (this.peek() === ".") {
            this.pos++;
            while (isDigit(this.peek()) || this.peek() === "_") this.pos++;
        }
        if (this.peek() === "e" || this.peek() === "E") {
            this.pos++;
            if (this.peek() === "+" || this.peek() === "-") this.pos++;
            while (isDigit(this.peek())) this.pos++;
        }
        // BigInt suffix - the value is kept as a plain number.
        if (this.peek() === "n") this.pos++;

        const raw = this.src.slice(start, this.pos).replace(/_/g, "").replace(/n$/, "");
        const value = Number(raw);
        if (raw === "" || raw === "-" || raw === "+" || Number.isNaN(value)) this.fail("Invalid number", start);
        return value;
    }
}

export interface ParsedJson {
    value: unknown;
    /** True when the input needed the tolerant parser, i.e. it was not valid JSON. */
    lenient: boolean;
}

/**
 * Parses strict JSON when possible and falls back to the tolerant parser for
 * JavaScript style input. Throws LenientJsonError when neither can read it.
 */
export function parseJsonLoose(input: string): ParsedJson {
    try {
        return { value: JSON.parse(input), lenient: false };
    } catch {
        return { value: new Parser(input).parse(), lenient: true };
    }
}
