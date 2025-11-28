import { prisma } from "./db"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import type { NextAuthOptions } from "next-auth"
import { z } from "zod"

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  mode: z.enum(["login", "signup"]).optional()
})

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {},
        password: {},
        mode: {}
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null
        const { email, password, mode = "login" } = parsed.data

        // Look up existing user
        const existingUser = await prisma.user.findUnique({ where: { email } })

        if (mode === "signup") {
          // SIGN UP FLOW
          // If user already exists -> fail (user must log in instead)
          if (existingUser) {
            return null
          }

          // Create new user with plain text password (dev only)
          const user = await prisma.user.create({
            data: { email, password }
          })
          return { id: user.id, email: user.email }
        } else {
          // LOGIN FLOW
          // If no user exists -> fail (must sign up first)
          if (!existingUser) {
            return null
          }

          // Password mismatch -> fail
          if (existingUser.password !== password) {
            return null
          }

          // OK
          return { id: existingUser.id, email: existingUser.email }
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async session({ session, token }: any) {
      if (session.user && token?.sub) {
        session.user.id = token.sub
      }
      return session
    }
  }
}
