import "../styles/globals.css"
import { ReactNode } from "react"
import { Providers } from "@/app/providers"

export const metadata = {
  title: "AI Arena",
  description: "Compare top LLMs side by side.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png"
  }
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-arena-bg text-zinc-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
