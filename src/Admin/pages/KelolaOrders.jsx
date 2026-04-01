import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, MessageSquare, RefreshCw, AlertCircle, Search, ChevronDown, ChevronUp, CheckCircle2, Loader2, ArrowLeft, Clock, CheckCheck } from "lucide-react";

import { useKasir } from "../KasirLayout.jsx";

function OrderItemsList({ itemList, itemNotes }) {
  const items = Array.isArray(itemList) ? itemList : [];
  const shouldScroll = items.length > 4;
  const scrollerRef = useRef(null);
  const [metrics, setMetrics] = useState({ scrollTop: 0, scrollHeight: 0, clientHeight: 0 });

  const readMetrics = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setMetrics({ scrollTop: el.scrollTop, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight });
  }, []);

  useEffect(() => {
    readMetrics();
  }, [readMetrics, items.length]);

  useEffect(() => {
    if (!shouldScroll) return;
    const onResize = () => readMetrics();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [readMetrics, shouldScroll]);

  const maxScroll = Math.max(0, metrics.scrollHeight - metrics.clientHeight);
  const arrowH = 14;
  const trackH = Math.max(0, metrics.clientHeight - (arrowH * 2));
  const rawThumbH = metrics.scrollHeight > 0
    ? Math.round((metrics.clientHeight * metrics.clientHeight) / metrics.scrollHeight)
    : trackH;
  const thumbH = Math.max(24, Math.min(trackH, rawThumbH));
  const thumbTop = maxScroll > 0
    ? Math.round((metrics.scrollTop / maxScroll) * Math.max(0, trackH - thumbH))
    : 0;

  return (
    <div className={shouldScroll ? "relative pr-6" : ""}>
      <div
        ref={scrollerRef}
        onScroll={shouldScroll ? readMetrics : undefined}
        className={shouldScroll ? "space-y-1.5 max-h-[112px] overflow-y-auto scrollbar-hide pr-1" : "space-y-1.5"}
      >
        {items.map((item, i) => (
          <div key={i} className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <span className="text-sm text-gray-700">{item.qty}× {item.name}</span>
              {itemNotes?.[item.name] && (
                <p className="text-[10px] text-orange-500 font-medium mt-0.5">
                  {itemNotes[item.name]}
                </p>
              )}
            </div>
            <span className="text-xs font-semibold text-gray-500 flex-shrink-0">
              Rp{((item.qty ?? 1) * (item.price ?? 0)).toLocaleString("id-ID")}
            </span>
          </div>
        ))}
      </div>

      {shouldScroll && (
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 flex flex-col items-center justify-between">
          <ChevronUp size={14} className="text-gray-400" />
          <div className="w-2.5 flex-1 relative">
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-2 rounded-full bg-gray-200" />
            <div
              className="absolute left-1/2 -translate-x-1/2 w-2 rounded-full bg-gray-400"
              style={{ height: `${thumbH}px`, top: `${thumbTop}px` }}
            />
          </div>
          <ChevronDown size={14} className="text-gray-400" />
        </div>
      )}
    </div>
  );
}

const API_URL = (import.meta.env.VITE_API_URL ?? "http://192.168.1.2:3000").replace(/\/$/, "");
const POLL_INTERVAL = 15000;

function parseDateFlexible(raw) {
  if (!raw) return null;
  if (raw instanceof Date) return raw;
  const str = String(raw).trim();
  if (!str) return null;

  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const hh = Number(m[4]);
    const mm = Number(m[5]);
    const ss = Number(m[6] ?? 0);
    return new Date(Date.UTC(y, mo - 1, d, hh - 7, mm, ss));
  }

  const dt = new Date(str);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function normalizeOrder(o) {
  const items = (o.items ?? o.detail ?? o.order_items ?? []).map((i) => ({
    name: i.name ?? i.nama_menu ?? i.nama ?? "",
    qty: Number(i.qty ?? i.jumlah ?? 1),
    price: Number(i.price ?? i.harga ?? 0),
    catatan: i.catatan ?? i.note ?? i.keterangan ?? "",
  }));

  const itemNotes = {};
  items.forEach((i) => {
    if (i.catatan) itemNotes[i.name] = i.catatan;
  });

  return {
    id: o.id,
    meja: o.meja ?? o.table ?? o.nomor_meja ?? "-",
    waktu: o.waktu ?? "",
    tanggal: o.tanggal ?? "",
    createdAt: o.created_at ?? o.createdAt ?? "",
    nama: o.nama ?? o.nama_pelanggan ?? o.customer ?? "",
    total: Number(o.total ?? 0),
    note: o.note ?? o.catatan ?? o.keterangan ?? "",
    status: o.status ?? "baru",
    paymentMethod: o.payment_method ?? o.paymentMethod ?? "",
    itemNotes,
    items,
  };
}

