import {
  DollarSign, ClipboardList, UtensilsCrossed, Tag,
  ArrowUpRight, ArrowDownRight, TrendingUp, RefreshCw
} from "lucide-react";
import { useAdmin } from "../AdminPanel";
import { statusColors } from "../data/constants";

// helper: cek apakah promo masih aktif
function isPromoActive(p) {
  if (!p) return false;
  if (p.aktif === false) return false;
  if (p.expiredAt) return new Date(p.expiredAt) > new Date();
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  // ── Ambil data dari AdminContext (sudah di-fetch di AdminPanel) ─────────
  const { orders, menuItems, promoCodes, loading, fetchAll } = useAdmin();

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Kalkulasi statistik ────────────────────────────────────────────────────
  const revenue      = (orders ?? [])
    .filter(o => o.status === "selesai")
    .reduce((s, o) => s + (o.total ?? 0), 0);

  const activeOrders = (orders ?? []).filter(o => o.status !== "selesai").length;
  const activePromos = (promoCodes ?? []).filter(p => isPromoActive(p)).length;

  const stats = [
    {
      label: "Pendapatan Hari Ini",
      value: `Rp${revenue.toLocaleString("id-ID")}`,
      icon:  <DollarSign size={20} />,
      color: "from-green-500 to-emerald-600",
      trend: "+12%",
      up:    true,
    },
    {
      label: "Pesanan Aktif",
      value: activeOrders,
      icon:  <ClipboardList size={20} />,
      color: "from-amber-500 to-orange-500",
      trend: "+3 baru",
      up:    true,
    },
    {
      label: "Total Menu",
      value: (menuItems ?? []).length,
      icon:  <UtensilsCrossed size={20} />,
      color: "from-blue-500 to-indigo-600",
      trend: "item",
      up:    null,
    },
    {
      label: "Promo Aktif",
      value: activePromos,
      icon:  <Tag size={20} />,
      color: "from-purple-500 to-pink-500",
      trend: "kode",
      up:    null,
    },
  ];

  const topItems = [...(menuItems ?? [])].sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0)).slice(0, 5);

  const weekDays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  const weekRev  = [285000, 342000, 198000, 425000, 380000, 510000, revenue];
  const maxRev   = Math.max(...weekRev, 1); // hindari division by zero

  // tanggal hari ini
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  return (
    <div className="p-4 lg:p-6 space-y-6">

      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-gray-900">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5 capitalize">{today}</p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-amber-100 transition-all"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-md text-white`}>
                {s.icon}
              </div>
              {s.up !== null && (
                <span className={`text-xs font-bold flex items-center gap-0.5 ${s.up ? "text-green-600" : "text-red-500"}`}>
                  {s.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {s.trend}
                </span>
              )}
            </div>
            <p className="text-2xl font-black text-gray-900 leading-none">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Chart + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900">Pendapatan Minggu Ini</h2>
            <span className="text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
              <TrendingUp size={11} /> +18%
            </span>
          </div>
          <div className="flex items-end gap-2 h-32">
            {weekRev.map((rev, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-lg transition-all"
                  style={{
                    height: `${(rev / maxRev) * 100}%`,
                    background: i === 6
                      ? "linear-gradient(to top,#f59e0b,#f97316)"
                      : "#f3f4f6",
                  }}
                />
                <span className="text-[10px] text-gray-400 font-medium">{weekDays[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Order Status */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Status Pesanan</h2>
          {(orders ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Belum ada pesanan</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(statusColors ?? {}).map(([key, val]) => {
                const count = (orders ?? []).filter(o => o.status === key).length;
                const pct   = orders.length ? Math.round((count / orders.length) * 100) : 0;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${val.dot}`} />
                        <span className="text-xs font-semibold text-gray-700">{val.label}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-900">{count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${val.dot}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top Menu + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Menu */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Menu Terlaris</h2>
          {topItems.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Belum ada data menu</p>
          ) : (
            <div className="space-y-3">
              {topItems.map((item, i) => (
                <div key={item.id ?? i} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i === 0 ? "bg-amber-500 text-white" :
                    i === 1 ? "bg-gray-200 text-gray-700" :
                              "bg-gray-100 text-gray-500"
                  }`}>{i + 1}</span>
                  {item.image && (
                    <img src={item.image} alt={item.name} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{item.name ?? item.nama}</p>
                    <p className="text-xs text-gray-400">{item.sold ?? 0} terjual</p>
                  </div>
                  <span className="text-xs font-bold text-amber-600">
                    Rp{(item.price ?? item.harga ?? 0).toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Pesanan Terkini</h2>
          {(orders ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Belum ada pesanan</p>
          ) : (
            <div className="space-y-2.5">
              {(orders ?? []).slice(0, 6).map((order, idx) => {
                const s = statusColors?.[order.status] ?? { dot: "bg-gray-400", label: order.status, bg: "bg-gray-100", text: "text-gray-600" };
                return (
                  <div key={order.id ?? idx} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot} mt-1.5`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">{order.id ?? `#${idx + 1}`}</span>
                        <span className="text-xs text-gray-400">
                          {order.meja ? `Meja ${order.meja}` : ""} · {order.nama ?? order.nama_pelanggan ?? ""}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {(order.items ?? []).map(i => i.name ?? i.nama).join(", ")}
                      </p>
                      {order.note && (
                        <p className="text-[10px] text-amber-600 font-medium mt-0.5 truncate">📝 {order.note}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-gray-900">
                        Rp{(order.total ?? 0).toLocaleString("id-ID")}
                      </p>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                        {s.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}