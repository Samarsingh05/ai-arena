export function estimateTokens(text: string): number {
  const t = text.trim()
  if (!t) return 0
  const roughWords = t.split(/\s+/).length
  return Math.round(roughWords * 1.3)
}
