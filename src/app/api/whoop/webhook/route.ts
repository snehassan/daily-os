import { NextRequest } from "next/server";

const WHOOP_BASE = "https://api.prod.whoop.com/developer/v1";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, user_id, id } = body;

    if (type !== "recovery.updated") {
      return Response.json({ ok: true, skipped: type });
    }

    const token = process.env.WHOOP_TOKEN;
    if (!token) {
      return Response.json({ error: "No token configured" }, { status: 500 });
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

    // TODO: integrate with web push subscriptions stored in DB
    // For now, log and return the notification payload
    console.log(`[Daily OS] Recovery processed: ${score}% (${zone}) → ${schedule} day`);

    return Response.json({
      ok: true,
      notification: {
        title: "Daily OS — Recovery Ready",
        body: `Recovery: ${score}% (${zone}). Your ${schedule} day is loaded.`,
        score,
        zone,
        schedule,
      },
    });
  } catch (err) {
    console.error("[Daily OS] Webhook error:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ status: "webhook active" });
}
