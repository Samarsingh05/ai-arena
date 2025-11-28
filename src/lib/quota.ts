import { ProviderId } from "./providers"

type QuotaConfig = {
  limitTokens: number
  window: "daily" | "monthly"
}

const QUOTA_CONFIG: Record<ProviderId, QuotaConfig> = {
  openai: { limitTokens: 1_000_000, window: "monthly" },
  "openai-mini": { limitTokens: 2_000_000, window: "monthly" },
  anthropic: { limitTokens: 1_000_000, window: "monthly" },
  gemini: { limitTokens: 1_000_000, window: "monthly" },
  perplexity: { limitTokens: 500_000, window: "monthly" }
}

export function getQuotaConfig(provider: ProviderId): QuotaConfig {
  return QUOTA_CONFIG[provider]
}

export function computeLeftPercent(usedTokens: number, provider: ProviderId): number {
  const cfg = getQuotaConfig(provider)
  const left = Math.max(0, cfg.limitTokens - usedTokens)
  return parseFloat(((left / cfg.limitTokens) * 100).toFixed(2))
}
