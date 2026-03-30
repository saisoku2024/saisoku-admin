import type { ReactNode } from "react"

type AuthShellProps = {
  children: ReactNode
  badge?: string
  title?: string
  description?: string
  features?: Array<{
    title: string
    description: string
  }>
}

export function AuthShell({
  children,
  badge = "SALES MANAGEMENT SYSTEM",
  title = "Welcome to INSIGHT Workspace",
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
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col overflow-hidden rounded-none border border-white/10 lg:grid lg:grid-cols-2 lg:rounded-[28px]">
        <section className="relative flex flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 px-6 py-8 sm:px-10 lg:px-12">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
                {badge}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.32em] text-cyan-300">
                  INSIGHT
                </p>
                <p className="text-sm text-slate-400 sm:text-base">
                  Integrated Sales Intelligence &amp; Growth Hub
                </p>
              </div>
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {title}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                {description}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur"
                >
                  <h3 className="mb-2 text-sm font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-6 text-slate-300">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 text-xs text-slate-400">
            © 2026 Saisoku Systems · INSIGHT Platform · Internal Use Only
          </div>
        </section>

        <section className="flex items-center justify-center bg-slate-950 px-6 py-8 sm:px-10 lg:px-12">
          <div className="w-full max-w-md">{children}</div>
        </section>
      </div>
    </div>
  )
}

export default AuthShell
