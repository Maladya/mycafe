import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft, Plus, Minus, Edit3, ShoppingBag,
  Receipt, AlertCircle, Trash2, X, Clock, Check,
  RefreshCw, Image
} from "lucide-react";
import ActionConfirmModal from "../components/ActionConfirmModal";

/* ─────────────────────────────────────────────
   Helpers yang sama persis dengan Home.jsx
   ──────────────────────────────────────────── */
const BASE_URL = (import.meta.env.VITE_API_URL ?? "https://www.mycafe-order.net").replace(/\/$/, "");
const TOKEN_KEY = "astakira_token";
const tokenManager = {
  get: () => localStorage.getItem(TOKEN_KEY) ?? import.meta.env.VITE_API_TOKEN ?? "",
};

const fixImgUrl = (url) => {
  if (!url?.trim()) return "";
  if (url.startsWith("data:")) return url;
  const b64 = url.indexOf("data:image/");
  if (b64 !== -1) return url.slice(b64);
  if (url.startsWith("/")) return `${BASE_URL}${url}`;
  if (url.startsWith("http")) {
    try {
      const p = new URL(url), b = new URL(BASE_URL);
      if (p.host !== b.host) { p.host = b.host; p.protocol = b.protocol; p.port = b.port; }
      return p.toString();
    } catch { return url; }
  }
  return `${BASE_URL}/${url}`;
};

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
    `--p:${theme.primary}`,
    `--s:${theme.secondary}`,
    `--bg:${theme.bg}`,
    `--tx:${theme.text}`,
    `--on-p:${onP}`,
    `--p-20:${ha(theme.primary, 0.2)}`,
    `--bg-soft:${ha(theme.primary, 0.07)}`,
    `--grad:linear-gradient(135deg,${theme.primary},${theme.secondary})`,
  ].join(";");
  document.documentElement.setAttribute("style", vars);
}

