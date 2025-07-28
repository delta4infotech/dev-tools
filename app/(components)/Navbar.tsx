import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
    return (
        <div className="w-full sticky top-2 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8  bg-primary/40 border-b border-border/50 rounded-xl shadow-md backdrop-blur-xl blur-3xl ">
                <div className="flex items-center justify-between py-4">
                    {/* Logo and Back Button */}
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <div className="flex items-center justify-center gap-2">
                                <Image
                                    src="/delta4-icon-footer.svg"
                                    width={30}
                                    height={30}
                                    alt="Delta4 Logo"
                                />
                                <span className="text-lg font-semibold text-foreground">Delta4</span>
                            </div>
                        </Link>

                    </div>

                    {/* Delta4 Logo */}

                </div>
            </div>
        </div>
    )
}