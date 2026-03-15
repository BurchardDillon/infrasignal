"use server";

import { revalidatePath } from "next/cache";
import { rawArticleSchema } from "@/lib/validation/ingestion-schema";
import { interpretArticle } from "@/lib/engine/interpret-article";
import { linkToAccounts } from "@/lib/engine/link-accounts";
import {
  insertNewsItem,
  fetchAccountsForLinking,
} from "@/lib/supabase/queries";
import type { Json } from "@/lib/supabase/database.types";

// ---------------------------------------------------------------------------
// Ingest result type
// ---------------------------------------------------------------------------

export interface IngestResult {
  success: boolean;
  error?: string;
  newsItemId?: string;
  interpretation?: {
    event_type: string;
    urgency_score: number;
    commercial_relevance_score: number;
    confidence_score: number;
    hardware_categories: string[];
    linked_account_count: number;
  };
}

// ---------------------------------------------------------------------------
// Server Action: ingestArticle
// ---------------------------------------------------------------------------

export async function ingestArticle(
  _prevState: IngestResult | null,
  formData: FormData
): Promise<IngestResult> {
  // 1. Validate form data
  const parsed = rawArticleSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    source_url: formData.get("source_url"),
    source_name: formData.get("source_name"),
    published_at: formData.get("published_at"),
    mentioned_companies: formData.get("mentioned_companies") ?? "",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0].message,
    };
  }

  const raw = {
    title: parsed.data.title,
    body: parsed.data.body,
    source_url: parsed.data.source_url,
    source_name: parsed.data.source_name,
    published_at: parsed.data.published_at,
    mentioned_companies: parsed.data.mentioned_companies,
  };

  try {
    // 2. Run deterministic interpretation engine
    const interpreted = interpretArticle(raw);

    // 3. Link to existing accounts
    const accounts = await fetchAccountsForLinking();
    const linkResult = linkToAccounts(raw.mentioned_companies, accounts);

    // 4. Assemble insert payload
    const insertPayload = {
      title: raw.title,
      summary: raw.body.length > 500 ? raw.body.slice(0, 497) + "..." : raw.body,
      source_url: raw.source_url,
      source_name: raw.source_name,
      published_at: raw.published_at,
      event_type: interpreted.event_type,
      urgency_score: interpreted.urgency_score,
      commercial_relevance_score: interpreted.commercial_relevance_score,
      confidence_score: interpreted.confidence_score,
      impact_summary: interpreted.impact_summary,
      recommended_outreach_department: interpreted.recommended_outreach_department,
      suggested_outreach_angle: interpreted.suggested_outreach_angle,
      component_impact: interpreted.component_impact as unknown as Json,
      hardware_categories: interpreted.hardware_categories,
      account_id: linkResult.account_id,
      linked_accounts: linkResult.linked_accounts as unknown as Json,
    };

    // 5. Insert into Supabase
    const newsItem = await insertNewsItem(insertPayload);

    // 6. Revalidate relevant pages
    revalidatePath("/intelligence");
    revalidatePath("/dashboard");
    if (linkResult.account_id) {
      revalidatePath(`/accounts/${linkResult.account_id}`);
    }

    return {
      success: true,
      newsItemId: newsItem.id,
      interpretation: {
        event_type: interpreted.event_type,
        urgency_score: interpreted.urgency_score,
        commercial_relevance_score: interpreted.commercial_relevance_score,
        confidence_score: interpreted.confidence_score,
        hardware_categories: interpreted.hardware_categories,
        linked_account_count: linkResult.linked_accounts.length,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}
