import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

interface HomeCardProps {
    title: string;
    description: string;
    link: string;
    icon?: React.ReactNode;
}

export default function HomeCard({ title, description, link, icon }: HomeCardProps) {
    return (
        <Link href={link} className="block h-full">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 relative overflow-hidden h-full bg-card/50 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <CardHeader className="relative p-4 sm:p-6">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            {icon && (
                                <div className="p-2 sm:p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 flex-shrink-0">
                                    {icon}
                                </div>
                            )}
                            <CardTitle className="text-base sm:text-lg font-semibold group-hover:text-primary transition-colors duration-300 truncate">
                                {title}
                            </CardTitle>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0 ml-2">
                            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                        </div>
                    </div>
                    <CardDescription className="text-muted-foreground leading-relaxed text-sm">
                        {description}
                    </CardDescription>
                </CardHeader>
            </Card>
        </Link>
    );
} 