export type ProviderId = "openai" | "openai-mini" | "anthropic" | "gemini" | "perplexity"

export type ProviderMeta = {
  id: ProviderId
  label: string
  model: string
  blurb: string
  accentClass: string
}

export const PROVIDERS: ProviderMeta[] = [
  {
    id: "openai",
    label: "OpenAI",
    model: "gpt-4o",
    blurb: "Strong reasoning, slower",
    accentClass: "border-emerald-200/30"
  },
  {
    id: "openai-mini",
    label: "OpenAI",
    model: "gpt-4o-mini",
    blurb: "Fast and lightweight",
    accentClass: "border-emerald-200/30"
  },
  {
    id: "anthropic",
    label: "Anthropic",
    model: "claude-3.5-sonnet",
    blurb: "Balanced, helpful, safe",
    accentClass: "border-emerald-200/30"
  },
  {
    id: "gemini",
    label: "Google",
    model: "gemini-1.5-pro",
    blurb: "Strong multimodal reasoning",
    accentClass: "border-emerald-200/30"
  },
  {
    id: "perplexity",
    label: "Perplexity",
    model: "sonar-medium-online",
    blurb: "Search-augmented, concise",
    accentClass: "border-emerald-200/30"
  }
]

export function getProviderMeta(id: ProviderId): ProviderMeta {
  const p = PROVIDERS.find(p => p.id === id)
  if (!p) throw new Error("Unknown provider " + id)
  return p
}
