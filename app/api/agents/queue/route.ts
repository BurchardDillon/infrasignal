import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/agents/auth";
import { runQueueAgent } from "@/lib/agents/queue-agent";

// ---------------------------------------------------------------------------
// GET /api/agents/queue
// Triggered by Vercel Cron (daily at 7:00 AM UTC) or manual invocation.
// Auth: CRON_SECRET (Bearer header or ?token= query param)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runQueueAgent();
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
