import { useState, useEffect } from "react";
import { FileText, Download, Calendar, TrendingUp, DollarSign, Users } from "lucide-react";
import StatCard from "../components/StatCard";

const API_URL = import.meta.env.VITE_API_URL ?? "https://api.mycafe-order.net";

export default function Reports() {
  const [reportData, setReportData] = useState({
    monthlyRevenue: 0,
    totalTransactions: 0,
    newCafes: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("superadmin_token");
      const res = await fetch(
        `${API_URL}/api/superadmin/reports?start=${dateRange.start}&end=${dateRange.end}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setReportData(data.data || data);
      }
    } catch (err) {
      console.error("Failed to fetch report data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    // TODO: Implement export functionality
    alert("Export laporan akan segera tersedia");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Laporan & Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">Analisis performa sistem secara keseluruhan</p>
        </div>
        <button
          onClick={handleExportReport}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
        >
          <Download size={18} />
          Export Laporan
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-4">
          <Calendar size={18} className="text-purple-600" />
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-1">
              <label className="text-xs text-gray-500 font-semibold mb-1 block">Dari</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-purple-500"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 font-semibold mb-1 block">Sampai</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Revenue Periode Ini"
              value={`Rp ${(reportData.monthlyRevenue || 0).toLocaleString("id-ID")}`}
              icon={<DollarSign size={20} className="text-white" />}
              color="orange"
            />
            <StatCard
              title="Total Transaksi"
              value={reportData.totalTransactions || 0}
              icon={<TrendingUp size={20} className="text-white" />}
              color="green"
            />
            <StatCard
              title="Cafe Baru"
              value={reportData.newCafes || 0}
              icon={<Users size={20} className="text-white" />}
              color="purple"
            />
            <StatCard
              title="Pengguna Aktif"
              value={reportData.activeUsers || 0}
              icon={<Users size={20} className="text-white" />}
              color="blue"
            />
          </div>

          {/* Charts Placeholder */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-purple-600" />
                Grafik Revenue
              </h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
                <p className="text-gray-400 text-sm">Chart akan ditampilkan di sini</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={18} className="text-purple-600" />
                Pertumbuhan Cafe
              </h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
                <p className="text-gray-400 text-sm">Chart akan ditampilkan di sini</p>
              </div>
            </div>
          </div>

          {/* Top Cafes Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Top 10 Cafe Berdasarkan Revenue</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Cafe</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Revenue</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Transaksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-gray-400 text-sm">
                      Data akan ditampilkan setelah integrasi API
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
