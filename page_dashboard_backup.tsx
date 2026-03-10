"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function DashboardPage() {

  const [stats,setStats] = useState({
    users:0,
    products:0,
    transactions:0
  })

  const [recent,setRecent] = useState<any[]>([])

  useEffect(()=>{
    fetchStats()
    fetchRecent()
  },[])

  const fetchStats = async()=>{

    const {count:users} = await supabase
      .from("users")
      .select("*",{count:"exact",head:true})

    const {count:products} = await supabase
      .from("products")
      .select("*",{count:"exact",head:true})

    const {count:transactions} = await supabase
      .from("transactions")
      .select("*",{count:"exact",head:true})

    setStats({
      users:users || 0,
      products:products || 0,
      transactions:transactions || 0
    })

  }

  const fetchRecent = async()=>{

    const {data} = await supabase
      .from("transactions")
      .select(`
        id,
        price,
        buyer_username,
        products(
          name,
          email
        )
      `)
      .order("created_at",{ascending:false})
      .limit(10)

    setRecent(data || [])

  }

  return (

    <div>

      <h1 className="text-3xl font-bold mb-8">
        Overview
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Total Users</p>
          <h3 className="text-3xl font-bold mt-2">{stats.users}</h3>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Total Products</p>
          <h3 className="text-3xl font-bold mt-2">{stats.products}</h3>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Total Transactions</p>
          <h3 className="text-3xl font-bold mt-2">{stats.transactions}</h3>
        </div>

      </div>


      {/* Recent Transactions */}
      <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border">

        <h2 className="text-lg font-semibold mb-4">
          Recent Transactions
        </h2>

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="border-b">
              <tr>
                <th className="p-2 text-left">No</th>
                <th className="p-2 text-left">ID Transaksi</th>
                <th className="p-2 text-left">Product</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Harga Jual</th>
                <th className="p-2 text-left">Pembeli</th>
              </tr>
            </thead>

            <tbody>

              {recent.map((t,index)=>(
                <tr key={t.id} className="border-b">

                  <td className="p-2">{index+1}</td>

                  <td className="p-2">{t.id}</td>

                  <td className="p-2">{t.products?.name}</td>

                  <td className="p-2">{t.products?.email}</td>

                  <td className="p-2">
                    Rp {Number(t.price).toLocaleString()}
                  </td>

                  <td className="p-2">{t.buyer_username}</td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>

  )

}