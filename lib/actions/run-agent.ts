"use server";

import { revalidatePath } from "next/cache";
import { runDiscoveryAgent } from "@/lib/agents/discovery-agent";
import { runNewsAgent } from "@/lib/agents/news-agent";
import { runQualificationAgent } from "@/lib/agents/qualification-agent";
import { runQueueAgent } from "@/lib/agents/queue-agent";
import type {
  CompanyDiscoveryInput,
  RawArticleBatchInput,
  DiscoveryAgentResult,
  NewsAgentResult,
  QualificationAgentResult,
  QueueAgentResult,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Server action wrappers for admin UI
// Each calls the orchestrator + revalidates relevant pages.
// ---------------------------------------------------------------------------

export async function triggerDiscoveryAgent(
  inputs: CompanyDiscoveryInput[]
): Promise<DiscoveryAgentResult> {
  const result = await runDiscoveryAgent(inputs);
  revalidatePath("/prospecting");
  revalidatePath("/dashboard");
  revalidatePath("/admin/agents");
  return result;
}

export async function triggerNewsAgent(
  articles: RawArticleBatchInput[]
): Promise<NewsAgentResult> {
  const result = await runNewsAgent(articles);
  revalidatePath("/intelligence");
  revalidatePath("/prospecting");
  revalidatePath("/dashboard");
  revalidatePath("/admin/agents");
  return result;
}

export async function triggerQualificationAgent(): Promise<QualificationAgentResult> {
  const result = await runQualificationAgent();
  revalidatePath("/accounts");
  revalidatePath("/prospecting");
  revalidatePath("/dashboard");
  revalidatePath("/admin/agents");
  return result;
}

export async function triggerQueueAgent(): Promise<QueueAgentResult> {
  const result = await runQueueAgent();
  revalidatePath("/prospecting");
  revalidatePath("/dashboard");
  revalidatePath("/admin/agents");
  return result;
}
