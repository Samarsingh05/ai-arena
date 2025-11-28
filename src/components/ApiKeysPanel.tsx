"use client"

import { useState } from "react"
import { PROVIDERS, ProviderId } from "@/lib/providers"

type KeyStatus = {
  id: string
  provider: ProviderId
  status: string
}

type Props = {
  keyStatuses: KeyStatus[]
  refreshKeys: () => Promise<void>
}

type ProviderInputState = {
  value: string
  testing: boolean
  result: "idle" | "ok" | "error"
  message: string
}

function ProviderInstructionsContent({ provider }: { provider: ProviderId }) {
  switch (provider) {
    case "openai":
    case "openai-mini":
      return (
        <div className="text-[10px] text-emerald-300/80 leading-relaxed space-y-1">
          <p className="font-medium text-emerald-100">How to get your OpenAI API key:</p>
          <ol className="list-decimal list-inside space-y-[2px]">
            <li>
              Go to{" "}
              <a
                href="https://platform.openai.com/"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-dotted"
              >
                platform.openai.com
              </a>
            </li>
            <li>Log in or create an account.</li>
            <li>
              Click your profile icon →{" "}
              <span className="font-mono text-[10px]">View API keys</span>.
            </li>
            <li>
              Click <span className="font-mono text-[10px]">Create new secret key</span> and copy it.
            </li>
          </ol>
        </div>
      )
    case "anthropic":
      return (
        <div className="text-[10px] text-emerald-300/80 leading-relaxed space-y-1">
          <p className="font-medium text-emerald-100">How to get your Claude (Anthropic) API key:</p>
          <ol className="list-decimal list-inside space-y-[2px]">
            <li>
              Go to{" "}
              <a
                href="https://console.anthropic.com/"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-dotted"
              >
                console.anthropic.com
              </a>
            </li>
            <li>Sign in / sign up.</li>
            <li>
              Open the <span className="font-mono text-[10px]">API Keys</span> section from the sidebar.
            </li>
            <li>
              Click <span className="font-mono text-[10px]">Create key</span> and copy it.
            </li>
          </ol>
        </div>
      )
    case "gemini":
      return (
        <div className="text-[10px] text-emerald-300/80 leading-relaxed space-y-1">
          <p className="font-medium text-emerald-100">How to get your Google Gemini API key:</p>
          <ol className="list-decimal list-inside space-y-[2px]">
            <li>
              Go to{" "}
              <a
                href="https://ai.google.dev/"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-dotted"
              >
                ai.google.dev
              </a>
            </li>
            <li>
              Click <span className="font-mono text-[10px]">Get API key</span>.
            </li>
            <li>Select or create a Google Cloud project if asked.</li>
            <li>Generate an API key and copy it.</li>
          </ol>
        </div>
      )
    case "perplexity":
      return (
        <div className="text-[10px] text-emerald-300/80 leading-relaxed space-y-1">
          <p className="font-medium text-emerald-100">How to get your Perplexity API key:</p>
          <ol className="list-decimal list-inside space-y-[2px]">
            <li>
              Go to{" "}
              <a
                href="https://www.perplexity.ai/"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-dotted"
              >
                perplexity.ai
              </a>
            </li>
            <li>Sign in to your account.</li>
            <li>
              Open <span className="font-mono text-[10px]">Settings</span> →{" "}
              <span className="font-mono text-[10px]">API</span>.
            </li>
            <li>Generate a new API key and copy it.</li>
          </ol>
        </div>
      )
    default:
      return null
  }
}

