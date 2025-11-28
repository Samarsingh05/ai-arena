type Props = {
  responseTimeMs: number
  startTime?: number
  endTime?: number
  tokensIn: number
  tokensOut: number
  cost: number
  leftPercent: number
  fastest: boolean
  cheapest: boolean
}

export function MetricsBlock({
  responseTimeMs,
  startTime,
  endTime,
  tokensIn,
  tokensOut,
  cost,
  leftPercent,
  fastest: _fastest,
  cheapest: _cheapest
}: Props) {
  const seconds = responseTimeMs / 1000
  
  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "—"
    return new Date(timestamp).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 2
    })
  }

  return (
    <div className="mb-3 border border-emerald-200/20 rounded-2xl p-3 bg-black/88 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-[11px] text-emerald-100">
      <div className="flex flex-col gap-1 min-w-0">
        <div className="text-[9px] uppercase tracking-[0.35em] text-emerald-400/80">Response Time</div>
        <div className="font-mono text-[15px] font-semibold text-emerald-200">{seconds.toFixed(2)}s</div>
        {startTime && endTime && (
          <div className="text-[10px] text-emerald-300/70 space-y-0.5">
            <div>Start: {formatTime(startTime)}</div>
            <div>End: {formatTime(endTime)}</div>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <div className="text-[9px] uppercase tracking-[0.35em] text-emerald-400/80">Tokens</div>
        <div className="font-mono text-[15px] font-semibold text-emerald-200">{tokensIn + tokensOut} total</div>
        <div className="text-[10px] text-emerald-300/70">
          {tokensIn} in · {tokensOut} out
        </div>
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <div className="text-[9px] uppercase tracking-[0.35em] text-emerald-400/80">Cost</div>
        <div className="font-mono text-[15px] font-semibold text-emerald-200">${cost.toFixed(4)}</div>
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <div className="text-[9px] uppercase tracking-[0.35em] text-emerald-400/80">Quota Left</div>
        <div className="font-mono text-[15px] font-semibold text-emerald-200">{leftPercent.toFixed(1)}%</div>
      </div>
    </div>
  )
}
