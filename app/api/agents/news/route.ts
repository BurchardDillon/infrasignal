import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/agents/auth";
import { runNewsAgent } from "@/lib/agents/news-agent";
import type { RawArticleBatchInput } from "@/lib/types";

// ---------------------------------------------------------------------------
// POST /api/agents/news
// Accepts a JSON body: { articles: RawArticleBatchInput[] }
// Auth: CRON_SECRET (Bearer header or ?token= query param)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let articles: RawArticleBatchInput[];
  try {
    const body = await request.json();
    articles = body.articles;
    if (!Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json(
        { error: "Request body must include a non-empty 'articles' array" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const result = await runNewsAgent(articles);
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
