/**
 * PHP2Shell (CVE-2026-109618 / CVE-2026-109619) version rules.
 *
 * This is the one file to edit when PHP publishes its official advisory or a
 * later release changes which versions are fixed. The checker, the API and the
 * page all read from here.
 */
export const PHP2SHELL_RULES = {
    name: "PHP2Shell",
    cves: ["CVE-2026-109618", "CVE-2026-109619"],

    /** When these rules were last checked against upstream guidance (YYYY-MM-DD). */
    updated: "2026-10-20",

    /**
     * First fixed release in each supported branch. A lower patch in the same
     * branch is vulnerable; this or any later stable patch is treated as fixed.
     */
    fixedIn: ["8.5.12", "8.4.27", "8.3.36", "8.2.35"],

    /**
     * Branches older than this are end-of-life: no fix exists for them, whatever
     * their patch number. Branches newer than every entry in `fixedIn` are
     * reported as "can't confirm" until they are added above.
     */
    oldestSupportedBranch: "8.2",

    /** PHP's official advisory, once published. */
    advisoryUrl: null as string | null,
};
