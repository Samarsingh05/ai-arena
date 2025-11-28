import { ProviderId } from "./providers"

type Pricing = {
  inputPer1K: number
  outputPer1K: number
}

const PRICING: Record<ProviderId, Pricing> = {
  openai: { inputPer1K: 0.005, outputPer1K: 0.015 },
  "openai-mini": { inputPer1K: 0.00015, outputPer1K: 0.0006 },
  anthropic: { inputPer1K: 0.003, outputPer1K: 0.015 },
  gemini: { inputPer1K: 0.00125, outputPer1K: 0.00375 },
  perplexity: { inputPer1K: 0.001, outputPer1K: 0.001 }
}

export function estimateCost(provider: ProviderId, tokensIn: number, tokensOut: number): number {
  const p = PRICING[provider]
  const costIn = (tokensIn / 1000) * p.inputPer1K
  const costOut = (tokensOut / 1000) * p.outputPer1K
  return parseFloat((costIn + costOut).toFixed(6))
}
