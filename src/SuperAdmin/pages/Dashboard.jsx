import { useState, useEffect } from "react";
import { Store, Users, DollarSign, TrendingUp, Activity, Calendar } from "lucide-react";
import StatCard from "../components/StatCard";

const API_URL = import.meta.env.VITE_API_URL ?? "https://www.mycafe-order.net/";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalCafes: 0,
    activeCafes: 0,
    totalAdmins: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    pendingPayments: 0,
  });
  const [subscriptionBalance, setSubscriptionBalance] = useState({ total_amount: 0, total_transactions: 0 });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("superadmin_token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const [statsRes, activitiesRes, balanceRes] = await Promise.allSettled([
        fetch(`${API_URL}/api/superadmin/stats`, { headers }),
        fetch(`${API_URL}/api/superadmin/activities`, { headers }),
        fetch(`${API_URL}/api/superadmin/subscription-balance`, { headers }),
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value.ok) {
        const data = await statsRes.value.json();
        setStats(data.data || data);
      }

      if (activitiesRes.status === "fulfilled" && activitiesRes.value.ok) {
        const data = await activitiesRes.value.json();
        setRecentActivities(data.data || data.activities || []);
      }

      if (balanceRes.status === "fulfilled" && balanceRes.value.ok) {
        const data = await balanceRes.value.json().catch(() => ({}));
        const payload = data?.data ?? data;
        setSubscriptionBalance({
          total_amount: Number(payload?.total_amount ?? payload?.totalAmount ?? 0),
          total_transactions: Number(payload?.total_transactions ?? payload?.totalTransactions ?? 0),
        });
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-semibold">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Cafe"
          value={stats.totalCafes}
          icon={<Store size={20} className="text-white" />}
          trend="up"
          trendValue="+12%"
          color="purple"
        />
        <StatCard
          title="Cafe Aktif"
          value={stats.activeCafes}
          icon={<Activity size={20} className="text-white" />}
          trend="up"
          trendValue="+8%"
          color="green"
        />
        <StatCard
          title="Total Admin"
          value={stats.totalAdmins}
          icon={<Users size={20} className="text-white" />}
          color="blue"
        />
        <StatCard
          title="Revenue Bulan Ini"
          value={`Rp ${(stats.totalRevenue || 0).toLocaleString("id-ID")}`}
          icon={<DollarSign size={20} className="text-white" />}
          trend="up"
          trendValue="+24%"
          color="orange"
        />
        <StatCard
          title="Saldo Langganan"
          value={`Rp ${(subscriptionBalance.total_amount || 0).toLocaleString("id-ID")}`}
          icon={<DollarSign size={20} className="text-white" />}
          color="orange"
          trend={subscriptionBalance.total_transactions ? "up" : undefined}
          trendValue={subscriptionBalance.total_transactions ? `${subscriptionBalance.total_transactions} trx` : undefined}
        />
        <StatCard
          title="Langganan Aktif"
          value={stats.activeSubscriptions}
          icon={<TrendingUp size={20} className="text-white" />}
          trend="up"
          trendValue="+5%"
          color="green"
        />
        <StatCard
          title="Pembayaran Pending"
          value={stats.pendingPayments}
          icon={<Calendar size={20} className="text-white" />}
          color="red"
        />
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Activity size={18} className="text-purple-600" />
          Aktivitas Terbaru
        </h3>
        <div className="space-y-3">
          {recentActivities.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Belum ada aktivitas</p>
          ) : (
            recentActivities.slice(0, 10).map((activity, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{activity.title || activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {activity.cafe_name && `${activity.cafe_name} • `}
                    {new Date(activity.created_at || activity.timestamp).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Stats Chart Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Grafik Pendaftaran Cafe</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
            <p className="text-gray-400 text-sm">Chart akan ditampilkan di sini</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Grafik Revenue</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
            <p className="text-gray-400 text-sm">Chart akan ditampilkan di sini</p>
          </div>
        </div>
      </div>
    </div>
  );
}
