import { describe, expect, it } from "vitest";
import { detect, type PageEvidence } from "../detect";

const page = (overrides: Partial<PageEvidence>): PageEvidence => ({
    url: "https://www.example.com/",
    status: 200,
    headers: {},
    setCookies: [],
    body: "",
    kind: "page",
    ...overrides,
});

const ids = (pages: PageEvidence[]) => detect(pages).platforms.map(({ id }) => id);

describe("detect", () => {
    it("reads generator tags whatever the attribute order or quoting", () => {
        expect(ids([page({ body: `<meta content="WordPress 6.6" name="generator">` })])).toEqual(["wordpress"]);
        expect(ids([page({ body: `<META NAME=generator CONTENT='Joomla! 5'>` })])).toEqual(["joomla"]);
        expect(ids([page({ body: `<meta name="Generator" content="Drupal 11">` })])).toEqual(["drupal"]);
    });

    it("lists WooCommerce before WordPress, and implies WordPress", () => {
        const detection = detect([page({ setCookies: ["woocommerce_items_in_cart=1; path=/"] })]);
        expect(detection.platforms).toEqual([
            { id: "woocommerce", reasons: ["Sets WooCommerce cookies"] },
            { id: "wordpress", reasons: ["WooCommerce runs on WordPress"] },
        ]);
    });

    it("spots WooCommerce from its Store API settings in the page", () => {
        expect(ids([page({ body: `<script>var wcSettings = {"storeApiUrl":"\\/wp-json\\/wc\\/store\\/v1"};</script>` })])).toContain("woocommerce");
    });

    it("spots WordPress from its REST Link header and redirect header", () => {
        expect(ids([page({ headers: { link: '<https://example.com/wp-json/>; rel="https://api.w.org/"' } })])).toEqual(["wordpress"]);
        expect(ids([page({ kind: "redirect", status: 301, headers: { "x-redirect-by": "WordPress" } })])).toEqual(["wordpress"]);
    });

    it("spots Drupal from its session cookie and Magento from its headers", () => {
        expect(ids([page({ setCookies: ["SSESS0123456789abcdef0123456789abcdef=x"] })])).toEqual(["drupal"]);
        expect(ids([page({ headers: { "x-magento-cache-debug": "HIT" } })])).toEqual(["magento"]);
    });

    it("needs both XSRF-TOKEN and a session cookie before calling a site Laravel", () => {
        expect(ids([page({ setCookies: ["XSRF-TOKEN=a"] })])).toEqual([]);
        expect(ids([page({ setCookies: ["XSRF-TOKEN=a", "myapp_session=b"] })])).toEqual(["laravel"]);
    });

    it("counts .php links on the same site (www or not), not on other sites", () => {
        expect(ids([page({ body: `<a href="https://example.com/index.php?p=1">x</a>` })])).toEqual(["php"]);
        expect(ids([page({ body: `<form action="login.php"></form>` })])).toEqual(["php"]);
        expect(ids([page({ body: `<a href="https://elsewhere.example/index.php">x</a>` })])).toEqual([]);
        expect(ids([page({ body: `<a href="/docs/php-guide">x</a>` })])).toEqual([]);
    });

    it("ignores HTML-looking text outside the page itself", () => {
        expect(ids([page({ kind: "redirect", status: 301, body: `<a href="/wp-content/x">moved</a>` })])).toEqual([]);
    });

    it("finds nothing on a plain site", () => {
        const detection = detect([page({ headers: { server: "nginx" }, body: "<html><body>Hi</body></html>" })]);
        expect(detection).toEqual({ platforms: [], phpDetected: false, cloudflare: { detected: false, reasons: [] }, challenged: false });
    });

    it("recognizes a Cloudflare challenge page", () => {
        const challenge = page({
            status: 503,
            headers: { server: "cloudflare" },
            body: "<html><head><title>Just a moment...</title></head></html>",
        });
        expect(detect([challenge])).toMatchObject({ challenged: true, cloudflare: { detected: true } });
        // Cloudflare injects this script into ordinary pages too.
        const ordinary = page({ body: `<html><script src="/cdn-cgi/challenge-platform/scripts/jsd/main.js"></script></html>` });
        expect(detect([ordinary]).challenged).toBe(false);
        expect(detect([{ ...ordinary, status: 403 }]).challenged).toBe(true);
    });
});
