"use client";
import { useState, type FormEvent } from "react";
import {
    ShieldAlert, ShieldCheck, ShieldQuestion, Shield, WifiOff, Loader2, Store, CircleAlert, ExternalLink,
    type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PHP2SHELL_RULES } from "@/lib/php2shell/config";
import { InvalidUrlError, normalizeSiteUrl } from "@/lib/php2shell/url";
import { assessPhpVersion, upgradeTargets } from "@/lib/php2shell/version";
import type { CheckResult, ManualCheck, Verdict } from "@/lib/php2shell/verdict";
import FAQ from "../../(components)/FAQ";
import RelatedTools from "../../(components)/RelatedTools";
import ToolHeader from "../../(components)/ToolHeader";
import { faqs } from "./faqs";

const API_PATH = `${process.env.NODE_ENV === "production" ? "/tools" : ""}/api/php2shell-check`;

const CVES = PHP2SHELL_RULES.cves.join(" / ");

const VERDICT_STYLE: Record<Verdict, { Icon: LucideIcon; box: string; accent: string }> = {
    "at-risk": { Icon: ShieldAlert, box: "border-red-500/40 bg-red-500/10", accent: "text-red-400" },
    safe: { Icon: ShieldCheck, box: "border-emerald-500/40 bg-emerald-500/10", accent: "text-emerald-400" },
    unknown: { Icon: ShieldQuestion, box: "border-amber-500/40 bg-amber-500/10", accent: "text-amber-400" },
    "not-affected": { Icon: Shield, box: "border-sky-500/30 bg-sky-500/5", accent: "text-sky-300" },
    unreachable: { Icon: WifiOff, box: "border-zinc-500/40 bg-zinc-500/10", accent: "text-zinc-300" },
};

const relatedTools = [
    {
        title: "JWT Token Encoder & Decoder",
        description: "Decode and inspect JWT tokens in your browser.",
        link: "/jwt-token-encoder-and-decoder",
    },
    {
        title: "Base64 Encoder & Decoder",
        description: "Encode and decode Base64 strings privately.",
        link: "/base64-encoder-and-decoder",
    },
    {
        title: "PHP Array to JSON",
        description: "Convert PHP arrays to JSON and back.",
        link: "/php-array-to-json",
    },
];

/** Pulls "8.3.14" out of whatever someone pastes, e.g. "8.3.14 (Supports 64bit values)". */
function versionFrom(text: string): string {
    return /\d+\.\d+(?:\.\d+)?[^\s,;()]*/.exec(text)?.[0] ?? text.trim();
}

/** Lets someone who found their version by hand see what it means. */
function VersionLookup() {
    const [value, setValue] = useState("");
    const assessment = value.trim() ? assessPhpVersion(versionFrom(value)) : null;

    let message: { tone: string; text: string } | null = null;
    if (assessment?.status === "fixed") {
        message = { tone: "text-emerald-400", text: `PHP ${assessment.version} includes the fix.` };
    } else if (assessment?.status === "vulnerable") {
        message = { tone: "text-red-400", text: `PHP ${assessment.version} is affected. Update to ${assessment.fixedIn} or newer.` };
    } else if (assessment?.status === "eol") {
        message = {
            tone: "text-red-400",
            text: `PHP ${assessment.branch} is end-of-life and won't be fixed. Move to PHP ${upgradeTargets().join(" or ")}.`,
        };
    } else if (assessment) {
        message = { tone: "text-amber-400", text: `We can't tell: ${assessment.note}. Ask your host.` };
    }

    return (
        <div className="mt-4">
            <label htmlFor="found-version" className="text-sm font-medium text-foreground">
                Found your version? Enter it here
            </label>
            <Input
                id="found-version"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="e.g. 8.3.14"
                inputMode="decimal"
                autoComplete="off"
                className="mt-1.5 h-10 max-w-xs border-foreground/20"
            />
            {message && (
                <p className={`text-sm mt-2 ${message.tone}`} aria-live="polite">
                    {message.text}
                </p>
            )}
        </div>
    );
}

function ManualSteps({ check }: { check: ManualCheck }) {
    return (
        <div className="rounded-lg border border-foreground/10 bg-card/50 p-4 sm:p-5">
            <h3 className="font-semibold text-foreground">{check.title}</h3>
            <ol className="mt-2 space-y-1.5 text-sm text-foreground/90 list-decimal pl-5">
                {check.steps.map((step) => (
                    <li key={step}>{step}</li>
                ))}
            </ol>
            <VersionLookup />
        </div>
    );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="px-4 py-3 sm:px-5">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-sm font-medium text-foreground break-words">{children}</dd>
        </div>
    );
}

