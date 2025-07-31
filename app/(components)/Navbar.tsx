"use client"
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { InteractiveHoverButton } from '../../components/magicui/interactive-hover-button';
import { Command } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Navbar() {
    const [prevScrollPos, setPrevScrollPos] = useState(0);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollPos = window.scrollY;
            const isScrollingDown = currentScrollPos > prevScrollPos;

            setVisible(!isScrollingDown || currentScrollPos < 10);
            setPrevScrollPos(currentScrollPos);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [prevScrollPos]);

    return (
        <div className={`w-full sticky top-2 z-50 px-4 md:px-0 transition-transform duration-300 ${visible ? 'translate-y-0' : '-translate-y-full'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-primary/10 backdrop-blur-md  border border-foreground/20 rounded-xl shadow-lg">
                <div className="flex items-center justify-between py-4">
                    {/* Logo */}
                    <Link href="/">
                        <div className="flex items-center justify-center gap-2">
                            <Image
                                src="/dev-tools/delta4-icon-footer.svg"
                                width={30}
                                height={30}
                                alt="Delta4 Logo"
                                className="drop-shadow-md"
                            />
                            <span className="text-lg font-semibold text-foreground drop-shadow-sm">Delta4</span>
                        </div>
                    </Link>

                    {/* Right side actions */}
                    <div className="flex items-center gap-3">
                        <InteractiveHoverButton className=" border border-foreground/20 rounded-md shadow-lg">
                            <Link href="https://github.com/delta4infotech/dev-tools" target="_blank">
                                Contribute
                            </Link>
                        </InteractiveHoverButton>

                        {/* CMDK Visual Cue */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <kbd
                                        className="inline-flex h-8 select-none items-center gap-1 rounded border bg-primary/10 px-2 font-mono text-sm font-medium text-primary"
                                    >
                                        <Command className="w-3 h-3" />
                                        <span>K</span>
                                    </kbd>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Press cmd/ctrl+k on keyboard to search tools</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                </div>
            </div>
        </div>
    )
}