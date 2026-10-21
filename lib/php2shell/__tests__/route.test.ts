import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/php2shell-check/route";

const post = (body: unknown) =>
    POST(
        new NextRequest("http://localhost/api/php2shell-check", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: typeof body === "string" ? body : JSON.stringify(body),
        })
    );

describe("POST /api/php2shell-check", () => {
    it("rejects a missing or malformed address", async () => {
        for (const body of [{}, { url: 42 }, "not json", { url: "" }, { url: "not a site" }, { url: "ftp://example.com" }, { url: "localhost" }]) {
            const response = await post(body);
            expect(response.status, JSON.stringify(body)).toBe(400);
            expect((await response.json()).error).toEqual(expect.any(String));
        }
    });

    it("refuses private and local addresses before making any request", async () => {
        for (const url of ["http://127.0.0.1/", "http://169.254.169.254/", "http://[::1]/", "10.0.0.1", "printer.local"]) {
            const response = await post({ url });
            expect(response.status, url).toBe(400);
            expect((await response.json()).error).toMatch(/private or internal network/);
        }
    });
});
