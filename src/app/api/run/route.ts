// src/app/api/run/route.ts

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { decryptText } from "@/lib/crypto"
import { estimateTokens } from "@/lib/tokenizer"
import { estimateCost } from "@/lib/pricing"
import { computeLeftPercent } from "@/lib/quota"
import { ProviderId } from "@/lib/providers"

type Selection = {
  provider: ProviderId
  model: string
}

type RunResult = {
  provider: ProviderId
  model: string
  text: string
  responseTimeMs: number
  tokensIn: number
  tokensOut: number
  totalTokens: number
  cost: number
  leftPercent: number
  error?: string
}

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as any
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const userId = session.user.id as string

  const body = (await req.json()) as {
    prompt: string
    selections: Selection[]
  }

  const { prompt, selections } = body

  if (!prompt || !selections?.length) {
    return NextResponse.json({ error: "missing" }, { status: 400 })
  }

  // unique providers for key + quota fetching
  const providers = Array.from(new Set(selections.map(s => s.provider)))

  const keys = await prisma.apiKey.findMany({
    where: { userId, provider: { in: providers } }
  })

  const keyMap = new Map<string, string>()
  keys.forEach(k => {
    keyMap.set(k.provider, decryptText(k.encryptedKey))
  })

  const now = new Date()
  const recentLogs = await prisma.usageLog.findMany({
    where: {
      userId,
      provider: { in: providers },
      timestamp: {
        gte: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30)
      }
    }
  })

  const usedByProvider: Record<string, number> = {}
  for (const log of recentLogs) {
    const key = log.provider
    if (!usedByProvider[key]) usedByProvider[key] = 0
    usedByProvider[key] += log.tokensIn + log.tokensOut
  }

  const tasks = selections.map(async sel => {
    const provider = sel.provider
    const model = sel.model.trim()
    const apiKey = keyMap.get(provider)

    if (!model) {
      return {
        provider,
        model: "",
        text: "",
        responseTimeMs: 0,
        tokensIn: 0,
        tokensOut: 0,
        totalTokens: 0,
        cost: 0,
        leftPercent: 0,
        error: "Model not selected for this provider. Please choose a model before running."
      } as RunResult
    }

    if (!apiKey) {
      return {
        provider,
        model,
        text: "",
        responseTimeMs: 0,
        tokensIn: 0,
        tokensOut: 0,
        totalTokens: 0,
        cost: 0,
        leftPercent: 0,
        error: "Missing API key for this provider."
      } as RunResult
    }

    const start = Date.now()
    let text = ""
    let tokensIn = estimateTokens(prompt)
    let tokensOut = 0

    try {
      // OPENAI
      if (provider === "openai") {
        const res = await fetch(`${process.env.OPENAI_BASE_URL}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            temperature: inferTemperature(prompt),
            max_tokens: 2048,
            stream: false
          })
        })

        if (!res.ok) {
          const errText = await safeText(res)
          throw new Error(`API error ${res.status}${errText ? " - " + errText : ""}`)
        }

        const data = await res.json()
        text = data.choices?.[0]?.message?.content ?? ""
        const usage = data.usage
        if (usage) {
          tokensIn = usage.prompt_tokens ?? tokensIn
          tokensOut = usage.completion_tokens ?? estimateTokens(text)
        } else {
          tokensOut = estimateTokens(text)
        }
      }

      // ANTHROPIC (Claude)
      else if (provider === "anthropic") {
        const res = await fetch(`${process.env.ANTHROPIC_BASE_URL}/messages`, {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model,
            max_tokens: 2048,
            temperature: inferTemperature(prompt),
            messages: [
              {
                role: "user",
                content: [{ type: "text", text: prompt }]
              }
            ]
          })
        })

        if (!res.ok) {
          const errText = await safeText(res)
          throw new Error(`API error ${res.status}${errText ? " - " + errText : ""}`)
        }

        const data = await res.json()
        const content = data.content?.[0]
        text = typeof content?.text === "string" ? content.text : ""
        const usage = data.usage
        if (usage) {
          tokensIn = usage.input_tokens ?? tokensIn
          tokensOut = usage.output_tokens ?? estimateTokens(text)
        } else {
          tokensOut = estimateTokens(text)
        }
      }

      // GEMINI
      else if (provider === "gemini") {
        const url = `${process.env.GEMINI_BASE_URL}/models/${model}:generateContent?key=${apiKey}`
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: inferTemperature(prompt),
              maxOutputTokens: 2048
            }
          })
        })

        if (!res.ok) {
          const errText = await safeText(res)
          throw new Error(`API error ${res.status}${errText ? " - " + errText : ""}`)
        }

        const data = await res.json()
        const parts = data.candidates?.[0]?.content?.parts ?? []
        text = parts.map((p: any) => p.text ?? "").join("\n")
        tokensOut = estimateTokens(text)
      }

      // PERPLEXITY
      else if (provider === "perplexity") {
        const res = await fetch(`${process.env.PERPLEXITY_BASE_URL}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }]
          })
        })

        if (!res.ok) {
          const errText = await safeText(res)
          throw new Error(`API error ${res.status}${errText ? " - " + errText : ""}`)
        }

        const data = await res.json()
        text = data.choices?.[0]?.message?.content ?? ""
        const usage = data.usage
        if (usage) {
          tokensIn = usage.prompt_tokens ?? tokensIn
          tokensOut = usage.completion_tokens ?? estimateTokens(text)
        } else {
          tokensOut = estimateTokens(text)
        }
      }
    } catch (e: any) {
      const end = Date.now()
      const totalTokens = tokensIn + tokensOut
      const cost = estimateCost(provider, tokensIn, tokensOut)
      const prior = usedByProvider[provider] ?? 0
      const newUsed = prior + totalTokens
      const leftPercent = computeLeftPercent(newUsed, provider)

      await prisma.usageLog.create({
        data: {
          userId,
          provider,
          model,
          tokensIn,
          tokensOut,
          costEstimate: cost,
          leftPercent
        }
      })

      return {
        provider,
        model,
        text: "",
        responseTimeMs: end - start,
        tokensIn,
        tokensOut,
        totalTokens,
        cost,
        leftPercent,
        error: e?.message ?? "Unknown error from provider."
      } as RunResult
    }

    const end = Date.now()
    const totalTokens = tokensIn + tokensOut
    const cost = estimateCost(provider, tokensIn, tokensOut)
    const prior = usedByProvider[provider] ?? 0
    const newUsed = prior + totalTokens
    const leftPercent = computeLeftPercent(newUsed, provider)

    await prisma.usageLog.create({
      data: {
        userId,
        provider,
        model,
        tokensIn,
        tokensOut,
        costEstimate: cost,
        leftPercent
      }
    })

    return {
      provider,
      model,
      text,
      responseTimeMs: end - start,
      tokensIn,
      tokensOut,
      totalTokens,
      cost,
      leftPercent
    } as RunResult
  })

  const results = await Promise.all(tasks)

  // fastest & cheapest per run (across (provider, model) selections)
  const successful = results.filter(r => !r.error && r.text)
  let fastestIndex: number | null = null
  let cheapestIndex: number | null = null

  if (successful.length) {
    let minTime = Infinity
    let minCost = Infinity

    results.forEach((r, idx) => {
      if (!r.error && r.text) {
        if (r.responseTimeMs < minTime) {
          minTime = r.responseTimeMs
          fastestIndex = idx
        }
        if (r.cost < minCost) {
          minCost = r.cost
          cheapestIndex = idx
        }
      }
    })
  }

  return NextResponse.json({
    results,
    fastestIndex,
    cheapestIndex
  })
}

function inferTemperature(prompt: string): number {
  const lower = prompt.toLowerCase()
  if (
    lower.includes("write code") ||
    lower.includes("bug") ||
    lower.includes("fix") ||
    lower.includes("implementation")
  ) {
    return 0.2
  }
  if (
    lower.includes("story") ||
    lower.includes("poem") ||
    lower.includes("creative") ||
    lower.includes("song")
  ) {
    return 0.8
  }
  return 0.5
}

async function safeText(res: Response): Promise<string> {
  try {
    const text = await res.text()
    if (!text) return ""
    
    // Try to parse JSON and extract error message
    try {
      const json = JSON.parse(text)
      if (json.error?.message) {
        return json.error.message
      }
      if (json.message) {
        return json.message
      }
      if (json.error) {
        return typeof json.error === "string" ? json.error : JSON.stringify(json.error)
      }
    } catch {
      // Not JSON, return text as is
    }
    
    return text.slice(0, 200)
  } catch {
    return ""
  }
}
