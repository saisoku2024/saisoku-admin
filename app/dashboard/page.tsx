"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js"
import { Bar } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

type TxRow = {
  price: number | null
  created_at: string | null
  expired_at: string | null
  status: string | null
  products?: { name: string | null } | null
}

function currencyIDR(v: number) {
  return `Rp ${v.toLocaleString("id-ID")}`
}

/** ---------- UI Primitives (konsisten) ---------- */
function Panel({
  title,
  subtitle,
  right,
  children,
  className = "",
}: {
  title: string
  subtitle?: string
  right?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-2xl border bg-white p-6 shadow-sm ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium text-gray-800">{title}</h2>
          {subtitle ? <p className="mt-1 text-xs text-gray-500">{subtitle}</p> : null}
        </div>
        {right}
      </div>
      {children}
    </div>
  )
}

function StatCard({
  label,
  value,
  accentClass = "text-gray-900",
}: {
  label: string
  value: React.ReactNode
  accentClass?: string
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tracking-tight ${accentClass}`}>
        {value}
      </div>
    </div>
  )
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />
}

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-3 h-7 w-36" />
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Skeleton className="h-3 w-44" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-[210px] w-full rounded-2xl" />
    </div>
  )
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  const [meta, setMeta] = useState({
    today: 0,
    month: 0,
    total: 0,
    transactions: 0,
    activeUsers: 0,
  })

  const [status, setStatus] = useState({
    active: 0,
    expiring: 0,
    expired: 0,
  })

  const [dailyChart, setDailyChart] = useState<any>(null)
  const [monthlyChart, setMonthlyChart] = useState<any>(null)

  const months = useMemo(
    () => ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    []
  )

  const chartOptionsCount = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: any) => {
              const v = ctx.raw
              return typeof v === "number" ? `${v.toLocaleString("id-ID")} transaksi` : String(v)
            },
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true } },
        y: {
          grid: { color: "rgba(0,0,0,0.06)" },
          ticks: { precision: 0, callback: (v: any) => Number(v).toLocaleString("id-ID") },
        },
      },
    }),
    []
  )

  const chartOptionsCurrency = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: any) => {
              const v = ctx.raw
              return typeof v === "number" ? currencyIDR(v) : String(v)
            },
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true } },
        y: {
          grid: { color: "rgba(0,0,0,0.06)" },
          ticks: {
            callback: (v: any) => Number(v).toLocaleString("id-ID"),
          },
        },
      },
    }),
    []
  )

  async function fetchTransactionsOnce(): Promise<TxRow[]> {
    const { data, error } = await supabase
      .from("transactions")
      .select("price,created_at,expired_at,status,products(name)")
      .order("created_at", { ascending: false })

    if (error) throw error
    return (data ?? []) as unknown as TxRow[]
  }

  async function fetchActiveUsersCount(): Promise<number> {
    const { count, error } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)

    if (error) throw error
    return count ?? 0
  }

  function computeAllFromTransactions(txs: TxRow[], activeUsers: number) {
    const now = new Date()
    const todayStr = now.toDateString()

    let todayRevenue = 0
    let monthRevenue = 0
    let totalRevenue = 0

    const monthlyRevenue = new Array(12).fill(0) as number[]
    const productCounts: Record<string, number> = {}

    let active = 0
    let expiring = 0
    let expired = 0

    const paidTransactions = txs.filter((t) => t.status === "paid")

    for (const t of paidTransactions) {
      const price = Number(t.price ?? 0)
      const created = t.created_at ? new Date(t.created_at) : null

      totalRevenue += price

      if (created && !Number.isNaN(created.getTime())) {
        monthlyRevenue[created.getMonth()] += price

        if (created.toDateString() === todayStr) todayRevenue += price
        if (created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()) {
          monthRevenue += price
        }
      }

      const productName = t.products?.name?.trim() || "Unknown"
      productCounts[productName] = (productCounts[productName] || 0) + 1

      if (t.expired_at) {
        const expiredAt = new Date(t.expired_at)

        if (!Number.isNaN(expiredAt.getTime())) {
          const diffMs = expiredAt.getTime() - now.getTime()
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

          if (diffDays > 3) active++
          else if (diffDays >= 0) expiring++
          else expired++
        }
      }
    }

    const labels = Object.keys(productCounts)
    const values = Object.values(productCounts)

    setDailyChart({
      labels,
      datasets: [
        {
          label: "Sales by Product",
          data: values,
          borderRadius: 8,
          backgroundColor: "rgba(59,130,246,0.85)",
          hoverBackgroundColor: "rgba(59,130,246,1)",
        },
      ],
    })

    setMonthlyChart({
      labels: months,
      datasets: [
        {
          label: "Monthly Revenue",
          data: monthlyRevenue,
          borderRadius: 8,
          backgroundColor: "rgba(34,197,94,0.85)",
          hoverBackgroundColor: "rgba(34,197,94,1)",
        },
      ],
    })

    setMeta({
      today: todayRevenue,
      month: monthRevenue,
      total: totalRevenue,
      transactions: paidTransactions.length,
      activeUsers,
    })

    setStatus({ active, expiring, expired })
  }

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        setLoading(true)
        setErrorMsg(null)

        const [txs, activeUsers] = await Promise.all([
          fetchTransactionsOnce(),
          fetchActiveUsersCount(),
        ])

        if (cancelled) return
        computeAllFromTransactions(txs, activeUsers)
        setUpdatedAt(new Date())
      } catch (e: any) {
        if (cancelled) return
        setErrorMsg(e?.message ?? "Failed to load dashboard")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            Overview
          </h1>
          <p className="text-sm text-gray-500">Dashboard analytics summary</p>
        </div>

        <div className="text-xs text-gray-400">
          {updatedAt ? `Updated: ${updatedAt.toLocaleString("id-ID")}` : "—"}
        </div>
      </div>

      {errorMsg ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMsg}
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Revenue Today" value={currencyIDR(meta.today)} accentClass="text-blue-600" />
            <StatCard label="Revenue Month" value={currencyIDR(meta.month)} accentClass="text-green-600" />
            <StatCard label="Revenue Total" value={currencyIDR(meta.total)} accentClass="text-purple-600" />
            <StatCard label="Transactions" value={meta.transactions.toLocaleString("id-ID")} />
            <StatCard label="Active Users" value={meta.activeUsers.toLocaleString("id-ID")} accentClass="text-emerald-600" />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Sales by Product"
          subtitle="Total transaksi per produk (data dari transaksi paid)"
          right={<span className="text-xs text-gray-400">All Time</span>}
          className="h-[280px] lg:h-[320px]"
        >
          {loading ? (
            <ChartSkeleton />
          ) : dailyChart && dailyChart.labels.length > 0 ? (
            <Bar data={dailyChart} options={chartOptionsCount} />
          ) : (
            <div className="text-sm text-gray-400">No data.</div>
          )}
        </Panel>

        <Panel
          title="Monthly Revenue"
          subtitle="Akumulasi revenue per bulan (tahun berjalan dari transaksi paid)"
          right={<span className="text-xs text-gray-400">Year</span>}
          className="h-[280px] lg:h-[320px]"
        >
          {loading ? (
            <ChartSkeleton />
          ) : monthlyChart ? (
            <Bar data={monthlyChart} options={chartOptionsCurrency} />
          ) : (
            <div className="text-sm text-gray-400">No data.</div>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Active Accounts" value={status.active.toLocaleString("id-ID")} accentClass="text-green-600" />
            <StatCard label="Expiring Accounts" value={status.expiring.toLocaleString("id-ID")} accentClass="text-yellow-600" />
            <StatCard label="Expired Accounts" value={status.expired.toLocaleString("id-ID")} accentClass="text-red-600" />
          </>
        )}
      </div>
    </div>
  )
}