function Result({ result }: { result: CheckResult }) {
    const { Icon, box, accent } = VERDICT_STYLE[result.verdict];
    const { php, platform, cloudflare } = result;
    const signals = [...platform.reasons, ...cloudflare.reasons];

    return (
        <div className="mt-6 space-y-4" aria-live="polite">
            <section className={`rounded-lg border ${box}`}>
                <div className="flex gap-3 p-4 sm:p-5">
                    <Icon className={`size-7 shrink-0 ${accent}`} aria-hidden="true" />
                    <div className="min-w-0">
                        <h2 className={`text-lg sm:text-xl font-semibold ${accent}`}>{result.headline}</h2>
                        <p className="mt-1 text-sm text-foreground/90">{result.summary}</p>
                        <p className="mt-2 text-xs text-muted-foreground break-all">
                            {result.url} · checked {new Date(result.checkedAt).toLocaleTimeString()}
                        </p>
                    </div>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-3 border-t border-foreground/10 divide-y sm:divide-y-0 sm:divide-x divide-foreground/10">
                    <Fact label="PHP version">{php.version ?? (php.detected ? "Hidden" : "Not seen")}</Fact>
                    <Fact label="Platform">
                        {platform.name}
                        {result.store && (
                            <span className="mt-1.5 flex w-fit items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-300">
                                <Store className="size-3.5" aria-hidden="true" /> Online store: higher risk
                            </span>
                        )}
                    </Fact>
                    <Fact label="Behind Cloudflare">{cloudflare.detected ? "Yes" : "No"}</Fact>
                </dl>
            </section>

            <section className="rounded-lg border border-foreground/10 bg-card/50 p-4 sm:p-5">
                <h3 className="font-semibold text-foreground">What to do next</h3>
                <ol className="mt-2 space-y-1.5 text-sm text-foreground/90 list-decimal pl-5">
                    {result.nextSteps.map((step) => (
                        <li key={step}>{step}</li>
                    ))}
                </ol>
            </section>

            {result.manualCheck && <ManualSteps check={result.manualCheck} />}

            {result.verdict !== "not-affected" && (
                <section className="rounded-lg border border-foreground/10 bg-card/50 p-4 sm:p-5 text-sm text-foreground/90">
                    <h3 className="font-semibold text-foreground">About Cloudflare</h3>
                    <p className="mt-1.5">
                        {cloudflare.detected
                            ? "This site is behind Cloudflare. That can block some attacks, but only if your server's real IP address can't be reached directly. Ask your host to accept web traffic only from Cloudflare. It doesn't replace updating PHP."
                            : "This site isn't behind Cloudflare, so visitors reach your server directly. Keeping PHP updated is your main protection."}
                    </p>
                </section>
            )}

            <details className="rounded-lg border border-foreground/10 bg-card/50 p-4 sm:p-5 text-sm">
                <summary className="cursor-pointer font-semibold text-foreground">Technical details</summary>
                <div className="mt-3 space-y-3 text-foreground/80">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Requests made</p>
                        <ul className="mt-1 space-y-1 font-mono text-xs break-all">
                            {result.requests.map((request, index) => (
                                <li key={`${request.url}-${index}`}>
                                    GET {request.url} → {request.status ?? request.error}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="font-mono text-xs break-all space-y-1">
                        <p>Server: {result.headers.server ?? "(not sent)"}</p>
                        <p>X-Powered-By: {result.headers.poweredBy ?? "(not sent)"}</p>
                        {php.source && <p>PHP version from: {php.source}</p>}
                    </div>
                    {signals.length > 0 && (
                        <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Signals found</p>
                            <ul className="mt-1 list-disc pl-5 space-y-0.5">
                                {signals.map((signal) => (
                                    <li key={signal}>{signal}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </details>
        </div>
    );
}

function FixedVersions() {
    return (
        <section className="mt-10 rounded-lg border border-foreground/10 bg-card/50 p-4 sm:p-5 text-sm">
            <h2 className="font-semibold text-foreground">Which PHP versions are fixed?</h2>
            <table className="mt-3 w-full text-left">
                <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                        <th className="py-1.5 pr-4 font-medium">PHP</th>
                        <th className="py-1.5 font-medium">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-foreground/10 text-foreground/90">
                    {PHP2SHELL_RULES.fixedIn.map((release) => (
                        <tr key={release}>
                            <td className="py-1.5 pr-4">{release.split(".").slice(0, 2).join(".")}</td>
                            <td className="py-1.5">Fixed in {release} and newer</td>
                        </tr>
                    ))}
                    <tr>
                        <td className="py-1.5 pr-4 whitespace-nowrap">Older than {PHP2SHELL_RULES.oldestSupportedBranch}</td>
                        <td className="py-1.5 text-red-300">End-of-life: no fix, upgrade PHP</td>
                    </tr>
                </tbody>
            </table>
            <p className="mt-3 text-muted-foreground">
                Linux distributions (Ubuntu, Debian, Red Hat and others) sometimes backport the fix without changing the
                version number, so an older-looking version may still be patched. Ask your host if unsure.
            </p>
        </section>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="mt-12">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">{title}</h2>
            <div className="mt-3 space-y-3 text-[15px] leading-7 text-foreground/80">{children}</div>
        </section>
    );
}

const fixedVersions = PHP2SHELL_RULES.fixedIn.join(", ").replace(/, ([^,]+)$/, " and $1");

const RESULT_MEANINGS: { verdict: Verdict; title: string; text: string }[] = [
    {
        verdict: "at-risk",
        title: "At risk: update PHP now",
        text: "Your site shows a PHP version that is affected or end-of-life. Update PHP as soon as you can.",
    },
    {
        verdict: "safe",
        title: "Likely safe: confirm with your host",
        text: "Your site shows a fixed PHP version. Double-check with your host, because headers can be out of date.",
    },
    {
        verdict: "unknown",
        title: "Can't confirm",
        text: "Your site runs PHP but hides the version, or we couldn't read the page. Follow the steps shown to find the version yourself.",
    },
    {
        verdict: "not-affected",
        title: "Likely not affected",
        text: "We found no sign of PHP. If you know your site uses PHP somewhere, check the version on the server.",
    },
    {
        verdict: "unreachable",
        title: "Couldn't check this site",
        text: "The site didn't load for us. Check the address, or find your PHP version manually.",
    },
];

function Explainer() {
    return (
        <>
            <Section title="What is PHP2Shell?">
                <p>
                    PHP2Shell is the name for two security flaws in PHP, tracked as {PHP2SHELL_RULES.cves.join(" and ")}. PHP is
                    the programming language behind WordPress, WooCommerce, Drupal, Joomla, Magento, Laravel and millions of
                    custom websites.
                </p>
                <p>
                    The flaws are in PHP itself, not in a plugin, theme or app. That means updating WordPress or your plugins
                    won&apos;t fix them: the PHP version on your server has to be updated. The fix is in PHP {fixedVersions}. PHP
                    older than {PHP2SHELL_RULES.oldestSupportedBranch} is end-of-life and won&apos;t get a fix.
                </p>
                {PHP2SHELL_RULES.advisoryUrl && (
                    <p>
                        <a
                            href={PHP2SHELL_RULES.advisoryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 underline text-foreground"
                        >
                            Read PHP&apos;s official advisory <ExternalLink className="size-3.5" aria-hidden="true" />
                        </a>
                    </p>
                )}
            </Section>

            <Section title="Who is affected?">
                <ul className="list-disc pl-5 space-y-1.5">
                    <li>Any website running PHP older than the fixed versions above, whatever it&apos;s built with.</li>
                    <li>
                        Sites on PHP 8.1, 8.0, 7.x or older. These versions no longer get security fixes at all, so they stay
                        exposed until you upgrade.
                    </li>
                    <li>
                        Online stores on WooCommerce, Magento, PrestaShop or OpenCart need extra attention, because they
                        handle customer accounts and payments.
                    </li>
                </ul>
                <p>
                    Sites that don&apos;t run PHP, such as static sites or apps built with Node.js, Python or Ruby, aren&apos;t
                    affected. Hosted builders like Shopify, Wix and Squarespace manage their own servers, so there&apos;s nothing
                    for you to update there.
                </p>
            </Section>

            <Section title="How this checker works">
                <ol className="list-decimal pl-5 space-y-1.5">
                    <li>
                        <strong className="text-foreground">Loads your page like a visitor would.</strong> One normal request for
                        the page you enter, plus WordPress&apos;s public /wp-json/ page when the site runs WordPress.
                    </li>
                    <li>
                        <strong className="text-foreground">Reads the PHP version, if the server shows it.</strong> Many servers
                        announce it in the X-Powered-By or Server response headers.
                    </li>
                    <li>
                        <strong className="text-foreground">Looks for signs of the platform:</strong> WordPress, WooCommerce,
                        Drupal, Joomla, Magento, Laravel, PrestaShop, OpenCart, TYPO3, Craft CMS, MediaWiki, Moodle and other
                        PHP software, or PHP in general.
                    </li>
                    <li>
                        <strong className="text-foreground">Checks for Cloudflare,</strong> which changes what the result means
                        for you.
                    </li>
                    <li>
                        <strong className="text-foreground">Compares what it found with the fixed versions</strong> and gives you
                        a plain-language result with next steps.
                    </li>
                </ol>
                <p>
                    It never sends attack code or tries the vulnerability. A check is the same as someone opening your
                    homepage in a browser.
                </p>
            </Section>

            <Section title="What your result means">
                <div className="grid gap-3 sm:grid-cols-2">
                    {RESULT_MEANINGS.map(({ verdict, title, text }) => {
                        const { Icon, box, accent } = VERDICT_STYLE[verdict];
                        return (
                            <div key={verdict} className={`flex gap-3 rounded-lg border p-4 ${box}`}>
                                <Icon className={`size-5 shrink-0 mt-1 ${accent}`} aria-hidden="true" />
                                <div>
                                    <h3 className={`font-semibold ${accent}`}>{title}</h3>
                                    <p className="mt-1 text-sm leading-6 text-foreground/80">{text}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Section>

            <Section title="How to update PHP">
                <p>Updating PHP is usually a setting, not a code change. Where to find it depends on your hosting:</p>
                <ul className="list-disc pl-5 space-y-1.5">
                    <li>
                        <strong className="text-foreground">cPanel:</strong> open MultiPHP Manager (or Select PHP Version),
                        choose your site and pick a newer version.
                    </li>
                    <li>
                        <strong className="text-foreground">Plesk:</strong> go to Websites &amp; Domains, open PHP Settings for
                        your domain and change the PHP version.
                    </li>
                    <li>
                        <strong className="text-foreground">Managed WordPress hosting:</strong> look for &quot;PHP version&quot;
                        or &quot;PHP engine&quot; in your site&apos;s dashboard, or ask support.
                    </li>
                    <li>
                        <strong className="text-foreground">Your own server (VPS):</strong> install the updated PHP packages
                        with your package manager, then restart PHP-FPM or your web server.
                    </li>
                </ul>
                <p className="font-medium text-foreground">Before and after you switch:</p>
                <ul className="list-disc pl-5 space-y-1.5">
                    <li>Back up your site and database.</li>
                    <li>
                        Moving up a whole version (say 7.4 to {upgradeTargets(1)[0]})? Try it on a staging copy first and
                        update your plugins and themes.
                    </li>
                    <li>
                        Afterwards, open a few key pages (and the checkout, for stores) to make sure everything works, then
                        run this check again.
                    </li>
                </ul>
            </Section>
        </>
    );
}

export default function Content() {
    const [address, setAddress] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<CheckResult | null>(null);

    const check = async (event: FormEvent) => {
        event.preventDefault();
        setError(null);
        try {
            normalizeSiteUrl(address);
        } catch (invalid) {
            if (invalid instanceof InvalidUrlError) return setError(invalid.message);
            throw invalid;
        }

        setLoading(true);
        setResult(null);
        try {
            const response = await fetch(API_PATH, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: address }),
            });
            const data = await response.json().catch(() => null);
            if (!response.ok || !data || data.error) {
                setError(data?.error ?? "Something went wrong while checking this site. Please try again.");
            } else {
                setResult(data as CheckResult);
            }
        } catch {
            setError("Couldn't reach the checker. Check your internet connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <ToolHeader
                title="PHP2Shell Exposure Checker"
                description={`Find out whether a website may be exposed to PHP2Shell (${CVES}), and what to do about it.`}
            />

            <div className="flex-1 bg-background w-full">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-8">
                    <form onSubmit={check} className="flex flex-col sm:flex-row gap-2">
                        <label htmlFor="site-address" className="sr-only">
                            Website address
                        </label>
                        <Input
                            id="site-address"
                            value={address}
                            onChange={(event) => setAddress(event.target.value)}
                            placeholder="example.com"
                            inputMode="url"
                            autoComplete="url"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            className="h-11 text-base sm:text-base border-foreground/20 bg-card/50"
                        />
                        <Button type="submit" disabled={loading} className="h-11 px-6 w-full sm:w-auto">
                            {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
                            {loading ? "Checking…" : "Check site"}
                        </Button>
                    </form>
                    <p className="mt-2 text-xs text-muted-foreground">
                        Safe to use on any site: we load the page once, like a normal visitor, and read what it shows.
                        No attack traffic is sent.
                    </p>

                    {error && (
                        <div
                            role="alert"
                            className="mt-6 flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300"
                        >
                            <CircleAlert className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
                            {error}
                        </div>
                    )}

                    {result && <Result result={result} />}

                    <FixedVersions />
                    <Explainer />
                </div>
            </div>

            <div className="w-full bg-background py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-foreground">
                        Frequently Asked Questions
                    </h2>
                    <FAQ faqs={faqs} />
                </div>
            </div>

            <RelatedTools tools={relatedTools} />
        </>
    );
}
