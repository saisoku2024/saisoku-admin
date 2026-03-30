"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { ArrowRight, Eye, EyeOff, KeyRound, Mail } from "lucide-react"
import { useRouter } from "next/navigation"

import { AuthLoadingScreen } from "@/components/auth/auth-loading-screen"
import { AuthShell } from "@/components/auth/auth-shell"
import { AuthThemeToggle } from "@/components/auth/auth-theme-toggle"
import { supabase } from "@/lib/supabaseClient"

const THEME_STORAGE_KEY = "saisoku-theme"

export default function LoginPage() {
  const router = useRouter()

  const [isDark, setIsDark] = useState(true)
  const [isReady, setIsReady] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    return email.trim().length > 4 && password.trim().length >= 8
  }, [email, password])

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    const nextIsDark = storedTheme ? storedTheme === "dark" : true
    setIsDark(nextIsDark)
    document.documentElement.classList.toggle("dark", nextIsDark)
    setIsReady(true)
  }, [])

  useEffect(() => {
    let mounted = true

    const bootstrapSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) return

      if (session) {
        router.replace("/dashboard")
        return
      }
    }

    void bootstrapSession()

    return () => {
      mounted = false
    }
  }, [router])

  function toggleTheme() {
    setIsDark((currentValue) => {
      const nextValue = !currentValue
      document.documentElement.classList.toggle("dark", nextValue)
      window.localStorage.setItem(THEME_STORAGE_KEY, nextValue ? "dark" : "light")
      return nextValue
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setIsSubmitting(true)
      setErrorMessage(null)
      setInfoMessage(null)

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        setErrorMessage(error.message)
        return
      }

      router.replace("/dashboard")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResetPassword() {
    if (!email.trim()) {
      setErrorMessage("Masukkan email admin terlebih dahulu untuk menerima link reset password.")
      setInfoMessage(null)
      return
    }

    try {
      setIsResetting(true)
      setErrorMessage(null)
      setInfoMessage(null)

      const redirectTo = `${window.location.origin}/auth/update-password`
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      })

      if (error) {
        setErrorMessage(error.message)
        return
      }

      setInfoMessage("Link reset password berhasil dikirim. Silakan cek email admin Anda.")
    } finally {
      setIsResetting(false)
    }
  }

  if (!isReady) {
    return (
      <AuthLoadingScreen
        title="Menyiapkan akses login"
        description="Mempersiapkan workspace SIGHT untuk admin..."
      />
    )
  }

  return (
    <AuthShell rightTop={<AuthThemeToggle isDark={isDark} onToggle={toggleTheme} />}>
      <div className="flex h-full flex-col justify-center">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
          Admin access
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Enter your credentials to access the SIGHT dashboard
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-200">
              Email admin
            </label>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-4 transition focus-within:border-slate-600 focus-within:ring-4 focus-within:ring-white/5">
              <Mail className="h-4 w-4 text-slate-500" />
              <input
                id="email"
                type="email"
                placeholder="admin@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-14 w-full border-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="password" className="text-sm font-medium text-slate-200">
                Password
              </label>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={isResetting}
                className="text-sm text-slate-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResetting ? "Sending reset link..." : "Forgot your password?"}
              </button>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-4 transition focus-within:border-slate-600 focus-within:ring-4 focus-within:ring-white/5">
              <KeyRound className="h-4 w-4 text-slate-500" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-14 w-full border-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="text-slate-500 transition hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          ) : null}

          {infoMessage ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {infoMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-200 px-5 text-sm font-semibold text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            {isSubmitting ? "Signing in..." : "Sign in to dashboard"}
            {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
          </button>
        </form>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-300">
          <p className="font-semibold text-white">Secure internal access</p>
          <p className="mt-2">
            Use your authorized admin account to access reporting, monitoring, and stock management tools in one workspace.
          </p>
        </div>

        <p className="mt-6 text-xs text-slate-500">
          Need another access method? Configure additional providers from Supabase after the core email login flow is stable.
        </p>

        <div className="mt-4 text-xs text-slate-500">
          <Link href="https://saisoku-admin.vercel.app/dashboard" className="pointer-events-none opacity-0">
            hidden
          </Link>
        </div>
      </div>
    </AuthShell>
  )
}
