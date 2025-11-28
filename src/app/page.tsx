// src/app/page.tsx

"use client"

import { useEffect, useMemo, useState } from "react"
import { Navbar } from "@/components/Navbar"
import { AuthGate } from "@/components/AuthGate"
import { PromptBar } from "@/components/PromptBar"
import { ModelCard } from "@/components/ModelCard"
import { ApiKeysPanel } from "@/components/ApiKeysPanel"
import { Sidebar } from "@/components/Sidebar"
import {
  ProviderId,
  getProviderMeta,
  PROVIDERS
} from "@/lib/providers"
import {
  saveSession,
  SessionHistory as SessionHistoryType,
  PromptRun,
  RunResult
} from "@/lib/sessionHistory"

type KeyStatus = {
  id: string
  provider: ProviderId
  status: string
}

type ApiRunResult = {
  provider: ProviderId
  model: string
  text: string
  responseTimeMs: number
  startTime: number
  endTime: number
  tokensIn: number
  tokensOut: number
  totalTokens: number
  cost: number
  leftPercent: number
  error?: string
}

// All ACTUALLY AVAILABLE models per provider (verified API model IDs only)
const MODEL_OPTIONS: Record<ProviderId, string[]> = {
    openai: [
      // GPT-3.5 Turbo (works with basic API access)
      "gpt-3.5-turbo",
      "gpt-3.5-turbo-0125",
      "gpt-3.5-turbo-1106",
      "gpt-3.5-turbo-16k",
      "gpt-3.5-turbo-0613",
      // GPT-4 (requires paid API access)
      "gpt-4",
      "gpt-4-0613",
      "gpt-4-32k",
      "gpt-4-32k-0613",
      // GPT-4 Turbo
      "gpt-4-turbo",
      "gpt-4-turbo-2024-04-09",
      "gpt-4-turbo-preview",
      "gpt-4-0125-preview",
      "gpt-4-1106-preview",
      // GPT-4o (latest, requires paid API access)
      "gpt-4o",
      "gpt-4o-2024-08-06",
      "gpt-4o-2024-05-13",
      "gpt-4o-mini",
      "gpt-4o-mini-2024-07-18"
    ],
    anthropic: [
      // Claude Instant (basic tier)
      "claude-instant-1.2",
      // Claude 2 (requires paid access)
      "claude-2.0",
      "claude-2.1",
      // Claude 3 (requires paid access)
      "claude-3-haiku-20240307",
      "claude-3-sonnet-20240229",
      "claude-3-opus-20240229",
      // Claude 3.5 (latest, requires paid access)
      "claude-3-5-haiku-20241022",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-sonnet-20240620",
    ],
    gemini: [
      // Gemini 1.0 Pro
      "gemini-pro",
      "gemini-pro-vision",
      "gemini-1.0-pro",
      "gemini-1.0-pro-latest",
      // Gemini 1.5
      "gemini-1.5-pro",
      "gemini-1.5-pro-latest",
      "gemini-1.5-flash",
      "gemini-1.5-flash-latest",
      // Gemini 2.0
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-2.0-flash-live",
      "gemini-2.0-flash-exp",
      // Gemini 2.5
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.5-flash-live",
      "gemini-2.5-flash-tts",
      "gemini-2.5-flash-native-audio-dialog",
      "gemini-2.5-pro",
      // Gemini 3.0
      "gemini-3-pro",
      // Gemini Robotics
      "gemini-robotics-er-1.5-preview",
      // Gemma models
      "gemma-3-1b",
      "gemma-3-2b",
      "gemma-3-4b",
      "gemma-3-12b",
      "gemma-3-27b",
      // LearnLM
      "learnlm-2.0-flash-experimental"
    ],
    perplexity: [
      // Sonar Online models (real-time search)
      "sonar-small-online",
      "sonar-medium-online",
      "sonar-large-online",
      // Sonar Chat models (conversational)
      "sonar-small-chat",
      "sonar-medium-chat",
      "sonar-large-chat",
      // Llama-based Sonar models
      "llama-3.1-sonar-small-32k-online",
      "llama-3.1-sonar-small-32k-chat",
      "llama-3.1-sonar-large-32k-online",
      "llama-3.1-sonar-large-32k-chat"
    ],
    "openai-mini": []
}

