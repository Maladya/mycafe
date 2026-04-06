import { ChevronLeft, CreditCard, Wallet, Check, Gift, Info, X, Tag, Image } from "lucide-react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo } from "react";
import ActionConfirmModal from "../components/ActionConfirmModal";

/* ─────────────────────────────────────────────
   Config
   ──────────────────────────────────────────── */
const BASE_URL = (import.meta.env.VITE_API_URL ?? "https://www.mycafe-order.net/").replace(/\/$/, "");
const TOKEN_KEY = "astakira_token";
const tokenManager = { get: () => localStorage.getItem(TOKEN_KEY) ?? import.meta.env.VITE_API_TOKEN ?? "" };

/* ─────────────────────────────────────────────
   Theme helpers
   ──────────────────────────────────────────── */
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

const THEME_CACHE_KEY = "astakira_theme";

function applyThemeVars(theme) {
  const onP = "#ffffff";
  const vars = [
    `--p:${theme.primary}`, `--s:${theme.secondary}`, `--bg:${theme.bg}`, `--tx:${theme.text}`,
    `--on-p:${onP}`, `--p-20:${ha(theme.primary, 0.2)}`,
    `--bg-soft:${ha(theme.primary, 0.07)}`,
    `--grad:linear-gradient(135deg,${theme.primary},${theme.secondary})`,
  ].join(";");
  document.documentElement.setAttribute("style", vars);
}

/* ─────────────────────────────────────────────
   API helpers
   ──────────────────────────────────────────── */
