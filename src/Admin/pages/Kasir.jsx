import { useState, useEffect, useRef, useCallback, useMemo } from "react";

import { useNavigate } from "react-router-dom";

import { 
  QrCode, Search, X, Check, Loader2, 
  Banknote, Receipt, Clock, User, Table2,
  ShoppingCart, Printer, ScanLine, Camera, LogOut, Plus, Sparkles, Minus, CreditCard, Wallet
} from "lucide-react";

import { Html5Qrcode } from "html5-qrcode";

const API_URL = (import.meta.env.VITE_API_URL ?? "https://api.mycafe-order.net").replace(/\/$/, "");

export default function Kasir() {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [kasirCafeId, setKasirCafeId] = useState("");
  const [menuSource, setMenuSource] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState(null);
  const [menuQuery, setMenuQuery] = useState("");

  const showToast = useCallback((msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const formatRupiah = useCallback((n) => `Rp${Number(n || 0).toLocaleString("id-ID")}`, []);

  const formatWaktu = useCallback((raw) => {
    if (!raw) return "";
    try {
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return String(raw);
      return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
    } catch {
      return String(raw);
    }
  }, []);

  const getOrderTotal = useCallback((order) => {
    if (!order) return 0;
    const direct = order.total_bayar ?? order.total ?? order.grand_total ?? order.totalAmount;
    if (direct != null) return Number(direct || 0);
    const subtotal = Number(order.items_total ?? order.subtotal ?? 0);
    const tax = Number(order.tax ?? 0);
    const discount = Number(order.discount ?? 0);
    return Math.max(0, subtotal + tax - discount);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("kasir_user") || localStorage.getItem("user");
      if (!raw) return;
      const u = JSON.parse(raw);
      const cid = u?.cafe_id ?? u?.cafeId ?? u?.cafe?.id ?? u?.cafe?.cafe_id ?? "";
      if (cid) setKasirCafeId(String(cid));
    } catch {
      // ignore
    }
  }, []);

  const [createDraft, setCreateDraft] = useState({
    tableNumber: "",
    customerName: "",
    note: "",
    items: [],
  });

  const handleLogout = () => {
    localStorage.removeItem("kasir_token");
    localStorage.removeItem("kasir_user");
    navigate("/login", { replace: true });
  };

  const closeCreateModal = () => {
    if (createSubmitting) return;
    setShowCreateModal(false);
  };

  const fetchMenuForKasir = useCallback(async () => {
    if (!kasirCafeId) return;
    setMenuLoading(true);
    setMenuError(null);
    try {
      const token = localStorage.getItem("kasir_token") || localStorage.getItem("token") || "";
      const res = await fetch(`${API_URL}/api/menu/user/${encodeURIComponent(kasirCafeId)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
      const rows = data?.data ?? data?.menu ?? data ?? [];
      const normalized = Array.isArray(rows) ? rows.map((m) => ({
        id: m.id ?? m.menu_id ?? m.menuId,
        name: m.nama_menu ?? m.name ?? m.nama ?? "",
        price: Number(m.harga ?? m.price ?? 0),
        raw: m,
      })).filter((m) => m.id != null && m.name) : [];
      setMenuSource(normalized);
    } catch (err) {
      setMenuError(err?.message || "Gagal memuat menu");
      setMenuSource([]);
    } finally {
      setMenuLoading(false);
    }
  }, [kasirCafeId]);

  useEffect(() => {
    if (!showCreateModal) return;
    if (!kasirCafeId) return;
    if (menuSource.length > 0 || menuLoading) return;
    fetchMenuForKasir();
  }, [showCreateModal, kasirCafeId, menuSource.length, menuLoading, fetchMenuForKasir]);

  const filteredMenuSource = useMemo(() => {
    const q = String(menuQuery || "").trim().toLowerCase();
    if (!q) return menuSource;
    return (menuSource || []).filter((m) => String(m?.name || "").toLowerCase().includes(q));
  }, [menuSource, menuQuery]);

  const fetchMenuDetailForKasir = useCallback(async (menuId) => {
    const cid = String(kasirCafeId || "").trim();
    const mid = String(menuId || "").trim();
    if (!cid || !mid) return null;

    const token = localStorage.getItem("kasir_token") || localStorage.getItem("token") || "";

    const res = await fetch(`${API_URL}/api/menu/user/${encodeURIComponent(cid)}/${encodeURIComponent(mid)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
    return data?.data ?? data?.menu ?? data;
  }, [kasirCafeId]);

  const addMenuToDraft = useCallback(async (menuItem) => {
    if (!menuItem) return;

    let detail = null;
    try {
      detail = await fetchMenuDetailForKasir(menuItem.id);
    } catch {
      detail = null;
    }

    const variantRaw = detail?.variants ?? detail?.varian ?? detail?.variant ?? detail?.varian_menu ?? [];
    const variantList = Array.isArray(variantRaw) ? variantRaw : [];
    const normalizedVariants = variantList.map((v) => ({
      id: v.id ?? v.id_variant ?? v.variant_id ?? v.variantId,
      label: v.label ?? v.nama ?? v.name ?? "",
      namaGroup: v.nama_group ?? v.nama_grup ?? v.namaGroup ?? v.group ?? "Varian",
      hargaVariant: Number(v.harga_variant ?? v.hargaVariant ?? v.extra_price ?? 0),
    })).filter((v) => v.id != null && v.label);

    const byGroup = normalizedVariants.reduce((acc, v) => {
      const g = String(v.namaGroup || "Varian");
      acc[g] = acc[g] ? [...acc[g], v] : [v];
      return acc;
    }, {});

    const groups = Object.entries(byGroup).map(([namaGroup, options]) => ({ namaGroup, options }));

    setCreateDraft((prev) => {
      const items = Array.isArray(prev.items) ? [...prev.items] : [];
      const idx = items.findIndex((it) => String(it.menuId) === String(menuItem.id));
      if (idx >= 0) {
        const next = { ...items[idx] };
        next.qty = Number(next.qty || 0) + 1;
        items[idx] = next;
      } else {
        items.push({
          menuId: menuItem.id,
          name: menuItem.name,
          price: Number(menuItem.price || 0),
          qty: 1,
          note: "",
          variantGroups: groups,
          selectedVariants: {},
        });
      }
      return { ...prev, items };
    });
  }, [fetchMenuDetailForKasir]);

  const addCreateItem = useCallback(() => {
    setCreateDraft((prev) => ({
      ...prev,
      items: [...(prev.items || []), { menuId: "", name: "", price: 0, qty: 1, note: "", variantGroups: [] }],
    }));
  }, []);

  const updateCreateItem = useCallback((index, patch) => {
    setCreateDraft((prev) => {
      const items = [...(prev.items || [])];
      if (index < 0 || index >= items.length) return prev;
      items[index] = { ...items[index], ...(typeof patch === "function" ? patch(items[index]) : patch) };
      return { ...prev, items };
    });
  }, []);

  const removeCreateItem = useCallback((index) => {
    setCreateDraft((prev) => {
      const items = [...(prev.items || [])];
      if (index < 0 || index >= items.length) return prev;
      items.splice(index, 1);
      return { ...prev, items };
    });
  }, []);

  const createPreviewTotal = useMemo(() => (
    (createDraft.items || []).reduce((sum, it) => {
      const qty = Number(it?.qty || 0);
      const price = Number(it?.price || 0);
      const selected = it?.selectedVariants && typeof it.selectedVariants === "object" ? it.selectedVariants : {};
      const extra = Object.values(selected).reduce((s, v) => s + Number(v?.hargaVariant || 0), 0);
      return sum + (qty * (price + extra));
    }, 0)
  ), [createDraft.items]);

  const handleSearch = useCallback(async (overrideCode) => {
    const code = String(overrideCode ?? searchInput ?? "").trim();
    if (!code) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("kasir_token") || localStorage.getItem("token") || "";
      if (!token) throw new Error("Token kasir tidak ditemukan");

      // endpoint fallback: coba beberapa path yang umum dipakai backend
      const candidates = [
        `${API_URL}/api/orders/admin/${encodeURIComponent(code)}`,
        `${API_URL}/api/orders/${encodeURIComponent(code)}`,
        `${API_URL}/api/orders/kasir/${encodeURIComponent(code)}`,
      ];

      let data = null;
      let ok = false;
      for (const url of candidates) {
        // eslint-disable-next-line no-await-in-loop
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        // eslint-disable-next-line no-await-in-loop
        const json = await res.json().catch(() => ({}));
        if (res.ok) {
          ok = true;
          data = json;
          break;
        }
      }

      if (!ok) throw new Error("Pesanan tidak ditemukan");

      const order = data?.data ?? data?.order ?? data;
      setCurrentOrder(order);
    } catch (err) {
      setCurrentOrder(null);
      showToast(err?.message || "Gagal mencari pesanan", "error");
    } finally {
      setLoading(false);
    }
  }, [searchInput, showToast]);

  const handleSimulatedScan = useCallback((decodedText) => {
    const code = String(decodedText || "").trim();
    if (!code) return;
    setSearchInput(code);
    setScanning(false);
    handleSearch(code);
  }, [handleSearch]);

  const processPayment = useCallback(async (method) => {
    if (!paymentModal) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("kasir_token") || localStorage.getItem("token") || "";
      if (!token) throw new Error("Token kasir tidak ditemukan");

      const orderId = paymentModal.id ?? paymentModal.order_id ?? paymentModal.orderId;
      if (!orderId) throw new Error("Order ID tidak ditemukan");

      const res = await fetch(`${API_URL}/api/orders/kasir/${encodeURIComponent(orderId)}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "selesai", payment_method: method || "kasir" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data?.message || `HTTP ${res.status}`);

      const updated = data?.data ?? data?.order ?? { ...paymentModal, status: "selesai" };
      setCurrentOrder(updated);
      setPaymentModal(null);
      showToast("Pembayaran berhasil", "success");
    } catch (err) {
      showToast(err?.message || "Gagal memproses pembayaran", "error");
    } finally {
      setLoading(false);
    }
  }, [paymentModal, showToast]);

  const handlePrint = useCallback(() => {
    try { window.print(); } catch {}
  }, []);

  const handleSubmitCreatePreview = async () => {
    const tableNumber = String(createDraft.tableNumber || "").trim();
    const validItems = (createDraft.items || []).filter((i) => {
      const qty = Number(i.qty || 0);
      const hasMenuId = !!i.menuId;
      const hasName = String(i.name || "").trim().length > 0;
      return qty > 0 && (hasMenuId || hasName);
    });

    if (!tableNumber) {
      showToast("Nomor meja wajib diisi", "error");
      return;
    }

    setCreateSubmitting(true);
    try {
      const token = localStorage.getItem("kasir_token") || localStorage.getItem("token") || "";
      if (!token) throw new Error("Token kasir tidak ditemukan");

      const payload = {
        table_number: tableNumber,
        customer_name: String(createDraft.customerName || "").trim(),
        note: String(createDraft.note || "").trim(),
        payment_method: "kasir",
        items: validItems.map((i) => {
          const selected = i?.selectedVariants && typeof i.selectedVariants === "object" ? i.selectedVariants : {};
          const pickedVariants = Object.entries(selected).map(([namaGroup, v]) => ({
            id: v?.id,
            id_variant: v?.id,
            variant_id: v?.id,
            nama_group: namaGroup,
            namaGroup,
            label: v?.label,
            harga_variant: Number(v?.hargaVariant || 0),
            hargaVariant: Number(v?.hargaVariant || 0),
          })).filter((v) => v.id != null);

          const row = {
            menu_id: i.menuId || undefined,
            name: i.menuId ? undefined : String(i.name || "").trim(),
            qty: Number(i.qty || 1),

            price: Number(i.price || 0),
            note: String(i.note || "").trim(),
            variants: pickedVariants,
            variant_ids: pickedVariants.map((v) => v.id),
          };
          const groups = i.variantGroups || [];
          if (i.menuId && groups.length > 0) {
            // ... (no changes)
          }

          return row;
        }),
      };

      const candidates = [
        `${API_URL}/api/orders/kasir`,
        `${API_URL}/api/orders/admin`,
        `${API_URL}/api/orders`,
      ];

      let createdRes = null;
      let createdOk = false;
      for (const url of candidates) {
        // eslint-disable-next-line no-await-in-loop
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        // eslint-disable-next-line no-await-in-loop
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.success !== false) {
          createdOk = true;
          createdRes = data;
          break;
        }
      }

      if (!createdOk) throw new Error("Gagal membuat pesanan");

      const createdOrder = createdRes?.data ?? createdRes?.order ?? createdRes;
      setCurrentOrder(createdOrder);

      const createdCode = createdOrder?.id ?? createdOrder?.order_code ?? createdOrder?.orderId ?? createdOrder?.order_id;
      if (createdCode) {
        try {
          setSearchInput(String(createdCode));
          await handleSearch(String(createdCode));
        } catch {
          // ignore
        }
      }

      setShowCreateModal(false);
      setCreateDraft({
        tableNumber: "",
        customerName: "",
        note: "",
        items: [],
      });
      showToast("Pesanan berhasil dibuat", "success");
    } catch (err) {
      showToast(err?.message || "Gagal membuat pesanan", "error");
    } finally {
      setCreateSubmitting(false);
    }
  };

  // ... (no changes)

  return (
    <div className="min-h-screen" style={{ background: "var(--bg, #f9fafb)", color: "var(--tx, #111827)" }}>
      // ... (no changes)
      <header className="bg-gradient-to-r from-gray-800 to-gray-900 text-white sticky top-0 z-20 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
              <QrCode size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-lg leading-none">Halaman Kasir</h1>
              {/* <p className="text-gray-400 text-[10px]">{cafeInfo.nama?.toUpperCase()} POS</p> */}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-400">{new Date().toLocaleDateString("id-ID")}</p>
              <p className="text-sm font-bold">{new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/10 hover:bg-red-500/80 text-white rounded-xl px-3 py-2 text-xs font-bold transition-all border border-white/10"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 lg:p-6 space-y-4 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl lg:text-2xl font-black text-gray-900">Kasir</h1>
            <p className="text-gray-400 text-sm">Scan QR atau cari pesanan untuk pembayaran</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-white text-amber-700 rounded-xl px-4 py-2.5 font-bold shadow-sm hover:shadow-md transition-all text-sm border border-amber-200"
            >
              <Plus size={18} /> Buat Pesanan
            </button>
            <button
              onClick={() => navigate("/kasir/orders")}
              className="flex items-center gap-2 bg-white text-gray-800 rounded-xl px-4 py-2.5 font-bold shadow-sm hover:shadow-md transition-all text-sm border border-gray-200"
            >
              <Receipt size={18} /> Kelola Pesanan
            </button>
            <button
              onClick={() => setScanning(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl px-4 py-2.5 font-bold shadow-lg hover:shadow-xl transition-all text-sm"
            >
              <ScanLine size={18} /> Scan QR
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Scan QR atau ketik kode pesanan..."
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-amber-500 transition-all"
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={loading || !searchInput.trim()}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              Cari
            </button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3">
              <h2 className="font-bold text-white flex items-center gap-2"><Receipt size={18} />Detail Pesanan</h2>
            </div>
            <div className="p-4">
              {currentOrder ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-2xl font-black text-gray-900">#{currentOrder.id || currentOrder.order_code}</p>
                      {!!currentOrder.qr_code && (
                        <div className="mt-2">
                          <img
                            src={currentOrder.qr_code}
                            alt="QR Pesanan"
                            className="w-24 h-24 rounded-xl border border-gray-200 bg-white p-1"
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          currentOrder.status === "selesai" ? "bg-green-100 text-green-700" :
                          currentOrder.status === "siap"   ? "bg-blue-100 text-blue-700" :
                          currentOrder.status === "lunas"  ? "bg-green-100 text-green-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>{currentOrder.status?.toUpperCase() || "BARU"}</span>
                        <span className="text-gray-400 text-xs">
                          <Clock size={10} className="inline mr-1" />
                          {formatWaktu(currentOrder.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Meja</p>
                      <p className="font-bold text-gray-900 flex items-center justify-end gap-1">
                        <Table2 size={14} />{currentOrder.meja ?? currentOrder.meja_id ?? currentOrder.nomor_meja ?? "-"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                      <User size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{currentOrder.nama || currentOrder.customer_name || "Pelanggan"}</p>
                      <p className="text-xs text-gray-500">{currentOrder.items?.length || 0} item • {formatRupiah(getOrderTotal(currentOrder))}</p>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    <p className="text-xs font-bold text-gray-400 uppercase">Item Pesanan</p>
                    {(currentOrder.items || currentOrder.order_items || []).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center text-xs font-bold">
                            {item.quantity || item.qty}
                          </span>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{item.name || item.nama_menu}</p>
                            {(item.note || item.catatan) && <p className="text-[10px] text-gray-400">{item.note || item.catatan}</p>}
                          </div>
                        </div>
                        <p className="font-bold text-gray-900 text-sm">
                          {formatRupiah(item.subtotal ?? ((item.price || item.harga) * (item.quantity || item.qty)))}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-amber-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold">{formatRupiah(currentOrder.items_total ?? currentOrder.subtotal)}</span>
                    </div>
                    {currentOrder.discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Diskon</span>
                        <span className="font-semibold">-{formatRupiah(currentOrder.discount)}</span>
                      </div>
                    )}
                    {currentOrder.tax > 0 && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Pajak</span>
                        <span className="font-semibold">{formatRupiah(currentOrder.tax)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg pt-2 border-t border-amber-200">
                      <span className="font-bold text-gray-900">TOTAL</span>
                      <span className="font-black text-amber-600">{formatRupiah(getOrderTotal(currentOrder))}</span>
                    </div>
                  </div>

                  {currentOrder.status !== "selesai" ? (
                    <button
                      onClick={() => setPaymentModal(currentOrder)}
                      disabled={loading}
                      className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Banknote size={20} /> Bayar Sekarang
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={handlePrint} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                        <Printer size={16} /> Cetak Struk
                      </button>
                      <button onClick={() => setCurrentOrder(null)} className="flex-1 py-3 bg-amber-100 text-amber-700 rounded-xl font-bold hover:bg-amber-200 transition-all">
                        Pesanan Baru
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="font-semibold">Belum ada pesanan dipilih</p>
                  <p className="text-xs mt-1">Scan QR atau cari kode pesanan</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {scanning && <QRScanModal onClose={() => setScanning(false)} onScan={handleSimulatedScan} />}
      {paymentModal && (
        <PaymentModal
          order={paymentModal}
          onClose={() => setPaymentModal(null)}
          onPay={processPayment}
          loading={loading}
          formatRupiah={formatRupiah}
        />
      )}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px] p-3 sm:p-4 flex items-end sm:items-center justify-center" onClick={closeCreateModal}>
          <div
            className="w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:hidden pt-2 flex justify-center">
              <span className="w-10 h-1.5 rounded-full bg-white/70" />
            </div>
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 sm:px-5 py-3.5 flex items-center justify-between">
              <div className="min-w-0">
                <h2 className="text-white font-black text-base sm:text-lg flex items-center gap-2">
                  <Sparkles size={16} /> Buat Pesanan Kasir
                </h2>
                <p className="text-white/85 text-[11px] sm:text-xs">Inspirasi tampilan user, disesuaikan untuk kasir</p>
              </div>
              <button disabled={createSubmitting} onClick={closeCreateModal} className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center hover:bg-white/30 disabled:opacity-50">
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[72vh] overflow-y-auto p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-[11px] font-bold text-gray-500 uppercase">No Meja</span>
                  <input
                    value={createDraft.tableNumber}
                    onChange={(e) => setCreateDraft((prev) => ({ ...prev, tableNumber: e.target.value }))}
                    placeholder="Contoh: 12"
                    className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-amber-500 focus:bg-white transition-all"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] font-bold text-gray-500 uppercase">Nama Pelanggan</span>
                  <input
                    value={createDraft.customerName}
                    onChange={(e) => setCreateDraft((prev) => ({ ...prev, customerName: e.target.value }))}
                    placeholder="Opsional"
                    className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-amber-500 focus:bg-white transition-all"
                  />
                </label>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-black text-gray-800">Pilih Dari Menu</p>
                  <span className="text-[11px] font-semibold text-gray-400 whitespace-nowrap">
                    {menuQuery.trim()
                      ? `${filteredMenuSource.length}/${menuSource.length}`
                      : menuSource.length}{" "}
                    menu
                  </span>
                </div>
                {menuError && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span>{menuError}</span>
                    {kasirCafeId ? (
                      <button
                        type="button"
                        onClick={() => fetchMenuForKasir()}
                        className="shrink-0 text-[11px] font-bold text-amber-800 underline"
                      >
                        Muat ulang
                      </button>
                    ) : null}
                  </div>
                )}
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={menuQuery}
                    onChange={(e) => setMenuQuery(e.target.value)}
                    placeholder="Cari menu..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 py-2 text-sm outline-none focus:border-amber-400 focus:bg-white"
                  />
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-2 max-h-48 overflow-y-auto space-y-1.5">
                  {menuLoading ? (
                    <p className="text-xs text-gray-400 px-2 py-2">Memuat menu...</p>
                  ) : filteredMenuSource.length === 0 ? (
                    <p className="text-xs text-gray-400 px-2 py-2">
                      {menuSource.length === 0
                        ? (menuError ? "Lihat pesan di atas." : "Belum ada data menu. Tunggu sebentar atau tap Muat ulang.")
                        : "Menu tidak ditemukan untuk kata kunci ini"}
                    </p>
                  ) : (
                    filteredMenuSource.slice(0, 40).map((menuItem) => (
                      <button
                        key={menuItem.id}
                        type="button"
                        onClick={() => addMenuToDraft(menuItem)}
                        className="w-full rounded-xl bg-white border border-gray-100 px-3 py-2 text-left hover:border-amber-300 hover:bg-amber-50/40 transition-all flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{menuItem.name}</p>
                          <p className="text-xs font-semibold text-amber-700">{formatRupiah(menuItem.price)}</p>
                        </div>
                        <span className="w-7 h-7 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-center">
                          <Plus size={13} />
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-gray-800">Item Pesanan</p>
                  <button onClick={addCreateItem} className="text-xs font-bold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1">
                    <Plus size={12} /> Tambah Item Manual
                  </button>
                </div>

                {(createDraft.items || []).length === 0 && (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
                    <p className="text-xs font-semibold text-gray-500">Belum ada item. Pilih dari daftar menu di atas.</p>
                  </div>
                )}

                {(createDraft.items || []).map((item, idx) => (
                  <KasirCreateLineItem
                    key={idx}
                    item={item}
                    index={idx}
                    kasirCafeId={kasirCafeId}
                    apiBase={API_URL}
                    updateCreateItem={updateCreateItem}
                    onRemove={removeCreateItem}
                    formatRupiah={formatRupiah}
                  />
                ))}
              </div>

              <label className="block space-y-1">
                <span className="text-[11px] font-bold text-gray-500 uppercase">Catatan Pesanan</span>
                <textarea
                  value={createDraft.note}
                  onChange={(e) => setCreateDraft((prev) => ({ ...prev, note: e.target.value }))}
                  rows={3}
                  placeholder="Opsional"
                  className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none resize-none focus:border-amber-500 focus:bg-white transition-all"
                />
              </label>
            </div>

            <div className="border-t border-gray-100 p-4 flex items-center justify-between gap-3 bg-white/95 backdrop-blur-sm">
              <div>
                <p className="text-[11px] font-semibold text-gray-400">Total Preview</p>
                <p className="text-lg font-black text-amber-600">{formatRupiah(createPreviewTotal)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button disabled={createSubmitting} onClick={closeCreateModal} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 disabled:opacity-50">
                  Batal
                </button>
                <button
                  disabled={createSubmitting}
                  onClick={handleSubmitCreatePreview}
                  className="px-4 py-2.5 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-amber-500 to-orange-500 shadow-md hover:shadow-lg disabled:opacity-60 inline-flex items-center gap-1.5"
                >
                  {createSubmitting ? <><Loader2 size={14} className="animate-spin" /> Memproses...</> : "Simpan Pesanan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slideInRight { animation: slideInRight 0.3s cubic-bezier(0.16,1,0.3,1); }
        @keyframes slideUp { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slideUp { animation: slideUp 0.28s ease-out; }
      `}</style>
    </div>
  );
}

function KasirCreateLineItem({ item, index, updateCreateItem, onRemove, formatRupiah }) {
  const qty = Number(item?.qty || 0);
  const name = String(item?.name || "");
  const price = Number(item?.price || 0);
  const note = String(item?.note || "");

  const groups = Array.isArray(item?.variantGroups) ? item.variantGroups : [];
  const selected = item?.selectedVariants && typeof item.selectedVariants === "object" ? item.selectedVariants : {};

  const handlePick = (namaGroup, opt) => {
    updateCreateItem(index, (prev) => {
      const nextSelected = { ...(prev?.selectedVariants && typeof prev.selectedVariants === "object" ? prev.selectedVariants : {}) };
      if (opt) nextSelected[namaGroup] = opt;
      else delete nextSelected[namaGroup];
      return { selectedVariants: nextSelected };
    });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-gray-500 uppercase">Item {index + 1}</p>
          <p className="text-sm font-black text-gray-900 truncate">{name || "Item"}</p>
          <p className="text-xs font-semibold text-amber-700">{formatRupiah(price)}</p>
        </div>
        <button
          type="button"
          onClick={() => onRemove?.(index)}
          className="w-8 h-8 rounded-xl bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 flex items-center justify-center"
          title="Hapus"
        >
          <X size={15} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="text-[10px] font-bold text-gray-500 uppercase">Nama</span>
          <input
            value={name}
            onChange={(e) => updateCreateItem(index, { name: e.target.value })}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold outline-none focus:border-amber-400 focus:bg-white"
            placeholder="Nama menu"
          />
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-bold text-gray-500 uppercase">Harga</span>
          <input
            type="number"
            value={Number.isFinite(price) ? price : 0}
            onChange={(e) => updateCreateItem(index, { price: Number(e.target.value || 0) })}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold outline-none focus:border-amber-400 focus:bg-white"
            placeholder="0"
          />
        </label>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-gray-600">Qty</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => updateCreateItem(index, (prev) => ({ qty: Math.max(0, Number(prev?.qty || 0) - 1) }))}
            className="w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 flex items-center justify-center"
          >
            <Minus size={15} />
          </button>
          <span className="min-w-[40px] text-center font-black text-gray-900">{qty}</span>
          <button
            type="button"
            onClick={() => updateCreateItem(index, (prev) => ({ qty: Number(prev?.qty || 0) + 1 }))}
            className="w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 flex items-center justify-center"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      <label className="space-y-1 block">
        <span className="text-[10px] font-bold text-gray-500 uppercase">Catatan</span>
        <input
          value={note}
          onChange={(e) => updateCreateItem(index, { note: e.target.value })}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:bg-white"
          placeholder="Opsional"
        />
      </label>

      {groups.length > 0 && (
        <div className="pt-1 space-y-2">
          {groups.map((g) => {
            const namaGroup = String(g?.namaGroup || "Varian");
            const options = Array.isArray(g?.options) ? g.options : [];
            const pickedId = selected?.[namaGroup]?.id;

            if (options.length === 0) return null;

            return (
              <div key={namaGroup} className="rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden">
                <div className="px-3.5 pt-3 pb-2">
                  <p className="text-[11px] font-black text-gray-900 uppercase tracking-wide">{namaGroup}</p>
                  <p className="text-[10px] font-semibold text-amber-700 mt-0.5">Harus dipilih maks. 1</p>
                </div>
                <div className="px-2 pb-2 space-y-1">
                  {options.map((opt, oi) => {
                    const id = opt?.id ?? oi;
                    const isSelected = String(pickedId) === String(id);
                    const extra = Number(opt?.hargaVariant || 0);

                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handlePick(namaGroup, { id: opt.id, label: opt.label, namaGroup, hargaVariant: extra })}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white border border-gray-100 hover:border-amber-300 transition-all"
                      >
                        <span className="text-sm font-semibold text-gray-800 text-left">
                          {opt.label}
                          {extra > 0 && <span className="ml-2 text-xs font-black text-amber-700">(+{formatRupiah(extra)})</span>}
                        </span>
                        <span
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? "bg-amber-500 border-amber-500" : "bg-white border-gray-300"}`}
                        >
                          {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QR SCAN MODAL
// ─────────────────────────────────────────────────────────────────────────────
function QRScanModal({ onClose, onScan }) {
  const [manualCode, setManualCode]     = useState("");
  const [cameraStatus, setCameraStatus] = useState("idle"); // idle | loading | active | error
  const [cameraError, setCameraError]   = useState("");
  const inputRef   = useRef(null);
  const scannerRef = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => startCamera(), 500);
    return () => { clearTimeout(t); stopCamera(); };
  }, []);

  const startCamera = async () => {
    if (startedRef.current) return;

    startedRef.current = true;
    setCameraStatus("loading");
    setCameraError("");

    try {
      if (!document.getElementById("qr-reader")) {
        throw new Error("Elemen kamera tidak ditemukan.");
      }

      const cameras = await Html5Qrcode.getCameras();

      if (!cameras || cameras.length === 0) {
        throw new Error("Tidak ada kamera ditemukan.");
      }

      const backCamera =
        cameras.find((cam) =>
          cam.label.toLowerCase().includes("back")
        ) || cameras[0];

      scannerRef.current = new Html5Qrcode("qr-reader");

      await scannerRef.current.start(
        backCamera.id,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          stopCamera();
          onScan(decodedText);
        },
        () => {}
      );

      setCameraStatus("active");
    } catch (err) {
      console.error("Camera error:", err);

      startedRef.current = false;
      setCameraStatus("error");

      if (err?.name === "NotAllowedError") {
        setCameraError("Izin kamera ditolak. Izinkan akses kamera di browser.");
      } else {
        setCameraError(err?.message || "Gagal mengakses kamera.");
      }
    }
  };

  const stopCamera = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop().catch(() => {});
        await scannerRef.current.clear().catch(() => {});
      }
    } catch (err) {
      console.log("stop camera error", err);
    }

    startedRef.current = false;
  };

  const handleRetry = async () => { await stopCamera(); startCamera(); };
  const handleClose = () => { stopCamera(); onClose(); };
  const handleManualSubmit = () => {
    if (manualCode.trim()) { stopCamera(); onScan(manualCode.trim()); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-white" />
            <span className="font-bold text-white text-sm">Scan QR Pesanan</span>
          </div>
          <button onClick={handleClose} className="text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Camera viewport */}
        <div className="relative bg-black" style={{ minHeight: 300 }}>

          <div
            id="qr-reader"
            className="w-full"
            style={{
              width: "100%",
              height: cameraStatus === "active" ? "300px" : "0px",
              visibility: cameraStatus === "active" ? "visible" : "hidden",
              overflow: "hidden",
              position: "absolute",
              top: 0,
              left: 0
            }}
          />

          {/* Loading */}
          {(cameraStatus === "idle" || cameraStatus === "loading") && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ minHeight: 300 }}>
              <Loader2 size={40} className="text-amber-500 animate-spin" />
              <p className="text-gray-300 text-sm font-semibold">Meminta izin kamera...</p>
              <p className="text-gray-500 text-xs text-center px-8 leading-relaxed">
                Browser akan menampilkan popup izin.<br />
                Pilih <strong className="text-amber-400">Izinkan</strong> untuk melanjutkan.
              </p>
            </div>
          )}

          {/* Error */}
          {cameraStatus === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-3" style={{ minHeight: 300 }}>
              <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center">
                <Camera size={28} className="text-red-400" />
              </div>
              <div>
                <p className="text-gray-200 text-sm font-semibold mb-1">Gagal mengakses kamera</p>
                <p className="text-gray-500 text-xs leading-relaxed">{cameraError}</p>
              </div>
              <button
                onClick={handleRetry}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-all"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* Active overlay */}
          {cameraStatus === "active" && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-3 left-3 w-10 h-10 border-t-4 border-l-4 border-amber-400 rounded-tl-xl" />
              <div className="absolute top-3 right-3 w-10 h-10 border-t-4 border-r-4 border-amber-400 rounded-tr-xl" />
              <div className="absolute bottom-3 left-3 w-10 h-10 border-b-4 border-l-4 border-amber-400 rounded-bl-xl" />
              <div className="absolute bottom-3 right-3 w-10 h-10 border-b-4 border-r-4 border-amber-400 rounded-br-xl" />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                <span className="bg-amber-500/90 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  Mencari QR...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Manual input */}
        <div className="p-4 bg-gray-800 space-y-3">
          <p className="text-center text-gray-400 text-xs">Atau masukkan kode manual:</p>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
              placeholder="KODE PESANAN..."
              className="flex-1 px-3 py-2.5 bg-gray-700 text-white placeholder-gray-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 uppercase tracking-wider"
            />
            <button
              onClick={handleManualSubmit}
              disabled={!manualCode.trim()}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 text-white rounded-xl font-bold text-sm transition-all"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT MODAL
// ─────────────────────────────────────────────────────────────────────────────
function PaymentModal({ order, onClose, onPay, loading, formatRupiah }) {
  const [cashAmount, setCashAmount] = useState("");
  const total  = order?.total_bayar ?? order?.total ?? order?.subtotal ?? order?.items_total ?? 0;
  const change = Number(cashAmount) - total;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white text-lg">Pembayaran Tunai</h2>
            <p className="text-white/70 text-xs">Input uang yang diterima</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="text-center py-4 bg-green-50 rounded-2xl">
            <p className="text-sm text-gray-600 mb-1">Total Pembayaran</p>
            <p className="text-3xl font-black text-green-600">{formatRupiah(total)}</p>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase">Uang Diterima</p>
            <input
              type="number"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              placeholder="Masukkan jumlah uang..."
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-lg font-bold text-center outline-none focus:border-green-500 transition-all"
            />
            {change >= 0 && cashAmount && (
              <div className="bg-green-100 rounded-xl p-3 text-center">
                <p className="text-sm text-green-700">Kembalian</p>
                <p className="text-xl font-bold text-green-800">{formatRupiah(change)}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => onPay("tunai")}
            disabled={loading || !cashAmount || change < 0}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading
              ? <><Loader2 size={20} className="animate-spin" /> Memproses...</>
              : <><Check size={20} /> Konfirmasi Pembayaran</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}