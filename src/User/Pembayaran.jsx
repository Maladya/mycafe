import { ChevronLeft, CreditCard, Wallet, Check, Gift, Info, X, Tag, Image } from "lucide-react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";

/* ─────────────────────────────────────────────
   Config
   ──────────────────────────────────────────── */
const BASE_URL = (import.meta.env.VITE_API_URL ?? "http://192.168.1.9:3000").replace(/\/$/, "");
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
  const onP = contrast(theme.primary);
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

/**
 * Normalise promo object dari berbagai bentuk response backend:
 *   { code, discount_type, discount_value, description, min_order }
 *   { code, discount, description, minOrder }
 * → selalu { code, discountLabel, discountType, discountValue, description, minOrder }
 */
function normalisePromo(raw) {
  // sudah dinormalise sebelumnya
  if (raw?.discountLabel) return raw;

  const code        = raw.code ?? raw.kode ?? "";
  const description = raw.description ?? raw.deskripsi ?? "";
  const minOrder    = raw.min_order ?? raw.minOrder ?? raw.minimum_order ?? 0;

  let discountType  = raw.discount_type ?? raw.tipe_diskon ?? "";
  let discountValue = raw.discount_value ?? raw.nilai_diskon ?? 0;
  let discountLabel = raw.discount ?? raw.diskon ?? "";

  /* fallback: parse dari string "10%" atau "Rp5.000" */
  if (!discountType && discountLabel) {
    if (String(discountLabel).includes("%")) {
      discountType  = "percent";
      discountValue = parseInt(discountLabel);
    } else {
      discountType  = "fixed";
      discountValue = parseInt(String(discountLabel).replace(/\D/g, ""));
    }
  }

  /* build label tampilan */
  if (!discountLabel) {
    discountLabel = discountType === "percent"
      ? `${discountValue}%`
      : `Rp${Number(discountValue).toLocaleString()}`;
  }

  return { code, discountLabel, discountType, discountValue, description, minOrder };
}

