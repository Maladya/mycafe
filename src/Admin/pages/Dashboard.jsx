import { useEffect, useState } from "react";
import {
  UtensilsCrossed,
  RefreshCw,
  Loader2,
  Table2,
  Tag,
} from "lucide-react";
import { useAdmin } from "../AdminPanel";
import { getCatColor, isPromoActive } from "../data/constants";

const API_URL = (import.meta.env.VITE_API_URL ?? "http://192.168.1.13:3000").replace(/\/$/, "");

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  // ── Ambil data dari AdminContext (sudah di-fetch di AdminPanel) ─────────
  const { orders, menuItems, promoCodes, tables, loading, fetchAll } = useAdmin();
  
  // Laporan state
  const [period, setPeriod] = useState("hari");
  const [laporanData, setLaporanData] = useState(null);
  const [laporanLoading, setLaporanLoading] = useState(true);
  const [laporanError, setLaporanError] = useState(null);

  // ── Fetch laporan dari backend ──
  const fetchLaporan = async (selectedPeriod) => {
    setLaporanLoading(true);
    setLaporanError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/laporan?filter=${selectedPeriod}`, {
        headers: { 
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        },
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || `HTTP ${res.status}`);
      }
      setLaporanData(data.data || data);
    } catch (err) {
      setLaporanError(err.message || "Gagal memuat laporan");
    } finally {
      setLaporanLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporan(period);
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { 
    total_pendapatan = "0", 
    total_pesanan = 0, 
    rata_rata_order = "0",
    kategori_terlaris = [],
    periode = {}
  } = laporanData || {};

  // Parse string ke number
  const totalRevenue = parseFloat(total_pendapatan) || 0;
  const totalOrders = total_pesanan || 0;
  const avgOrder = parseFloat(rata_rata_order) || 0;

  // Ambil kategori terlaris pertama
  const topCategory = kategori_terlaris[0] || null;

  const topMenus = [...(menuItems ?? [])].sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0)).slice(0, 8);
  const maxSold = Math.max(...topMenus.map(m => m.sold ?? 0), 1);

  const totalTables = (tables ?? []).length;
  const activePromoCount = (promoCodes ?? []).filter(p => isPromoActive(p)).length;

  const stats = [
    {
      label: "Total Menu",
      value: (menuItems ?? []).length,
      icon: <UtensilsCrossed size={20} />,
      color: "from-blue-500 to-indigo-600",
    },
    {
      label: "Total Meja",
      value: totalTables,
      icon: <Table2 size={20} />,
      color: "from-teal-500 to-emerald-600",
    },
    {
      label: "Total Promo",
      value: activePromoCount,
      icon: <Tag size={20} />,
      color: "from-purple-500 to-pink-500",
    },
  ];

  // tanggal hari ini
  const todayStr = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  return (
    <div className="p-4 lg:p-6 space-y-6">

      {/* Title + Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-gray-900">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5 capitalize">{todayStr}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {["hari","minggu","bulan"].map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${period===p?"bg-white shadow text-gray-900":"text-gray-500 hover:text-gray-700"}`}>{p}</button>
            ))}
          </div>
          <button
            onClick={fetchAll}
            className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-amber-100 transition-all"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Dashboard Sebelumnya: hanya total */}
      <div className="grid grid-cols-3 gap-3 lg:gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-md text-white mb-3`}>
              {s.icon}
            </div>
            <p className="text-2xl font-black text-gray-900 leading-none">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="h-px bg-gray-200" />

      {/* Laporan (di bawah) */}

      {laporanLoading && !laporanError && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 size={40} className="animate-spin text-amber-500 mb-3" />
          <p className="text-sm text-gray-400">Memuat laporan...</p>
        </div>
      )}

      {/* Laporan Error */}
      {laporanError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <p className="text-sm text-red-600">{laporanError}</p>
          <button onClick={() => fetchLaporan(period)} className="mt-2 text-xs font-semibold text-red-700 underline">Coba Lagi</button>
        </div>
      )}

      {/* Laporan KPI Cards */}
      {!laporanLoading && !laporanError && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-green-50 border-green-200 rounded-2xl border p-4">
            <span className="text-2xl">💰</span>
            <p className="font-black text-gray-900 text-xl mt-2 leading-none">Rp{totalRevenue.toLocaleString("id-ID")}</p>
            <p className="text-xs text-gray-500 mt-1">Total Pendapatan</p>
            <p className="text-[10px] text-gray-400">per {period} ({periode.start?.split(' ')[0] || ''})</p>
          </div>
          <div className="bg-blue-50 border-blue-200 rounded-2xl border p-4">
            <span className="text-2xl">📋</span>
            <p className="font-black text-gray-900 text-xl mt-2 leading-none">{totalOrders}</p>
            <p className="text-xs text-gray-500 mt-1">Total Pesanan</p>
            <p className="text-[10px] text-gray-400">transaksi</p>
          </div>
          <div className="bg-amber-50 border-amber-200 rounded-2xl border p-4">
            <span className="text-2xl">📊</span>
            <p className="font-black text-gray-900 text-xl mt-2 leading-none">Rp{avgOrder.toLocaleString("id-ID")}</p>
            <p className="text-xs text-gray-500 mt-1">Rata-rata Order</p>
            <p className="text-[10px] text-gray-400">per transaksi</p>
          </div>
          <div className="bg-purple-50 border-purple-200 rounded-2xl border p-4">
            <span className="text-2xl">🏆</span>
            <p className="font-black text-gray-900 text-xl mt-2 leading-none">{topCategory?.nama_kategori || "-"}</p>
            <p className="text-xs text-gray-500 mt-1">Kategori Terlaris</p>
            <p className="text-[10px] text-gray-400">{parseInt(topCategory?.total_qty) || 0} terjual</p>
          </div>
        </div>
      )}

      {/* Kategori Terlaris */}
      {!laporanLoading && !laporanError && kategori_terlaris.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Kategori Terlaris — Per {period.charAt(0).toUpperCase() + period.slice(1)}</h2>
          <div className="space-y-3">
            {kategori_terlaris.map((kat, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 w-4 flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-gray-900 truncate">{kat.nama_kategori}</p>
                    <span className="text-xs font-bold text-gray-700 ml-2 flex-shrink-0">{parseInt(kat.total_qty)} terjual</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                      style={{ width: `${Math.min((parseInt(kat.total_qty) / (parseInt(kategori_terlaris[0]?.total_qty) || 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">Rp{parseFloat(kat.total_revenue).toLocaleString("id-ID")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
