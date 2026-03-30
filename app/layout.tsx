import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Poppins } from "next/font/google"

import "./globals.css"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Saisoku Admin Dashboard",
  description: "Sales reporting and admin dashboard for Saisoku.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="id">
      <body className={poppins.className}>{children}</body>
    </html>
  )
}
