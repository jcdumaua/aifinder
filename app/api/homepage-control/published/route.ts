import { NextResponse } from "next/server";
import { fetchPublishedHomepageControlConfig } from "../../../../lib/homepage-control-public";
import type { HomepageControlConfigRow } from "../../../../lib/homepage-control-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PublishedHomepageControlResponse = {
    success: boolean;
    config: HomepageControlConfigRow | null;
    errors: string[];
    warnings: string[];
};

function jsonResponse(data: PublishedHomepageControlResponse, status = 200) {
    return NextResponse.json(data, {
        status,
        headers: {
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
        },
    });
}

export async function GET() {
    const result = await fetchPublishedHomepageControlConfig();

    return jsonResponse({
        success: result.success,
        config: result.config,
        errors: result.errors,
        warnings: result.warnings,
    });
}