type Selection = {
  provider: ProviderId
  model: string
}

type QuotaPoint = {
  timestamp: string
  leftPercent: number
  tokens: number
}

type QuotaHistoryMap = Partial<Record<ProviderId, QuotaPoint[]>>

export default function Page() {
  const [step, setStep] = useState<"setup" | "arena">("setup")

  const [prompt, setPrompt] = useState("")
  const [keyStatuses, setKeyStatuses] = useState<KeyStatus[]>([])
  const [loadingKeys, setLoadingKeys] = useState(false)

  const [selectedModels, setSelectedModels] = useState<Selection[]>([])
  const [runLoading, setRunLoading] = useState(false)

  const [results, setResults] = useState<ApiRunResult[]>([])

  const [quotaHistory, setQuotaHistory] = useState<QuotaHistoryMap>({})

  const [fastestIndex, setFastestIndex] = useState<number | null>(null)
  const [cheapestIndex, setCheapestIndex] = useState<number | null>(null)

  const [billingRequiredProviders, setBillingRequiredProviders] = useState<ProviderId[]>([])

  async function refreshKeys() {
    setLoadingKeys(true)
    try {
      const res = await fetch("/api/keys")
      if (!res.ok) {
        setKeyStatuses([])
        setBillingRequiredProviders([])
        return
      }
      const data = (await res.json()) as KeyStatus[]
      setKeyStatuses(data)

      const billing = data.filter(k => k.status === "payment_required").map(k => k.provider)
      setBillingRequiredProviders(billing)
    } finally {
      setLoadingKeys(false)
    }
  }

  useEffect(() => {
    refreshKeys()
  }, [])

  const connectedProviders = useMemo(
    () => keyStatuses.filter(k => k.status === "connected").map(k => k.provider),
    [keyStatuses]
  )

  const usableProviders = useMemo(
    () =>
      keyStatuses
        .filter(k => k.status === "connected" || k.status === "payment_required")
        .map(k => k.provider),
    [keyStatuses]
  )

  function toggleModelSelection(provider: ProviderId, model: string) {
    const key = `${provider}::${model}`
    const exists = selectedModels.some(
      s => s.provider === provider && s.model === model
    )
    if (exists) {
      setSelectedModels(selectedModels.filter(s => `${s.provider}::${s.model}` !== key))
    } else {
      setSelectedModels([...selectedModels, { provider, model }])
    }
  }

  async function handleRun() {
    if (!prompt.trim() || !selectedModels.length || runLoading) return

    const estimatedCost = 0.02 * selectedModels.length
    if (estimatedCost > 0.1) {
      const ok = window.confirm(
        `Estimated total cost could exceed $${estimatedCost.toFixed(2)}. Do you still want to run these models?`
      )
      if (!ok) return
    }

    setRunLoading(true)
    const timestamp = new Date().toISOString()
    
    // Initialize results array with empty states
    const initialResults: ApiRunResult[] = selectedModels.map(sel => ({
      provider: sel.provider,
      model: sel.model,
      text: "",
      responseTimeMs: 0,
      startTime: Date.now(),
      endTime: 0,
      tokensIn: 0,
      tokensOut: 0,
      totalTokens: 0,
      cost: 0,
      leftPercent: 100
    }))
    setResults(initialResults)

    try {
      // Run all models in parallel and update as they complete
      const promises = selectedModels.map(async (sel, idx) => {
        const startTime = Date.now()
        try {
          const res = await fetch("/api/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt,
              selections: [sel]
            })
          })

          const data = await res.json()
          const result = data.results?.[0] as ApiRunResult | undefined
          const endTime = Date.now()
          
          if (result) {
            // Update this specific result as it comes in
            setResults(prev => {
              const newResults = [...prev]
              newResults[idx] = {
                ...result,
                startTime,
                endTime
              }
              return newResults
            })
            return { idx, result: { ...result, startTime, endTime } }
          }
        } catch (error) {
          const endTime = Date.now()
          setResults(prev => {
            const newResults = [...prev]
            newResults[idx] = {
              ...newResults[idx],
              text: "",
              error: "Network error occurred",
              endTime
            }
            return newResults
          })
        }
        return { idx, result: null }
      })

      const completed = await Promise.all(promises)
      
      // Wait for all to complete, then calculate fastest/cheapest
      await Promise.all(promises)
      
      // Use a callback to get the latest state
      setTimeout(() => {
        setResults(currentResults => {
          const successful = currentResults.filter(r => !r.error && r.text)
          
          if (successful.length > 0) {
            let minTime = Infinity
            let minCost = Infinity
            let fastestIdx: number | null = null
            let cheapestIdx: number | null = null

            currentResults.forEach((r, idx) => {
              if (!r.error && r.text) {
                if (r.responseTimeMs < minTime) {
                  minTime = r.responseTimeMs
                  fastestIdx = idx
                }
                if (r.cost < minCost) {
                  minCost = r.cost
                  cheapestIdx = idx
                }
              }
            })

            setFastestIndex(fastestIdx)
            setCheapestIndex(cheapestIdx)
          }

          // Update quota history
          const newHistory: QuotaHistoryMap = { ...quotaHistory }
          currentResults.forEach(item => {
            if (item.totalTokens > 0) {
              const key = item.provider
              const arr = newHistory[key] ?? []
              newHistory[key] = [
                ...arr,
                {
                  timestamp,
                  leftPercent: item.leftPercent,
                  tokens: item.totalTokens
                }
              ]
            }
          })
          setQuotaHistory(newHistory)

          // Save to session history
          const runId = crypto.randomUUID()
          const promptRun: PromptRun = {
            id: runId,
            prompt,
            createdAt: timestamp,
            results: currentResults.map(item => ({
              provider: item.provider,
              model: item.model,
              text: item.text,
              metrics: {
                provider: item.provider,
                model: item.model,
                responseTimeMs: item.responseTimeMs,
                tokensIn: item.tokensIn,
                tokensOut: item.tokensOut,
                totalTokens: item.totalTokens,
                cost: item.cost,
                leftPercent: item.leftPercent
              }
            })) as RunResult[]
          }

          const session: SessionHistoryType = {
            id: crypto.randomUUID(),
            createdAt: timestamp,
            runs: [promptRun]
          }

          saveSession(session)
          
          return currentResults
        })
      }, 1000)
    } finally {
      setRunLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <AuthGate>
        <main className="min-h-[calc(100vh-4rem)]">
          {/* STEP 1: Connect API keys */}
          {step === "setup" && (
            <div className="max-w-5xl mx-auto px-5 py-6 space-y-4">
              <section className="space-y-3 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[14px] text-emerald-50 font-semibold mb-1">
                      Connect your API keys
                    </div>
                    <div className="text-[12px] text-emerald-300/80">
                      Connect and validate API keys for any AI tools you want to use. You&apos;ll choose
                      models and run prompts on the next screen.
                    </div>
                  </div>
                  {loadingKeys && (
                    <div className="text-[12px] text-emerald-400">
                      Loading provider status...
                    </div>
                  )}
                </div>

                <ApiKeysPanel keyStatuses={keyStatuses} refreshKeys={refreshKeys} />

                <div className="mt-3 flex justify-end sticky bottom-4 bg-black/85 border border-emerald-200/30 rounded-xl px-4 py-2 shadow-lg shadow-black/40">
                  <button
                    onClick={() => setStep("arena")}
                    disabled={usableProviders.length === 0}
                    className="px-5 py-2 rounded-lg text-[13px] font-semibold border border-emerald-200/40 text-emerald-100 hover:bg-black/70 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Continue to prompt & models →
                  </button>
                </div>
              </section>
            </div>
          )}

          {/* STEP 2: Sidebar + Main comparison area */}
          {step === "arena" && (
            <div className="flex flex-col lg:flex-row">
              {/* Left Sidebar */}
              <Sidebar
                selectedModels={selectedModels}
                toggleModelSelection={toggleModelSelection}
                usableProviders={usableProviders}
                connectedProviders={connectedProviders}
              />

              {/* Main Content Area */}
              <div className="flex-1 px-4 sm:px-6 lg:px-8 py-5 space-y-5 bg-gradient-to-br from-[#030403] via-[#040705] to-[#020302] min-h-screen">
                {/* Header */}
                <div className="flex flex-wrap gap-3 items-center justify-between">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-emerald-100 mb-1">
                      AI Model Comparison
                    </h1>
                    <p className="text-[12px] sm:text-[13px] text-emerald-300/80 max-w-xl">
                      Compare multiple providers in one place. Pick a calmer palette, keep everything aligned, and get metrics that scale to every device.
                    </p>
                  </div>
                  <button
                    onClick={() => setStep("setup")}
                    className="px-4 py-1.5 rounded-lg text-[12px] font-medium border border-emerald-200/30 hover:border-emerald-100/60 hover:bg-black/70 transition-colors text-emerald-100"
                  >
                    ← API Keys
                  </button>
                </div>

                {/* Prompt input */}
                <div className="space-y-3">
                  <PromptBar
                    prompt={prompt}
                    setPrompt={setPrompt}
                    onRun={handleRun}
                    disabled={runLoading || !selectedModels.length}
                  />
                  
                  {/* Note below prompt */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[12px] text-emerald-300/75">
                      💡 Select one or more models from the sidebar to enable the run button.
                    </p>
                    <button
                      onClick={handleRun}
                      disabled={!prompt.trim() || !selectedModels.length || runLoading}
                      className="px-5 py-2 rounded-xl text-[12px] font-semibold border border-emerald-200/40 text-emerald-100 hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {runLoading ? "Running..." : `Run ${selectedModels.length} Model${selectedModels.length !== 1 ? "s" : ""}`}
                    </button>
                  </div>
                </div>

                {/* Results Section */}
                <section>
                  {selectedModels.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 border border-dashed border-emerald-200/30 rounded-2xl bg-black/70">
                      <div className="text-emerald-300/80 text-[13px] mb-1">
                        No models selected
                      </div>
                      <div className="text-[11px] text-emerald-300/60">
                        Select models from the left sidebar to start comparing
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2 items-center justify-between">
                        <h2 className="text-[14px] font-semibold text-emerald-100">Comparison Results</h2>
                        <div className="text-[12px] text-emerald-300/75">
                          {selectedModels.length} model{selectedModels.length !== 1 ? "s" : ""} selected
                        </div>
                      </div>
                      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {results.map((r, idx) => {
                          const meta = getProviderMeta(r.provider)
                          const loading = runLoading && !r.text && !r.error && r.startTime > 0
                          return (
                            <ModelCard
                              key={`${r.provider}-${r.model}-${idx}`}
                              meta={meta}
                              modelName={r.model}
                              responseText={r.text ?? ""}
                              loading={loading}
                              error={r.error}
                              metrics={
                                r.text || r.error
                                  ? {
                                      responseTimeMs: r.responseTimeMs,
                                      startTime: r.startTime,
                                      endTime: r.endTime,
                                      tokensIn: r.tokensIn,
                                      tokensOut: r.tokensOut,
                                      cost: r.cost,
                                      leftPercent: r.leftPercent
                                    }
                                  : undefined
                              }
                              quotaHistory={quotaHistory[r.provider] ?? []}
                              fastest={fastestIndex === idx}
                              cheapest={cheapestIndex === idx}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}
        </main>
      </AuthGate>
    </>
  )
}
