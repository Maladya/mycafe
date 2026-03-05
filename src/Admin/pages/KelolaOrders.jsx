import { useState, useEffect, useCallback, useRef } from "react";
import { ClipboardList, MessageSquare, RefreshCw, AlertCircle, Search } from "lucide-react";

/* ─── Config ─────────────────────────────────────────────────────────────── */
const API_URL = (import.meta.env.VITE_API_URL ?? "http://192.168.1.13:3000").replace(/\/$/, "");
const POLL_INTERVAL = 15000; // polling setiap 15 detik

function parseDateFlexible(raw) {
  if (!raw) return null;
  if (raw instanceof Date) return raw;
  const str = String(raw).trim();
  if (!str) return null;

  // Handle format: "YYYY-MM-DD HH:mm:ss" (tanpa timezone)
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const hh = Number(m[4]);
    const mm = Number(m[5]);
    const ss = Number(m[6] ?? 0);
    // Anggap input adalah WIB (UTC+7)
    return new Date(Date.UTC(y, mo - 1, d, hh - 7, mm, ss));
  }

  const dt = new Date(str);
  return isNaN(dt.getTime()) ? null : dt;
}

/* ─── Normalize order dari backend ──────────────────────────────────────── */
function normalizeOrder(o) {
  const items = (o.items ?? o.detail ?? o.order_items ?? []).map(i => ({
    name:    i.name ?? i.nama_menu ?? i.nama ?? "",
    qty:     Number(i.qty ?? i.jumlah ?? 1),
    price:   Number(i.price ?? i.harga ?? 0),
    catatan: i.catatan ?? i.note ?? i.keterangan ?? "",
  }));

  const itemNotes = {};
  items.forEach(i => { if (i.catatan) itemNotes[i.name] = i.catatan; });

  return {
    id:         o.id,
    meja:       o.meja   ?? o.table ?? o.nomor_meja ?? "-",
    waktu:      o.waktu  ?? "",
    tanggal:    o.tanggal ?? "",
    createdAt:  o.created_at ?? o.createdAt ?? "",
    nama:       o.nama   ?? o.nama_pelanggan ?? o.customer ?? "",
    total:      Number(o.total ?? 0),
    note:       o.note   ?? o.catatan ?? o.keterangan ?? "",
    itemNotes,
    items,
  };
}

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function KelolaOrders() {
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [search,   setSearch]   = useState("");
  const [tick,     setTick]     = useState(0);
  const [serverBaseMs, setServerBaseMs] = useState(null);
  const perfBaseRef = useRef(0);

  /* ── Fetch orders dari backend ────────────────────────────────────────── */
  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/orders/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const serverDateHeader = res.headers.get("date");
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message ?? `HTTP ${res.status}`);
      }
      const raw = data.data ?? data.orders ?? data ?? [];
      setOrders(raw.map(normalizeOrder));
      setLastSync(new Date());

      if (serverDateHeader) {
        const d = new Date(serverDateHeader);
        if (!isNaN(d.getTime())) {
          setServerBaseMs(d.getTime());
          perfBaseRef.current = performance.now();
        }
      }
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

  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

  /* ── Filter ───────────────────────────────────────────────────────────── */
  const validOrders = orders;
  const filtered    = validOrders.filter(o => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const id = String(o.id ?? "").toLowerCase();
    const nama = String(o.nama ?? "").toLowerCase();
    return id.includes(q) || nama.includes(q);
  });

  /* ── Format waktu ─────────────────────────────────────────────────────── */
  const parseTanggalWaktuFlexible = (tanggal, waktu) => {
    const tgl = String(tanggal ?? "").trim();
    const wkt = String(waktu ?? "").trim();
    if (!tgl || !wkt) return null;

    const wm = wkt.match(/^(\d{1,2})[.:](\d{2})$/);
    if (!wm) return null;
    const hh = Number(wm[1]);
    const mm = Number(wm[2]);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;

    const tm = tgl.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
    if (!tm) return null;
    const dd = Number(tm[1]);
    const monRaw = String(tm[2]).toLowerCase();
    const yyyy = Number(tm[3]);

    const monMap = {
      jan: 1, januari: 1,
      feb: 2, februari: 2,
      mar: 3, maret: 3,
      apr: 4, april: 4,
      mei: 5,
      jun: 6, juni: 6,
      jul: 7, juli: 7,
      agu: 8, ags: 8, aug: 8, agustus: 8,
      sep: 9, september: 9,
      okt: 10, october: 10, oktober: 10,
      nov: 11, november: 11,
      des: 12, dec: 12, desember: 12,
    };
    const key = monRaw.slice(0, 3);
    const mo = monMap[monRaw] ?? monMap[key] ?? null;
    if (!mo) return null;

    const pad2 = (n) => String(n).padStart(2, "0");
    const iso = `${yyyy}-${pad2(mo)}-${pad2(dd)}T${pad2(hh)}:${pad2(mm)}:00+07:00`;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatWaktu = (order) => {
    if (!order) return "";
    try {
      const tgl = String(order.tanggal ?? "").trim();
      const wkt = String(order.waktu ?? "").trim();
      if (tgl && wkt) {
        return `${tgl} · ${wkt}`;
      }

      const dPrimary = parseDateFlexible(order.createdAt);
      const dFallback = parseTanggalWaktuFlexible(order.tanggal, order.waktu);
      const d = dPrimary ?? dFallback;
      if (!d) return String(order.createdAt || "");
      return d.toLocaleString("id-ID", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      });
    } catch {
      return String(order.tanggal && order.waktu ? `${order.tanggal} · ${order.waktu}` : (order.createdAt || ""));
    }
  };

  /* ── Format lastSync ──────────────────────────────────────────────────── */
  const formatSync = (d) => {
    if (!d) return "";
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Jakarta" });
  };

  const formatNow = (d) => {
    if (!d) return "";
    return d.toLocaleString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Jakarta",
    });
  };

  const getServerNow = () => {
    if (!serverBaseMs) return null;
    const elapsed = performance.now() - (perfBaseRef.current || 0);
    return new Date(serverBaseMs + elapsed);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-gray-900">Kelola Pesanan</h1>
          <p className="text-gray-400 text-sm">
            {loading ? "Memuat..." : `${validOrders.length} pesanan`}
            {lastSync && !loading && (
              <span className="ml-2 text-gray-300 text-xs">· Sync {formatSync(lastSync)}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">

          <button
            onClick={() => fetchOrders()}
            disabled={loading}
            className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl transition-all disabled:opacity-50"
            title="Refresh pesanan"
          >
            <RefreshCw size={15} className={`text-gray-600 ${loading ? "animate-spin" : ""}`} />
          </button>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-amber-700">Live</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 leading-none">{formatNow(getServerNow())}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari pemesan atau Order ID..."
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-500 transition-all"
          />
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
            const hasNotes   = order.note || (order.itemNotes && Object.keys(order.itemNotes).length > 0);
            const itemList   = (order.items ?? []).filter(i => (i.qty ?? 1) > 0);

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-500 hover:shadow-md"
              >
                {/* Card Header */}
                <div className="px-4 py-3 flex items-center justify-between border-b bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-sm">{order.id}</span>
                    <span className="text-xs text-gray-500">Meja {order.meja}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {hasNotes && (
                      <div className="w-5 h-5 bg-orange-400 rounded-md flex items-center justify-center">
                        <MessageSquare size={11} className="text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-4 py-3">
                  <p className="text-xs text-gray-400 mb-2">
                    {formatWaktu(order)}
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
              </div>
            );
          })}

          {filtered.length === 0 && !error && (
            <div className="col-span-full text-center py-16 text-gray-400">
              <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold">
                {search.trim() ? "Pesanan tidak ditemukan" : "Belum ada pesanan masuk"}
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