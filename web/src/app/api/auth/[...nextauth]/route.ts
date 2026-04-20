import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { loginApi } from "@/lib/api";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const { user, token } = await loginApi(
            credentials.email,
            credentials.password
          );
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatar,
            accessToken: token,
            plan: user.plan,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as { accessToken?: string }).accessToken;
        token.plan = (user as { plan?: string }).plan;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken as string;
        if (session.user) {
          session.user.plan = token.plan as string;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/dang-nhap",
    error: "/dang-nhap",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
