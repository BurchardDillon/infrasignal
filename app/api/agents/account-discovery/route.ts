import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import {
  runAccountDiscoverySearch,
  findSimilarCompanies,
  verifyCompanyWithWebSearch,
  logDiscoveredCompanies,
  getSearchedStates,
  searchCategoryToCompanyType,
  buildHardwarePrefsFromNeeds,
  SEARCH_CATEGORIES,
} from "@/lib/engine/account-discovery-agent";

export const maxDuration = 60;

// ---------------------------------------------------------------------------
// POST /api/agents/account-discovery
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  console.log("[discovery-route] POST received");
  console.log("[discovery-route] ANTHROPIC_API_KEY present:", !!process.env.ANTHROPIC_API_KEY);

  try {
    const body = await req.json();
    const action = body.action || "search";
    console.log("[discovery-route] Action:", action);

    // --- Verify a single company with web search ---
    if (action === "verify") {
      const { company_name, what_they_do } = body;
      if (!company_name) {
        return NextResponse.json({ error: "company_name is required" }, { status: 400 });
      }
      const result = await verifyCompanyWithWebSearch(company_name, what_they_do || "");
      return NextResponse.json(result);
    }

    // --- Find similar companies ---
    if (action === "find_similar") {
      const { company_name, what_they_do } = body;
      if (!company_name) {
        return NextResponse.json({ error: "company_name is required" }, { status: 400 });
      }
      const similar = await findSimilarCompanies(company_name, what_they_do || "");
      return NextResponse.json({ companies: similar });
    }

    // --- Add account ---
    if (action === "add_account") {
      const { company_name, city, state: acctState, what_they_do, likely_needs, search_type } = body;
      if (!company_name) {
        return NextResponse.json({ error: "company_name is required" }, { status: 400 });
      }

      // Check for existing
      const { data: existing } = await supabase
        .from("accounts")
        .select("id, company_name")
        .ilike("company_name", company_name.trim());

      if (existing && existing.length > 0) {
        const acct = existing[0] as unknown as { id: string; company_name: string };
        return NextResponse.json({
          account_id: acct.id,
          company_name: acct.company_name,
          already_existed: true,
        });
      }

      const location = city && acctState ? `${city}, ${acctState}` : city || acctState || null;
      const companyType = searchCategoryToCompanyType(search_type || "other");

      const { data: newAccount, error: insertErr } = await supabase
        .from("accounts")
        .insert({
          company_name: company_name.trim(),
          hq_location: location,
          country: "United States",
          company_type: companyType,
          notes: what_they_do ? `Discovery: ${what_they_do}` : null,
        } as never)
        .select("id")
        .single();

      if (insertErr || !newAccount) {
        console.error("[discovery-route] Insert error:", insertErr);
        return NextResponse.json(
          { error: insertErr?.message ?? "Failed to create account" },
          { status: 500 }
        );
      }

      const accountId = (newAccount as unknown as { id: string }).id;

      const prefs = buildHardwarePrefsFromNeeds(likely_needs || []);
      await supabase.from("account_hardware_prefs").insert({
        account_id: accountId,
        ...prefs,
      } as never);

      // Update discovery_log
      try {
        await supabase
          .from("discovery_log")
          .update({ added_to_accounts: true } as never)
          .eq("company_name", company_name.trim());
      } catch { /* table may not exist */ }

      return NextResponse.json({
        account_id: accountId,
        company_name: company_name.trim(),
        already_existed: false,
      });
    }

    // --- Get searched states for a category ---
    if (action === "get_searched_states") {
      const { search_type } = body;
      const states = await getSearchedStates(search_type || "");
      return NextResponse.json({ states });
    }

    // --- Run search ---
    const { search_type, state } = body;

    if (!search_type || !SEARCH_CATEGORIES[search_type]) {
      return NextResponse.json(
        { error: `Invalid search_type. Valid: ${Object.keys(SEARCH_CATEGORIES).join(", ")}` },
        { status: 400 }
      );
    }

    const stateCode = state || "ALL";
    const startedAt = new Date().toISOString();

    // Log job start
    const { data: jobRow } = await supabase
      .from("job_runs")
      .insert({
        agent_name: `account_discovery:${search_type}:${stateCode}`,
        status: "running",
        started_at: startedAt,
      } as never)
      .select("id")
      .single();

    const jobId = jobRow ? (jobRow as unknown as { id: string }).id : null;

    const result = await runAccountDiscoverySearch(search_type, stateCode);

    // Log discovered companies
    await logDiscoveredCompanies(result.companies, search_type, stateCode, jobId);

    // Update job
    if (jobId) {
      const durationMs = Date.now() - new Date(startedAt).getTime();
      await supabase
        .from("job_runs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          duration_ms: durationMs,
          summary: {
            search_type,
            state: stateCode,
            total_found: result.companies.length,
            new_count: result.new_count,
            existing_count: result.existing_count,
          },
        } as never)
        .eq("id", jobId);
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[discovery-route] ERROR:", message);
    console.error("[discovery-route] Stack:", stack);
    return NextResponse.json(
      { error: message, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// GET — Cron endpoint
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = req.nextUrl.searchParams.get("token");
  const secret = process.env.CRON_SECRET;

  if (secret) {
    const provided = authHeader?.replace("Bearer ", "") || token;
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const categories = Object.keys(SEARCH_CATEGORIES);
  const states = ["CA", "TX", "NY", "FL", "IL", "WA", "VA", "GA", "PA", "CO",
    "NC", "OH", "NJ", "AZ", "MA", "NV", "OR", "TN", "MN", "UT"];
  const weekOfYear = Math.floor(
    (Date.now() - new Date("2025-01-01").getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  const catIndex = weekOfYear % categories.length;
  const stateIndex = weekOfYear % states.length;

  const searchType = categories[catIndex];
  const stateCode = states[stateIndex];

  try {
    const result = await runAccountDiscoverySearch(searchType, stateCode);
    await logDiscoveredCompanies(result.companies, searchType, stateCode, null);

    await supabase
      .from("job_runs")
      .insert({
        agent_name: `account_discovery_cron:${searchType}:${stateCode}`,
        status: "completed",
        summary: {
          search_type: searchType,
          state: stateCode,
          total_found: result.companies.length,
          new_count: result.new_count,
          existing_count: result.existing_count,
        },
      } as never);

    return NextResponse.json({
      success: true,
      search_type: searchType,
      state: stateCode,
      companies_found: result.companies.length,
      new_discoveries: result.new_count,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[discovery-cron] ERROR:", message);
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}
