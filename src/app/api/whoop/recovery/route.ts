import { NextRequest } from "next/server";

const WHOOP_BASE = "https://api.prod.whoop.com/developer/v1";

export async function GET(request: NextRequest) {
  const token = request.headers.get("x-whoop-token") || process.env.WHOOP_TOKEN;

  if (!token) {
    return Response.json({ error: "No token" }, { status: 401 });
  }

  const res = await fetch(`${WHOOP_BASE}/recovery?limit=1`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return Response.json(
      { error: `Whoop returned ${res.status}` },
      { status: res.status }
    );
  }

  const data = await res.json();
  return Response.json(data);
}
