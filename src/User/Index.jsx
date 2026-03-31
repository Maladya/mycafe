import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  Search, ShoppingBag, ArrowLeft, Heart, Share2, Plus, Minus,
  Clock, MapPin, Flame, Leaf, Check, ExternalLink, RotateCcw,
  AlertCircle, RefreshCw, Image, MessageSquare
} from "lucide-react";

import ActionConfirmModal from "../components/ActionConfirmModal";

import FingerprintJS from "@fingerprintjs/fingerprintjs";

const BASE_URL = (import.meta.env.VITE_API_URL ?? "http://192.168.1.5:3000").replace(/\/$/, "");
const TOKEN_KEY = "astakira_token";
const KNOWN_GROUPS_KEY = "known_variant_groups";
const tokenManager = {
  get:   ()  => localStorage.getItem(TOKEN_KEY) ?? import.meta.env.VITE_API_TOKEN ?? "",
  set:   (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: ()  => localStorage.removeItem(TOKEN_KEY),
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
    `--p:${theme.primary}`, `--s:${theme.secondary}`, `--bg:${theme.bg}`, `--tx:${theme.text}`,
    `--on-p:${onP}`, `--p-20:${ha(theme.primary, 0.2)}`,
    `--bg-soft:${ha(theme.primary, 0.07)}`,
    `--grad:linear-gradient(135deg,${theme.primary},${theme.secondary})`,
  ].join(";");
  document.documentElement.setAttribute("style", vars);
}

try {
  const cached = localStorage.getItem(THEME_CACHE_KEY);
  if (cached) applyThemeVars(JSON.parse(cached));
} catch {}

const DEVICE_KEY = "astakira_device_id";
const FINGERPRINT_KEY = "astakira_fingerprint";
const CLIENT_FINGERPRINT_KEY = "astakira_client_fingerprint";
const VISITOR_COOKIE_KEY = "visitor_id";

function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem(DEVICE_KEY);
  if (!deviceId) {
    deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem(DEVICE_KEY, deviceId);
  }
  return deviceId;
}

async function getOrCreateFingerprint() {
  let fingerprint = localStorage.getItem(FINGERPRINT_KEY);
  if (fingerprint) return fingerprint;
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  fingerprint = result?.visitorId ?? "";
  if (fingerprint) localStorage.setItem(FINGERPRINT_KEY, fingerprint);
  return fingerprint;
}

