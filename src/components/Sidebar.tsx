"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { ProviderId, PROVIDERS, getProviderMeta } from "@/lib/providers"
import { loadSessions, SessionHistory as SessionHistoryType } from "@/lib/sessionHistory"

type Selection = {
  provider: ProviderId
  model: string
}

type Props = {
  selectedModels: Selection[]
  toggleModelSelection: (provider: ProviderId, model: string) => void
  usableProviders: ProviderId[]
  connectedProviders: ProviderId[]
}

// Comprehensive list of all ACTUALLY AVAILABLE models (verified API model IDs)
const ALL_MODELS: Record<ProviderId, string[]> = {
  openai: [
    // GPT-3.5 Turbo (most common, works with basic API access)
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
  "openai-mini": [],
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
    "claude-3-5-sonnet-20240620"
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
  ]
}

export function Sidebar({
  selectedModels,
  toggleModelSelection,
  usableProviders,
  connectedProviders
}: Props) {
  const [openProviders, setOpenProviders] = useState<Record<ProviderId, boolean>>({
    openai: false,
    "openai-mini": false,
    anthropic: false,
    gemini: false,
    perplexity: false
  })

  const [sessions, setSessions] = useState<SessionHistoryType[]>([])
  const [selectedSession, setSelectedSession] = useState<SessionHistoryType | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setSessions(loadSessions())
  }, [])

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!selectedSession) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [selectedSession])

  function toggleProvider(provider: ProviderId) {
    setOpenProviders(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }))
  }

  const modal =
    selectedSession && (
      <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-xl p-4 md:p-8 flex items-center justify-center">
        <div className="w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-black/90 to-emerald-950/40 border border-emerald-500/20 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col">
          <div className="flex justify-between items-start gap-4 p-6 border-b border-emerald-500/20 bg-black/40">
            <div>
              <div className="text-lg md:text-2xl font-semibold text-emerald-50">
                Session {new Date(selectedSession.createdAt).toLocaleString()}
              </div>
              <div className="text-sm text-emerald-200/80 mt-1">
                {selectedSession.runs.length} prompt{selectedSession.runs.length !== 1 ? "s" : ""}
              </div>
            </div>
            <button
              className="p-2 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
              onClick={() => setSelectedSession(null)}
              aria-label="Close session details"
            >
              <svg className="w-5 h-5 text-emerald-200" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
            {selectedSession.runs.map(run => (
              <div
                key={run.id}
                className="border border-emerald-500/20 rounded-2xl p-4 bg-black/50"
              >
                <div className="text-sm text-emerald-200/80 mb-2">
                  {new Date(run.createdAt).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                  })}
                </div>
                <div className="text-sm bg-black/70 border border-emerald-500/20 rounded-xl p-4 font-mono whitespace-pre-wrap mb-3 text-emerald-50">
                  {run.prompt}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {run.results.map(res => (
                    <div
                      key={`${res.provider}-${res.model}`}
                      className="border border-emerald-500/20 rounded-xl p-4 bg-black/40"
                    >
                      <div className="flex justify-between items-center mb-3 text-sm text-emerald-100">
                        <div className="font-semibold">
                          {getProviderMeta(res.provider as ProviderId).label} · {res.model}
                        </div>
                        <div className="text-emerald-300 font-mono text-sm">
                          ${res.metrics.cost.toFixed(4)}
                        </div>
                      </div>
                      <div className="max-h-32 overflow-auto bg-black/60 rounded-lg p-3 font-mono whitespace-pre-wrap text-xs text-emerald-50 scrollbar-thin">
                        {res.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )

  return (
    <div className="w-full lg:w-72 bg-black/92 backdrop-blur border border-emerald-200/20 lg:border-r lg:border-r-emerald-200/25 lg:h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin lg:sticky lg:top-16 flex-shrink-0 shadow-lg shadow-black/40">
      <div className="p-4 space-y-5">
        {/* Model Selection Section */}
        <div>
          <h2 className="text-[11px] font-semibold text-emerald-200 mb-2 uppercase tracking-[0.25em]">
            Select Models
          </h2>
          <div className="space-y-2">
            {PROVIDERS.filter(p => p.id !== "openai-mini").map(provider => {
              const isUsable =
                usableProviders.includes(provider.id) || connectedProviders.includes(provider.id)
              const isOpen = openProviders[provider.id]
              const models = ALL_MODELS[provider.id]
              const selectedCount = selectedModels.filter(s => s.provider === provider.id).length

              return (
                <div key={provider.id} className="border border-emerald-200/15 rounded-xl overflow-hidden bg-black/85">
                  <button
                    onClick={() => toggleProvider(provider.id)}
                    disabled={!isUsable}
                    className={`w-full px-3 py-2.5 flex items-center justify-between text-left transition-colors ${
                      isUsable
                        ? "hover:bg-black/70 text-emerald-50"
                        : "opacity-50 cursor-not-allowed text-emerald-700/70"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-emerald-100">{provider.label}</span>
                      {selectedCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full border border-emerald-300/40 text-emerald-200 text-[10px] font-medium">
                          {selectedCount}
                        </span>
                      )}
                      {!isUsable && (
                        <span className="text-[10px] text-emerald-600">(Connect key)</span>
                      )}
                    </div>
                    <svg
                      className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {isOpen && isUsable && (
                    <div className="border-t border-emerald-200/10 bg-black/85 max-h-60 overflow-y-auto scrollbar-thin">
                      <div className="p-2 space-y-1">
                        {models.map(model => {
                          const checked = selectedModels.some(
                            s => s.provider === provider.id && s.model === model
                          )
                          return (
                            <label
                              key={model}
                              className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors text-[12px] ${
                                checked
                                  ? "border border-emerald-300/40 text-emerald-200 bg-black/70"
                                  : "hover:bg-black/70 text-emerald-100"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleModelSelection(provider.id, model)}
                                className="h-3.5 w-3.5 accent-emerald-400"
                              />
                              <span className="font-mono text-xs text-emerald-50">{model}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Session History Section */}
        <div>
          <h2 className="text-[11px] font-semibold text-emerald-200 mb-2 uppercase tracking-[0.25em]">
            Session History
          </h2>
          <div className="space-y-1.5">
            {sessions.length === 0 ? (
              <div className="text-[12px] text-emerald-600 px-2">No previous sessions</div>
            ) : (
              sessions
                .slice()
                .reverse()
                .slice(0, 10)
                .map(session => (
                  <button
                    key={session.id}
                    onClick={() => setSelectedSession(session)}
                    className="w-full text-left px-3 py-2 rounded-xl border border-emerald-200/20 hover:border-emerald-200/40 hover:bg-black/70 transition-colors text-[12px]"
                  >
                    <div className="text-[12px] text-emerald-100 font-medium">
                      {new Date(session.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </div>
                    <div className="text-[11px] text-emerald-300/70 mt-0.5">
                      {session.runs.length} prompt{session.runs.length !== 1 ? "s" : ""}
                    </div>
                  </button>
                ))
            )}
          </div>
        </div>
      </div>

      {isClient && selectedSession && createPortal(modal, document.body)}
    </div>
  )
}

