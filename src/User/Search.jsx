import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search, ArrowLeft, X, TrendingUp, Clock, Flame, Zap, Coffee,
  ShoppingBag, Heart, Share2, Plus, Minus, Leaf, Check,
  ExternalLink, RotateCcw, Image, AlertCircle, RefreshCw
} from "lucide-react";

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL = (import.meta.env.VITE_API_URL ?? "http://192.168.1.9:3000").replace(/\/$/, "");
const TOKEN_KEY = "astakira_token";
const tokenManager = {
  get: () => localStorage.getItem(TOKEN_KEY) ?? import.meta.env.VITE_API_TOKEN ?? "",
};

// ── Fix URL gambar ────────────────────────────────────────────────────────────
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

// ── Parse tema_colors dari database ──────────────────────────────────────────
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

// Baca tema dari cache (localStorage) dan inject langsung ke :root
// Dipanggil sekali saat module load — sebelum React render
function applyThemeVars(theme) {
  const onP = contrast(theme.primary);
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

// Inject tema dari cache SEBELUM render pertama (tidak ada delay)
try {
  const cached = localStorage.getItem(THEME_CACHE_KEY);
  if (cached) applyThemeVars(JSON.parse(cached));
} catch {}

// ── API ───────────────────────────────────────────────────────────────────────
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

function useApi(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const execute = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await fetchFn()); }
    catch (err) { setError(err.message || "Terjadi kesalahan"); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { execute(); }, [execute]);
  return { data, loading, error, refetch: execute };
}

// ── Normalizers — SAMA dengan Home.jsx ───────────────────────────────────────
function normalizeCategory(cat) {
  return {
    id:    cat.id,
    label: cat.nama_kategori ?? cat.label ?? cat.nama ?? cat.name ?? String(cat.id),
    logo:  fixImgUrl(cat.logo ?? cat.icon ?? cat.foto ?? cat.gambar ?? ""),
    color: "from-amber-500 to-orange-500",
    items: Array.isArray(cat.items) ? cat.items : [],
  };
}

function normalizeMenuItem(item) {
  const rawCatId = item.category_id ?? item.kategori_id ?? item.id_kategori ?? item.cat_id ?? null;
  return {
    id:            item.id,
    name:          item.name         ?? item.nama_menu  ?? item.nama   ?? "",
    price:         Number(item.price ?? item.harga      ?? 0),
    originalPrice: item.originalPrice ?? item.harga_asli ?? item.harga_coret ?? null,
    image_url:     fixImgUrl(item.image_url ?? item.image ?? item.foto ?? item.gambar ?? ""),
    category:      item.category     ?? item.nama_kategori ?? item.kategori ?? "",
    categoryId:    rawCatId !== null ? String(rawCatId) : "",
    _raw:          item,
    badge:         item.badge        ?? item.label      ?? null,
    discount:      item.discount     ?? item.diskon     ?? null,
    tagline:       item.tagline      ?? item.deskripsi_singkat ?? item.subtitle ?? "",
    description:   item.description  ?? item.deskripsi  ?? "",
    prepTime:      item.prepTime     ?? item.waktu_masak ?? item.estimasi ?? "",
    calories:      item.calories     ?? item.kalori     ?? 0,
    isVegan:       item.isVegan      ?? item.vegan      ?? false,
    volume:        item.volume       ?? item.ukuran     ?? "",
    ingredients:   item.ingredients  ?? item.bahan      ?? [],
    variants:      (item.variants ?? item.varian ?? []).map(v => ({
      label: v.label ?? v.nama ?? v.ukuran ?? "",
      price: Number(v.price ?? v.harga ?? 0),
      image: fixImgUrl(v.image ?? v.foto ?? item.image_url ?? item.image ?? item.foto ?? ""),
    })),
    related: item.related ?? item.related_menu ?? [],
  };
}

function buildMenuDatabase(arr = []) {
  return Object.fromEntries(arr.map(i => { const n = normalizeMenuItem(i); return [n.id, n]; }));
}

function buildCategorySections(cats, db) {
  const all = Object.values(db);
  return cats.map(cat => {
    if (cat.items.length > 0) return cat;
    const s = String(cat.id);
    const ids = all.filter(item => {
      const r = item._raw;
      return item.categoryId === s || String(r?.category_id) === s || String(r?.kategori_id) === s ||
             String(r?.id_kategori) === s || String(r?.cat_id) === s;
    }).map(i => i.id);
    return { ...cat, items: ids };
  }).filter(c => c.items.length > 0);
}

function buildCartFromOrder(orderItems, db) {
  const cart = {}, all = Object.values(db);
  orderItems.forEach(o => {
    const nama = (o.name ?? o.nama ?? "").toLowerCase();
    const found = all.find(m => m.name.toLowerCase() === nama);
    if (found) cart[found.id] = (cart[found.id] || 0) + (o.qty ?? o.jumlah ?? 1);
  });
  return cart;
}

// ── Badge helpers ─────────────────────────────────────────────────────────────
const badgeColor = {
  "Promo":       "bg-gradient-to-r from-red-500 to-pink-500",
  "Favorit":     "bg-gradient-to-r from-amber-500 to-orange-500",
  "Baru":        "bg-gradient-to-r from-green-500 to-emerald-500",
  "Best Seller": "bg-gradient-to-r from-purple-500 to-pink-500",
};
const badgeLabel = { "Best Seller": "Best Seller", "Promo": "Diskon", "Favorit": "Favorit", "Baru": "Baru" };
const badgeBg    = { "Best Seller": "bg-purple-500", "Promo": "bg-red-500", "Favorit": "bg-amber-500", "Baru": "bg-green-500" };

