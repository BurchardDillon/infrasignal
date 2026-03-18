import { NextRequest, NextResponse } from "next/server";
import { resolvePN } from "@/lib/engine/pn-resolver";
import { matchAccountsForComponent } from "@/lib/engine/pn-matcher";
import { investigateAccounts } from "@/lib/engine/pn-web-intel";
import type { PnLookupResponse, PnLookupResponseWithWebIntel } from "@/lib/types/pn-lookup";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const { part_number, web } = await req.json();
    if (!part_number || typeof part_number !== "string") {
      return NextResponse.json(
        { error: "part_number is required" },
        { status: 400 }
      );
    }

    const { component, resolved_by } = await resolvePN(part_number);

    if (!component) {
      return NextResponse.json({
        component: null,
        matches: [],
        resolved_by,
        total_accounts_searched: 0,
        message:
          "Could not resolve this part number. You can add it manually in Admin > Components.",
      } satisfies PnLookupResponse);
    }

    const matches = await matchAccountsForComponent(component);

    // If web investigation requested, stream progress events via SSE
    if (web) {
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        async start(controller) {
          try {
            const { updatedMatches, intel } = await investigateAccounts(
              component,
              matches,
              (progress) => {
                // Stream progress event as newline-delimited JSON
                const event = JSON.stringify({
                  type: "progress" as const,
                  account: progress.account,
                  status: progress.status,
                  score: progress.score,
                  total: progress.total,
                  completed: progress.completed,
                });
                controller.enqueue(encoder.encode(event + "\n"));
              }
            );

            // Stream complete event
            const completeEvent = JSON.stringify({
              type: "complete" as const,
              result: {
                component,
                matches: updatedMatches,
                resolved_by,
                total_accounts_searched: matches.length,
                web_intel: intel,
              } satisfies PnLookupResponseWithWebIntel,
            });
            controller.enqueue(encoder.encode(completeEvent + "\n"));
            controller.close();
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Investigation failed";
            const errorEvent = JSON.stringify({
              type: "complete" as const,
              result: {
                component,
                matches,
                resolved_by,
                total_accounts_searched: matches.length,
                message: `Web investigation failed: ${message}`,
              } satisfies PnLookupResponse,
            });
            controller.enqueue(encoder.encode(errorEvent + "\n"));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-web response: standard JSON
    return NextResponse.json({
      component,
      matches,
      resolved_by,
      total_accounts_searched: matches.length,
    } satisfies PnLookupResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
