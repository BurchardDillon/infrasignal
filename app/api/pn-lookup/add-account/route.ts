import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

/**
 * POST /api/pn-lookup/add-account
 * Creates a new account from a web intel discovery, plus auto-creates
 * hardware preferences based on the component that triggered the discovery.
 */
export async function POST(req: NextRequest) {
  try {
    const { company_name, domain, context, component_category, component_ecosystem } =
      await req.json();

    if (!company_name || typeof company_name !== "string") {
      return NextResponse.json(
        { error: "company_name is required" },
        { status: 400 }
      );
    }

    // Check for existing account by name or domain
    let existingQuery = supabase
      .from("accounts")
      .select("id, company_name")
      .ilike("company_name", company_name.trim());

    const { data: byName } = await existingQuery;
    if (byName && byName.length > 0) {
      const existing = byName[0] as unknown as { id: string; company_name: string };
      return NextResponse.json({
        account_id: existing.id,
        company_name: existing.company_name,
        already_existed: true,
      });
    }

    if (domain) {
      const { data: byDomain } = await supabase
        .from("accounts")
        .select("id, company_name")
        .ilike("domain", domain.trim());
      if (byDomain && byDomain.length > 0) {
        const existing = byDomain[0] as unknown as { id: string; company_name: string };
        return NextResponse.json({
          account_id: existing.id,
          company_name: existing.company_name,
          already_existed: true,
        });
      }
    }

    // Create new account
    const { data: newAccount, error: insertErr } = await supabase
      .from("accounts")
      .insert({
        company_name: company_name.trim(),
        domain: domain?.trim() || null,
        notes: context ? `Web intel: ${context}` : null,
      } as never)
      .select("id")
      .single();

    if (insertErr || !newAccount) {
      return NextResponse.json(
        { error: insertErr?.message ?? "Failed to create account" },
        { status: 500 }
      );
    }

    const accountId = (newAccount as unknown as { id: string }).id;

    // Auto-create hardware preferences based on the component
    const prefs = buildPrefsFromComponent(component_category, component_ecosystem);
    await supabase.from("account_hardware_prefs").insert({
      account_id: accountId,
      ...prefs,
    } as never);

    return NextResponse.json({
      account_id: accountId,
      company_name: company_name.trim(),
      already_existed: false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Build hardware preferences based on the component category/ecosystem
 * that triggered the web discovery.
 */
function buildPrefsFromComponent(
  category: string | null,
  ecosystem: string | null
) {
  const prefs: Record<string, unknown> = {
    buys_cpus: false,
    buys_gpus: false,
    buys_memory: false,
    buys_ssds: false,
    buys_networking: false,
    buys_systems: false,
    buys_frus: false,
    cpu_ecosystem: [] as string[],
    gpu_ecosystem: [] as string[],
    platforms: [] as string[],
  };

  switch (category) {
    case "cpu":
      prefs.buys_cpus = true;
      if (ecosystem) prefs.cpu_ecosystem = [ecosystem.toLowerCase()];
      break;
    case "gpu":
      prefs.buys_gpus = true;
      if (ecosystem) prefs.gpu_ecosystem = [ecosystem.toLowerCase()];
      break;
    case "memory":
      prefs.buys_memory = true;
      break;
    case "ssd":
      prefs.buys_ssds = true;
      break;
    case "networking":
      prefs.buys_networking = true;
      break;
    case "system":
      prefs.buys_systems = true;
      break;
    case "fru":
      prefs.buys_frus = true;
      break;
  }

  return prefs;
}
