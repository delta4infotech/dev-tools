import React from 'react';

export interface ExampleProps {
    title: string;
    description?: string;
    list?: { title: string; content: string }[];
    bottomdesc?: string;
}

function Item({ title, description, list, bottomdesc }: ExampleProps) {
    return (
        <section className="mb-6">
            <div className="text-primary text-xl font-semibold mb-2 tracking-tight">
                {title}
            </div>
            {description && <p className="text-foreground mb-2">{description}</p>}
            {list && (
                <ol className="space-y-1 mb-2 list-disc pl-5">
                    {list.map((item, index) => (
                        <li key={index} className="text-primary flex gap-1">
                            <strong className="text-foreground">{item.title}:</strong>
                            <p className="text-muted-foreground">{item.content}</p>
                        </li>
                    ))}
                </ol>
            )}
            {bottomdesc && <p className="text-foreground/65 ">{bottomdesc}</p>}
        </section>
    );
}

export default function Example({ examples }: { examples: ExampleProps[] }) {
    return (
        <>
            {examples.map((example) => (
                <Item key={example.title} title={example.title} description={example.description} list={example.list} />
            ))}
        </>
    )
}