export default function KelolaOrders({
  tokenKey = "token",
  endpointPath = "/api/orders/admin",
  statusMode = "all",
  allowMarkSelesai = false,
  pageTitle = "Kelola Pesanan",
  pageSubtitle = "",
}) {
  const navigate = useNavigate();
  const kasirContext = useKasir();
  const showToast = kasirContext?.showToast;
  const isKasirMode = allowMarkSelesai || statusMode === "active";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [filterTab, setFilterTab] = useState(statusMode === "completed" ? "selesai" : "aktif");

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem(tokenKey) ?? localStorage.getItem("token");
      const res = await fetch(`${API_URL}${endpointPath}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.message ?? `HTTP ${res.status}`);
      }

      const raw = data.data ?? data.orders ?? data ?? [];
      setOrders(raw.map(normalizeOrder));
      setLastSync(new Date());
    } catch (err) {
      setError(err.message || "Gagal memuat pesanan");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [endpointPath, tokenKey]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const isSelesaiStatus = (s) => ["selesai", "done", "completed"].includes(String(s ?? "").trim().toLowerCase());

  const totalAktif = orders.filter((o) => !isSelesaiStatus(o.status)).length;
  const totalSelesai = orders.filter((o) => isSelesaiStatus(o.status)).length;

  const effectiveTab = statusMode === "completed" ? "selesai" : filterTab;

  const tabFiltered = orders.filter((o) => (
    effectiveTab === "aktif" ? !isSelesaiStatus(o.status) : isSelesaiStatus(o.status)
  ));

  const filtered = tabFiltered.filter((o) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return String(o.id ?? "").toLowerCase().includes(q)
      || String(o.nama ?? "").toLowerCase().includes(q)
      || String(o.meja ?? "").toLowerCase().includes(q);
  });

  const PAGE_SIZE = 9;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const paginatedOrders = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, effectiveTab]);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

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
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const formatWaktu = (order) => {
    if (!order) return "";

    try {
      const tgl = String(order.tanggal ?? "").trim();
      const wkt = String(order.waktu ?? "").trim();
      if (tgl && wkt) return `${tgl} · ${wkt}`;

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

  const formatSync = (d) => {
    if (!d) return "";
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Jakarta" });
  };

  const handleMarkSelesai = async (orderId) => {
    if (!orderId || updatingOrderId) return;
    setUpdatingOrderId(String(orderId));

    try {
      const token = localStorage.getItem(tokenKey) ?? localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/orders/kasir/${encodeURIComponent(orderId)}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "selesai" }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.message ?? `HTTP ${res.status}`);
      }

      setOrders((prev) => prev.map((order) => (
        String(order.id) === String(orderId) ? { ...order, status: "selesai" } : order
      )));

      showToast?.("Pesanan berhasil ditandai selesai", "success");
      fetchOrders(true);
    } catch (err) {
      showToast?.(err.message || "Gagal menandai pesanan selesai", "error");
    } finally {
      setUpdatingOrderId("");
    }
  };

  const statusChip = (status) => {
    const s = String(status ?? "").trim().toLowerCase();
    if (["selesai", "done", "completed"].includes(s)) return { label: "Selesai", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    if (["lunas", "paid"].includes(s)) return { label: "Lunas", cls: "bg-blue-50 text-blue-700 border-blue-200" };
    if (["siap", "ready"].includes(s)) return { label: "Siap", cls: "bg-violet-50 text-violet-700 border-violet-200" };
    if (["proses", "process"].includes(s)) return { label: "Diproses", cls: "bg-amber-50 text-amber-700 border-amber-200" };
    return { label: status ?? "-", cls: "bg-gray-50 text-gray-600 border-gray-200" };
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {isKasirMode && (
              <button
                type="button"
                onClick={() => navigate("/kasir")}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-gray-200 text-gray-600 shadow-sm hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition-all"
                title="Kembali ke terminal kasir"
              >
                <ArrowLeft size={17} />
              </button>
            )}

            <div>
              <h1 className="text-xl lg:text-2xl font-black text-gray-900 leading-tight">{pageTitle}</h1>
              {pageSubtitle && <p className="text-sm text-gray-400 mt-0.5">{pageSubtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {lastSync && !loading && (
              <span className="hidden sm:block text-xs text-gray-400 bg-white border border-gray-100 rounded-xl px-3 py-1.5">
                Sync {formatSync(lastSync)}
              </span>
            )}

            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-bold text-amber-700">Live</span>
            </div>

            <button
              onClick={() => fetchOrders()}
              disabled={loading}
              className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-all disabled:opacity-50 shadow-sm"
              title="Refresh"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Clock, label: "Aktif", value: totalAktif, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
            { icon: CheckCheck, label: "Selesai", value: totalSelesai, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
          ].map(({ icon: Icon, label, value, color, bg, border }) => (
            <div key={label} className={`rounded-2xl border ${border} ${bg} px-4 py-3 flex items-center gap-3 shadow-sm`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-white shadow-sm border ${border}`}>
                <Icon size={16} className={color} />
              </div>
              <div>
                <p className={`text-lg font-black leading-none ${color}`}>{value}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 font-medium">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100">
            {[
              { id: "aktif", label: "Pesanan Aktif", count: totalAktif },
              { id: "selesai", label: "Sudah Selesai", count: totalSelesai },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setFilterTab(tab.id);
                  setSearch("");
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition-all ${
                  effectiveTab === tab.id
                    ? "text-amber-700 border-b-2 border-amber-500 bg-amber-50/60"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab.label}
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  effectiveTab === tab.id ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-500"
                }`}>{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari Order ID, nama, atau nomor meja..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-400 focus:bg-white transition-all"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-700">Gagal memuat pesanan</p>
              <p className="text-xs text-red-500 mt-0.5 truncate">{error}</p>
            </div>
            <button onClick={() => fetchOrders()} className="flex-shrink-0 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-red-600 transition-all">
              Coba Lagi
            </button>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
                <div className="h-12 bg-gradient-to-r from-gray-100 to-gray-50" />
                <div className="p-4 space-y-3">
                  <div className="h-2.5 bg-gray-100 rounded-full w-1/3" />
                  <div className="space-y-2">
                    <div className="h-2.5 bg-gray-100 rounded-full w-3/4" />
                    <div className="h-2.5 bg-gray-100 rounded-full w-1/2" />
                    <div className="h-2.5 bg-gray-100 rounded-full w-2/3" />
                  </div>
                  <div className="h-10 bg-gray-100 rounded-2xl mt-3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedOrders.map((order) => {
              const hasNotes = order.note || (order.itemNotes && Object.keys(order.itemNotes).length > 0);
              const itemList = (order.items ?? []).filter((i) => (i.qty ?? 1) > 0);
              const chip = statusChip(order.status);
              const isSelesai = isSelesaiStatus(order.status);

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    isSelesai ? "border-gray-100 opacity-80" : "border-gray-100 hover:border-amber-200"
                  }`}
                >
                  <div className={`px-4 py-2.5 flex items-center justify-between border-b ${
                    isSelesai ? "bg-gray-50 border-gray-100" : "bg-gradient-to-r from-amber-50 via-white to-orange-50 border-amber-100"
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-black text-gray-800 text-sm truncate">{order.id}</span>
                      <span className="shrink-0 text-xs text-gray-400 bg-white border border-gray-200 rounded-lg px-2 py-0.5">Meja {order.meja}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${chip.cls}`}>
                        {chip.label}
                      </span>
                      {hasNotes && (
                        <div className="w-5 h-5 bg-orange-400 rounded-md flex items-center justify-center shrink-0">
                          <MessageSquare size={10} className="text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-4 pt-3 pb-2 flex-1">
                    <p className="text-[11px] text-gray-400 mb-2.5">
                      {formatWaktu(order)}{order.nama ? ` · ${order.nama}` : ""}
                    </p>
                    <OrderItemsList itemList={itemList} itemNotes={order.itemNotes} />
                    {order.note && (
                      <div className="mt-2.5 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2 flex items-start gap-2">
                        <MessageSquare size={11} className="text-orange-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-orange-600">{order.note}</p>
                      </div>
                    )}
                  </div>

                  <div className="px-4 pt-2.5 pb-3 border-t border-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-400">{itemList.reduce((s, i) => s + (i.qty ?? 1), 0)} item</span>
                      <span className="font-extrabold text-gray-900">Rp{(order.total ?? 0).toLocaleString("id-ID")}</span>
                    </div>

                    {allowMarkSelesai && !isSelesai && (
                      <button
                        type="button"
                        onClick={() => handleMarkSelesai(order.id)}
                        disabled={!!updatingOrderId}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl py-2.5 font-bold text-sm text-white bg-gradient-to-r from-emerald-500 to-green-500 shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {updatingOrderId === String(order.id) ? (
                          <><Loader2 size={15} className="animate-spin" /> Memproses...</>
                        ) : (
                          <><CheckCircle2 size={15} /> Tandai Selesai</>
                        )}
                      </button>
                    )}

                    {isSelesai && (
                      <div className="flex items-center justify-center gap-1.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-100">
                        <CheckCheck size={14} className="text-emerald-500" />
                        <span className="text-xs font-bold text-emerald-600">Pesanan Selesai</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && !error && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <ClipboardList size={28} className="opacity-40" />
                </div>
                <p className="font-bold text-gray-500">
                  {search.trim() ? "Pesanan tidak ditemukan" : (effectiveTab === "aktif" ? "Belum ada pesanan aktif" : "Belum ada pesanan selesai")}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {search.trim() ? "Coba kata kunci lain" : (effectiveTab === "aktif" ? "Pesanan baru akan muncul otomatis" : "Pesanan selesai akan muncul di sini")}
                </p>
              </div>
            )}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-bold disabled:opacity-40 hover:bg-gray-50 transition-all"
            >
              ← Prev
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                    n === safePage
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm"
                      : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-bold disabled:opacity-40 hover:bg-gray-50 transition-all"
            >
              Next →
            </button>
          </div>
        )}

        <style>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
      </div>
    </div>
  );
}