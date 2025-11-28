import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

const handler = NextAuth(authOptions)

export async function GET(req: any, res: any) {
  try {
    return await handler(req, res)
  } catch (error: any) {
    console.error("NextAuth GET error:", error)
    return NextResponse.json(
      { error: error?.message || "Authentication error" },
      { status: 500 }
    )
  }
}

export async function POST(req: any, res: any) {
  try {
    return await handler(req, res)
  } catch (error: any) {
    console.error("NextAuth POST error:", error)
    return NextResponse.json(
      { error: error?.message || "Authentication error" },
      { status: 500 }
    )
  }
}

// Force dynamic rendering
export const dynamic = "force-dynamic"
