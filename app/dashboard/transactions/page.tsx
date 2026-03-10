"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import * as XLSX from "xlsx"

export default function TransactionsPage(){

const [transactions,setTransactions] = useState<any[]>([])
const [products,setProducts] = useState<any[]>([])

const [filterBy,setFilterBy] = useState("invoice")
const [searchText,setSearchText] = useState("")

const [productFilter,setProductFilter] = useState("")

const [dateFrom,setDateFrom] = useState("")
const [dateTo,setDateTo] = useState("")

const [page,setPage] = useState(1)

const limit = 50

async function loadProducts(){

const {data} = await supabase
.from("products")
.select("id,name")

setProducts(data || [])

}

async function loadTransactions(){

let query = supabase
.from("transactions")
.select(`
*,
products(name),
product_accounts(email,password,pin,sold_at)
`)
.order("created_at",{ascending:false})
.range((page-1)*limit,page*limit-1)

if(filterBy==="product" && productFilter){
query = query.eq("product_id",productFilter)
}

if(filterBy==="invoice" && searchText){
query = query.ilike("invoice",`%${searchText}%`)
}

if(filterBy==="buyer" && searchText){
query = query.ilike("buyer_username",`%${searchText}%`)
}

const {data} = await query

setTransactions(data || [])

}

function getStatus(t:any){

if(!t.product_accounts?.sold_at) return "active"

const sold = new Date(t.product_accounts.sold_at)
const now = new Date()

const days = Math.floor(
(now.getTime()-sold.getTime())/(1000*60*60*24)
)

const duration = t.duration_days || 30

if(days <= duration-4) return "active"
if(days <= duration) return "expiring"

return "expired"

}

async function exportExcel(){

let query = supabase
.from("transactions")
.select(`
*,
products(name),
product_accounts(email,password,pin,sold_at)
`)
.order("created_at",{ascending:false})

if(dateFrom){
query = query.gte("created_at",dateFrom)
}

if(dateTo){
query = query.lte("created_at",dateTo)
}

const {data} = await query

const rows = data?.map((t:any)=>({

Invoice:t.invoice,
Product:t.products?.name,
Email:t.product_accounts?.email,
Password:t.product_accounts?.password,
PIN:t.product_accounts?.pin,
Duration:t.duration_days,
Price:t.price,
Buyer:t.buyer_username,
Status:getStatus(t),
Date:new Date(t.created_at).toLocaleString()

})) || []

const worksheet = XLSX.utils.json_to_sheet(rows)

const workbook = XLSX.utils.book_new()

XLSX.utils.book_append_sheet(workbook,worksheet,"Transactions")

XLSX.writeFile(workbook,"transactions.xlsx")

}

useEffect(()=>{

loadProducts()

},[])

useEffect(()=>{

loadTransactions()

},[page])

return(

<div className="space-y-6">

<h1 className="text-xl font-semibold">
Transactions
</h1>

{/* SEARCH FILTER */}

<div className="bg-white border rounded-lg p-4 space-y-3">

<div className="grid grid-cols-3 gap-3">

<select
value={filterBy}
onChange={(e)=>setFilterBy(e.target.value)}
className="border rounded p-2"
>

<option value="invoice">
Transaction ID
</option>

<option value="buyer">
User Telegram
</option>

<option value="product">
Product
</option>

</select>

{filterBy==="product" ? (

<select
value={productFilter}
onChange={(e)=>setProductFilter(e.target.value)}
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

) : (

<input
placeholder="Search text..."
value={searchText}
onChange={(e)=>setSearchText(e.target.value)}
className="border rounded p-2"
/>

)}

<button
onClick={loadTransactions}
className="bg-black text-white px-4 py-2 rounded"
>
Search
</button>

</div>

</div>

{/* EXPORT EXCEL */}

<div className="bg-white border rounded-lg p-4">

<div className="grid grid-cols-3 gap-3">

<input
type="date"
value={dateFrom}
onChange={(e)=>setDateFrom(e.target.value)}
className="border rounded p-2"
/>

<input
type="date"
value={dateTo}
onChange={(e)=>setDateTo(e.target.value)}
className="border rounded p-2"
/>

<button
onClick={exportExcel}
className="bg-black text-white px-4 py-2 rounded"
>
Export Excel
</button>

</div>

</div>

{/* TABLE */}

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

<td className="p-3">{(page-1)*limit+i+1}</td>
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

{/* PAGINATION */}

<div className="flex gap-2">

<button
onClick={()=>setPage(page-1)}
disabled={page===1}
className="border px-3 py-1 rounded"
>
Prev
</button>

<span>
Page {page}
</span>

<button
onClick={()=>setPage(page+1)}
className="border px-3 py-1 rounded"
>
Next
</button>

</div>

</div>

)

}