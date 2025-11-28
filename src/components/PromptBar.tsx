"use client"

import { useEffect } from "react"

type Props = {
  prompt: string
  setPrompt: (v: string) => void
  onRun: () => void
  disabled?: boolean
}

export function PromptBar({ prompt, setPrompt, onRun, disabled }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault()
        if (!disabled) onRun()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onRun, disabled])

  return (
    <div className="bg-black/85 border border-emerald-200/25 rounded-2xl p-4 shadow-lg shadow-black/40">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[13px] font-semibold text-emerald-50">Enter your prompt</div>
        <div className="text-[9px] text-emerald-300/70 uppercase tracking-[0.3em]">Ctrl / Cmd + Enter</div>
      </div>
      <textarea
        className="w-full rounded-xl bg-black/80 border border-emerald-200/25 focus:border-emerald-200 focus:ring-0 outline-none resize-none text-[13px] p-3 h-32 scrollbar-thin font-mono text-emerald-50 placeholder:text-emerald-300/50"
        placeholder="Ask one prompt to rule them all..."
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
      />
    </div>
  )
}
