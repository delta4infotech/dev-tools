"use client";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, BrushCleaning, Bold, Italic, Underline, Strikethrough, Type } from "lucide-react";
import FAQ, { FAQProps } from "../../(components)/FAQ";
import Example, { ExampleProps } from "../../(components)/Example";
import SocialCard from "../../(components)/Social-Card";

// Unicode conversion functions
const formatText = {
    bold: (text: string) => {
        const boldMap: { [key: string]: string } = {
            'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨', 'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭',
            'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
            '0': '𝟬', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰', '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵'
        };
        return text.split('').map(char => boldMap[char] || char).join('');
    },
    italic: (text: string) => {
        const italicMap: { [key: string]: string } = {
            'A': '𝘈', 'B': '𝘉', 'C': '𝘊', 'D': '𝘋', 'E': '𝘌', 'F': '𝘍', 'G': '𝘎', 'H': '𝘏', 'I': '𝘐', 'J': '𝘑', 'K': '𝘒', 'L': '𝘓', 'M': '𝘔', 'N': '𝘕', 'O': '𝘖', 'P': '𝘗', 'Q': '𝘘', 'R': '𝘙', 'S': '𝘚', 'T': '𝘛', 'U': '𝘜', 'V': '𝘝', 'W': '𝘞', 'X': '𝘟', 'Y': '𝘠', 'Z': '𝘡',
            'a': '𝘢', 'b': '𝘣', 'c': '𝘤', 'd': '𝘥', 'e': '𝘦', 'f': '𝘧', 'g': '𝘨', 'h': '𝘩', 'i': '𝘪', 'j': '𝘫', 'k': '𝘬', 'l': '𝘭', 'm': '𝘮', 'n': '𝘯', 'o': '𝘰', 'p': '𝘱', 'q': '𝘲', 'r': '𝘳', 's': '𝘴', 't': '𝘵', 'u': '𝘶', 'v': '𝘷', 'w': '𝘸', 'x': '𝘹', 'y': '𝘺', 'z': '𝘻'
        };
        return text.split('').map(char => italicMap[char] || char).join('');
    },
    boldItalic: (text: string) => {
        const boldItalicMap: { [key: string]: string } = {
            'A': '𝑨', 'B': '𝑩', 'C': '𝑪', 'D': '𝑫', 'E': '𝑬', 'F': '𝑭', 'G': '𝑮', 'H': '𝑯', 'I': '𝑰', 'J': '𝑱', 'K': '𝑲', 'L': '𝑳', 'M': '𝑴', 'N': '𝑵', 'O': '𝑶', 'P': '𝑷', 'Q': '𝑸', 'R': '𝑹', 'S': '𝑺', 'T': '𝑻', 'U': '𝑼', 'V': '𝑽', 'W': '𝑾', 'X': '𝑿', 'Y': '𝒀', 'Z': '𝒁',
            'a': '𝒂', 'b': '𝒃', 'c': '𝒄', 'd': '𝒅', 'e': '𝒆', 'f': '𝒇', 'g': '𝒈', 'h': '𝒉', 'i': '𝒊', 'j': '𝒋', 'k': '𝒌', 'l': '𝒍', 'm': '𝒎', 'n': '𝒏', 'o': '𝒐', 'p': '𝒑', 'q': '𝒒', 'r': '𝒓', 's': '𝒔', 't': '𝒕', 'u': '𝒖', 'v': '𝒗', 'w': '𝒘', 'x': '𝒙', 'y': '𝒚', 'z': '𝒛'
        };
        return text.split('').map(char => boldItalicMap[char] || char).join('');
    },
    underline: (text: string) => {
        // Improved implementation: join characters with underline combining character
        return text.split('').map(char => char + '\u0332').join('');
    },
    strikethrough: (text: string) => {
        return text.split('').map(char => char + '\u0336').join('');
    },
    monospace: (text: string) => {
        const monospaceMap: { [key: string]: string } = {
            'A': '𝙰', 'B': '𝙱', 'C': '𝙲', 'D': '𝙳', 'E': '𝙴', 'F': '𝙵', 'G': '𝙶', 'H': '𝙷', 'I': '𝙸', 'J': '𝙹', 'K': '𝙺', 'L': '𝙻', 'M': '𝙼', 'N': '𝙽', 'O': '𝙾', 'P': '𝙿', 'Q': '𝚀', 'R': '𝚁', 'S': '𝚂', 'T': '𝚃', 'U': '𝚄', 'V': '𝚅', 'W': '𝚆', 'X': '𝚇', 'Y': '𝚈', 'Z': '𝚉',
            'a': '𝚊', 'b': '𝚋', 'c': '𝚌', 'd': '𝚍', 'e': '𝚎', 'f': '𝚏', 'g': '𝚐', 'h': '𝚑', 'i': '𝚒', 'j': '𝚓', 'k': '𝚔', 'l': '𝚕', 'm': '𝚖', 'n': '𝚗', 'o': '𝚘', 'p': '𝚙', 'q': '𝚚', 'r': '𝚛', 's': '𝚜', 't': '𝚝', 'u': '𝚞', 'v': '𝚟', 'w': '𝚠', 'x': '𝚡', 'y': '𝚢', 'z': '𝚣',
            '0': '𝟶', '1': '𝟷', '2': '𝟸', '3': '𝟹', '4': '𝟺', '5': '𝟻', '6': '𝟼', '7': '𝟽', '8': '𝟾', '9': '𝟿'
        };
        return text.split('').map(char => monospaceMap[char] || char).join('');
    }
};


