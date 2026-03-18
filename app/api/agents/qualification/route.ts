import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/agents/auth";
import { runQualificationAgent } from "@/lib/agents/qualification-agent";

// ---------------------------------------------------------------------------
// GET /api/agents/qualification
// Triggered by Vercel Cron (daily at 6:00 AM UTC) or manual invocation.
// Auth: CRON_SECRET (Bearer header or ?token= query param)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runQualificationAgent();
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
