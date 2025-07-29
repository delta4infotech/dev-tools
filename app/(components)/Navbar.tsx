"use client"
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { InteractiveHoverButton } from '../../components/magicui/interactive-hover-button';

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
                    {/* Logo and Back Button */}
                    <div className="flex items-center gap-4 justify-between w-full">
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
                        <InteractiveHoverButton className=" border border-foreground/20 rounded-md shadow-lg">
                            <Link href="https://github.com/delta4infotech/dev-tools" target="_blank">
                                Contribute
                            </Link>
                        </InteractiveHoverButton>
                    </div>

                    {/* Delta4 Logo */}

                </div>
            </div>
        </div>
    )
}