const faqs: FAQProps[] = [
    {
        id: "1",
        title: "Why should I format my LinkedIn posts?",
        content: "Formatted LinkedIn posts stand out in the feed, improve readability, and boost engagement. Bold, italic, and structured text helps grab attention and makes your content more professional and easier to scan on mobile devices."
    },
    {
        id: "2",
        title: "Does LinkedIn support native text formatting?",
        content: "No, LinkedIn doesn't offer built-in text formatting options like bold or italic. This tool uses Unicode characters to create styled text that displays properly across all devices and platforms."
    },
    {
        id: "3",
        title: "Will formatted text work on mobile devices?",
        content: "Yes, the formatted text works perfectly on all devices including mobile phones, tablets, and desktop computers. The Unicode characters are universally supported across platforms."
    },
    {
        id: "4",
        title: "Can I use this for LinkedIn comments and messages?",
        content: "Absolutely! You can use formatted text in LinkedIn posts, comments, direct messages, and even in your profile summary to make your content more engaging and professional."
    },
    {
        id: "5",
        title: "Is there a limit to how much text I can format?",
        content: "No, there's no limit. You can format as much text as you want. The tool processes everything locally in your browser, so you can format long posts, articles, or any content without restrictions."
    },
    {
        id: "6",
        title: "Are there any accessibility concerns with formatted text?",
        content: "While formatted text is visually appealing, use it strategically. Screen readers may have difficulty with heavily formatted text, so keep your core message in regular text and use formatting for emphasis only."
    }
];

