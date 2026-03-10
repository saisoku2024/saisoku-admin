"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function StocksPage(){

const [products,setProducts] = useState<any[]>([]);
const [stocks,setStocks] = useState<any[]>([]);

const [search,setSearch] = useState("");
const [filterProduct,setFilterProduct] = useState("");

const [email,setEmail] = useState("");
const [password,setPassword] = useState("");
const [profile,setProfile] = useState("");
const [pin,setPin] = useState("");
const [productId,setProductId] = useState("");

const [csvFile,setCsvFile] = useState<any>(null);

const [page,setPage] = useState(1);
const pageSize = 50;

const [stats,setStats] = useState({
available:0,
sold:0
});

useEffect(()=>{
fetchProducts();
fetchStocks();

const channel = supabase
.channel("stock-realtime")
.on(
"postgres_changes",
{
event:"*",
schema:"public",
table:"product_accounts"
},
()=>{
fetchStocks();
}
)
.subscribe();

return ()=>{
supabase.removeChannel(channel);
};

},[page,search,filterProduct]);

/* FETCH PRODUCTS */

const fetchProducts = async()=>{
const {data} = await supabase
.from("products")
.select("*");

setProducts(data || []);
};

/* FETCH STOCKS */

const fetchStocks = async()=>{

let query = supabase
.from("product_accounts")
.select(`
*,
products(name)
`)
.order("created_at",{ascending:false})
.range((page-1)*pageSize,(page*pageSize)-1);

if(search){
query = query.ilike("email",`%${search}%`);
}

if(filterProduct){
query = query.eq("product_id",filterProduct);
}

const {data} = await query;

const list = data || [];

setStocks(list);

const available = list.filter(x=>x.status==="available").length;
const sold = list.filter(x=>x.status==="sold").length;

setStats({available,sold});
};

/* ADD STOCK */

const addStock = async()=>{

if(!email || !password || !productId){
alert("Field wajib diisi");
return;
}

await supabase
.from("product_accounts")
.insert({
product_id:productId,
email,
password,
profile,
pin,
status:"available"
});

setEmail("");
setPassword("");
setProfile("");
setPin("");

fetchStocks();
};

/* EDIT STOCK */

const editStock = async(stock:any)=>{

const newEmail = prompt("Email",stock.email);
const newPass = prompt("Password",stock.password);
const newProfile = prompt("Profile",stock.profile);
const newPin = prompt("PIN",stock.pin);

if(!newEmail || !newPass) return;

await supabase
.from("product_accounts")
.update({
email:newEmail,
password:newPass,
profile:newProfile,
pin:newPin
})
.eq("id",stock.id);

fetchStocks();
};

/* BULK CSV */

const uploadCSV = async()=>{

if(!csvFile){
alert("Pilih file CSV dulu")
return
}

if(!productId){
alert("Pilih product dulu")
return
}

const text = await csvFile.text()

const rows = text.split("\n")

for(let i=1;i<rows.length;i++){

const clean = rows[i].replace("\r","").trim()

if(!clean) continue

const cols = clean.split(",")

if(cols.length < 4) continue

await supabase
.from("product_accounts")
.insert({
product_id:productId,
email:cols[0].trim(),
password:cols[1].trim(),
profile:cols[2].trim(),
pin:cols[3].trim(),
status:"available"
})

}

alert("Upload selesai")

fetchStocks()
}

/* DELETE */

const deleteStock = async(id:any)=>{

if(!confirm("Delete stock?")) return;

await supabase
.from("product_accounts")
.delete()
.eq("id",id);

fetchStocks();
};

const deleteAllStock = async()=>{

if(!confirm("Delete ALL stock?")) return;

await supabase
.from("product_accounts")
.delete()
.neq("id",0);

fetchStocks();
};

const deleteByProduct = async()=>{

if(!filterProduct){
alert("Pilih produk dulu");
return;
}

if(!confirm("Delete stock by product?")) return;

await supabase
.from("product_accounts")
.delete()
.eq("product_id",filterProduct);

fetchStocks();
};

/* PAGINATION */

const nextPage = ()=>{
if(stocks.length === pageSize){
setPage(page+1);
}
};

const prevPage = ()=>{
if(page>1){
setPage(page-1);
}
};

