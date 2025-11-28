"use client"

import { ProviderId, PROVIDERS } from "@/lib/providers"

type Props = {
  connectedProviders: ProviderId[]
  billingRequiredProviders: ProviderId[]
  selected: ProviderId[]
  setSelected: (v: ProviderId[]) => void
}


export function ProviderToggleRow({ connectedProviders, billingRequiredProviders, selected, setSelected }: Props) {
  function toggle(p: ProviderId) {
    if (selected.includes(p)) {
      setSelected(selected.filter(x => x !== p))
    } else {
      setSelected([...selected, p])
    }
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {PROVIDERS.map(p => {
        const isConnected =
  connectedProviders.includes(p.id) || billingRequiredProviders.includes(p.id)

        const billingRequired = billingRequiredProviders.includes(p.id)

        const active = selected.includes(p.id)
        return (
          <button
            key={p.id}
            disabled={!isConnected && !billingRequired}
            onClick={() => toggle(p.id)}
            className={`px-3 py-1 rounded-full text-xs border transition ${
              active
                ? "border-emerald-400 bg-emerald-500/10 text-emerald-100"
                : isConnected
                ? "border-emerald-500/20 text-emerald-200 hover:border-emerald-400/60"
                : billingRequired
                ? "border-amber-400/60 text-amber-300 hover:border-amber-400"
                : "border-emerald-900 text-emerald-700 cursor-not-allowed"
            }`}
          >
            {active
              ? "✓"
              : isConnected
              ? "○"
              : billingRequired
              ? "⚠"
              : "✗"}{" "}
            {p.label.split("–")[0].trim()}
          </button>

        )
      })}
    </div>
  )
}
