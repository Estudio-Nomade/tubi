import { NextResponse } from "next/server";

import { createServiceClient } from "@/lib/supabase/service";

/**
 * Expire stale seat requests and unpaid accepted holds.
 * Auth: Authorization Bearer $CRON_SECRET or x-cron-secret.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization") ?? "";
  const headerSecret = request.headers.get("x-cron-secret") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (bearer !== secret && headerSecret !== secret) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const client = createServiceClient();
    const { data, error } = await client.rpc("vencer_solicitudes");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, result: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "vencer failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