// ── MenuImage ─────────────────────────────────────────────────────────────────
function MenuImage({ src, alt, className = "w-full h-full object-cover" }) {
  const [err, setErr] = useState(false);
  if (!src || err) return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--bg-soft)" }}>
      <Image size={24} style={{ color: "var(--p)", opacity: 0.35 }} />
    </div>
  );
  return <img src={src} alt={alt} className={className} onError={() => setErr(true)} />;
}

// ── CatLogo ───────────────────────────────────────────────────────────────────
function CatLogo({ logo, size = 22 }) {
  const [err, setErr] = useState(false);
  if (!logo || err) return <Image size={size * 0.7} style={{ color: "var(--on-p)", opacity: 0.9 }} />;
  return <img src={logo} alt="" style={{ width: size, height: size, objectFit: "cover" }} onError={() => setErr(true)} />;
}

// ── ErrorState ────────────────────────────────────────────────────────────────
function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <AlertCircle size={48} className="text-red-400 mb-3" />
      <p className="font-bold text-gray-700 mb-1">Gagal memuat data</p>
      <p className="text-gray-400 text-sm mb-4">{message}</p>
      <button onClick={onRetry}
        className="flex items-center gap-2 text-white px-5 py-2.5 rounded-2xl font-bold"
        style={{ background: "var(--p)" }}>
        <RefreshCw size={15} /> Coba Lagi
      </button>
    </div>
  );
}

