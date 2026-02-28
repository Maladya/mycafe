import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search, ShoppingBag, ArrowLeft, Heart, Share2, Plus, Minus,
  Clock, MapPin, Flame, Leaf, Check, ExternalLink, RotateCcw,
  AlertCircle, RefreshCw
} from "lucide-react";

// ── API CONFIG ────────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://192.168.1.2:3000/";

const TOKEN_KEY = "astakira_token";
const tokenManager = {
  get:   ()      => localStorage.getItem(TOKEN_KEY) ?? import.meta.env.VITE_API_TOKEN ?? "",
  set:   (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: ()      => localStorage.removeItem(TOKEN_KEY),
};

const api = {
  get: async (path) => {
    const token = tokenManager.get();
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}${path}`, { headers });
    if (res.status === 401) { tokenManager.clear(); throw new Error("Sesi habis. Muat ulang halaman untuk login kembali."); }
    if (res.status === 403) { throw new Error("Akses ditolak (403). Token tidak valid atau tidak memiliki izin."); }
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
  },
};

// ── CUSTOM HOOK: useApi ───────────────────────────────────────────────────────
function useApi(fetchFn, deps = []) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { execute(); }, [execute]);
  return { data, loading, error, refetch: execute };
}

// ── HELPER: normalize satu kategori dari API ──────────────────────────────────
// Prioritas: nama_kategori → label → nama → name → id
function normalizeCategory(cat) {
  return {
    id:    cat.id,
    label: cat.nama_kategori ?? cat.label ?? cat.nama ?? cat.name ?? String(cat.id),
    logo:  cat.logo ?? cat.icon ?? cat.foto ?? cat.gambar ?? "",
    items: Array.isArray(cat.items) ? cat.items : [],
  };
}

// ── HELPER: normalize satu item menu dari API ─────────────────────────────────
function normalizeMenuItem(item) {
  // Ambil semua kemungkinan field category_id dari backend
  const rawCatId = item.category_id ?? item.kategori_id ?? item.id_kategori ?? item.cat_id ?? null;
  return {
    id:            item.id,
    name:          item.name          ?? item.nama_menu  ?? item.nama   ?? "",
    price:         Number(item.price  ?? item.harga      ?? 0),
    originalPrice: item.originalPrice ?? item.harga_asli ?? item.harga_coret ?? null,
    image_url:         item.image_url     ?? item.image      ?? item.foto   ?? item.gambar ?? "",
    category:      item.category      ?? item.nama_kategori ?? item.kategori ?? "",
    // Simpan categoryId sebagai string untuk perbandingan
    categoryId:    rawCatId !== null ? String(rawCatId) : "",
    // Simpan juga raw object kategori kalau backend return relasi
    _raw:          item,
    badge:         item.badge         ?? item.label       ?? null,
    discount:      item.discount      ?? item.diskon      ?? null,
    tagline:       item.tagline       ?? item.deskripsi_singkat ?? item.subtitle ?? "",
    description:   item.description   ?? item.deskripsi   ?? "",
    prepTime:      item.prepTime      ?? item.waktu_masak ?? item.estimasi ?? "",
    calories:      item.calories      ?? item.kalori      ?? 0,
    isVegan:       item.isVegan       ?? item.vegan       ?? false,
    volume:        item.volume        ?? item.ukuran      ?? "",
    ingredients:   item.ingredients   ?? item.bahan       ?? [],
    variants:      (item.variants     ?? item.varian      ?? []).map(v => ({
      label: v.label ?? v.nama ?? v.ukuran ?? "",
      price: Number(v.price ?? v.harga ?? 0),
      image: v.image ?? v.foto ?? item.image ?? item.foto ?? "",
    })),
    related: item.related ?? item.related_menu ?? [],
  };
}

// ── HELPER: build menuDatabase ────────────────────────────────────────────────
function buildMenuDatabase(menuArray = []) {
  return Object.fromEntries(menuArray.map(item => {
    const n = normalizeMenuItem(item);
    return [n.id, n];
  }));
}

// ── HELPER: group menu ke dalam setiap kategori ───────────────────────────────
function buildCategorySections(normalizedCats, menuDatabase) {
  const allItems = Object.values(menuDatabase);

  // Log ke console untuk debug (bisa dihapus setelah fix)
  if (allItems.length > 0 && normalizedCats.length > 0) {
    const raw = allItems[0]?._raw;
    console.log("[DEBUG] Semua field menu item:", JSON.stringify(raw, null, 2));
    console.log("[DEBUG] Cat ids:", normalizedCats.map(c => c.id));
  }

  return normalizedCats.map(cat => {
    if (cat.items.length > 0) return cat;

    const catIdStr = String(cat.id);
    const matchedIds = allItems
      .filter(item => {
        // Coba semua kemungkinan field
        const raw = item._raw;
        return (
          item.categoryId === catIdStr ||
          String(raw?.category_id)  === catIdStr ||
          String(raw?.kategori_id)  === catIdStr ||
          String(raw?.id_kategori)  === catIdStr ||
          String(raw?.cat_id)       === catIdStr
        );
      })
      .map(item => item.id);

    return { ...cat, items: matchedIds };
  }).filter(cat => cat.items.length > 0);
}

// ── HELPER: cart dari order ───────────────────────────────────────────────────
function buildCartFromOrder(orderItems, menuDatabase) {
  const newCart = {};
  const allItems = Object.values(menuDatabase);
  orderItems.forEach(orderItem => {
    const nama = (orderItem.name ?? orderItem.nama ?? "").toLowerCase();
    const found = allItems.find(m => m.name.toLowerCase() === nama);
    if (found) newCart[found.id] = (newCart[found.id] || 0) + (orderItem.qty ?? orderItem.jumlah ?? 1);
  });
  return newCart;
}

// ── HELPER: deteksi URL gambar ────────────────────────────────────────────────
const isImgUrl = (s) => !!s && (s.startsWith("http") || s.startsWith("/") || s.startsWith("data:"));

// ── KOMPONEN: Logo Kategori ───────────────────────────────────────────────────
function CatLogo({ logo, size = 28 }) {
  if (!logo) return <span style={{ fontSize: size - 4 }}>🍽️</span>;
  if (isImgUrl(logo)) return (
    <img src={logo} alt="" style={{ width: size, height: size }}
      className="object-cover w-full h-full"
      onError={e => { e.currentTarget.style.display = "none"; }} />
  );
  return <span style={{ fontSize: size - 4 }} className="leading-none">{logo}</span>;
}

// ── KOMPONEN: Skeleton ────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-44 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
      <div className="h-32 bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-6 bg-gray-200 rounded-xl mt-2" />
      </div>
    </div>
  );
}
function SkeletonSection() {
  return (
    <div className="mb-8">
      <div className="px-4 flex items-center gap-2 mb-3 animate-pulse">
        <div className="w-8 h-8 bg-gray-200 rounded-xl" />
        <div className="h-4 bg-gray-200 rounded w-24" />
      </div>
      <div className="flex gap-3 overflow-hidden px-4">
        {[1,2,3].map(i => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}

// ── KOMPONEN: Error State ─────────────────────────────────────────────────────
function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <AlertCircle size={48} className="text-red-400 mb-3" />
      <p className="font-bold text-gray-700 mb-1">Gagal memuat data</p>
      <p className="text-gray-400 text-sm mb-4">{message}</p>
      <button onClick={onRetry} className="flex items-center gap-2 bg-amber-500 text-white px-5 py-2.5 rounded-2xl font-bold hover:bg-amber-600 transition-all">
        <RefreshCw size={15} /> Coba Lagi
      </button>
    </div>
  );
}

// ── MenuDetail Bottom Sheet ───────────────────────────────────────────────────
function MenuDetailSheet({ item, menuDatabase, onClose, onAddToCart, onOpenItem }) {
  const [qty, setQty]                         = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [isWishlisted, setIsWishlisted]       = useState(false);
  const [addedToCart, setAddedToCart]         = useState(false);

  const hasVariants  = item.variants?.length > 0;
  const currentPrice = hasVariants ? (item.variants[selectedVariant]?.price ?? item.price) : item.price;
  const totalPrice   = currentPrice * qty;
  const relatedItems = Object.values(menuDatabase).filter(m => item.related?.includes(m.id));
  const heroImage    = hasVariants ? (item.variants[selectedVariant]?.image_url || item.image_url) : item.image_url;

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
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div className="relative bg-white w-full max-w-md mx-auto rounded-t-[2rem] animate-slideUp overflow-hidden"
        style={{ maxHeight: "92vh" }} onClick={e => e.stopPropagation()}
      >
        <div className="overflow-y-auto scrollbar-hide" style={{ maxHeight: "92vh", paddingBottom: "160px" }}>
          {/* Hero */}
          <div className="relative h-72 flex-shrink-0">
            {heroImage
              ? <img src={heroImage} alt={item.name} className="w-full h-full object-cover transition-all duration-500" />
              : <div className="w-full h-full bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center"><span className="text-7xl">🍽️</span></div>
            }
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
                    className={`relative w-14 h-14 rounded-2xl overflow-hidden transition-all duration-200 ${selectedVariant === i ? "scale-110 shadow-xl ring-2 ring-amber-400 ring-offset-1" : "opacity-65 hover:opacity-90"}`}
                    style={{ border: `${selectedVariant === i ? 3 : 2}px solid ${selectedVariant === i ? "#fbbf24" : "rgba(255,255,255,0.5)"}` }}
                  >
                    {v.image
                      ? <img src={v.image} alt={v.label} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-amber-200 flex items-center justify-center"><span className="text-lg">🍽️</span></div>
                    }
                    <div className={`absolute inset-x-0 bottom-0 text-center text-[8px] font-bold leading-tight py-0.5 ${selectedVariant === i ? "bg-amber-500 text-white" : "bg-black/50 text-white/80"}`}>
                      {v.label?.split(" ")[0]}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="px-5 pt-5">
            {item.category && <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">{item.category}</p>}
            <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">{item.name}</h1>
            {item.tagline && <p className="text-sm text-gray-400 mt-1 italic mb-4">{item.tagline}</p>}

            <div className="flex gap-2 mb-5 flex-wrap">
              {item.prepTime && (
                <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-xl px-3 py-1.5">
                  <Clock size={13} className="text-orange-500" /><span className="text-xs font-semibold text-orange-700">{item.prepTime}</span>
                </div>
              )}
              {item.calories > 0 && (
                <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl px-3 py-1.5">
                  <Flame size={13} className="text-red-500" /><span className="text-xs font-semibold text-red-700">{item.calories} kal</span>
                </div>
              )}
              {item.isVegan && (
                <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-xl px-3 py-1.5">
                  <Leaf size={13} className="text-green-500" /><span className="text-xs font-semibold text-green-700">Vegan</span>
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
                      className={`flex-1 rounded-2xl font-bold text-sm border-2 transition-all overflow-hidden ${selectedVariant === i ? "border-amber-500 shadow-lg scale-105" : "border-gray-200 hover:border-amber-400"}`}
                    >
                      <div className="relative h-20 overflow-hidden">
                        {v.image
                          ? <img src={v.image} alt={v.label} className="w-full h-full object-cover" />
                          : <div className="w-full h-full bg-amber-100 flex items-center justify-center"><span className="text-2xl">🍽️</span></div>
                        }
                        <div className={`absolute inset-0 ${selectedVariant === i ? "bg-amber-500/20" : "bg-black/20"}`} />
                        {selectedVariant === i && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shadow">
                            <Check size={11} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className={`px-3 py-2 text-center ${selectedVariant === i ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-white"}`}>
                        <div className={`font-bold text-sm ${selectedVariant === i ? "text-white" : "text-gray-700"}`}>{v.label}</div>
                        <div className={`text-xs mt-0.5 font-semibold ${selectedVariant === i ? "text-white/80" : "text-amber-600"}`}>Rp{v.price.toLocaleString()}</div>
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
                        className="flex-shrink-0 w-36 bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer"
                      >
                        <div className="h-24 overflow-hidden bg-gray-100">
                          {rel.image ? <img src={rel.image} alt={rel.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><span className="text-3xl">🍽️</span></div>}
                        </div>
                        <div className="p-3">
                          <p className="font-bold text-gray-900 text-xs line-clamp-1">{rel.name}</p>
                          <p className="text-amber-600 font-bold text-xs mt-1">Rp{rel.price.toLocaleString()}</p>
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
            <div className="flex items-center gap-3 bg-amber-50 border-2 border-amber-200 rounded-2xl px-3 py-2">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-sm hover:bg-amber-100 transition-all">
                <Minus size={16} className="text-amber-700" />
              </button>
              <span className="font-extrabold text-gray-900 text-lg w-6 text-center">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-sm hover:shadow-md transition-all">
                <Plus size={16} className="text-white" />
              </button>
            </div>
          </div>
          <button onClick={handleAdd}
            className={`w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-3 ${addedToCart ? "bg-green-500 text-white shadow-lg" : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:scale-[1.02]"}`}
          >
            {addedToCart ? <><Check size={20} /> Ditambahkan!</> : <><ShoppingBag size={20} /> Tambah ke Pesanan</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Menu Card ─────────────────────────────────────────────────────────────────
function MenuCard({ item, qty, onAdd, onRemove, onClick }) {
  const badgeColor = {
    "Promo": "bg-gradient-to-r from-red-500 to-pink-500",
    "Favorit": "bg-gradient-to-r from-amber-500 to-orange-500",
    "Baru": "bg-gradient-to-r from-green-500 to-emerald-500",
    "Best Seller": "bg-gradient-to-r from-purple-500 to-pink-500",
  };
  return (
    <div className="flex-shrink-0 w-44 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all" onClick={onClick}>
      <div className="relative h-32 overflow-hidden bg-gray-100">
        {item.image_url
          ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><span className="text-4xl">🍽️</span></div>
        }
        {item.badge && (
          <div className={`absolute top-2 left-2 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow ${badgeColor[item.badge] || "bg-gray-500"}`}>
            {item.badge === "Promo" && item.discount ? `-${item.discount}` : item.badge}
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-bold text-gray-900 text-sm line-clamp-1">{item.name}</p>
        <div className="flex items-baseline gap-1.5 mt-1">
          <p className="text-amber-600 font-extrabold text-sm">Rp{item.price.toLocaleString()}</p>
          {item.originalPrice && <p className="text-gray-400 text-[10px] line-through">Rp{Number(item.originalPrice).toLocaleString()}</p>}
        </div>
        <div className="mt-2" onClick={e => e.stopPropagation()}>
          {qty === 0 ? (
            <button onClick={onAdd} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold py-1.5 rounded-xl hover:shadow-md hover:scale-105 transition-all">+ Tambah</button>
          ) : (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-2 py-1">
              <button onClick={onRemove} className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">−</button>
              <span className="font-bold text-amber-800 text-xs">{qty}</span>
              <button onClick={onAdd} className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">+</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Riwayat Pesanan Sheet ─────────────────────────────────────────────────────
function RiwayatPesananSheet({ menuDatabase, mejaId, cafeId, onClose, onNavigateToPesanan, onReorder }) {
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
    items:    (o.items   ?? o.detail     ?? o.order_items ?? []).map(i => ({
      name:    i.name    ?? i.nama    ?? i.nama_menu ?? "",
      variant: i.variant ?? i.varian  ?? "",
      qty:     Number(i.qty ?? i.jumlah ?? 1),
      price:   Number(i.price ?? i.harga ?? 0),
      image:   i.image   ?? i.foto    ?? i.gambar ?? "",
    })),
  }));

  const isSedang  = s => ["sedang","proses","pending"].includes(s);
  const isSelesai = s => ["selesai","done","completed"].includes(s);

  const sedangOrders  = orders.filter(o => isSedang(o.status));
  const selesaiOrders = orders.filter(o => isSelesai(o.status));
  const displayed     = activeTab === "sedang" ? sedangOrders : selesaiOrders;
  const getTotal      = items => items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end animate-fadeIn"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div className="relative bg-white w-full max-w-md mx-auto rounded-t-[2rem] animate-slideUp overflow-hidden"
        style={{ maxHeight: "88vh" }} onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-1" />
        <div className="flex items-center justify-between px-5 pt-3 pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">Riwayat Pesanan</h2>
            <p className="text-xs text-gray-400 mt-0.5">Meja Nomor {mejaId} · ASTAKIRA</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">
            <span className="text-gray-600 font-bold text-xl leading-none">×</span>
          </button>
        </div>

        <div className="px-5 mb-4">
          <div className="flex bg-gray-100 rounded-2xl p-1">
            <button onClick={() => setActiveTab("sedang")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "sedang" ? "bg-white text-amber-700 shadow-sm" : "text-gray-500"}`}
            >
              <span className={`w-2 h-2 rounded-full ${activeTab === "sedang" ? "bg-amber-500 animate-pulse" : "bg-gray-400"}`} />
              Sedang Diproses
              {sedangOrders.length > 0 && <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{sedangOrders.length}</span>}
            </button>
            <button onClick={() => setActiveTab("selesai")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "selesai" ? "bg-white text-gray-700 shadow-sm" : "text-gray-500"}`}
            >
              <Check size={13} className={activeTab === "selesai" ? "text-green-500" : "text-gray-400"} />
              Sudah Selesai
            </button>
          </div>
        </div>

        <div className="overflow-y-auto scrollbar-hide px-5 pb-8" style={{ maxHeight: "calc(88vh - 185px)" }}>
          {loading && (
            <div className="space-y-4">
              {[1,2].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse overflow-hidden">
                  <div className="h-16 bg-gray-100" />
                  <div className="p-4 space-y-3">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                  <div className={`px-4 py-3 flex items-center justify-between ${isSedang(order.status) ? "bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100" : "bg-gray-50 border-b border-gray-100"}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isSelesai(order.status) ? "bg-green-500" : "bg-amber-500"}`}>
                        {isSelesai(order.status) ? <Check size={14} className="text-white" /> : <Clock size={14} className="text-white" />}
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-gray-700">{order.id}</p>
                        <p className="text-[10px] text-gray-400">{order.waktu}</p>
                      </div>
                    </div>
                    {isSedang(order.status) ? (
                      <div className="flex items-center gap-1.5 bg-amber-100 border border-amber-200 rounded-full px-2.5 py-1">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold text-amber-700">Est. {order.estimasi}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 bg-green-100 border border-green-200 rounded-full px-2.5 py-1">
                        <Check size={10} className="text-green-600" />
                        <span className="text-[10px] font-bold text-green-700">Selesai</span>
                      </div>
                    )}
                  </div>

                  <div className="px-4 py-3 space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 bg-gray-100">
                          {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><span className="text-xl">🍽️</span></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm line-clamp-1">{item.name}</p>
                          <p className="text-xs text-gray-400">{item.variant ? `${item.variant} · ` : ""}{item.qty}×</p>
                        </div>
                        <p className="text-amber-600 font-extrabold text-sm flex-shrink-0">Rp{(item.price * item.qty).toLocaleString()}</p>
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
                        className="w-full py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <ExternalLink size={15} /> Lihat Detail Pesanan
                      </button>
                    </div>
                  )}
                  {isSelesai(order.status) && (
                    <div className="px-4 pb-4 pt-1">
                      <button onClick={() => { const c = buildCartFromOrder(order.items, menuDatabase); onClose(); onReorder({ cart: c, items: Object.values(menuDatabase).filter(m => c[m.id]) }); }}
                        className="w-full py-3 border-2 border-amber-400 text-amber-700 font-bold text-sm rounded-2xl hover:bg-amber-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                      >
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

// ── Lihat Semua Popup ─────────────────────────────────────────────────────────
function LihatSemuaPopup({ section, cart, onAdd, onRemove, onItemClick, onClose, menuDatabase }) {
  const sectionItems = section.items.map(id => menuDatabase[id]).filter(Boolean);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const badgeColor = {
    "Promo": "bg-gradient-to-r from-red-500 to-pink-500",
    "Favorit": "bg-gradient-to-r from-amber-500 to-orange-500",
    "Baru": "bg-gradient-to-r from-green-500 to-emerald-500",
    "Best Seller": "bg-gradient-to-r from-purple-500 to-pink-500",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end animate-fadeIn"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div className="relative bg-white w-full max-w-md mx-auto rounded-t-[2rem] animate-slideUp overflow-hidden"
        style={{ maxHeight: "85vh" }} onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shadow-sm"
              style={!isImgUrl(section.logo) ? { background: "linear-gradient(135deg, #f59e0b, #ea580c)" } : {}}
            >
              <CatLogo logo={section.logo} size={28} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">{section.label}</h2>
              <p className="text-xs text-gray-400">{sectionItems.length} menu tersedia</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">
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
                  onClick={() => { onItemClick(item); onClose(); }}
                >
                  <div className="relative h-32 overflow-hidden bg-gray-100">
                    {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><span className="text-3xl">🍽️</span></div>}
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
                      <p className="text-amber-600 font-extrabold text-sm">Rp{item.price.toLocaleString()}</p>
                      {item.originalPrice && <p className="text-gray-400 text-[10px] line-through">Rp{Number(item.originalPrice).toLocaleString()}</p>}
                    </div>
                    <div className="mt-2" onClick={e => e.stopPropagation()}>
                      {qty === 0 ? (
                        <button onClick={() => onAdd(item.id)} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold py-1.5 rounded-xl hover:shadow-md hover:scale-105 transition-all">+ Tambah</button>
                      ) : (
                        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-2 py-1">
                          <button onClick={() => onRemove(item.id)} className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">−</button>
                          <span className="font-bold text-amber-800 text-xs">{qty}</span>
                          <button onClick={() => onAdd(item.id)} className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">+</button>
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

// ── Main Home Component ───────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const MEJA_ID = searchParams.get("table")   ?? "1";
  const CAFE_ID = searchParams.get("cafe_id") ?? "";

  const [activeCategory, setActiveCategory]       = useState("all");
  const [selectedItem, setSelectedItem]           = useState(null);
  const [lihatSemuaSection, setLihatSemuaSection] = useState(null);
  const [showRiwayat, setShowRiwayat]             = useState(false);
  const [cart, setCart]                           = useState({});
  const sectionRefs = useRef({});

  const { data: menuRaw, loading: menuLoading, error: menuError, refetch: refetchMenu } = useApi(
    () => api.get(`api/menu/user/${CAFE_ID}`).then(r => r.data ?? r),
    [CAFE_ID]
  );

  const { data: categoriesRaw, loading: catLoading, error: catError, refetch: refetchCat } = useApi(
    () => api.get(`api/kategori/user/${CAFE_ID}`).then(r => r.data ?? r),
    [CAFE_ID]
  );

  const menuDatabase     = menuRaw ? buildMenuDatabase(menuRaw) : {};
  // ✅ normalizeCategory ambil nama_kategori sebagai label
  const normalizedCats   = (categoriesRaw ?? []).map(normalizeCategory);
  // ✅ buildCategorySections group menu berdasarkan category_id
  const categorySections = buildCategorySections(normalizedCats, menuDatabase);
  const categories       = [{ id: "all", label: "Semua", logo: "" }, ...normalizedCats];

  const allItems   = Object.values(menuDatabase);
  const totalQty   = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = allItems.reduce((sum, item) => sum + (cart[item.id] || 0) * item.price, 0);
  const cartItems  = allItems.filter(item => (cart[item.id] || 0) > 0);
  const isLoading  = menuLoading || catLoading;
  const hasError   = (menuError || catError) && !isLoading;

  const addItem    = (id) => setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const removeItem = (id) => setCart(prev => {
    const u = { ...prev };
    if (u[id] > 1) u[id]--; else delete u[id];
    return u;
  });
  const handleSheetAdd       = (id, qty) => setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + qty }));
  const handleCheckout       = () => navigate("/pesanan", { state: { cart, items: cartItems } });
  const handleNavigateToPesanan = ({ cart: oc, items: oi, orderId }) =>
    navigate("/pesanan", { state: { cart: oc, items: oi, fromRiwayat: true, orderId } });
  const handleReorder = ({ cart: rc }) => {
    const merged = { ...cart };
    Object.entries(rc).forEach(([id, qty]) => { merged[id] = (merged[id] || 0) + qty; });
    setCart(merged);
    navigate("/pesanan", { state: { cart: merged, items: Object.values(menuDatabase).filter(m => merged[m.id]), isReorder: true } });
  };

  const handleCategoryClick = (catId) => {
    setActiveCategory(catId);
    if (catId === "all") { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    const el = sectionRefs.current[catId];
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 172, behavior: "smooth" });
  };

  return (
    <div className="relative min-h-screen bg-gray-50">

      {/* ── NAVBAR ── */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-extrabold text-lg">A</span>
              </div>
              <div>
                <p className="font-extrabold text-sm text-gray-900 leading-none">ASTAKIRA</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin size={10} className="text-amber-500" />
                  <p className="text-xs text-gray-400">Ciakar, Tasikmalaya</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate("/search")} className="w-9 h-9 flex items-center justify-center bg-amber-50 rounded-xl hover:bg-amber-100 transition-all">
                <Search size={17} className="text-amber-700" />
              </button>
              <button onClick={() => setShowRiwayat(true)} className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl px-3 h-9 shadow-md hover:shadow-lg transition-all">
                <ShoppingBag size={15} className="text-white" />
                <span className="text-white text-xs font-bold">Riwayat</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto">

        {/* ── HERO ── */}
        <div className="relative h-44 overflow-hidden">
          <img src="https://images.unsplash.com/photo-1765894711260-9d881459ddb4?w=800&auto=format" alt="Hero" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        {/* ── MEJA BANNER ── */}
        <div className="px-4 pt-4 mb-5">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl px-5 py-3.5 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <p className="text-white font-bold text-base">Meja Nomor {MEJA_ID}</p>
          </div>
        </div>

        {/* ── CATEGORY BAR ── */}
        <div className="sticky top-16 z-30 bg-gray-50 pb-3 pt-2">
          <div className="px-4 mb-2">
            <h2 className="text-base font-bold text-gray-900">Pilihan Kuliner Favoritmu</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide px-4 pt-2">
            {catLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1.5 animate-pulse">
                    <div className="w-14 h-14 rounded-2xl bg-gray-200" />
                    <div className="h-2 w-12 bg-gray-200 rounded" />
                  </div>
                ))
              : categories.map(cat => {
                  const isActive = activeCategory === String(cat.id);
                  const logo     = cat.logo ?? "";
                  const isImg    = isImgUrl(logo);
                  return (
                    <button key={cat.id} onClick={() => handleCategoryClick(String(cat.id))}
                      className="flex-shrink-0 flex flex-col items-center gap-1.5"
                    >
                      <div
                        className={`w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center transition-all duration-200 ${
                          isActive ? "scale-110 shadow-lg ring-2 ring-amber-400 ring-offset-2" : "bg-white border-2 border-gray-100 shadow-sm"
                        }`}
                        style={isActive && !isImg ? { background: "linear-gradient(135deg, #f59e0b, #ea580c)" } : {}}
                      >
                        {cat.id === "all" ? (
                          <span className="text-2xl leading-none">🍽️</span>
                        ) : isImg ? (
                          <img src={logo} alt={cat.label} className="w-full h-full object-cover"
                            onError={e => { e.currentTarget.style.display = "none"; e.currentTarget.parentElement.innerHTML = '<span style="font-size:22px;line-height:1">🍽️</span>'; }}
                          />
                        ) : logo ? (
                          <span className="text-2xl leading-none">{logo}</span>
                        ) : (
                          <span className="text-2xl leading-none">🍽️</span>
                        )}
                      </div>
                      {/* ✅ cat.label = nama_kategori dari backend */}
                      <span className={`text-[11px] font-semibold whitespace-nowrap ${isActive ? "text-amber-600" : "text-gray-500"}`}>
                        {cat.label}
                      </span>
                    </button>
                  );
                })
            }
          </div>
        </div>

        {/* ── MENU SECTIONS ── */}
        <div className="pb-36 mt-2">
          {hasError && <ErrorState message={menuError || catError} onRetry={() => { refetchMenu(); refetchCat(); }} />}
          {isLoading && <><SkeletonSection /><SkeletonSection /><SkeletonSection /></>}
          {!isLoading && !hasError && categorySections.length === 0 && (
            <div className="text-center py-16 px-8">
              <div className="text-5xl mb-3">🍽️</div>
              <p className="text-gray-500 font-semibold">Menu belum tersedia</p>
            </div>
          )}
          {!isLoading && !hasError && categorySections.map(section => {
            const sectionItems = section.items.map(id => menuDatabase[id]).filter(Boolean);
            if (!sectionItems.length) return null;
            const logo  = section.logo ?? "";
            const isImg = isImgUrl(logo);
            return (
              <div key={section.id}
                id={`section-${section.id}`}
                ref={el => { sectionRefs.current[String(section.id)] = el; }}
                className="mb-8"
              >
                <div className="px-4 flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {/* ✅ Logo section: foto atau fallback gradient+emoji */}
                    <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center shadow-sm"
                      style={!isImg ? { background: "linear-gradient(135deg, #f59e0b, #ea580c)" } : {}}
                    >
                      {isImg
                        ? <img src={logo} alt={section.label} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = "none"; }} />
                        : <span className="text-base leading-none">{logo || "🍽️"}</span>
                      }
                    </div>
                    {/* ✅ section.label = nama_kategori */}
                    <h2 className="text-base font-bold text-gray-900">{section.label}</h2>
                  </div>
                  <button onClick={() => setLihatSemuaSection(section)} className="text-xs text-amber-600 font-semibold hover:text-amber-700 transition-colors">
                    Lihat Semua →
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-4">
                  {sectionItems.map(item => (
                    <MenuCard key={item.id} item={item} qty={cart[item.id] || 0}
                      onAdd={() => addItem(item.id)} onRemove={() => removeItem(item.id)}
                      onClick={() => setSelectedItem(item)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── FLOATING CHECKOUT ── */}
        {totalQty > 0 && !selectedItem && (
          <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6">
            <div className="max-w-md mx-auto">
              <button onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 rounded-3xl p-5 shadow-2xl border border-amber-400/50 hover:scale-[1.01] transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 relative">
                      <ShoppingBag className="text-white" size={20} />
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">{totalQty}</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-white/80 text-xs font-medium mb-0.5">{totalQty} Item dipilih</p>
                      <p className="text-white text-xl font-bold">Rp{totalPrice.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="bg-white text-amber-700 px-6 py-3 rounded-2xl font-bold shadow-xl whitespace-nowrap">Checkout →</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {showRiwayat && (
        <RiwayatPesananSheet menuDatabase={menuDatabase} mejaId={MEJA_ID} cafeId={CAFE_ID}
          onClose={() => setShowRiwayat(false)} onNavigateToPesanan={handleNavigateToPesanan} onReorder={handleReorder}
        />
      )}
      {lihatSemuaSection && (
        <LihatSemuaPopup section={lihatSemuaSection} cart={cart} menuDatabase={menuDatabase}
          onAdd={addItem} onRemove={removeItem} onItemClick={setSelectedItem} onClose={() => setLihatSemuaSection(null)}
        />
      )}
      {selectedItem && (
        <MenuDetailSheet item={selectedItem} menuDatabase={menuDatabase}
          onClose={() => setSelectedItem(null)} onAddToCart={handleSheetAdd} onOpenItem={item => setSelectedItem(item)}
        />
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}