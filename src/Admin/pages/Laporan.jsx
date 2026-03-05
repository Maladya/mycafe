import { useState, useEffect } from "react";
import { getCatColor } from "../data/constants";
import { useAdmin } from "../AdminPanel";
import { Loader2 } from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL ?? "http://192.168.1.13:3000").replace(/\/$/, "");

export default function Laporan() {
  const { menuItems } = useAdmin();
  const [period, setPeriod] = useState("hari");
  const [laporanData, setLaporanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ── Fetch laporan dari backend ── */
  const fetchLaporan = async (selectedPeriod) => {
    setLoading(true);
    setError(null);
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
      setError(err.message || "Gagal memuat laporan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporan(period);
  }, [period]);

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

  const kpiCards = [
    { label:"Total Pendapatan",  value:`Rp${totalRevenue.toLocaleString("id-ID")}`, sub:`per ${period} (${periode.start?.split(' ')[0] || ''})`, icon:"💰", color:"bg-green-50 border-green-200" },
    { label:"Total Pesanan",     value:totalOrders,                              sub:"transaksi",       icon:"📋", color:"bg-blue-50 border-blue-200" },
    { label:"Rata-rata Order",   value:`Rp${avgOrder.toLocaleString("id-ID")}`,  sub:"per transaksi",   icon:"📊", color:"bg-amber-50 border-amber-200" },
    { label:"Kategori Terlaris", value:topCategory?.nama_kategori || "-",        sub:`${parseInt(topCategory?.total_qty) || 0} terjual`, icon:"🏆", color:"bg-purple-50 border-purple-200" },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-gray-900">Laporan</h1>
          <p className="text-gray-400 text-sm">Ringkasan performa bisnis</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {["hari","minggu","bulan"].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${period===p?"bg-white shadow text-gray-900":"text-gray-500 hover:text-gray-700"}`}>{p}</button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 size={40} className="animate-spin text-amber-500 mb-3" />
          <p className="text-sm text-gray-400">Memuat laporan...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={() => fetchLaporan(period)} className="mt-2 text-xs font-semibold text-red-700 underline">Coba Lagi</button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kpiCards.map((k, i) => (
              <div key={i} className={`rounded-2xl border p-4 ${k.color}`}>
                <span className="text-2xl">{k.icon}</span>
                <p className="font-black text-gray-900 text-xl mt-2 leading-none">{k.value}</p>
                <p className="text-xs text-gray-500 mt-1">{k.label}</p>
                <p className="text-[10px] text-gray-400">{k.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">Kategori Terlaris — Per {period.charAt(0).toUpperCase() + period.slice(1)}</h2>
            {kategori_terlaris.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Belum ada data kategori</p>
            ) : (
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
                        <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500" 
                             style={{ width: `${Math.min((parseInt(kat.total_qty) / (parseInt(kategori_terlaris[0]?.total_qty) || 1)) * 100, 100)}%` }}/>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">Rp{parseFloat(kat.total_revenue).toLocaleString("id-ID")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">Ranking Menu Terlaris</h2>
            {topMenus.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Belum ada data menu</p>
            ) : (
              <div className="space-y-3">
                {topMenus.map((item, i) => (
                  <div key={item.id ?? i} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-4 flex-shrink-0">{i + 1}</span>
                    {item.image && <img src={item.image} alt={item.name} className="w-7 h-7 rounded-lg object-cover flex-shrink-0"/>}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-gray-900 truncate">{item.name ?? item.nama}</p>
                        <span className="text-xs font-bold text-gray-700 ml-2 flex-shrink-0">{item.sold ?? 0}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width:`${((item.sold ?? 0) / maxSold) * 100}%` }}/>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${getCatColor(item.category)}`}>{item.category}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