const examples: ExampleProps[] = [
    {
        title: "Professional Announcements",
        description: "Make your career updates and business announcements stand out with strategic formatting.",
        list: [
            {
                title: "Before",
                content: "Excited to announce that I've joined TechCorp as Senior Developer. Looking forward to contributing to innovative projects and working with an amazing team."
            },
            {
                title: "After",
                content: "🎉 𝗘𝘅𝗰𝗶𝘁𝗲𝗱 𝘁𝗼 𝗮𝗻𝗻𝗼𝘂𝗻𝗰𝗲 that I've joined 𝗧𝗲𝗰𝗵𝗖𝗼𝗿𝗽 as 𝘚𝘦𝘯𝘪𝘰𝘳 𝘋𝘦𝘷𝘦𝘭𝘰𝘱𝘦𝘳\n\nLooking forward to:\n• Contributing to innovative projects\n• Working with an amazing team\n• Growing in this new role"
            }
        ],
        bottomdesc: "Strategic use of bold text and bullet points makes announcements more engaging and easier to read."
    },
    {
        title: "Thought Leadership Content",
        description: "Structure your insights and lessons learned with clear formatting for maximum impact.",
        list: [
            {
                title: "Before",
                content: "After 5 years in product management, I learned that the most important skill is listening to users. Here are three key lessons about user feedback that changed how I work."
            },
            {
                title: "After",
                content: "𝗔𝗳𝘁𝗲𝗿 𝟱 𝘆𝗲𝗮𝗿𝘀 𝗶𝗻 𝗽𝗿𝗼𝗱𝘂𝗰𝘁 𝗺𝗮𝗻𝗮𝗴𝗲𝗺𝗲𝗻𝘁, I learned that the most important skill is 𝘭𝘪𝘴𝘵𝘦𝘯𝘪𝘯𝘨 𝘵𝘰 𝘶𝘴𝘦𝘳𝘴.\n\n✨ 𝗞𝗲𝘆 𝗹𝗲𝘀𝘀𝗼𝗻𝘀 𝗮𝗯𝗼𝘂𝘁 𝘂𝘀𝗲𝗿 𝗳𝗲𝗲𝗱𝗯𝗮𝗰𝗸:\n\n→ Listen before you build\n→ Questions reveal more than answers\n→ Silent users often have the loudest insights"
            }
        ],
        bottomdesc: "Well-formatted thought leadership posts increase engagement and establish your expertise in your field."
    },
    {
        title: "Event Promotion",
        description: "Make your event announcements impossible to miss with eye-catching formatting.",
        list: [
            {
                title: "Before",
                content: "Join us for our webinar next Thursday at 2 PM EST. We'll be discussing the future of remote work and how to build effective distributed teams. Register now!"
            },
            {
                title: "After",
                content: "🚀 𝗝𝗼𝗶𝗻 𝗼𝘂𝗿 𝘂𝗽𝗰𝗼𝗺𝗶𝗻𝗴 𝘄𝗲𝗯𝗶𝗻𝗮𝗿!\n\n📅 𝗪𝗵𝗲𝗻: Next Thursday at 2 PM EST\n💼 𝗧𝗼𝗽𝗶𝗰: The Future of Remote Work\n🎯 𝗙𝗼𝗰𝘂𝘀: Building Effective Distributed Teams\n\n✅ 𝗥𝗲𝗴𝗶𝘀𝘁𝗲𝗿 𝗻𝗼𝘄 → Link in comments"
            }
        ],
        bottomdesc: "Formatted event posts with clear structure and emojis significantly increase registration rates and engagement."
    },
    {
        title: "Weekly Updates & Lists",
        description: "Transform routine updates into engaging content that people actually want to read.",
        list: [
            {
                title: "Before",
                content: "This week I completed three major projects, attended two networking events, and read an interesting book about leadership. Next week I'm focusing on client presentations and team building."
            },
            {
                title: "After",
                content: "📊 𝗪𝗲𝗲𝗸𝗹𝘆 𝗨𝗽𝗱𝗮𝘁𝗲\n\n✅ 𝗧𝗵𝗶𝘀 𝗪𝗲𝗲𝗸:\n• Completed 3 major projects\n• Attended 2 networking events  \n• Read: Leadership in Action\n\n🎯 𝗡𝗲𝘅𝘁 𝗪𝗲𝗲𝗸:\n• Client presentations\n• Team building sessions\n• Strategic planning"
            }
        ],
        bottomdesc: "Structured weekly updates help build your personal brand and keep your network engaged with your professional journey."
    }
];

const Header = () => {
    return (
        <div className="w-full bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-2xl md:text-3xl font-bold text-center text-foreground">LinkedIn Text Formatter</h1>
                <p className="text-sm text-muted-foreground text-center">Format your LinkedIn posts with bold, italic, and professional styling to boost engagement.</p>
            </div>
        </div>
    )
}

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

