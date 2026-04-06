import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Search, Menu, ChevronRight, ChevronDown, ShoppingBag, X,
  Star, Clock, MapPin, ArrowLeft, Heart, Share2, Plus, Minus,
  Flame, Leaf, Check, Image, RefreshCw, AlertCircle
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

/* ─────────────────────────────────────────────
   Theme + API helpers
   ──────────────────────────────────────────── */
const BASE_URL = (import.meta.env.VITE_API_URL ?? "https://www.mycafe-order.net/").replace(/\/$/, "");
const TOKEN_KEY = "astakira_token";
const tokenManager = { get: () => localStorage.getItem(TOKEN_KEY) ?? import.meta.env.VITE_API_TOKEN ?? "" };

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
    `--p:${theme.primary}`, `--s:${theme.secondary}`, `--bg:${theme.bg}`, `--tx:${theme.text}`,
    `--on-p:${onP}`, `--p-20:${ha(theme.primary, 0.2)}`,
    `--bg-soft:${ha(theme.primary, 0.07)}`,
    `--grad:linear-gradient(135deg,${theme.primary},${theme.secondary})`,
  ].join(";");
  document.documentElement.setAttribute("style", vars);
}

// Inject dari cache sebelum render
try {
  const cached = localStorage.getItem(THEME_CACHE_KEY);
  if (cached) applyThemeVars(JSON.parse(cached));
} catch {}

