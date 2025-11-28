"use client"

import { useEffect, useState } from "react"
import { loadSessions, SessionHistory as SessionHistoryType } from "@/lib/sessionHistory"

export function SessionHistory() {
  const [sessions, setSessions] = useState<SessionHistoryType[]>([])
  const [selected, setSelected] = useState<SessionHistoryType | null>(null)

  useEffect(() => {
    setSessions(loadSessions())
  }, [])

  return (
    <div className="mt-10">
      <h2 className="text-xs text-zinc-400 mb-2">Session history (local, last 20)</h2>
      {sessions.length === 0 && <div className="text-[11px] text-zinc-600">No previous sessions yet.</div>}
      <div className="flex flex-col gap-2 text-xs">
        {sessions
          .slice()
          .reverse()
          .map(session => (
            <button
              key={session.id}
              onClick={() => setSelected(session)}
              className="flex justify-between items-center px-3 py-2 rounded-xl bg-black/30 border border-zinc-800 hover:border-green-500/60 text-left"
            >
              <div>
                <div className="text-zinc-200">
                  Session {new Date(session.createdAt).toLocaleString(undefined, { hour12: false })}
                </div>
                <div className="text-[10px] text-zinc-500">{session.runs.length} prompts</div>
              </div>
              <div className="text-[10px] text-zinc-500">View</div>
            </button>
          ))}
      </div>
      {selected && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-40">
          <div className="w-full max-w-3xl max-h-[80vh] bg-arena-card border border-arena-border rounded-2xl p-4 overflow-auto">
            <div className="flex justify-between items-center mb-3">
              <div>
                <div className="text-sm">
                  Session {new Date(selected.createdAt).toLocaleString(undefined, { hour12: false })}
                </div>
                <div className="text-[10px] text-zinc-500">{selected.runs.length} prompts</div>
              </div>
              <button
                className="text-xs px-3 py-1 border border-zinc-700 rounded-full hover:bg-zinc-800"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
            <div className="space-y-4">
              {selected.runs.map(run => (
                <div key={run.id} className="border border-zinc-800 rounded-xl p-3">
                  <div className="text-xs text-zinc-400 mb-1">
                    Prompt at {new Date(run.createdAt).toLocaleTimeString(undefined, { hour12: false })}
                  </div>
                  <div className="text-xs bg-black/40 border border-zinc-800 rounded-lg p-2 font-mono whitespace-pre-wrap mb-2">
                    {run.prompt}
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {run.results.map(res => (
                      <div key={res.provider} className="border border-zinc-800 rounded-lg p-2 text-[11px]">
                        <div className="flex justify-between mb-1">
                          <div className="font-semibold">{res.provider}</div>
                          <div className="text-zinc-500">{res.metrics.cost.toFixed(4)} USD</div>
                        </div>
                        <div className="max-h-40 overflow-auto bg-black/30 rounded-md p-2 font-mono whitespace-pre-wrap">
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
      )}
    </div>
  )
}
