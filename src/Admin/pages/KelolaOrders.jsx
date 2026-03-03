import { useState, useEffect, useCallback } from "react";
import { ClipboardList, MessageSquare, Check, RefreshCw, Loader2, AlertCircle } from "lucide-react";

/* ─── Config ─────────────────────────────────────────────────────────────── */
const API_URL = (import.meta.env.VITE_API_URL ?? "http://192.168.1.9:3000").replace(/\/$/, "");
const POLL_INTERVAL = 15000; // polling setiap 15 detik

/* ─── Status Config ──────────────────────────────────────────────────────── */
const statusConfig = {
  proses:  { dot: "bg-amber-400", label: "Diproses", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  selesai: { dot: "bg-green-500", label: "Selesai",  bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
};

/* ─── Normalize order dari backend ──────────────────────────────────────── */
function normalizeOrder(o) {
  // Support berbagai format field name dari backend
  const items = (o.items ?? o.detail ?? o.order_items ?? []).map(i => ({
    name:  i.name ?? i.nama_menu ?? i.nama ?? "",
    qty:   Number(i.qty ?? i.jumlah ?? 1),
    price: Number(i.price ?? i.harga ?? 0),
    catatan: i.catatan ?? i.note ?? i.keterangan ?? "",
  }));

  // Rebuild itemNotes dari catatan per item
  const itemNotes = {};
  items.forEach(i => { if (i.catatan) itemNotes[i.name] = i.catatan; });

  return {
    id:     o.id,
    meja:   o.meja   ?? o.table ?? o.nomor_meja ?? "-",
    status: o.status === "proses" || o.status === "selesai" ? o.status : "proses",
    waktu:  o.waktu  ?? o.created_at ?? o.tanggal ?? "",
    nama:   o.nama   ?? o.nama_pelanggan ?? o.customer ?? "",
    total:  Number(o.total ?? 0),
    note:   o.note   ?? o.catatan ?? o.keterangan ?? "",
    itemNotes,
    items,
  };
}

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function KelolaOrders() {
  const [orders,   setOrders]   = useState([]);
  const [filter,   setFilter]   = useState("all");
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [updating, setUpdating] = useState(null); // id order yang sedang diupdate
  const [lastSync, setLastSync] = useState(null);

  /* ── Fetch orders dari backend ────────────────────────────────────────── */
  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/orders/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message ?? `HTTP ${res.status}`);
      }
      const raw = data.data ?? data.orders ?? data ?? [];
      setOrders(Array.isArray(raw) ? raw.map(normalizeOrder) : []);
      setLastSync(new Date());
    } catch (err) {
      setError(err.message || "Gagal memuat pesanan");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  /* ── Initial fetch + polling ──────────────────────────────────────────── */
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  /* ── Tandai Selesai ───────────────────────────────────────────────────── */
  const markSelesai = async (id) => {
    setUpdating(id);
    // Optimistic update
    setOrders(prev => prev.map(o => o.id !== id ? o : { ...o, status: "selesai" }));
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/orders/admin/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "selesai" }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        // Rollback kalau gagal
        setOrders(prev => prev.map(o => o.id !== id ? o : { ...o, status: "proses" }));
        alert(data.message ?? "Gagal update status");
      }
    } catch {
      // Rollback
      setOrders(prev => prev.map(o => o.id !== id ? o : { ...o, status: "proses" }));
      alert("Gagal terhubung ke server");
    } finally {
      setUpdating(null);
    }
  };

  /* ── Filter ───────────────────────────────────────────────────────────── */
  const validOrders = orders.filter(o => o.status === "proses" || o.status === "selesai");
  const filtered    = filter === "all" ? validOrders : validOrders.filter(o => o.status === filter);
  const prosesCount = validOrders.filter(o => o.status === "proses").length;

  /* ── Format waktu ─────────────────────────────────────────────────────── */
  const formatWaktu = (raw) => {
    if (!raw) return "";
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return raw;
      return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    } catch { return raw; }
  };

  /* ── Format lastSync ──────────────────────────────────────────────────── */
  const formatSync = (d) => {
    if (!d) return "";
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-gray-900">Kelola Pesanan</h1>
          <p className="text-gray-400 text-sm">
            {loading ? "Memuat..." : `${prosesCount} pesanan diproses`}
            {lastSync && !loading && (
              <span className="ml-2 text-gray-300 text-xs">· Sync {formatSync(lastSync)}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Tombol refresh manual */}
          <button
            onClick={() => fetchOrders()}
            disabled={loading}
            className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl transition-all disabled:opacity-50"
            title="Refresh pesanan"
          >
            <RefreshCw size={15} className={`text-gray-600 ${loading ? "animate-spin" : ""}`} />
          </button>
          {/* Live indicator */}
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-amber-700">Live</span>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-700">Gagal memuat pesanan</p>
            <p className="text-xs text-red-500 truncate">{error}</p>
          </div>
          <button
            onClick={() => fetchOrders()}
            className="flex-shrink-0 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-red-600 transition-all"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { k: "all",     l: "Semua" },
          { k: "proses",  l: "Diproses" },
          { k: "selesai", l: "Selesai" },
        ].map(({ k, l }) => {
          const count = k === "all" ? validOrders.length : validOrders.filter(o => o.status === k).length;
          const s = statusConfig[k];
          return (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                filter === k
                  ? "bg-gray-900 text-white shadow-md"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {k !== "all" && <div className={`w-1.5 h-1.5 rounded-full ${s?.dot}`} />}
              {l}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                filter === k ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
              <div className="h-14 bg-gray-100" />
              <div className="p-4 space-y-3">
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
                <div className="h-9 bg-gray-200 rounded-xl mt-4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Cards */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(order => {
            const s         = statusConfig[order.status] ?? statusConfig.proses;
            const hasNotes  = order.note || (order.itemNotes && Object.keys(order.itemNotes).length > 0);
            const isSelesai = order.status === "selesai";
            const isUpdating = updating === order.id;
            const itemList  = (order.items ?? []).filter(i => (i.qty ?? 1) > 0);

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-all ${s.border}`}
              >
                {/* Card Header */}
                <div className={`px-4 py-3 flex items-center justify-between border-b ${s.bg}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${s.dot} ${!isSelesai ? "animate-pulse" : ""}`} />
                    <span className="font-bold text-gray-900 text-sm">{order.id}</span>
                    <span className="text-xs text-gray-500">Meja {order.meja}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {hasNotes && (
                      <div className="w-5 h-5 bg-orange-400 rounded-md flex items-center justify-center">
                        <MessageSquare size={11} className="text-white" />
                      </div>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text} border border-current/20`}>
                      {s.label}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-4 py-3">
                  <p className="text-xs text-gray-400 mb-2">
                    {formatWaktu(order.waktu)}
                    {order.nama ? ` · ${order.nama}` : ""}
                  </p>
                  <div className="space-y-1.5">
                    {itemList.map((item, i) => (
                      <div key={i} className="flex justify-between items-start">
                        <div className="min-w-0">
                          <span className="text-sm text-gray-700">{item.qty}× {item.name}</span>
                          {order.itemNotes?.[item.name] && (
                            <p className="text-[10px] text-orange-500 font-medium mt-0.5">
                              📝 {order.itemNotes[item.name]}
                            </p>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-gray-500 flex-shrink-0 ml-2">
                          Rp{((item.qty ?? 1) * (item.price ?? 0)).toLocaleString("id-ID")}
                        </span>
                      </div>
                    ))}
                  </div>

                  {order.note && (
                    <div className="mt-2.5 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 flex items-start gap-2">
                      <MessageSquare size={12} className="text-orange-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-orange-700 font-medium">{order.note}</p>
                    </div>
                  )}

                  <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {itemList.reduce((s, i) => s + (i.qty ?? 1), 0)} item
                    </span>
                    <span className="font-extrabold text-gray-900 text-sm">
                      Rp{(order.total ?? 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {/* Action */}
                <div className="px-4 pb-3">
                  {!isSelesai ? (
                    <button
                      onClick={() => markSelesai(order.id)}
                      disabled={isUpdating}
                      className="w-full py-2.5 rounded-xl font-bold text-sm bg-green-500 hover:bg-green-600 text-white transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {isUpdating
                        ? <><Loader2 size={14} className="animate-spin" /> Memproses...</>
                        : <>✓ Tandai Selesai</>
                      }
                    </button>
                  ) : (
                    <div className="w-full py-2 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center gap-2">
                      <Check size={14} className="text-green-500" />
                      <span className="text-xs font-semibold text-gray-500">Pesanan Selesai</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && !error && (
            <div className="col-span-full text-center py-16 text-gray-400">
              <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold">
                {filter === "proses" ? "Tidak ada pesanan yang diproses" :
                 filter === "selesai" ? "Belum ada pesanan selesai" :
                 "Belum ada pesanan masuk"}
              </p>
              <p className="text-sm mt-1 text-gray-300">Pesanan baru akan muncul otomatis</p>
            </div>
          )}
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}