/**
 * The checker's only way onto the network: a plain GET with a deadline, a body
 * size cap, and a guard that refuses private, loopback and other internal
 * addresses (checked on every connection, so DNS tricks and redirects can't
 * reach them either). Server-side only.
 */
import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import zlib from "node:zlib";

export class BlockedTargetError extends Error {}

const PRIVATE_NETWORK = "That address points to a private or internal network, which can't be checked.";

const BLOCKED = new net.BlockList();
for (const [prefix, bits] of [
    ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16],
    ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.88.99.0", 24], ["192.168.0.0", 16],
    ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) {
    BLOCKED.addSubnet(prefix, bits, "ipv4");
}
// IPv4-mapped addresses (::ffff:10.0.0.1) are matched against the IPv4 rules above.
for (const [prefix, bits] of [
    ["::", 96], ["64:ff9b::", 96], ["64:ff9b:1::", 48], ["100::", 64], ["2001::", 23], ["2001:db8::", 32],
    ["2002::", 16], ["fc00::", 7], ["fe80::", 10], ["fec0::", 10], ["ff00::", 8],
] as const) {
    BLOCKED.addSubnet(prefix, bits, "ipv6");
}

export function isBlockedAddress(address: string): boolean {
    const family = net.isIP(address);
    if (family === 0) return true;
    return BLOCKED.check(address, family === 6 ? "ipv6" : "ipv4");
}

const LOCAL_HOSTNAME = /(?:^|\.)(?:localhost|local|localdomain|internal|home\.arpa)$/i;

/**
 * Throws a BlockedTargetError with a plain-language message for addresses the
 * checker must not request. `allowUnsafe` lifts the network limits for tests
 * against local mock servers.
 */
export function assertCheckable(url: URL, allowUnsafe = false): void {
    if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new BlockedTargetError("Only http:// and https:// addresses can be checked.");
    }
    if (url.username || url.password) {
        throw new BlockedTargetError("Addresses with a username or password can't be checked.");
    }
    if (allowUnsafe) return;
    const host = url.hostname.replace(/^\[|\]$/g, "");
    if (net.isIP(host) ? isBlockedAddress(host) : LOCAL_HOSTNAME.test(host) || !host.includes(".")) {
        throw new BlockedTargetError(PRIVATE_NETWORK);
    }
    if (url.port && url.port !== "80" && url.port !== "443") {
        throw new BlockedTargetError("Only sites on the standard web ports (80 and 443) can be checked.");
    }
}

/** DNS lookup that fails when any address for the name is private or internal. */
export function guardedLookup(allowUnsafe: boolean): net.LookupFunction {
    return (hostname, options, callback) => {
        dns.lookup(hostname, { ...options, all: true }, (error, addresses) => {
            if (error) return callback(error, "", 0);
            const list = addresses as unknown as dns.LookupAddress[];
            if (!list.length || (!allowUnsafe && list.some(({ address }) => isBlockedAddress(address)))) {
                return callback(new BlockedTargetError(PRIVATE_NETWORK), "", 0);
            }
            if (options.all) return callback(null, list as unknown as string);
            callback(null, list[0].address, list[0].family);
        });
    };
}

export interface FetchOptions {
    timeoutMs: number;
    maxBodyBytes: number;
    userAgent: string;
    accept: string;
    allowUnsafeTargets: boolean;
}

export interface FetchedResponse {
    status: number;
    /** Lower-cased names; repeated headers joined with ", ". Set-Cookie is kept apart. */
    headers: Record<string, string>;
    setCookies: string[];
    /** Decoded body, cut off at maxBodyBytes. */
    body: string;
}

function decoderFor(encoding: string | undefined): zlib.Gunzip | zlib.Inflate | zlib.BrotliDecompress | null {
    switch ((encoding ?? "").trim().toLowerCase()) {
        case "gzip":
        case "x-gzip":
            return zlib.createGunzip();
        case "deflate":
            return zlib.createInflate();
        case "br":
            return zlib.createBrotliDecompress();
        default:
            return null;
    }
}

/**
 * One GET request. Never sends a body, cookies or credentials, and never
 * follows redirects itself - the caller decides about each hop.
 */
export function getPage(url: URL, options: FetchOptions): Promise<FetchedResponse> {
    assertCheckable(url, options.allowUnsafeTargets);
    const client = url.protocol === "https:" ? https : http;

    return new Promise((resolve, reject) => {
        const request = client.request(url, {
            method: "GET",
            agent: false,
            lookup: guardedLookup(options.allowUnsafeTargets),
            headers: {
                "User-Agent": options.userAgent,
                Accept: options.accept,
                "Accept-Encoding": "gzip, deflate, br",
                "Accept-Language": "en",
            },
        });

        const started = Date.now();
        let deadline = setTimeout(
            () => request.destroy(new Error(`it didn't answer within ${Number((options.timeoutMs / 1000).toFixed(1))} seconds`)),
            options.timeoutMs
        );
        request.on("error", (error) => {
            clearTimeout(deadline);
            reject(error);
        });

        request.on("response", (response) => {
            const headers: Record<string, string> = {};
            for (const [name, value] of Object.entries(response.headers)) {
                if (name !== "set-cookie" && value !== undefined) headers[name] = Array.isArray(value) ? value.join(", ") : value;
            }

            const decoder = decoderFor(response.headers["content-encoding"]);
            const stream = decoder ? response.pipe(decoder) : response;
            const chunks: Buffer[] = [];
            let size = 0;
            let settled = false;

            // A slow, oversized or broken body still leaves us the headers and
            // whatever HTML arrived, which is all the checks need.
            const finish = () => {
                if (settled) return;
                settled = true;
                clearTimeout(deadline);
                response.destroy();
                decoder?.destroy();
                resolve({
                    status: response.statusCode ?? 0,
                    headers,
                    setCookies: response.headers["set-cookie"] ?? [],
                    body: Buffer.concat(chunks).subarray(0, options.maxBodyBytes).toString("utf8"),
                });
            };

            clearTimeout(deadline);
            deadline = setTimeout(finish, Math.max(0, options.timeoutMs - (Date.now() - started)));

            stream.on("data", (chunk: Buffer) => {
                chunks.push(chunk);
                size += chunk.length;
                if (size >= options.maxBodyBytes) finish();
            });
            stream.on("end", finish);
            stream.on("error", finish);
            response.on("error", finish);
            // A cut-off connection ends nothing downstream, so stop here; a complete
            // compressed body still has to drain through the decoder first.
            response.on("close", () => {
                if (!decoder || !response.complete) finish();
            });
        });

        request.end();
    });
}

/** A failed request, described for someone who isn't technical. */
export function describeNetworkError(error: unknown): string {
    if (error instanceof BlockedTargetError) return error.message.replace(/\.$/, "");
    const { code, message } = error as NodeJS.ErrnoException;
    if (code === "ENOTFOUND" || code === "EAI_AGAIN" || code === "ENODATA") return "the domain name couldn't be found";
    if (code === "ECONNREFUSED") return "the server refused the connection";
    if (code === "ECONNRESET" || code === "EPIPE" || message === "socket hang up") return "the connection was closed before the site answered";
    if (code === "EHOSTUNREACH" || code === "ENETUNREACH") return "the server couldn't be reached";
    if (/CERT|certificate|ERR_TLS|SSL/i.test(`${code} ${message}`)) return "its security certificate (HTTPS) isn't valid";
    if (message?.startsWith("it didn't answer")) return message;
    return "the connection failed";
}
