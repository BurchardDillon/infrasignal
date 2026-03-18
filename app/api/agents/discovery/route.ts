import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/agents/auth";
import { runDiscoveryAgent } from "@/lib/agents/discovery-agent";
import type { CompanyDiscoveryInput } from "@/lib/types";

// ---------------------------------------------------------------------------
// POST /api/agents/discovery
// Accepts a JSON body: { companies: CompanyDiscoveryInput[] }
// Auth: CRON_SECRET (Bearer header or ?token= query param)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let companies: CompanyDiscoveryInput[];
  try {
    const body = await request.json();
    companies = body.companies;
    if (!Array.isArray(companies) || companies.length === 0) {
      return NextResponse.json(
        { error: "Request body must include a non-empty 'companies' array" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const result = await runDiscoveryAgent(companies);
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
