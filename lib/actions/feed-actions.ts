"use server";

import { revalidatePath } from "next/cache";
import { runFeedAgent } from "@/lib/agents/feed-agent";
import { validateFeedUrl } from "@/lib/engine/parse-feed";
import {
  insertFeedSource,
  toggleFeedSource,
  deleteFeedSource,
} from "@/lib/supabase/queries";
import type { FeedAgentResult, FeedSource } from "@/lib/types";

// ---------------------------------------------------------------------------
// Feed source management
// ---------------------------------------------------------------------------

export async function addFeedSource(
  name: string,
  url: string,
  sourceType: "rss" | "atom"
): Promise<{
  success: boolean;
  error?: string;
  feedSource?: FeedSource;
  item_count?: number;
}> {
  // 1. Validate the feed URL before saving
  const validation = await validateFeedUrl(url);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // 2. Use the detected type if auto-detection found a different one
  const resolvedType = validation.detected_type ?? sourceType;

  // 3. Insert (unique constraint on url will catch duplicates)
  try {
    const feedSource = await insertFeedSource(name, url, resolvedType);
    revalidatePath("/admin/feeds");
    return {
      success: true,
      feedSource,
      item_count: validation.item_count,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    // Supabase unique violation returns code 23505
    if (msg.includes("duplicate") || msg.includes("23505")) {
      return { success: false, error: "Feed already exists" };
    }
    return { success: false, error: msg };
  }
}

export async function toggleFeedSourceEnabled(
  id: string,
  isEnabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await toggleFeedSource(id, isEnabled);
    revalidatePath("/admin/feeds");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function removeFeedSource(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteFeedSource(id);
    revalidatePath("/admin/feeds");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Feed refresh
// ---------------------------------------------------------------------------

export async function triggerFeedAgent(): Promise<FeedAgentResult> {
  const result = await runFeedAgent();
  revalidatePath("/intelligence");
  revalidatePath("/prospecting");
  revalidatePath("/dashboard");
  revalidatePath("/admin/agents");
  revalidatePath("/admin/feeds");
  return result;
}
