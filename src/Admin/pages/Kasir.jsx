import { useState, useEffect, useRef } from "react";

import { useNavigate } from "react-router-dom";

import { 
  QrCode, Search, X, Check, Loader2, 
  Banknote, Receipt, Clock, User, Table2,
  ShoppingCart, Printer, ScanLine, Camera, LogOut, Plus, Sparkles, Minus
} from "lucide-react";

import { Html5Qrcode } from "html5-qrcode";



const API_URL = import.meta.env.VITE_API_URL ?? "https://api.mycafe-order.net";
const THEME_CACHE_KEY = "MYCAFE_admin_theme";



// Theme utilities (shared with User and Admin)
function parseTheme(raw) {
  const DEF = { primary: "#f59e0b", secondary: "#ea580c", bg: "#f9fafb", text: "#111827" };
  if (!raw) return DEF;
  try {
    const p = typeof raw === "string" ? JSON.parse(raw) : raw;
    return { primary: p.primary ?? DEF.primary, secondary: p.secondary ?? DEF.secondary,
             bg: p.bg ?? DEF.bg, text: p.text ?? DEF.text };
  } catch { return DEF; }
}

function contrast(hex) {
  try {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return (0.299*r + 0.587*g + 0.114*b)/255 > 0.55 ? "#111827" : "#ffffff";
  } catch { return "#ffffff"; }
}

function ha(hex, a) {
  try {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  } catch { return hex; }
}

function applyThemeVars(theme) {
  const onP = contrast(theme.primary);
  const vars = [
    `--p:${theme.primary}`, `--s:${theme.secondary}`, `--bg:${theme.bg}`, `--tx:${theme.text}`,
    `--on-p:${onP}`, `--p-20:${ha(theme.primary, 0.2)}`,
    `--bg-soft:${ha(theme.primary, 0.07)}`,
    `--grad:linear-gradient(135deg,${theme.primary},${theme.secondary})`,
  ].join(";");
  document.documentElement.setAttribute("style", vars);
}

// Inject tema dari cache SEBELUM render pertama
try {
  const cached = localStorage.getItem(THEME_CACHE_KEY);
  if (cached) applyThemeVars(JSON.parse(cached));
} catch {}



