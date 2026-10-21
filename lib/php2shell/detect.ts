/**
 * Platform, PHP and Cloudflare detection from response headers and HTML.
 * Pure functions over responses the scanner already has - nothing here makes a
 * request.
 */
import { bareHost } from "./url";

export interface PageEvidence {
    /** URL that was requested (always with GET). */
    url: string;
    status: number;
    /** Lower-cased header names; repeated headers joined with ", ". */
    headers: Record<string, string>;
    setCookies: string[];
    body: string;
    /** The page itself, a redirect on the way to it, or the WordPress REST index. */
    kind: "page" | "redirect" | "wp-json";
}

export type PlatformId = "woocommerce" | "wordpress" | "magento" | "drupal" | "joomla" | "laravel" | "php";

/** Most specific first: this order decides which platform a site is shown as. */
const PLATFORM_ORDER: PlatformId[] = ["woocommerce", "wordpress", "magento", "drupal", "joomla", "laravel", "php"];

export const PLATFORM_NAMES: Record<PlatformId, string> = {
    woocommerce: "WooCommerce (WordPress)",
    wordpress: "WordPress",
    magento: "Magento",
    drupal: "Drupal",
    joomla: "Joomla",
    laravel: "Laravel",
    php: "PHP (custom or unrecognized app)",
};

/** Online stores: a break-in exposes customer accounts and checkout. */
export const STORE_PLATFORMS: PlatformId[] = ["woocommerce", "magento"];

export interface Detection {
    /** Every platform with at least one signal, most specific first. */
    platforms: { id: PlatformId; reasons: string[] }[];
    phpDetected: boolean;
    cloudflare: { detected: boolean; reasons: string[] };
    /** A bot or firewall challenge was served instead of the site. */
    challenged: boolean;
}

const header = (page: PageEvidence, name: string) => page.headers[name] ?? "";

const cookieNames = (page: PageEvidence) => page.setCookies.map((cookie) => cookie.split("=")[0].trim());

const hasCookie = (page: PageEvidence, pattern: RegExp) => cookieNames(page).some((name) => pattern.test(name));

/** HTML only: the REST index and redirect bodies are not pages. */
const html = (page: PageEvidence) => (page.kind === "page" ? page.body : "");

