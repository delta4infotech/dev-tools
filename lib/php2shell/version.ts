/**
 * PHP version parsing and patch classification against the rules in
 * ./config.ts: below the first fixed patch is vulnerable, a branch older than
 * the oldest supported one is end-of-life whatever its patch, and anything we
 * can't place (a newer branch, a partial or pre-release version) is unknown.
 */
import { PHP2SHELL_RULES } from "./config";

export type PatchStatus = "fixed" | "vulnerable" | "eol" | "unknown";

export interface VersionAssessment {
    /** The version exactly as the server reported it, e.g. "8.4.26-1ubuntu1". */
    version: string;
    /** "8.4" for 8.4.26; null when the string is not a version we can read. */
    branch: string | null;
    status: PatchStatus;
    /** First fixed release for this branch, when the branch has one. */
    fixedIn: string | null;
    /** Vendor build suffix (Ubuntu, Debian, ...) that may carry a backported fix. */
    distroBuild: boolean;
    prerelease: boolean;
    /** Plain-language reason behind an "unknown" status. */
    note: string | null;
}

type Branch = { major: number; minor: number };

function parseBranch(branch: string): Branch {
    const [major, minor] = branch.split(".").map(Number);
    return { major, minor };
}

function compareBranches(a: Branch, b: Branch): number {
    return a.major - b.major || a.minor - b.minor;
}

const FIXED_PATCH = new Map<string, number>(
    PHP2SHELL_RULES.fixedIn.map((release) => {
        const [major, minor, patch] = release.split(".").map(Number);
        return [`${major}.${minor}`, patch];
    })
);

const OLDEST_SUPPORTED = parseBranch(PHP2SHELL_RULES.oldestSupportedBranch);

const VERSION = /^(\d+)\.(\d+)(?:\.(\d+))?(.*)$/;

const PRERELEASE_TAGS = ["dev", "alpha", "beta", "rc"];

/** "RC1", "-rc2", "~beta1" or "-dev" after the patch number: a test build, not a release. */
function isPrerelease(suffix: string): boolean {
    return suffix
        .toLowerCase()
        .split(/[-+~.]/)
        .some((part) => PRERELEASE_TAGS.some((tag) => part.startsWith(tag)));
}

/**
 * Every PHP version advertised in header text, read as product/version tokens:
 * "Apache/2.4.62 (Unix) PHP/8.4.26" gives ["8.4.26"], and so does "PHP 8.4.26".
 */
export function findPhpVersions(text: string): string[] {
    const tokens = text.split(/[\s,;()]+/).filter(Boolean);
    const versions: string[] = [];
    tokens.forEach((token, index) => {
        const [product, version] = token.split("/");
        if (product.toLowerCase() !== "php") return;
        if (version) versions.push(version);
        else if (/^\d/.test(tokens[index + 1] ?? "")) versions.push(tokens[index + 1]);
    });
    return versions;
}

export function assessPhpVersion(version: string): VersionAssessment {
    const unread: VersionAssessment = {
        version,
        branch: null,
        status: "unknown",
        fixedIn: null,
        distroBuild: false,
        prerelease: false,
        note: "it isn't a version number we can read",
    };
    const match = VERSION.exec(version.trim());
    if (!match) return unread;

    const current = { major: Number(match[1]), minor: Number(match[2]) };
    const branch = `${current.major}.${current.minor}`;
    const patch = match[3] === undefined ? null : Number(match[3]);
    const suffix = match[4];
    const prerelease = isPrerelease(suffix);
    const vendorSuffix = /^[-+~]/.test(suffix);
    const known = { ...unread, branch, prerelease, distroBuild: vendorSuffix && !prerelease, note: null };

    if (compareBranches(current, OLDEST_SUPPORTED) < 0) return { ...known, status: "eol" };

    const fixedPatch = FIXED_PATCH.get(branch);
    if (fixedPatch === undefined) {
        return { ...known, note: `PHP ${branch} isn't covered by the published fix list yet` };
    }

    const fixedIn = `${branch}.${fixedPatch}`;
    if (patch === null) return { ...known, fixedIn, note: "the server shows only part of the version number" };
    if (patch < fixedPatch) return { ...known, fixedIn, status: "vulnerable" };
    if (prerelease) return { ...known, fixedIn, note: "it's a pre-release (test) build of PHP" };
    if (suffix && !vendorSuffix) return { ...known, fixedIn, note: unread.note };
    return { ...known, fixedIn, status: "fixed" };
}

const SEVERITY: Record<PatchStatus, number> = { fixed: 0, unknown: 1, vulnerable: 2, eol: 2 };

/**
 * The version that decides the result when a site advertises several (say the
 * Server and X-Powered-By headers disagree): at risk beats unrecognised, which
 * beats fixed, so a fixed banner never hides a problem.
 */
export function mostSevere(assessments: VersionAssessment[]): VersionAssessment | null {
    return assessments.reduce<VersionAssessment | null>(
        (worst, current) => (!worst || SEVERITY[current.status] > SEVERITY[worst.status] ? current : worst),
        null
    );
}

/** Newest branches to move to from an end-of-life version, newest first. */
export function upgradeTargets(count = 2): string[] {
    return [...FIXED_PATCH.keys()]
        .map(parseBranch)
        .sort((a, b) => compareBranches(b, a))
        .slice(0, count)
        .map(({ major, minor }) => `${major}.${minor}`);
}
