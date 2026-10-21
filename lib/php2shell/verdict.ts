/**
 * Turns what the scanner saw into a verdict and plain-language next steps.
 *
 * The one hard rule: a hidden or unreadable PHP version never produces a
 * "safe" verdict. "safe" needs a visible, fixed version number.
 */
import { PHP2SHELL_RULES } from "./config";
import { detect, PLATFORM_NAMES, STORE_PLATFORMS, type PageEvidence, type PlatformId } from "./detect";
import { assessPhpVersion, findPhpVersions, mostSevere, upgradeTargets, type PatchStatus, type VersionAssessment } from "./version";

export type Verdict = "at-risk" | "safe" | "unknown" | "not-affected" | "unreachable";

export interface RequestLog {
    url: string;
    status: number | null;
    error?: string;
}

export interface ScanEvidence {
    /** Address the check started from. */
    url: string;
    /** Every response received, in order: redirects, the page, then the REST index. */
    pages: PageEvidence[];
    /** Every request made, including ones that failed. */
    requests: RequestLog[];
    /** Why the site could not be loaded, in plain words; null when it loaded. */
    error: string | null;
}

export interface ManualCheck {
    title: string;
    steps: string[];
}

export interface CheckResult {
    url: string;
    checkedAt: string;
    verdict: Verdict;
    headline: string;
    summary: string;
    php: {
        detected: boolean;
        version: string | null;
        status: PatchStatus | null;
        fixedIn: string | null;
        distroBuild: boolean;
        /** Where the version came from, e.g. "X-Powered-By header". */
        source: string | null;
    };
    platform: { id: PlatformId | null; name: string; reasons: string[] };
    store: boolean;
    cloudflare: { detected: boolean; reasons: string[] };
    nextSteps: string[];
    manualCheck: ManualCheck | null;
    /** Headers of the page itself, shown under "technical details". */
    headers: { server: string | null; poweredBy: string | null };
    requests: RequestLog[];
}

const CVES = PHP2SHELL_RULES.cves.join(" and ");

const MANUAL_CHECKS = {
    wordpress: {
        title: "Find your PHP version in WordPress",
        steps: [
            "Log in to your WordPress dashboard.",
            "Go to Tools > Site Health, then open the Info tab.",
            "Open the Server section and look for \"PHP version\".",
        ],
    },
    drupal: {
        title: "Find your PHP version in Drupal",
        steps: ["Log in as an administrator.", "Go to Reports > Status report.", "Look for the PHP row."],
    },
    joomla: {
        title: "Find your PHP version in Joomla",
        steps: [
            "Log in to the Joomla administrator panel.",
            "Go to System > System Information.",
            "Look for \"PHP Version\".",
        ],
    },
    server: {
        title: "Find your PHP version on your server",
        steps: [
            "If you have server access, run php -v.",
            "Otherwise, ask your hosting provider which PHP version runs your site.",
            "The command line can use a different PHP than your website. If in doubt, trust what your host says is serving the site.",
        ],
    },
} satisfies Record<string, ManualCheck>;

function manualCheckFor(platform: PlatformId | null): ManualCheck {
    if (platform === "wordpress" || platform === "woocommerce") return MANUAL_CHECKS.wordpress;
    if (platform === "drupal") return MANUAL_CHECKS.drupal;
    if (platform === "joomla") return MANUAL_CHECKS.joomla;
    return MANUAL_CHECKS.server;
}

const STORE_URGENT = "This is an online store, so treat this as urgent: customer accounts and checkout are at stake.";

/** The most severe PHP version advertised in Server or X-Powered-By on any response. */
function advertisedVersion(pages: PageEvidence[]): { assessment: VersionAssessment; source: string } | null {
    const found: { assessment: VersionAssessment; source: string }[] = [];
    for (const page of pages) {
        for (const [name, label] of [["server", "Server"], ["x-powered-by", "X-Powered-By"]] as const) {
            for (const version of findPhpVersions(page.headers[name] ?? "")) {
                found.push({ assessment: assessPhpVersion(version), source: `${label} header on ${page.url}` });
            }
        }
    }
    const worst = mostSevere(found.map(({ assessment }) => assessment));
    return found.find(({ assessment }) => assessment === worst) ?? null;
}

