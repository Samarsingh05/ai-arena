export type RunMetrics = {
  provider: string
  model: string
  responseTimeMs: number
  tokensIn: number
  tokensOut: number
  totalTokens: number
  cost: number
  leftPercent: number
}

export type RunResult = {
  provider: string
  model: string
  text: string
  metrics: RunMetrics
}

export type PromptRun = {
  id: string
  prompt: string
  createdAt: string
  results: RunResult[]
}

export type SessionHistory = {
  id: string
  createdAt: string
  runs: PromptRun[]
}

const STORAGE_KEY = "ai-arena-sessions"
const MAX_SESSIONS = 20

export function loadSessions(): SessionHistory[] {
  if (typeof window === "undefined") return []
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function saveSession(session: SessionHistory) {
  if (typeof window === "undefined") return
  const existing = loadSessions()
  const all = [...existing, session]
  while (all.length > MAX_SESSIONS) {
    all.shift()
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}
