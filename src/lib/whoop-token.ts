import { auth, refreshWhoopToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function getWhoopToken(headerToken?: string | null): Promise<{ token: string } | { error: string; status: number }> {
  const envToken = headerToken || process.env.WHOOP_TOKEN;
  if (envToken) return { token: envToken };

  const session = await auth();
  if (!session?.user?.id) return { error: "No token", status: 401 };

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "whoop" },
  });

  if (!account?.access_token) return { error: "No token", status: 401 };

  const expired = account.expires_at && account.expires_at < Math.floor(Date.now() / 1000);

  if (expired) {
    if (account.refresh_token) {
      const refreshed = await refreshWhoopToken(account.id, account.refresh_token);
      if (refreshed) return { token: refreshed };
    }
    return { error: "token_expired", status: 401 };
  }

  return { token: account.access_token };
}
