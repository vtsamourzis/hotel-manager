/**
 * Edge-compatible Auth.js config.
 * Used ONLY by middleware — no Node.js modules (no better-sqlite3, no path, no fs).
 * The credentials provider (which needs SQLite) is excluded here.
 * JWT decode/verify works entirely in the Edge runtime using jose.
 */
import NextAuth from "next-auth"

export const { auth } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [], // No providers needed — middleware only checks session validity
  callbacks: {
    jwt({ token, user }) {
      if (user) token.userId = user.id
      return token
    },
    session({ session, token }) {
      if (token.userId) session.user.id = token.userId as string
      return session
    },
  },
})