const api = {
  get: async (path) => {
    const token = tokenManager.get();
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}/${path}`, { headers });
    if (res.status === 401) { localStorage.removeItem(TOKEN_KEY); throw new Error("Sesi habis."); }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
};

function useApi(fetchFn, deps = []) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
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

/* ─────────────────────────────────────────────
   Normalisasi data
   ──────────────────────────────────────────── */
function normalizeMenuItem(item) {
  return {
    id:          item.id,
    name:        item.name        ?? item.nama_menu  ?? item.nama   ?? "",
    price:       Number(item.price ?? item.harga      ?? 0),
    originalPrice: item.originalPrice ?? item.harga_asli ?? null,
    image_url:   fixImgUrl(item.image_url ?? item.image ?? item.foto ?? item.gambar ?? ""),
    category:    item.category    ?? item.nama_kategori ?? item.kategori ?? "",
    categoryId:  String(item.category_id ?? item.kategori_id ?? item.id_kategori ?? ""),
    badge:       item.badge       ?? item.label       ?? null,
    discount:    item.discount    ?? item.diskon      ?? null,
    tagline:     item.tagline     ?? item.deskripsi_singkat ?? item.subtitle ?? "",
    description: item.description ?? item.deskripsi   ?? "",
    prepTime:    item.prepTime    ?? item.waktu_masak  ?? item.estimasi ?? "",
    calories:    item.calories    ?? item.kalori       ?? 0,
    isVegan:     item.isVegan     ?? item.vegan        ?? false,
    volume:      item.volume      ?? item.ukuran       ?? "",
    ingredients: item.ingredients ?? item.bahan        ?? [],
    variants: (item.variants ?? item.varian ?? []).map(v => ({
      label: v.label ?? v.nama ?? v.ukuran ?? "",
      price: Number(v.price ?? v.harga ?? 0),
      image: fixImgUrl(v.image ?? v.foto ?? item.image_url ?? item.image ?? ""),
    })),
    related: item.related ?? item.related_menu ?? [],
    rating: item.rating ?? 4.5,
    _raw: item,
  };
}

function normalizeCategory(cat) {
  return {
    id:    cat.id,
    label: cat.nama_kategori ?? cat.label ?? cat.nama ?? cat.name ?? String(cat.id),
    logo:  fixImgUrl(cat.logo ?? cat.icon ?? cat.foto ?? cat.gambar ?? ""),
    icon:  cat.emoji ?? cat.icon_text ?? "🍽️",
  };
}

/* ─────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────── */
function MenuImage({ src, alt, className = "w-full h-full object-cover" }) {
  const [err, setErr] = useState(false);
  if (!src || err) return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--bg-soft)" }}>
      <Image size={24} style={{ color: "var(--p)", opacity: 0.35 }} />
    </div>
  );
  return <img src={src} alt={alt} className={className} onError={() => setErr(true)} />;
}

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

function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-64 bg-white rounded-3xl overflow-hidden shadow-lg border-2 border-transparent animate-pulse">
      <div className="h-40 bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-5 bg-gray-200 rounded w-1/3 mt-2" />
        <div className="h-9 bg-gray-200 rounded-xl mt-3" />
      </div>
    </div>
  );
}

/* ── Menu Detail Sheet ── */
function MenuDetailSheet({ item, menuDatabase, onClose, onAddToCart }) {
  const [qty, setQty]                         = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [isWishlisted, setIsWishlisted]       = useState(false);
  const [addedToCart, setAddedToCart]         = useState(false);

  const hasVariants  = item.variants?.length > 0;
  const currentPrice = hasVariants ? (item.variants[selectedVariant]?.price ?? item.price) : item.price;
  const totalPrice   = currentPrice * qty;
  const heroImage    = hasVariants ? (item.variants[selectedVariant]?.image || item.image_url) : item.image_url;
  const relatedItems = Object.values(menuDatabase).filter(m => item.related?.includes(m.id));

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
          <div className="relative h-72" style={{ background: "var(--bg-soft)" }}>
            <MenuImage src={heroImage} alt={item.name} className="w-full h-full object-cover transition-all duration-500" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30" />
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
              <button onClick={onClose}
                className="w-11 h-11 flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl shadow-xl">
                <ArrowLeft size={20} className="text-white" />
              </button>
              <div className="flex gap-3">
                <button onClick={() => setIsWishlisted(!isWishlisted)}
                  className="w-11 h-11 flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl shadow-xl">
                  <Heart size={18} className={isWishlisted ? "fill-red-400 text-red-400" : "text-white"} />
                </button>
                <button className="w-11 h-11 flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl shadow-xl">
                  <Share2 size={18} className="text-white" />
                </button>
              </div>
            </div>
            {item.badge && (
              <div className="absolute top-20 left-4 z-10">
                <span className={`text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg ${
                  item.badge === "Promo" ? "bg-gradient-to-r from-red-500 to-pink-500" : "bg-gradient-to-r from-purple-500 to-pink-500"
                }`}>
                  {item.badge === "Promo" && item.discount ? `-${item.discount}` : item.badge}
                </span>
              </div>
            )}
            {/* Variant thumbnails */}
            {hasVariants && item.variants.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                {item.variants.map((v, i) => (
                  <button key={i} onClick={() => setSelectedVariant(i)}
                    className={`relative w-14 h-14 rounded-2xl overflow-hidden transition-all duration-200 ${selectedVariant === i ? "scale-110 shadow-xl" : "opacity-65"}`}
                    style={selectedVariant === i ? { outline: "2px solid var(--p)", outlineOffset: "2px" } : {}}>
                    <MenuImage src={v.image} alt={v.label} />
                    <div className="absolute inset-x-0 bottom-0 text-center text-[8px] font-bold leading-tight py-0.5"
                      style={selectedVariant === i
                        ? { background: "var(--p)", color: "var(--on-p)" }
                        : { background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.8)" }}>
                      {v.label?.split(" ")[0]}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="px-5 pt-5">
            {item.category && <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--p)" }}>{item.category}</p>}
            <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">{item.name}</h1>
            {item.tagline && <p className="text-sm text-gray-400 mt-1 italic mb-4">{item.tagline}</p>}

            {/* Pills */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {item.prepTime && (
                <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-xl px-3 py-1.5">
                  <Clock size={13} className="text-orange-500" />
                  <span className="text-xs font-semibold text-orange-700">{item.prepTime}</span>
                </div>
              )}
              {item.calories > 0 && (
                <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl px-3 py-1.5">
                  <Flame size={13} className="text-red-500" />
                  <span className="text-xs font-semibold text-red-700">{item.calories} kal</span>
                </div>
              )}
              {item.isVegan && (
                <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-xl px-3 py-1.5">
                  <Leaf size={13} className="text-green-500" />
                  <span className="text-xs font-semibold text-green-700">Vegan</span>
                </div>
              )}
              {item.volume && (
                <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5">
                  <span className="text-xs font-semibold text-blue-700">🥤 {item.volume}</span>
                </div>
              )}
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-5" />

            {item.description && <p className="text-sm text-gray-600 leading-relaxed mb-5">{item.description}</p>}

            {item.ingredients?.length > 0 && (
              <div className="mb-6">
                <h2 className="text-base font-bold text-gray-900 mb-2">Bahan</h2>
                <div className="flex flex-wrap gap-2">
                  {item.ingredients.map((ing, i) => (
                    <span key={i} className="text-xs px-3 py-1 rounded-full border font-semibold"
                      style={{ background: "var(--bg-soft)", borderColor: "var(--p-20)", color: "var(--p)" }}>
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Variants */}
            {hasVariants && item.variants.length > 1 && (
              <div className="mb-6">
                <h2 className="text-base font-bold text-gray-900 mb-3">Pilih Varian</h2>
                <div className="flex gap-3">
                  {item.variants.map((v, i) => (
                    <button key={i} onClick={() => setSelectedVariant(i)}
                      className={`flex-1 py-3 rounded-2xl font-bold text-sm border-2 transition-all ${
                        selectedVariant === i ? "shadow-lg scale-105" : "bg-white border-gray-200"
                      }`}
                      style={selectedVariant === i ? { background: "var(--grad)", color: "var(--on-p)", borderColor: "var(--p)" } : {}}>
                      <div>{v.label}</div>
                      <div className="text-xs mt-0.5" style={selectedVariant === i ? { color: "var(--on-p)", opacity: 0.8 } : { color: "var(--p)" }}>
                        Rp{v.price.toLocaleString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Related */}
            {relatedItems.length > 0 && (
              <>
                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-5" />
                <div className="mb-6">
                  <h2 className="text-base font-bold text-gray-900 mb-4">Menu Lainnya</h2>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {relatedItems.map(rel => (
                      <div key={rel.id}
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

        {/* Fixed bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Total Harga</p>
              <p className="text-2xl font-extrabold text-gray-900">Rp{totalPrice.toLocaleString()}</p>
              {item.originalPrice && <p className="text-xs text-gray-400 line-through">Rp{Number(item.originalPrice).toLocaleString()}</p>}
            </div>
            <div className="flex items-center gap-3 rounded-2xl px-3 py-2 border-2"
              style={{ background: "var(--bg-soft)", borderColor: "var(--p-20)" }}>
              <button onClick={() => setQty(q => Math.max(1, q-1))}
                className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-sm">
                <Minus size={16} style={{ color: "var(--p)" }} />
              </button>
              <span className="font-extrabold text-gray-900 text-lg w-6 text-center">{qty}</span>
              <button onClick={() => setQty(q => q+1)}
                className="w-8 h-8 flex items-center justify-center rounded-xl shadow-sm"
                style={{ background: "var(--grad)" }}>
                <Plus size={16} style={{ color: "var(--on-p)" }} />
              </button>
            </div>
          </div>
          <button onClick={handleAdd}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:scale-[1.02]"
            style={addedToCart
              ? { background: "#22c55e", color: "#fff" }
              : { background: "var(--grad)", color: "var(--on-p)" }}>
            {addedToCart ? <><Check size={20} /> Ditambahkan!</> : <><ShoppingBag size={20} /> Tambah ke Pesanan</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Home Component
   ──────────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const MEJA_ID = searchParams.get("table")   ?? "1";
  const CAFE_ID = searchParams.get("cafe_id") ?? "";

  const [activeTab, setActiveTab]             = useState("all");
  const [selectedDropdown, setSelectedDropdown] = useState("Semua Kategori");
  const [openCategory, setOpenCategory]       = useState(false);
  const [scrolled, setScrolled]               = useState(false);
  const [selectedItem, setSelectedItem]       = useState(null);
  const [cart, setCart]                       = useState({});

  /* ── Fetch data ── */
  const { data: menuRaw,       loading: menuLoading, error: menuError, refetch: refetchMenu } = useApi(
    () => CAFE_ID ? api.get(`api/menu/user/${CAFE_ID}`).then(r => r.data ?? r) : Promise.resolve([]),
    [CAFE_ID]
  );
  const { data: categoriesRaw, loading: catLoading,  error: catError,  refetch: refetchCat } = useApi(
    () => CAFE_ID ? api.get(`api/kategori/user/${CAFE_ID}`).then(r => r.data ?? r) : Promise.resolve([]),
    [CAFE_ID]
  );
  const { data: cafeRaw } = useApi(
    () => CAFE_ID ? api.get(`api/pengaturan/user/${CAFE_ID}`).then(r => r.data ?? r) : Promise.resolve(null),
    [CAFE_ID]
  );

  /* ── Apply tema ── */
  useEffect(() => {
    if (!cafeRaw) return;
    const theme = parseTheme(cafeRaw?.tema_colors);
    applyThemeVars(theme);
    try { localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(theme)); } catch {}
    return () => document.documentElement.removeAttribute("style");
  }, [cafeRaw]);

  const cafeProfile = useMemo(() => ({
    nama:   cafeRaw?.nama_cafe  ?? cafeRaw?.nama    ?? cafeRaw?.name   ?? "ASTAKIRA",
    alamat: cafeRaw?.alamat     ?? cafeRaw?.address ?? cafeRaw?.lokasi ?? "Ciakar · Tasikmalaya",
    logo:   fixImgUrl(cafeRaw?.logo_cafe ?? cafeRaw?.logo ?? cafeRaw?.foto ?? ""),
    jam:    cafeRaw?.jam_buka   ?? "08:00 - 17:00",
  }), [cafeRaw]);

  /* ── Normalisasi ── */
  const menuDatabase = useMemo(() => {
    const arr = menuRaw ?? [];
    return Object.fromEntries(arr.map(i => { const n = normalizeMenuItem(i); return [n.id, n]; }));
  }, [menuRaw]);

  const categories = useMemo(() => {
    const cats = (categoriesRaw ?? []).map(normalizeCategory);
    return [{ id: "all", label: "Semua Kategori", icon: "🍽️", logo: "" }, ...cats];
  }, [categoriesRaw]);

  const allItems = Object.values(menuDatabase);

  const filteredItems = useMemo(() => {
    if (activeTab === "all") return allItems;
    return allItems.filter(i => String(i.categoryId) === String(activeTab));
  }, [allItems, activeTab]);

  const promoItems = useMemo(() => allItems.filter(i => i.badge === "Promo" || i.discount), [allItems]);
  const featuredItems = useMemo(() => allItems.filter(i => i.badge === "Best Seller" || i.badge === "Favorit").slice(0, 6), [allItems]);
  const displayFeatured = featuredItems.length > 0 ? featuredItems : allItems.slice(0, 6);

  /* ── Cart ── */
  const addItem    = (id) => setCart(prev => ({ ...prev, [id]: (prev[id]||0)+1 }));
  const removeItem = (id) => setCart(prev => { const u={...prev}; if(u[id]>1) u[id]--; else delete u[id]; return u; });
  const handleSheetAdd = (id, qty) => setCart(prev => ({ ...prev, [id]: (prev[id]||0)+qty }));

  const totalQty   = Object.values(cart).reduce((a,b)=>a+b, 0);
  const totalPrice = allItems.reduce((s,i) => s + (cart[i.id]||0)*i.price, 0);
  const cartItems  = allItems.filter(i => (cart[i.id]||0) > 0);

  /* ── Scroll detection ── */
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 100, behavior: "smooth" });
  };

  const isLoading = menuLoading || catLoading;
  const hasError  = (menuError || catError) && !isLoading;

  return (
    <div className="relative min-h-screen" style={{ background: "var(--bg)", color: "var(--tx)" }}>

      {/* ── Floating Header on scroll ── */}
      {scrolled && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl shadow-lg animate-slideDown">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden"
                style={{ background: "var(--grad)" }}>
                {cafeProfile.logo
                  ? <img src={cafeProfile.logo} alt={cafeProfile.nama} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display="none"; }} />
                  : <span className="font-bold text-lg" style={{ color: "var(--on-p)" }}>{cafeProfile.nama.charAt(0)}</span>
                }
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900">{cafeProfile.nama}</p>
                <p className="text-xs text-gray-500">Meja #{MEJA_ID}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigate(`/search?table=${MEJA_ID}&cafe_id=${CAFE_ID}`)}
                className="w-9 h-9 flex items-center justify-center rounded-lg transition-all"
                style={{ background: "var(--bg-soft)" }}>
                <Search size={16} style={{ color: "var(--p)" }} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto">

        {/* ── Hero ── */}
        <div className="relative overflow-hidden">
          <div className="relative h-72">
            <img src="https://images.unsplash.com/photo-1765894711260-9d881459ddb4?w=800&auto=format" alt="Hero" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
            <div className="absolute top-6 right-6 flex gap-3 z-10">
              <button onClick={() => navigate(`/search?table=${MEJA_ID}&cafe_id=${CAFE_ID}`)}
                className="w-11 h-11 flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl shadow-xl hover:bg-white/30 transition-all">
                <Search size={18} className="text-white" />
              </button>
            </div>
          </div>

          {/* Info Cards */}
          <div className="relative -mt-32 mx-4 mb-6 z-20 space-y-3">
            {/* Outlet Card */}
            <div className="bg-white rounded-3xl p-5 shadow-2xl border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden"
                    style={{ background: "var(--grad)" }}>
                    {cafeProfile.logo
                      ? <img src={cafeProfile.logo} alt={cafeProfile.nama} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display="none"; }} />
                      : <MapPin size={24} style={{ color: "var(--on-p)" }} />
                    }
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-medium mb-1">Outlet</p>
                    <p className="text-gray-900 text-lg font-bold">{cafeProfile.nama}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{cafeProfile.alamat}</p>
                    <div className="flex items-center gap-1.5 text-green-600 text-xs font-semibold mt-1.5">
                      <Clock size={12} />
                      <span>{cafeProfile.jam}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="text-gray-300" size={24} />
              </div>
            </div>

            {/* Meja card */}
            <div className="rounded-2xl p-4 shadow-xl border"
              style={{ background: "var(--grad)", borderColor: "var(--p-20)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center border"
                    style={{ background: "rgba(255,255,255,0.2)", borderColor: "rgba(255,255,255,0.3)" }}>
                    <span className="text-xl font-bold" style={{ color: "var(--on-p)" }}>{MEJA_ID}</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "var(--on-p)", opacity: 0.8 }}>Nomor Meja</p>
                    <p className="text-base font-bold" style={{ color: "var(--on-p)" }}>Meja Nomor {MEJA_ID}</p>
                  </div>
                </div>
                <ChevronRight size={20} style={{ color: "var(--on-p)", opacity: 0.6 }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Category Pills ── */}
        <div className="sticky top-0 z-30 pb-3 pt-2 -mx-0" style={{ background: "var(--bg)" }}>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-4">
            {/* Filter dropdown */}
            <button onClick={() => setOpenCategory(true)}
              className="flex items-center gap-2 bg-white border-2 border-gray-200 rounded-2xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap hover:opacity-80 transition-all shadow-sm flex-shrink-0">
              {selectedDropdown}
              <ChevronDown size={16} className="text-gray-600" />
            </button>

            {/* Category tabs */}
            {catLoading
              ? Array.from({ length: 4 }).map((_,i) => (
                  <div key={i} className="flex-shrink-0 w-24 h-10 bg-gray-200 rounded-2xl animate-pulse" />
                ))
              : categories.map(cat => (
                  <button key={cat.id}
                    onClick={() => { setActiveTab(String(cat.id)); scrollToSection("menu-section"); }}
                    className="rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap shadow-sm flex-shrink-0 flex items-center gap-1.5"
                    style={activeTab === String(cat.id)
                      ? { background: "var(--grad)", color: "var(--on-p)", boxShadow: "0 4px 16px var(--p-20)" }
                      : { background: "white", color: "#374151", border: "2px solid #e5e7eb" }}>
                    {cat.logo
                      ? <img src={cat.logo} alt="" className="w-4 h-4 rounded object-cover" onError={e => e.currentTarget.style.display="none"} />
                      : <span>{cat.icon}</span>
                    }
                    {cat.label}
                  </button>
                ))
            }
          </div>
        </div>

        <div className="px-4 pb-32">

          {hasError && <ErrorState message={menuError || catError} onRetry={() => { refetchMenu(); refetchCat(); }} />}

          {/* ── Promo Section ── */}
          {!hasError && promoItems.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Promo Spesial</h2>
                  <p className="text-sm text-gray-500">Jangan sampai terlewat!</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: "var(--grad)" }}>
                  <span className="text-xl">🎁</span>
                </div>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
                {isLoading
                  ? [1,2].map(i => <SkeletonCard key={i} />)
                  : promoItems.map((item, index) => {
                      const qty = cart[item.id] || 0;
                      return (
                        <div key={item.id}
                          className="group flex-shrink-0 w-64 bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-2 border-transparent cursor-pointer"
                          style={{ animationDelay: `${index * 100}ms`, ["--hover-border"]: "var(--p)" }}
                          onClick={() => setSelectedItem(item)}>
                          <div className="relative h-40 overflow-hidden" style={{ background: "var(--bg-soft)" }}>
                            <MenuImage src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                              {item.discount ? `-${item.discount}` : "Promo"}
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{item.name}</h3>
                            <p className="text-xs text-gray-500 mb-2 line-clamp-1">{item.tagline || item.category}</p>
                            <div className="flex items-baseline gap-2 mb-3">
                              <p className="text-lg font-bold" style={{ color: "var(--p)" }}>Rp{item.price.toLocaleString()}</p>
                              {item.originalPrice && <p className="text-xs text-gray-400 line-through">Rp{Number(item.originalPrice).toLocaleString()}</p>}
                            </div>
                            {qty === 0 ? (
                              <button onClick={e => { e.stopPropagation(); addItem(item.id); }}
                                className="w-full rounded-xl py-2.5 font-bold hover:shadow-lg hover:scale-105 transition-all"
                                style={{ background: "var(--grad)", color: "var(--on-p)" }}>
                                + Tambah
                              </button>
                            ) : (
                              <div className="flex items-center justify-between rounded-xl px-3 py-2 shadow-lg"
                                style={{ background: "var(--grad)" }} onClick={e => e.stopPropagation()}>
                                <button onClick={() => removeItem(item.id)} className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold" style={{ color: "var(--on-p)" }}>−</button>
                                <span className="font-bold" style={{ color: "var(--on-p)" }}>{qty}</span>
                                <button onClick={() => addItem(item.id)} className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold" style={{ color: "var(--on-p)" }}>+</button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                }
              </div>
            </section>
          )}

          {/* ── Featured / Recommendation Section ── */}
          {!hasError && (
            <section className="mb-12" id="menu-section">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Menu Favorit</h2>
                  <p className="text-sm text-gray-500">Pilihan terbaik pelanggan</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: "var(--grad)" }}>
                  <Star className="fill-white" size={20} style={{ color: "var(--on-p)" }} />
                </div>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
                {isLoading
                  ? [1,2,3].map(i => <SkeletonCard key={i} />)
                  : (activeTab === "all" ? displayFeatured : filteredItems).map((item, index) => {
                      const qty = cart[item.id] || 0;
                      return (
                        <div key={item.id}
                          className="group flex-shrink-0 w-64 bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
                          style={{ animationDelay: `${index * 100}ms` }}
                          onClick={() => setSelectedItem(item)}>
                          <div className="relative h-40 overflow-hidden" style={{ background: "var(--bg-soft)" }}>
                            <MenuImage src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            {item.badge && item.badge !== "Promo" && (
                              <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                {item.badge}
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{item.name}</h3>
                            <p className="text-xs text-gray-500 mb-3 line-clamp-1">{item.tagline || item.category}</p>
                            <p className="text-lg font-bold mb-3" style={{ color: "var(--p)" }}>Rp{item.price.toLocaleString()}</p>
                            {qty === 0 ? (
                              <button onClick={e => { e.stopPropagation(); addItem(item.id); }}
                                className="w-full rounded-xl py-2.5 font-bold hover:shadow-lg hover:scale-105 transition-all"
                                style={{ background: "var(--grad)", color: "var(--on-p)" }}>
                                + Tambah
                              </button>
                            ) : (
                              <div className="flex items-center justify-between rounded-xl px-3 py-2 shadow-lg"
                                style={{ background: "var(--grad)" }} onClick={e => e.stopPropagation()}>
                                <button onClick={() => removeItem(item.id)} className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold" style={{ color: "var(--on-p)" }}>−</button>
                                <span className="font-bold" style={{ color: "var(--on-p)" }}>{qty}</span>
                                <button onClick={() => addItem(item.id)} className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold" style={{ color: "var(--on-p)" }}>+</button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                }
              </div>
            </section>
          )}

          {/* Empty state */}
          {!isLoading && !hasError && filteredItems.length === 0 && activeTab !== "all" && (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🍽️</div>
              <p className="text-gray-500 font-semibold">Tidak ada menu di kategori ini</p>
            </div>
          )}
        </div>

        {/* ── Floating Checkout ── */}
        {totalQty > 0 && !selectedItem && (
          <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6">
            <div className="max-w-md mx-auto">
              <button onClick={() => navigate("/pesanan", { state: { cart, items: cartItems, cafeId: CAFE_ID, mejaId: MEJA_ID } })}
                className="w-full rounded-3xl p-5 shadow-2xl hover:scale-[1.01] transition-all border"
                style={{ background: "var(--grad)", borderColor: "var(--p-20)" }}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center border relative"
                      style={{ background: "rgba(255,255,255,0.2)", borderColor: "rgba(255,255,255,0.3)" }}>
                      <ShoppingBag style={{ color: "var(--on-p)" }} size={20} />
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">{totalQty}</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-medium" style={{ color: "var(--on-p)", opacity: 0.8 }}>{totalQty} Item dipilih</p>
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

        {/* ── Category Bottom Sheet ── */}
        {openCategory && (
          <div className="fixed inset-0 flex items-end z-50 animate-fadeIn"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => setOpenCategory(false)}>
            <div className="bg-white w-full max-w-md mx-auto rounded-t-[2rem] p-6 animate-slideUp shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-2xl text-gray-900">Pilih Kategori</h2>
                <button onClick={() => setOpenCategory(false)} className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
              <div className="space-y-3 pb-4">
                {catLoading
                  ? [1,2,3].map(i => <div key={i} className="h-14 bg-gray-200 rounded-2xl animate-pulse" />)
                  : categories.map(cat => (
                      <button key={cat.id}
                        onClick={() => { setSelectedDropdown(cat.label); setActiveTab(String(cat.id)); setOpenCategory(false); }}
                        className="w-full py-4 px-6 rounded-2xl font-bold hover:shadow-xl transition-all flex items-center justify-between text-white"
                        style={{ background: "var(--grad)" }}>
                        <span className="flex items-center gap-3">
                          {cat.logo
                            ? <img src={cat.logo} alt="" className="w-7 h-7 rounded-lg object-cover" />
                            : <span className="text-2xl">{cat.icon}</span>
                          }
                          <span>{cat.label}</span>
                        </span>
                        <ChevronRight size={20} />
                      </button>
                    ))
                }
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Menu Detail Sheet ── */}
      {selectedItem && (
        <MenuDetailSheet
          item={selectedItem}
          menuDatabase={menuDatabase}
          onClose={() => setSelectedItem(null)}
          onAddToCart={handleSheetAdd}
        />
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slideUp   { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn    { from { opacity: 0; } to { opacity: 1; } }
        .animate-slideUp   { animation: slideUp   0.4s cubic-bezier(0.16,1,0.3,1); }
        .animate-slideDown { animation: slideDown 0.3s cubic-bezier(0.16,1,0.3,1); }
        .animate-fadeIn    { animation: fadeIn    0.3s ease-out; }
        .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}