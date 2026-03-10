"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function UsersPage(){

const [users,setUsers] = useState<any[]>([])
const [page,setPage] = useState(1)
const [selectedUser,setSelectedUser] = useState<any>(null)

const limit = 50

async function loadUsers(){

const {data,error} = await supabase
.from("users")
.select("*")
.order("created_at",{ascending:false})
.range((page-1)*limit,page*limit-1)

if(error){
console.log(error)
return
}

setUsers(data || [])

}

async function deleteUser(id:string){

if(!confirm("Delete user?")) return

await supabase
.from("users")
.update({deleted_at:new Date()})
.eq("id",id)

loadUsers()

}

useEffect(()=>{
loadUsers()
},[page])

return(

<div className="space-y-6">

<h1 className="text-xl font-semibold">
User Management
</h1>

<div className="bg-white border rounded-lg overflow-x-auto">

<table className="w-full text-sm">

<thead className="border-b bg-gray-50">

<tr>

<th className="p-3 text-left">No</th>
<th className="p-3 text-left">ID Telegram</th>
<th className="p-3 text-left">Username</th>
<th className="p-3 text-left">Last Login</th>
<th className="p-3 text-left">Status</th>
<th className="p-3 text-left">View</th>
<th className="p-3 text-left">Edit</th>
<th className="p-3 text-left">Delete</th>

</tr>

</thead>

<tbody>

{users.map((u,i)=>(

<tr key={u.id} className="border-b">

<td className="p-3">
{(page-1)*limit+i+1}
</td>

<td className="p-3">
{u.telegram_id || "-"}
</td>

<td className="p-3">
{u.username || "-"}
</td>

<td className="p-3">
{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "-"}
</td>

<td className="p-3">

<span className={`px-2 py-1 rounded text-xs

${u.is_active
? "bg-green-100 text-green-700"
: "bg-yellow-100 text-yellow-700"}

`}>

{u.is_active ? "Active" : "Suspend"}

</span>

</td>

<td className="p-3">

<button
onClick={()=>setSelectedUser(u)}
className="text-blue-600"
>
View
</button>

</td>

<td className="p-3">
<button className="text-indigo-600">Edit</button>
</td>

<td className="p-3">

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

{/* VIEW USER CARD */}

{selectedUser && (

<div className="fixed inset-0 bg-black/30 flex items-center justify-center">

<div className="bg-white w-96 rounded-lg p-6 space-y-3 shadow-lg">

<h2 className="text-lg font-semibold">
User Details
</h2>

<div className="text-sm">

<p><b>User ID:</b> {selectedUser.id}</p>
<p><b>Telegram ID:</b> {selectedUser.telegram_id}</p>
<p><b>Username:</b> {selectedUser.username}</p>
<p><b>Email:</b> {selectedUser.email}</p>
<p><b>Phone:</b> {selectedUser.phone}</p>
<p><b>Balance:</b> Rp {selectedUser.balance}</p>

<p>
<b>Status:</b> {selectedUser.is_active ? "Active" : "Suspend"}
</p>

<p>
<b>Last Login:</b> {selectedUser.last_sign_in_at
? new Date(selectedUser.last_sign_in_at).toLocaleString()
: "-"}
</p>

</div>

<div className="pt-4 flex justify-end">

<button
onClick={()=>setSelectedUser(null)}
className="px-4 py-2 border rounded"
>
Close
</button>

</div>

</div>

</div>

)}

</div>

)

}