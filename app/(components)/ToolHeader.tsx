interface ToolHeaderProps {
    title: string;
    description: string;
}

export default function ToolHeader({ title, description }: ToolHeaderProps) {
    return (
        <div className="w-full bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-2xl md:text-3xl font-bold text-center text-foreground">{title}</h1>
                <p className="text-sm text-muted-foreground text-center mt-2">{description}</p>
            </div>
        </div>
    );
}
