import { describe, expect, it } from "vitest";
import { checkSite, type CheckOptions } from "../scan";
import { html, mockSite, type Reply } from "./mock-server";

// Mock servers live on 127.0.0.1, which the real checker refuses to touch.
const LOCAL: CheckOptions = { allowUnsafeTargets: true, pauseMs: 0, timeoutMs: 2_000 };

const WORDPRESS = html(
    `<meta name="generator" content="WordPress 6.6.2" />
     <link rel="https://api.w.org/" href="/wp-json/" />
     <link rel="stylesheet" href="/wp-content/themes/twentytwentyfour/style.css" />`
);

const WOOCOMMERCE = html(
    `<meta name="generator" content="WordPress 6.6.2" />
     <meta name="generator" content="WooCommerce 9.3.3" />
     <link rel="stylesheet" href="/wp-content/plugins/woocommerce/assets/css/woocommerce.css" />`,
    `<div class="woocommerce-no-js"><a href="/cart/">Cart</a></div>`
);

const REST_INDEX = (namespaces: string[]) => JSON.stringify({ name: "Test", namespaces, routes: {} });

const json = (body: string, headers: Record<string, string> = {}): Reply => ({
    body,
    headers: { "Content-Type": "application/json; charset=UTF-8", ...headers },
});

describe("version visible", () => {
    it("WooCommerce on an old 8.3 patch is at risk, flagged as a store, with the fix version", async () => {
        const site = await mockSite({
            "/": { headers: { "X-Powered-By": "PHP/8.3.35", Server: "Apache" }, body: WOOCOMMERCE },
        });
        const result = await checkSite(site.url, LOCAL);

        expect(result).toMatchObject({
            verdict: "at-risk",
            headline: "At risk: update PHP now",
            php: { detected: true, version: "8.3.35", status: "vulnerable", fixedIn: "8.3.36" },
            platform: { id: "woocommerce", name: "WooCommerce (WordPress)" },
            store: true,
            manualCheck: null,
        });
        expect(result.nextSteps[0]).toMatch(/online store/);
        expect(result.nextSteps.join(" ")).toContain("8.3.36 or newer");
        // The version and WooCommerce were both already known, so no extra request.
        expect(site.received.map(({ path }) => path)).toEqual(["/"]);
    });

    it("Laravel on PHP 7.4 is at risk because 7.4 is end-of-life", async () => {
        const site = await mockSite({
            "/": {
                headers: {
                    "X-Powered-By": "PHP/7.4.33",
                    "Set-Cookie": ["XSRF-TOKEN=abc; path=/", "laravel_session=xyz; path=/; httponly"],
                },
                body: html(""),
            },
        });
        const result = await checkSite(site.url, LOCAL);

        expect(result).toMatchObject({ verdict: "at-risk", php: { status: "eol" }, platform: { id: "laravel" }, store: false });
        expect(result.summary).toContain("end-of-life");
        expect(result.nextSteps.join(" ")).toContain("PHP 8.5 or 8.4");
    });

    it("Drupal on a fixed version is likely safe, with Drupal steps to confirm", async () => {
        const site = await mockSite({
            "/": {
                headers: { "X-Generator": "Drupal 10 (https://www.drupal.org)", "X-Powered-By": "PHP/8.4.27" },
                body: html(`<script type="application/json" data-drupal-selector="drupal-settings-json">{}</script>`),
            },
        });
        const result = await checkSite(site.url, LOCAL);

        expect(result).toMatchObject({
            verdict: "safe",
            headline: "Likely safe: confirm with your host",
            php: { version: "8.4.27", status: "fixed" },
            platform: { id: "drupal" },
        });
        expect(result.manualCheck?.steps.join(" ")).toContain("Reports > Status report");
    });

    it("reads the version from the Server header too", async () => {
        const site = await mockSite({ "/": { headers: { Server: "Apache/2.4.62 (Unix) PHP/8.5.12" }, body: html("") } });
        const result = await checkSite(site.url, LOCAL);

        expect(result).toMatchObject({ verdict: "safe", php: { version: "8.5.12", source: expect.stringContaining("Server header") } });
    });

    it("lets the worse of two conflicting headers decide", async () => {
        const site = await mockSite({
            "/": { headers: { Server: "Apache/2.4.62 PHP/8.4.27", "X-Powered-By": "PHP/8.4.26" }, body: html("") },
        });
        expect(await checkSite(site.url, LOCAL)).toMatchObject({ verdict: "at-risk", php: { version: "8.4.26" } });
    });

    it("adds the backport caveat for a distribution build", async () => {
        const site = await mockSite({ "/": { headers: { "X-Powered-By": "PHP/8.4.26-1ubuntu1" }, body: html("") } });
        const result = await checkSite(site.url, LOCAL);

        expect(result).toMatchObject({ verdict: "at-risk", php: { distroBuild: true } });
        expect(result.nextSteps.join(" ")).toMatch(/backport/);
    });

    it("can't confirm a branch the rules don't cover yet", async () => {
        const site = await mockSite({ "/": { headers: { "X-Powered-By": "PHP/8.6.0" }, body: html("") } });
        const result = await checkSite(site.url, LOCAL);

        expect(result).toMatchObject({ verdict: "unknown", headline: "Can't confirm", php: { version: "8.6.0" } });
        expect(result.manualCheck).not.toBeNull();
    });
});

