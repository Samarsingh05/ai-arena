import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as any
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { provider, apiKey } = body

  if (!provider || !apiKey) {
    return NextResponse.json({ error: "missing" }, { status: 400 })
  }

  try {
    // ✅ OpenAI
    if (provider === "openai" || provider === "openai-mini") {
      const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
      const res = await fetch(`${baseUrl}/models`, {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` }
      })

      if (res.status === 401 || res.status === 403) {
        return NextResponse.json({ status: "invalid" })
      }

      if (!res.ok) throw new Error("bad")
    }

    // ✅ Anthropic / Claude
    else if (provider === "anthropic") {
      const baseUrl = process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com/v1"
      const res = await fetch(`${baseUrl}/models`, {
        method: "GET",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
        }
      })

      if (res.status === 401 || res.status === 403) {
        return NextResponse.json({ status: "invalid" })
      }

      if (!res.ok) throw new Error("bad")
    }

    // ✅ Gemini
    else if (provider === "gemini") {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: "ping" }] }]
          })
        }
      )

      const text = await res.text()

      if (
        res.status === 401 ||
        res.status === 403 ||
        text.includes("billing") ||
        text.includes("quota")
      ) {
        return NextResponse.json({ status: "payment_required" })
      }

      if (!res.ok) {
        return NextResponse.json({ status: "invalid" })
      }
    }

    // ✅ Perplexity
    else if (provider === "perplexity") {
      const baseUrl = process.env.PERPLEXITY_BASE_URL || "https://api.perplexity.ai"
      const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "sonar-small-online",
      messages: [{ role: "user", content: "ping" }]
    })
  })

  const json = await res.json().catch(() => null)
  const raw = JSON.stringify(json ?? {})

  // Billing or quota problem
  if (
    res.status === 401 ||
    res.status === 403 ||
    raw.toLowerCase().includes("billing") ||
    raw.toLowerCase().includes("credit") ||
    raw.toLowerCase().includes("insufficient") ||
    raw.toLowerCase().includes("quota")
  ) {
    return NextResponse.json({ status: "payment_required" })
  }

  // Invalid key
  if (!res.ok || json?.error) {
    return NextResponse.json({ status: "invalid" })
  }
}

    // ✅ Everything OK
    return NextResponse.json({ status: "connected" })
  } catch {
    return NextResponse.json({ status: "invalid" }, { status: 400 })
  }
}
