import type { ReactNode } from "react"

type AuthFeature = {
  title: string
  description: string
}

export type AuthShellProps = {
  children: ReactNode
  badge?: string
  title?: string
  description?: string
  features?: AuthFeature[]
  rightTop?: ReactNode
}

const defaultFeatures: AuthFeature[] = [
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
]

export function AuthShell({
  children,
  badge = "SALES MANAGEMENT SYSTEM",
  title = "Welcome to INSIGHT Workspace",
  description = "Optimize your business operations with integrated sales reporting, account monitoring, and inventory management in one secure workspace.",
  features = defaultFeatures,
  rightTop,
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[#020817] px-4 py-5 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] w-full max-w-6xl overflow-hidden rounded-[26px] border border-white/10 bg-slate-950 shadow-2xl lg:grid-cols-[1.02fr_0.88fr]">
        <section className="relative flex flex-col justify-between border-b border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 px-6 py-7 sm:px-8 lg:border-b-0 lg:border-r lg:px-9 lg:py-8">
          <div className="space-y-7">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-4">
                <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">
                  {badge}
                </div>
                <div className="space-y-3">
                  <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-[3rem]">
                    {title}
                  </h1>
                  <p className="max-w-xl text-sm leading-7 text-slate-300 sm:text-[15px]">
                    {description}
                  </p>
                </div>
              </div>

              {rightTop ? <div className="shrink-0">{rightTop}</div> : null}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
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

          <div className="mt-7 text-xs text-slate-400">
            © 2026 Saisoku Systems · INSIGHT Platform · Internal Use Only
          </div>
        </section>

        <section className="flex items-center justify-center bg-slate-950 px-6 py-7 sm:px-8 lg:px-9 lg:py-8">
          <div className="w-full max-w-[320px]">{children}</div>
        </section>
      </div>
    </div>
  )
}

export default AuthShell
