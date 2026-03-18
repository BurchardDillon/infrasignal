import { NextRequest } from "next/server";

/**
 * Validates the CRON_SECRET token from either:
 * - Authorization: Bearer <token> header (Vercel Cron sends this automatically)
 * - ?token=<token> query parameter (manual testing fallback)
 *
 * Fails closed: returns false if no CRON_SECRET is configured.
 */
export function verifyCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  // Check Authorization header first (Vercel Cron method)
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    if (token === secret) return true;
  }

  // Fallback to query param
  const url = new URL(request.url);
  const tokenParam = url.searchParams.get("token");
  if (tokenParam === secret) return true;

  return false;
}
