import { LanguageId } from "./serialize";

export interface Language {
    id: LanguageId;
    /** Name used in the output picker. */
    label: string;
    /** What a value of this dialect is called in prose. */
    noun: string;
    /** Indent width the language's own style guides use. */
    indent: number;
    /** Seed text shown when a page opens with this dialect as the input. */
    sample: string;
}

export const LANGUAGES: Language[] = [
    {
        id: "json",
        label: "JSON",
        noun: "JSON",
        indent: 2,
        sample: `{
  "status": "success",
  "code": 200,
  "user": {
    "name": "John Doe",
    "email": "john@example.com",
    "verified": true,
    "referrer": null
  },
  "tags": ["admin", "beta"]
}`,
    },
    {
        id: "javascript",
        label: "JavaScript",
        noun: "JavaScript object",
        indent: 2,
        sample: `{
  status: 'success',
  code: 200,
  user: {
    name: 'John Doe',
    email: 'john@example.com',
    verified: true,
    referrer: undefined,
  },
  tags: ['admin', 'beta'],
}`,
    },
    {
        id: "python",
        label: "Python",
        noun: "Python dict",
        indent: 4,
        sample: `{
    'status': 'success',
    'code': 200,
    'user': {
        'name': 'John Doe',
        'email': 'john@example.com',
        'verified': True,
        'referrer': None,
    },
    'tags': ('admin', 'beta'),
}`,
    },
    {
        id: "php",
        label: "PHP",
        noun: "PHP array",
        indent: 4,
        sample: `[
    "status" => "success",
    "code" => 200,
    "user" => [
        "name" => "John Doe",
        "email" => "john@example.com",
        "verified" => true,
        "referrer" => null
    ],
    "tags" => ["admin", "beta"]
]`,
    },
    {
        id: "ruby",
        label: "Ruby",
        noun: "Ruby hash",
        indent: 2,
        sample: `{
  "status" => "success",
  "code" => 200,
  "user" => {
    "name" => "John Doe",
    "email" => "john@example.com",
    "verified" => true,
    "referrer" => nil
  },
  "tags" => ["admin", "beta"]
}`,
    },
];

export const LANGUAGE_BY_ID: Record<LanguageId, Language> = LANGUAGES.reduce(
    (all, language) => ({ ...all, [language.id]: language }),
    {} as Record<LanguageId, Language>
);

/** Quoted spans, so a keyword inside a string cannot fool the detector. */
const STRINGS = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/g;

/**
 * Best guess at which dialect the input is written in. Only used to label the
 * input for the user - the parser itself accepts every dialect at once.
 */
export function detectLanguage(input: string): LanguageId | null {
    const text = input.trim();
    if (text === "") return null;

    try {
        JSON.parse(text);
        return "json";
    } catch {
        // Not strict JSON, so work out which dialect it is.
    }

    const code = text.replace(STRINGS, '""');

    if (code.includes("=>")) {
        // Both PHP and Ruby use hash rockets; the brackets tell them apart.
        if (/\barray\s*\(/i.test(code) || code.startsWith("[")) return "php";
        if (/\bnil\b/.test(code)) return "ruby";
        return code.startsWith("{") ? "ruby" : "php";
    }

    if (/\b(None|True|False)\b/.test(code) || /"""|'''/.test(text) || /^\s*#/m.test(code)) {
        return "python";
    }

    return "javascript";
}
