import { NextRequest } from "next/server";
import { getWhoopToken } from "@/lib/whoop-token";

const WHOOP_BASE = "https://api.prod.whoop.com/developer/v2";

export async function GET(request: NextRequest) {
  const result = await getWhoopToken(request.headers.get("x-whoop-token"));
  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  const res = await fetch(`${WHOOP_BASE}/recovery?limit=1`, {
    headers: { Authorization: `Bearer ${result.token}` },
    cache: "no-store",
  });

  if (res.status === 401) {
    return Response.json({ error: "token_expired" }, { status: 401 });
  }

  if (!res.ok) {
    return Response.json(
      { error: `Whoop returned ${res.status}` },
      { status: res.status }
    );
  }

  const data = await res.json();
  return Response.json(data);
}
