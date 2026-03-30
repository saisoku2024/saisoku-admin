import type { ReactNode } from "react"

import { BrandMark } from "@/components/brand/brand-mark"

type AuthShellFeature = {
  title: string
  description: string
}

type AuthShellProps = {
  children: ReactNode
  badge?: string
  title?: string
  description?: string
  features?: AuthShellFeature[]
  rightTop?: ReactNode
}

export function AuthShell({
  children,
  badge = "SALES MANAGEMENT SYSTEM",
  title = "Welcome to SIGHT Workspace",
  description =
    "Optimize your business operations with integrated sales reporting, account monitoring, and inventory management in one secure workspace.",
  features = [
    {
      title: "Sales Reporting",
      description:
        "Track revenue, transactions, and performance in a centralized dashboard.",
    },
    {
      title: "Account Monitoring",
      description:
        "Monitor user activity and manage secure access across the system.",
    },
    {
      title: "Stock Management",
      description:
        "Manage inventory, track stock levels, and ensure product availability.",
    },
  ],
  rightTop,
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(30,41,59,0.92),#020617_56%,#010314)] px-4 py-4 text-white sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70 shadow-2xl shadow-black/30 backdrop-blur lg:min-h-[720px] lg:grid lg:grid-cols-[1.15fr_0.95fr]">
        <section className="relative flex flex-col justify-between border-b border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 px-6 py-6 sm:px-8 sm:py-8 lg:border-b-0 lg:border-r lg:px-10 lg:py-10">
          <div className="absolute inset-x-0 bottom-0 h-40 bg-[radial-gradient(circle_at_bottom_left,rgba(45,212,191,0.18),transparent_54%)]" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <BrandMark inverted />
            {rightTop ? <div>{rightTop}</div> : null}
          </div>

          <div className="relative z-10 mt-10 lg:mt-14">
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300">
              {badge}
            </div>

            <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {title}
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              {description}
            </p>
          </div>

          <div className="relative z-10 mt-10 grid gap-4 sm:grid-cols-3 lg:mt-14">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-white/10 bg-white/6 p-5 shadow-lg shadow-black/10 backdrop-blur"
              >
                <div className="mb-4 h-10 w-10 rounded-2xl border border-white/10 bg-white/8" />
                <h3 className="text-base font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="relative z-10 mt-10 text-xs text-slate-400">
            © 2026 Saisoku Systems · SIGHT Platform · Internal Use Only
          </div>
        </section>

        <section className="bg-slate-950/90 px-6 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <div className="mx-auto flex min-h-full w-full max-w-md flex-col">
            {children}
          </div>
        </section>
      </div>
    </div>
  )
}

export default AuthShell
