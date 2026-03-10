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

const [showAddModal,setShowAddModal] = useState(false);
const [editStockData,setEditStockData] = useState<any>(null);

const [csvFile,setCsvFile] = useState<any>(null);

const [page,setPage] = useState(1);
const pageSize = 50;

const [stats,setStats] = useState({
available:0,
sold:0
});

/* INIT */

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
()=> fetchStocks()
)
.subscribe();

return () => {
  void supabase.removeChannel(channel);
};

},[page,search,filterProduct]);

/* FETCH PRODUCTS */

const fetchProducts = async()=>{

const {data} = await supabase
.from("products")
.select("*")
.order("name",{ascending:true});

setProducts(data || []);

};

/* FETCH STOCK */

const fetchStocks = async()=>{

let query = supabase
.from("product_accounts")
.select(`*,products(name)`)
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

/* UPDATE STOCK */

const updateStock = async()=>{

await supabase
.from("product_accounts")
.update({
email:editStockData.email,
password:editStockData.password,
profile:editStockData.profile,
pin:editStockData.pin
})
.eq("id",editStockData.id);

setEditStockData(null);
fetchStocks();

};

/* CSV UPLOAD */

const uploadCSV = async()=>{

if(!csvFile){
alert("Pilih file CSV dulu");
return;
}

if(!productId){
alert("Pilih product dulu");
return;
}

const text = await csvFile.text();
const rows = text.split("\n");

for(let i=1;i<rows.length;i++){

const clean = rows[i].replace("\r","").trim();
if(!clean) continue;

const cols = clean.split(",");

await supabase
.from("product_accounts")
.insert({
product_id:productId,
email:cols,
password:cols,
profile:cols,
pin:cols,
status:"available"
});

}

alert("Upload selesai");
fetchStocks();

};

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
.not("id","is",null);

fetchStocks();

};

const deleteByProduct = async()=>{

if(!filterProduct){
alert("Pilih produk dulu");
return;
}

await supabase
.from("product_accounts")
.delete()
.eq("product_id",filterProduct);

fetchStocks();

};

/* PAGINATION */

const nextPage = ()=>{
if(stocks.length === pageSize) setPage(page+1);
};

const prevPage = ()=>{
if(page>1) setPage(page-1);
};

/* UI */

