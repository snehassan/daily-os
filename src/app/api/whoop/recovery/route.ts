import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const WHOOP_BASE = "https://api.prod.whoop.com/developer/v2";

export async function GET(request: NextRequest) {
  let token = request.headers.get("x-whoop-token") || process.env.WHOOP_TOKEN;

  if (!token) {
    const session = await auth();
    if (session?.user?.id) {
      const account = await prisma.account.findFirst({
        where: { userId: session.user.id, provider: "whoop" },
      });
      if (account?.expires_at && account.expires_at < Math.floor(Date.now() / 1000)) {
        return Response.json({ error: "token_expired" }, { status: 401 });
      }
      token = account?.access_token ?? undefined;
    }
  }

  if (!token) {
    return Response.json({ error: "No token" }, { status: 401 });
  }

  const res = await fetch(`${WHOOP_BASE}/recovery?limit=1`, {
    headers: { Authorization: `Bearer ${token}` },
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
