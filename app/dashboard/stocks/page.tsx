"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function StocksPage() {

  const [products, setProducts] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [filterProduct, setFilterProduct] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState("");
  const [pin, setPin] = useState("");
  const [productId, setProductId] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editStockData, setEditStockData] = useState<any>(null);

  const [csvFile, setCsvFile] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [stats, setStats] = useState({
    available: 0,
    sold: 0
  });

  useEffect(() => {

    fetchProducts();
    fetchStocks();

    const channel = supabase
      .channel("stock-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "product_accounts"
        },
        () => fetchStocks()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };

  }, [page, search, filterProduct]);

  const fetchProducts = async () => {

    const { data } = await supabase
      .from("products")
      .select("*")
      .order("name", { ascending: true });

    setProducts(data || []);

  };

  const fetchStocks = async () => {

    let query = supabase
      .from("product_accounts")
      .select(`*,products(name)`)
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, (page * pageSize) - 1);

    if (search) {
      query = query.ilike("email", `%${search}%`);
    }

    if (filterProduct) {
      query = query.eq("product_id", filterProduct);
    }

    const { data } = await query;

    const list = data || [];

    setStocks(list);

    const available = list.filter(x => x.status === "available").length;
    const sold = list.filter(x => x.status === "sold").length;

    setStats({ available, sold });

  };

  const updateStock = async () => {

    await supabase
      .from("product_accounts")
      .update({
        email: editStockData.email,
        password: editStockData.password,
        profile: editStockData.profile,
        pin: editStockData.pin
      })
      .eq("id", editStockData.id);

    setEditStockData(null);
    fetchStocks();

  };

  const deleteStock = async (id: any) => {

    if (!confirm("Delete stock?")) return;

    await supabase
      .from("product_accounts")
      .delete()
      .eq("id", id);

    fetchStocks();

  };

  const nextPage = () => {
    if (stocks.length === pageSize) setPage(page + 1);
  };

  const prevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  return (

<div className="min-h-screen bg-gray-100 p-8">

<div className="max-w-6xl mx-auto space-y-6">

<h1 className="text-2xl font-bold">Stock Management</h1>

<div className="flex gap-4">

<div className="bg-white px-4 py-2 rounded shadow">
Available : {stats.available}
</div>

<div className="bg-white px-4 py-2 rounded shadow">
Sold : {stats.sold}
</div>

</div>

<div className="bg-white p-4 rounded shadow flex gap-3">

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

{products.map(p => (
<option key={p.id} value={p.id}>
{p.name}
</option>
))}

</select>

</div>

<table className="w-full bg-white rounded shadow">

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
<tr key={s.id} className="border-b text-sm">

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
Edit
</button>

<button
onClick={()=>deleteStock(s.id)}
className="bg-red-500 text-white px-3 py-1 rounded"
>
Delete
</button>

</td>

</tr>
))}

</tbody>

</table>

<div className="flex gap-3 items-center">

<button
onClick={prevPage}
className="bg-gray-300 px-4 py-2 rounded"
>
Prev
</button>

<div>Page {page}</div>

<button
onClick={nextPage}
className="bg-black text-white px-4 py-2 rounded"
>
Next
</button>

</div>

</div>

{editStockData && (

<div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">

<div className="bg-white p-6 rounded-xl w-[420px] shadow-xl space-y-4">

<h2 className="font-semibold text-lg">Edit Stock</h2>

<div>
<label className="text-sm font-medium">Email</label>
<input
className="border p-2 rounded w-full"
value={editStockData.email}
onChange={(e)=>setEditStockData({
...editStockData,
email:e.target.value
})}
/>
</div>

<div>
<label className="text-sm font-medium">Password</label>
<input
className="border p-2 rounded w-full"
value={editStockData.password}
onChange={(e)=>setEditStockData({
...editStockData,
password:e.target.value
})}
/>
</div>

<div>
<label className="text-sm font-medium">Profile</label>
<input
className="border p-2 rounded w-full"
value={editStockData.profile}
onChange={(e)=>setEditStockData({
...editStockData,
profile:e.target.value
})}
/>
</div>

<div>
<label className="text-sm font-medium">PIN</label>
<input
className="border p-2 rounded w-full"
value={editStockData.pin}
onChange={(e)=>setEditStockData({
...editStockData,
pin:e.target.value
})}
/>
</div>

<div className="flex justify-end gap-3 pt-2">

<button
onClick={()=>setEditStockData(null)}
className="px-4 py-2 border rounded"
>
Cancel
</button>

<button
onClick={updateStock}
className="px-4 py-2 bg-blue-600 text-white rounded"
>
Update
</button>

</div>

</div>

</div>

)}

</div>

);

}