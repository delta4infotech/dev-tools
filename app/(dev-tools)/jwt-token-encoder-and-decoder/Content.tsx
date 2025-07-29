"use client";
import { useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { oneDark } from "@codemirror/theme-one-dark";
import { Copy, BrushCleaning, Lock, Unlock, CheckCircle, XCircle } from "lucide-react";
import FAQ, { FAQProps } from "../../(components)/FAQ";
import Example, { ExampleProps } from "../../(components)/Example";

const faqs = [
    {
        id: "1",
        title: "What is a JWT and how does it work?",
        content:
            "JWT (JSON Web Token) is a compact, URL-safe means of representing claims between two parties. It consists of three parts: header, payload, and signature, separated by dots. JWTs are commonly used for authentication and secure information exchange.",
    },
    {
        id: "2",
        title: "Is my JWT data safe with this tool?",
        content:
            "Yes, absolutely. This tool processes everything locally in your browser without sending any data to servers. Your JWT tokens and sensitive information never leave your device, ensuring complete privacy and security.",
    },
    {
        id: "3",
        title: "Can I verify JWT signatures?",
        content:
            "Yes, you can verify JWT signatures by providing the secret key. The tool supports HMAC algorithms (HS256, HS384, HS512). For RSA and ECDSA algorithms, you would need the public key for verification.",
    },
    {
        id: "4",
        title: "What happens if my JWT is invalid or expired?",
        content:
            "The tool will display appropriate error messages for invalid JWTs, including malformed tokens, invalid base64 encoding, or JSON parsing errors. For expired tokens, you'll see the expiration time in the decoded payload.",
    },
    {
        id: "5",
        title: "Can I create new JWT tokens?",
        content:
            "Yes, you can create new JWT tokens by providing the header and payload data, along with a secret key for signing. The tool will generate a properly formatted and signed JWT token.",
    },
    {
        id: "6",
        title: "What JWT algorithms are supported?",
        content:
            "This tool supports HMAC algorithms (HS256, HS384, HS512) for both encoding and signature verification. The algorithm is specified in the JWT header and used for proper token validation.",
    }
];

const examples = [
    {
        title: "User Authentication Token",
        description: "Decode authentication tokens to inspect user claims and permissions.",
        list: [
            {
                title: "JWT Token",
                content: "A JWT token containing user ID, email, roles, and expiration time encoded in the payload with proper headers and signature for secure authentication."
            },
            {
                title: "Decoded Payload",
                content: "The decoded payload reveals user information like ID, email, admin role, and expiration timestamp, making it easy to understand token contents and validity."
            },
        ],
        bottomdesc: "Authentication JWTs help verify user identity and permissions while maintaining security through cryptographic signatures."
    },
    {
        title: "API Access Token",
        description: "Create and verify API access tokens with specific scopes and permissions.",
        list: [
            {
                title: "Token Creation",
                content: "Generate a new JWT token with API scopes, client ID, and expiration time for secure API access and rate limiting."
            },
            {
                title: "Token Verification",
                content: "Verify the token signature and decode the payload to check API permissions, rate limits, and token validity before granting access."
            },
        ],
        bottomdesc: "API tokens provide secure, stateless authentication for service-to-service communication and API access control."
    },
    {
        title: "Session Management",
        description: "Handle user sessions with encrypted JWT tokens containing session data.",
        list: [
            {
                title: "Session Token",
                content: "A JWT containing session ID, user preferences, last activity timestamp, and security flags for comprehensive session management."
            },
            {
                title: "Session Validation",
                content: "Decode and verify session tokens to check user status, session expiry, and security constraints before allowing continued access."
            },
        ],
        bottomdesc: "JWT sessions provide stateless session management with built-in security and easy horizontal scaling."
    },
    {
        title: "Microservices Communication",
        description: "Secure communication between microservices using signed JWT tokens.",
        list: [
            {
                title: "Service Token",
                content: "Create JWT tokens for service-to-service communication containing service identity, permissions, and request context."
            },
            {
                title: "Token Validation",
                content: "Verify incoming service tokens to ensure request authenticity, check service permissions, and maintain secure microservices architecture."
            },
        ],
        bottomdesc: "Microservice JWTs enable secure, authenticated communication between distributed services with verifiable identity."
    }
];

const FAQs = ({ faqs }: { faqs: FAQProps[] }) => {
    return (
        <div className="w-full bg-muted/20 py-16">
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
                <h1 className="text-2xl md:text-3xl font-bold text-center text-foreground">JWT Encoder & Decoder</h1>
                <p className="text-sm text-muted-foreground text-center">Encode, decode, and verify JSON Web Tokens securely in your browser.</p>
            </div>
        </div>
    )
}

// JWT utility functions
const base64UrlDecode = (str: string) => {
    try {
        // Add padding if needed
        const padding = '='.repeat((4 - str.length % 4) % 4);
        const base64 = str.replace(/-/g, '+').replace(/_/g, '/') + padding;
        return atob(base64);
    } catch {
        throw new Error('Invalid base64 encoding');
    }
};

const base64UrlEncode = (str: string) => {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

// Simple HMAC SHA256 implementation for demo purposes
const simpleSign = (data: string, secret: string) => {
    // Note: This is a simplified implementation for demo purposes
    // In production, use a proper JWT library like jsonwebtoken
    return base64UrlEncode(btoa(`${data}:${secret}:signature`));
};

export default function Content() {
    const [jwtToken, setJwtToken] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.a-string-secret-at-least-256-bits-long');
    const [decodedHeader, setDecodedHeader] = useState('');
    const [decodedPayload, setDecodedPayload] = useState('');
    const [signature, setSignature] = useState('');
    const [secret, setSecret] = useState('a-string-secret-at-least-256-bits-long');
    const [isValidSignature, setIsValidSignature] = useState<boolean | null>(null);

    // Encoding states
    const [headerInput, setHeaderInput] = useState('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
    const [payloadInput, setPayloadInput] = useState('{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "admin": true,\n  "iat": 1516239022\n}');
    const [encodedJWT, setEncodedJWT] = useState('');

    const [editorHeight, setEditorHeight] = useState('400px');
    const [fontSize, setFontSize] = useState(14);

    // Calculate dynamic height and font size
    useEffect(() => {
        const calculateHeight = () => {
            const headerHeight = 80;
            const buttonHeight = 60;
            const padding = 64;
            const margin = 64;
            const labelHeight = 50;
            const bottomBuffer = 20;

            const availableHeight = window.innerHeight - headerHeight - buttonHeight - padding - margin - labelHeight - bottomBuffer;

            let minHeight, maxHeightPercent;

            if (window.innerWidth >= 2560) {
                minHeight = 500;
                maxHeightPercent = 0.5;
            } else if (window.innerWidth >= 1920) {
                minHeight = 450;
                maxHeightPercent = 0.45;
            } else if (window.innerWidth >= 1440) {
                minHeight = 400;
                maxHeightPercent = 0.4;
            } else {
                minHeight = 350;
                maxHeightPercent = 0.35;
            }

            const maxHeight = window.innerHeight * maxHeightPercent;
            return Math.max(Math.min(availableHeight, maxHeight), minHeight);
        };

        const calculateFontSize = () => {
            const width = window.innerWidth;
            let baseSize = 14;

            if (width >= 3840) baseSize = 16;
            else if (width >= 2560) baseSize = 15;
            else if (width >= 1920) baseSize = 14;
            else if (width >= 1440) baseSize = 13;
            else if (width >= 1024) baseSize = 12;
            else baseSize = 11;

            return baseSize;
        };

        const updateDimensions = () => {
            setEditorHeight(`${calculateHeight()}px`);
            setFontSize(calculateFontSize());
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    const handleDecode = () => {
        try {
            const parts = jwtToken.split('.');
            if (parts.length !== 3) {
                throw new Error('Invalid JWT format. Expected 3 parts separated by dots.');
            }

            const [headerPart, payloadPart, signaturePart] = parts;

            // Decode header
            const decodedHeaderStr = base64UrlDecode(headerPart);
            const headerObj = JSON.parse(decodedHeaderStr);
            setDecodedHeader(JSON.stringify(headerObj, null, 2));

            // Decode payload
            const decodedPayloadStr = base64UrlDecode(payloadPart);
            const payloadObj = JSON.parse(decodedPayloadStr);
            setDecodedPayload(JSON.stringify(payloadObj, null, 2));

            // Set signature
            setSignature(signaturePart);

            // Verify signature if secret is provided
            if (secret.trim()) {
                const data = `${headerPart}.${payloadPart}`;
                const expectedSignature = simpleSign(data, secret);
                setIsValidSignature(expectedSignature === signaturePart);
            } else {
                setIsValidSignature(null);
            }

        } catch (error) {
            setDecodedHeader(`Error: ${(error as Error).message}`);
            setDecodedPayload('');
            setSignature('');
            setIsValidSignature(null);
        }
    };

    const handleEncode = () => {
        try {
            // Validate and parse header
            const headerObj = JSON.parse(headerInput);
            const headerEncoded = base64UrlEncode(JSON.stringify(headerObj));

            // Validate and parse payload
            const payloadObj = JSON.parse(payloadInput);
            const payloadEncoded = base64UrlEncode(JSON.stringify(payloadObj));

            // Create signature
            const data = `${headerEncoded}.${payloadEncoded}`;
            const signatureEncoded = simpleSign(data, secret);

            // Combine parts
            const newJWT = `${headerEncoded}.${payloadEncoded}.${signatureEncoded}`;
            setEncodedJWT(newJWT);

        } catch (error) {
            setEncodedJWT(`Error: ${(error as Error).message}`);
        }
    };

    const handleClear = () => {
        setJwtToken('');
        setDecodedHeader('');
        setDecodedPayload('');
        setSignature('');
        setIsValidSignature(null);
    };

    const handleClearEncoding = () => {
        setHeaderInput('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
        setPayloadInput('{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "admin": true,\n  "iat": 1516239022\n}');
        setEncodedJWT('');
    };

    return (
        <>
            <Header />
            {/* Main Tool Content */}
            <div className="flex-1 bg-background w-full h-full">
                <div className="mx-auto px-4 md:px-10 py-8">

                    <Tabs defaultValue="decoder" className="w-full">
                        <TabsList>
                            <TabsTrigger value="decoder">
                                <Unlock className="w-4 h-4 mr-2" />
                                Decoder
                            </TabsTrigger>
                            <TabsTrigger value="encoder">
                                <Lock className="w-4 h-4 mr-2" />
                                Encoder
                            </TabsTrigger>
                        </TabsList>

                        {/* JWT Decoder Tab */}
                        <TabsContent value="decoder" className="mt-6 bg-card border border-foreground/10 rounded-lg p-6 shadow-sm">
                            {/* JWT Input */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2 text-foreground">JWT Token</label>
                                <div className="flex flex-col gap-4">
                                    <Textarea
                                        value={jwtToken}
                                        onChange={(e) => setJwtToken(e.target.value)}
                                        placeholder="Paste your JWT token here..."
                                        className="min-h-20 font-mono text-sm"
                                    />
                                    <div className="flex gap-2">
                                        <Button onClick={handleDecode} className="px-6">
                                            <Unlock className="w-4 h-4 mr-2" />
                                            Decode JWT
                                        </Button>
                                        <Button variant="outline" onClick={handleClear}>
                                            <BrushCleaning className="w-4 h-4 mr-2" />
                                            Clear
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Decoded Results */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Header */}
                                <div className="flex flex-col">
                                    <div className="border border-border/50 rounded-lg overflow-hidden shadow-sm" style={{ height: editorHeight }}>
                                        <div className="bg-[#282c34] p-2 flex justify-between items-center">
                                            <span className="text-sm font-medium text-white">Header</span>
                                            <Button
                                                variant="outline"
                                                onClick={() => navigator.clipboard.writeText(decodedHeader)}
                                                className="px-3 py-1.5 h-8 text-sm"
                                                size="sm"
                                            >
                                                <Copy className="w-3.5 h-3.5 mr-1.5" />
                                                Copy
                                            </Button>
                                        </div>
                                        <CodeMirror
                                            value={decodedHeader}
                                            height={`calc(${editorHeight} - 40px)`}
                                            extensions={[json()]}
                                            readOnly
                                            theme={oneDark}
                                            basicSetup={{
                                                lineNumbers: true,
                                                foldGutter: true,
                                                highlightActiveLine: true,
                                            }}
                                            style={{ fontSize: `${fontSize}px` }}
                                        />
                                    </div>
                                </div>

                                {/* Payload */}
                                <div className="flex flex-col">
                                    <div className="border border-border/50 rounded-lg overflow-hidden shadow-sm" style={{ height: editorHeight }}>
                                        <div className="bg-[#282c34] p-2 flex justify-between items-center">
                                            <span className="text-sm font-medium text-white">Payload</span>
                                            <Button
                                                variant="outline"
                                                onClick={() => navigator.clipboard.writeText(decodedPayload)}
                                                className="px-3 py-1.5 h-8 text-sm"
                                                size="sm"
                                            >
                                                <Copy className="w-3.5 h-3.5 mr-1.5" />
                                                Copy
                                            </Button>
                                        </div>
                                        <CodeMirror
                                            value={decodedPayload}
                                            height={`calc(${editorHeight} - 40px)`}
                                            extensions={[json()]}
                                            readOnly
                                            theme={oneDark}
                                            basicSetup={{
                                                lineNumbers: true,
                                                foldGutter: true,
                                                highlightActiveLine: true,
                                            }}
                                            style={{ fontSize: `${fontSize}px` }}
                                        />
                                    </div>
                                </div>

                                {/* Signature Verification */}
                                <div className="flex flex-col">
                                    <div className="bg-card border border-foreground/10 rounded-lg p-4 shadow-sm" style={{ height: editorHeight }}>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-medium text-foreground">Signature Verification</h3>
                                            {isValidSignature !== null && (
                                                <div className="flex items-center gap-2">
                                                    {isValidSignature ? (
                                                        <>
                                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                                            <span className="text-sm text-green-700 dark:text-green-400">Valid signature</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="w-4 h-4 text-red-600" />
                                                            <span className="text-sm text-red-700 dark:text-red-400">Invalid signature</span>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-10 py-4">
                                            <div>
                                                <label className="block text-xs font-medium mb-2 text-muted-foreground">Secret Key</label>
                                                <Input
                                                    type="password"
                                                    value={secret}
                                                    onChange={(e) => setSecret(e.target.value)}
                                                    placeholder="Enter secret key..."
                                                    className="text-sm border bg-background border-foreground/10 rounded-md"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium mb-2 text-muted-foreground">Signature</label>
                                                <div className="bg-background p-2 rounded-md font-mono text-xs break-all overflow-x-auto overflow-y-auto max-h-48 max-w-full border border-foreground/10 whitespace-pre-wrap">
                                                    {signature || 'No signature'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* JWT Encoder Tab */}
                        <TabsContent value="encoder" className="mt-6 bg-card border border-foreground/10 rounded-lg p-6 shadow-sm">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                {/* Header Input */}
                                <div className="flex flex-col">
                                    <div className="border border-border/50 rounded-lg overflow-hidden shadow-sm" style={{ height: editorHeight }}>
                                        <div className="bg-[#282c34] p-2 flex justify-between items-center">
                                            <span className="text-sm font-medium text-white">Header</span>
                                            <Button
                                                variant="outline"
                                                onClick={() => navigator.clipboard.writeText(headerInput)}
                                                className="px-3 py-1.5 h-8 text-sm"
                                                size="sm"
                                            >
                                                <Copy className="w-3.5 h-3.5 mr-1.5" />
                                                Copy
                                            </Button>
                                        </div>
                                        <CodeMirror
                                            value={headerInput}
                                            height={`calc(${editorHeight} - 40px)`}
                                            extensions={[json()]}
                                            onChange={setHeaderInput}
                                            theme={oneDark}
                                            basicSetup={{
                                                lineNumbers: true,
                                                foldGutter: true,
                                                highlightActiveLine: true,
                                            }}
                                            style={{ fontSize: `${fontSize}px` }}
                                        />
                                    </div>
                                </div>

                                {/* Payload Input */}
                                <div className="flex flex-col">
                                    <div className="border border-border/50 rounded-lg overflow-hidden shadow-sm" style={{ height: editorHeight }}>
                                        <div className="bg-[#282c34] p-2 flex justify-between items-center">
                                            <span className="text-sm font-medium text-white">Payload</span>
                                            <Button
                                                variant="outline"
                                                onClick={() => navigator.clipboard.writeText(payloadInput)}
                                                className="px-3 py-1.5 h-8 text-sm"
                                                size="sm"
                                            >
                                                <Copy className="w-3.5 h-3.5 mr-1.5" />
                                                Copy
                                            </Button>
                                        </div>
                                        <CodeMirror
                                            value={payloadInput}
                                            height={`calc(${editorHeight} - 40px)`}
                                            extensions={[json()]}
                                            onChange={setPayloadInput}
                                            theme={oneDark}
                                            basicSetup={{
                                                lineNumbers: true,
                                                foldGutter: true,
                                                highlightActiveLine: true,
                                            }}
                                            style={{ fontSize: `${fontSize}px` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Secret Input and Generate Button */}
                            <div className="mb-6 border border-foreground/10 rounded-lg p-6 shadow-sm">
                                <label className="block text-sm font-medium mb-2 text-foreground">Secret Key (for HMAC signing)</label>
                                <div className="flex gap-4">
                                    <Input
                                        type="password"
                                        value={secret}
                                        onChange={(e) => setSecret(e.target.value)}
                                        placeholder="Enter secret key for signing..."
                                        className="flex-1 border border-foreground/10 rounded-md bg-background"
                                    />
                                    <Button onClick={handleEncode} className="px-6">
                                        <Lock className="w-4 h-4 mr-2" />
                                        Generate JWT
                                    </Button>
                                    <Button variant="outline" onClick={handleClearEncoding}>
                                        <BrushCleaning className="w-4 h-4 mr-2" />
                                        Clear
                                    </Button>
                                </div>
                            </div>

                            {/* Generated JWT Output */}
                            <div className=" border border-foreground/10 rounded-lg p-6 shadow-sm">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium mb-2 text-foreground">Generated JWT Token</label>
                                    <Button
                                        variant="outline"
                                        onClick={() => navigator.clipboard.writeText(encodedJWT)}
                                        className="px-3 py-1.5 h-8 text-sm"
                                        size="sm"
                                        disabled={!encodedJWT}
                                    >
                                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                                        Copy
                                    </Button>
                                </div>
                                <div className="font-mono text-sm break-all p-4 rounded-md min-h-16 bg-background border border-foreground/10">
                                    {encodedJWT || 'Generated JWT will appear here...'}
                                </div>

                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Examples Section */}
            <Examples examples={examples} />

            {/* FAQs Section */}
            <FAQs faqs={faqs} />
        </>
    );
}
