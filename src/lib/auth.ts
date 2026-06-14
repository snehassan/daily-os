import NextAuth, { customFetch } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";

const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";

const whoopFetch: typeof fetch = async (url, init) => {
  if (url instanceof URL && url.toString() === WHOOP_TOKEN_URL || typeof url === "string" && url === WHOOP_TOKEN_URL) {
    const body = init?.body as URLSearchParams;
    body.set("client_id", process.env.WHOOP_CLIENT_ID!);
    body.set("client_secret", process.env.WHOOP_CLIENT_SECRET!);
    const headers = new Headers(init?.headers);
    headers.delete("authorization");
    return fetch(url, { ...init, headers });
  }
  return fetch(url, init);
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    {
      id: "whoop",
      name: "WHOOP",
      type: "oauth",
      checks: ["state"],
      clientId: process.env.WHOOP_CLIENT_ID,
      clientSecret: process.env.WHOOP_CLIENT_SECRET,
      [customFetch]: whoopFetch,
      authorization: {
        url: "https://api.prod.whoop.com/oauth/oauth2/auth",
        params: {
          scope: "offline read:recovery read:sleep read:profile",
        },
      },
      token: "https://api.prod.whoop.com/oauth/oauth2/token",
      userinfo: "https://api.prod.whoop.com/developer/v1/user/profile/basic",
      profile(profile) {
        return {
          id: profile.user_id.toString(),
          name: `${profile.first_name} ${profile.last_name}`,
          email: profile.email,
        };
      },
    },
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

export async function refreshWhoopToken(accountId: string, refreshToken: string) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: process.env.WHOOP_CLIENT_ID!,
    client_secret: process.env.WHOOP_CLIENT_SECRET!,
  });

  const res = await fetch(WHOOP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) return null;

  const tokens = await res.json();

  await prisma.account.update({
    where: { id: accountId },
    data: {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? refreshToken,
      expires_at: Math.floor(Date.now() / 1000) + (tokens.expires_in ?? 3600),
    },
  });

  return tokens.access_token as string;
}
