import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { assertCheckable, BlockedTargetError, getPage, guardedLookup, isBlockedAddress, type FetchOptions } from "../fetch";
import { mockSite } from "./mock-server";

const OPTIONS: FetchOptions = {
    timeoutMs: 2_000,
    maxBodyBytes: 1_000_000,
    userAgent: "test",
    accept: "text/html",
    allowUnsafeTargets: true,
};

describe("isBlockedAddress", () => {
    it.each([
        "127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254",
        "100.64.0.1", "0.0.0.0", "224.0.0.1", "255.255.255.255",
        "::1", "::", "fd00::1", "fe80::1", "::ffff:127.0.0.1", "::ffff:10.0.0.1", "64:ff9b::a00:1", "2002:7f00:1::",
        "not-an-ip",
    ])("blocks %s", (address) => {
        expect(isBlockedAddress(address)).toBe(true);
    });

    it.each(["93.184.215.14", "1.1.1.1", "172.32.0.1", "2606:4700:4700::1111", "::ffff:93.184.215.14"])("allows %s", (address) => {
        expect(isBlockedAddress(address)).toBe(false);
    });
});

describe("assertCheckable", () => {
    const blocked = (address: string) => () => assertCheckable(new URL(address));

    it("refuses private, local and reserved targets", () => {
        for (const address of [
            "http://127.0.0.1/", "http://10.0.0.5/", "http://169.254.169.254/latest/meta-data/", "http://[::1]/",
            "http://[::ffff:127.0.0.1]/", "http://localhost/", "http://printer.local/", "http://metadata.google.internal/",
            "http://intranet/", "http://0x7f.1/",
        ]) {
            expect(blocked(address), address).toThrow(BlockedTargetError);
        }
    });

    it("refuses non-web schemes, credentials and odd ports", () => {
        expect(blocked("ftp://example.com/")).toThrow(/http:\/\/ and https:\/\//);
        expect(blocked("https://user:pass@example.com/")).toThrow(/username or password/);
        expect(blocked("https://example.com:8443/")).toThrow(/standard web ports/);
    });

    it("allows ordinary public sites", () => {
        expect(blocked("https://example.com/")).not.toThrow();
        expect(blocked("http://www.example.com:80/shop")).not.toThrow();
        expect(blocked("https://93.184.215.14/")).not.toThrow();
    });
});

describe("guardedLookup", () => {
    const lookup = (allowUnsafe: boolean, all = false) =>
        new Promise<{ error: Error | null; address: unknown }>((resolve) =>
            guardedLookup(allowUnsafe)("localhost", { all }, (error, address) => resolve({ error, address }))
        );

    it("fails a name that resolves to a private address, so redirects and DNS tricks can't reach one", async () => {
        const { error } = await lookup(false);
        expect(error).toBeInstanceOf(BlockedTargetError);
        expect((await lookup(false, true)).error).toBeInstanceOf(BlockedTargetError);
    });

    it("resolves normally when allowed", async () => {
        const single = await lookup(true);
        expect(single.error).toBeNull();
        expect(typeof single.address).toBe("string");
        expect(Array.isArray((await lookup(true, true)).address)).toBe(true);
    });
});

describe("getPage", () => {
    it("refuses a loopback target before connecting", async () => {
        const site = await mockSite({ "/": { body: "hi" } });
        expect(() => getPage(new URL(site.url), { ...OPTIONS, allowUnsafeTargets: false })).toThrow(BlockedTargetError);
        expect(site.received).toHaveLength(0);
    });

    it("returns status, lower-cased headers, cookies apart, and the body", async () => {
        const site = await mockSite({
            "/": { status: 404, headers: { "X-Powered-By": "PHP/8.4.27", "Set-Cookie": ["a=1", "b=2"] }, body: "<p>missing</p>" },
        });
        const response = await getPage(new URL(site.url), OPTIONS);

        expect(response.status).toBe(404);
        expect(response.headers["x-powered-by"]).toBe("PHP/8.4.27");
        expect(response.headers["set-cookie"]).toBeUndefined();
        expect(response.setCookies).toEqual(["a=1", "b=2"]);
        expect(response.body).toBe("<p>missing</p>");
    });

    it("decompresses gzip bodies", async () => {
        const site = await mockSite({
            "/": { headers: { "Content-Encoding": "gzip" }, body: gzipSync('<meta name="generator" content="WordPress 6.6">') },
        });
        expect((await getPage(new URL(site.url), OPTIONS)).body).toContain("WordPress 6.6");
    });

    it("stops reading at the body size cap", async () => {
        const site = await mockSite({ "/": { body: "x".repeat(3_000_000) } });
        expect((await getPage(new URL(site.url), { ...OPTIONS, maxBodyBytes: 1_000 })).body).toHaveLength(1_000);
    });

    it("caps decompressed size too", async () => {
        const site = await mockSite({ "/": { headers: { "Content-Encoding": "gzip" }, body: gzipSync("x".repeat(5_000_000)) } });
        expect((await getPage(new URL(site.url), { ...OPTIONS, maxBodyBytes: 10_000 })).body.length).toBeLessThanOrEqual(10_000);
    });

    it("rejects with a timeout when no response arrives", async () => {
        const site = await mockSite({ "/": { hang: true } });
        await expect(getPage(new URL(site.url), { ...OPTIONS, timeoutMs: 200 })).rejects.toThrow(/didn't answer within 0.2 seconds/);
    });
});