const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("kasir_token") || localStorage.getItem("token") || ""}`,
});

function parseDateFlexible(raw) {
  if (!raw) return null;
  if (raw instanceof Date) return raw;
  const str = String(raw).trim();
  if (!str) return null;
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (m) {
    const [, y, mo, d, hh, mm, ss = 0] = m.map(Number);
    return new Date(Date.UTC(y, mo - 1, d, hh - 7, mm, ss));
  }
  const dt = new Date(str);
  return isNaN(dt.getTime()) ? null : dt;
}



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
  const [menuQuery, setMenuQuery] = useState("");
  const [createDraft, setCreateDraft] = useState({
    tableNumber: "",
    customerName: "",
    note: "",
    items: [],
  });
  const [cafeInfo, setCafeInfo] = useState({ nama: "MYCAFE", alamat: "Ciakar, Tasikmalaya" });


  // ─── PERBAIKAN 2: fetchCafeSettings — cek content-type sebelum .json() ───
  useEffect(() => {
    const fetchCafeSettings = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("kasir_user") || "{}");
        // Coba semua kemungkinan field untuk cafeId
        const cafeId = user?.cafe_id ?? user?.cafeId ?? user?.id ?? "";
        setKasirCafeId(String(cafeId || ""));

        if (!cafeId) {
          console.warn("No cafe ID found in kasir user data:", user);
          return; // Skip tanpa crash
        }

        const res = await fetch(`${API_URL}/api/cafe/${cafeId}`, {
          headers: authHeaders(),
        });

        // Pastikan response JSON sebelum parse — mencegah "Unexpected token '<'"
        const contentType = res.headers.get("content-type") || "";
        if (!res.ok || !contentType.includes("application/json")) {
          console.warn("Cafe settings not available:", res.status);
          return;
        }

        const data = await res.json();
        const cafe = data.data ?? data ?? null;

        setCafeInfo({
          nama: cafe?.nama_cafe || "MYCAFE",
          alamat: cafe?.alamat || "Ciakar, Tasikmalaya",
          logo: cafe?.logo_cafe || null,
        });

        if (cafe?.tema_colors) {
          const theme = parseTheme(cafe.tema_colors);
          applyThemeVars(theme);
          try {
            localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(theme));
          } catch (err) {
            console.warn("Failed to save theme to localStorage:", err);
          }
        }
      } catch (err) {
        // Jangan tampilkan error ke user, hanya log
        console.warn("Failed to fetch cafe settings:", err.message);
      }
    };

    fetchCafeSettings();
  }, []);

  useEffect(() => {
    const fetchMenuForKasir = async () => {
      if (!kasirCafeId) return;
      setMenuLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/menu/user/${encodeURIComponent(kasirCafeId)}`, {
          headers: authHeaders(),
        });
        const ct = res.headers.get("content-type") || "";
        const payload = ct.includes("application/json") ? await res.json().catch(() => ({})) : {};
        if (!res.ok) throw new Error(payload?.message || `HTTP ${res.status}`);
        const raw = payload?.data ?? payload?.menu ?? payload ?? [];
        const normalized = (Array.isArray(raw) ? raw : []).map((m) => ({
          id: m.id,
          name: m.name ?? m.nama_menu ?? m.nama ?? "",
          price: Number(m.price ?? m.harga ?? 0),
          image: m.image_url ?? m.image ?? m.foto ?? m.gambar ?? "",
        })).filter((m) => m.id && m.name);
        setMenuSource(normalized);
      } catch (err) {
        console.warn("Failed to fetch kasir menu list:", err?.message || err);
      } finally {
        setMenuLoading(false);
      }
    };

    fetchMenuForKasir();
  }, [kasirCafeId]);

  const normalizePaymentDetail = (payload) => payload?.data ?? payload;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("kasir_user");
    navigate("/login", { replace: true });
  };

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSearch = async (rawCode) => {
    const code = (rawCode ?? searchInput)?.toString().trim().toUpperCase();
    if (!code) return;
    const orderId = code.startsWith("ORDER:") ? code.replace("ORDER:", "").trim() : code;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}`, { headers: authHeaders() });
      if (!res.ok) {
        showToast("Pesanan tidak ditemukan", "error");
        return;
      }

      const data = await res.json();
      const orderDetail = normalizePaymentDetail(data.data ?? data);

      let orderStatusPayload = null;
      try {
        const resStatus = await fetch(`${API_URL}/api/orders/${orderId}/status`, { headers: authHeaders() });
        if (resStatus.ok) orderStatusPayload = await resStatus.json();
      } catch (err) {
        console.warn("Failed to fetch order status:", err);
      }

      const statusData = orderStatusPayload?.data ?? orderStatusPayload ?? null;
      const merged = {
        ...(orderDetail ?? {}),
        ...(statusData && typeof statusData === "object" ? statusData : {}),
        qr_code: statusData?.qr_code ?? orderDetail?.qr_code,
        id: orderDetail?.id ?? orderId,
        status: orderDetail?.status ?? statusData?.status ?? "pending",
      };

      setCurrentOrder(merged);
      showToast("Pesanan ditemukan!", "success");
    } catch {
      showToast("Gagal mencari pesanan", "error");
    } finally {
      setLoading(false);
      setSearchInput("");
    }
  };

  const handleSimulatedScan = (code) => { setScanning(false); handleSearch(code); };

  // ─── processPayment ───────────────────────────────────────────────────────
  const processPayment = async () => {
    if (!currentOrder) return;

    // DEBUG: cek token
  const token = localStorage.getItem("kasir_token");
  console.log("Token:", token);
  console.log("Order ID:", currentOrder.id);
  console.log("Headers:", authHeaders());
    setLoading(true);
    try {
      const paymentMethod = String(currentOrder?.payment_method ?? currentOrder?.paymentMethod ?? currentOrder?.method ?? "").toLowerCase();
      const isOnline = paymentMethod === "online";

      if (isOnline) {
        try {
          const statusRes = await fetch(`${API_URL}/api/midtrans/status/${encodeURIComponent(currentOrder.id)}`, {
            headers: authHeaders(),
          });
          const ct = statusRes.headers.get("content-type") || "";
          const statusPayload = ct.includes("application/json") ? await statusRes.json().catch(() => ({})) : {};
          if (!statusRes.ok) {
            throw new Error(statusPayload?.message || `Gagal cek status pembayaran (${statusRes.status})`);
          }

          const raw = statusPayload?.data ?? statusPayload;
          const tx = String(raw?.transaction_status ?? raw?.transactionStatus ?? raw?.status ?? "").toLowerCase();
          const ok = tx === "settlement" || tx === "capture";
          if (!ok) {
            showToast("Pembayaran online belum berhasil. Selesaikan pembayaran dulu.", "error");
            return;
          }
        } catch (err) {
          showToast(err?.message || "Gagal cek status pembayaran online", "error");
          return;
        }
      }

      const res = await fetch(`${API_URL}/api/orders/kasir/${currentOrder.id}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status: "selesai" }),
      });

      const ct   = res.headers.get("content-type") || "";
      const data = ct.includes("application/json") ? await res.json() : {};

      if (res.ok) {
        showToast("Pembayaran tunai berhasil!", "success");
        setCurrentOrder({ ...currentOrder, status: "selesai" });
        setPaymentModal(null);
      } else {
        throw new Error(data.message || `Gagal memproses pembayaran (${res.status})`);
      }
    } catch (err) {
      showToast(err.message || "Gagal memproses pembayaran", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (num) => {
    if (!num && num !== 0) return "Rp0";
    return `Rp${Number(num).toLocaleString("id-ID")}`;
  };

  const formatWaktu = (raw) => {
    if (!raw) return "";
    try {
      const d = parseDateFlexible(raw);
      if (!d) return String(raw);
      return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
    } catch { return raw; }
  };

  const getOrderTotal = (o) => o?.total_bayar ?? o?.total ?? o?.subtotal ?? o?.items_total ?? 0;
  const createPreviewTotal = (createDraft.items || []).reduce(
    (sum, item) => sum + (Number(item.qty || 0) * Number(item.price || 0)),
    0
  );
  const filteredMenuSource = menuSource.filter((m) => {
    const q = menuQuery.trim().toLowerCase();
    if (!q) return true;
    return m.name.toLowerCase().includes(q);
  });

  const updateCreateItem = (index, patch) => {
    setCreateDraft((prev) => {
      const nextItems = [...(prev.items || [])];
      nextItems[index] = { ...nextItems[index], ...patch };
      return { ...prev, items: nextItems };
    });
  };

  const addCreateItem = () => {
    setCreateDraft((prev) => ({
      ...prev,
      items: [...(prev.items || []), { name: "", qty: 1, price: 0, note: "" }],
    }));
  };

  const removeCreateItem = (index) => {
    setCreateDraft((prev) => {
      const nextItems = (prev.items || []).filter((_, i) => i !== index);
      return {
        ...prev,
        items: nextItems,
      };
    });
  };

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
    if (validItems.length === 0) {
      showToast("Tambahkan minimal 1 item pesanan", "error");
      return;
    }

    setCreateSubmitting(true);
    try {
      const payload = {
        table_number: tableNumber,
        customer_name: String(createDraft.customerName || "").trim(),
        note: String(createDraft.note || "").trim(),
        payment_method: "kasir",
        items: validItems.map((i) => ({
          menu_id: i.menuId || undefined,
          name: i.menuId ? undefined : String(i.name || "").trim(),
          qty: Number(i.qty || 1),
          price: Number(i.price || 0),
          note: String(i.note || "").trim(),
        })),
      };

      const res = await fetch(`${API_URL}/api/orders/kasir`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const ct = res.headers.get("content-type") || "";
      const data = ct.includes("application/json") ? await res.json().catch(() => ({})) : {};
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || `Gagal membuat pesanan (${res.status})`);
      }

      const created = data?.data ?? data ?? {};
      const normalizedCreated = {
        ...created,
        id: created?.id ?? created?.order_id ?? created?.order_code,
        nama: (created?.nama ?? created?.customer_name ?? created?.customerName ?? createDraft.customerName) || "Pelanggan",
        meja: created?.meja ?? created?.table_number ?? created?.table ?? createDraft.tableNumber,
        status: created?.status ?? "selesai",
        created_at: created?.created_at ?? new Date().toISOString(),
        items: Array.isArray(created?.items)
          ? created.items
          : validItems.map((i) => ({
              name: i.name,
              qty: i.qty,
              price: i.price,
              note: i.note,
              subtotal: Number(i.qty || 0) * Number(i.price || 0),
            })),
        total: Number(created?.total ?? created?.total_bayar ?? created?.subtotal ?? createPreviewTotal),
      };

      setCurrentOrder(normalizedCreated);
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

  const addMenuToDraft = (menuItem) => {
    if (!menuItem?.id) return;
    setCreateDraft((prev) => {
      const items = [...(prev.items || [])];
      const idx = items.findIndex((i) => String(i.menuId || "") === String(menuItem.id));
      if (idx >= 0) {
        const currentQty = Math.max(1, Number(items[idx].qty || 1));
        items[idx] = { ...items[idx], qty: currentQty + 1 };
      } else {
        items.push({
          menuId: menuItem.id,
          name: menuItem.name,
          qty: 1,
          price: Number(menuItem.price || 0),
          note: "",
        });
      }
      return { ...prev, items };
    });
    showToast(`${menuItem.name} ditambahkan`, "success");
  };

  const handlePrint = () => {
    if (!currentOrder) return;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    const items = (currentOrder.items || currentOrder.order_items || []).map(item => `
      <div style="display:flex;justify-content:space-between;margin:4px 0;font-size:12px;">
        <span>${item.quantity || item.qty}× ${item.name || item.nama_menu}</span>
        <span>${formatRupiah(item.subtotal ?? ((item.price || item.harga) * (item.quantity || item.qty)))}</span>
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Struk #${currentOrder.id}</title>
        <style>
          body { font-family: 'Courier New', monospace; padding: 20px; max-width: 320px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .header h2 { margin: 0; font-size: 16px; }
          .header p { margin: 4px 0; font-size: 11px; }
          .order-info { font-size: 12px; margin: 10px 0; }
          .items { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; margin: 10px 0; }
          .total { font-weight: bold; font-size: 14px; margin-top: 10px; }
          .footer { text-align: center; margin-top: 20px; font-size: 11px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${cafeInfo.nama?.toUpperCase() || 'MYCAFE'} CAFE</h2>
          <p>${new Date().toLocaleString('id-ID')}</p>
          <p>Order: #${currentOrder.id || currentOrder.order_code}</p>
        </div>
        
        <div class="order-info">
          <p>Meja: ${currentOrder.meja ?? currentOrder.meja_id ?? currentOrder.nomor_meja ?? '-'}</p>
          <p>Pelanggan: ${currentOrder.nama || currentOrder.customer_name || 'Pelanggan'}</p>
        </div>
        
        <div class="items">
          ${items}
        </div>
        
        <div class="total">
          <div style="display:flex;justify-content:space-between;">
            <span>SUBTOTAL</span>
            <span>${formatRupiah(currentOrder.items_total ?? currentOrder.subtotal)}</span>
          </div>
          ${currentOrder.discount > 0 ? `
          <div style="display:flex;justify-content:space-between;color:green;">
            <span>DISKON</span>
            <span>-${formatRupiah(currentOrder.discount)}</span>
          </div>` : ''}
          ${currentOrder.tax > 0 ? `
          <div style="display:flex;justify-content:space-between;">
            <span>PAJAK</span>
            <span>${formatRupiah(currentOrder.tax)}</span>
          </div>` : ''}
          <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:16px;">
            <span>TOTAL</span>
            <span>${formatRupiah(getOrderTotal(currentOrder))}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Terima kasih!</p>
          <p>Silakan datang kembali</p>
        </div>
        
        <script>
          window.onload = () => {
            setTimeout(() => { window.print(); window.close(); }, 200);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };



  return (
    <div className="min-h-screen" style={{ background: "var(--bg, #f9fafb)", color: "var(--tx, #111827)" }}>
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
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px] p-3 sm:p-4 flex items-end sm:items-center justify-center" onClick={() => { if (!createSubmitting) setShowCreateModal(false); }}>
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
              <button disabled={createSubmitting} onClick={() => setShowCreateModal(false)} className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center hover:bg-white/30 disabled:opacity-50">
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
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-gray-800">Pilih Dari Menu</p>
                  <span className="text-[11px] font-semibold text-gray-400">{filteredMenuSource.length} menu</span>
                </div>
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
                    <p className="text-xs text-gray-400 px-2 py-2">Menu tidak ditemukan</p>
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
                  <div key={idx} className="rounded-2xl border border-gray-200 bg-white p-3 space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-lg bg-amber-100 text-amber-700 text-[10px] font-black flex items-center justify-center">{idx + 1}</span>
                        <p className="text-[11px] font-bold text-gray-500">ITEM</p>
                      </div>
                      <button onClick={() => removeCreateItem(idx)} className="text-[11px] font-bold text-red-500 hover:text-red-600">Hapus</button>
                    </div>
                    <input
                      value={item.name}
                      onChange={(e) => updateCreateItem(idx, { name: e.target.value })}
                      placeholder="Nama menu"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:bg-white"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="rounded-xl border border-gray-200 bg-gray-50 px-2 py-1.5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500">Qty</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateCreateItem(idx, { qty: Math.max(1, Number(item.qty || 1) - 1) })}
                            className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="w-6 text-center text-sm font-black text-gray-900">{Math.max(1, Number(item.qty || 1))}</span>
                          <button
                            type="button"
                            onClick={() => updateCreateItem(idx, { qty: Math.max(1, Number(item.qty || 1) + 1) })}
                            className="w-7 h-7 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={item.price}
                        onChange={(e) => updateCreateItem(idx, { price: Math.max(0, Number(e.target.value || 0)) })}
                        placeholder="Harga"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:bg-white"
                      />
                    </div>
                    <input
                      value={item.note}
                      onChange={(e) => updateCreateItem(idx, { note: e.target.value })}
                      placeholder="Catatan item (opsional)"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:bg-white"
                    />
                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-700">
                        {formatRupiah(Math.max(1, Number(item.qty || 1)) * Number(item.price || 0))}
                      </span>
                    </div>
                  </div>
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
                <button disabled={createSubmitting} onClick={() => setShowCreateModal(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 disabled:opacity-50">
                  Batal
                </button>
                <button disabled={createSubmitting} onClick={handleSubmitCreatePreview} className="px-4 py-2.5 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-amber-500 to-orange-500 shadow-md hover:shadow-lg disabled:opacity-60 inline-flex items-center gap-1.5">
                  {createSubmitting ? <><Loader2 size={14} className="animate-spin" /> Menyimpan...</> : "Simpan Pesanan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white font-semibold text-sm animate-slideInRight ${
          toast.type === "error" ? "bg-red-500" : toast.type === "success" ? "bg-green-500" : "bg-amber-500"
        }`}>{toast.msg}</div>
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