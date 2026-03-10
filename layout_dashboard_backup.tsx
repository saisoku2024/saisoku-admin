"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const pathname = usePathname()
  const router = useRouter()

  const menu = [
    {name:"Overview",href:"/dashboard",icon:"📊"},
    {name:"Products",href:"/dashboard/products",icon:"📦"},
    {name:"Stocks",href:"/dashboard/stocks",icon:"🔑"},
    {name:"Transactions",href:"/dashboard/transactions",icon:"💳"},
    {name:"Users",href:"/dashboard/users",icon:"👤"}
  ]

  const handleLogout = async () => {

    await supabase.auth.signOut()

    router.push("/login")

  }

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Sidebar */}

      <aside className="w-64 bg-white border-r border-gray-200 p-5 flex flex-col justify-between">

        <div>

          <div className="mb-8">

            <h2 className="text-lg font-bold tracking-wide">
              SAISOKU
            </h2>

            <p className="text-xs text-gray-400">
              Admin Panel
            </p>

          </div>

          <nav className="flex flex-col gap-1">

            {menu.map((m)=>(

              <Link
                key={m.href}
                href={m.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition
                  
                  ${pathname===m.href
                  ? "bg-gray-100 font-medium"
                  : "hover:bg-gray-50"}
                  
                `}
              >

                {m.icon} {m.name}

              </Link>

            ))}

          </nav>

        </div>

        <div>

          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white px-3 py-2 rounded-md text-sm hover:bg-red-600"
          >
            🚪 Logout
          </button>

        </div>

      </aside>

      {/* Content */}

      <main className="flex-1 px-8 py-6 max-w-[1400px] mx-auto">

        {children}

      </main>

    </div>
  )

}