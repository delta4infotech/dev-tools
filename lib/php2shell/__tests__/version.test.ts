import { describe, expect, it } from "vitest";
import { PHP2SHELL_RULES } from "../config";
import { assessPhpVersion, findPhpVersions, mostSevere, upgradeTargets } from "../version";

const status = (version: string) => assessPhpVersion(version).status;

describe("assessPhpVersion", () => {
    it("treats the last unfixed patch as vulnerable and the first fixed one as fixed, in every branch", () => {
        for (const fixed of PHP2SHELL_RULES.fixedIn) {
            const [major, minor, patch] = fixed.split(".").map(Number);
            expect(status(`${major}.${minor}.${patch - 1}`), `${major}.${minor}.${patch - 1}`).toBe("vulnerable");
            expect(status(fixed), fixed).toBe("fixed");
            expect(status(`${major}.${minor}.${patch + 50}`)).toBe("fixed");
            expect(status(`${major}.${minor}.0`)).toBe("vulnerable");
        }
    });

    it("matches the published fix list", () => {
        expect(status("8.5.11")).toBe("vulnerable");
        expect(status("8.5.12")).toBe("fixed");
        expect(status("8.4.26")).toBe("vulnerable");
        expect(status("8.4.27")).toBe("fixed");
        expect(status("8.3.35")).toBe("vulnerable");
        expect(status("8.3.36")).toBe("fixed");
        expect(status("8.2.34")).toBe("vulnerable");
        expect(status("8.2.35")).toBe("fixed");
    });

    it("reports 8.1 and older as end-of-life whatever the patch number", () => {
        for (const version of ["8.1.34", "8.1.35", "8.1.99", "8.0.30", "7.4.33", "7.0.0", "5.6.40", "5.4.45"]) {
            expect(status(version), version).toBe("eol");
        }
    });

    it("classifies a bare branch when the branch alone decides", () => {
        expect(status("7.4")).toBe("eol");
        expect(assessPhpVersion("8.4")).toMatchObject({ status: "unknown", note: expect.stringContaining("part of the version") });
    });

    it("can't confirm branches newer than the fix list", () => {
        for (const version of ["8.6.0", "9.0.0"]) {
            expect(assessPhpVersion(version)).toMatchObject({ status: "unknown", fixedIn: null });
        }
    });

    it("can't confirm unreadable versions", () => {
        for (const version of ["not-a-version", "", "8", "v8.4.27", "8.4.27foo"]) {
            expect(status(version), version).toBe("unknown");
        }
    });

    it("never calls a pre-release of the fixed patch fixed, but knows an older pre-release is vulnerable", () => {
        for (const version of ["8.4.27RC1", "8.4.27-rc1", "8.4.27~beta1", "8.4.27-dev", "8.4.28alpha2"]) {
            expect(assessPhpVersion(version), version).toMatchObject({ status: "unknown", prerelease: true });
        }
        expect(status("8.4.26RC1")).toBe("vulnerable");
    });

    it("flags Linux distribution builds so the backport caveat can be shown", () => {
        expect(assessPhpVersion("8.4.26-1ubuntu1")).toMatchObject({ status: "vulnerable", distroBuild: true, fixedIn: "8.4.27" });
        expect(assessPhpVersion("8.4.27-1ubuntu1")).toMatchObject({ status: "fixed", distroBuild: true });
        expect(assessPhpVersion("8.2.20+deb12u1")).toMatchObject({ status: "vulnerable", distroBuild: true });
        expect(assessPhpVersion("8.4.27")).toMatchObject({ distroBuild: false });
    });
});

describe("findPhpVersions", () => {
    it("reads X-Powered-By and Server banners", () => {
        expect(findPhpVersions("PHP/8.4.26")).toEqual(["8.4.26"]);
        expect(findPhpVersions("Apache/2.4.62 (Unix) OpenSSL/3.0.13 PHP/8.3.10")).toEqual(["8.3.10"]);
        expect(findPhpVersions("php/7.4.33, PleskLin")).toEqual(["7.4.33"]);
        expect(findPhpVersions("Apache/2.4.62 PHP/8.4.27\nPHP/8.4.26")).toEqual(["8.4.27", "8.4.26"]);
    });

    it("finds nothing when the version is hidden", () => {
        expect(findPhpVersions("PHP")).toEqual([]);
        expect(findPhpVersions("nginx")).toEqual([]);
        expect(findPhpVersions("Express")).toEqual([]);
        expect(findPhpVersions("")).toEqual([]);
    });
});

describe("mostSevere", () => {
    const pick = (...versions: string[]) => mostSevere(versions.map(assessPhpVersion))?.version;

    it("never lets a fixed banner hide a vulnerable or unrecognized one", () => {
        expect(pick("8.4.27", "8.4.26")).toBe("8.4.26");
        expect(pick("8.4.26", "8.4.27")).toBe("8.4.26");
        expect(pick("8.4.27", "9.0.0")).toBe("9.0.0");
        expect(pick("8.4.27", "7.4.33")).toBe("7.4.33");
        expect(pick()).toBeUndefined();
    });
});

describe("upgradeTargets", () => {
    it("suggests the newest branches first", () => {
        expect(upgradeTargets()).toEqual(["8.5", "8.4"]);
    });
});