return(

<div className="min-h-screen relative bg-gradient-to-br from-gray-50 via-white to-gray-100 py-8 overflow-hidden">

{/* BACKGROUND PREMIUM APPS */}

<div className="absolute inset-0 pointer-events-none opacity-20 blur-2xl flex flex-wrap gap-20 justify-center items-center">

<img src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" className="h-20"/>
<img src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg" className="h-16"/>
<img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_Logo_2017.svg" className="h-16"/>
<img src="https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.png" className="h-16"/>
<img src="https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg" className="h-16"/>

</div>

<div className="max-w-6xl mx-auto space-y-5 relative z-10">

<h1 className="text-2xl font-bold">
Stock Management
</h1>

{/* STATS */}

<div className="flex gap-4">

<div className="bg-white px-5 py-3 rounded shadow text-sm font-medium">
Available : {stats.available}
</div>

<div className="bg-white px-5 py-3 rounded shadow text-sm font-medium">
Sold : {stats.sold}
</div>

</div>

{/* ADD STOCK BUTTON */}

<button
onClick={()=>setShowAddModal(true)}
className="bg-black text-white px-4 py-2 rounded"

>

* Add Stock

  </button>

{/* CSV */}

<div className="bg-white p-5 rounded-xl shadow">

<h2 className="font-semibold mb-3">
Bulk Upload CSV
</h2>

<div className="flex gap-3">

<input
type="file"
accept=".csv"
onChange={(e)=>setCsvFile(e.target.files?.[0])}
/>

<button
onClick={uploadCSV}
className="bg-blue-600 text-white px-4 py-2 rounded"

>

Upload </button>

</div>

<p className="text-xs text-gray-500 mt-2">
format: email,password,profile,pin
</p>

</div>

{/* FILTER */}

<div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl shadow">

<input
className="border p-2 rounded"
placeholder="Search email..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
/>

<select
className="border p-2 rounded"
value={filterProduct}
onChange={(e)=>setFilterProduct(e.target.value)}

>

<option value="">All Products</option>

{products.map(p=>(

<option key={p.id} value={p.id}>{p.name}</option>
))}

</select>

<button
onClick={deleteByProduct}
className="bg-red-500 text-white px-3 py-2 rounded"

>

Delete by Product </button>

<button
onClick={deleteAllStock}
className="bg-red-700 text-white px-3 py-2 rounded"

>

Delete ALL </button>

</div>

{/* TABLE */}

<table className="w-full bg-white rounded-xl shadow">

<thead>

<tr className="border-b bg-gray-50 text-sm">

<th className="p-3 text-left">Product</th>
<th className="p-3 text-left">Email</th>
<th className="p-3 text-left">Profile</th>
<th className="p-3 text-left">PIN</th>
<th className="p-3 text-left">Status</th>
<th className="p-3 text-left">Action</th>

</tr>

</thead>

<tbody>

{stocks.map((s)=>(

<tr key={s.id} className="border-b hover:bg-gray-50 text-sm">

<td className="p-3">{s.products?.name}</td>
<td className="p-3">{s.email}</td>
<td className="p-3">{s.profile}</td>
<td className="p-3">{s.pin}</td>
<td className="p-3">{s.status}</td>

<td className="p-3 flex gap-2">

<button
onClick={()=>setEditStockData(s)}
className="bg-blue-500 text-white px-3 py-1 rounded"

>

Edit </button>

<button
onClick={()=>deleteStock(s.id)}
className="bg-red-500 text-white px-3 py-1 rounded"

>

Delete </button>

</td>

</tr>

))}

</tbody>

</table>

{/* PAGINATION */}

<div className="flex gap-3 items-center">

<button
onClick={prevPage}
className="bg-gray-300 px-4 py-2 rounded"

>

Prev </button>

<div>Page {page}</div>

<button
onClick={nextPage}
className="bg-black text-white px-4 py-2 rounded"

>

Next </button>

</div>

</div>

{/* ADD STOCK MODAL */}

{showAddModal && (

<div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">

<div className="bg-white p-6 rounded-xl w-[420px] shadow-xl space-y-4">

<h2 className="font-semibold text-lg">
Add Stock
</h2>

<div>
<label className="text-sm font-medium">Product</label>
<select
className="border p-2 rounded w-full"
value={productId}
onChange={(e)=>setProductId(e.target.value)}
>
<option value="">Select Product</option>
{products.map(p=>(
<option key={p.id} value={p.id}>{p.name}</option>
))}
</select>
</div>

<div>
<label className="text-sm font-medium">Email</label>
<input
className="border p-2 rounded w-full"
value={email}
onChange={(e)=>setEmail(e.target.value)}
/>
</div>

<div>
<label className="text-sm font-medium">Password</label>
<input
className="border p-2 rounded w-full"
value={password}
onChange={(e)=>setPassword(e.target.value)}
/>
</div>

<div>
<label className="text-sm font-medium">Profile</label>
<input
className="border p-2 rounded w-full"
value={profile}
onChange={(e)=>setProfile(e.target.value)}
/>
</div>

<div>
<label className="text-sm font-medium">PIN</label>
<input
className="border p-2 rounded w-full"
value={pin}
onChange={(e)=>setPin(e.target.value)}
/>
</div>

<div className="flex justify-end gap-3 pt-2">

<button
onClick={()=>setShowAddModal(false)}
className="px-4 py-2 border rounded"
>
Cancel
</button>

<button
onClick={()=>{
addStock()
setShowAddModal(false)
}}
className="px-4 py-2 bg-green-600 text-white rounded"
>
Add Stock
</button>

</div>

</div>

</div>

)}
