"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
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
  purchased_at: string | null
  status: string | null
  products?: {
    name: string | null
    modal: number | null
  } | null
}

function currencyIDR(v: number) {
  return `Rp ${Number(v || 0).toLocaleString("id-ID")}`
}

function Panel({
  title,
  subtitle,
  right,
  children,
  className = "",
}: {
  title: string
  subtitle?: string
  right?: ReactNode
  children: ReactNode
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
  value: ReactNode
  accentClass?: string
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md min-h-[100px]">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`mt-2 text-2xl font-semibold tracking-tight ${accentClass}`}>
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
    <div className="rounded-2xl border bg-white p-5 shadow-sm min-h-[100px]">
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
      <Skeleton className="h-[240px] w-full rounded-2xl" />
    </div>
  )
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  const [meta, setMeta] = useState({
    gmvToday: 0,
    gmvMonth: 0,
    profitToday: 0,
    profitMonth: 0,
    profitYear: 0,
    transactions: 0,
    newUsers: 0,
    activeUsers: 0,
    bannedUsers: 0,
  })

  const [todayChart, setTodayChart] = useState<any>(null)
  const [monthlySalesChart, setMonthlySalesChart] = useState<any>(null)

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
        x: {
          grid: { display: false },
          ticks: { maxRotation: 0, autoSkip: true },
        },
        y: {
          beginAtZero: true,
          grid: { color: "rgba(0,0,0,0.06)" },
          ticks: {
            precision: 0,
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
      .select("price,created_at,purchased_at,status,products(name,modal)")
      .order("purchased_at", { ascending: false })

    if (error) throw error
    return (data ?? []) as unknown as TxRow[]
  }

  async function fetchUserCounts() {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

    const [
      { count: newUserCount, error: newUserError },
      { count: activeCount, error: activeError },
      { count: bannedCount, error: bannedError },
    ] = await Promise.all([
      supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfDay),

      supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),

      supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("is_banned", true),
    ])

    if (newUserError) throw newUserError
    if (activeError) throw activeError
    if (bannedError) throw bannedError

    return {
      newUsers: newUserCount ?? 0,
      activeUsers: activeCount ?? 0,
      bannedUsers: bannedCount ?? 0,
    }
  }

  function computeAll(txs: TxRow[], userCounts: { newUsers: number; activeUsers: number; bannedUsers: number }) {
    const now = new Date()
    const todayStr = now.toDateString()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    let gmvToday = 0
    let gmvMonth = 0
    let profitToday = 0
    let profitMonth = 0
    let profitYear = 0

    const todayProductCounts: Record<string, number> = {}
    const monthlySales = new Array(12).fill(0) as number[]

    const paidTransactions = txs.filter((t) => t.status === "paid")

    for (const t of paidTransactions) {
      const price = Number(t.price ?? 0)
      const modal = Number(t.products?.modal ?? 0)
      const profit = price - modal

      const txDateRaw = t.purchased_at || t.created_at
      const txDate = txDateRaw ? new Date(txDateRaw) : null

      if (!txDate || Number.isNaN(txDate.getTime())) continue

      const txYear = txDate.getFullYear()
      const txMonth = txDate.getMonth()
      const productName = t.products?.name?.trim() || "Unknown"

      if (txDate.toDateString() === todayStr) {
        gmvToday += price
        profitToday += profit
        todayProductCounts[productName] = (todayProductCounts[productName] || 0) + 1
      }

      if (txYear === currentYear && txMonth === currentMonth) {
        gmvMonth += price
        profitMonth += profit
      }

      if (txYear === currentYear) {
        profitYear += profit
        monthlySales[txMonth] += 1
      }
    }

    setTodayChart({
      labels: Object.keys(todayProductCounts),
      datasets: [
        {
          label: "Today Sales",
          data: Object.values(todayProductCounts),
          borderRadius: 8,
          backgroundColor: "rgba(59,130,246,0.85)",
          hoverBackgroundColor: "rgba(59,130,246,1)",
        },
      ],
    })

    setMonthlySalesChart({
      labels: months,
      datasets: [
        {
          label: "Monthly Sales",
          data: monthlySales,
          borderRadius: 8,
          backgroundColor: "rgba(34,197,94,0.85)",
          hoverBackgroundColor: "rgba(34,197,94,1)",
        },
      ],
    })

    setMeta({
      gmvToday,
      gmvMonth,
      profitToday,
      profitMonth,
      profitYear,
      transactions: paidTransactions.length,
      newUsers: userCounts.newUsers,
      activeUsers: userCounts.activeUsers,
      bannedUsers: userCounts.bannedUsers,
    })
  }

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        setLoading(true)
        setErrorMsg(null)

        const [txs, userCounts] = await Promise.all([
          fetchTransactionsOnce(),
          fetchUserCounts(),
        ])

        if (cancelled) return

        computeAll(txs, userCounts)
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

      {/* ROW 1 */}
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
            <StatCard
              label="GMV Hari Ini"
              value={currencyIDR(meta.gmvToday)}
              accentClass="text-blue-600"
            />
            <StatCard
              label="GMV Bulan Ini"
              value={currencyIDR(meta.gmvMonth)}
              accentClass="text-green-600"
            />
            <StatCard
              label="Profit Bulan Ini"
              value={currencyIDR(meta.profitMonth)}
              accentClass="text-purple-600"
            />
            <StatCard
              label="Profit Tahun Ini"
              value={currencyIDR(meta.profitYear)}
              accentClass="text-fuchsia-600"
            />
            <StatCard
              label="Transaction"
              value={meta.transactions.toLocaleString("id-ID")}
              accentClass="text-gray-900"
            />
          </>
        )}
      </div>

      {/* ROW 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Today Sales"
          subtitle="Jumlah transaksi paid hari ini per produk"
          right={<span className="text-xs text-gray-400">Today</span>}
          className="h-[320px]"
        >
          {loading ? (
            <ChartSkeleton />
          ) : todayChart && todayChart.labels.length > 0 ? (
            <Bar data={todayChart} options={chartOptionsCount} />
          ) : (
            <div className="text-sm text-gray-400">No sales today.</div>
          )}
        </Panel>

        <Panel
          title="Monthly Sales"
          subtitle="Jumlah transaksi paid per bulan (Jan–Des tahun berjalan)"
          right={<span className="text-xs text-gray-400">Year</span>}
          className="h-[320px]"
        >
          {loading ? (
            <ChartSkeleton />
          ) : monthlySalesChart ? (
            <Bar data={monthlySalesChart} options={chartOptionsCount} />
          ) : (
            <div className="text-sm text-gray-400">No data.</div>
          )}
        </Panel>
      </div>

      {/* ROW 3 */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="New User"
              value={meta.newUsers.toLocaleString("id-ID")}
              accentClass="text-indigo-600"
            />
            <StatCard
              label="Active User"
              value={meta.activeUsers.toLocaleString("id-ID")}
              accentClass="text-emerald-600"
            />
            <StatCard
              label="Banned User"
              value={meta.bannedUsers.toLocaleString("id-ID")}
              accentClass="text-red-600"
            />
          </>
        )}
      </div>

      {/* KETERANGAN */}
      <div className="rounded-2xl border bg-white p-5 text-sm text-gray-600 shadow-sm">
        <div className="font-semibold text-gray-800 mb-2">Keterangan</div>
        <div className="space-y-1">
          <div><b>GMV Today</b> = jumlah Rp penjualan hari ini</div>
          <div><b>GMV Monthly</b> = jumlah Rp penjualan bulan ini</div>
          <div><b>Profit Today</b> = jumlah Rp profit hari ini</div>
          <div><b>Profit Monthly</b> = jumlah Rp profit bulan ini</div>
          <div><b>Profit Yearly</b> = jumlah Rp profit tahun ini</div>
          <div><b>Transaction</b> = jumlah transaksi paid all time</div>
        </div>
      </div>
    </div>
  )
}