describe("PHP site with the version hidden", () => {
    it("WordPress: can't confirm, with the Site Health steps", async () => {
        const site = await mockSite({
            "/": { headers: { Server: "nginx" }, body: WORDPRESS },
            "/wp-json/": json(REST_INDEX(["oembed/1.0", "wp/v2"])),
        });
        const result = await checkSite(site.url, LOCAL);

        expect(result).toMatchObject({
            verdict: "unknown",
            headline: "Can't confirm",
            php: { detected: true, version: null },
            platform: { id: "wordpress", name: "WordPress" },
            store: false,
        });
        expect(result.manualCheck?.steps.join(" ")).toContain("Tools > Site Health");
        expect(result.manualCheck?.steps.join(" ")).toContain("Server");
        expect(result.summary).toContain("hides its PHP version");
    });

    it("WordPress: picks up a version the REST index reveals when the homepage is cached", async () => {
        const site = await mockSite({
            "/": { headers: { Server: "nginx", "X-Cache": "HIT" }, body: WORDPRESS },
            "/wp-json/": json(REST_INDEX(["wp/v2"]), { "X-Powered-By": "PHP/8.2.30" }),
        });
        const result = await checkSite(site.url, LOCAL);

        expect(result).toMatchObject({ verdict: "at-risk", php: { version: "8.2.30", fixedIn: "8.2.35" } });
        expect(result.php.source).toContain("/wp-json/");
    });

    it("WooCommerce found only through the REST index is still flagged as a store", async () => {
        const site = await mockSite({
            "/": { body: WORDPRESS },
            "/wp-json/": json(REST_INDEX(["wp/v2", "wc/v3", "wc/store/v1"]).replace(/\//g, "\\/")),
        });
        const result = await checkSite(site.url, LOCAL);

        expect(result).toMatchObject({ verdict: "unknown", platform: { id: "woocommerce" }, store: true });
        expect(result.manualCheck?.steps.join(" ")).toContain("Tools > Site Health");
        expect(result.nextSteps[0]).toMatch(/online store/);
    });

    it("follows the REST link WordPress advertises when it lives in a subfolder", async () => {
        const site = await mockSite({
            "/": {
                headers: { Link: '</blog/wp-json/>; rel="https://api.w.org/"' },
                body: html(`<link rel="stylesheet" href="/blog/wp-content/themes/x/style.css" />`),
            },
            "/blog/wp-json/": json(REST_INDEX(["wp/v2", "wc/v3"])),
        });
        const result = await checkSite(site.url, LOCAL);

        expect(site.received.map(({ path }) => path)).toEqual(["/", "/blog/wp-json/"]);
        expect(result.platform.id).toBe("woocommerce");
    });

    it("Joomla: can't confirm, with the System Information steps", async () => {
        const site = await mockSite({
            "/": {
                body: html(
                    `<meta name="generator" content="Joomla! - Open Source Content Management" />
                     <script src="/media/system/js/core.min.js"></script>`
                ),
            },
        });
        const result = await checkSite(site.url, LOCAL);

        expect(result).toMatchObject({ verdict: "unknown", platform: { id: "joomla" } });
        expect(result.manualCheck?.steps.join(" ")).toContain("System > System Information");
    });

    it("Magento: can't confirm, flagged as a store, told to run php -v or ask the host", async () => {
        const site = await mockSite({
            "/": {
                headers: { "Set-Cookie": "mage-cache-sessid=true; path=/" },
                body: html(
                    `<script src="/static/version1712345678/frontend/Magento/luma/en_US/requirejs/require.js"></script>`,
                    `<script type="text/x-magento-init">{}</script>`
                ),
            },
        });
        const result = await checkSite(site.url, LOCAL);

        expect(result).toMatchObject({ verdict: "unknown", platform: { id: "magento", name: "Magento" }, store: true });
        expect(result.manualCheck?.steps.join(" ")).toContain("php -v");
        expect(result.manualCheck?.steps.join(" ")).toMatch(/ask your hosting provider/);
    });

    it("a custom PHP app (session cookie, .php links): can't confirm", async () => {
        const site = await mockSite({
            "/": {
                headers: { "Set-Cookie": "PHPSESSID=abc123; path=/" },
                body: html("", `<a href="/contact.php">Contact</a>`),
            },
        });
        const result = await checkSite(site.url, LOCAL);

        expect(result).toMatchObject({ verdict: "unknown", platform: { id: "php" } });
        expect(result.platform.reasons).toEqual(expect.arrayContaining(["Sets a PHPSESSID session cookie", "Links to .php pages on this site"]));
        expect(result.manualCheck?.steps.join(" ")).toContain("php -v");
    });

    it("X-Powered-By: PHP without a number is PHP with a hidden version", async () => {
        const site = await mockSite({ "/": { headers: { "X-Powered-By": "PHP" }, body: html("") } });
        expect(await checkSite(site.url, LOCAL)).toMatchObject({ verdict: "unknown", php: { detected: true, version: null } });
    });
});

describe("other PHP platforms with the version hidden", () => {
    // [platform, what the site serves, expected id, store?, a phrase from the manual steps]
    const platforms: [string, Reply, string, boolean, string][] = [
        ["PrestaShop", { body: html("", `<script>var prestashop = {"cart":{}};</script>`) }, "prestashop", true, "Advanced Parameters > Information"],
        ["PrestaShop (cookie)", { headers: { "Set-Cookie": "PrestaShop-0123456789abcdef0123456789abcdef=x; path=/" }, body: html("") }, "prestashop", true, "Advanced Parameters"],
        ["OpenCart", { headers: { "Set-Cookie": "OCSESSID=abc; path=/" }, body: html("", `<a href="/index.php?route=product/category&path=20">Shop</a>`) }, "opencart", true, "php -v"],
        ["TYPO3", { body: html(`<meta name="generator" content="TYPO3 CMS">`) }, "typo3", false, "Environment Overview"],
        ["Craft CMS (header)", { headers: { "X-Powered-By": "Craft CMS" }, body: html("") }, "craft", false, "Utilities > System Report"],
        ["Craft CMS (SEOmatic)", { body: html(`<meta name="generator" content="SEOmatic">`) }, "craft", false, "System Report"],
        ["Concrete CMS", { body: html(`<meta name="generator" content="Concrete CMS"/>`) }, "concrete", false, "php -v"],
        ["MediaWiki", { body: html(`<meta name="generator" content="MediaWiki 1.43.0">`) }, "mediawiki", false, "Special:Version"],
        ["Moodle", { headers: { "Set-Cookie": "MoodleSession=abc; path=/" }, body: html("") }, "moodle", false, "Server > PHP info"],
        ["Grav", { body: html(`<meta name="generator" content="GravCMS" />`) }, "grav", false, "php -v"],
        ["Kirby", { body: html(`<img src="/media/pages/home/ce9722132a-1717846665/hero.jpg">`) }, "kirby", false, "php -v"],
        ["ProcessWire", { headers: { "X-Powered-By": "ProcessWire CMS, ProCache" }, body: html("") }, "processwire", false, "php -v"],
        ["October CMS", { body: html(`<link href="/combine/0e0070571ed9a39a111c968faa4ec483-1687824365" rel="stylesheet">`) }, "october", false, "php artisan about"],
        ["Laravel with Livewire v3", { body: html(`<style>:root {--livewire-progress-bar-color: #2299dd;}</style>`) }, "laravel", false, "php artisan about"],
        ["Statamic", { body: html(`<script src="/vendor/statamic/frontend/js/helpers.js"></script>`) }, "laravel", false, "php artisan about"],
        ["Drupal 7", { body: html(`<script src="/misc/drupal.js?v=7.101"></script><link href="/sites/all/themes/zen/style.css">`) }, "drupal", false, "Reports > Status report"],
        ["Backdrop CMS", { body: html(`<meta name="generator" content="Backdrop CMS 1 (https://backdropcms.org)">`) }, "drupal", false, "Status report"],
        ["Drupal on Acquia", { headers: { "X-AH-Environment": "prod" }, body: html("") }, "drupal", false, "Status report"],
        ["WordPress VIP", { headers: { "X-Powered-By": "WordPress VIP <https://wpvip.com>" }, body: html("") }, "wordpress", false, "Site Health"],
        ["Magento 2 without static signing", { body: html(`<script src="/static/frontend/Magento/luma/en_US/requirejs/require.js"></script>`) }, "magento", true, "php -v"],
    ];

    it.each(platforms)("%s: can't confirm, with the right steps", async (_, reply, id, store, step) => {
        const site = await mockSite({ "/": reply, "/wp-json/": json(REST_INDEX(["wp/v2"])) });
        const result = await checkSite(site.url, LOCAL);

        expect(result).toMatchObject({ verdict: "unknown", php: { detected: true }, platform: { id }, store });
        expect(result.manualCheck?.steps.join(" ")).toContain(step);
    });

    it("shows a known platform's own version verdict as usual", async () => {
        const site = await mockSite({
            "/": { headers: { "X-Powered-By": "PHP/8.2.30", "Set-Cookie": "PrestaShop-0123456789abcdef0123456789abcdef=x" }, body: html("") },
        });
        expect(await checkSite(site.url, LOCAL)).toMatchObject({ verdict: "at-risk", platform: { id: "prestashop" }, store: true });
    });
});

describe("no PHP", () => {
    it("a static site is likely not affected", async () => {
        const site = await mockSite({
            "/": {
                headers: { Server: "nginx", "X-Powered-By": "Express" },
                // A link to someone else's .php page says nothing about this site.
                body: html("", `<a href="https://other.example/page.php">Elsewhere</a> PHP/8.4.20`),
            },
        });
        const result = await checkSite(site.url, LOCAL);

        expect(result).toMatchObject({
            verdict: "not-affected",
            headline: "Likely not affected",
            php: { detected: false, version: null },
            platform: { id: null, name: "No PHP detected" },
        });
        // No WordPress, so no REST request.
        expect(site.received).toHaveLength(1);
    });
});

describe("Cloudflare", () => {
    it("is detected from cf-ray and the Server header", async () => {
        const site = await mockSite({
            "/": { headers: { Server: "cloudflare", "CF-RAY": "8d1f2c3a4b5c6d7e-AMS" }, body: WORDPRESS },
            "/wp-json/": json(REST_INDEX(["wp/v2"])),
        });
        const result = await checkSite(site.url, LOCAL);

        expect(result.cloudflare).toEqual({ detected: true, reasons: ["cf-ray header present", "Server header is cloudflare"] });
        expect(result.verdict).toBe("unknown");
    });

    it("is reported absent otherwise", async () => {
        const site = await mockSite({ "/": { headers: { Server: "nginx" }, body: html("") } });
        expect((await checkSite(site.url, LOCAL)).cloudflare).toEqual({ detected: false, reasons: [] });
    });

    it("a challenge page means we can't confirm, never 'not affected'", async () => {
        const site = await mockSite({
            "/": {
                status: 403,
                headers: { Server: "cloudflare", "CF-RAY": "8d1f-AMS", "cf-mitigated": "challenge" },
                body: `<!DOCTYPE html><html><head><title>Just a moment...</title></head><body><script src="/cdn-cgi/challenge-platform/h/b/orchestrate/chl_page/v1"></script></body></html>`,
            },
        });
        const result = await checkSite(site.url, LOCAL);

        expect(result).toMatchObject({ verdict: "unknown", cloudflare: { detected: true }, platform: { id: null } });
        expect(result.summary).toMatch(/security check/);
        expect(result.platform.name).not.toBe("No PHP detected");
    });
});

describe("bot challenges served instead of the site", () => {
    const challenges: [string, Reply][] = [
        [
            "Fastly client challenge (HTTP 200)",
            {
                headers: { "Set-Cookie": "_fs_ch_st_abc=1; Max-Age=10; Path=/" },
                body: html(`<link href="/_fs-ch-1T1wmsGaOgGaSxcX/assets/styles.css" rel="stylesheet" />`).replace("Test site", "Client Challenge"),
            },
        ],
        [
            "SiteGround captcha (HTTP 202)",
            { status: 202, body: `<html><head><meta http-equiv="refresh" content="0;/.well-known/sgcaptcha/?r=%2F"></head></html>` },
        ],
        ["AWS WAF challenge", { status: 202, headers: { "x-amzn-waf-action": "challenge" }, body: html("") }],
        ["Vercel challenge", { status: 429, headers: { "x-vercel-mitigated": "challenge" }, body: html("") }],
        ["DataDome block", { status: 403, body: html(`<script src="https://ct.captcha-delivery.com/c.js"></script>`) }],
        [
            "Imperva/Incapsula challenge (HTTP 200)",
            {
                body: `<html><head><META NAME="ROBOTS" CONTENT="NOINDEX, NOFOLLOW"><script src="/_Incapsula_Resource?SWJIYLWA=719d34d3"></script></head><body><iframe src="/_Incapsula_Resource?SWUDNSAI=31"></iframe></body></html>`,
            },
        ],
    ];

    it.each(challenges)("%s: can't confirm, never 'not affected'", async (_, reply) => {
        const site = await mockSite({ "/": reply });
        const result = await checkSite(site.url, LOCAL);

        expect(result.verdict).toBe("unknown");
        expect(result.summary).toMatch(/security check/);
    });

    it("an ordinary page carrying Cloudflare's bot-detection script still counts as readable", async () => {
        const site = await mockSite({
            "/": { headers: { Server: "cloudflare" }, body: html(`<script src="/cdn-cgi/challenge-platform/scripts/jsd/main.js"></script>`) },
        });
        expect((await checkSite(site.url, LOCAL)).verdict).toBe("not-affected");
    });

    it("a tiny page that only meta-refreshes elsewhere can't be confirmed", async () => {
        const site = await mockSite({ "/": { body: `<html><head><meta http-equiv="refresh" content="0; url=https://elsewhere.example/"></head></html>` } });
        const result = await checkSite(site.url, LOCAL);

        expect(result.verdict).toBe("unknown");
        expect(result.summary).toMatch(/only a browser follows/);
    });
});

describe("pages we can't read", () => {
    it("an error page means we can't confirm", async () => {
        const site = await mockSite({ "/": { status: 500, body: html("") } });
        const result = await checkSite(site.url, LOCAL);

        expect(result.verdict).toBe("unknown");
        expect(result.summary).toContain("HTTP 500");
    });

    it("an empty page means we can't confirm", async () => {
        const site = await mockSite({ "/": { body: "" } });
        expect((await checkSite(site.url, LOCAL)).verdict).toBe("unknown");
    });

    it("a server that never answers times out as unreachable", async () => {
        const site = await mockSite({ "/": { hang: true } });
        const result = await checkSite(site.url, { ...LOCAL, timeoutMs: 300 });

        expect(result).toMatchObject({ verdict: "unreachable", headline: "Couldn't check this site" });
        expect(result.summary).toMatch(/didn't answer within/);
        expect(result.requests).toEqual([{ url: site.url, status: null, error: expect.stringMatching(/didn't answer/) }]);
    });

    it("a dropped connection is unreachable", async () => {
        const site = await mockSite({ "/": { drop: true } });
        expect((await checkSite(site.url, LOCAL)).verdict).toBe("unreachable");
    });

    it("the whole check stops at its time budget", async () => {
        const site = await mockSite({ "/": { hang: true } });
        const started = Date.now();
        await checkSite(site.url, { ...LOCAL, timeoutMs: 5_000, budgetMs: 300 });
        expect(Date.now() - started).toBeLessThan(2_000);
    });
});

describe("redirects", () => {
    it("are followed, and their headers count", async () => {
        const site = await mockSite({
            "/": { status: 301, headers: { Location: "/home/", "X-Redirect-By": "WordPress", "X-Powered-By": "PHP/8.4.20" } },
            "/home/": { body: html("") },
        });
        const result = await checkSite(site.url, LOCAL);

        expect(result.url).toBe(`${site.url}home/`);
        expect(result).toMatchObject({ verdict: "at-risk", php: { version: "8.4.20" }, platform: { id: "wordpress" } });
    });

    it("stop after too many hops", async () => {
        const site = await mockSite({ "/": { status: 302, headers: { Location: "/" } } });
        const result = await checkSite(site.url, { ...LOCAL, maxRedirects: 3 });

        expect(result.verdict).toBe("unreachable");
        expect(result.summary).toMatch(/redirected too many times/);
        expect(site.received).toHaveLength(4);
    });
});

describe("safety", () => {
    it("only ever sends plain GETs without bodies, cookies or credentials, to the page and the REST index", async () => {
        const site = await mockSite({
            "/": { headers: { "Set-Cookie": "PHPSESSID=abc; path=/" }, body: WOOCOMMERCE.replace("WooCommerce 9.3.3", "x") },
            "/wp-json/": json(REST_INDEX(["wp/v2"])),
        });
        await checkSite(site.url, LOCAL);

        expect(site.received.length).toBeGreaterThan(0);
        expect(site.received.length).toBeLessThanOrEqual(2);
        for (const request of site.received) {
            expect(request.method).toBe("GET");
            expect(request.body).toBe("");
            expect(request.headers["content-type"]).toBeUndefined();
            expect(request.headers["content-length"]).toBeUndefined();
            expect(request.headers["transfer-encoding"]).toBeUndefined();
            expect(request.headers.cookie).toBeUndefined();
            expect(request.headers.authorization).toBeUndefined();
            expect(request.headers["user-agent"]).toMatch(/PHP2Shell-Checker/);
            expect(["/", "/wp-json/"]).toContain(request.path);
        }
    });

    it("refuses loopback addresses unless the test switch is on, without sending anything", async () => {
        const site = await mockSite({ "/": { headers: { "X-Powered-By": "PHP/8.4.20" }, body: html("") } });
        const result = await checkSite(site.url);

        expect(result.verdict).toBe("unreachable");
        expect(result.summary).toMatch(/private or internal network/);
        expect(site.received).toHaveLength(0);
    });

    it("never shows a safe verdict when the version is hidden or unreadable", async () => {
        const cases: Reply[] = [
            { body: WORDPRESS },
            { body: WOOCOMMERCE },
            { headers: { "X-Powered-By": "PHP" }, body: html("") },
            { headers: { "X-Powered-By": "PHP/8.4" }, body: html("") },
            { headers: { "X-Powered-By": "PHP/8.4.27RC1" }, body: html("") },
            { headers: { "X-Powered-By": "PHP/9.0.0" }, body: html("") },
            { headers: { "Set-Cookie": "PHPSESSID=1" }, body: html("") },
            { status: 403, headers: { "cf-mitigated": "challenge" }, body: "" },
            { status: 503, body: html("") },
        ];
        for (const reply of cases) {
            const site = await mockSite({ "/": reply });
            const { verdict } = await checkSite(site.url, LOCAL);
            expect(verdict, JSON.stringify(reply.headers)).not.toBe("safe");
        }
    });
});

describe("addresses typed without a scheme", () => {
    it("try HTTPS first and fall back to plain HTTP", async () => {
        const site = await mockSite({ "/": { headers: { "X-Powered-By": "PHP/8.4.27" }, body: html("") } });
        const result = await checkSite(site.host, LOCAL);

        expect(result.verdict).toBe("safe");
        expect(result.requests.map(({ url }) => new URL(url).protocol)).toEqual(["https:", "http:"]);
        expect(result.requests[0].status).toBeNull();
    });
});
