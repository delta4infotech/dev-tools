/** Turns what someone typed ("example.com", "https://shop.example.com/") into a URL to check. */

export class InvalidUrlError extends Error {}

export function normalizeSiteUrl(input: string): { url: URL; schemeGiven: boolean } {
    const trimmed = input.trim();
    if (!trimmed) throw new InvalidUrlError("Enter a website address, like example.com.");
    if (trimmed.length > 2048) throw new InvalidUrlError("That address is too long.");
    if (/[\s\x00-\x1f\x7f]/.test(trimmed)) throw new InvalidUrlError("Website addresses can't contain spaces.");

    const schemeGiven = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed);
    let url: URL;
    try {
        url = new URL(schemeGiven ? trimmed : `https://${trimmed}`);
    } catch {
        throw new InvalidUrlError("That doesn't look like a website address. Try something like example.com.");
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new InvalidUrlError("Only http:// and https:// addresses can be checked.");
    }
    if (url.username || url.password) {
        throw new InvalidUrlError("Remove the username and password from the address.");
    }
    if (!url.hostname.includes(".") && !url.hostname.startsWith("[")) {
        throw new InvalidUrlError("That doesn't look like a full website address. Try something like example.com.");
    }

    url.hash = "";
    return { url, schemeGiven };
}

/** "www.example.com" and "example.com" are the same site. */
export function bareHost(host: string): string {
    return host.toLowerCase().replace(/^www\./, "");
}
