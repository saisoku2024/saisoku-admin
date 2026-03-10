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

  const [csvFile, setCsvFile] = useState<File | null>(null);

  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [stats, setStats] = useState({
    available: 0,
    sold: 0,
  });

  /* INIT: fetch data awal */
  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchStocks();
  }, [page, search, filterProduct]);

  /* INIT: realtime listener sekali saja */
  useEffect(() => {
    const channel = supabase
      .channel("stock-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "product_accounts",
        },
        () => {
          fetchStocks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* FETCH PRODUCTS */
  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error(error);
      alert("Gagal load products: " + error.message);
      return;
    }

    setProducts(data || []);
  };

  /* FETCH STOCK */
  const fetchStocks = async () => {
    let query = supabase
      .from("product_accounts")
      // sesuaikan relasi: kalau FK bernama products, pakai products(name),
      // kalau relasinya products:product_id, ganti jadi .select("*, products:product_id(name)")
      .select("*, products(name)")
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (search) {
      query = query.ilike("email", `%${search}%`);
    }

    if (filterProduct) {
      query = query.eq("product_id", filterProduct);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      alert("Gagal load stocks: " + error.message);
      return;
    }

    const list = data || [];
    setStocks(list);

    const available = list.filter((x: any) => x.status === "available").length;
    const sold = list.filter((x: any) => x.status === "sold").length;

    setStats({ available, sold });
  };

  /* ADD STOCK (manual) */
  const addStock = async () => {
    if (!email || !password || !productId) {
      alert("Product, email, dan password wajib diisi");
      return;
    }

    const { error } = await supabase.from("product_accounts").insert({
      product_id: productId,
      email,
      password,
      profile,
      pin,
      status: "available",
    });

    if (error) {
      console.error(error);
      alert("Gagal menambah stock: " + error.message);
      return;
    }

    setEmail("");
    setPassword("");
    setProfile("");
    setPin("");

    fetchStocks();
  };

  /* UPDATE STOCK */
  const updateStock = async () => {
    if (!editStockData) return;

    const { error } = await supabase
      .from("product_accounts")
      .update({
        email: editStockData.email,
        password: editStockData.password,
        profile: editStockData.profile,
        pin: editStockData.pin,
      })
      .eq("id", editStockData.id);

    if (error) {
      console.error(error);
      alert("Gagal update stock: " + error.message);
      return;
    }

    setEditStockData(null);
    fetchStocks();
  };

  /* CSV UPLOAD */
  const uploadCSV = async () => {
    if (!csvFile) {
      alert("Pilih file CSV dulu");
      return;
    }

    if (!productId) {
      alert("Pilih product dulu");
      return;
    }

    const text = await csvFile.text();
    const rows = text.split("\n");

    const inserts: any[] = [];

    for (let i = 1; i < rows.length; i++) {
      const clean = rows[i].replace("\r", "").trim();
      if (!clean) continue;

      const cols = clean.split(",");

      // antisipasi kolom kurang
      const emailCol = cols[0]?.trim() || "";
      const passwordCol = cols[1]?.trim() || "";
      const profileCol = cols[2]?.trim() || "";
      const pinCol = cols[3]?.trim() || "";

      if (!emailCol || !passwordCol) continue; // minimal email+password

      inserts.push({
        product_id: productId,
        email: emailCol,
        password: passwordCol,
        profile: profileCol,
        pin: pinCol,
        status: "available",
      });
    }

    if (!inserts.length) {
      alert("Tidak ada data valid di CSV");
      return;
    }

    const { error } = await supabase
      .from("product_accounts")
      .insert(inserts);

    if (error) {
      console.error(error);
      alert("Gagal upload CSV: " + error.message);
      return;
    }

    alert("Upload selesai");
    fetchStocks();
  };

  /* DELETE */
  const deleteStock = async (id: any) => {
    if (!confirm("Delete stock?")) return;

    const { error } = await supabase
      .from("product_accounts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Gagal delete stock: " + error.message);
      return;
    }

    fetchStocks();
  };

  const deleteAllStock = async () => {
    if (!confirm("Delete ALL stock?")) return;

    const { error } = await supabase
      .from("product_accounts")
      .delete()
      .not("id", "is", null);

    if (error) {
      console.error(error);
      alert("Gagal delete ALL: " + error.message);
      return;
    }

    fetchStocks();
  };

  const deleteByProduct = async () => {
    if (!filterProduct) {
      alert("Pilih produk dulu");
      return;
    }

    if (!confirm("Delete semua stock untuk produk ini?")) return;

    const { error } = await supabase
      .from("product_accounts")
      .delete()
      .eq("product_id", filterProduct);

    if (error) {
      console.error(error);
      alert("Gagal delete by product: " + error.message);
      return;
    }

    fetchStocks();
  };

  /* PAGINATION */
  const nextPage = () => {
    if (stocks.length === pageSize) setPage((p) => p + 1);
  };

  const prevPage = () => {
    setPage((p) => (p > 1 ? p - 1 : p));
  };

  /* UI */
  return (
    <div className="min-h-screen relative bg-gradient-to-br from-gray-50 via-white to-gray-100 py-8 overflow-hidden">
      {/* BACKGROUND PREMIUM APPS */}
      <div className="absolute inset-0 pointer-events-none opacity-20 blur-2xl flex flex-wrap gap-20 justify-center items-center">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg"
          className="h-20"
        />
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg"
          className="h-16"
        />
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_Logo_2017.svg"
          className="h-16"
        />
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.png"
          className="h-16"
        />
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg"
          className="h-16"
        />
      </div>

      <div className="max-w-6xl mx-auto space-y-5 relative z-10">
        <h1 className="text-2xl font-bold">Stock Management</h1>

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
          onClick={() => setShowAddModal(true)}
          className="bg-black text-white px-4 py-2 rounded"
        >
          + Add Stock
        </button>

        {/* CSV */}
        <div className="bg-white p-5 rounded-xl shadow">
          <h2 className="font-semibold mb-3">Bulk Upload CSV</h2>

          <div className="flex flex-wrap gap-3 items-center">
            <select
              className="border p-2 rounded"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">Select Product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
            />

            <button
              onClick={uploadCSV}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Upload
            </button>
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
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />

          <select
            className="border p-2 rounded"
            value={filterProduct}
            onChange={(e) => {
              setPage(1);
              setFilterProduct(e.target.value);
            }}
          >
            <option value="">All Products</option>

            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={deleteByProduct}
            className="bg-red-500 text-white px-3 py-2 rounded"
          >
            Delete by Product
          </button>

          <button
            onClick={deleteAllStock}
            className="bg-red-700 text-white px-3 py-2 rounded"
          >
            Delete ALL
          </button>
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
            {stocks.map((s: any) => (
              <tr key={s.id} className="border-b hover:bg-gray-50 text-sm">
                <td className="p-3">{s.products?.name}</td>
                <td className="p-3">{s.email}</td>
                <td className="p-3">{s.profile}</td>
                <td className="p-3">{s.pin}</td>
                <td className="p-3">{s.status}</td>

                <td className="p-3 flex gap-2">
                  <button
                    onClick={() => setEditStockData(s)}
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteStock(s.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {stocks.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="p-4 text-center text-gray-500 text-sm"
                >
                  Tidak ada data
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="flex gap-3 items-center mt-2">
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

      {/* ADD / EDIT STOCK MODAL */}
      {(showAddModal || editStockData) && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white p-6 rounded-xl w-[420px] shadow-xl space-y-4">
            <h2 className="font-semibold">
              {editStockData ? "Edit Stock" : "Add Stock"}
            </h2>

            <select
              className="border p-2 rounded w-full"
              value={editStockData ? editStockData.product_id : productId}
              onChange={(e) =>
                editStockData
                  ? setEditStockData({
                      ...editStockData,
                      product_id: e.target.value,
                    })
                  : setProductId(e.target.value)
              }
              disabled={!!editStockData}
            >
              <option value="">Select Product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <input
              className="border p-2 rounded w-full"
              placeholder="Email"
              value={editStockData ? editStockData.email : email}
              onChange={(e) =>
                editStockData
                  ? setEditStockData({
                      ...editStockData,
                      email: e.target.value,
                    })
                  : setEmail(e.target.value)
              }
            />

            <input
              className="border p-2 rounded w-full"
              placeholder="Password"
              value={editStockData ? editStockData.password : password}
              onChange={(e) =>
                editStockData
                  ? setEditStockData({
                      ...editStockData,
                      password: e.target.value,
                    })
                  : setPassword(e.target.value)
              }
            />

            <input
              className="border p-2 rounded w-full"
              placeholder="Profile"
              value={editStockData ? editStockData.profile : profile}
              onChange={(e) =>
                editStockData
                  ? setEditStockData({
                      ...editStockData,
                      profile: e.target.value,
                    })
                  : setProfile(e.target.value)
              }
            />

            <input
              className="border p-2 rounded w-full"
              placeholder="PIN"
              value={editStockData ? editStockData.pin : pin}
              onChange={(e) =>
                editStockData
                  ? setEditStockData({
                      ...editStockData,
                      pin: e.target.value,
                    })
                  : setPin(e.target.value)
              }
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditStockData(null);
                }}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>

              {editStockData ? (
                <button
                  onClick={updateStock}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Update
                </button>
              ) : (
                <button
                  onClick={() => {
                    addStock();
                    setShowAddModal(false);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  Add Stock
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