const api = {
  get: async (path) => {
    const token = tokenManager.get();
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}/${path}`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
};

/* ─────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────── */
function MenuImage({ src, alt }) {
  const [err, setErr] = useState(false);
  if (!src || err) return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--bg-soft)" }}>
      <Image size={20} style={{ color: "var(--p)", opacity: 0.35 }} />
    </div>
  );
  return <img src={src} alt={alt} className="w-full h-full object-cover" onError={() => setErr(true)} />;
}

/* ─────────────────────────────────────────────
   Main Component
   ──────────────────────────────────────────── */
export default function Pesanan() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [searchParams] = useSearchParams();

  // Ambil cafe_id dari state (dikirim Home) atau fallback ke query param
  const CAFE_ID = state?.cafeId ?? searchParams.get("cafe_id") ?? "";
  const MEJA_ID = state?.mejaId ?? searchParams.get("table") ?? "1";

  const orderId = state?.orderId ?? null;

  const [cart, setCart] = useState(state?.cart || {});
  const items = state?.items || [];

  const [openNote, setOpenNote] = useState(false);
  const [openItemNote, setOpenItemNote] = useState(null);
  const [note, setNote] = useState("");
  const [itemNotes, setItemNotes] = useState({});
  const [removing, setRemoving] = useState(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [showEmptyCartConfirm, setShowEmptyCartConfirm] = useState(false);

  const [themeReady, setThemeReady] = useState(false);
  const [cafeName, setCafeName] = useState("ASTAKIRA");

  /* ── Muat tema dari cache dulu, lalu fetch fresh ── */
  useEffect(() => {
    // Gunakan tema dari cache segera agar tidak blank
    try {
      const cached = localStorage.getItem(THEME_CACHE_KEY);
      if (cached) {
        applyThemeVars(JSON.parse(cached));
      }
    } catch {}
    setThemeReady(true);

    if (!CAFE_ID) return;

    api.get(`api/pengaturan/user/${CAFE_ID}`)
      .then(r => {
        const raw = r.data ?? r;
        const theme = parseTheme(raw?.tema_colors);
        applyThemeVars(theme);
        try { localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(theme)); } catch {}
        setCafeName(raw?.nama_cafe ?? raw?.nama ?? raw?.name ?? "ASTAKIRA");
      })
      .catch(() => {/* pakai cache */});

    return () => {
      // Jangan hapus style saat unmount; biarkan tema persisten
    };
  }, [CAFE_ID]);

  const orderedItems = items.filter(i => (cart[i.id]?.qty || 0) > 0);
  const subtotal = orderedItems.reduce((sum, i) => {
    const cartItem = cart[i.id] || {};
    const qty = cartItem.qty || 0;
    const basePrice = i.price || 0;
    const variantsPrice = (cartItem.variants || []).reduce((vsum, v) => vsum + (v?.hargaVariant || 0), 0);
    return sum + (qty * (basePrice + variantsPrice));
  }, 0);
  const totalQty = orderedItems.reduce((s, i) => s + (cart[i.id]?.qty || 0), 0);

  const addItem = (id) => setCart(prev => {
    const existing = prev[id] || {};
    return { ...prev, [id]: { ...existing, qty: (existing.qty || 0) + 1 } };
  });
  const removeItem = (id) => {
    const currentQty = cart[id]?.qty || 0;
    if (currentQty === 1) {
      setConfirmRemoveId(id);
      return;
    }

    setCart(prev => {
      const existing = prev[id] || {};
      return { ...prev, [id]: { ...existing, qty: (existing.qty || 0) - 1 } };
    });
  };

  const handleProceedPayment = () => {
    if (totalQty <= 0) {
      setShowEmptyCartConfirm(true);
      return;
    }
    navigate("/pembayaran", {
      state: { cart, items, note, itemNotes, subtotal, cafeId: CAFE_ID, mejaId: MEJA_ID, orderId },
    });
  };

  const handleTambahPesanan = () => {
    navigate(`/user?table=${encodeURIComponent(MEJA_ID)}&cafe_id=${encodeURIComponent(CAFE_ID)}`,
      {
        replace: true,
        state: { existingCart: cart, cafeId: CAFE_ID, mejaId: MEJA_ID, orderId },
      }
    );
  };

  return (
    <div className="max-w-md mx-auto min-h-screen relative" style={{ background: "var(--bg)", color: "var(--tx)" }}>

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3.5">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:opacity-80 transition-all"
            style={{ background: "var(--bg-soft)" }}
          >
            <ChevronLeft size={20} style={{ color: "var(--p)" }} />
          </button>

          <div className="text-center">
            <h1 className="font-extrabold text-base text-gray-900">Pesanan Saya</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">Meja {MEJA_ID} · {cafeName}</p>
          </div>

          <button
            onClick={handleTambahPesanan}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl hover:opacity-80 transition-all border"
            style={{ background: "var(--bg-soft)", color: "var(--p)", borderColor: "var(--p-20)" }}
          >
            <Plus size={13} />
            Tambah
          </button>
        </div>
      </div>

      {/* ── SUMMARY BANNER ── */}
      <div className="px-4 pt-4 mb-5">
        <div className="rounded-2xl px-5 py-4 shadow-lg" style={{ background: "var(--grad)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center border"
                style={{ background: "rgba(255,255,255,0.2)", borderColor: "rgba(255,255,255,0.3)" }}
              >
                <ShoppingBag size={20} style={{ color: "var(--on-p)" }} />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: "var(--on-p)", opacity: 0.75 }}>Total Pesanan</p>
                <p className="font-extrabold text-xl" style={{ color: "var(--on-p)" }}>{totalQty} Item</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium" style={{ color: "var(--on-p)", opacity: 0.75 }}>Subtotal</p>
              <p className="font-extrabold text-xl" style={{ color: "var(--on-p)" }}>Rp{subtotal.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── EMPTY STATE ── */}
      {orderedItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <p className="font-bold text-gray-700 text-lg mb-1">Keranjang Kosong</p>
          <p className="text-gray-400 text-sm mb-6">Yuk, pilih menu favoritmu!</p>
          <button
            onClick={() => navigate(-1)}
            className="text-white px-8 py-3 rounded-2xl font-bold shadow-lg"
            style={{ background: "var(--grad)", color: "var(--on-p)" }}
          >
            Pilih Menu
          </button>
        </div>
      )}

      {/* ── ITEMS LIST ── */}
      {orderedItems.length > 0 && (
        <div className="px-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Receipt size={16} style={{ color: "var(--p)" }} />
            <h2 className="font-extrabold text-sm text-gray-900">Daftar Pesanan</h2>
            <span className="ml-auto text-xs text-gray-400">{orderedItems.length} menu</span>
          </div>

          <div className="space-y-3">
            {orderedItems.map(item => (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 ${
                  removing === item.id ? "opacity-0 scale-95" : "opacity-100 scale-100"
                }`}
              >
                <div className="flex gap-3 p-3">
                  {/* Image */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0"
                    style={{ background: "var(--bg-soft)" }}>
                    <MenuImage src={fixImgUrl(item.image_url ?? item.image ?? "")} alt={item.name} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-sm leading-tight line-clamp-1">{item.name}</p>
                        {item.category && (
                          <p className="text-[10px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: "var(--p)" }}>
                            {item.category}
                          </p>
                        )}
                        <p className="font-extrabold text-sm mt-1" style={{ color: "var(--p)" }}>
                          Rp{item.price.toLocaleString()}
                        </p>
                      </div>

                      {/* Qty Control */}
                      <div className="flex items-center gap-2 rounded-xl px-2 py-1.5 flex-shrink-0 border"
                        style={{ background: "var(--bg-soft)", borderColor: "var(--p-20)" }}>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ background: "var(--p)" }}
                        >
                          {(cart[item.id]?.qty || 0) === 1 ? <Trash2 size={11} /> : <Minus size={11} />}
                        </button>
                        <span className="font-extrabold text-sm w-5 text-center" style={{ color: "var(--s)" }}>
                          {cart[item.id]?.qty || 0}
                        </span>
                        <button
                          onClick={() => addItem(item.id)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ background: "var(--p)" }}
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Variant & Item details */}
                    {(cart[item.id]?.variants?.length > 0 || cart[item.id]?.catatan) && (
                      <div className="mt-2 space-y-1">
                        {cart[item.id]?.variants?.map((v, idx) => (
                          <p key={idx} className="text-[10px] text-gray-500">
                            • {v.namaGroup}: {v.label}
                            {v.hargaVariant > 0 && (
                              <span className="text-gray-400"> (+Rp{v.hargaVariant.toLocaleString()})</span>
                            )}
                          </p>
                        ))}
                        {cart[item.id]?.catatan && (
                          <p className="text-[10px] text-gray-500 italic">📝 {cart[item.id].catatan}</p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-400">
                        {(cart[item.id]?.qty || 0)} × Rp{item.price.toLocaleString()}
                        {cart[item.id]?.variants?.length > 0 && (
                          <span className="text-gray-400"> + Rp{cart[item.id].variants.reduce((s, v) => s + (v.hargaVariant || 0), 0).toLocaleString()}</span>
                        )}
                      </p>
                      <p className="text-xs font-bold text-gray-700">
                        = Rp{((cart[item.id]?.qty || 0) * item.price + (cart[item.id]?.variants || []).reduce((s, v) => s + ((v.hargaVariant || 0) * (cart[item.id]?.qty || 0)), 0)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setOpenItemNote(item.id)}
                  className="w-full border-t px-3 py-2.5 text-xs flex items-center gap-2 transition-all"
                  style={
                    itemNotes[item.id]
                      ? { background: "var(--bg-soft)", borderColor: "var(--p-20)", color: "var(--p)" }
                      : { background: "#f9fafb", borderColor: "#f3f4f6", color: "#9ca3af" }
                  }
                >
                  <Edit3 size={12} />
                  <span className="line-clamp-1">{itemNotes[item.id] || "Tambah catatan untuk item ini..."}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── GENERAL NOTE ── */}
      {orderedItems.length > 0 && (
        <div className="px-4 mb-5">
          <button
            onClick={() => setOpenNote(true)}
            className="w-full rounded-2xl p-4 border-2 transition-all bg-white hover:opacity-90"
            style={note
              ? { borderColor: "var(--p)", background: "var(--bg-soft)" }
              : { borderColor: "#d1d5db", borderStyle: "dashed" }
            }
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--grad)" }}>
                <Edit3 size={16} style={{ color: "var(--on-p)" }} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm">Catatan Pesanan</p>
                <p className="text-xs text-gray-500 line-clamp-1">{note || "Tambahkan catatan khusus untuk seluruh pesanan"}</p>
              </div>
              <ChevronLeft className="text-gray-400 rotate-180 flex-shrink-0" size={18} />
            </div>
          </button>
        </div>
      )}

      {/* ── PAYMENT SUMMARY ── */}
      {orderedItems.length > 0 && (
        <div className="px-4 mb-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--grad)" }}>
                <Receipt size={14} style={{ color: "var(--on-p)" }} />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Rincian Pembayaran</h3>
            </div>

            <div className="px-4 py-3 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal ({totalQty} item)</span>
                <span className="font-semibold text-gray-900">Rp{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Biaya layanan</span>
                <span className="font-semibold text-green-600">Gratis</span>
              </div>
              <div className="h-px bg-gray-100 my-1" />
              <div className="flex justify-between items-center rounded-xl px-3 py-2.5" style={{ background: "var(--bg-soft)" }}>
                <span className="font-bold text-gray-900 text-sm">Total Pembayaran</span>
                <span className="font-extrabold text-lg" style={{ color: "var(--p)" }}>Rp{subtotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="px-4 pb-3">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-600">Harga sudah termasuk pajak dan biaya layanan</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EST. TIME ── */}
      {orderedItems.length > 0 && (
        <div className="px-4 pb-28">
          <div className="rounded-2xl p-3.5 flex items-center gap-3 border" style={{ background: "var(--bg-soft)", borderColor: "var(--p-20)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--p)" }}>
              <Clock size={16} style={{ color: "var(--on-p)" }} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: "var(--p)" }}>Estimasi Waktu</p>
              <p className="text-xs text-gray-500">10–20 menit setelah pembayaran dikonfirmasi</p>
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER CTA ── */}
      {orderedItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-xl">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Total Pembayaran</p>
                <p className="font-extrabold text-2xl text-gray-900">Rp{subtotal.toLocaleString()}</p>
              </div>
              <button
                onClick={handleProceedPayment}
                className="px-8 py-3.5 rounded-2xl font-bold shadow-lg hover:scale-105 hover:shadow-xl transition-all whitespace-nowrap"
                style={{ background: "var(--grad)", color: "var(--on-p)" }}
              >
                Lanjut Bayar →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ITEM NOTE MODAL ── */}
      {openItemNote && (
        <div
          className="fixed inset-0 flex items-end z-50 animate-fadeIn"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setOpenItemNote(null)}
        >
          <div
            className="bg-white w-full max-w-md mx-auto rounded-t-[2rem] p-6 space-y-4 animate-slideUp shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto" />
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg text-gray-900">Catatan: {items.find(i => i.id === openItemNote)?.name}</h2>
              <button onClick={() => setOpenItemNote(null)} className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                <X size={18} className="text-gray-600" />
              </button>
            </div>
            <textarea
              value={itemNotes[openItemNote] || ""}
              onChange={e => setItemNotes(prev => ({ ...prev, [openItemNote]: e.target.value }))}
              placeholder="Contoh: Tidak pakai bawang, pedas sedikit..."
              className="w-full h-28 border-2 border-gray-200 rounded-2xl p-4 outline-none resize-none text-sm transition-all"
              style={{ "--tw-ring-color": "var(--p)" }}
              onFocus={e => { e.target.style.borderColor = "var(--p)"; }}
              onBlur={e => { e.target.style.borderColor = "#e5e7eb"; }}
            />
            <button onClick={() => setOpenItemNote(null)} className="w-full py-3.5 rounded-2xl font-bold shadow-lg" style={{ background: "var(--grad)", color: "var(--on-p)" }}>
              Simpan Catatan
            </button>
          </div>
        </div>
      )}

      {/* ── GENERAL NOTE MODAL ── */}
      {openNote && (
        <div
          className="fixed inset-0 flex items-end z-50 animate-fadeIn"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setOpenNote(false)}
        >
          <div className="bg-white w-full max-w-md mx-auto rounded-t-[2rem] p-6 space-y-4 animate-slideUp shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto" />
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg text-gray-900">Catatan Pesanan</h2>
              <button onClick={() => setOpenNote(false)} className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                <X size={18} className="text-gray-600" />
              </button>
            </div>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              maxLength={200}
              placeholder="Contoh: Tidak pakai es, gula sedikit, dll..."
              className="w-full h-32 border-2 border-gray-200 rounded-2xl p-4 outline-none resize-none text-sm transition-all"
              onFocus={e => { e.target.style.borderColor = "var(--p)"; }}
              onBlur={e => { e.target.style.borderColor = "#e5e7eb"; }}
            />
            <p className="text-xs text-gray-400 text-right">{note.length}/200 karakter</p>
            <button onClick={() => setOpenNote(false)} className="w-full py-3.5 rounded-2xl font-bold shadow-lg" style={{ background: "var(--grad)", color: "var(--on-p)" }}>
              Simpan Catatan
            </button>
          </div>
        </div>
      )}

      <ActionConfirmModal
        open={showEmptyCartConfirm}
        icon="🛒"
        title="Keranjang kosong"
        message="Tambahkan menu dulu sebelum lanjut ke pembayaran."
        cancelText="Tutup"
        confirmText="Oke"
        onCancel={() => setShowEmptyCartConfirm(false)}
        onConfirm={() => setShowEmptyCartConfirm(false)}
      />

      <ActionConfirmModal
        open={!!confirmRemoveId}
        icon="🗑️"
        title="Hapus item?"
        message="Item ini akan dihapus dari pesanan."
        cancelText="Batal"
        confirmText="Hapus"
        confirmStyle={{ background: "#ef4444", color: "#fff" }}
        onCancel={() => setConfirmRemoveId(null)}
        onConfirm={() => {
          const id = confirmRemoveId;
          if (!id) return;
          setConfirmRemoveId(null);
          setRemoving(id);
          setTimeout(() => {
            setCart(prev => { const c = { ...prev }; delete c[id]; return c; });
            setRemoving(null);
          }, 300);
        }}
      />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}