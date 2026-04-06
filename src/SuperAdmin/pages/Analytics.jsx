import { useState, useEffect } from "react";
import { BarChart3, PieChart, TrendingUp, Activity } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL ?? "https://www.mycafe-order.net/";

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("superadmin_token");
      const res = await fetch(`${API_URL}/api/superadmin/analytics`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data.data || data);
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-semibold">Memuat analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900">Analytics</h2>
        <p className="text-sm text-gray-500 mt-1">Analisis mendalam performa sistem</p>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-purple-600" />
            Distribusi Cafe per Wilayah
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
            <p className="text-gray-400 text-sm">Chart akan ditampilkan di sini</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart size={18} className="text-purple-600" />
            Status Langganan
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
            <p className="text-gray-400 text-sm">Chart akan ditampilkan di sini</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-purple-600" />
            Trend Pendaftaran
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
            <p className="text-gray-400 text-sm">Chart akan ditampilkan di sini</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity size={18} className="text-purple-600" />
            Aktivitas Harian
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
            <p className="text-gray-400 text-sm">Chart akan ditampilkan di sini</p>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
        <h3 className="font-bold text-lg mb-3">Insights & Rekomendasi</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-white rounded-full mt-1.5 flex-shrink-0" />
            <span>Pertumbuhan cafe meningkat 15% bulan ini dibanding bulan lalu</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-white rounded-full mt-1.5 flex-shrink-0" />
            <span>5 cafe akan berakhir langganannya dalam 7 hari ke depan</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-white rounded-full mt-1.5 flex-shrink-0" />
            <span>Revenue rata-rata per cafe: Rp 2.500.000/bulan</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