export default function Content() {
    const [inputText, setInputText] = useState('Excited to share some exciting news! 🎉\n\nJust launched my new project and looking forward to connecting with fellow developers and entrepreneurs.\n\nWhat are you working on this week?');
    const [formattedText, setFormattedText] = useState('Excited to share some exciting news! 🎉\n\nJust launched my new project and looking forward to connecting with fellow developers and entrepreneurs.\n\nWhat are you working on this week?');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const applyFormatting = (formatType: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'monospace' | 'boldItalic') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = inputText.substring(start, end);

        if (selectedText) {
            const formattedSelection = formatText[formatType](selectedText);
            const newText = inputText.substring(0, start) + formattedSelection + inputText.substring(end);
            setInputText(newText);
            setFormattedText(newText);

            // Restore cursor position after formatting
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start, start + formattedSelection.length);
            }, 0);
        }
    };

    const handleClear = () => {
        setInputText('');
        setFormattedText('');
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(formattedText);
    };

    const handleTextChange = (value: string) => {
        setInputText(value);
        setFormattedText(value);
    };

    return (
        <>
            <Header />

            {/* Main Tool Content */}
            <div className="bg-background w-full">
                <div className="mx-auto px-4 md:px-10 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
                        {/* Text Editor */}
                        <div className="flex flex-col">
                            <div className="border border-border/50 rounded-lg overflow-hidden shadow-sm min-h-[700px] flex flex-col">
                                {/* Formatting Toolbar */}
                                <div className="bg-content2 p-3 border-b border-border/50">
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => applyFormatting('bold')}
                                            className="px-3 py-1.5 h-8 text-sm"
                                            size="sm"
                                        >
                                            <Bold className="w-3.5 h-3.5 mr-1.5" />
                                            Bold
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => applyFormatting('italic')}
                                            className="px-3 py-1.5 h-8 text-sm"
                                            size="sm"
                                        >
                                            <Italic className="w-3.5 h-3.5 mr-1.5" />
                                            Italic
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => applyFormatting('boldItalic')}
                                            className="px-3 py-1.5 h-8 text-sm"
                                            size="sm"
                                        >
                                            <Bold className="w-3.5 h-3.5 mr-1.5" />
                                            Bold Italic
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => applyFormatting('underline')}
                                            className="px-3 py-1.5 h-8 text-sm"
                                            size="sm"
                                        >
                                            <Underline className="w-3.5 h-3.5 mr-1.5" />
                                            Underline
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => applyFormatting('strikethrough')}
                                            className="px-3 py-1.5 h-8 text-sm"
                                            size="sm"
                                        >
                                            <Strikethrough className="w-3.5 h-3.5 mr-1.5" />
                                            Strike
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => applyFormatting('monospace')}
                                            className="px-3 py-1.5 h-8 text-sm"
                                            size="sm"
                                        >
                                            <Type className="w-3.5 h-3.5 mr-1.5" />
                                            Mono
                                        </Button>
                                    </div>
                                </div>

                                {/* Text Input */}
                                <div className="p-4 flex-1">
                                    <Textarea
                                        ref={textareaRef}
                                        value={inputText}
                                        onChange={(e) => handleTextChange(e.target.value)}
                                        placeholder="Paste your LinkedIn post here or start typing..."
                                        className="min-h-[350px] resize-none border-0 p-0 focus-visible:ring-0 text-base bg-transparent"
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="bg-content2 p-3 border-t border-border/50 flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={handleClear}
                                        className="px-3 py-1.5 h-8 text-sm"
                                        size="sm"
                                    >
                                        <BrushCleaning className="w-3.5 h-3.5 mr-1.5" />
                                        Clear
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleCopy}
                                        className="px-3 py-1.5 h-8 text-sm"
                                        size="sm"
                                    >
                                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                                        Copy
                                    </Button>
                                </div>
                            </div>
                            <div className="text-sm font-medium mt-3 text-muted-foreground text-center">
                                Text Editor - Select text and apply formatting
                            </div>
                        </div>

                        {/* Live Preview */}
                        <div className="flex flex-col">
                            <div className="border border-border/50 rounded-lg overflow-hidden shadow-sm bg-content2 flex items-center justify-center p-6 min-h-[700px]">
                                <SocialCard
                                    author={{
                                        name: "John Doe",
                                        username: "john_doe",
                                        avatar: "https://github.com/shadcn.png",
                                        timeAgo: "now",
                                    }}
                                    content={{
                                        text: formattedText || "Your formatted text will appear here...",
                                    }}
                                    engagement={{
                                        likes: 42,
                                        comments: 8,
                                        shares: 3,
                                        isLiked: false,
                                        isBookmarked: false,
                                    }}
                                    className="shadow-xl"
                                />
                            </div>
                            <div className="text-sm font-medium mt-3 text-muted-foreground text-center">
                                Live Preview
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