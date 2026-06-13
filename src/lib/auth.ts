import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: true,
  adapter: PrismaAdapter(prisma),
  providers: [
    {
      id: "whoop",
      name: "WHOOP",
      type: "oauth",
      checks: ["state"],
      clientId: process.env.WHOOP_CLIENT_ID,
      clientSecret: process.env.WHOOP_CLIENT_SECRET,
      authorization: {
        url: "https://api.prod.whoop.com/oauth/oauth2/auth",
        params: {
          scope: "read:recovery read:sleep read:profile",
        },
      },
      token: {
        url: "https://api.prod.whoop.com/oauth/oauth2/token",
        async request({ params, provider }: { params: Record<string, string>; provider: { callbackUrl: string } }) {
          const res = await fetch(
            "https://api.prod.whoop.com/oauth/oauth2/token",
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                grant_type: "authorization_code",
                code: params.code as string,
                redirect_uri: provider.callbackUrl,
                client_id: process.env.WHOOP_CLIENT_ID!,
                client_secret: process.env.WHOOP_CLIENT_SECRET!,
              }),
            }
          );

          if (!res.ok) {
            const text = await res.text();
            console.error("[auth] Token exchange failed:", res.status, text);
            throw new Error(`Token exchange failed: ${res.status}`);
          }

          return { tokens: await res.json() };
        },
      },
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
