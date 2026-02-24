import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { getUserByEmail } from "./db/users"

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = getUserByEmail(parsed.data.email)
        if (!user) return null

        const valid = await bcrypt.compare(parsed.data.password, user.password_hash)
        if (!valid) return null

        return { id: String(user.id), name: user.name, email: user.email }
      },
    }),
  ],
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
