import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { encryptText } from "@/lib/crypto"

export async function GET() {
  const session = (await getServerSession(authOptions)) as any
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const keys = await prisma.apiKey.findMany({
    where: { userId: session.user.id }
  })
  return NextResponse.json(
    keys.map(k => ({
      id: k.id,
      provider: k.provider,
      status: k.status
    }))
  )
}

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as any
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const body = await req.json()
  const { provider, apiKey, status } = body
  if (!provider) return NextResponse.json({ error: "missing" }, { status: 400 })

  const existing = await prisma.apiKey.findFirst({
    where: { userId: session.user.id, provider }
  })

  if (apiKey === "") {
    if (existing) {
      await prisma.apiKey.delete({ where: { id: existing.id } })
    }
    return NextResponse.json({ ok: true, deleted: true })
  }

  if (!apiKey) return NextResponse.json({ error: "missing-api-key" }, { status: 400 })

  const encryptedKey = encryptText(apiKey)

  if (existing) {
    await prisma.apiKey.update({
      where: { id: existing.id },
      data: { encryptedKey, status: status ?? "connected" }
    })
  } else {
    await prisma.apiKey.create({
      data: {
        userId: session.user.id,
        provider,
        encryptedKey,
        status: status ?? "connected"
      }
    })
  }

  return NextResponse.json({ ok: true })
}
