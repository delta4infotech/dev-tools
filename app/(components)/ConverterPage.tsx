import ObjectConverter from "./ObjectConverter";
import ToolHeader from "./ToolHeader";
import FAQ from "./FAQ";
import Example from "./Example";
import RelatedTools from "./RelatedTools";
import KeyboardShortcutHint from "./KeyboardShortcutHint";
import { ConverterPageConfig } from "@/lib/converter/pages";

/**
 * Shared shell for every converter landing page. Each route supplies its own
 * copy and its own default source/target dialect; the tool underneath is the
 * same one, so a visitor who lands on the PHP page can still convert to Python.
 */
export default function ConverterPage({ config }: { config: ConverterPageConfig }) {
    return (
        <>
            <ToolHeader title={config.heading} description={config.subheading} />

            <ObjectConverter initialInput={config.sample} initialTarget={config.target} />

            <KeyboardShortcutHint />

            {config.examples.length > 0 && (
                <div className="w-full py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6">
                        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-foreground">
                            Examples &amp; Use Cases
                        </h2>
                        <Example examples={config.examples} />
                    </div>
                </div>
            )}

            <div className="w-full bg-background py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-foreground">
                        Frequently Asked Questions
                    </h2>
                    <FAQ faqs={config.faqs} />
                </div>
            </div>

            <RelatedTools tools={config.relatedTools} />
        </>
    );
}
