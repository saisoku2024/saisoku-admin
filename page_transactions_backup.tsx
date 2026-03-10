"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { createTransaction } from "@/lib/actions/createTransaction"

export default function TransactionsPage() {

  const [transactions, setTransactions] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [search, setSearch] = useState("")

  const [productId, setProductId] = useState("")
  const [buyer, setBuyer] = useState("")
  const [price, setPrice] = useState("")

  const [delivery, setDelivery] = useState<any | null>(null)

  async function loadTransactions() {

    let query = supabase
      .from("transactions")
      .select(`
        *,
        products(name,duration_days),
        product_accounts(email,password,pin,sold_at)
      `)
      .order("created_at", { ascending: false })

    if (search) {
      query = query.or(`
        invoice.ilike.%${search}%,
        buyer_username.ilike.%${search}%
      `)
    }

    const { data } = await query

    setTransactions(data || [])
  }

  async function loadProducts() {

    const { data } = await supabase
      .from("products")
      .select("id,name")

    setProducts(data || [])
  }

  async function handleCreateTransaction() {

    if (!productId || !buyer || !price) {
      alert("Lengkapi form")
      return
    }

    try {

      const result = await createTransaction({
        productId,
        buyerUsername: buyer,
        price: Number(price)
      })

      setDelivery(result.account)

      setBuyer("")
      setPrice("")

      loadTransactions()

    } catch (err: any) {

      alert(err.message)

    }
  }

  function getStatus(t:any){

    if(!t.product_accounts?.sold_at) return "active"

    const sold = new Date(t.product_accounts.sold_at)
    const now = new Date()

    const days = Math.floor(
      (now.getTime() - sold.getTime()) / (1000*60*60*24)
    )

    const duration = t.duration_days || 30

    if(days <= duration-4) return "active"
    if(days <= duration) return "expiring"

    return "expired"
  }

  useEffect(() => {

    loadTransactions()
    loadProducts()

  }, [search])

  return (
    <div className="space-y-6">

      <h1 className="text-xl font-semibold">
        Transactions
      </h1>

      {/* Create Transaction */}

      <div className="bg-white p-4 rounded-lg border space-y-3">

        <h2 className="font-medium">
          Create Transaction
        </h2>

        <div className="grid grid-cols-3 gap-3">

          <select
            value={productId}
            onChange={(e)=>setProductId(e.target.value)}
            className="border rounded p-2"
          >
            <option value="">
              Select Product
            </option>

            {products.map((p)=>(
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}

          </select>

          <input
            placeholder="Buyer Username"
            value={buyer}
            onChange={(e)=>setBuyer(e.target.value)}
            className="border rounded p-2"
          />

          <input
            placeholder="Price"
            value={price}
            onChange={(e)=>setPrice(e.target.value)}
            className="border rounded p-2"
          />

        </div>

        <button
          onClick={handleCreateTransaction}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Create Transaction
        </button>

      </div>

      {/* Delivery */}

      {delivery && (

        <div className="bg-green-50 border border-green-200 p-4 rounded">

          <h2 className="font-medium mb-2">
            Account Delivered
          </h2>

          <div className="space-y-1 text-sm">

            <div>Email: {delivery.email}</div>
            <div>Password: {delivery.password}</div>
            <div>Profile: {delivery.profile}</div>
            <div>PIN: {delivery.pin}</div>

          </div>

        </div>

      )}

      {/* Search */}

      <input
        placeholder="Search invoice / buyer"
        value={search}
        onChange={(e)=>setSearch(e.target.value)}
        className="border rounded p-2 w-full"
      />

      {/* Transactions Table */}

      <div className="bg-white border rounded-lg overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="border-b bg-gray-50">
            <tr>
              <th className="p-3">No</th>
              <th className="p-3">Invoice</th>
              <th className="p-3">Product</th>
              <th className="p-3">Email</th>
              <th className="p-3">Pass</th>
              <th className="p-3">PIN</th>
              <th className="p-3">Durasi</th>
              <th className="p-3">Nilai</th>
              <th className="p-3">Pembeli</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>

          <tbody>

            {transactions.map((t,i)=>(

              <tr key={t.id} className="border-b">

                <td className="p-3">{i+1}</td>

                <td className="p-3">{t.invoice}</td>

                <td className="p-3">{t.products?.name}</td>

                <td className="p-3">{t.product_accounts?.email}</td>

                <td className="p-3">{t.product_accounts?.password}</td>

                <td className="p-3">{t.product_accounts?.pin}</td>

                <td className="p-3">{t.duration_days}</td>

                <td className="p-3">{t.price}</td>

                <td className="p-3">{t.buyer_username}</td>

                <td className="p-3">{getStatus(t)}</td>

                <td className="p-3">
                  {new Date(t.created_at).toLocaleString()}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  )
}