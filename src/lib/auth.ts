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
      clientId: process.env.WHOOP_CLIENT_ID,
      clientSecret: process.env.WHOOP_CLIENT_SECRET,
      authorization: {
        url: "https://api.prod.whoop.com/oauth/oauth2/auth",
        params: {
          scope: "read:recovery read:sleep read:profile",
          response_type: "code",
          redirect_uri: `${process.env.AUTH_URL}/api/auth/callback/whoop`,
        },
      },
      token: {
        url: "https://api.prod.whoop.com/oauth/oauth2/token",
        conform: async (response: Response) => {
          if (response.ok) return response;
          const body = await response.text();
          console.error("[auth] Token exchange failed:", response.status, body);
          return response;
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
