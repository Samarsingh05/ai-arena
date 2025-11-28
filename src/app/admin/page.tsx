import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

const ADMIN_EMAIL = "2003singhsamar@gmail.com"

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.email !== ADMIN_EMAIL) {
    redirect("/api/auth/signin?callbackUrl=/admin")
  }

  const users = await db.getAllUsers()

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-emerald-100 mb-1">Registered users</h1>
        <p className="text-sm text-emerald-300/80">
          You have {users.length} account{users.length === 1 ? "" : "s"} in the database.
        </p>
      </div>
      <div className="rounded-2xl border border-emerald-500/30 bg-black/60 overflow-hidden">
        <div className="grid grid-cols-3 text-xs uppercase tracking-[0.2em] text-emerald-300/80 border-b border-emerald-500/20 px-4 py-3">
          <span>Email</span>
          <span className="text-center">Created</span>
          <span className="text-right">User ID</span>
        </div>
        <ul className="divide-y divide-emerald-500/10 text-sm">
          {users.map(user => (
            <li key={user.id} className="grid grid-cols-3 px-4 py-3 text-emerald-100 text-[13px]">
              <span className="truncate">{user.email}</span>
              <span className="text-center text-emerald-300/80">
                {new Date(user.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric"
                })}
              </span>
              <span className="text-right text-emerald-300/70 font-mono text-[12px]">{user.id}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