function setCookie(key, value, maxAgeSeconds = 60 * 60 * 24 * 365) {
  try {
    const safeKey = encodeURIComponent(key);
    const safeValue = encodeURIComponent(value);
    document.cookie = `${safeKey}=${safeValue}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
  } catch {}
}

function getCookie(key) {
  try {
    const nameEq = `${encodeURIComponent(key)}=`;
    const parts = (document.cookie || "").split(";");
    for (const part of parts) {
      const v = part.trim();
      if (v.startsWith(nameEq)) return decodeURIComponent(v.slice(nameEq.length));
    }
  } catch {}
  return "";
}

const api = {
  get: async (path, opts = {}) => {
    const token = tokenManager.get();
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const withDeviceId = opts?.withDeviceId !== false;
    const url = withDeviceId
      ? (() => {
          const deviceId = getOrCreateDeviceId();
          return path.includes('?') ? `${path}&device_id=${deviceId}` : `${path}?device_id=${deviceId}`;
        })()
      : path;
    const res = await fetch(`${BASE_URL}/${url}`, { headers });
    if (res.status === 401) { tokenManager.clear(); throw new Error("Sesi habis."); }
    if (res.status === 403) { throw new Error("Akses ditolak (403)."); }
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
  },
  tryGet: async (paths, opts = {}) => {
    const list = Array.isArray(paths) ? paths : [paths];
    let lastErr = null;
    for (const p of list) {
      try {
        return await api.get(p, opts);
      } catch (e) {
        lastErr = e;
        const msg = String(e?.message ?? e ?? "");
        if (msg.startsWith("HTTP 404")) continue;
        throw e;
      }
    }
    throw lastErr ?? new Error("Tidak menemukan endpoint.");
  },
  post: async (path, body) => {
    const token = tokenManager.get();
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const deviceId = getOrCreateDeviceId();

    const url = path.includes('?') ? `${path}&device_id=${deviceId}` : `${path}?device_id=${deviceId}`;
    const res = await fetch(`${BASE_URL}/${url}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
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

function normalizeCategory(cat) {
  return {
    id:    cat.id,
    label: cat.nama_kategori ?? cat.label ?? cat.nama ?? cat.name ?? String(cat.id),
    logo:  fixImgUrl(cat.logo ?? cat.icon ?? cat.foto ?? cat.gambar ?? ""),
    items: Array.isArray(cat.items) ? cat.items : [],
  };
}

function normalizeMenuItem(item) {
  const rawCatId = item.category_id ?? item.kategori_id ?? item.id_kategori ?? item.cat_id ?? null;

  // Kumpulkan nama_group unik dari variants untuk fetch per grup
  const variantRaw = item.variants ?? item.varian ?? item.variant ?? item.varian_menu ?? [];
  const namaGroups = [...new Set(
    variantRaw
      .map(v => v.nama_group ?? v.nama_grup ?? v.namaGroup ?? v.group ?? "")
      .filter(Boolean)
  )];

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
    namaGroups,   // array nama grup untuk fetch varian
    variants:      variantRaw.map(v => ({
      label:       v.label ?? v.nama ?? v.ukuran ?? "",
      price:       Number(v.price ?? v.harga ?? 0),
      hargaVariant: Number(v.harga_variant ?? 0),
      namaGroup:   v.nama_group ?? v.nama_grup ?? v.namaGroup ?? v.group ?? "",
      image:       fixImgUrl(v.image ?? v.foto ?? item.image_url ?? item.image ?? item.foto ?? ""),
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
      return item.categoryId===s || String(r?.category_id)===s || String(r?.kategori_id)===s ||
             String(r?.id_kategori)===s || String(r?.cat_id)===s;
    }).map(i => i.id);
    return { ...cat, items: ids };
  }).filter(c => c.items.length > 0);
}

function buildCartFromOrder(orderItems, db) {
  const cart = {}, all = Object.values(db);
  orderItems.forEach(o => {
    const nama  = (o.name ?? o.nama_menu ?? o.nama ?? "").toLowerCase().trim();
    const found = all.find(m => m.name.toLowerCase().trim() === nama);
    if (found) cart[found.id] = (cart[found.id] || 0) + (o.qty ?? o.jumlah ?? 1);
  });
  return cart;
}

function parseDateFlexible(raw) {
  if (!raw) return null;
  if (raw instanceof Date) return raw;
  const str = String(raw).trim();
  if (!str) return null;
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (m) {
    const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
    const hh = Number(m[4]), mm = Number(m[5]), ss = Number(m[6] ?? 0);
    return new Date(Date.UTC(y, mo - 1, d, hh - 7, mm, ss));
  }
  const dt = new Date(str);
  return isNaN(dt.getTime()) ? null : dt;
}

function formatWaktu(raw) {
  if (!raw) return "";
  try {
    const d = parseDateFlexible(raw);
    if (!d) return String(raw);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
  } catch { return raw; }
}

function CatLogo({ logo, size = 28 }) {
  const [err, setErr] = useState(false);
  if (!logo || err) return <Image size={size*0.6} style={{ color: "var(--on-p)", opacity:0.9 }} />;
  return <img src={logo} alt="" style={{ width:size, height:size, objectFit:"cover" }} onError={() => setErr(true)} />;
}

function MenuImage({ src, alt, className = "w-full h-full object-cover" }) {
  const [err, setErr] = useState(false);
  if (!src || err) return (
    <div className="w-full h-full flex items-center justify-center" style={{ background:"var(--bg-soft)" }}>
      <Image size={28} style={{ color:"var(--p)", opacity:0.35 }} />
    </div>
  );
  return <img src={src} alt={alt} className={className} onError={() => setErr(true)} />;
}

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

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <AlertCircle size={48} className="text-red-400 mb-3" />
      <p className="font-bold text-gray-700 mb-1">Gagal memuat data</p>
      <p className="text-gray-400 text-sm mb-4">{message}</p>
      <button onClick={onRetry}
        className="flex items-center gap-2 text-white px-5 py-2.5 rounded-2xl font-bold transition-all"
        style={{ background:"var(--p)" }}>
        <RefreshCw size={15} /> Coba Lagi
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT GROUP CHECKBOX — tampilan seperti referensi gambar
// ─────────────────────────────────────────────────────────────────────────────
const DUMMY_VARIANT_GROUPS = ["LEVEL PEDAS", "UKURAN"]; 
const DUMMY_VARIANTS_BY_GROUP = {
  "LEVEL PEDAS": [
    { id: "pedas_0", label: "LEVEL 0", harga_variant: 0, id_menu: "*" },
    { id: "pedas_1", label: "LEVEL 1", harga_variant: 0, id_menu: "*" },
    { id: "pedas_2", label: "LEVEL 2", harga_variant: 0, id_menu: "*" },
    { id: "pedas_3", label: "LEVEL 3", harga_variant: 0, id_menu: "*" },
    { id: "pedas_4", label: "LEVEL 4", harga_variant: 0, id_menu: "*" },
    { id: "pedas_6", label: "LEVEL 6", harga_variant: 910, id_menu: "*" },
    { id: "pedas_8", label: "LEVEL 8", harga_variant: 910, id_menu: "*" },
  ],
  "UKURAN": [
    { id: "uk_s", label: "Small", harga_variant: 0, id_menu: "*" },
    { id: "uk_m", label: "Medium", harga_variant: 2000, id_menu: "*" },
    { id: "uk_l", label: "Large", harga_variant: 4000, id_menu: "*" },
  ],
};

function VariantGroupSection({ namaGroup, menuId, basePrice, selectedId, onSelect, variants: propVariants }) {
  const [variants, setVariants]   = useState(propVariants || []);
  const [loading, setLoading]    = useState(!propVariants);
  const [error, setError]      = useState("");

  useEffect(() => {
    // Kalau variants sudah di-pass dari parent, pakai langsung tanpa fetch
    if (propVariants && propVariants.length > 0) {
      setVariants(propVariants);
      setLoading(false);
      return;
    }
    
    // Kalau tidak ada prop variants, fetch dari API (fallback)
    console.log(`[VariantGroupSection] Fetching variants for group "${namaGroup}" and menu ID: ${menuId}`);
    setLoading(true); setError("");

    // Gunakan api.get yang sudah include device_id
    api.tryGet([
      `by-nama-group/${encodeURIComponent(namaGroup)}`,
    ], { withDeviceId: false })
      .then(data => {
        const list = data.data ?? data.variants ?? data.varian ?? data ?? [];
        const allVariants = Array.isArray(list) ? list : [];
        console.log(`[VariantGroupSection] Total variants fetched for "${namaGroup}":`, allVariants.length);
        console.log(`[VariantGroupSection] All variants:`, allVariants.map(v => ({ id: v.id, label: v.label, id_menu: v.id_menu })));
        
        // Filter varian yang hanya milik menu ini
        const filtered = menuId
          ? allVariants.filter(v => String(v.id_menu) === String(menuId))
          : allVariants;
        
        console.log(`[VariantGroupSection] Filtered variants for menu ${menuId}:`, filtered.map(v => ({ id: v.id, label: v.label, harga_variant: v.harga_variant })));
        console.log(`[VariantGroupSection] Count: ${filtered.length} variants for menu ${menuId} in group "${namaGroup}"`);
        
        if (filtered.length > 0) {
          try {
            const raw = localStorage.getItem(KNOWN_GROUPS_KEY);
            const prev = raw ? JSON.parse(raw) : [];
            const next = Array.from(new Set([...(Array.isArray(prev) ? prev : []), namaGroup]));
            localStorage.setItem(KNOWN_GROUPS_KEY, JSON.stringify(next));
          } catch {
            // ignore
          }
          setVariants(filtered);
        } else {
          console.log(`[VariantGroupSection] No variants found for menu ${menuId} in group "${namaGroup}"`);
          setVariants([]);
        }
      })
      .catch((err) => {
        console.error(`[VariantGroupSection] Error fetching variants for "${namaGroup}":`, err);
        setError("Gagal memuat varian");
        setVariants([]);
      })
      .finally(() => setLoading(false));
  }, [namaGroup, menuId]);

  return (
    <div className="mb-1">
      {/* Judul grup */}
      <div className="px-5 pt-5 pb-2">
        <p className="text-base font-extrabold text-gray-900 uppercase tracking-wide">
          {namaGroup}
        </p>
        <p className="text-xs font-semibold mt-0.5" style={{ color: "var(--p)" }}>
          Harus dipilih maks. 1
        </p>
      </div>

      {/* Divider */}
      <div className="h-px mx-5 bg-gray-100 mb-1" />

      {loading && (
        <div className="px-5 py-4 space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="flex items-center justify-between animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-32" />
              <div className="w-6 h-6 bg-gray-200 rounded-md" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="px-5 py-3 text-xs text-red-400">{error}</p>
      )}

      {!loading && !error && variants.length === 0 && (
        <p className="px-5 py-3 text-xs text-gray-400">
          Tidak ada varian untuk grup ini
        </p>
      )}

      {!loading && !error && variants.map((v, idx) => {
        const vid          = v.id ?? idx;
        const isSelected   = selectedId === vid;
        const hargaVariant = Number(v.harga_variant ?? 0);
        const label        = v.label ?? v.nama ?? "";

        return (
          <div key={vid}>
            <button
              onClick={() => onSelect(isSelected ? null : vid, v)}
              className="w-full flex items-center justify-between px-5 py-4 transition-colors hover:bg-gray-50 active:bg-gray-100"
            >
              {/* Label + harga tambahan */}
              <span className="text-sm font-semibold text-gray-800">
                {label}
                {hargaVariant > 0 && (
                  <span className="ml-2 font-bold" style={{ color: "var(--p)" }}>
                    (+ Rp {hargaVariant.toLocaleString("id-ID")})
                  </span>
                )}
              </span>

              {/* Checkbox */}
              <div
                className="w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all"
                style={isSelected
                  ? { background: "var(--p)", borderColor: "var(--p)" }
                  : { background: "white", borderColor: "#d1d5db" }
                }
              >
                {isSelected && <Check size={13} className="text-white" strokeWidth={3} />}
              </div>
            </button>
            {/* Divider tipis antar item */}
            {idx < variants.length - 1 && (
              <div className="h-px mx-5 bg-gray-100" />
            )}
          </div>
        );
      })}

      {/* Divider bawah grup */}
      <div className="h-2 bg-gray-50 mt-2" />
    </div>
  );
}

function MenuDetailSheet({ item, menuDatabase, cafeId, onClose, onAddToCart, onOpenItem }) {
  const [qty, setQty]               = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedToCart, setAddedToCart]   = useState(false);
  const [catatan, setCatatan]           = useState("");

  const [detailItem, setDetailItem]     = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError]   = useState("");

  // selectedVariants: { [namaGroup]: { id, variantObj } }
  const [selectedVariants, setSelectedVariants] = useState({});

  // Fetch semua varian milik menu ini → extract nama_group unik
  const [namaGroups, setNamaGroups]   = useState([]);
  const [varFetched, setVarFetched]   = useState(false);

  useEffect(() => {
    if (!item?.id) { setDetailItem(null); return; }
    let alive = true;

    setDetailLoading(true);
    setDetailError("");

    api.tryGet([
      `api/menu/user/${cafeId}/${encodeURIComponent(item.id)}`,
    ], { withDeviceId: false })
      .then(data => {
        if (!alive) return;
        const raw = data?.data ?? data?.menu ?? data;
        if (!raw || typeof raw !== "object") { setDetailItem(null); return; }

        const normalized = normalizeMenuItem(raw);
        setDetailItem({
          ...item,
          ...normalized,
          image_url: normalized.image_url || item.image_url,
          _raw: raw,
        });
      })
      .catch(err => {
        if (!alive) return;
        setDetailError(err?.message ? String(err.message) : "Gagal memuat detail menu");
        setDetailItem(null);
      })
      .finally(() => {
        if (!alive) return;
        setDetailLoading(false);
      });

    return () => { alive = false; };
  }, [item?.id, cafeId]);

  const activeItem = detailItem ?? item;

  useEffect(() => {
    if (!activeItem?.id) return;
    setVarFetched(false);

    console.log(`[MenuDetailSheet] Menu item:`, { id: activeItem.id, name: activeItem.name, namaGroups: activeItem.namaGroups, variants: activeItem.variants });
    console.log(`[MenuDetailSheet] Menu raw keys:`, Object.keys(activeItem?._raw ?? {}));
    console.log(`[MenuDetailSheet] Menu raw object:`, activeItem?._raw ?? null);

    // Gunakan namaGroups dari item jika tersedia (dari normalizeMenuItem)
    const groupsFromItem = Array.isArray(activeItem.namaGroups) && activeItem.namaGroups.length > 0
      ? activeItem.namaGroups
      : [];

    if (groupsFromItem.length > 0) {
      console.log(`[MenuDetailSheet] Using namaGroups from item:`, groupsFromItem);
      setNamaGroups(groupsFromItem);
      setVarFetched(true);
      return;
    }

    // Jika tidak ada namaGroups tapi ada variants, extract dari variants
    if (Array.isArray(activeItem.variants) && activeItem.variants.length > 0) {
      const groups = [...new Set(
        activeItem.variants
          .map(v => v.namaGroup ?? v.nama_group ?? v.nama_grup ?? v.group ?? "")
          .filter(Boolean)
      )];
      console.log(`[MenuDetailSheet] Extracted namaGroups from variants:`, groups);
      setNamaGroups(groups);
      setVarFetched(true);
      return;
    }

    (async () => {
      // Variants sudah tersedia dari response detail menu, tidak perlu probing
      console.log(`[MenuDetailSheet] Using variants from detail response for menu ${activeItem.id}`);
      setNamaGroups([]);
      setVarFetched(true);
    })();
  }, [activeItem?.id, activeItem?.namaGroups, activeItem?.variants]);

  const relatedItems = Object.values(menuDatabase).filter(m => activeItem.related?.includes(m.id));

  // Hitung total harga: harga menu + semua harga_variant yang dipilih
  const extraPrice = Object.values(selectedVariants).reduce((sum, sel) => {
    return sum + Number(sel?.variantObj?.harga_variant ?? sel?.variantObj?.hargaVariant ?? 0);
  }, 0);
  const currentPrice = activeItem.price + extraPrice;
  const totalPrice   = currentPrice * qty;

  const handleSelect = (namaGroup, variantId, variantObj) => {
    setSelectedVariants(prev => ({
      ...prev,
      [namaGroup]: variantId === null ? null : { id: variantId, variantObj },
    }));
  };

  const handleAdd = () => {
    setAddedToCart(true);
    const pickedVariants = Object.entries(selectedVariants)
      .filter(([, v]) => v !== null)
      .map(([namaGroup, v]) => ({
        namaGroup,
        id:          v.id,
        label:       v.variantObj?.label ?? "",
        hargaVariant: Number(v.variantObj?.harga_variant ?? v.variantObj?.hargaVariant ?? 0),
      }));

    onAddToCart(activeItem.id, qty, currentPrice, {
      variants: pickedVariants,
      catatan: catatan.trim(),
    });
    setTimeout(() => { setAddedToCart(false); onClose(); }, 1200);
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end animate-fadeIn"
      style={{ background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)" }} onClick={onClose}>
      <div className="relative bg-white w-full max-w-md mx-auto rounded-t-[2rem] animate-slideUp overflow-hidden"
        style={{ maxHeight:"92vh" }} onClick={e => e.stopPropagation()}>

        <div className="overflow-y-auto scrollbar-hide" style={{ maxHeight:"92vh", paddingBottom:"160px" }}>

          {/* Hero Image */}
          <div className="relative h-72 flex-shrink-0" style={{ background:"var(--bg-soft)" }}>
            <MenuImage src={activeItem.image_url} alt={activeItem.name} className="w-full h-full object-cover transition-all duration-500" />
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
            {activeItem.badge && (
              <div className="absolute top-20 left-4 z-10">
                <span
                  className={`text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg ${activeItem.badge === "Promo" ? "bg-gradient-to-r from-red-500 to-pink-500" : "bg-gradient-to-r from-purple-500 to-pink-500"}`}
                >
                  {activeItem.badge==="Promo" && activeItem.discount ? `-${activeItem.discount}` : activeItem.badge}
                </span>
              </div>
            )}
          </div>

          {/* Info dasar */}
          <div className="px-5 pt-5">
            {activeItem.category && <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color:"var(--p)" }}>{activeItem.category}</p>}
            <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">{activeItem.name}</h1>
            {activeItem.tagline && <p className="text-sm text-gray-400 mt-1 italic mb-4">{activeItem.tagline}</p>}

            {detailLoading && (
              <p className="text-xs text-gray-400 mt-1">Memuat detail...</p>
            )}
            {!detailLoading && detailError && (
              <p className="text-xs text-red-400 mt-1">{detailError}</p>
            )}

            {/* Badge info */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {activeItem.prepTime && (<div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-xl px-3 py-1.5"><Clock size={13} className="text-orange-500" /><span className="text-xs font-semibold text-orange-700">{activeItem.prepTime}</span></div>)}
              {activeItem.calories > 0 && (<div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl px-3 py-1.5"><Flame size={13} className="text-red-500" /><span className="text-xs font-semibold text-red-700">{activeItem.calories} kal</span></div>)}
              {activeItem.isVegan && (<div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-xl px-3 py-1.5"><Leaf size={13} className="text-green-500" /><span className="text-xs font-semibold text-green-700">Vegan</span></div>)}
              {activeItem.volume && (<div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5"><span className="text-xs font-semibold text-blue-700">🥤 {activeItem.volume}</span></div>)}
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-5" />

            {activeItem.description && <p className="text-sm text-gray-600 leading-relaxed mb-5">{activeItem.description}</p>}

            {activeItem.ingredients?.length > 0 && (
              <div className="mb-6">
                <h2 className="text-base font-bold text-gray-900 mb-2">Bahan</h2>
                <div className="flex flex-wrap gap-2">
                  {activeItem.ingredients.map((ing, i) => <span key={i} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{ing}</span>)}
                </div>
              </div>
            )}
          </div>

          {/* ── VARIAN per grup — tampilan checkbox list ── */}
          {!varFetched && (
            <div className="border-t border-gray-100 px-5 py-6 space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center justify-between animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-36" />
                  <div className="w-6 h-6 bg-gray-200 rounded-md" />
                </div>
              ))}
            </div>
          )}
          {varFetched && namaGroups.length > 0 && (
            <div className="border-t border-gray-100">
              {namaGroups.map(namaGroup => (
                <VariantGroupSection
                  key={namaGroup}
                  namaGroup={namaGroup}
                  menuId={activeItem.id}
                  basePrice={activeItem.price}
                  selectedId={selectedVariants[namaGroup]?.id ?? null}
                  onSelect={(variantId, variantObj) => handleSelect(namaGroup, variantId, variantObj)}
                  variants={activeItem.variants?.filter(v => 
                    (v.namaGroup ?? v.nama_group ?? v.nama_grup ?? v.group ?? "") === namaGroup
                  )}
                />
              ))}
            </div>
          )}
          {varFetched && namaGroups.length === 0 && null}

          {/* ── CATATAN ── */}
          <div className="px-5 py-5 border-t border-gray-100">
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <MessageSquare size={16} style={{ color:"var(--p)" }} />
              Catatan
              <span className="text-xs font-normal text-gray-400">(opsional)</span>
            </h2>
            <div
              className="relative rounded-2xl border-2 overflow-hidden transition-all"
              style={{ borderColor: catatan ? "var(--p)" : "#e5e7eb" }}
            >
              <textarea
                value={catatan}
                onChange={e => setCatatan(e.target.value)}
                placeholder="Contoh: Tidak pakai bawang, pedas sedang, es banyak..."
                maxLength={200}
                rows={3}
                className="w-full px-4 py-3 text-sm text-gray-700 placeholder-gray-400 resize-none outline-none bg-white"
                style={{ fontFamily:"inherit" }}
              />
              {catatan && (
                <button
                  onClick={() => setCatatan("")}
                  className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-all"
                >
                  <span className="text-gray-500 text-xs font-bold leading-none">×</span>
                </button>
              )}
              <div className="px-4 pb-1.5 text-right">
                <span className="text-[10px] text-gray-400">{catatan.length}/200</span>
              </div>
            </div>
          </div>

          {/* Related items */}
          {relatedItems.length > 0 && (
            <div className="px-5 pb-6 border-t border-gray-100">
              <h2 className="text-base font-bold text-gray-900 mb-4 pt-5">Menu Lainnya</h2>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {relatedItems.map(rel => (
                  <div key={rel.id} onClick={() => onOpenItem(rel)}
                    className="flex-shrink-0 w-36 bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer">
                    <div className="h-24 overflow-hidden" style={{ background:"var(--bg-soft)" }}>
                      <MenuImage src={rel.image_url} alt={rel.name} />
                    </div>
                    <div className="p-3">
                      <p className="font-bold text-gray-900 text-xs line-clamp-1">{rel.name}</p>
                      <p className="font-bold text-xs mt-1" style={{ color:"var(--p)" }}>Rp{rel.price.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom action bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Total Harga</p>
              <p className="text-2xl font-extrabold text-gray-900">Rp{totalPrice.toLocaleString()}</p>
              {extraPrice > 0 && (
                <p className="text-[10px] text-gray-400">
                  Rp{activeItem.price.toLocaleString()} + Rp{extraPrice.toLocaleString()} varian
                </p>
              )}
              {activeItem.originalPrice && <p className="text-xs text-gray-400 line-through">Rp{Number(activeItem.originalPrice).toLocaleString()}</p>}
            </div>
            <div className="flex items-center gap-3 rounded-2xl px-3 py-2 border-2"
              style={{ background:"var(--bg-soft)", borderColor:"var(--p-20)" }}>
              <button onClick={() => setQty(q => Math.max(1, q-1))} className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-sm transition-all">
                <Minus size={16} style={{ color:"var(--p)" }} />
              </button>
              <span className="font-extrabold text-gray-900 text-lg w-6 text-center">{qty}</span>
              <button onClick={() => setQty(q => q+1)} className="w-8 h-8 flex items-center justify-center rounded-xl shadow-sm hover:shadow-md transition-all"
                style={{ background:"var(--grad)", color:"var(--on-p)" }}>
                <Plus size={16} style={{ color:"var(--on-p)" }} />
              </button>
            </div>
          </div>
          <button onClick={handleAdd}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-lg hover:scale-[1.02]"
            style={addedToCart ? { background:"#22c55e", color:"#fff" } : { background:"var(--grad)", color:"var(--on-p)" }}>
            {addedToCart ? <><Check size={20} /> Ditambahkan!</> : <><ShoppingBag size={20} /> Tambah ke Pesanan</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function MenuCard({ item, qty, onAdd, onRemove, onClick }) {
  const badgeColor = {
    "Promo":       "bg-gradient-to-r from-red-500 to-pink-500",
    "Favorit":     "bg-gradient-to-r from-amber-500 to-orange-500",
    "Baru":        "bg-gradient-to-r from-green-500 to-emerald-500",
    "Best Seller": "bg-gradient-to-r from-purple-500 to-pink-500",
  };
  return (
    <div className="flex-shrink-0 w-44 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all" onClick={onClick}>
      <div className="relative h-32 overflow-hidden" style={{ background:"var(--bg-soft)" }}>
        <MenuImage src={item.image_url} alt={item.name} />
        {item.badge && (
          <div className={`absolute top-2 left-2 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow ${badgeColor[item.badge] || "bg-gray-500"}`}>
            {item.badge==="Promo" && item.discount ? `-${item.discount}` : item.badge}
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-bold text-gray-900 text-sm line-clamp-1">{item.name}</p>
        <div className="flex items-baseline gap-1.5 mt-1">
          <p className="font-extrabold text-sm" style={{ color:"var(--p)" }}>Rp{item.price.toLocaleString()}</p>
          {item.originalPrice && <p className="text-gray-400 text-[10px] line-through">Rp{Number(item.originalPrice).toLocaleString()}</p>}
        </div>
        <div className="mt-2" onClick={e => e.stopPropagation()}>
          {qty === 0 ? (
            <button onClick={onClick}
              className="w-full text-xs font-bold py-1.5 rounded-xl hover:shadow-md hover:scale-105 transition-all"
              style={{ background:"var(--grad)", color:"var(--on-p)" }}>+ Tambah</button>
          ) : (
            <div className="flex items-center justify-between rounded-xl px-2 py-1 border"
              style={{ background:"var(--bg-soft)", borderColor:"var(--p-20)" }}>
              <button onClick={onRemove} className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background:"var(--p)" }}>−</button>
              <span className="font-bold text-xs" style={{ color:"var(--s)" }}>{qty}</span>
              <button onClick={onAdd} className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background:"var(--p)" }}>+</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RiwayatPesananSheet({ menuDatabase, mejaId, cafeId, cafeName, onClose, onNavigateToPesanan, onReorder }) {
  const [activeTab, setActiveTab] = useState("sedang");
  const { data: ordersRaw, loading, error, refetch } = useApi(
    async () => {
      if (!cafeId) return [];
      const visitorId = getCookie(VISITOR_COOKIE_KEY);
      const clientFingerprint = localStorage.getItem(CLIENT_FINGERPRINT_KEY);
      if (!visitorId || !clientFingerprint) return [];
      const qs = new URLSearchParams();
      qs.set("cafe_id", String(cafeId));
      qs.set("meja_id", String(mejaId ?? ""));
      qs.set("meja", String(mejaId ?? ""));
      if (visitorId) qs.set("visitor_id", visitorId);
      if (clientFingerprint) qs.set("fingerprint", clientFingerprint);
      return api.get(`api/client/riwayat-pembelian?${qs.toString()}`).then(r => r.data ?? r.orders ?? r);
    },
    [cafeId]
  );

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const orders = (Array.isArray(ordersRaw) ? ordersRaw : []).map(o => ({
    id:       o.id ?? o.order_id ?? o.orderId,
    status:   o.status ?? "proses",
    waktu:    formatWaktu(o.waktu ?? o.created_at ?? o.tanggal ?? ""),
    estimasi: o.estimasi ?? o.eta ?? "15 mnt",
    items: (o.items ?? o.detail ?? o.order_items ?? []).map(i => ({
      name:    i.name ?? i.nama_produk ?? i.nama_menu ?? i.nama ?? "",
      variant: i.variant ?? i.varian    ?? "",
      qty:     Number(i.qty ?? i.jumlah ?? 1),
      price:   Number(i.price ?? i.harga_produk ?? i.harga ?? 0),
      image:   fixImgUrl(i.image ?? i.gambar_produk ?? i.image_url ?? i.foto ?? i.gambar ?? i.img ?? ""),
    })),
  }));

  const isSedang  = s => ["sedang","proses","pending","waiting","processing"].includes(String(s).toLowerCase());
  const isSelesai = s => ["selesai","done","completed","success","paid"].includes(String(s).toLowerCase());
  const sedangOrders  = orders.filter(o => isSedang(o.status));
  const selesaiOrders = orders.filter(o => isSelesai(o.status));
  const displayed     = activeTab === "sedang" ? sedangOrders : selesaiOrders;
  const getTotal      = items => items.reduce((s, i) => s + (i.price * i.qty), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end animate-fadeIn"
      style={{ background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)" }} onClick={onClose}>
      <div className="relative bg-white w-full max-w-md mx-auto rounded-t-[2rem] animate-slideUp overflow-hidden"
        style={{ maxHeight:"88vh" }} onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-1" />
        <div className="flex items-center justify-between px-5 pt-3 pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">Riwayat Pesanan</h2>
            <p className="text-xs text-gray-400 mt-0.5">Meja Nomor {mejaId} · {cafeName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refetch} className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">
              <RefreshCw size={14} className={`text-gray-500 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">
              <span className="text-gray-600 font-bold text-xl leading-none">×</span>
            </button>
          </div>
        </div>
        <div className="px-5 mb-4">
          <div className="flex bg-gray-100 rounded-2xl p-1">
            <button onClick={() => setActiveTab("sedang")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab==="sedang" ? "bg-white shadow-sm" : "text-gray-500"}`}
              style={activeTab==="sedang" ? { color:"var(--p)" } : {}}>
              <span className="w-2 h-2 rounded-full" style={{ background: activeTab==="sedang" ? "var(--p)" : "#9ca3af" }} />
              Sedang Diproses
              {sedangOrders.length > 0 && (
                <span className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background:"var(--p)" }}>
                  {sedangOrders.length}
                </span>
              )}
            </button>
            <button onClick={() => setActiveTab("selesai")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab==="selesai" ? "bg-white text-gray-700 shadow-sm" : "text-gray-500"}`}>
              <Check size={13} className={activeTab==="selesai" ? "text-green-500" : "text-gray-400"} />
              Sudah Selesai
            </button>
          </div>
        </div>
        <div className="overflow-y-auto scrollbar-hide px-5 pb-8" style={{ maxHeight:"calc(88vh - 185px)" }}>
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
              <p className="text-gray-400 text-sm mt-1">
                {activeTab==="sedang" ? "Tidak ada pesanan yang sedang diproses" : "Belum ada pesanan yang selesai"}
              </p>
            </div>
          )}
          {!loading && !error && displayed.length > 0 && (
            <div className="space-y-4">
              {displayed.map(order => (
                <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 flex items-center justify-between border-b"
                    style={isSedang(order.status)
                      ? { background:"var(--bg-soft)", borderColor:"var(--p-20)" }
                      : { background:"#f9fafb", borderColor:"#f3f4f6" }}>
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
                        style={{ background:"var(--bg-soft)", borderColor:"var(--p-20)" }}>
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background:"var(--p)" }} />
                        <span className="text-[10px] font-bold" style={{ color:"var(--p)" }}>Est. {order.estimasi}</span>
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
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100" style={{ background:"var(--bg-soft)" }}>
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = "none"; }} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Image size={16} className={`text-gray-400 ${item.image ? "" : "opacity-50"}`} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm line-clamp-1">{item.name}</p>
                          <p className="text-xs text-gray-400">{item.variant ? `${item.variant} · ` : ""}{item.qty}×</p>
                        </div>
                        <p className="font-extrabold text-sm flex-shrink-0" style={{ color:"var(--p)" }}>
                          Rp{(item.price * item.qty).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-500">{order.items.reduce((s,i) => s+i.qty, 0)} item</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">Total:</p>
                      <p className="font-extrabold text-gray-900 text-sm">Rp{getTotal(order.items).toLocaleString()}</p>
                    </div>
                  </div>
                  {isSedang(order.status) && (
                    <div className="px-4 pb-4 pt-1">
                      <button
                        onClick={() => {
                          const c = buildCartFromOrder(order.items, menuDatabase);
                          onClose();
                          onNavigateToPesanan({ cart:c, items:Object.values(menuDatabase).filter(m=>c[m.id]), orderId:order.id });
                        }}
                        className="w-full py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:scale-[1.02]"
                        style={{ background:"var(--grad)", color:"var(--on-p)" }}>
                        <ExternalLink size={15} /> Lihat Detail Pesanan
                      </button>
                    </div>
                  )}
                  {isSelesai(order.status) && (
                    <div className="px-4 pb-4 pt-1">
                      <button
                        onClick={() => {
                          const c = buildCartFromOrder(order.items, menuDatabase);
                          onClose();
                          onReorder({ cart:c, items:Object.values(menuDatabase).filter(m=>c[m.id]) });
                        }}
                        className="w-full py-3 border-2 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2"
                        style={{ borderColor:"var(--p)", color:"var(--p)" }}>
                        <RotateCcw size={15} /> Pesan Lagi
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

function LihatSemuaPopup({ section, cart, onAdd, onRemove, onItemClick, onClose, menuDatabase }) {
  const sectionItems = section.items.map(id => menuDatabase[id]).filter(Boolean);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  const badgeColor = {
    "Promo":       "bg-gradient-to-r from-red-500 to-pink-500",
    "Favorit":     "bg-gradient-to-r from-amber-500 to-orange-500",
    "Baru":        "bg-gradient-to-r from-green-500 to-emerald-500",
    "Best Seller": "bg-gradient-to-r from-purple-500 to-pink-500",
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end animate-fadeIn"
      style={{ background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)" }} onClick={onClose}>
      <div className="relative bg-white w-full max-w-md mx-auto rounded-t-[2rem] animate-slideUp overflow-hidden"
        style={{ maxHeight:"85vh" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shadow-sm flex-shrink-0" style={{ background:"var(--grad)" }}>
              {section.logo ? (
                <img src={section.logo} alt={section.label} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = "none"; }} />
              ) : (
                <Image size={16} style={{ color:"var(--on-p)" }} />
              )}
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
        <div className="overflow-y-auto scrollbar-hide px-4 py-4" style={{ maxHeight:"calc(85vh - 80px)" }}>
          <div className="grid grid-cols-2 gap-3">
            {sectionItems.map(item => {
              const qty = cart[item.id] || 0;
              return (
                <div key={item.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
                  onClick={() => { onItemClick(item); onClose(); }}>
                  <div className="relative h-32 overflow-hidden" style={{ background:"var(--bg-soft)" }}>
                    <MenuImage src={item.image_url} alt={item.name} />
                    {item.badge && (
                      <div className={`absolute top-2 left-2 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow ${badgeColor[item.badge] || "bg-gray-500"}`}>
                        {item.badge==="Promo" && item.discount ? `-${item.discount}` : item.badge}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-gray-900 text-sm line-clamp-1">{item.name}</p>
                    {item.tagline && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.tagline}</p>}
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <p className="font-extrabold text-sm" style={{ color:"var(--p)" }}>Rp{item.price.toLocaleString()}</p>
                      {item.originalPrice && <p className="text-gray-400 text-[10px] line-through">Rp{Number(item.originalPrice).toLocaleString()}</p>}
                    </div>
                    <div className="mt-2" onClick={e => e.stopPropagation()}>
                      {qty === 0 ? (
                        <button onClick={() => { onItemClick(item); onClose(); }}
                          className="w-full text-xs font-bold py-1.5 rounded-xl hover:shadow-md hover:scale-105 transition-all"
                          style={{ background:"var(--grad)", color:"var(--on-p)" }}>+ Tambah</button>
                      ) : (
                        <div className="flex items-center justify-between rounded-xl px-2 py-1 border"
                          style={{ background:"var(--bg-soft)", borderColor:"var(--p-20)" }}>
                          <button onClick={() => onRemove(item.id)} className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background:"var(--p)" }}>−</button>
                          <span className="font-bold text-xs" style={{ color:"var(--s)" }}>{qty}</span>
                          <button onClick={() => { onItemClick(item); onClose(); }} className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background:"var(--p)" }}>+</button>
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

/* ══════════════════════════════════════════════════════════
    Main Home Component
══════════════════════════════════════════════════════════ */
export default function Home() {
  const navigate = useNavigate();
  const { state: locationState } = useLocation();
  const [searchParams] = useSearchParams();

  const MEJA_ID = searchParams.get("table")   ?? "1";
  const CAFE_ID = searchParams.get("cafe_id") ?? "";

  const initClientOnceRef = useRef(false);

  useEffect(() => {
    if (!CAFE_ID || !MEJA_ID || initClientOnceRef.current) return;
    initClientOnceRef.current = true;
    (async () => {
      let fingerprint = "";
      try { fingerprint = await getOrCreateFingerprint(); } catch {}
      const fpParam = fingerprint ? `&fingerprint=${encodeURIComponent(fingerprint)}` : "";
      try {
        const res = await api.get(`api/client/init?cafe_id=${encodeURIComponent(CAFE_ID)}&meja=${encodeURIComponent(MEJA_ID)}&meja_id=${encodeURIComponent(MEJA_ID)}${fpParam}`);
        const visitorId = res?.data?.visitor_id ?? res?.visitor_id ?? "";
        const clientFingerprint = res?.data?.fingerprint ?? res?.fingerprint ?? "";
        if (visitorId) setCookie(VISITOR_COOKIE_KEY, visitorId);
        if (clientFingerprint) {
          try { localStorage.setItem(CLIENT_FINGERPRINT_KEY, String(clientFingerprint)); } catch {}
        }
      } catch {}
    })();
  }, [CAFE_ID, MEJA_ID]);

  const [activeCategory, setActiveCategory]       = useState("all");
  const [selectedItem, setSelectedItem]           = useState(null);
  const [lihatSemuaSection, setLihatSemuaSection] = useState(null);
  const [showRiwayat, setShowRiwayat]             = useState(false);
  const [paramError, setParamError]               = useState("");
  const [tableValidating, setTableValidating]     = useState(false);
  const [tableOk, setTableOk]                     = useState(null);
  const [validateKey, setValidateKey]             = useState(0);
  const [cart, setCart]                           = useState(locationState?.existingCart ?? {});
  const [showEmptyCartConfirm, setShowEmptyCartConfirm] = useState(false);
  const [pendingReplace, setPendingReplace] = useState(null);
  const sectionRefs                               = useRef({});

  const { data: menuRaw, loading: menuLoading, error: menuError, refetch: refetchMenu } = useApi(
    () => CAFE_ID ? api.get(`api/menu/user/${CAFE_ID}`).then(r => r.data ?? r) : Promise.resolve([]),
    [CAFE_ID]
  );
  const { data: categoriesRaw, loading: catLoading, error: catError, refetch: refetchCat } = useApi(
    () => CAFE_ID ? api.get(`api/kategori/user/${CAFE_ID}`).then(r => r.data ?? r) : Promise.resolve([]),
    [CAFE_ID]
  );
  const { data: cafeRaw, loading: cafeLoading, error: cafeError, refetch: refetchCafe } = useApi(
    () => CAFE_ID ? api.get(`api/pengaturan/user/${CAFE_ID}`).then(r => r.data ?? r) : Promise.resolve(null),
    [CAFE_ID]
  );

  useEffect(() => {
    setParamError(""); setTableOk(null); setTableValidating(false);
    if (!CAFE_ID) { setParamError("Cafe tidak ditemukan"); return; }
    const mejaN = Number(MEJA_ID);
    if (!Number.isFinite(mejaN) || mejaN <= 0) { setParamError("Meja tidak ditemukan"); return; }
    setTableValidating(true);
    const token = tokenManager.get() || localStorage.getItem("token") || "";
    fetch(`${BASE_URL}/api/tables`, {
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
      .then(r => r.json())
      .then(r => {
        const list = r?.data ?? r?.tables ?? r ?? [];
        const arr  = Array.isArray(list) ? list : [];
        const exists = arr.some(t => {
          const no = Number(t.nomor_meja ?? t.no_meja ?? t.meja ?? t.id);
          const tCafe = t.cafe_id ?? t.cafeId ?? t.cafe ?? null;
          if (no !== mejaN) return false;
          return tCafe == null || String(tCafe) === String(CAFE_ID);
        });
        if (!exists && arr.length > 0) console.warn("Meja tidak ditemukan di API, bypass validasi");
        setTableOk(true);
      })
      .catch(() => setTableOk(true))
      .finally(() => setTableValidating(false));
  }, [CAFE_ID, MEJA_ID, validateKey]);

  useEffect(() => {
    if (!CAFE_ID || cafeLoading) return;
    if (cafeError || !cafeRaw) setParamError("Cafe tidak ditemukan");
  }, [CAFE_ID, cafeLoading, cafeError, cafeRaw]);

  const cafeProfile = useMemo(() => ({
    nama:   cafeRaw?.nama_cafe  ?? cafeRaw?.nama    ?? cafeRaw?.name   ?? "ASTAKIRA",
    alamat: cafeRaw?.alamat     ?? cafeRaw?.address ?? cafeRaw?.lokasi ?? "",
    logo:   fixImgUrl(cafeRaw?.logo_cafe ?? cafeRaw?.logo ?? cafeRaw?.foto ?? cafeRaw?.icon ?? ""),
  }), [cafeRaw]);

  const theme = useMemo(() => parseTheme(cafeRaw?.tema_colors), [cafeRaw]);

  useEffect(() => {
    applyThemeVars(theme);
    try { localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(theme)); } catch {}
    return () => document.documentElement.removeAttribute("style");
  }, [theme]);

  const menuDatabase     = useMemo(() => menuRaw ? buildMenuDatabase(menuRaw) : {}, [menuRaw]);
  const normalizedCats   = useMemo(() => (categoriesRaw ?? []).map(normalizeCategory), [categoriesRaw]);
  const categorySections = useMemo(() => buildCategorySections(normalizedCats, menuDatabase), [normalizedCats, menuDatabase]);
  const categories       = useMemo(() => [{ id:"all", label:"Semua", logo:"" }, ...normalizedCats], [normalizedCats]);

  const allItems   = Object.values(menuDatabase);
  const totalQty   = Object.values(cart).reduce((a, b) => a + (b?.qty || 0), 0);
  const totalPrice = Object.entries(cart).reduce((sum, [id, item]) => {
    const menuItem = menuDatabase[id];
    if (!menuItem) return sum;
    const qty = item?.qty || 0;
    const basePrice = menuItem.price || 0;
    const variantsPrice = (item?.variants || []).reduce((vsum, v) => vsum + (v?.hargaVariant || 0), 0);
    return sum + (qty * (basePrice + variantsPrice));
  }, 0);
  const cartItems  = allItems.filter(item => (cart[item.id]?.qty || 0) > 0);
  const isLoading  = menuLoading || catLoading;
  const hasError   = (menuError || catError) && !isLoading;

  if (tableValidating || cafeLoading) {
    return (
      <div className="relative min-h-screen" style={{ background:"var(--bg)", color:"var(--tx)" }}>
        <div className="max-w-md mx-auto"><SkeletonSection /><SkeletonSection /><SkeletonSection /></div>
      </div>
    );
  }

  if (paramError) {
    return (
      <div className="relative min-h-screen" style={{ background:"var(--bg)", color:"var(--tx)" }}>
        <div className="max-w-md mx-auto px-4 py-8">
          <ErrorState message={paramError} onRetry={() => { setParamError(""); setValidateKey(k => k+1); refetchCafe(); refetchMenu(); refetchCat(); }} />
        </div>
      </div>
    );
  }

  const openItemSheet = (item) => setSelectedItem(item);

  const addItem = (id) => setCart(prev => {
    const existingItem = prev[id] || {};
    return {
      ...prev,
      [id]: {
        qty: (existingItem.qty || 0) + 1,
        variants: existingItem.variants || [],
        catatan: existingItem.catatan || "",
        currentPrice: existingItem.currentPrice || 0
      }
    };
  });

  const removeItem = (id) => setCart(prev => {
    const u = { ...prev };
    if (u[id]?.qty > 1) {
      u[id] = { ...u[id], qty: u[id].qty - 1 };
    } else {
      delete u[id];
    }
    return u;
  });

  const handleSheetAdd = (id, qty, currentPrice, { variants, catatan }) => {
    setCart(prev => {
      const existing = prev?.[id] || null;

      const nextVariants = variants || [];
      const nextCatatan = catatan || "";

      const existingVariantSig = JSON.stringify((existing?.variants || []).map(v => ({
        idVariant: v?.idVariant ?? v?.id,
        namaGroup: v?.namaGroup,
        label: v?.label,
        hargaVariant: v?.hargaVariant ?? 0,
      })));
      const nextVariantSig = JSON.stringify(nextVariants.map(v => ({
        idVariant: v?.idVariant ?? v?.id,
        namaGroup: v?.namaGroup,
        label: v?.label,
        hargaVariant: v?.hargaVariant ?? 0,
      })));

      const willReplace = !!existing && ((existingVariantSig !== nextVariantSig) || String(existing?.catatan || "") !== String(nextCatatan));

      if (willReplace) {
        setPendingReplace({ id, qty, currentPrice, variants: nextVariants, catatan: nextCatatan });
        return prev;
      }

      return {
        ...prev,
        [id]: {
          qty: (prev[id]?.qty || 0) + qty,
          variants: nextVariants,
          catatan: nextCatatan,
          currentPrice: currentPrice || 0,
        }
      };
    });
  };

  const handleCheckout = () => {
    if (totalQty <= 0) {
      setShowEmptyCartConfirm(true);
      return;
    }
    navigate("/pesanan", { state: { cart, items: cartItems, cafeId: CAFE_ID, mejaId: MEJA_ID } });
  };

  const handleNavigateToPesanan = ({ cart: oc, items: oi, orderId }) =>
    navigate("/pesanan", { state: { cart: oc, items: oi, cafeId: CAFE_ID, mejaId: MEJA_ID, fromRiwayat: true, orderId } });

  const handleReorder = ({ cart: rc }) => {
    const merged = { ...cart };
    Object.entries(rc).forEach(([id, qty]) => { merged[id] = (merged[id]||0)+qty; });
    setCart(merged);
    navigate("/pesanan", { state: { cart: merged, items: Object.values(menuDatabase).filter(m => merged[m.id]), cafeId: CAFE_ID, mejaId: MEJA_ID, isReorder: true } });
  };

  const handleCategoryClick = (catId) => {
    setActiveCategory(catId);
    if (catId === "all") { window.scrollTo({ top:0, behavior:"smooth" }); return; }
    const el = sectionRefs.current[catId];
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 172, behavior:"smooth" });
  };

  return (
    <div className="relative min-h-screen" style={{ background:"var(--bg)", color:"var(--tx)" }}>
      {/* NAVBAR */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-md flex-shrink-0" style={{ background:"var(--grad)" }}>
                {cafeProfile.logo ? (
                  <img src={cafeProfile.logo} alt={cafeProfile.nama} className="w-full h-full object-cover"
                    onError={e => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.parentElement.innerHTML = `<span style="color:var(--on-p);font-weight:800;font-size:1.125rem">${cafeProfile.nama.charAt(0).toUpperCase()}</span>`;
                    }} />
                ) : (
                  <span style={{ color:"var(--on-p)", fontWeight:800, fontSize:"1.125rem" }}>{cafeProfile.nama.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="font-extrabold text-sm text-gray-900 leading-none">{cafeProfile.nama}</p>
                {cafeProfile.alamat && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin size={10} style={{ color:"var(--p)" }} />
                    <p className="text-xs text-gray-400 max-w-[160px] truncate">{cafeProfile.alamat}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate(`/search?table=${MEJA_ID}&cafe_id=${CAFE_ID}`)}
                className="w-9 h-9 flex items-center justify-center rounded-xl transition-all"
                style={{ background:"var(--bg-soft)" }}>
                <Search size={17} style={{ color:"var(--p)" }} />
              </button>
              <button onClick={() => setShowRiwayat(true)}
                className="flex items-center gap-1.5 rounded-xl px-3 h-9 shadow-md hover:shadow-lg transition-all"
                style={{ background:"var(--grad)" }}>
                <ShoppingBag size={15} style={{ color:"var(--on-p)" }} />
                <span className="text-xs font-bold" style={{ color:"var(--on-p)" }}>Riwayat</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {/* MEJA BANNER */}
        <div className="px-4 pt-4 mb-5">
          <div className="rounded-2xl px-5 py-3.5 flex items-center justify-center shadow-lg" style={{ background:"var(--grad)" }}>
            <p className="font-bold text-base" style={{ color:"var(--on-p)" }}>Meja Nomor {MEJA_ID}</p>
          </div>
        </div>

        {/* CATEGORY BAR */}
        <div className="sticky top-16 z-30 pb-3 pt-2" style={{ background:"var(--bg)" }}>
          <div className="px-4 mb-2">
            <h2 className="text-base font-bold text-gray-900">Pilihan Kuliner Favoritmu</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide px-4 pt-2">
            {catLoading
              ? Array.from({ length:5 }).map((_,i) => (
                  <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1.5 animate-pulse">
                    <div className="w-14 h-14 rounded-2xl bg-gray-200" />
                    <div className="h-2 w-12 bg-gray-200 rounded" />
                  </div>
                ))
              : categories.map(cat => {
                  const isActive = activeCategory === String(cat.id);
                  return (
                    <button key={cat.id} onClick={() => handleCategoryClick(String(cat.id))}
                      className="flex-shrink-0 flex flex-col items-center gap-1.5">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center transition-all duration-200"
                        style={{
                          background: "var(--grad)",
                          transform:  isActive ? "scale(1.1)" : "scale(1)",
                          boxShadow:  isActive ? `0 8px 20px var(--p-20)` : "0 1px 4px rgba(0,0,0,0.08)",
                          outline:    isActive ? "2px solid var(--p)" : "none",
                          outlineOffset: "2px",
                        }}>
                        {cat.id === "all" ? (
                          <Image size={22} style={{ color:"var(--on-p)" }} />
                        ) : cat.logo ? (
                          <img src={cat.logo} alt={cat.label} className="w-full h-full object-cover"
                            onError={e => {
                              e.currentTarget.style.display = "none";
                              e.currentTarget.parentElement.innerHTML =
                                `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
                            }} />
                        ) : (
                          <Image size={22} style={{ color:"var(--on-p)", opacity:0.8 }} />
                        )}
                      </div>
                      <span className="text-[11px] font-semibold whitespace-nowrap"
                        style={{ color: "white" }}>
                        {cat.label}
                      </span>
                    </button>
                  );
                })}
          </div>
        </div>

        {/* MENU SECTIONS */}
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
          return (
            <div key={section.id} id={`section-${section.id}`}
              ref={el => { sectionRefs.current[String(section.id)] = el; }}
              className="mb-8">
              <div className="px-4 flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center shadow-sm flex-shrink-0" style={{ background:"var(--grad)" }}>
                    {section.logo ? (
                      <img src={section.logo} alt={section.label} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = "none"; }} />
                    ) : (
                      <Image size={16} style={{ color:"var(--on-p)" }} />
                    )}
                  </div>
                  <h2 className="text-base font-bold text-gray-900">{section.label}</h2>
                </div>
                <button onClick={() => setLihatSemuaSection(section)} className="text-xs font-semibold transition-colors" style={{ color:"var(--p)" }}>
                  Lihat Semua →
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-4">
                {sectionItems.map(item => (
                  <MenuCard key={item.id} item={item} qty={cart[item.id]?.qty || 0}
                    onAdd={() => openItemSheet(item)} onRemove={() => removeItem(item.id)}
                    onClick={() => openItemSheet(item)} />
                ))}
              </div>
            </div>
          );
        })}

        {/* FLOATING CHECKOUT */}
        {totalQty > 0 && !selectedItem && (
          <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6">
            <div className="max-w-md mx-auto">
              <button onClick={handleCheckout}
                className="w-full rounded-3xl p-5 shadow-2xl hover:scale-[1.01] transition-all border"
                style={{ background:"var(--grad)", borderColor:"var(--p-20)" }}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 relative">
                      <ShoppingBag style={{ color:"var(--on-p)" }} size={20} />
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">{totalQty}</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-medium mb-0.5" style={{ color:"var(--on-p)", opacity:0.8 }}>{totalQty} Item dipilih</p>
                      <p className="text-xl font-bold" style={{ color:"var(--on-p)" }}>Rp{totalPrice.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="bg-white px-6 py-3 rounded-2xl font-bold shadow-xl whitespace-nowrap" style={{ color:"var(--p)" }}>Checkout →</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {showRiwayat && (
        <RiwayatPesananSheet menuDatabase={menuDatabase} mejaId={MEJA_ID} cafeId={CAFE_ID}
          cafeName={cafeProfile.nama} onClose={() => setShowRiwayat(false)}
          onNavigateToPesanan={handleNavigateToPesanan} onReorder={handleReorder} />
      )}
      {lihatSemuaSection && (
        <LihatSemuaPopup section={lihatSemuaSection} cart={cart} menuDatabase={menuDatabase}
          onAdd={addItem} onRemove={removeItem} onItemClick={setSelectedItem}
          onClose={() => setLihatSemuaSection(null)} />
      )}
      {selectedItem && (
        <MenuDetailSheet item={selectedItem} menuDatabase={menuDatabase} cafeId={CAFE_ID}
          onClose={() => setSelectedItem(null)} onAddToCart={handleSheetAdd}
          onOpenItem={item => setSelectedItem(item)} />
      )}

      <ActionConfirmModal
        open={showEmptyCartConfirm}
        icon="🛒"
        title="Keranjang kosong"
        message="Tambahkan menu dulu sebelum checkout."
        cancelText="Tutup"
        confirmText="Oke"
        onCancel={() => setShowEmptyCartConfirm(false)}
        onConfirm={() => setShowEmptyCartConfirm(false)}
      />

      <ActionConfirmModal
        open={!!pendingReplace}
        icon="🧾"
        title="Ganti pilihan varian?"
        message="Menu ini sudah ada di keranjang. Jika kamu lanjut, varian/catatan sebelumnya akan diganti mengikuti pilihan terbaru."
        cancelText="Batal"
        confirmText="Ganti"
        onCancel={() => setPendingReplace(null)}
        onConfirm={() => {
          const p = pendingReplace;
          if (!p) return;
          setCart(prev => ({
            ...prev,
            [p.id]: {
              qty: (prev[p.id]?.qty || 0) + (p.qty || 0),
              variants: p.variants || [],
              catatan: p.catatan || "",
              currentPrice: p.currentPrice || 0,
            }
          }));
          setPendingReplace(null);
        }}
      />
      <style>{`
        .line-clamp-1 { display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden; }
        .line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      `}</style>
    </div>
  );
}