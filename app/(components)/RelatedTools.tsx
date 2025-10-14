import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

interface RelatedTool {
    title: string;
    description: string;
    link: string;
}

interface RelatedToolsProps {
    tools: RelatedTool[];
}

export default function RelatedTools({ tools }: RelatedToolsProps) {
    if (!tools || tools.length === 0) return null;

    return (
        <div className="w-full bg-background py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-foreground">
                    Related Tools
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {tools.map((tool) => (
                        <Link key={tool.link} href={tool.link} className="block h-full">
                            <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 relative overflow-hidden h-full bg-card/50 backdrop-blur-sm">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                <CardHeader className="relative p-4 sm:p-6">
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="text-base sm:text-lg font-semibold group-hover:text-primary transition-colors duration-300">
                                            {tool.title}
                                        </CardTitle>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0 ml-2">
                                            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                        </div>
                                    </div>
                                    <CardDescription className="text-muted-foreground leading-relaxed text-sm mt-2">
                                        {tool.description}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