// ── MenuDetailSheet ───────────────────────────────────────────────────────────
function MenuDetailSheet({ item, menuDatabase, onClose, onAddToCart, onOpenItem }) {
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const hasVariants  = item.variants?.length > 0;
  const currentPrice = hasVariants ? (item.variants[selectedVariant]?.price ?? item.price) : item.price;
  const totalPrice   = currentPrice * qty;
  const relatedItems = Object.values(menuDatabase).filter(m => item.related?.includes(m.id));
  const heroImage    = hasVariants ? (item.variants[selectedVariant]?.image || item.image_url) : item.image_url;

  const handleAdd = () => {
    setAddedToCart(true);
    onAddToCart(item.id, qty, currentPrice);
    setTimeout(() => { setAddedToCart(false); onClose(); }, 1200);
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end animate-fadeIn"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="relative bg-white w-full max-w-md mx-auto rounded-t-[2rem] animate-slideUp overflow-hidden"
        style={{ maxHeight: "92vh" }} onClick={e => e.stopPropagation()}>
        <div className="overflow-y-auto scrollbar-hide" style={{ maxHeight: "92vh", paddingBottom: "160px" }}>

          {/* Hero */}
          <div className="relative h-72 flex-shrink-0" style={{ background: "var(--bg-soft)" }}>
            <MenuImage src={heroImage} alt={item.name} className="w-full h-full object-cover transition-all duration-500" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30" />
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
              <button onClick={onClose} className="w-11 h-11 flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl shadow-xl hover:bg-white/30 transition-all">
                <ArrowLeft size={20} className="text-white" />
              </button>
              <div className="flex gap-3">
                <button onClick={() => setIsWishlisted(!isWishlisted)} className="w-11 h-11 flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl shadow-xl hover:bg-white/30 transition-all">
                  <Heart size={18} className={isWishlisted ? "fill-red-400 text-red-400" : "text-white"} />
                </button>
                <button className="w-11 h-11 flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl shadow-xl hover:bg-white/30 transition-all">
                  <Share2 size={18} className="text-white" />
                </button>
              </div>
            </div>
            {item.badge && (
              <div className="absolute top-20 left-4 z-10">
                <span className={`text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg ${item.badge === "Promo" ? "bg-gradient-to-r from-red-500 to-pink-500" : "bg-gradient-to-r from-purple-500 to-pink-500"}`}>
                  {item.badge === "Promo" && item.discount ? `-${item.discount}` : item.badge}
                </span>
              </div>
            )}
            {hasVariants && item.variants.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                {item.variants.map((v, i) => (
                  <button key={i} onClick={() => setSelectedVariant(i)}
                    className={`relative w-14 h-14 rounded-2xl overflow-hidden transition-all duration-200 ${selectedVariant === i ? "scale-110 shadow-xl" : "opacity-65 hover:opacity-90"}`}
                    style={selectedVariant === i ? { outline: "2px solid var(--p)", outlineOffset: "2px" } : {}}>
                    <MenuImage src={v.image} alt={v.label} />
                    <div className="absolute inset-x-0 bottom-0 text-center text-[8px] font-bold leading-tight py-0.5"
                      style={selectedVariant === i ? { background: "var(--p)", color: "var(--on-p)" } : { background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.8)" }}>
                      {v.label?.split(" ")[0]}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="px-5 pt-5">
            {item.category && <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--p)" }}>{item.category}</p>}
            <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">{item.name}</h1>
            {item.tagline && <p className="text-sm text-gray-400 mt-1 italic mb-4">{item.tagline}</p>}

            <div className="flex gap-2 mb-5 flex-wrap">
              {item.prepTime && (<div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-xl px-3 py-1.5"><Clock size={13} className="text-orange-500" /><span className="text-xs font-semibold text-orange-700">{item.prepTime}</span></div>)}
              {item.calories > 0 && (<div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl px-3 py-1.5"><Flame size={13} className="text-red-500" /><span className="text-xs font-semibold text-red-700">{item.calories} kal</span></div>)}
              {item.isVegan && (<div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-xl px-3 py-1.5"><Leaf size={13} className="text-green-500" /><span className="text-xs font-semibold text-green-700">Vegan</span></div>)}
              {item.volume && (<div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5"><span className="text-xs font-semibold text-blue-700">🥤 {item.volume}</span></div>)}
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-5" />
            {item.description && <p className="text-sm text-gray-600 leading-relaxed mb-5">{item.description}</p>}

            {item.ingredients?.length > 0 && (
              <div className="mb-6">
                <h2 className="text-base font-bold text-gray-900 mb-2">Bahan</h2>
                <div className="flex flex-wrap gap-2">
                  {item.ingredients.map((ing, i) => <span key={i} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{ing}</span>)}
                </div>
              </div>
            )}

            {hasVariants && item.variants.length > 1 && (
              <div className="mb-6">
                <h2 className="text-base font-bold text-gray-900 mb-3">Pilih Varian</h2>
                <div className="flex gap-3">
                  {item.variants.map((v, i) => (
                    <button key={i} onClick={() => setSelectedVariant(i)}
                      className={`flex-1 rounded-2xl font-bold text-sm border-2 transition-all overflow-hidden ${selectedVariant === i ? "shadow-lg scale-105" : "border-gray-200"}`}
                      style={selectedVariant === i ? { borderColor: "var(--p)" } : {}}>
                      <div className="relative h-20 overflow-hidden" style={{ background: "var(--bg-soft)" }}>
                        <MenuImage src={v.image} alt={v.label} />
                        <div className="absolute inset-0" style={{ background: selectedVariant === i ? "rgba(0,0,0,0.1)" : "rgba(0,0,0,0.1)" }} />
                        {selectedVariant === i && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow"
                            style={{ background: "var(--p)" }}>
                            <Check size={11} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="px-3 py-2 text-center"
                        style={selectedVariant === i ? { background: "var(--p)", color: "var(--on-p)" } : { background: "white" }}>
                        <div className="font-bold text-sm" style={selectedVariant !== i ? { color: "#374151" } : {}}>{v.label}</div>
                        <div className="text-xs mt-0.5 font-semibold"
                          style={selectedVariant === i ? { color: "var(--on-p)", opacity: 0.85 } : { color: "var(--p)" }}>
                          Rp{v.price.toLocaleString()}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {relatedItems.length > 0 && (
              <>
                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-5" />
                <div className="mb-6">
                  <h2 className="text-base font-bold text-gray-900 mb-4">Menu Lainnya</h2>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {relatedItems.map(rel => (
                      <div key={rel.id} onClick={() => onOpenItem(rel)}
                        className="flex-shrink-0 w-36 bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer">
                        <div className="h-24 overflow-hidden" style={{ background: "var(--bg-soft)" }}>
                          <MenuImage src={rel.image_url} alt={rel.name} />
                        </div>
                        <div className="p-3">
                          <p className="font-bold text-gray-900 text-xs line-clamp-1">{rel.name}</p>
                          <p className="font-bold text-xs mt-1" style={{ color: "var(--p)" }}>Rp{rel.price.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Total Harga</p>
              <p className="text-2xl font-extrabold text-gray-900">Rp{totalPrice.toLocaleString()}</p>
              {item.originalPrice && <p className="text-xs text-gray-400 line-through">Rp{Number(item.originalPrice).toLocaleString()}</p>}
            </div>
            <div className="flex items-center gap-3 rounded-2xl px-3 py-2 border-2"
              style={{ background: "var(--bg-soft)", borderColor: "var(--p-20)" }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-sm">
                <Minus size={16} style={{ color: "var(--p)" }} />
              </button>
              <span className="font-extrabold text-gray-900 text-lg w-6 text-center">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="w-8 h-8 flex items-center justify-center rounded-xl shadow-sm"
                style={{ background: "var(--grad)" }}>
                <Plus size={16} style={{ color: "var(--on-p)" }} />
              </button>
            </div>
          </div>
          <button onClick={handleAdd}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:scale-[1.02]"
            style={addedToCart ? { background: "#22c55e", color: "#fff" } : { background: "var(--grad)", color: "var(--on-p)" }}>
            {addedToCart ? <><Check size={20} /> Ditambahkan!</> : <><ShoppingBag size={20} /> Tambah ke Pesanan</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── RiwayatPesananSheet — fetch dari API seperti Home ─────────────────────────
function RiwayatPesananSheet({ menuDatabase, mejaId, cafeId, cafeName, onClose, onNavigateToPesanan, onReorder }) {
  const [activeTab, setActiveTab] = useState("sedang");
  const { data: ordersRaw, loading, error, refetch } = useApi(
    () => api.get(`api/orders?meja=${mejaId}&cafe_id=${cafeId}`).then(r => r.data ?? r),
    [mejaId, cafeId]
  );

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const orders = (ordersRaw ?? []).map(o => ({
    id:       o.id,
    status:   o.status,
    waktu:    o.waktu    ?? o.created_at ?? o.tanggal ?? "",
    estimasi: o.estimasi ?? o.eta        ?? "15 mnt",
    items: (o.items ?? o.detail ?? o.order_items ?? []).map(i => ({
      name:    i.name   ?? i.nama    ?? i.nama_menu ?? "",
      variant: i.variant ?? i.varian ?? "",
      qty:     Number(i.qty ?? i.jumlah ?? 1),
      price:   Number(i.price ?? i.harga ?? 0),
      image:   fixImgUrl(i.image ?? i.foto ?? i.gambar ?? ""),
    })),
  }));

  const isSedang  = s => ["sedang", "proses", "pending"].includes(s);
  const isSelesai = s => ["selesai", "done", "completed"].includes(s);
  const sedangOrders  = orders.filter(o => isSedang(o.status));
  const selesaiOrders = orders.filter(o => isSelesai(o.status));
  const displayed     = activeTab === "sedang" ? sedangOrders : selesaiOrders;
  const getTotal      = items => items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end animate-fadeIn"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="relative bg-white w-full max-w-md mx-auto rounded-t-[2rem] animate-slideUp overflow-hidden"
        style={{ maxHeight: "88vh" }} onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-1" />
        <div className="flex items-center justify-between px-5 pt-3 pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">Riwayat Pesanan</h2>
            <p className="text-xs text-gray-400 mt-0.5">Meja Nomor {mejaId} · {cafeName}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">
            <span className="text-gray-600 font-bold text-xl leading-none">×</span>
          </button>
        </div>

        <div className="px-5 mb-4">
          <div className="flex bg-gray-100 rounded-2xl p-1">
            <button onClick={() => setActiveTab("sedang")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "sedang" ? "bg-white shadow-sm" : "text-gray-500"}`}
              style={activeTab === "sedang" ? { color: "var(--p)" } : {}}>
              <span className="w-2 h-2 rounded-full" style={{ background: activeTab === "sedang" ? "var(--p)" : "#9ca3af" }} />
              Sedang Diproses
              {sedangOrders.length > 0 && <span className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "var(--p)" }}>{sedangOrders.length}</span>}
            </button>
            <button onClick={() => setActiveTab("selesai")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "selesai" ? "bg-white text-gray-700 shadow-sm" : "text-gray-500"}`}>
              <Check size={13} className={activeTab === "selesai" ? "text-green-500" : "text-gray-400"} />
              Sudah Selesai
            </button>
          </div>
        </div>

        <div className="overflow-y-auto scrollbar-hide px-5 pb-8" style={{ maxHeight: "calc(88vh - 185px)" }}>
          {loading && <div className="space-y-4">{[1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse overflow-hidden">
              <div className="h-16 bg-gray-100" />
              <div className="p-4 space-y-3"><div className="flex gap-3"><div className="w-12 h-12 bg-gray-200 rounded-xl" /><div className="flex-1 space-y-2"><div className="h-3 bg-gray-200 rounded w-3/4" /><div className="h-3 bg-gray-200 rounded w-1/2" /></div></div></div>
            </div>
          ))}</div>}
          {error && !loading && <ErrorState message={error} onRetry={refetch} />}
          {!loading && !error && displayed.length === 0 && (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🛍️</div>
              <p className="text-gray-500 font-semibold">Belum ada pesanan</p>
              <p className="text-gray-400 text-sm mt-1">{activeTab === "sedang" ? "Tidak ada pesanan yang sedang diproses" : "Belum ada pesanan yang selesai"}</p>
            </div>
          )}
          {!loading && !error && displayed.length > 0 && (
            <div className="space-y-4">
              {displayed.map(order => (
                <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 flex items-center justify-between border-b"
                    style={isSedang(order.status) ? { background: "var(--bg-soft)", borderColor: "var(--p-20)" } : { background: "#f9fafb", borderColor: "#f3f4f6" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: isSelesai(order.status) ? "#22c55e" : "var(--p)" }}>
                        {isSelesai(order.status) ? <Check size={14} className="text-white" /> : <Clock size={14} className="text-white" />}
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-gray-700">{order.id}</p>
                        <p className="text-[10px] text-gray-400">{order.waktu}</p>
                      </div>
                    </div>
                    {isSedang(order.status) ? (
                      <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 border"
                        style={{ background: "var(--bg-soft)", borderColor: "var(--p-20)" }}>
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--p)" }} />
                        <span className="text-[10px] font-bold" style={{ color: "var(--p)" }}>Est. {order.estimasi}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 bg-green-100 border border-green-200 rounded-full px-2.5 py-1">
                        <Check size={10} className="text-green-600" /><span className="text-[10px] font-bold text-green-700">Selesai</span>
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-3 space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100" style={{ background: "var(--bg-soft)" }}>
                          <MenuImage src={item.image} alt={item.name} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm line-clamp-1">{item.name}</p>
                          <p className="text-xs text-gray-400">{item.variant ? `${item.variant} · ` : ""}{item.qty}×</p>
                        </div>
                        <p className="font-extrabold text-sm flex-shrink-0" style={{ color: "var(--p)" }}>Rp{(item.price * item.qty).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-500">{order.items.reduce((s, i) => s + i.qty, 0)} item</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">Total:</p>
                      <p className="font-extrabold text-gray-900 text-sm">Rp{getTotal(order.items).toLocaleString()}</p>
                    </div>
                  </div>
                  {isSedang(order.status) && (
                    <div className="px-4 pb-4 pt-1">
                      <button onClick={() => { const c = buildCartFromOrder(order.items, menuDatabase); onClose(); onNavigateToPesanan({ cart: c, items: Object.values(menuDatabase).filter(m => c[m.id]), orderId: order.id }); }}
                        className="w-full py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:scale-[1.02]"
                        style={{ background: "var(--grad)", color: "var(--on-p)" }}>
                        <ExternalLink size={15} /> Lihat Detail Pesanan
                      </button>
                    </div>
                  )}
                  {isSelesai(order.status) && (
                    <div className="px-4 pb-4 pt-1">
                      <button onClick={() => { const c = buildCartFromOrder(order.items, menuDatabase); onClose(); onReorder({ cart: c, items: Object.values(menuDatabase).filter(m => c[m.id]) }); }}
                        className="w-full py-3 border-2 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2"
                        style={{ borderColor: "var(--p)", color: "var(--p)" }}>
                        <RotateCcw size={15} /> 🔄 Pesan Lagi
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── LihatSemuaPopup ───────────────────────────────────────────────────────────
function LihatSemuaPopup({ section, cart, onAdd, onRemove, onItemClick, onClose, menuDatabase }) {
  const sectionItems = section.items.map(id => menuDatabase[id]).filter(Boolean);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end animate-fadeIn"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="relative bg-white w-full max-w-md mx-auto rounded-t-[2rem] animate-slideUp overflow-hidden"
        style={{ maxHeight: "85vh" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shadow-sm flex-shrink-0"
              style={{ background: "var(--grad)" }}>
              <CatLogo logo={section.logo} size={24} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">{section.label}</h2>
              <p className="text-xs text-gray-400">{sectionItems.length} menu tersedia</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-xl hover:bg-gray-200">
            <span className="text-gray-600 font-bold text-xl leading-none">×</span>
          </button>
        </div>
        <div className="overflow-y-auto scrollbar-hide px-4 py-4" style={{ maxHeight: "calc(85vh - 80px)" }}>
          <div className="grid grid-cols-2 gap-3">
            {sectionItems.map(item => {
              const qty = cart[item.id] || 0;
              return (
                <div key={item.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
                  onClick={() => { onItemClick(item); onClose(); }}>
                  <div className="relative h-32 overflow-hidden" style={{ background: "var(--bg-soft)" }}>
                    <MenuImage src={item.image_url} alt={item.name} />
                    {item.badge && (
                      <div className={`absolute top-2 left-2 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow ${badgeColor[item.badge] || "bg-gray-500"}`}>
                        {item.badge === "Promo" && item.discount ? `-${item.discount}` : item.badge}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-gray-900 text-sm line-clamp-1">{item.name}</p>
                    {item.tagline && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.tagline}</p>}
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <p className="font-extrabold text-sm" style={{ color: "var(--p)" }}>Rp{item.price.toLocaleString()}</p>
                      {item.originalPrice && <p className="text-gray-400 text-[10px] line-through">Rp{Number(item.originalPrice).toLocaleString()}</p>}
                    </div>
                    <div className="mt-2" onClick={e => e.stopPropagation()}>
                      {qty === 0 ? (
                        <button onClick={() => onAdd(item.id)}
                          className="w-full text-xs font-bold py-1.5 rounded-xl"
                          style={{ background: "var(--grad)", color: "var(--on-p)" }}>+ Tambah</button>
                      ) : (
                        <div className="flex items-center justify-between rounded-xl px-2 py-1 border"
                          style={{ background: "var(--bg-soft)", borderColor: "var(--p-20)" }}>
                          <button onClick={() => onRemove(item.id)} className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: "var(--p)" }}>−</button>
                          <span className="font-bold text-xs" style={{ color: "var(--s)" }}>{qty}</span>
                          <button onClick={() => onAdd(item.id)} className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: "var(--p)" }}>+</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SearchMenuCard — pakai data dari DB ───────────────────────────────────────
function SearchMenuCard({ item, index, cart, onAdd, onRemove, onClick }) {
  const qty  = cart[item.id] || 0;
  const isHot = item.badge === "Best Seller" || item.badge === "Favorit";

  return (
    <div
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex cursor-pointer"
      style={{ animationDelay: `${index * 40}ms` }}
      onClick={onClick}
    >
      <div className="relative w-28 h-28 flex-shrink-0 overflow-hidden" style={{ background: "var(--bg-soft)" }}>
        <MenuImage src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
        {item.badge && (
          <div className={`absolute top-2 left-2 ${badgeBg[item.badge] || "bg-gray-500"} text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow`}>
            {badgeLabel[item.badge] ?? item.badge}
          </div>
        )}
        {isHot && (
          <div className="absolute bottom-2 left-2 flex items-center gap-0.5 bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5">
            <Flame size={9} className="text-orange-400" />
            <span className="text-[9px] text-orange-300 font-bold">Hot</span>
          </div>
        )}
      </div>

      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-1 mb-1">
            <p className="font-extrabold text-gray-900 text-sm leading-tight line-clamp-1">{item.name}</p>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-lg whitespace-nowrap flex-shrink-0 border"
              style={{ color: "var(--p)", background: "var(--bg-soft)", borderColor: "var(--p-20)" }}>
              {item.category}
            </span>
          </div>
          {item.tagline && <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed mb-2">{item.tagline}</p>}
        </div>

        <div className="flex items-center justify-between mt-2" onClick={e => e.stopPropagation()}>
          <div>
            <p className="font-extrabold text-base leading-none" style={{ color: "var(--p)" }}>Rp{item.price.toLocaleString()}</p>
            {item.originalPrice && <p className="text-[10px] text-gray-400 line-through">Rp{Number(item.originalPrice).toLocaleString()}</p>}
          </div>
          {qty === 0 ? (
            <button onClick={e => { e.stopPropagation(); onClick(); }}
              className="px-3 py-1.5 rounded-xl text-xs font-extrabold hover:scale-105 transition-all"
              style={{ background: "var(--grad)", color: "var(--on-p)" }}>
              + Tambah
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-xl px-2 py-1 border"
              style={{ background: "var(--bg-soft)", borderColor: "var(--p-20)" }}>
              <button onClick={e => { e.stopPropagation(); onRemove(item.id); }}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                style={{ background: "var(--p)" }}>−</button>
              <span className="font-bold text-xs w-4 text-center" style={{ color: "var(--s)" }}>{qty}</span>
              <button onClick={e => { e.stopPropagation(); onClick(); }}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                style={{ background: "var(--p)" }}>+</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main SearchPage ───────────────────────────────────────────────────────────
export default function SearchPage({ cart: externalCart, onCartUpdate, onCheckout }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const MEJA_ID = searchParams.get("table")   ?? "1";
  const CAFE_ID = searchParams.get("cafe_id") ?? "";

  const [query, setQuery]                         = useState("");
  const [isFocused, setIsFocused]                 = useState(false);
  const [activeCategory, setActiveCategory]       = useState("all");
  const [showSuggestions, setShowSuggestions]     = useState(false);
  const [selectedItem, setSelectedItem]           = useState(null);
  const [lihatSemuaSection, setLihatSemuaSection] = useState(null);
  const [showRiwayat, setShowRiwayat]             = useState(false);
  const [internalCart, setInternalCart]           = useState(externalCart || {});

  const cart = externalCart ?? internalCart;
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

  // ── Fetch data dari API — SAMA dengan Home.jsx ──────────────────────────
  // ✅ FIX: guard CAFE_ID agar tidak fetch dengan path kosong (HTTP 403/404)
  const { data: menuRaw,       loading: menuLoading, error: menuError, refetch: refetchMenu } = useApi(
    () => CAFE_ID ? api.get(`api/menu/user/${CAFE_ID}`).then(r => r.data ?? r) : Promise.resolve([]),
    [CAFE_ID]
  );
  const { data: categoriesRaw, loading: catLoading, error: catError, refetch: refetchCat } = useApi(
    () => CAFE_ID ? api.get(`api/kategori/user/${CAFE_ID}`).then(r => r.data ?? r) : Promise.resolve([]),
    [CAFE_ID]
  );
  const { data: cafeRaw } = useApi(
    () => CAFE_ID ? api.get(`api/pengaturan/user/${CAFE_ID}`).then(r => r.data ?? r) : Promise.resolve(null),
    [CAFE_ID]
  );

  const cafeProfile = useMemo(() => ({
    nama: cafeRaw?.nama_cafe ?? cafeRaw?.nama ?? cafeRaw?.name ?? "ASTAKIRA",
  }), [cafeRaw]);

  // ── Tema warna dari database — inject CSS variables ke :root ─────────────
  const theme = useMemo(() => parseTheme(cafeRaw?.tema_colors), [cafeRaw]);
  useEffect(() => {
    applyThemeVars(theme);
    // Simpan ke cache supaya halaman berikutnya bisa langsung pakai tanpa blink
    try { localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(theme)); } catch {}
  }, [theme]);

  // ── Build data ───────────────────────────────────────────────────────────
  const menuDatabase     = useMemo(() => menuRaw ? buildMenuDatabase(menuRaw) : {}, [menuRaw]);
  const normalizedCats   = useMemo(() => (categoriesRaw ?? []).map(normalizeCategory), [categoriesRaw]);
  const categorySections = useMemo(() => buildCategorySections(normalizedCats, menuDatabase), [normalizedCats, menuDatabase]);
  const allMenuItems     = useMemo(() => Object.values(menuDatabase), [menuDatabase]);

  // ── Category filters — "Semua" + kategori dari DB ───────────────────────
  const categoryFilters = useMemo(() => [
    { id: "all", label: "Semua", logo: "" },
    ...normalizedCats,
  ], [normalizedCats]);

  const isLoading = menuLoading || catLoading;
  const hasError  = (menuError || catError) && !isLoading;

  // ── Cart helpers ─────────────────────────────────────────────────────────
  const updateCart = (updater) => {
    const updated = typeof updater === "function" ? updater(cart) : updater;
    if (onCartUpdate) onCartUpdate(updated);
    else setInternalCart(updated);
  };
  const addItem    = (id) => updateCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const removeItem = (id) => updateCart(prev => {
    const u = { ...prev };
    if (u[id] > 1) u[id]--; else delete u[id];
    return u;
  });
  const handleSheetAdd = (id, qty) => updateCart(prev => ({ ...prev, [id]: (prev[id] || 0) + qty }));

  const totalQty   = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = allMenuItems.reduce((sum, item) => sum + (cart[item.id] || 0) * item.price, 0);
  const cartItems  = allMenuItems.filter(m => cart[m.id]);

  // ── Riwayat handlers ─────────────────────────────────────────────────────
  const handleNavigateToPesanan = ({ cart: oc, items: oi, orderId }) =>
    navigate("/pesanan", { state: { cart: oc, items: oi, fromRiwayat: true, orderId } });

  const handleReorder = ({ cart: rc }) => {
    const merged = { ...cart };
    Object.entries(rc).forEach(([id, qty]) => { merged[id] = (merged[id] || 0) + qty; });
    updateCart(merged);
    navigate("/pesanan", { state: { cart: merged, items: allMenuItems.filter(m => merged[m.id]), isReorder: true } });
  };

  // ── Search & filter ──────────────────────────────────────────────────────
  const handleFocus  = () => { setIsFocused(true); setShowSuggestions(true); };
  const handleBlur   = () => { setIsFocused(false); setTimeout(() => setShowSuggestions(false), 150); };
  const clearQuery   = () => { setQuery(""); setActiveCategory("all"); inputRef.current?.focus(); };
  const handleSuggestionClick = (term) => { setQuery(term); setShowSuggestions(false); inputRef.current?.blur(); };

  const filtered = allMenuItems.filter(item => {
    const q = query.toLowerCase();
    const matchQ   = query === "" || item.name.toLowerCase().includes(q) || item.tagline.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    const matchCat = activeCategory === "all" || item.categoryId === String(activeCategory) || item.category === activeCategory;
    return matchQ && matchCat;
  });

  const hasQuery       = query.length > 0;
  const showEmpty      = hasQuery && filtered.length === 0;
  const hotItems       = allMenuItems.filter(i => i.badge === "Best Seller" || i.badge === "Favorit");
  const visibleSections = activeCategory === "all"
    ? categorySections
    : categorySections.filter(s => String(s.id) === String(activeCategory));

  // Trending & recent — bisa dibuat dinamis dari API kalau ada endpoint-nya
  const trendingSearches = useMemo(() =>
    hotItems.slice(0, 3).map(i => i.name), [hotItems]
  );

  return (
    <div className="min-h-screen max-w-md mx-auto" style={{ background: "var(--bg)" }}>

      {/* ── STICKY HEADER ── */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <button className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded-xl transition-all"
            onClick={() => navigate(-1)}>
            <ArrowLeft size={18} className="text-gray-700" />
          </button>

          <div className={`flex-1 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border-2 transition-all duration-200 ${isFocused ? "shadow-lg" : "border-gray-200 bg-gray-50"}`}
            style={isFocused ? { borderColor: "var(--p)", background: "var(--bg-soft)" } : {}}>
            <Search size={17} className="flex-shrink-0 transition-colors" style={isFocused ? { color: "var(--p)" } : { color: "#9ca3af" }} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Cari menu favorit kamu..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className="flex-1 bg-transparent outline-none text-sm font-semibold text-gray-900 placeholder-gray-400"
            />
            {query && (
              <button onClick={clearQuery} className="w-5 h-5 flex-shrink-0 flex items-center justify-center bg-gray-300 hover:bg-gray-400 rounded-full transition-all">
                <X size={12} className="text-white" />
              </button>
            )}
          </div>

          <button onClick={() => setShowRiwayat(true)}
            className="flex-shrink-0 flex items-center gap-1.5 rounded-xl px-3 h-10 shadow-md hover:shadow-lg transition-all relative"
            style={{ background: "var(--grad)" }}>
            <ShoppingBag size={15} style={{ color: "var(--on-p)" }} />
            <span className="text-xs font-bold" style={{ color: "var(--on-p)" }}>Riwayat</span>
          </button>
        </div>

        {/* Suggestions */}
        {showSuggestions && !hasQuery && trendingSearches.length > 0 && (
          <div className="px-4 pb-4 border-t border-gray-100 animate-slideDown">
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-2.5">
                <TrendingUp size={13} className="text-amber-500" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Menu Populer</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingSearches.map((term, i) => (
                  <button key={i} onMouseDown={() => handleSuggestionClick(term)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-white rounded-xl text-xs font-bold transition-all hover:scale-105"
                    style={{ background: "var(--grad)" }}>
                    <Flame size={10} />{term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Category filter dari DB */}
        {!showSuggestions && (
          <div className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-hide px-4">
            {catLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1.5 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-gray-200" />
                    <div className="h-2 w-10 bg-gray-200 rounded" />
                  </div>
                ))
              : categoryFilters.map(cat => {
                  const isActive = activeCategory === String(cat.id);
                  return (
                    <button key={cat.id} onClick={() => setActiveCategory(String(cat.id))}
                      className="flex-shrink-0 flex flex-col items-center gap-1.5">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shadow transition-all duration-200"
                        style={{
                          background:    "var(--grad)",
                          transform:     isActive ? "scale(1.12)" : "scale(1)",
                          boxShadow:     isActive ? `0 6px 16px var(--p-20)` : "0 1px 4px rgba(0,0,0,0.08)",
                          outline:       isActive ? "2px solid var(--p)" : "none",
                          outlineOffset: "2px",
                        }}>
                        {cat.id === "all" ? (
                          <Image size={18} style={{ color: "var(--on-p)" }} />
                        ) : cat.logo ? (
                          <img src={cat.logo} alt={cat.label} className="w-full h-full object-cover"
                            onError={e => { e.currentTarget.style.display = "none"; }} />
                        ) : (
                          <Image size={18} style={{ color: "var(--on-p)", opacity: 0.8 }} />
                        )}
                      </div>
                      <span className="text-[11px] font-semibold whitespace-nowrap"
                        style={{ color: isActive ? "var(--p)" : "#6b7280" }}>
                        {cat.label}
                      </span>
                    </button>
                  );
                })
            }
          </div>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div className="px-4 py-4">
        {hasQuery ? (
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <Search size={14} style={{ color: "var(--p)" }} />
              <p className="text-sm font-bold text-gray-900">Hasil untuk <span style={{ color: "var(--p)" }}>"{query}"</span></p>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 ml-5">{filtered.length} menu ditemukan</p>
          </div>
        ) : (
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">
                {activeCategory === "all" ? "Semua Menu ✨" : `Menu ${categoryFilters.find(c => String(c.id) === String(activeCategory))?.label ?? ""}`}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">{filtered.length} pilihan tersedia</p>
            </div>
            {hotItems.length > 0 && (
              <div className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 border"
                style={{ background: "var(--bg-soft)", borderColor: "var(--p-20)" }}>
                <Zap size={12} style={{ color: "var(--p)" }} />
                <span className="text-[10px] font-extrabold" style={{ color: "var(--p)" }}>{hotItems.length} HOT PICKS</span>
              </div>
            )}
          </div>
        )}

        {/* Error state */}
        {hasError && <ErrorState message={menuError || catError} onRetry={() => { refetchMenu(); refetchCat(); }} />}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex animate-pulse">
                <div className="w-28 h-28 bg-gray-200 flex-shrink-0" />
                <div className="flex-1 p-3 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-8 bg-gray-200 rounded-xl mt-4 w-24 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !hasError && (
          <>
            {/* Empty state */}
            {showEmpty ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: "var(--bg-soft)" }}>
                    <Coffee size={40} style={{ color: "var(--p)", opacity: 0.5 }} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white">
                    <Search size={16} className="text-gray-400" />
                  </div>
                </div>
                <p className="font-extrabold text-gray-900 text-lg mb-1">Menu tidak ditemukan</p>
                <p className="text-sm text-gray-400 mb-6 max-w-xs">Coba kata kunci lain atau pilih dari kategori yang tersedia</p>
                <button onClick={clearQuery}
                  className="px-6 py-3 rounded-2xl font-bold text-sm shadow-lg hover:scale-105 transition-all"
                  style={{ background: "var(--grad)", color: "var(--on-p)" }}>
                  Lihat Semua Menu
                </button>
              </div>
            ) : (
              <div className="space-y-3 pb-36">
                {/* Hot picks & section headers saat Semua */}
                {!hasQuery && activeCategory === "all" && hotItems.length > 0 && (
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "var(--grad)" }}>
                        <Flame size={13} style={{ color: "var(--on-p)" }} />
                      </div>
                      <span className="font-extrabold text-gray-900 text-sm">🔥 Paling Banyak Dipesan</span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                      {hotItems.map(item => (
                        <div key={item.id} onClick={() => setSelectedItem(item)}
                          className="flex-shrink-0 w-36 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
                          <div className="relative h-24 overflow-hidden" style={{ background: "var(--bg-soft)" }}>
                            <MenuImage src={item.image_url} alt={item.name} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            {item.badge && (
                              <div className={`absolute top-1.5 right-1.5 ${badgeBg[item.badge] || "bg-gray-500"} text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full`}>
                                {badgeLabel[item.badge] ?? item.badge}
                              </div>
                            )}
                          </div>
                          <div className="p-2.5">
                            <p className="font-bold text-gray-900 text-xs line-clamp-1">{item.name}</p>
                            <p className="font-extrabold text-xs mt-0.5" style={{ color: "var(--p)" }}>Rp{item.price.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mt-4 mb-4" />

                    {/* Section headers */}
                    {categorySections.map(section => (
                      <div key={section.id} className="flex items-center justify-between mb-3 mt-1">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center shadow-sm flex-shrink-0"
                            style={{ background: "var(--grad)" }}>
                            <CatLogo logo={section.logo} size={20} />
                          </div>
                          <h2 className="text-base font-bold text-gray-900">{section.label}</h2>
                        </div>
                        <button onClick={() => setLihatSemuaSection(section)}
                          className="text-xs font-semibold" style={{ color: "var(--p)" }}>
                          Lihat Semua →
                        </button>
                      </div>
                    ))}

                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mt-2 mb-4" />
                    <p className="font-extrabold text-gray-900 text-sm mb-3">📋 Semua Menu</p>
                  </div>
                )}

                {/* Section header saat filter kategori spesifik */}
                {!hasQuery && activeCategory !== "all" && visibleSections.length > 0 && (
                  <div className="mb-3">
                    {visibleSections.map(section => (
                      <div key={section.id} className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center shadow-sm"
                            style={{ background: "var(--grad)" }}>
                            <CatLogo logo={section.logo} size={20} />
                          </div>
                          <h2 className="text-base font-bold text-gray-900">{section.label}</h2>
                        </div>
                        <button onClick={() => setLihatSemuaSection(section)}
                          className="text-xs font-semibold" style={{ color: "var(--p)" }}>
                          Lihat Semua →
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Main list */}
                {filtered.map((item, i) => (
                  <SearchMenuCard key={item.id} item={item} index={i} cart={cart}
                    onAdd={addItem} onRemove={removeItem} onClick={() => setSelectedItem(item)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── FLOATING CHECKOUT ── */}
      {totalQty > 0 && !selectedItem && (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6">
          <div className="max-w-md mx-auto">
            <button
              onClick={onCheckout || (() => navigate("/pesanan", { state: { cart, items: cartItems } }))}
              className="w-full rounded-3xl p-5 shadow-2xl hover:scale-[1.01] transition-all border"
              style={{ background: "var(--grad)", borderColor: "var(--p-20)" }}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 relative">
                    <ShoppingBag style={{ color: "var(--on-p)" }} size={20} />
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">{totalQty}</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-medium mb-0.5" style={{ color: "var(--on-p)", opacity: 0.8 }}>{totalQty} Item dipilih</p>
                    <p className="text-xl font-bold" style={{ color: "var(--on-p)" }}>Rp{totalPrice.toLocaleString()}</p>
                  </div>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl font-bold shadow-xl whitespace-nowrap"
                  style={{ color: "var(--p)" }}>Checkout →</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {showRiwayat && (
        <RiwayatPesananSheet menuDatabase={menuDatabase} mejaId={MEJA_ID} cafeId={CAFE_ID}
          cafeName={cafeProfile.nama}
          onClose={() => setShowRiwayat(false)}
          onNavigateToPesanan={handleNavigateToPesanan}
          onReorder={handleReorder} />
      )}
      {lihatSemuaSection && (
        <LihatSemuaPopup section={lihatSemuaSection} cart={cart} menuDatabase={menuDatabase}
          onAdd={addItem} onRemove={removeItem} onItemClick={setSelectedItem}
          onClose={() => setLihatSemuaSection(null)} />
      )}
      {selectedItem && (
        <MenuDetailSheet item={selectedItem} menuDatabase={menuDatabase}
          onClose={() => setSelectedItem(null)}
          onAddToCart={handleSheetAdd}
          onOpenItem={item => setSelectedItem(item)} />
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-slideDown { animation: slideDown 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}