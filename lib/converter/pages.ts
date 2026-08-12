import { FAQProps } from "@/app/(components)/FAQ";
import { ExampleProps } from "@/app/(components)/Example";
import { LanguageId } from "./serialize";
import { LANGUAGE_BY_ID } from "./languages";

export interface ConverterPageConfig {
    slug: string;
    /** <title> and the H1 are deliberately allowed to differ. */
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    heading: string;
    subheading: string;
    /** Input the page opens with. */
    sample: string;
    /** Output dialect the page opens on. */
    target: LanguageId;
    faqs: FAQProps[];
    examples: ExampleProps[];
    relatedTools: { title: string; description: string; link: string }[];
}

/** Asked on every page, so they live in one place. */
const COMMON_FAQS: Omit<FAQProps, "id">[] = [
    {
        title: "Is my data uploaded anywhere?",
        content:
            "No. The whole conversion runs in your browser - parsing and output generation are plain JavaScript with no network request, so nothing you paste ever leaves your device. That also means it keeps working offline once the page has loaded.",
    },
    {
        title: "Does it run the code I paste?",
        content:
            "No. The input is read by a hand-written parser, not by eval() or any other code execution. Pasting an object from an untrusted source cannot run anything in your browser.",
    },
    {
        title: "What happens if my input has a syntax error?",
        content:
            "The converter reports the problem with the exact line and column - for example an unterminated string, a missing bracket, or a value it does not recognise - so you can find the spot instead of guessing.",
    },
];

/** Numbers the page-specific FAQs and appends the shared ones. */
function withCommonFaqs(specific: Omit<FAQProps, "id">[]): FAQProps[] {
    return [...specific, ...COMMON_FAQS].map((faq, index) => ({ ...faq, id: String(index + 1) }));
}

const TOOL_LINKS = {
    viewer: {
        title: "JSON Viewer",
        description: "View JSON as a collapsible tree, search it and copy any path.",
        link: "/json-viewer",
    },
    formatter: {
        title: "JSON Formatter",
        description: "Format, validate and beautify JSON with syntax highlighting.",
        link: "/json-code-formatter",
    },
    jsObject: {
        title: "JS Object to JSON Converter",
        description: "Convert JavaScript object literals to valid JSON instantly.",
        link: "/js-object-to-json",
    },
    hub: {
        title: "Object to JSON Converter",
        description: "Convert between JSON, JavaScript, Python, PHP and Ruby objects.",
        link: "/object-to-json",
    },
    pythonToJson: {
        title: "Python Dict to JSON",
        description: "Turn a Python dict, with None and True/False, into valid JSON.",
        link: "/python-dict-to-json",
    },
    jsonToPython: {
        title: "JSON to Python Dict",
        description: "Turn JSON into a ready-to-paste Python dict literal.",
        link: "/json-to-python-dict",
    },
    phpToJson: {
        title: "PHP Array to JSON",
        description: "Turn a PHP array, short or array() syntax, into valid JSON.",
        link: "/php-array-to-json",
    },
    jsonToPhp: {
        title: "JSON to PHP Array",
        description: "Turn JSON into a PHP array literal using short array syntax.",
        link: "/json-to-php-array",
    },
};