const api = {
  get: async (path, timeoutMs = 8000) => {
    const token = tokenManager.get();
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${BASE_URL}/${path}`, { headers, signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } finally { clearTimeout(timer); }
  },
  post: async (path, body, timeoutMs = 10000) => {
    const token = tokenManager.get();
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${BASE_URL}/${path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.message ?? `HTTP ${res.status}`);
      }
      return res.json();
    } finally { clearTimeout(timer); }
  },
};

/* ─────────────────────────────────────────────
   Load Midtrans Snap.js (sandbox)
   ──────────────────────────────────────────── */
function loadSnapScript(clientKey) {
  return new Promise((resolve, reject) => {
    if (window.snap) { resolve(); return; }
    const existing = document.getElementById("midtrans-snap");
    if (existing) { existing.addEventListener("load", resolve); return; }
    const script = document.createElement("script");
    script.id = "midtrans-snap";
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", clientKey);
    script.onload = resolve;
    script.onerror = () => reject(new Error("Gagal memuat Midtrans Snap"));
    document.head.appendChild(script);
  });
}

/* ─────────────────────────────────────────────
   PromoCode Modal — API driven
   ──────────────────────────────────────────── */
function normalisePromo(raw) {
  if (raw?.discountLabel) return raw;

  const code        = raw.kode_promo ?? raw.code ?? raw.kode ?? "";
  const nama_promo  = raw.nama_promo ?? raw.nama ?? raw.name ?? "";
  const description = raw.description ?? raw.deskripsi ?? "";
  const minOrder    = raw.minimum_order ?? raw.min_order ?? raw.minOrder ?? raw.minimum ?? 0;
  const startDate   = raw.mulai_date ?? raw.start_date ?? raw.startDate ?? "";
  const endDate     = raw.berakhir_date ?? raw.end_date ?? raw.endDate ?? "";

  let discountType = "";
  const tipe = raw.tipe_diskon ?? raw.discount_type ?? raw.discountType ?? "";
  if (tipe === 0 || tipe === "0" || tipe === "persen" || tipe === "percent") {
    discountType = "percent";
  } else if (tipe === 1 || tipe === "1" || tipe === "nominal" || tipe === "fixed") {
    discountType = "fixed";
  }

  let discountValue = raw.nilai ?? raw.discount_value ?? raw.discountValue ?? raw.value ?? 0;
  let discountLabel = raw.discount ?? raw.diskon ?? "";

  if (!discountType && discountLabel) {
    if (String(discountLabel).includes("%")) {
      discountType  = "percent";
      discountValue = parseFloat(discountLabel);
    } else {
      discountType  = "fixed";
      discountValue = parseInt(String(discountLabel).replace(/\D/g, ""));
    }
  }

  if (!discountLabel) {
    discountLabel = discountType === "percent"
      ? `${discountValue}%`
      : `Rp${Number(discountValue).toLocaleString()}`;
  }

  return { code, discountLabel, discountType, discountValue: Number(discountValue), description, minOrder, nama_promo, startDate, endDate };
}

const todayStr = () => new Date().toISOString().split("T")[0];

const isPromoActive = (p) => {
  if (!p.startDate || !p.endDate) return true;
  const today = todayStr();
  return p.startDate <= today && today <= p.endDate;
};

/* ─────────────────────────────────────────────
   Kalkulasi diskon
   ──────────────────────────────────────────── */
function hitungDiskon(subtotal, promo) {
  if (!promo) return 0;
  if (promo.discountType === "percent") {
    return Math.floor(subtotal * Number(promo.discountValue) / 100);
  }
  if (promo.discountType === "fixed") {
    return Math.min(Number(promo.discountValue), subtotal);
  }
  const raw = String(promo.discountLabel ?? "");
  if (raw.includes("%")) return Math.floor(subtotal * parseFloat(raw) / 100);
  return Math.min(parseInt(raw.replace(/\D/g, "")) || 0, subtotal);
}

function PromoCodeModal({ onClose, onApply, subtotal, cafeId }) {
  const [input, setInput]       = useState("");
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(null);

  const [promos, setPromos]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [validating, setValidating] = useState(false);
  const [filteredPromos, setFilteredPromos] = useState([]);

  const [fetchError, setFetchError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const applyPromo = (promo) => {
    if (!promo) return;
    if (!isPromoActive(promo)) {
      setError("Promo sudah tidak aktif");
      return;
    }

    const min = Number(promo.minOrder ?? 0);
    if (subtotal < min) {
      setError(`Minimal transaksi Rp${min.toLocaleString("id-ID")}`);
      return;
    }

    setSuccess(promo);
    setTimeout(() => {
      if (onApply) onApply(promo);
      onClose();
    }, 450);
  };

  useEffect(() => {
    setLoading(true);
    setFetchError(false);
    const path = cafeId ? `api/promo/user/${cafeId}` : `api/promo`;
    api.get(path)
      .then(r => {
        const list = r?.data ?? r ?? [];
        setPromos(Array.isArray(list) ? list.map(normalisePromo) : []);
      })
      .catch(() => { setPromos([]); setFetchError(true); })
      .finally(() => setLoading(false));
  }, [cafeId, retryKey]);

  useEffect(() => {
    const code = input.toUpperCase().trim();
    if (!code) { setFilteredPromos([]); return; }
    const exact = promos.find(p => (p.code ?? "").toUpperCase() === code);
    if (!exact) { setFilteredPromos([]); return; }
    setFilteredPromos([exact]);
  }, [input, promos]);

  const handleManualApply = async () => {
    const code = input.toUpperCase().trim();
    if (!code) return;
    setValidating(true);
    setError("");

    const localPromo = promos.find(p => p.code?.toUpperCase() === code);
    if (localPromo) {
      applyPromo(localPromo);
      setValidating(false);
      return;
    }

    try {
      const res = await api.post("api/promo/validate", { code, cafe_id: cafeId, subtotal });
      const promoRaw = res?.data ?? res;
      if (!promoRaw?.code && !promoRaw?.kode) throw new Error("Kode promo tidak valid");
      applyPromo(normalisePromo(promoRaw));
    } catch (err) {
      setError(err.message ?? "Kode promo tidak ditemukan atau sudah kadaluarsa");
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-end z-50 animate-fadeIn"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="bg-white w-full max-w-md mx-auto rounded-t-[2rem] p-5 animate-slideUp"
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-bold text-lg text-gray-900">Kode Promo</h2>
          <button onClick={onClose} className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
            <X size={18} className="text-gray-600" />
          </button>
        </div>

        <div className="flex gap-2 mb-2">
          <input value={input} onChange={e => { setInput(e.target.value); setError(""); }}
            placeholder="Masukkan kode promo (contoh: PROMO10)"
            onKeyDown={e => e.key === "Enter" && handleManualApply()}
            className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold uppercase outline-none transition-all"
            onFocus={e => { e.target.style.borderColor = "var(--p)"; }}
            onBlur={e => { e.target.style.borderColor = "#e5e7eb"; }} />
          <button onClick={handleManualApply} disabled={validating || !input.trim()}
            className="px-5 rounded-xl font-bold text-sm shadow-md disabled:opacity-60 flex items-center gap-1.5 min-w-[80px] justify-center"
            style={{ background: "var(--grad)", color: "var(--on-p)" }}>
            {validating
              ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              : "Pakai"}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mb-3">Ketik kode promo lalu tekan "Pakai" untuk validasi</p>

        {filteredPromos.length > 0 && (
          <div className="mb-3 bg-gray-50 rounded-xl p-3 border border-gray-200">
            <p className="text-[10px] text-gray-500 font-semibold mb-2 uppercase">Kode cocok — Double click untuk pakai:</p>
            <div className="space-y-2">
              {filteredPromos.map(p => (
                <button key={p.code} onDoubleClick={() => applyPromo(p)}
                  className="w-full bg-white rounded-xl p-3 flex items-center justify-between text-left border-2 border-green-200 hover:border-green-400 transition-all shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-100">
                      <Tag size={14} className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">{p.nama_promo || p.code}</p>
                      <p className="text-xs text-green-600 font-semibold">{p.discountLabel}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-green-600">Pakai →</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-500 font-semibold mb-3 flex items-center gap-1">
            <Info size={12} /> {error}
          </p>
        )}

        <p className="text-xs text-gray-400 font-semibold mb-3 mt-4 uppercase tracking-wide">Promo Tersedia</p>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24" fill="none" style={{ color: "var(--p)" }}>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <p className="text-xs text-gray-400">Memuat promo...</p>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <span className="text-3xl">📡</span>
            <p className="text-sm text-gray-500 font-semibold">Gagal memuat promo</p>
            <p className="text-xs text-gray-400 text-center">Periksa koneksi atau coba lagi</p>
            <button onClick={() => setRetryKey(k => k + 1)}
              className="mt-1 px-5 py-2 rounded-xl text-sm font-bold shadow"
              style={{ background: "var(--grad)", color: "var(--on-p)" }}>
              Coba Lagi
            </button>
          </div>
        ) : promos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <span className="text-3xl">🎟️</span>
            <p className="text-sm text-gray-400 font-semibold">Tidak ada promo tersedia</p>
          </div>
        ) : (
          <div className="space-y-2 pb-4 max-h-64 overflow-y-auto">
            {promos
              .filter(isPromoActive)
              .filter(p => subtotal >= Number(p.minOrder ?? 0))
              .map(p => (
              <button
                key={p.code}
                onClick={() => setInput((p.code ?? "").toUpperCase())}
                onDoubleClick={() => applyPromo(p)}
                className={`w-full rounded-2xl p-4 flex items-center justify-between text-left transition-all border-2 ${
                  success?.code === p.code ? "border-green-500 bg-green-50" : "hover:bg-gray-50"
                }`}
                style={success?.code !== p.code ? { borderStyle: "dashed", borderColor: "var(--p-20)" } : {}}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--grad)" }}>
                    <Tag size={16} style={{ color: "var(--on-p)" }} />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-extrabold text-sm" style={{ color: "var(--p)" }}>{p.nama_promo || "Promo"}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">{p.description}</p>
                    {p.minOrder > 0 && (
                      <p className="text-[10px] text-gray-400 mt-0.5">Min. Rp{Number(p.minOrder).toLocaleString()}</p>
                    )}
                  </div>
                </div>
                <div className={`text-sm font-extrabold px-3 py-1 rounded-xl flex-shrink-0 ml-2 ${
                  success?.code === p.code ? "bg-green-500 text-white" : ""
                }`}
                  style={success?.code !== p.code ? { background: "var(--bg-soft)", color: "var(--p)" } : {}}>
                  {success?.code === p.code ? <Check size={16} /> : p.discountLabel}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Pembayaran
   ──────────────────────────────────────────── */
export default function Pembayaran() {

  const navigate = useNavigate();
  const { state } = useLocation();
  const [searchParams] = useSearchParams();

  const CAFE_ID = state?.cafeId ?? searchParams.get("cafe_id") ?? "";
  const MEJA_ID = state?.mejaId ?? searchParams.get("table") ?? "1";
  const orderId = state?.orderId ?? null;

  const cart       = state?.cart       || {};
  const items      = state?.items      || [];
  const note       = state?.note       || "";
  const itemNotes  = state?.itemNotes  || {};

  const orderedItems = items.filter(i => (cart[i.id]?.qty || 0) > 0);
  const totalQty     = orderedItems.reduce((s, i) => s + (cart[i.id]?.qty || 0), 0);

  const subtotalFromItems = useMemo(
    () => orderedItems.reduce((sum, item) => {
      const cartItem = cart[item.id] || {};
      const qty = cartItem.qty || 0;
      const basePrice = item.price || 0;
      const variantsPrice = (cartItem.variants || []).reduce((vsum, v) => vsum + (v?.hargaVariant || 0), 0);
      return sum + (qty * (basePrice + variantsPrice));
    }, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orderedItems.map(i => `${i.id}:${cart[i.id]?.qty}`).join(",")]
  );

  const subtotal = subtotalFromItems > 0 ? subtotalFromItems : (state?.subtotal || 0);

  const [method, setMethod]             = useState("online");
  const [confirmKasir, setConfirmKasir] = useState(false);
  const [showPromo, setShowPromo]       = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [confirmOnline, setConfirmOnline] = useState(false);
  const [pendingPromo, setPendingPromo] = useState(null);
  const [confirmRemovePromo, setConfirmRemovePromo] = useState(false);

  const [form, setForm]                 = useState({ nama: "", meja: MEJA_ID });
  const [cafeName, setCafeName]         = useState("ASTAKIRA");
  const [snapClientKey, setSnapClientKey] = useState("");
  const [showNameError, setShowNameError] = useState(false);

  const [pajakPersen, setPajakPersen] = useState(0);

  const [paying, setPaying]     = useState(false);
  const [payError, setPayError] = useState("");

  useEffect(() => {
    try {
      const cached = localStorage.getItem(THEME_CACHE_KEY);
      if (cached) applyThemeVars(JSON.parse(cached));
    } catch {}

    if (!CAFE_ID) return;
    api.get(`api/pengaturan/user/${CAFE_ID}`)
      .then(r => {
        const raw = r.data ?? r;
        const theme = parseTheme(raw?.tema_colors);
        applyThemeVars(theme);
        try { localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(theme)); } catch {}
        setCafeName(raw?.nama_cafe ?? raw?.nama ?? raw?.name ?? "ASTAKIRA");
        const key = raw?.midtrans_client_key ?? raw?.snap_client_key ?? "";
        if (key) setSnapClientKey(key);
      })
      .catch(() => {});
  }, [CAFE_ID]);

  useEffect(() => {
    if (!CAFE_ID) return;
    api.get(`api/pajak/public/${CAFE_ID}`)
      .then(r => {
        const raw = r?.data ?? r;
        const d = Array.isArray(raw) ? (raw[0] ?? {}) : raw;
        const val =
          (typeof d === "number" ? d : null)
          ?? (typeof d?.pajak === "number" ? d.pajak : null)
          ?? (typeof d?.pajak === "string" ? Number(d.pajak) : null)
          ?? (typeof d?.pajak_persen === "string" ? Number(String(d.pajak_persen).replace(/%/g, "")) : null)
          ?? null;
        if (val === null || Number.isNaN(val)) return;
        setPajakPersen(val);
      })
      .catch(() => {});
  }, [CAFE_ID]);

  const discount             = hitungDiskon(subtotal, appliedPromo);
  const totalSebelumPajak    = subtotal - discount;
  const pajakNominal         = Math.floor(totalSebelumPajak * (Number(pajakPersen) || 0) / 100);
  const total                = totalSebelumPajak + pajakNominal;

  const discountDisplayLabel = appliedPromo
    ? `Hemat Rp${discount.toLocaleString()}!`
    : "";

  const handleOnlinePayment = useCallback(async () => {
    if (!form.nama.trim()) {
      setShowNameError(true);
      return;
    }

    setPaying(true);
    setPayError("");

    try {
      const freshSubtotal = orderedItems.reduce((s, i) => {
        const cartItem = cart[i.id] || {};
        const qty = cartItem.qty || 0;
        const basePrice = i.price || 0;
        const variantsPrice = (cartItem.variants || []).reduce((vsum, v) => vsum + (v?.hargaVariant || 0), 0);
        return s + (qty * (basePrice + variantsPrice));
      }, 0);
      const freshDiscount     = hitungDiskon(freshSubtotal, appliedPromo);
      const freshSebelumPajak = freshSubtotal - freshDiscount;
      const freshPajak        = Math.floor(freshSebelumPajak * (Number(pajakPersen) || 0) / 100);
      const freshTotal        = freshSebelumPajak + freshPajak;

      const payload = {
        cafe_id:      CAFE_ID,
        meja_id:      MEJA_ID,
        nama:         form.nama.trim(),
        note:         note ?? "",
        promo_code:   appliedPromo?.code ?? null,
        subtotal:     freshSubtotal,
        discount:     freshDiscount,
        pajak:        freshPajak,
        pajak_persen: Number(pajakPersen) || 0,
        total:        freshTotal,
        items: orderedItems.map(item => {
          const cartItem = cart[item.id] || {};
          const qty = cartItem.qty || 0;
          const variantsPrice = (cartItem.variants || []).reduce((vsum, v) => vsum + (v?.hargaVariant || 0), 0);
          return {
            id:       item.id,
            name:     item.name,
            price:    item.price + variantsPrice,
            quantity: qty,
            subtotal: (item.price + variantsPrice) * qty,
            variants: cartItem.variants || [],
            catatan:  cartItem.catatan || "",
          };
        }),
      };

      const res = await api.post("api/midtrans/create", payload);
      const snapToken = res?.snap_token ?? res?.data?.snap_token;
      const clientKey = res?.client_key ?? res?.data?.client_key ?? snapClientKey;
      const resOrderId = res?.order_id ?? res?.data?.order_id;

      if (!snapToken) throw new Error("snap_token tidak ditemukan di respons backend");

      await loadSnapScript(clientKey);

      const navState = {
        cart, items, note, itemNotes,
        subtotal:        freshSubtotal,
        discount:        freshDiscount,
        pajakPersen:     Number(pajakPersen) || 0,
        pajakNominal:    freshPajak,
        totalSebelumPajak: freshSebelumPajak,
        total:           freshTotal,
        form, method,
        cafeId: CAFE_ID,
        mejaId: MEJA_ID,
        orderId: resOrderId,
      };

      window.snap.pay(snapToken, {
        onSuccess: (result) => {
          setPaying(false);
          navigate("/ringkasanpesanan", { state: { ...navState, midtrans: { status: "success", orderId: resOrderId, result } } });
        },
        onPending: (result) => {
          setPaying(false);
          navigate("/ringkasanpesanan", { state: { ...navState, midtrans: { status: "pending", orderId: resOrderId, result } } });
        },
        onError: (result) => {
          setPaying(false);
          setPayError("Pembayaran gagal: " + (result?.status_message ?? "Silakan coba lagi"));
        },
        onClose: () => { setPaying(false); },
      });

    } catch (err) {
      setPaying(false);
      setPayError(err.message ?? "Terjadi kesalahan, coba lagi");
    }
  }, [
    form, CAFE_ID, MEJA_ID, note, itemNotes, appliedPromo,
    orderedItems, cart, items, method, pajakPersen,
    navigate, snapClientKey,
  ]);

  const handleBayar = () => {
    if (method === "kasir") {
      if (!form.nama.trim()) { setShowNameError(true); return; }
      setPayError("");
      setConfirmKasir(true);
    } else {
      if (!form.nama.trim()) { setShowNameError(true); return; }
      setConfirmOnline(true);
    }
  };

  const StepBadge = ({ n }) => (
    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ background: "var(--grad)" }}>
      <span className="text-[10px] font-bold" style={{ color: "var(--on-p)" }}>{n}</span>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen relative" style={{ background: "var(--bg)", color: "var(--tx)" }}>

      <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100">
        <div className="flex items-center px-4 py-3.5">
          <button onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:opacity-80 transition-all"
            style={{ background: "var(--bg-soft)" }}>
            <ChevronLeft size={20} style={{ color: "var(--p)" }} />
          </button>
          <div className="flex-1 text-center">
            <h1 className="font-extrabold text-base text-gray-900">Pembayaran</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">{totalQty} item · Meja {MEJA_ID} · {cafeName}</p>
          </div>
          <div className="w-10" />
        </div>
      </div>

      <div className={`pb-32 transition-all duration-300 ${confirmKasir ? "blur-sm pointer-events-none" : ""}`}>

        <div className="px-4 pt-4 mb-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StepBadge n="1" />
                <p className="font-bold text-sm text-gray-900">Ringkasan Pesanan</p>
              </div>
              <button onClick={() => navigate(-1)} className="text-xs font-semibold" style={{ color: "var(--p)" }}>Ubah</button>
            </div>
            <div className="divide-y divide-gray-50">
              {orderedItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "var(--bg-soft)" }}>
                    {item.image_url || item.image
                      ? <img src={item.image_url ?? item.image} alt={item.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center">
                          <Image size={14} style={{ color: "var(--p)", opacity: 0.4 }} />
                        </div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm line-clamp-1">{item.name}</p>
                    {(cart[item.id]?.variants?.length > 0 || cart[item.id]?.catatan || itemNotes[item.id]) && (
                      <div className="space-y-0.5 mt-0.5">
                        {cart[item.id]?.variants?.map((v, idx) => (
                          <p key={idx} className="text-[10px] text-gray-500">
                            • {v.namaGroup}: {v.label}
                            {v.hargaVariant > 0 && <span className="text-gray-400"> (+Rp{v.hargaVariant.toLocaleString()})</span>}
                          </p>
                        ))}
                        {cart[item.id]?.catatan && (
                          <p className="text-[10px] text-gray-500 italic"> {cart[item.id].catatan}</p>
                        )}
                        {itemNotes[item.id] && (
                          <p className="text-[10px] line-clamp-1" style={{ color: "var(--p)" }}>
                            Catatan: {itemNotes[item.id]}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">{cart[item.id]?.qty || 0}×</p>
                    <p className="text-sm font-bold" style={{ color: "var(--p)" }}>
                      Rp{((cart[item.id]?.qty || 0) * item.price + (cart[item.id]?.variants || []).reduce((s, v) => s + ((v.hargaVariant || 0) * (cart[item.id]?.qty || 0)), 0)).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {note && (
              <div className="mx-4 mb-3 rounded-xl px-3 py-2 border" style={{ background: "var(--bg-soft)", borderColor: "var(--p-20)" }}>
                <span className="text-[10px]" style={{ color: "var(--p)" }}>Catatan: {note}</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <StepBadge n="2" />
            <h2 className="font-bold text-sm text-gray-900">Informasi Pemesan</h2>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Nama Lengkap</label>
              <input type="text" placeholder="Masukkan nama lengkap" value={form.nama}
                onChange={e => { setForm({ ...form, nama: e.target.value }); setPayError(""); }}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none transition-all"
                onFocus={e => { e.target.style.borderColor = "var(--p)"; e.target.style.boxShadow = `0 0 0 4px var(--p-20)`; }}
                onBlur={e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Nomor Meja</label>
              <div className="relative">
                <input disabled value={`Meja ${MEJA_ID}`}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 font-semibold cursor-not-allowed" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "var(--grad)" }}>
                  <Check size={13} style={{ color: "var(--on-p)" }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <StepBadge n="3" />
            <h2 className="font-bold text-sm text-gray-900">Metode Pembayaran</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "online", icon: <CreditCard size={22} />, label: "Online", sub: "QRIS / E-Wallet" },
              { id: "kasir", icon: <Wallet size={22} />, label: "Di Kasir", sub: "Bayar langsung" },
            ].map(m => (
              <button key={m.id} onClick={() => { setMethod(m.id); setPayError(""); }}
                className="relative rounded-2xl p-4 border-2 transition-all bg-white"
                style={method === m.id
                  ? { borderColor: "var(--p)", background: "var(--bg-soft)", boxShadow: `0 4px 20px var(--p-20)` }
                  : { borderColor: "#e5e7eb" }}>
                <div className="flex flex-col items-center gap-2.5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={method === m.id ? { background: "var(--grad)" } : { background: "#f3f4f6" }}>
                    <span style={method === m.id ? { color: "var(--on-p)" } : { color: "#6b7280" }}>{m.icon}</span>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-sm" style={method === m.id ? { color: "var(--p)" } : { color: "#111827" }}>{m.label}</p>
                    <p className="text-[10px] text-gray-400">{m.sub}</p>
                  </div>
                </div>
                {method === m.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center shadow" style={{ background: "var(--grad)" }}>
                    <Check size={11} style={{ color: "var(--on-p)" }} />
                  </div>
                )}
              </button>
            ))}
          </div>

          {method === "online" && (
            <div className="mt-3 bg-white rounded-2xl p-4 flex items-center justify-between border-2" style={{ borderColor: "var(--p-20)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--grad)" }}>
                  <span className="text-xl">📱</span>
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900">QRIS / E-Wallet / Kartu</p>
                  <p className="text-xs text-gray-400">Proses via Midtrans Sandbox</p>
                </div>
              </div>
              <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--grad)" }}>
                <Check size={11} style={{ color: "var(--on-p)" }} />
              </div>
            </div>
          )}

          {method === "kasir" && (
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
              <span className="text-2xl flex-shrink-0">🧾</span>
              <div>
                <p className="font-bold text-sm text-blue-800 mb-0.5">Bayar di Kasir</p>
                <p className="text-xs text-blue-600 leading-relaxed">Setelah konfirmasi, tunjukkan kode pesanan ke staff kasir kami.</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Kode Promo ── */}
        <div className="px-4 mb-5">
          <button onClick={() => setShowPromo(true)}
            className="w-full rounded-2xl p-4 border-2 flex items-center justify-between transition-all bg-white"
            style={appliedPromo
              ? { borderColor: "#22c55e", background: "#f0fdf4" }
              : { borderStyle: "dashed", borderColor: "var(--p-20)" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: appliedPromo ? "#22c55e" : "var(--grad)" }}>
                {appliedPromo ? <Check size={18} className="text-white" /> : <Gift size={18} style={{ color: "var(--on-p)" }} />}
              </div>
              <div className="text-left">
                {appliedPromo ? (
                  <>
                    <p className="font-bold text-green-700 text-sm">{appliedPromo.nama_promo || "Promo"}</p>
                    <p className="text-xs text-green-600">{discountDisplayLabel}</p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-gray-900 text-sm">Punya Kode Promo?</p>
                    <p className="text-xs text-gray-400">Ketuk untuk gunakan diskon</p>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {appliedPromo && (
                <button
                  onClick={e => { e.stopPropagation(); setConfirmRemovePromo(true); }}
                  className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 transition-all"
                  title="Hapus promo"
                >
                  <X size={12} className="text-red-500" />
                </button>
              )}
              <ChevronLeft size={18} className="text-gray-400 rotate-180" />
            </div>
          </button>
        </div>

        {/* ── Ringkasan Harga ── */}
        <div className="px-4 mb-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal ({totalQty} item)</span>
              <span className="font-semibold text-gray-900">Rp{subtotal.toLocaleString()}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">
                  Diskon Promo
                  {appliedPromo?.discountType === "percent" && (
                    <span className="ml-1 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">
                      -{appliedPromo.discountValue}%
                    </span>
                  )}
                </span>
                <span className="font-semibold text-green-600">-Rp{discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Biaya layanan</span>
              <span className="font-semibold text-green-600">Gratis</span>
            </div>
            {pajakNominal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Pajak ({Number(pajakPersen) || 0}%)</span>
                <span className="font-semibold text-gray-900">Rp{pajakNominal.toLocaleString()}</span>
              </div>
            )}
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between items-center rounded-xl px-3 py-2.5" style={{ background: "var(--bg-soft)" }}>
              <span className="font-bold text-gray-900 text-sm">Total Pembayaran</span>
              <span className="font-extrabold text-lg" style={{ color: "var(--p)" }}>Rp{total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {payError && (
          <div className="px-4 mb-3">
            <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Info size={16} className="text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600 font-semibold">{payError}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-xl">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              {discount > 0 && <p className="text-xs text-gray-400 line-through">Rp{subtotal.toLocaleString()}</p>}
              <p className="text-xs text-gray-400 mb-0.5">Total Pembayaran</p>
              <p className="font-extrabold text-2xl text-gray-900">Rp{total.toLocaleString()}</p>
            </div>
            <button onClick={handleBayar} disabled={paying}
              className="px-8 py-3.5 rounded-2xl font-bold shadow-lg hover:scale-105 hover:shadow-xl transition-all whitespace-nowrap disabled:opacity-70 disabled:scale-100 flex items-center gap-2"
              style={{ background: "var(--grad)", color: "var(--on-p)" }}>
              {paying ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Memproses...
                </>
              ) : (
                "Bayar Sekarang →"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal Konfirmasi Kasir ── */}
      {confirmKasir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fadeIn"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-[2rem] p-7 w-full max-w-sm text-center space-y-5 shadow-2xl animate-scaleIn">
            <div className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center" style={{ background: "var(--bg-soft)" }}>
              <span className="text-5xl">🧾</span>
            </div>
            <div>
              <h3 className="font-bold text-xl text-gray-900 mb-1">Konfirmasi Pesanan</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Pastikan semua pesanan sudah benar sebelum melanjutkan ke kasir</p>
            </div>
            <div className="rounded-2xl p-4 text-left space-y-2 border" style={{ background: "var(--bg-soft)", borderColor: "var(--p-20)" }}>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Total item</span><span className="font-semibold">{totalQty} item</span></div>
              {discount > 0 && <div className="flex justify-between text-sm"><span className="text-green-600">Diskon</span><span className="font-semibold text-green-600">-Rp{discount.toLocaleString()}</span></div>}
              <div className="flex justify-between text-sm"><span className="text-gray-600">Total bayar</span><span className="font-extrabold text-base" style={{ color: "var(--p)" }}>Rp{total.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Metode</span><span className="font-semibold">Bayar di Kasir</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmKasir(false)}
                className="flex-1 border-2 border-gray-200 text-gray-700 rounded-2xl py-3.5 font-bold hover:bg-gray-50 transition-all">
                Cek Lagi
              </button>
              <button onClick={() => navigate("/ringkasanpesanan", {
                  state: {
                    cart, items, note, itemNotes,
                    subtotal, discount,
                    pajakPersen: Number(pajakPersen) || 0,
                    pajakNominal, totalSebelumPajak,
                    total, form, method,
                    cafeId: CAFE_ID, mejaId: MEJA_ID, orderId,
                  }
                })}
                className="flex-1 rounded-2xl py-3.5 font-bold shadow-lg transition-all"
                style={{ background: "var(--grad)", color: "var(--on-p)" }}>
                Lanjutkan →
              </button>
            </div>
          </div>
        </div>
      )}

      {showPromo && (
        <PromoCodeModal
          onClose={() => setShowPromo(false)}
          onApply={(p) => {
            if (!p) return;
            setPendingPromo(p);
          }}
          subtotal={subtotal}
          cafeId={CAFE_ID}
        />
      )}

      <ActionConfirmModal
        open={confirmOnline}
        icon="💳"
        title="Konfirmasi Pembayaran"
        message={`Total pembayaran Rp${total.toLocaleString()}. Lanjutkan ke pembayaran online?`}
        cancelText="Cek Lagi"
        confirmText="Bayar"
        onCancel={() => setConfirmOnline(false)}
        onConfirm={() => {
          setConfirmOnline(false);
          handleOnlinePayment();
        }}
      />

      <ActionConfirmModal
        open={!!pendingPromo}
        icon="🎟️"
        title="Gunakan promo?"
        message={`Promo akan diterapkan dan total pembayaran akan berubah.`}
        cancelText="Batal"
        confirmText="Pakai"
        onCancel={() => setPendingPromo(null)}
        onConfirm={() => {
          setAppliedPromo(pendingPromo);
          setPendingPromo(null);
        }}
      />

      <ActionConfirmModal
        open={confirmRemovePromo}
        icon="🧾"
        title="Hapus promo?"
        message="Promo akan dihapus dan total pembayaran akan berubah."
        cancelText="Batal"
        confirmText="Hapus"
        confirmStyle={{ background: "#ef4444", color: "#fff" }}
        onCancel={() => setConfirmRemovePromo(false)}
        onConfirm={() => {
          setAppliedPromo(null);
          setConfirmRemovePromo(false);
        }}
      />

      {/* ── Modal Nama Wajib ── */}
      {showNameError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fadeIn"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-[2rem] p-7 w-full max-w-sm text-center space-y-5 shadow-2xl animate-scaleIn">
            <div className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center bg-red-100">
              <span className="text-5xl">⚠️</span>
            </div>
            <div>
              <h3 className="font-bold text-xl text-gray-900 mb-1">Nama Belum Diisi</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Silakan masukkan nama lengkap Anda untuk melanjutkan pembayaran.</p>
            </div>
            <button onClick={() => setShowNameError(false)}
              className="w-full rounded-2xl py-3.5 font-bold shadow-lg transition-all bg-red-500 text-white hover:bg-red-600">
              Mengerti
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp  { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn   { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn  { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .animate-slideUp  { animation: slideUp 0.4s cubic-bezier(0.16,1,0.3,1); }
        .animate-fadeIn   { animation: fadeIn 0.3s ease-out; }
        .animate-scaleIn  { animation: scaleIn 0.3s cubic-bezier(0.16,1,0.3,1); }
        .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}