return(

<div className="space-y-4">

<h1 className="text-xl font-bold">
Stock Manager
</h1>

{/* STATS */}

<div className="flex gap-3">

<div className="bg-white px-4 py-2 rounded shadow text-xs">
Available: {stats.available}
</div>

<div className="bg-white px-4 py-2 rounded shadow text-xs">
Sold: {stats.sold}
</div>

</div>

{/* ADD STOCK */}

<div className="bg-white p-4 rounded shadow">

<h2 className="font-semibold mb-2 text-xs">
Add Manual Stock
</h2>

<div className="grid grid-cols-5 gap-2">

<select
className="border p-2 rounded text-xs"
value={productId}
onChange={(e)=>setProductId(e.target.value)}
>
<option value="">Product</option>
{products.map(p=>(
<option key={p.id} value={p.id}>
{p.name}
</option>
))}
</select>

<input
className="border p-2 rounded text-xs"
placeholder="Email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
/>

<input
className="border p-2 rounded text-xs"
placeholder="Password"
value={password}
onChange={(e)=>setPassword(e.target.value)}
/>

<input
className="border p-2 rounded text-xs"
placeholder="Profile"
value={profile}
onChange={(e)=>setProfile(e.target.value)}
/>

<input
className="border p-2 rounded text-xs"
placeholder="PIN"
value={pin}
onChange={(e)=>setPin(e.target.value)}
/>

</div>

<button
onClick={addStock}
className="mt-2 bg-black text-white px-3 py-1.5 rounded text-xs font-medium"
>
Add Stock
</button>

</div>

{/* BULK UPLOAD */}

<div className="bg-white p-4 rounded shadow">

<h2 className="font-semibold mb-2 text-xs">
Bulk Upload CSV
</h2>

<div className="flex gap-2 items-center">

<input
type="file"
accept=".csv"
onChange={(e)=>setCsvFile(e.target.files?.[0])}
className="border p-1 rounded text-xs"
/>

<button
onClick={uploadCSV}
className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium"
>
Upload
</button>

</div>

<p className="text-xs text-gray-500 mt-1">
format: email,password,profile,pin
</p>

</div>

{/* FILTER */}

<div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded shadow">

<input
className="border p-2 rounded text-xs"
placeholder="Search email..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
/>

<select
className="border p-2 rounded text-xs"
value={filterProduct}
onChange={(e)=>setFilterProduct(e.target.value)}
>
<option value="">All products</option>
{products.map(p=>(
<option key={p.id} value={p.id}>
{p.name}
</option>
))}
</select>

<button
onClick={deleteByProduct}
className="bg-red-500 text-white px-3 py-1.5 rounded text-xs font-medium"
>
Delete by product
</button>

<button
onClick={deleteAllStock}
className="bg-red-700 text-white px-3 py-1.5 rounded text-xs font-medium"
>
Delete ALL
</button>

</div>

{/* TABLE */}

<table className="w-full bg-white rounded shadow text-xs">

<thead>

<tr className="border-b bg-gray-50">

<th className="p-2 text-left">Product</th>
<th className="p-2 text-left">Email</th>
<th className="p-2 text-left">Profile</th>
<th className="p-2 text-left">PIN</th>
<th className="p-2 text-left">Status</th>
<th className="p-2 text-left">Action</th>

</tr>

</thead>

<tbody>

{stocks.map((s)=>(

<tr key={s.id} className="border-b hover:bg-gray-50">

<td className="p-2">{s.products?.name}</td>
<td className="p-2">{s.email}</td>
<td className="p-2">{s.profile}</td>
<td className="p-2">{s.pin}</td>
<td className="p-2">{s.status}</td>

<td className="p-2 flex gap-2">

<button
onClick={()=>editStock(s)}
className="bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-medium"
>
Edit
</button>

<button
onClick={()=>deleteStock(s.id)}
className="bg-red-500 text-white px-3 py-1.5 rounded text-xs font-medium"
>
Delete
</button>

</td>

</tr>

))}

</tbody>

</table>

{/* PAGINATION */}

<div className="flex gap-2 items-center">

<button
onClick={prevPage}
className="bg-gray-300 px-3 py-1.5 rounded text-xs font-medium"
>
Prev
</button>

<div className="text-xs">
Page {page}
</div>

<button
onClick={nextPage}
className="bg-black text-white px-3 py-1.5 rounded text-xs font-medium"
>
Next
</button>

</div>

</div>

);
}