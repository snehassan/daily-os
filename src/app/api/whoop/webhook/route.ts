import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";

const WHOOP_BASE = "https://api.prod.whoop.com/developer/v1";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, user_id } = body;

    if (type !== "recovery.updated") {
      return Response.json({ ok: true, skipped: type });
    }

    const user = await prisma.user.findFirst({
      where: { whoopId: String(user_id) },
      include: { accounts: true },
    });

    if (!user) {
      return Response.json({ ok: true, message: "User not found" });
    }

    const whoopAccount = user.accounts.find((a) => a.provider === "whoop");
    const token = whoopAccount?.access_token;

    if (!token) {
      return Response.json({ ok: true, message: "No token for user" });
    }

    const recoveryRes = await fetch(`${WHOOP_BASE}/recovery?limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!recoveryRes.ok) {
      return Response.json({ error: "Failed to fetch recovery" }, { status: 502 });
    }

    const data = await recoveryRes.json();
    const recovery = data.records?.[0];

    if (!recovery?.score) {
      return Response.json({ ok: true, message: "No score yet" });
    }

    const score = recovery.score.recovery_score;
    const zone = score >= 67 ? "green" : score >= 34 ? "yellow" : "red";
    const schedule = score < 34 ? "Low Energy" : "Standard";

    const result = await sendPushToUser(user.id, {
      title: "Daily OS — Recovery Ready",
      body: `Recovery: ${score}% (${zone}). Your ${schedule} day is loaded.`,
      url: "/",
    });

    return Response.json({ ok: true, score, zone, push: result });
  } catch (err) {
    console.error("[Daily OS] Webhook error:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ status: "webhook active" });
}
