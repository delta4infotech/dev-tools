import { NextRequest, NextResponse } from "next/server";
import { assertCheckable, BlockedTargetError } from "@/lib/php2shell/fetch";
import { checkSite } from "@/lib/php2shell/scan";
import { InvalidUrlError, normalizeSiteUrl } from "@/lib/php2shell/url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const fail = (status: number, error: string) =>
    NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: NextRequest) {
    const raw = await request.text();
    let input: unknown;
    try {
        input = raw.length <= 4096 ? JSON.parse(raw)?.url : undefined;
    } catch {
        input = undefined;
    }
    if (typeof input !== "string") return fail(400, "Enter a website address, like example.com.");

    try {
        assertCheckable(normalizeSiteUrl(input).url);
    } catch (error) {
        if (error instanceof InvalidUrlError || error instanceof BlockedTargetError) return fail(400, error.message);
        throw error;
    }

    try {
        const result = await checkSite(input);
        return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
        console.error("PHP2Shell check failed", error);
        return fail(500, "Something went wrong while checking this site. Please try again.");
    }
}
