/**
 * The passive check: load the page the way a browser would, and for WordPress
 * also its public REST index, then read headers and HTML. It never sends
 * request bodies, crafted multipart or session requests, or anything else that
 * exercises the vulnerability itself. Server-side only.
 */
import { detect, type PageEvidence } from "./detect";
import { describeNetworkError, getPage, BlockedTargetError, type FetchOptions } from "./fetch";
import { bareHost, normalizeSiteUrl } from "./url";
import { buildResult, type CheckResult, type ScanEvidence } from "./verdict";
import { findPhpVersions } from "./version";

export const USER_AGENT =
    "Mozilla/5.0 (compatible; Delta4-PHP2Shell-Checker/1.0; +https://delta4.io/tools/php2shell-exposure-checker)";

export interface CheckOptions {
    /** Per request. */
    timeoutMs?: number;
    /** For the whole check, redirects included. */
    budgetMs?: number;
    maxBodyBytes?: number;
    maxRedirects?: number;
    /** Gap between requests to the same site. */
    pauseMs?: number;
    /** Tests only: allow loopback and private addresses on any port. */
    allowUnsafeTargets?: boolean;
}

const DEFAULTS: Required<CheckOptions> = {
    timeoutMs: 8_000,
    budgetMs: 20_000,
    maxBodyBytes: 1_000_000,
    maxRedirects: 5,
    pauseMs: 300,
    allowUnsafeTargets: false,
};

const HTML_ACCEPT = "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8";
const REDIRECTS = new Set([301, 302, 303, 307, 308]);

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class Scan {
    readonly evidence: ScanEvidence;
    private readonly deadline: number;

    constructor(url: URL, private readonly settings: Required<CheckOptions>) {
        this.evidence = { url: url.href, pages: [], requests: [], error: null };
        this.deadline = Date.now() + settings.budgetMs;
    }

    /** One GET, logged; records a plain-language error and returns null on failure. */
    async get(url: URL, kind: PageEvidence["kind"], fetch: Partial<FetchOptions> = {}): Promise<PageEvidence | null> {
        const remaining = this.deadline - Date.now();
        if (remaining <= 0) {
            this.evidence.error = "the check took too long";
            return null;
        }
        try {
            const response = await getPage(url, {
                timeoutMs: Math.min(this.settings.timeoutMs, remaining),
                maxBodyBytes: this.settings.maxBodyBytes,
                userAgent: USER_AGENT,
                accept: HTML_ACCEPT,
                allowUnsafeTargets: this.settings.allowUnsafeTargets,
                ...fetch,
            });
            const page: PageEvidence = { url: url.href, kind, ...response };
            this.evidence.pages.push(page);
            this.evidence.requests.push({ url: url.href, status: response.status });
            return page;
        } catch (error) {
            const reason = describeNetworkError(error);
            this.evidence.requests.push({ url: url.href, status: null, error: reason });
            if (kind !== "wp-json") this.evidence.error = reason;
            if (error instanceof BlockedTargetError) throw error;
            return null;
        }
    }

    /** The page at `start`, following redirects one checked hop at a time. */
    async loadPage(start: URL): Promise<PageEvidence | null> {
        let current = start;
        for (let hop = 0; hop <= this.settings.maxRedirects; hop++) {
            if (hop > 0) await pause(this.settings.pauseMs);
            const page = await this.get(current, "page");
            const location = page?.headers["location"];
            if (!page || !REDIRECTS.has(page.status) || !location) return page;

            page.kind = "redirect";
            try {
                current = new URL(location, current);
                current.hash = "";
            } catch {
                this.evidence.error = "it redirected to an address that isn't valid";
                return null;
            }
        }
        this.evidence.error = "it redirected too many times";
        return null;
    }
}

/**
 * Where WordPress says its REST index lives (it can sit under a subfolder),
 * falling back to /wp-json/ on the same site.
 */
function restIndexUrl(page: PageEvidence): URL {
    const fromHeader = /<([^>]+)>\s*;\s*rel="https:\/\/api\.w\.org\/"/.exec(page.headers["link"] ?? "")?.[1];
    const tag = /<link\b[^>]*rel=["']https:\/\/api\.w\.org\/["'][^>]*>/i.exec(page.body)?.[0];
    const fromHtml = tag ? /\bhref=["']([^"']+)["']/i.exec(tag)?.[1] : undefined;
    for (const candidate of [fromHeader, fromHtml]) {
        if (!candidate) continue;
        try {
            const url = new URL(candidate.replace(/&amp;/g, "&"), page.url);
            if (bareHost(url.hostname) === bareHost(new URL(page.url).hostname)) return url;
        } catch {
            // Fall through to the default location.
        }
    }
    return new URL("/wp-json/", page.url);
}

/**
 * The REST index is a public, read-only listing WordPress serves to anyone. It
 * answers from PHP even when the homepage comes from a cache, so it often shows
 * a PHP version the homepage hides, and it lists WooCommerce when present.
 */
function wantsRestIndex(evidence: ScanEvidence): boolean {
    const platforms = detect(evidence.pages).platforms.map(({ id }) => id);
    if (!platforms.includes("wordpress")) return false;
    const versionSeen = evidence.pages.some(
        (page) => findPhpVersions(`${page.headers["server"] ?? ""}\n${page.headers["x-powered-by"] ?? ""}`).length > 0
    );
    return !versionSeen || !platforms.includes("woocommerce");
}

export async function checkSite(input: string, options: CheckOptions = {}): Promise<CheckResult> {
    const { url, schemeGiven } = normalizeSiteUrl(input);
    const settings = { ...DEFAULTS, ...options };
    const scan = new Scan(url, settings);

    try {
        let page = await scan.loadPage(url);
        // "example.com" was tried over HTTPS; if nothing answered there, try plain HTTP once.
        if (!page && !schemeGiven && scan.evidence.pages.length === 0) {
            const plain = new URL(url.href);
            plain.protocol = "http:";
            page = await scan.loadPage(plain);
            if (page) scan.evidence.error = null;
        }
        if (page && wantsRestIndex(scan.evidence)) {
            await pause(settings.pauseMs);
            await scan.get(restIndexUrl(page), "wp-json", { accept: "application/json", maxBodyBytes: 256_000 });
        }
    } catch (error) {
        // A private address (directly or via DNS or a redirect): stop right there.
        if (!(error instanceof BlockedTargetError)) throw error;
    }

    return buildResult(scan.evidence);
}