export function ApiKeysPanel({ keyStatuses, refreshKeys }: Props) {
  const [inputs, setInputs] = useState<Record<ProviderId, ProviderInputState>>({
    openai: { value: "", testing: false, result: "idle", message: "" },
    "openai-mini": { value: "", testing: false, result: "idle", message: "" },
    anthropic: { value: "", testing: false, result: "idle", message: "" },
    gemini: { value: "", testing: false, result: "idle", message: "" },
    perplexity: { value: "", testing: false, result: "idle", message: "" }
  })

  const [openInstructions, setOpenInstructions] = useState<ProviderId | null>(null)

  function statusFor(provider: ProviderId) {
    const s = keyStatuses.find(k => k.provider === provider)
    if (!s) return "missing"
    return s.status
  }

  function updateInput(provider: ProviderId, patch: Partial<ProviderInputState>) {
    setInputs(prev => ({
      ...prev,
      [provider]: { ...prev[provider], ...patch }
    }))
  }

  async function handleTestAndSave(provider: ProviderId) {
    const state = inputs[provider]
    if (!state.value.trim()) return
    updateInput(provider, { testing: true, result: "idle", message: "" })
    try {
      const testRes = await fetch("/api/keys/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey: state.value.trim() })
      })
      if (!testRes.ok) {
        updateInput(provider, { testing: false, result: "error", message: "Key seems invalid" })
        return
      }
      const saveRes = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey: state.value.trim(), status: "connected" })
      })
      if (!saveRes.ok) {
        updateInput(provider, { testing: false, result: "error", message: "Failed to save key" })
        return
      }
      updateInput(provider, { testing: false, result: "ok", message: "Connected" })
      await refreshKeys()
    } catch {
      updateInput(provider, { testing: false, result: "error", message: "Network error" })
    }
  }

  return (
    <div className="mt-4 bg-black/85 border border-emerald-200/20 rounded-2xl p-4 shadow-lg shadow-black/40">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-sm font-semibold text-emerald-50">Add API keys</div>
          <div className="text-[12px] text-emerald-300/75 mt-0.5">
            Paste your own keys for each provider. They stay with this account so you can reuse models anytime.
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
  {PROVIDERS.filter(p => p.id !== "openai-mini").map(p => {
    const provider = p.id
    const status = statusFor(provider)
    const state = inputs[provider]

    const badgeText =
      status === "connected"
        ? "Connected"
        : status === "invalid"
        ? "Invalid"
        : status === "payment_required"
        ? "Payment Required"
        : "Missing"

    const badgeClass =
      status === "connected"
        ? "border border-emerald-200/40 text-emerald-200"
        : status === "invalid"
        ? "border border-amber-400/50 text-amber-300"
        : status === "payment_required"
        ? "border border-yellow-400/50 text-yellow-200"
        : "border border-emerald-200/10 text-emerald-200/60"

    const isOpen = openInstructions === provider

    return (
      <div
        key={provider}
        className="border border-emerald-200/20 rounded-xl p-3 bg-black/85 flex flex-col gap-2 shadow-inner"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="text-[13px] font-semibold text-emerald-50">{p.label}</div>
          <span className={`px-2 py-[2px] rounded-full text-[10px] ${badgeClass}`}>
            {badgeText}
          </span>
        </div>

        {status === "payment_required" && (
          <div className="text-[10px] text-amber-300 leading-snug">
            This provider requires a payment method saved in your account. Add billing details in the
            provider’s website to use this API.
          </div>
        )}

        <input
          type="password"
          placeholder="Paste API key"
          value={state.value}
          onChange={e => updateInput(provider, { value: e.target.value })}
          className="w-full text-[13px] px-2.5 py-1.5 rounded-md bg-black/90 border border-emerald-200/25 focus:border-emerald-200 outline-none font-mono text-emerald-50 placeholder:text-emerald-300/50"
        />

        <div className="flex items-center justify-between gap-2 text-[12px]">
          <button
            onClick={() => handleTestAndSave(provider)}
            disabled={!state.value.trim() || state.testing}
            className="px-3 py-1 rounded-full border border-emerald-200/30 hover:border-emerald-100/60 disabled:opacity-50 text-emerald-100 transition"
          >
            {state.testing ? "Testing..." : "Test & Save"}
          </button>
          <div className="text-[10px] text-emerald-300/70">
            {state.result === "ok" && <span className="text-emerald-100">{state.message}</span>}
            {state.result === "error" && <span className="text-amber-300">{state.message}</span>}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpenInstructions(isOpen ? null : provider)}
          className="mt-1 inline-flex items-center justify-between w-full text-[11px] px-2 py-1 rounded-md bg-black/90 border border-emerald-200/25 hover:border-emerald-200/40"
        >
          <span className="text-[11px] text-emerald-100">Instructions for the API key</span>
          <span className="text-[11px] text-emerald-400">{isOpen ? "▲" : "▼"}</span>
        </button>

        {isOpen && (
          <div className="mt-1 rounded-md border border-emerald-200/25 bg-black/90 px-2 py-2">
            <ProviderInstructionsContent provider={provider} />
          </div>
        )}
      </div>
    )
  })}
</div>


      {/* Common note below everything */}
      <div className="mt-3 text-[11px] text-emerald-300/70 leading-relaxed">
        <span className="font-semibold text-emerald-100">Important note:</span> Keep your provider keys in sync with AI
        Arena. If a key changes and you don&apos;t paste it here, that provider can&apos;t run or display metrics.
      </div>
    </div>
  )
}
