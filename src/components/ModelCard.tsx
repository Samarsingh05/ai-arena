// src/components/ModelCard.tsx

"use client"

import { useState } from "react"
import { ProviderMeta } from "@/lib/providers"
import { MetricsBlock } from "./MetricsBlock"
import { QuotaChart } from "./QuotaChart"

type QuotaPoint = {
  timestamp: string
  leftPercent: number
  tokens: number
}

type Props = {
  meta: ProviderMeta
  modelName?: string
  responseText: string
  loading: boolean
  error?: string
  metrics?: {
    responseTimeMs: number
    startTime?: number
    endTime?: number
    tokensIn: number
    tokensOut: number
    cost: number
    leftPercent: number
  }
  quotaHistory: QuotaPoint[]
  fastest: boolean
  cheapest: boolean
}

function explainError(error?: string | null): string | null {
  if (!error) return null
  
  // Extract error code if present
  const match = error.match(/(\d{3})/)
  const code = match ? Number(match[1]) : null

  // Remove "API error XXX -" prefix
  let plainMessage = error.replace(/^API error \d{3}\s*-\s*/i, "")
  
  // Try to extract JSON error message - handle multiple JSON formats
  try {
    // Try to find and parse JSON object
    const jsonMatch = plainMessage.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const json = JSON.parse(jsonMatch[0])
      
      // Extract message from various JSON error formats
      if (json.error?.message) {
        plainMessage = json.error.message
      } else if (json.message) {
        plainMessage = json.message
      } else if (json.error) {
        if (typeof json.error === "string") {
          plainMessage = json.error
        } else if (json.error.type && json.error.message) {
          plainMessage = json.error.message
        }
      }
    }
  } catch {
    // Not JSON or parse failed, continue with plain message
  }
  
  // Remove HTML tags if present
  plainMessage = plainMessage.replace(/<[^>]*>/g, "")
  
  // Remove backticks and code formatting
  plainMessage = plainMessage.replace(/`/g, "")
  
  // Clean up whitespace and newlines
  plainMessage = plainMessage.replace(/\s+/g, " ").trim()
  
  // Provide user-friendly messages based on error code
  if (code === 429) {
    return "Rate limit exceeded. Please wait before trying again."
  }
  if (code === 401 || code === 403) {
    return "Authentication failed. The API key may be invalid, expired, or missing billing."
  }
  if (code === 400) {
    // If we have a specific message, use it; otherwise generic
    if (plainMessage && plainMessage.length > 0 && !plainMessage.includes("{")) {
      return plainMessage
    }
    return "Bad request. The model ID may be incorrect or the input format was rejected."
  }
  if (code === 404) {
    if (plainMessage && plainMessage.length > 0 && !plainMessage.includes("{")) {
      return plainMessage
    }
    return "Model not found. This model may not exist or you may not have access to it."
  }
  if (code && code >= 500) {
    return "The provider's API is experiencing issues. Please try again later."
  }
  
  // Return cleaned plain message (without JSON) or default
  if (plainMessage && plainMessage.length > 0 && !plainMessage.includes("{") && !plainMessage.includes("}")) {
    return plainMessage
  }
  
  return "An error occurred. Please check your API key and model settings."
}

export function ModelCard({
  meta,
  modelName,
  responseText,
  loading,
  error,
  metrics,
  quotaHistory,
  fastest,
  cheapest
}: Props) {
  const errorHint = explainError(error)

  return (
    <div
      className={`bg-black/90 border ${meta.accentClass} rounded-2xl p-4 flex flex-col gap-3 shadow-xl shadow-black/40`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-sm font-semibold text-emerald-50">{meta.label}</div>
          {modelName && (
            <div className="text-[11px] text-emerald-300/80 font-mono mb-0.5">{modelName}</div>
          )}
          <div className="text-[11px] text-emerald-300/70">{meta.blurb}</div>
        </div>
        <div className="h-8 w-8 rounded-full border border-emerald-200/30 bg-black/70" />
      </div>

      {/* Response */}
      <div className="relative flex-1 flex flex-col">
        <div className="text-[11px] font-semibold text-emerald-200/80 mb-1 uppercase tracking-[0.25em]">Response</div>
        <div className="relative flex-1">
          <div className="rounded-xl bg-black/85 border border-emerald-200/20 p-3 h-56 overflow-auto scrollbar-thin text-[12px] font-mono whitespace-pre-wrap leading-relaxed text-emerald-50">
            {loading && !responseText && !error && (
              <div className="flex items-center gap-3 text-emerald-200">
                <div className="animate-pulse h-2 w-2 rounded-full bg-emerald-300" />
                <span>Thinking...</span>
              </div>
            )}

            {!loading && error && <div className="text-rose-300 font-semibold">{errorHint || "An error occurred"}</div>}

            {!loading && !error && responseText && (
              <div className="animate-fade-in">
                {responseText}
              </div>
            )}

            {!loading && !error && !responseText && (
              <span className="text-emerald-300/60">Waiting for response...</span>
            )}
          </div>
        </div>
      </div>

      {/* Metrics */}
      {metrics && (
        <MetricsBlock
          responseTimeMs={metrics.responseTimeMs}
          startTime={metrics.startTime}
          endTime={metrics.endTime}
          tokensIn={metrics.tokensIn}
          tokensOut={metrics.tokensOut}
          cost={metrics.cost}
          leftPercent={metrics.leftPercent}
          fastest={fastest}
          cheapest={cheapest}
        />
      )}

      {/* Quota history line chart (per provider) */}
      <QuotaChart data={quotaHistory} />

      {/* Fastest/Cheapest badges */}
      {(fastest || cheapest) && (
        <div className="pt-3 border-t border-emerald-200/20 flex gap-2 justify-center text-[11px]">
          {fastest && (
            <span className="px-3 py-1 rounded-full border border-lime-300/40 text-lime-100 font-semibold">
              ⚡ Fastest
            </span>
          )}
          {cheapest && (
            <span className="px-3 py-1 rounded-full border border-emerald-300/40 text-emerald-100 font-semibold">
              💸 Cheapest
            </span>
          )}
        </div>
      )}
    </div>
  )
}
