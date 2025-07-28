import { PlusIcon } from "lucide-react"
import { Accordion as AccordionPrimitive } from "radix-ui"

import {
    Accordion,
    AccordionContent,
    AccordionItem,
} from "@/components/ui/accordion"

export interface FAQProps {
    id: string;
    title: string;
    content: string;
}

export default function FAQ({ faqs }: { faqs: FAQProps[] }) {
    return (
        <div className="space-y-4">
            <Accordion
                type="single"
                collapsible
                className="w-full space-y-4 border-foreground/10 rounded-md"
                defaultValue="3"
            >
                {faqs.map((item) => (
                    <AccordionItem
                        value={item.id}
                        key={item.id}
                        className="bg-background has-focus-visible:border-ring has-focus-visible:ring-ring/50 rounded-md border px-4 py-1 outline-none last:border-b has-focus-visible:ring-[3px] text-foreground border-foreground/10"
                    >
                        <AccordionPrimitive.Header className="flex text-foreground">
                            <AccordionPrimitive.Trigger className="flex flex-1 items-center justify-between rounded-md py-2 text-left text-sm text-[15px] leading-6 font-semibold transition-all outline-none focus-visible:ring-0 [&>svg>path:last-child]:origin-center [&>svg>path:last-child]:transition-all [&>svg>path:last-child]:duration-200 [&[data-state=open]>svg]:rotate-180 [&[data-state=open]>svg>path:last-child]:rotate-90 [&[data-state=open]>svg>path:last-child]:opacity-0 text-foreground border-foreground/10">
                                {item.title}
                                <PlusIcon
                                    size={16}
                                    className="pointer-events-none shrink-0 opacity-60 transition-transform duration-200 text-foreground"
                                    aria-hidden="true"
                                />
                            </AccordionPrimitive.Trigger>
                        </AccordionPrimitive.Header>
                        <AccordionContent className="text-muted-foreground pb-2">
                            {item.content}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    )
}
