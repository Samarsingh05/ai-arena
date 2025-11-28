"use client"

import Link from "next/link"
import { signOut, useSession } from "next-auth/react"

const ADMIN_EMAIL = "2003singhsamar@gmail.com"

export function Navbar() {
  const { data: session } = useSession()

  return (
    <header className="border-b border-emerald-200/15 bg-black/85 backdrop-blur-xl sticky top-0 z-40 shadow-lg shadow-black/40">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full border border-emerald-200/40 bg-cover bg-center" style={{ backgroundImage: "url(/icon.png)" }} />
          <div>
            <div className="text-[11px] tracking-[0.5em] uppercase text-emerald-200/80">AI Arena</div>
            <div className="text-[11px] text-emerald-200/60">Battle-tested LLM comparison</div>
          </div>
        </div>
        {session && (
          <div className="flex items-center gap-2 text-[11px]">
            {session.user?.email && <span className="text-emerald-100 hidden sm:inline">{session.user.email}</span>}
            {session.user?.email === ADMIN_EMAIL && (
              <Link
                href="/admin"
                className="px-3 py-1 rounded-full border border-emerald-300/40 hover:border-emerald-200/60 hover:bg-emerald-300/5 text-emerald-100 transition"
              >
                Admin
              </Link>
            )}
            <button
              className="px-3 py-1 rounded-full border border-emerald-300/40 hover:border-emerald-200/60 hover:bg-emerald-300/5 text-emerald-100 transition"
              onClick={() => signOut()}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