function PromoCodeModal({ onClose, onApply, subtotal, cafeId }) {
  const [input, setInput]       = useState("");
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(null);
  const [promos, setPromos]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [validating, setValidating] = useState(false);

  const [fetchError, setFetchError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  /* ── Fetch daftar promo dari backend ── */
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

  /* ── Validasi & apply promo ── */
  const applyPromo = (promoObj) => {
    if (promoObj.minOrder && subtotal < promoObj.minOrder) {
      setError(`Minimum pesanan Rp${Number(promoObj.minOrder).toLocaleString()} untuk kode ini`);
      setSuccess(null);
      return;
    }
    setError("");
    setSuccess(promoObj);
    setTimeout(() => { onApply(promoObj); onClose(); }, 700);
  };

  /* ── Manual input → validasi ke backend ── */
  const handleManualApply = async () => {
    const code = input.toUpperCase().trim();
    if (!code) return;
    setValidating(true);
    setError("");
    try {
      const res = await api.post("api/promo/validate", {
        code,
        cafe_id:  cafeId,
        subtotal,
      });
      const promoRaw = res?.data ?? res;
      if (!promoRaw?.code && !promoRaw?.kode) throw new Error("Kode promo tidak valid");
      applyPromo(normalisePromo(promoRaw));
    } catch (err) {
      setError(err.message ?? "Kode promo tidak valid atau sudah kadaluarsa");
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-end z-50 animate-fadeIn"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="bg-white w-full max-w-md mx-auto rounded-t-[2rem] p-5 animate-slideUp shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-bold text-lg text-gray-900">Kode Promo</h2>
          <button onClick={onClose} className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
            <X size={18} className="text-gray-600" />
          </button>
        </div>

        {/* ── Manual input + validasi backend ── */}
        <div className="flex gap-2 mb-2">
          <input value={input} onChange={e => { setInput(e.target.value); setError(""); }}
            placeholder="Masukkan kode promo"
            onKeyDown={e => e.key === "Enter" && handleManualApply()}
            className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold uppercase outline-none transition-all"
            onFocus={e => { e.target.style.borderColor = "var(--p)"; }}
            onBlur={e => { e.target.style.borderColor = "#e5e7eb"; }} />
          <button onClick={handleManualApply} disabled={validating || !input.trim()}
            className="px-5 rounded-xl font-bold text-sm shadow-md disabled:opacity-60 flex items-center gap-1.5 min-w-[72px] justify-center"
            style={{ background: "var(--grad)", color: "var(--on-p)" }}>
            {validating
              ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              : "Pakai"}
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-500 font-semibold mb-3 flex items-center gap-1">
            <Info size={12} /> {error}
          </p>
        )}

        {/* ── Daftar promo dari backend ── */}
        <p className="text-xs text-gray-400 font-semibold mb-3 mt-4 uppercase tracking-wide">Promo Tersedia</p>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24" fill="none"
              style={{ color: "var(--p)" }}>
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
            {promos.map(p => (
              <button key={p.code} onClick={() => applyPromo(p)}
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
                    <p className="font-extrabold text-sm" style={{ color: "var(--p)" }}>{p.code}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">{p.description}</p>
                    {p.minOrder > 0 && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Min. Rp{Number(p.minOrder).toLocaleString()}
                      </p>
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

  const cart       = state?.cart       || {};
  const items      = state?.items      || [];
  const note       = state?.note       || "";
  const itemNotes  = state?.itemNotes  || {};
  const subtotal   = state?.subtotal   || 0;

  const orderedItems = items.filter(i => (cart[i.id] || 0) > 0);
  const totalQty     = orderedItems.reduce((s, i) => s + (cart[i.id] || 0), 0);

  const [method, setMethod]             = useState("online");
  const [confirmKasir, setConfirmKasir] = useState(false);
  const [showPromo, setShowPromo]       = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [form, setForm]                 = useState({ nama: "", meja: MEJA_ID });
  const [cafeName, setCafeName]         = useState("ASTAKIRA");
  const [snapClientKey, setSnapClientKey] = useState("");

  /* loading / error state untuk tombol bayar */
  const [paying, setPaying]   = useState(false);
  const [payError, setPayError] = useState("");

  /* ── Muat tema + client key ── */
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

        /* Ambil Midtrans client key dari pengaturan jika tersedia */
        const key = raw?.midtrans_client_key ?? raw?.snap_client_key ?? "";
        if (key) setSnapClientKey(key);
      })
      .catch(() => {});
  }, [CAFE_ID]);

  /* ── Kalkulasi harga ── */
  const calculateDiscount = () => {
    if (!appliedPromo) return 0;
    if (appliedPromo.discountType === "percent")
      return Math.round(subtotal * appliedPromo.discountValue / 100);
    if (appliedPromo.discountType === "fixed")
      return Math.min(Number(appliedPromo.discountValue), subtotal);
    const raw = String(appliedPromo.discountLabel ?? "");
    if (raw.includes("%")) return Math.round(subtotal * parseInt(raw) / 100);
    return parseInt(raw.replace(/\D/g, "")) || 0;
  };
  const discount = calculateDiscount();
  const total = subtotal - discount;

  /* ─────────────────────────────────────────
     Buat transaksi Midtrans ke backend,
     lalu buka Snap popup
     ───────────────────────────────────────── */
  const handleOnlinePayment = useCallback(async () => {
    if (!form.nama.trim()) {
      setPayError("Nama lengkap wajib diisi");
      return;
    }

    setPaying(true);
    setPayError("");

    try {
      /* 1. Minta snap_token dari backend */
      const payload = {
        cafe_id:      CAFE_ID,
        meja_id:      MEJA_ID,
        nama:         form.nama,
        note,
        item_notes:   itemNotes,
        promo_code:   appliedPromo?.code ?? null,
        subtotal,
        discount,
        total,
        items: orderedItems.map(item => ({
          id:       item.id,
          name:     item.name,
          price:    item.price,
          quantity: cart[item.id],
        })),
      };

      /* Endpoint backend: POST /api/pembayaran/midtrans/token  (sesuaikan jika berbeda) */
      const res = await api.post("api/pembayaran/midtrans/token", payload);
      const snapToken    = res?.snap_token ?? res?.data?.snap_token;
      const clientKey    = res?.client_key ?? res?.data?.client_key ?? snapClientKey;
      const orderId      = res?.order_id   ?? res?.data?.order_id;

      if (!snapToken) throw new Error("snap_token tidak ditemukan di respons backend");

      /* 2. Load Snap.js jika belum */
      await loadSnapScript(clientKey);

      /* 3. Buka popup Midtrans */
      window.snap.pay(snapToken, {
        onSuccess: (result) => {
          setPaying(false);
          navigate("/ringkasanpesanan", {
            state: {
              cart, items, note, itemNotes, subtotal, discount, total,
              form, method, cafeId: CAFE_ID, mejaId: MEJA_ID,
              midtrans: { status: "success", orderId, result },
            },
          });
        },
        onPending: (result) => {
          setPaying(false);
          navigate("/ringkasanpesanan", {
            state: {
              cart, items, note, itemNotes, subtotal, discount, total,
              form, method, cafeId: CAFE_ID, mejaId: MEJA_ID,
              midtrans: { status: "pending", orderId, result },
            },
          });
        },
        onError: (result) => {
          setPaying(false);
          setPayError("Pembayaran gagal: " + (result?.status_message ?? "Silakan coba lagi"));
        },
        onClose: () => {
          setPaying(false);
          /* user menutup popup tanpa bayar — tetap di halaman ini */
        },
      });

    } catch (err) {
      setPaying(false);
      setPayError(err.message ?? "Terjadi kesalahan, coba lagi");
    }
  }, [
    form, CAFE_ID, MEJA_ID, note, itemNotes, appliedPromo,
    subtotal, discount, total, orderedItems, cart, items, method,
    navigate, snapClientKey,
  ]);

  /* ── Main handler tombol bayar ── */
  const handleBayar = () => {
    if (method === "kasir") {
      if (!form.nama.trim()) { setPayError("Nama lengkap wajib diisi"); return; }
      setPayError("");
      setConfirmKasir(true);
    } else {
      handleOnlinePayment();
    }
  };

  /* Step label badge */
  const StepBadge = ({ n }) => (
    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ background: "var(--grad)" }}>
      <span className="text-[10px] font-bold" style={{ color: "var(--on-p)" }}>{n}</span>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen relative" style={{ background: "var(--bg)", color: "var(--tx)" }}>

      {/* ── HEADER ── */}
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

        {/* ── ORDER QUICK SUMMARY ── */}
        <div className="px-4 pt-4 mb-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StepBadge n="1" />
                <p className="font-bold text-sm text-gray-900">Ringkasan Pesanan</p>
              </div>
              <button onClick={() => navigate(-1)}
                className="text-xs font-semibold" style={{ color: "var(--p)" }}>Ubah</button>
            </div>
            <div className="divide-y divide-gray-50">
              {orderedItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0"
                    style={{ background: "var(--bg-soft)" }}>
                    {item.image_url || item.image
                      ? <img src={item.image_url ?? item.image} alt={item.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center">
                          <Image size={14} style={{ color: "var(--p)", opacity: 0.4 }} />
                        </div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm line-clamp-1">{item.name}</p>
                    {itemNotes[item.id] && (
                      <p className="text-[10px] line-clamp-1" style={{ color: "var(--p)" }}>📝 {itemNotes[item.id]}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">{cart[item.id]}×</p>
                    <p className="text-sm font-bold" style={{ color: "var(--p)" }}>
                      Rp{(cart[item.id] * item.price).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {note && (
              <div className="mx-4 mb-3 rounded-xl px-3 py-2 border"
                style={{ background: "var(--bg-soft)", borderColor: "var(--p-20)" }}>
                <span className="text-[10px]" style={{ color: "var(--p)" }}>📝 Catatan: {note}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── INFORMASI PEMESAN ── */}
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
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ background: "var(--grad)" }}>
                  <Check size={13} style={{ color: "var(--on-p)" }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── METODE PEMBAYARAN ── */}
        <div className="px-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <StepBadge n="3" />
            <h2 className="font-bold text-sm text-gray-900">Metode Pembayaran</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "online", icon: <CreditCard size={22} />, label: "Online",    sub: "QRIS / E-Wallet" },
              { id: "kasir",  icon: <Wallet size={22} />,     label: "Di Kasir",  sub: "Bayar langsung" },
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
                    <p className="font-bold text-sm" style={method === m.id ? { color: "var(--p)" } : { color: "#111827" }}>
                      {m.label}
                    </p>
                    <p className="text-[10px] text-gray-400">{m.sub}</p>
                  </div>
                </div>
                {method === m.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center shadow"
                    style={{ background: "var(--grad)" }}>
                    <Check size={11} style={{ color: "var(--on-p)" }} />
                  </div>
                )}
              </button>
            ))}
          </div>

          {method === "online" && (
            <div className="mt-3 bg-white rounded-2xl p-4 flex items-center justify-between border-2"
              style={{ borderColor: "var(--p-20)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--grad)" }}>
                  <span className="text-xl">📱</span>
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900">QRIS / E-Wallet / Kartu</p>
                  <p className="text-xs text-gray-400">Proses via Midtrans Sandbox</p>
                </div>
              </div>
              <div className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: "var(--grad)" }}>
                <Check size={11} style={{ color: "var(--on-p)" }} />
              </div>
            </div>
          )}

          {method === "kasir" && (
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
              <span className="text-2xl flex-shrink-0">🧾</span>
              <div>
                <p className="font-bold text-sm text-blue-800 mb-0.5">Bayar di Kasir</p>
                <p className="text-xs text-blue-600 leading-relaxed">
                  Setelah konfirmasi, tunjukkan kode pesanan ke staff kasir kami.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── PROMO ── */}
        <div className="px-4 mb-5">
          <button onClick={() => setShowPromo(true)}
            className="w-full rounded-2xl p-4 border-2 flex items-center justify-between transition-all bg-white"
            style={appliedPromo
              ? { borderColor: "#22c55e", background: "#f0fdf4" }
              : { borderStyle: "dashed", borderColor: "var(--p-20)" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: appliedPromo ? "#22c55e" : "var(--grad)" }}>
                {appliedPromo
                  ? <Check size={18} className="text-white" />
                  : <Gift size={18} style={{ color: "var(--on-p)" }} />}
              </div>
              <div className="text-left">
                {appliedPromo ? (
                  <>
                    <p className="font-bold text-green-700 text-sm">{appliedPromo.code}</p>
                    <p className="text-xs text-green-600">Hemat {appliedPromo.discountLabel}!</p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-gray-900 text-sm">Punya Kode Promo?</p>
                    <p className="text-xs text-gray-400">Ketuk untuk gunakan diskon</p>
                  </>
                )}
              </div>
            </div>
            <ChevronLeft size={18} className="text-gray-400 rotate-180" />
          </button>
        </div>

        {/* ── RINCIAN HARGA ── */}
        <div className="px-4 mb-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal ({totalQty} item)</span>
              <span className="font-semibold text-gray-900">Rp{subtotal.toLocaleString()}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Diskon Promo</span>
                <span className="font-semibold text-green-600">-Rp{discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Biaya layanan</span>
              <span className="font-semibold text-green-600">Gratis</span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between items-center rounded-xl px-3 py-2.5"
              style={{ background: "var(--bg-soft)" }}>
              <span className="font-bold text-gray-900 text-sm">Total Pembayaran</span>
              <span className="font-extrabold text-lg" style={{ color: "var(--p)" }}>
                Rp{total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* ── ERROR MESSAGE ── */}
        {payError && (
          <div className="px-4 mb-3">
            <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Info size={16} className="text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600 font-semibold">{payError}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
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

      {/* ── KASIR CONFIRMATION MODAL ── */}
      {confirmKasir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fadeIn"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-[2rem] p-7 w-full max-w-sm text-center space-y-5 shadow-2xl animate-scaleIn">
            <div className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center"
              style={{ background: "var(--bg-soft)" }}>
              <span className="text-5xl">🧾</span>
            </div>
            <div>
              <h3 className="font-bold text-xl text-gray-900 mb-1">Konfirmasi Pesanan</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Pastikan semua pesanan sudah benar sebelum melanjutkan ke kasir
              </p>
            </div>
            <div className="rounded-2xl p-4 text-left space-y-2 border"
              style={{ background: "var(--bg-soft)", borderColor: "var(--p-20)" }}>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total item</span>
                <span className="font-semibold">{totalQty} item</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total bayar</span>
                <span className="font-extrabold text-base" style={{ color: "var(--p)" }}>
                  Rp{total.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Metode</span>
                <span className="font-semibold">Bayar di Kasir</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmKasir(false)}
                className="flex-1 border-2 border-gray-200 text-gray-700 rounded-2xl py-3.5 font-bold hover:bg-gray-50 transition-all">
                Cek Lagi
              </button>
              <button onClick={() => navigate("/ringkasanpesanan", {
                  state: { cart, items, note, itemNotes, subtotal, discount, total, form, method, cafeId: CAFE_ID, mejaId: MEJA_ID }
                })}
                className="flex-1 rounded-2xl py-3.5 font-bold shadow-lg transition-all"
                style={{ background: "var(--grad)", color: "var(--on-p)" }}>
                Lanjutkan →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PROMO MODAL ── */}
      {showPromo && (
        <PromoCodeModal onClose={() => setShowPromo(false)} onApply={setAppliedPromo} subtotal={subtotal} cafeId={CAFE_ID} />
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