"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SalesPage() {
  const [stats, setStats] = useState({
    today: 0,
    month: 0,
    year: 0,
    revenue: 0,
  });

  const [recent, setRecent] = useState<any[]>([]);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchRecent();
  }, []);

  const fetchStats = async () => {
    const todayStart = new Date().toISOString().split("T")[0];

    const { count: today, error: todayError } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart);

    if (todayError) console.error("today count error:", todayError);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { count: month, error: monthError } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthStart.toISOString());

    if (monthError) console.error("month count error:", monthError);

    const yearStart = new Date(new Date().getFullYear(), 0, 1);

    const { count: year, error: yearError } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", yearStart.toISOString());

    if (yearError) console.error("year count error:", yearError);

    const { data: revData, error: revError } = await supabase
      .from("transactions")
      .select("amount");

    if (revError) console.error("revenue error:", revError);

    let revenue = 0;
    revData?.forEach((r: any) => {
      revenue += Number(r.amount);
    });

    setStats({
      today: today || 0,
      month: month || 0,
      year: year || 0,
      revenue,
    });
  };

  const fetchRecent = async () => {
    const { data, error } = await supabase
      .from("transactions")
      .select("id, user_id, amount, type, note, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("fetchRecent error:", error);
      return;
    }

    setRecent(data || []);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className={`${dark ? "bg-gray-900 text-white" : "bg-gray-100 text-black"} min-h-screen p-8`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sales Dashboard</h1>

        <div className="flex gap-3">
          <button
            onClick={() => setDark(!dark)}
            className="px-4 py-2 rounded bg-gray-800 text-white"
          >
            {dark ? "Light Mode" : "Dark Mode"}
          </button>

          <button
            onClick={logout}
            className="px-4 py-2 rounded bg-red-500 text-white"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className={`${dark ? "bg-gray-800" : "bg-white"} p-6 rounded-xl shadow`}>
          <div className="text-gray-400">Sales Today</div>
          <div className="text-2xl font-bold">{stats.today}</div>
        </div>

        <div className={`${dark ? "bg-gray-800" : "bg-white"} p-6 rounded-xl shadow`}>
          <div className="text-gray-400">Sales Month</div>
          <div className="text-2xl font-bold">{stats.month}</div>
        </div>

        <div className={`${dark ? "bg-gray-800" : "bg-white"} p-6 rounded-xl shadow`}>
          <div className="text-gray-400">Sales Year</div>
          <div className="text-2xl font-bold">{stats.year}</div>
        </div>

        <div className={`${dark ? "bg-gray-800" : "bg-white"} p-6 rounded-xl shadow`}>
          <div className="text-gray-400">Revenue</div>
          <div className="text-2xl font-bold">Rp {stats.revenue.toLocaleString()}</div>
        </div>
      </div>

      <div className={`${dark ? "bg-gray-800" : "bg-white"} rounded-xl shadow p-6`}>
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>

        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">No</th>
              <th className="p-2 text-left">ID Transaksi</th>
              <th className="p-2 text-left">Tanggal Penjualan</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">Note</th>
              <th className="p-2 text-left">Nominal</th>
              <th className="p-2 text-left">ID Pembeli</th>
            </tr>
          </thead>

          <tbody>
            {recent.map((t, index) => (
              <tr key={t.id} className="border-b">
                <td className="p-2">{index + 1}</td>
                <td className="p-2">{t.id}</td>
                <td className="p-2">{new Date(t.created_at).toLocaleString()}</td>
                <td className="p-2">{t.type}</td>
                <td className="p-2">{t.note}</td>
                <td className="p-2">Rp {Number(t.amount).toLocaleString()}</td>
                <td className="p-2">{t.user_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}