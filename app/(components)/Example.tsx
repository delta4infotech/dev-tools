import React from 'react';

export interface ExampleProps {
    title: string;
    description?: string;
    list?: { title: string; content: string }[];
    bottomdesc?: string;
}

const meshBackground = {
    backgroundColor: 'hsla(8, 100%, 60%, 1)',
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 1799 1799' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E"), radial-gradient(circle at 50% 80%, hsla(18, 100%, 65%, 1) 14%, transparent 60%), radial-gradient(circle at 80% 20%, hsla(28, 100%, 70%, 1) 10%, transparent 70%), radial-gradient(circle at 20% 40%, hsla(3, 90%, 60%, 1) 12%, transparent 75%), radial-gradient(circle at 60% 10%, hsla(14, 95%, 55%, 1) 5%, transparent 80%);`,
    backgroundBlendMode: 'overlay, normal, normal, normal, normal' as const,
};

function Item({ title, description, list, bottomdesc, index }: ExampleProps & { index: number }) {
    const isEven = index % 2 === 0;

    return (
        <section className="mb-12 w-full">
            <div className={`bg-card/50 p-4 rounded-lg grid grid-cols-1 lg:grid-cols-2 gap-8 items-center ${isEven ? '' : 'lg:flex-row-reverse'}`}>
                {/* Content Section */}
                <div className={`space-y-4 ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                    {/* <div className="text-primary text-2xl font-bold mb-4 tracking-tight">
                        {title}
                    </div>
                    {description && (
                        <p className="text-foreground text-lg leading-relaxed">
                            {description}
                        </p>
                    )} */}
                    {list && (
                        <ul className="space-y-3 mt-6">
                            {list.map((item, idx) => (
                                <li key={idx} className="flex gap-3 items-start">
                                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                                    <div>
                                        <strong className="text-foreground font-semibold">
                                            {item.title}:
                                        </strong>
                                        <p className="text-muted-foreground mt-1">
                                            {item.content}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    {bottomdesc && (
                        <p className="text-foreground/70 italic mt-4">
                            {bottomdesc}
                        </p>
                    )}
                </div>

                {/* Visual/Mesh Section */}
                <div className={`${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
                    <div
                        className="w-full h-64 lg:h-80 rounded-xl shadow-lg hover:scale-101 transition-all duration-300"
                        // style={meshBackground}
                        style={{
                            background: 'url("/dev-tools/example-bg.png")',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                        }}
                    >
                        <div className="w-full h-full flex items-center justify-center rounded-xl bg-black/10">
                            <div className="text-foreground text-center p-6">
                                <div className="text-2xl md:text-3xl font-semibold mb-2 leading-tight">
                                    {title}
                                </div>
                                <div className="text-lg md:text-xl text-foreground/70 italic mt-2 md:mt-4">
                                    {description}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function Example({ examples }: { examples: ExampleProps[] }) {
    return (
        <div className="space-y-16">
            {examples.map((example, index) => (
                <Item
                    key={example.title}
                    title={example.title}
                    description={example.description}
                    list={example.list}
                    bottomdesc={example.bottomdesc}
                    index={index}
                />
            ))}
        </div>
    )
}