/** <meta name="generator"> contents plus an X-Generator header. */
function generators(page: PageEvidence): string[] {
    const found = header(page, "x-generator") ? [header(page, "x-generator")] : [];
    for (const [tag] of html(page).matchAll(/<meta\b[^>]*>/gi)) {
        if (!/\bname\s*=\s*["']?generator\b/i.test(tag)) continue;
        const content = /\bcontent\s*=\s*["']([^"']*)["']/i.exec(tag);
        if (content) found.push(content[1].trim());
    }
    return found;
}

const generatedBy = (page: PageEvidence, pattern: RegExp) => generators(page).some((value) => pattern.test(value));

/** Namespaces listed by a WordPress REST index (/wp-json/). */
function restNamespaces(page: PageEvidence): string[] {
    if (page.kind !== "wp-json" || page.status < 200 || page.status >= 300) return [];
    const list = /"namespaces"\s*:\s*\[([^\]]*)\]/.exec(page.body);
    if (!list) return [];
    return Array.from(list[1].matchAll(/"([^"]*)"/g), (match) => match[1].replace(/\\\//g, "/"));
}

/** Links, scripts or forms pointing at .php files on the same site. */
function linksToPhpPages(page: PageEvidence): boolean {
    const body = html(page);
    if (!body) return false;
    const host = bareHost(new URL(page.url).hostname);
    for (const match of body.matchAll(/\b(?:href|src|action)\s*=\s*["']([^"'#]+)["']/gi)) {
        try {
            const target = new URL(match[1], page.url);
            if (bareHost(target.hostname) === host && /\.php$/i.test(target.pathname)) return true;
        } catch {
            // Not a URL; ignore it.
        }
    }
    return false;
}

interface Signal {
    platform: PlatformId;
    reason: string;
    test: (page: PageEvidence) => boolean;
}

const SIGNALS: Signal[] = [
    // WooCommerce
    { platform: "woocommerce", reason: "Generator tag says WooCommerce", test: (p) => generatedBy(p, /^WooCommerce\b/i) },
    { platform: "woocommerce", reason: "Loads WooCommerce plugin files", test: (p) => html(p).includes("/wp-content/plugins/woocommerce/") },
    { platform: "woocommerce", reason: "Links to the WooCommerce REST API (/wp-json/wc/)", test: (p) => /\/wp-json\/wc\/|wc\\?\/store\\?\/v\d/.test(html(p)) },
    { platform: "woocommerce", reason: "Page uses WooCommerce layout classes", test: (p) => /\bwoocommerce-(?:no-js|js|page|active)\b/.test(html(p)) },
    { platform: "woocommerce", reason: "Sets WooCommerce cookies", test: (p) => hasCookie(p, /^(?:woocommerce_|wp_woocommerce_session_)/) },
    { platform: "woocommerce", reason: "REST API lists WooCommerce endpoints (/wp-json/wc/)", test: (p) => restNamespaces(p).some((ns) => ns.startsWith("wc/")) },

    // WordPress
    { platform: "wordpress", reason: "Generator tag says WordPress", test: (p) => generatedBy(p, /^WordPress\b/i) },
    { platform: "wordpress", reason: "Loads files from /wp-content/ or /wp-includes/", test: (p) => /\/wp-(?:content|includes)\//.test(html(p)) },
    { platform: "wordpress", reason: "Advertises the WordPress REST API (/wp-json/)", test: (p) => html(p).includes("/wp-json/") || header(p, "link").includes("api.w.org") },
    { platform: "wordpress", reason: "Redirect was sent by WordPress", test: (p) => /wordpress/i.test(header(p, "x-redirect-by")) },
    { platform: "wordpress", reason: "Advertises WordPress XML-RPC (xmlrpc.php)", test: (p) => header(p, "x-pingback").includes("xmlrpc.php") },
    { platform: "wordpress", reason: "Sets WordPress cookies", test: (p) => hasCookie(p, /^(?:wordpress_|wp-settings-)/) },
    { platform: "wordpress", reason: "REST API at /wp-json/ answers like WordPress", test: (p) => restNamespaces(p).includes("wp/v2") },

    // Magento
    { platform: "magento", reason: "Sends Magento headers", test: (p) => Object.keys(p.headers).some((name) => name.startsWith("x-magento-")) },
    { platform: "magento", reason: "Page includes Magento scripts", test: (p) => /\/static\/version\d+\/frontend\/|text\/x-magento-init|\bMagento_[A-Z]/.test(html(p)) },
    { platform: "magento", reason: "Page includes Magento 1 assets", test: (p) => /\/skin\/frontend\/|\bMage\.Cookies\b/.test(html(p)) },
    { platform: "magento", reason: "Sets Magento cookies", test: (p) => hasCookie(p, /^(?:X-Magento-Vary|mage-cache-sessid|mage-cache-storage|mage-messages)$/i) },

    // Drupal
    { platform: "drupal", reason: "Generator tag says Drupal", test: (p) => generatedBy(p, /^Drupal\b/i) },
    { platform: "drupal", reason: "Sends Drupal cache headers", test: (p) => Boolean(header(p, "x-drupal-cache") || header(p, "x-drupal-dynamic-cache")) },
    { platform: "drupal", reason: "Page includes Drupal scripts", test: (p) => /data-drupal-selector|drupal-settings-json|\/core\/misc\/drupal\.js|\bDrupal\.settings\b/.test(html(p)) },
    { platform: "drupal", reason: "Loads files from /sites/default/files/", test: (p) => html(p).includes("/sites/default/files/") },
    { platform: "drupal", reason: "Sets a Drupal session cookie", test: (p) => hasCookie(p, /^S?SESS[0-9a-f]{32}$/) },

    // Joomla
    { platform: "joomla", reason: "Generator tag says Joomla", test: (p) => generatedBy(p, /^Joomla\b/i) },
    { platform: "joomla", reason: "Loads Joomla media files", test: (p) => /\/media\/(?:jui|system\/js|templates\/site)\//.test(html(p)) },
    { platform: "joomla", reason: "Page includes Joomla script options", test: (p) => html(p).includes("joomla-script-options") },
    { platform: "joomla", reason: "Links to Joomla components (com_...)", test: (p) => /[?&]option=com_|\/components\/com_/.test(html(p)) },

    // Laravel
    { platform: "laravel", reason: "Sets a Laravel session cookie", test: (p) => hasCookie(p, /^laravel_session$/) },
    { platform: "laravel", reason: "Sets Laravel-style XSRF-TOKEN and session cookies", test: (p) => hasCookie(p, /^XSRF-TOKEN$/) && hasCookie(p, /_session$/) },
    { platform: "laravel", reason: "Loads Laravel Livewire", test: (p) => /\/livewire\/livewire(?:\.min)?\.js|\/vendor\/livewire\//.test(html(p)) },

    // PHP without a recognized platform
    { platform: "php", reason: "X-Powered-By header mentions PHP", test: (p) => /\bPHP\b/i.test(header(p, "x-powered-by")) },
    { platform: "php", reason: "Server header mentions PHP", test: (p) => /\bPHP\//i.test(header(p, "server")) },
    { platform: "php", reason: "Sets a PHPSESSID session cookie", test: (p) => hasCookie(p, /^PHPSESSID$/i) },
    { platform: "php", reason: "Links to .php pages on this site", test: linksToPhpPages },
];

function cloudflareReasons(pages: PageEvidence[]): string[] {
    const reasons = new Set<string>();
    for (const page of pages) {
        if (header(page, "cf-ray")) reasons.add("cf-ray header present");
        if (/^cloudflare\b/i.test(header(page, "server"))) reasons.add("Server header is cloudflare");
    }
    return [...reasons];
}

/** Headers bot-protection services (Cloudflare, Vercel, AWS WAF) set on a challenge. */
const CHALLENGE_HEADERS: [string, RegExp][] = [
    ["cf-mitigated", /challenge/i],
    ["x-vercel-mitigated", /challenge/i],
    ["x-amzn-waf-action", /challenge|captcha/i],
];

/**
 * Challenge pages, whatever their status code - some (Fastly, SiteGround)
 * answer 200 or 202, which would otherwise pass for a readable page.
 */
const CHALLENGE_PAGE =
    /<title>\s*(?:Just a moment\.\.\.|Attention Required!|Client Challenge|Request unsuccessful|Access denied)|\/_fs-ch-|\/\.well-known\/sgcaptcha\/|captcha-delivery\.com/i;

/** Challenge scripts Cloudflare and AWS also inject into ordinary pages, so they only count on an error. */
const CHALLENGE_SCRIPT = /challenge-platform|cf-chl-|awswaf/i;

function isChallenge(page: PageEvidence): boolean {
    if (CHALLENGE_HEADERS.some(([name, value]) => value.test(header(page, name)))) return true;
    if (CHALLENGE_PAGE.test(page.body)) return true;
    return page.status >= 400 && CHALLENGE_SCRIPT.test(page.body);
}

export function detect(pages: PageEvidence[]): Detection {
    const reasons = new Map<PlatformId, Set<string>>();
    for (const signal of SIGNALS) {
        if (!pages.some(signal.test)) continue;
        if (!reasons.has(signal.platform)) reasons.set(signal.platform, new Set());
        reasons.get(signal.platform)!.add(signal.reason);
    }
    if (reasons.has("woocommerce") && !reasons.has("wordpress")) {
        reasons.set("wordpress", new Set(["WooCommerce runs on WordPress"]));
    }

    const cloudflare = cloudflareReasons(pages);
    return {
        platforms: PLATFORM_ORDER.filter((id) => reasons.has(id)).map((id) => ({ id, reasons: [...reasons.get(id)!] })),
        phpDetected: reasons.size > 0,
        cloudflare: { detected: cloudflare.length > 0, reasons: cloudflare },
        challenged: pages.some((page) => page.kind !== "wp-json" && isChallenge(page)),
    };
}