/** Why a page we did get still can't show whether the site runs PHP; null when it can. */
function unreadableReason(page: PageEvidence | undefined, challenged: boolean): string | null {
    if (!page) return "we couldn't load the page";
    if (challenged) return "the site showed a security check (a bot challenge) instead of the page";
    if (page.status < 200 || page.status >= 300) return `the site answered with an error (HTTP ${page.status})`;
    if (!page.body.trim()) return "the page came back empty";
    // A tiny page that only forwards the browser elsewhere isn't the site itself.
    if (page.body.length < 2_000 && /<meta\b[^>]*http-equiv\s*=\s*["']?refresh/i.test(page.body)) {
        return "the page forwards visitors elsewhere in a way only a browser follows";
    }
    return null;
}

export function buildResult(evidence: ScanEvidence, now = new Date()): CheckResult {
    const detection = detect(evidence.pages);
    const advertised = advertisedVersion(evidence.pages);
    const assessment = advertised?.assessment ?? null;
    const page = evidence.pages.find((p) => p.kind === "page");
    const notReadable = unreadableReason(page, detection.challenged);

    const primary = detection.platforms[0] ?? null;
    const platformId = primary?.id ?? null;
    const store = platformId !== null && STORE_PLATFORMS.includes(platformId);
    const phpDetected = detection.phpDetected || assessment !== null;
    const host = new URL(page?.url ?? evidence.url).hostname;

    const base = {
        url: page?.url ?? evidence.url,
        checkedAt: now.toISOString(),
        php: {
            detected: phpDetected,
            version: assessment?.version ?? null,
            status: assessment?.status ?? null,
            fixedIn: assessment?.fixedIn ?? null,
            distroBuild: assessment?.distroBuild ?? false,
            source: advertised?.source ?? null,
        },
        platform: {
            id: platformId,
            name: primary ? PLATFORM_NAMES[primary.id] : notReadable ? "Unknown (couldn't read the site)" : "No PHP detected",
            reasons: detection.platforms.flatMap((platform) => platform.reasons),
        },
        store,
        cloudflare: detection.cloudflare,
        headers: {
            server: page?.headers["server"] ?? null,
            poweredBy: page?.headers["x-powered-by"] ?? null,
        },
        requests: evidence.requests,
    };
    const urgent = store ? [STORE_URGENT] : [];
    const backport =
        assessment?.distroBuild
            ? [`PHP ${assessment.version} is a Linux distribution build. Distributions sometimes backport fixes without changing the version number, so ask your host whether this build includes the fix for ${CVES}.`]
            : [];

    if (assessment?.status === "vulnerable") {
        return {
            ...base,
            verdict: "at-risk",
            headline: "At risk: update PHP now",
            summary: `This site reports PHP ${assessment.version}. That version is affected by ${PHP2SHELL_RULES.name}; the fix is in PHP ${assessment.fixedIn}.`,
            nextSteps: [
                ...urgent,
                `Update PHP to ${assessment.fixedIn} or newer. Most hosting control panels have a "PHP version" setting; if yours doesn't, ask your host to update it.`,
                ...backport,
                "Run this check again once PHP is updated.",
            ],
            manualCheck: null,
        };
    }

    if (assessment?.status === "eol") {
        return {
            ...base,
            verdict: "at-risk",
            headline: "At risk: update PHP now",
            summary: `This site reports PHP ${assessment.version}. PHP ${assessment.branch} is end-of-life and will not get a fix for ${PHP2SHELL_RULES.name}.`,
            nextSteps: [
                ...urgent,
                `Move to PHP ${upgradeTargets().join(" or ")}, from your hosting control panel or by asking your host.`,
                "Try the upgrade on a staging copy first: old plugins, themes or extensions may need updating too.",
                ...backport,
                "Run this check again after upgrading.",
            ],
            manualCheck: null,
        };
    }

    if (assessment?.status === "fixed") {
        return {
            ...base,
            verdict: "safe",
            headline: "Likely safe: confirm with your host",
            summary: `This site reports PHP ${assessment.version}, which includes the ${PHP2SHELL_RULES.name} fix. Headers can be out of date or come from a different server than the one running your site, so confirm the version with your host.`,
            nextSteps: [
                ...(store ? ["This is an online store, so it's worth the two minutes to confirm."] : []),
                "Confirm the PHP version with your host, or check it yourself using the steps below.",
                "Keep PHP on a supported version and apply security updates as they come out.",
            ],
            manualCheck: manualCheckFor(platformId),
        };
    }

    const compare = `Compare it with the fixed versions: ${PHP2SHELL_RULES.fixedIn.join(", ")} or newer. PHP older than ${PHP2SHELL_RULES.oldestSupportedBranch} will not get a fix.`;

    if (assessment) {
        return {
            ...base,
            verdict: "unknown",
            headline: "Can't confirm",
            summary: `This site reports PHP ${assessment.version}, but we can't tell whether it's fixed: ${assessment.note}.`,
            nextSteps: [...urgent, "Check the exact PHP version using the steps below, or ask your host.", compare],
            manualCheck: manualCheckFor(platformId),
        };
    }

    if (phpDetected) {
        const what = platformId === "php" ? "This site shows signs of running PHP" : `This looks like a ${PLATFORM_NAMES[platformId!]} site, which runs on PHP`;
        return {
            ...base,
            verdict: "unknown",
            headline: "Can't confirm",
            summary: `${what}, but it hides its PHP version, so we can't tell whether it's patched.`,
            nextSteps: [
                ...urgent,
                "Find your PHP version using the steps below.",
                compare,
                "If yours is older, update PHP or ask your host to.",
            ],
            manualCheck: manualCheckFor(platformId),
        };
    }

    if (!page && evidence.error) {
        return {
            ...base,
            verdict: "unreachable",
            headline: "Couldn't check this site",
            summary: `We couldn't load ${host}: ${evidence.error}.`,
            nextSteps: [
                "Check the address is right and the site is online, then try again.",
                "If the site is up but blocks automated checks, find your PHP version manually.",
            ],
            manualCheck: MANUAL_CHECKS.server,
        };
    }

    if (notReadable) {
        return {
            ...base,
            verdict: "unknown",
            headline: "Can't confirm",
            summary: `We couldn't see what this site runs on: ${notReadable}.`,
            nextSteps: ["If your site runs on PHP, check its version using the steps below.", compare],
            manualCheck: MANUAL_CHECKS.server,
        };
    }

    return {
        ...base,
        verdict: "not-affected",
        headline: "Likely not affected",
        summary: `We found no sign of PHP on this site. ${PHP2SHELL_RULES.name} only affects sites that run PHP.`,
        nextSteps: [
            "Nothing to do for this issue if your site doesn't use PHP.",
            "Not sure? If your site has a PHP backend or a custom PHP app, run php -v on the server or ask your host.",
        ],
        manualCheck: null,
    };
}