export const CONVERTER_PAGES: Record<string, ConverterPageConfig> = {
    hub: {
        slug: "object-to-json",
        metaTitle: "Object to JSON Converter - JavaScript, Python, PHP & Ruby",
        metaDescription:
            "Convert objects to JSON online: JavaScript objects, Python dicts, PHP arrays and Ruby hashes, in both directions. Runs in your browser, no signup.",
        keywords: [
            "object to json converter",
            "convert object to json",
            "json converter online",
            "javascript object to json",
            "python dict to json",
            "php array to json",
            "ruby hash to json",
            "json to python dict",
            "json to php array",
        ],
        heading: "Object to JSON Converter",
        subheading:
            "Paste JSON, a JavaScript object, a Python dict, a PHP array or a Ruby hash. The format is detected for you - pick what you want back.",
        sample: LANGUAGE_BY_ID.javascript.sample,
        target: "json",
        faqs: withCommonFaqs([
            {
                title: "Which formats can I paste in?",
                content:
                    "JSON, JavaScript object literals, Python dicts, PHP arrays and Ruby hashes, in any mix. That covers single and double quotes, unquoted keys, trailing commas, // # and /* */ comments, None/True/False, nil, NULL/TRUE/FALSE, undefined, NaN and Infinity, hex and underscore-separated numbers, Python tuples, sets and triple-quoted strings, and both PHP array syntaxes.",
            },
            {
                title: "How does the format detection work?",
                content:
                    "The label above the input is a hint based on the syntax it can see - hash rockets point at PHP or Ruby, None and True at Python, and so on. It only affects the label: the parser accepts every dialect at once, so it does not matter if the guess is off or if your input mixes styles.",
            },
            {
                title: "What can it convert to?",
                content:
                    "JSON, a JavaScript object literal, a Python dict, a PHP array (short [] syntax) or a Ruby hash. Each output uses that language's own conventions - 4-space indents for Python and PHP, 2 for the rest, bare keys in JavaScript where they are valid identifiers, and the right spelling for null, true and false.",
            },
        ]),
        examples: [
            {
                title: "Move a payload between two services",
                description:
                    "The same object often has to exist in more than one language: a fixture in the Python test suite, a literal in the PHP client, a JSON body in the API docs.",
                list: [
                    {
                        title: "Before",
                        content:
                            "Retyping the structure by hand for each language, and quietly introducing a typo in a key name that only shows up when a test fails much later.",
                    },
                    {
                        title: "After",
                        content:
                            "Paste it once, click through the output formats, and copy each version out. The structure and every key stays identical because they all come from the same parse.",
                    },
                ],
                bottomdesc:
                    "Useful when the same payload has to be kept in step across a polyglot codebase.",
            },
            {
                title: "Read an object printed in a log",
                description:
                    "Logs and consoles print objects in their own language's syntax, which is rarely valid JSON and rarely readable when it is one long line.",
                list: [
                    {
                        title: "Before",
                        content:
                            "A single-line dict or array from a log file, full of single quotes and language keywords, that no JSON viewer will accept.",
                    },
                    {
                        title: "After",
                        content:
                            "Indented JSON you can actually read, with the nesting visible and the keys in the order they were logged.",
                    },
                ],
                bottomdesc: "Turns whatever your logs printed into something you can inspect.",
            },
        ],
        relatedTools: [TOOL_LINKS.pythonToJson, TOOL_LINKS.phpToJson, TOOL_LINKS.viewer],
    },

    pythonDictToJson: {
        slug: "python-dict-to-json",
        metaTitle: "Python Dict to JSON Converter - Online & Free",
        metaDescription:
            "Convert a Python dict to JSON online. Handles None, True/False, single quotes, tuples and sets. Runs in your browser, nothing uploaded, no signup.",
        keywords: [
            "python dict to json",
            "python dict to json online",
            "python dict to json converter",
            "convert python dictionary to json",
            "dict to json",
            "python dict to json object",
        ],
        heading: "Python Dict to JSON Converter",
        subheading:
            "Paste a Python dict - None, True/False, single quotes, tuples and all - and get valid JSON back.",
        sample: LANGUAGE_BY_ID.python.sample,
        target: "json",
        faqs: withCommonFaqs([
            {
                title: "How is this different from json.dumps()?",
                content:
                    "json.dumps() needs a running Python process and a real dict object. This works on text: the printed dict you copied out of a log, a console session, a debugger or someone else's code. It also accepts things json.dumps() rejects outright, such as sets.",
            },
            {
                title: "What do None, True and False become?",
                content:
                    "None becomes null, True becomes true and False becomes false, which is exactly what json.dumps() would produce. NaN and inf become null, since JSON has no way to spell them.",
            },
            {
                title: "Are tuples and sets supported?",
                content:
                    "Yes, both become JSON arrays. That matches json.dumps() for tuples, and it is more forgiving for sets, which json.dumps() raises a TypeError on. Empty set() and frozenset() become empty arrays.",
            },
            {
                title: "What about r, b, f and triple-quoted strings?",
                content:
                    "All handled. Raw strings keep their backslashes, byte strings are read as text, f-string braces are kept literally since there are no variables to interpolate, and triple-quoted strings can span as many lines as you like.",
            },
            {
                title: "Can I go the other way, from JSON to a dict?",
                content:
                    "Yes - switch the output format to Python, or use the JSON to Python Dict page, which opens with that direction already selected.",
            },
        ]),
        examples: [
            {
                title: "A dict printed to the console",
                description:
                    "print(response) and repr() give you Python syntax, which no JSON tool will accept.",
                list: [
                    {
                        title: "Before",
                        content:
                            "A long single-line dict with single quotes, True/False/None and maybe a tuple or two - valid Python, invalid JSON.",
                    },
                    {
                        title: "After",
                        content:
                            "Formatted JSON with double-quoted keys and the right literals, ready to drop into a request body, a fixture file or an API doc.",
                    },
                ],
                bottomdesc:
                    "The usual reason people need this: the object exists only as text in a terminal.",
            },
            {
                title: "Turning a dict into a test fixture",
                description:
                    "Test suites and mock servers often want a .json file where the code has a dict literal.",
                list: [
                    {
                        title: "Before",
                        content:
                            "Copying the dict out of the source file and rewriting the quotes and keywords by hand, one line at a time.",
                    },
                    {
                        title: "After",
                        content:
                            "A JSON file with the same structure, produced in one step, so the fixture cannot drift from the dict it was taken from.",
                    },
                ],
                bottomdesc: "Keeps fixtures honest without a throwaway script.",
            },
        ],
        relatedTools: [TOOL_LINKS.jsonToPython, TOOL_LINKS.hub, TOOL_LINKS.formatter],
    },

    jsonToPythonDict: {
        slug: "json-to-python-dict",
        metaTitle: "JSON to Python Dict Converter - Online & Free",
        metaDescription:
            "Convert JSON to a Python dict literal online. null becomes None, true and false become True and False, with 4-space indents. Free and private.",
        keywords: [
            "json to python dict",
            "json to dict",
            "convert json to python dictionary",
            "json to python",
            "json to python dict online",
        ],
        heading: "JSON to Python Dict Converter",
        subheading:
            "Paste JSON and get a Python dict literal you can drop straight into your code - None, True/False and 4-space indents.",
        sample: LANGUAGE_BY_ID.json.sample,
        target: "python",
        faqs: withCommonFaqs([
            {
                title: "Why not just use json.loads()?",
                content:
                    "json.loads() is right when the JSON arrives at runtime. This is for the other case: you want the dict written out in your source file, a notebook cell or a test, so there is nothing to parse at runtime and nothing to import.",
            },
            {
                title: "What does the output look like?",
                content:
                    "A dict literal with 4-space indentation, single-quoted keys and strings, None for null, True and False for the booleans, and a trailing comma on the last item - close to what Black would format for you.",
            },
            {
                title: "Are nested objects and arrays handled?",
                content:
                    "Yes, to any depth. Nested objects become nested dicts and arrays become lists, with the indentation carried through.",
            },
            {
                title: "Can I paste something that is not strict JSON?",
                content:
                    "Yes. The input side accepts JavaScript objects, PHP arrays, Ruby hashes and Python dicts too, so you can convert between any of them - this page just opens with JSON in and Python out.",
            },
        ]),
        examples: [
            {
                title: "An API response as a Python literal",
                description:
                    "You have a sample response from the docs or from curl, and you want it inline in a script.",
                list: [
                    {
                        title: "Before",
                        content:
                            "JSON with double quotes, true, false and null - none of which Python will accept if you paste it straight into a .py file.",
                    },
                    {
                        title: "After",
                        content:
                            "A dict literal that runs as-is, with the JSON keywords translated and the nesting indented the way Python code is normally written.",
                    },
                ],
                bottomdesc: "Saves a find-and-replace pass that is easy to get subtly wrong.",
            },
        ],
        relatedTools: [TOOL_LINKS.pythonToJson, TOOL_LINKS.hub, TOOL_LINKS.formatter],
    },

    phpArrayToJson: {
        slug: "php-array-to-json",
        metaTitle: "PHP Array to JSON Converter - Online & Free",
        metaDescription:
            "Convert a PHP array to JSON online. Supports short [] and long array() syntax, nested arrays, null, true and false. Free, private, no signup.",
        keywords: [
            "php array to json",
            "php array to json online",
            "convert php array to json",
            "php array to json converter online",
            "php array to json object",
        ],
        heading: "PHP Array to JSON Converter",
        subheading:
            "Paste a PHP array - short [] syntax or array(), nested as deep as you like - and get valid JSON back.",
        sample: LANGUAGE_BY_ID.php.sample,
        target: "json",
        faqs: withCommonFaqs([
            {
                title: "Does it accept both PHP array syntaxes?",
                content:
                    'Yes. The short form ["key" => "value"] and the long form array("key" => "value") both work, including the array ( spacing that var_export() produces, and they can be nested inside each other.',
            },
            {
                title: "How are keyed and list arrays handled?",
                content:
                    "The same way json_encode() handles them. An array with string keys becomes a JSON object. An array whose keys are 0, 1, 2... in order becomes a JSON array. A mixed array keeps its positional keys, so [\"a\", \"b\" => 2] becomes {\"0\":\"a\",\"b\":2}.",
            },
            {
                title: "Is this the same as running json_encode()?",
                content:
                    "The result is, for the cases above - but json_encode() needs the array to exist inside a running PHP process. This works on the array as text, so you can convert something pasted from a config file, a var_export() dump or a Stack Overflow answer without setting up PHP.",
            },
            {
                title: "Can I convert JSON back into a PHP array?",
                content:
                    "Yes - switch the output format to PHP, or start from the JSON to PHP Array page, which opens with that direction selected.",
            },
        ]),
        examples: [
            {
                title: "A config array that has to become JSON",
                description:
                    "Laravel and WordPress projects keep a lot of configuration in PHP arrays that eventually needs a JSON equivalent.",
                list: [
                    {
                        title: "Before",
                        content:
                            "A nested array of settings written with => arrows, which is not something any JSON validator or API client will take.",
                    },
                    {
                        title: "After",
                        content:
                            "The same settings as formatted JSON, ready for a config file, an API request or a front-end that expects JSON.",
                    },
                ],
                bottomdesc: "No throwaway PHP script needed just to call json_encode() once.",
            },
            {
                title: "Reading a var_export() dump",
                description:
                    "Debug output from var_export() is accurate but painful to read once it is more than a few levels deep.",
                list: [
                    {
                        title: "Before",
                        content:
                            "Pages of array ( ... ) with mixed indentation and numeric keys, printed into a log or a browser response.",
                    },
                    {
                        title: "After",
                        content:
                            "Clean JSON with the structure visible, which you can then fold and search in any JSON viewer.",
                    },
                ],
                bottomdesc: "Makes a dump readable without editing it by hand.",
            },
        ],
        relatedTools: [TOOL_LINKS.jsonToPhp, TOOL_LINKS.hub, TOOL_LINKS.formatter],
    },

    jsonToPhpArray: {
        slug: "json-to-php-array",
        metaTitle: "JSON to PHP Array Converter - Online & Free",
        metaDescription:
            "Convert JSON to a PHP array literal online, using short [] syntax with => arrows. Nested objects supported. Runs in your browser, no signup.",
        keywords: [
            "json to php array",
            "convert json to php array",
            "json to php",
            "json to php array online",
            "json decode to array",
        ],
        heading: "JSON to PHP Array Converter",
        subheading:
            "Paste JSON and get a PHP array literal in modern short [] syntax, ready to paste into your code.",
        sample: LANGUAGE_BY_ID.json.sample,
        target: "php",
        faqs: withCommonFaqs([
            {
                title: "Which array syntax does it output?",
                content:
                    "The short [] syntax with => arrows, which is what PHP 5.4 and later use and what most style guides now expect. Objects become keyed arrays and JSON arrays become list arrays.",
            },
            {
                title: "Why are the strings double-quoted?",
                content:
                    "Because PHP single-quoted strings do not interpret escapes like \\n, so a value containing a newline would come out wrong. Double quotes keep every value exactly as it was, with $ escaped so it cannot start interpolation.",
            },
            {
                title: "How is this different from json_decode()?",
                content:
                    "json_decode() gives you a value at runtime. This gives you the literal to write into your source - handy for a config file, a fixture, a seeder or a default value where you do not want to parse a string every time the file loads.",
            },
            {
                title: "Does it handle deeply nested JSON?",
                content:
                    "Yes, to any depth, with indentation carried through each level so the result stays readable rather than collapsing onto one line.",
            },
            {
                title: "What happens to an empty JSON object?",
                content:
                    "It becomes an empty array, []. PHP has a single array type, so an empty object and an empty list are written the same way - which is also why json_encode() on an empty PHP array gives you [] rather than {}. If you need it to encode back as an object, cast it with (object) [] in your code.",
            },
        ]),
        examples: [
            {
                title: "An API sample becoming a PHP fixture",
                description:
                    "You have JSON from the API docs and you need it as a PHP value in a test or a seeder.",
                list: [
                    {
                        title: "Before",
                        content:
                            "Wrapping the JSON in json_decode('...', true) with the quoting escaped by hand, which is fiddly and re-parses the string on every run.",
                    },
                    {
                        title: "After",
                        content:
                            "A plain PHP array literal with the same structure, which reads better in a diff and costs nothing at runtime.",
                    },
                ],
                bottomdesc: "Particularly useful for Laravel seeders and PHPUnit data providers.",
            },
        ],
        relatedTools: [TOOL_LINKS.phpToJson, TOOL_LINKS.hub, TOOL_LINKS.jsObject],
    },
};
