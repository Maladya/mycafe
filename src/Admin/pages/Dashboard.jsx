import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  UtensilsCrossed,
  RefreshCw,
  Table2,
  Tag,
  CreditCard,
} from "lucide-react";
import { useAdmin } from "../adminContext";
import { isPromoActive } from "../data/constants";

const API_URL = (import.meta.env.VITE_API_URL ?? "https://api.mycafe-order.net").replace(/\/$/, "");

function DashboardReportLoader({ cafeRaw, label = "Memuat laporan..." }) {
  const cafeName = cafeRaw?.cafeNama || cafeRaw?.nama_cafe || cafeRaw?.nama || "Cafe";
  const cafeLogo = cafeRaw?.logo_cafe || cafeRaw?.logo || cafeRaw?.foto || "";
  const cafeInitial = (cafeName.charAt(0) || "C").toUpperCase();

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-amber-100 bg-white px-6 py-10 shadow-[0_24px_80px_rgba(245,158,11,0.12)]">
      <motion.div
        className="absolute inset-0 opacity-60"
        style={{
          background: "radial-gradient(circle at top, rgba(251,191,36,0.22), transparent 45%), radial-gradient(circle at bottom right, rgba(249,115,22,0.18), transparent 30%)",
        }}
        animate={{ opacity: [0.45, 0.75, 0.45], scale: [1, 1.04, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative flex flex-col items-center justify-center text-center">
        <motion.div
          className="relative flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        >
          <motion.div
            className="absolute h-28 w-28 rounded-full border border-amber-200/80"
            animate={{ scale: [1, 1.12, 1], opacity: [0.45, 0.15, 0.45] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute h-36 w-36 rounded-full border border-orange-200/70"
            animate={{ scale: [0.94, 1.08, 0.94], opacity: [0.22, 0.08, 0.22] }}
            transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[24px] border-4 border-white bg-gradient-to-br from-amber-500 to-orange-500 shadow-2xl"
            animate={{ y: [0, -5, 0], boxShadow: ["0 18px 40px rgba(245,158,11,0.28)", "0 24px 52px rgba(249,115,22,0.32)", "0 18px 40px rgba(245,158,11,0.28)"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            {cafeLogo ? (
              <img src={cafeLogo} alt={cafeName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl font-black text-white">{cafeInitial}</span>
            )}
          </motion.div>
        </motion.div>

        <motion.p
          className="mt-7 text-lg font-black text-gray-900"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          Loading...
        </motion.p>
        <motion.p
          className="mt-1 text-sm font-semibold text-amber-600"
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          {label}
        </motion.p>

        <div className="mt-6 flex items-center gap-2">
          {[0, 1, 2].map((dot) => (
            <motion.span
              key={dot}
              className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
              animate={{ y: [0, -8, 0], opacity: [0.35, 1, 0.35], scale: [0.92, 1.12, 0.92] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut", delay: dot * 0.14 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  // ── Ambil data dari AdminContext (sudah di-fetch di AdminPanel) ─────────
  const { orders, menuItems, promoCodes, tables, loading, fetchAll, cafeRaw } = useAdmin();

  // Laporan state
  const [period, setPeriod] = useState("hari");
  const [laporanData, setLaporanData] = useState(null);
  const [laporanLoading, setLaporanLoading] = useState(true);
  const [laporanError, setLaporanError] = useState(null);
  const [laporanForbidden, setLaporanForbidden] = useState(false);

  // ── Fetch laporan dari backend ──
  const fetchLaporan = async (selectedPeriod) => {
    setLaporanLoading(true);
    setLaporanError(null);
    setLaporanForbidden(false);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/laporan?filter=${selectedPeriod}`, {
        headers: { 
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        },
      });

      if (res.status === 403) {
        setLaporanForbidden(true);
        setLaporanData(null);
        return;
      }

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
      <div className="p-4 lg:p-6">
        <DashboardReportLoader cafeRaw={cafeRaw} label="Menyiapkan dashboard cafe..." />
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

  const fmtRupiah = (n) => `Rp${Number(n || 0).toLocaleString("id-ID")}`;

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-md text-white mb-3`}>
              {s.icon}
            </div>
            <p className="text-2xl font-black text-gray-900 leading-none">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">{s.label}</p>
            {s.sub ? <p className="text-[10px] text-gray-400 mt-0.5 font-semibold">{s.sub}</p> : null}
          </div>
        ))}
      </div>

      <div className="h-px bg-gray-200" />

      {/* Laporan (di bawah) */}

      {laporanLoading && !laporanError && (
        <DashboardReportLoader cafeRaw={cafeRaw} label={`Memuat laporan ${period}...`} />
      )}

      {/* Laporan Error */}
      {laporanError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <p className="text-sm text-red-600">{laporanError}</p>
          <button onClick={() => fetchLaporan(period)} className="mt-2 text-xs font-semibold text-red-700 underline">Coba Lagi</button>
        </div>
      )}

      {laporanForbidden && !laporanError && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="text-sm font-black text-amber-800">Fitur laporan belum aktif</p>
          <p className="text-xs text-amber-700 mt-1 font-semibold">
            Paket langganan kamu belum mengaktifkan fitur <span className="font-black">reports</span> atau langganan belum aktif.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => navigate("/admin/billing")}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-black shadow hover:shadow-md transition-all"
            >
              Buka Langganan
            </button>
            <button
              onClick={() => fetchLaporan(period)}
              className="px-4 py-2 border border-amber-300 text-amber-800 rounded-xl text-xs font-black hover:bg-amber-100 transition-all"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )}

      {/* Laporan KPI Cards */}
      {!laporanLoading && !laporanError && !laporanForbidden && (
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
      {!laporanLoading && !laporanError && !laporanForbidden && kategori_terlaris.length > 0 && (
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
