"use client"

import { useSession, signIn } from "next-auth/react"
import { ReactNode, useState } from "react"

export function AuthGate({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [mode, setMode] = useState<"login" | "signup">("login")

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-zinc-500 text-sm">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-sm bg-arena-card border border-arena-border rounded-2xl p-6 shadow-xl shadow-black/40">
          <h1 className="text-lg font-semibold text-zinc-100">AI Arena</h1>
          <p className="mt-1 text-xs text-zinc-400">
            {mode === "signup"
              ? "Create an account with email and password. You can log in from any device later."
              : "Log in with your AI Arena account. New here? Switch to Sign up to create one."}
          </p>
          <div className="mt-3 flex gap-2 text-xs">
            <button
              className={`flex-1 px-3 py-1 rounded-full border ${
                mode === "login"
                  ? "border-green-500 bg-green-500/10 text-green-300"
                  : "border-zinc-700 text-zinc-300"
              }`}
              onClick={() => {
                setMode("login")
                setError("")
              }}
            >
              Log in
            </button>
            <button
              className={`flex-1 px-3 py-1 rounded-full border ${
                mode === "signup"
                  ? "border-green-500 bg-green-500/10 text-green-300"
                  : "border-zinc-700 text-zinc-300"
              }`}
              onClick={() => {
                setMode("signup")
                setError("")
              }}
            >
              Sign up
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
          <form
            className="mt-4 space-y-3"
            onSubmit={async e => {
              e.preventDefault()
              setLoading(true)
              setError("")
              try {
                const res = await signIn("credentials", {
                  email,
                  password,
                  mode, // <-- IMPORTANT: send login/signup to backend
                  redirect: false
                })

                if (res?.error) {
                  if (mode === "signup") {
                    setError("An account with this email may already exist. Try logging in instead.")
                  } else {
                    setError("Invalid email or password. Make sure you have signed up first.")
                  }
                }
              } finally {
                setLoading(false)
              }
            }}
          >
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Email</label>
              <input
                className="w-full rounded-md bg-black/40 border border-zinc-700 px-3 py-2 text-xs outline-none focus:border-green-500"
                value={email}
                onChange={e => setEmail(e.target.value)}
                type="email"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Password</label>
              <input
                className="w-full rounded-md bg-black/40 border border-zinc-700 px-3 py-2 text-xs outline-none focus:border-green-500"
                value={password}
                onChange={e => setPassword(e.target.value)}
                type="password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 rounded-md bg-gradient-to-r from-green-500 to-emerald-500 text-xs py-2 font-medium disabled:opacity-60"
            >
              {loading ? "Please wait..." : mode === "signup" ? "Create account" : "Log in"}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
