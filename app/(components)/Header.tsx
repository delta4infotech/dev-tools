import Image from "next/image";
import { CMDK } from "./CMDK";
import { tools } from "../utils/tools";

export default function Header() {
    return (
        <div className="text-center my-20 sm:mb-16 px-4">
            <div className="flex justify-center items-center mb-4 sm:mb-6">
                <div className="p-3 sm:p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Image
                        src="/dev-tools/delta4-icon-footer.svg"
                        width={32}
                        height={32}
                        alt="Delta4 Logo"
                        className="text-primary sm:w-10 sm:h-10"
                    />
                </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-5 text-foreground">Dev Tools</h1>

            <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 leading-6 font-light max-w-2xl mx-auto px-4">
                Delta4 exists to make developers lives easier.
                <br />
                Here are fast, free, open source, ad-free tools.
            </p>
            <div className="px-4 mt-10">
                <CMDK showSearch tools={tools} />
            </div>
        </div>
    );
}