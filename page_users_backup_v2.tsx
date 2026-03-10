"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function UsersPage(){

const [users,setUsers] = useState<any[]>([])
const [search,setSearch] = useState("")
const [page,setPage] = useState(1)

const limit = 50

async function loadUsers(){

let query = supabase
.from("users")
.select(`
id,
email,
phone,
status,
created_at,
last_sign_in_at
`)
.order("created_at",{ascending:false})
.range((page-1)*limit,page*limit-1)

if(search){
query = query.ilike("email",`%${search}%`)
}

const {data} = await query

if(!data){
setUsers([])
return
}

const result = await Promise.all(

data.map(async(u:any)=>{

const {data:trx} = await supabase
.from("transactions")
.select("price",{count:"exact"})
.eq("user_id",u.id)

let total = 0

trx?.forEach((t:any)=>{
total += t.price
})

return{
...u,
trx_count: trx?.length || 0,
trx_total: total
}

})

)

setUsers(result)

}

async function deleteUser(id:string){

if(!confirm("Delete user?")) return

await supabase
.from("users")
.delete()
.eq("id",id)

loadUsers()

}

async function toggleStatus(user:any){

const newStatus = user.status === "banned" ? "active" : "banned"

await supabase
.from("users")
.update({status:newStatus})
.eq("id",user.id)

loadUsers()

}

useEffect(()=>{

loadUsers()

},[page])

return(

<div className="space-y-6">

<h1 className="text-xl font-semibold">
Users
</h1>

{/* SEARCH */}

<div className="bg-white border rounded-lg p-4">

<input
placeholder="Search email..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
className="border rounded p-2 w-64"
/>

<button
onClick={loadUsers}
className="ml-2 bg-black text-white px-4 py-2 rounded"
>
Search
</button>

</div>

{/* TABLE */}

<div className="bg-white border rounded-lg overflow-x-auto">

<table className="w-full text-sm">

<thead className="border-b bg-gray-50">

<tr>

<th className="p-3 text-left">User ID</th>
<th className="p-3 text-left">Email</th>
<th className="p-3 text-left">Password</th>
<th className="p-3 text-left">Phone</th>
<th className="p-3 text-left">Created</th>
<th className="p-3 text-left">Last Login</th>
<th className="p-3 text-left">Jml Trx</th>
<th className="p-3 text-left">Jml Trx Rp</th>
<th className="p-3 text-left">Status</th>
<th className="p-3 text-left">Action</th>

</tr>

</thead>

<tbody>

{users.map((u)=>(

<tr key={u.id} className="border-b">

<td className="p-3 text-xs">
{u.id}
</td>

<td className="p-3">
{u.email || "-"}
</td>

<td className="p-3">
******
</td>

<td className="p-3">
{u.phone || "-"}
</td>

<td className="p-3">
{u.created_at ? new Date(u.created_at).toLocaleString() : "-"}
</td>

<td className="p-3">
{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "-"}
</td>

<td className="p-3">
{u.trx_count}
</td>

<td className="p-3">
Rp {u.trx_total}
</td>

<td className="p-3">

<button
onClick={()=>toggleStatus(u)}
className={`px-2 py-1 rounded text-xs

${u.status==="banned"
? "bg-red-100 text-red-700"
: "bg-green-100 text-green-700"}

`}
>

{u.status==="banned" ? "Banned" : "Active"}

</button>

</td>

<td className="p-3 flex gap-2">

<button
className="text-blue-600"
>
Edit
</button>

<button
onClick={()=>deleteUser(u.id)}
className="text-red-600"
>
Delete
</button>

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