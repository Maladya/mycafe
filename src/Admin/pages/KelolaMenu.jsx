import { useState, useEffect, useRef } from "react";
import { Plus, Search, Image, Edit3, Trash2, ChevronLeft, ChevronRight, X, Smile } from "lucide-react";
import { defaultCategories, getCatColor } from "../data/constants";
import { useAdmin } from "../AdminPanel";
import MenuForm from "../components/MenuForm";
import { ConfirmDialog } from "../components/SharedComponents";

const API_URL = import.meta.env.VITE_API_URL ?? "http://192.168.1.2:3000";
const PER_PAGE = 6;

// ── Daftar emoji untuk picker ────────────────────────────────────────────────
const EMOJI_LIST = [
  "☕","🍵","🧋","🥤","🍹","🍺","🧃","🥛","🍶",
  "🍕","🍔","🌮","🌯","🥪","🥗","🍜","🍝","🍛",
  "🍱","🍣","🍤","🍗","🥩","🍖","🥚","🧆","🫕",
  "🍰","🎂","🧁","🍩","🍪","🍫","🍬","🍮","🍧",
  "🥐","🥖","🧇","🥞","🧈","🫔","🌽","🥦","🥕",
  "🍟","🌭","🫙","🥣","🥘","🍲","🥫","🫕","🍥",
  "🍿","🧂","🫒","🥜","🌰","🥨","🍡","🍢","🥮",
  "🎁","⭐","🔥","💎","👑","🏆","🎯","💫","✨",
];

// ── Normalisasi URL gambar ────────────────────────────────────────────────────
// Ambil logo dari objek kategori — cek semua kemungkinan field name
const getCatLogo = (c) => c?.logo ?? c?.icon ?? "";

// Deteksi apakah string adalah URL/base64 gambar (bukan emoji)
const isImageSrc = (str) => {
  if (!str) return false;
  return str.startsWith("http") || str.startsWith("https") || str.startsWith("data:image") || str.startsWith("/");
};

// Komponen logo kategori — otomatis render <img> atau emoji/teks
function CatLogo({ logo, size = 20, className = "" }) {
  if (!logo) return null;
  if (isImageSrc(logo)) {
    return (
      <img
        src={logo}
        alt="logo"
        style={{ width: size, height: size }}
        className={`rounded-md object-cover flex-shrink-0 ${className}`}
        onError={e => { e.currentTarget.style.display = "none"; }}
      />
    );
  }
  // Emoji / teks biasa
  return <span className="leading-none flex-shrink-0" style={{ fontSize: size - 4 }}>{logo}</span>;
}

const fixImgUrl = (url) => {
  if (!url?.trim()) return "";
  try {
    const parsed = new URL(url);
    const base   = new URL(API_URL);
    if (parsed.host !== base.host) {
      parsed.host     = base.host;
      parsed.protocol = base.protocol;
    }
    return parsed.toString();
  } catch {
    return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  }
};

// ── Emoji Picker Modal ────────────────────────────────────────────────────────
function EmojiPicker({ currentEmoji, onSelect, onClose }) {
  const ref = useRef(null);

  // Tutup saat klik di luar
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div ref={ref} className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-black text-gray-900 text-base">Pilih Logo Kategori</h3>
            <p className="text-xs text-gray-400 mt-0.5">Tap emoji untuk memilih</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center text-gray-500 transition-all">
            <X size={15}/>
          </button>
        </div>

        {/* Preview current */}
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-amber-200">
            {currentEmoji || "?"}
          </div>
          <div>
            <p className="text-xs text-gray-500">Logo saat ini</p>
            <p className="text-sm font-bold text-gray-700">{currentEmoji || "Belum dipilih"}</p>
          </div>
        </div>

        {/* Emoji grid */}
        <div className="p-4 grid grid-cols-9 gap-1.5 max-h-64 overflow-y-auto scrollbar-hide">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSelect(emoji)}
              className={`w-9 h-9 flex items-center justify-center text-xl rounded-xl transition-all hover:bg-amber-100 hover:scale-110 active:scale-95 ${currentEmoji === emoji ? "bg-amber-500 shadow-md scale-110" : "hover:bg-amber-50"}`}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Hapus logo */}
        <div className="px-4 pb-4">
          <button
            onClick={() => onSelect("")}
            className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 font-semibold hover:border-red-300 hover:text-red-400 transition-all"
          >
            🗑️ Hapus Logo
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Kategori Modal ───────────────────────────────────────────────────────
function EditKategoriModal({ kategori, onSave, onClose, saving }) {
  const [nama,  setNama]  = useState(kategori?.nama_kategori ?? "");
  const [icon,  setIcon]  = useState(kategori?.icon ?? "");
  const [showPicker, setShowPicker] = useState(false);

  const handleSubmit = () => {
    if (!nama.trim()) return;
    onSave({ ...kategori, nama_kategori: nama.trim(), icon });
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h3 className="font-black text-gray-900 text-base">
            {kategori?.id ? "Edit Kategori" : "Tambah Kategori"}
          </h3>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center text-gray-500 transition-all">
            <X size={15}/>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Logo picker */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Logo / Ikon</label>
            <button
              onClick={() => setShowPicker(true)}
              className="flex items-center gap-3 w-full border-2 border-dashed border-gray-200 hover:border-amber-400 rounded-2xl px-4 py-3 transition-all group"
            >
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-2xl group-hover:bg-amber-100 transition-all border border-amber-200">
                {icon || <Smile size={20} className="text-amber-400"/>}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-700">{icon ? "Ganti Logo" : "Pilih Logo"}</p>
                <p className="text-xs text-gray-400">Tap untuk pilih emoji</p>
              </div>
            </button>
          </div>

          {/* Nama kategori */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Nama Kategori</label>
            <input
              value={nama}
              onChange={e => setNama(e.target.value)}
              placeholder="Contoh: Kopi, Makanan, Dessert..."
              className="w-full border-2 border-gray-200 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
            />
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-2xl p-3 flex items-center gap-3">
            <span className="text-xs text-gray-400 font-semibold">Preview:</span>
            <div className="flex items-center gap-2 bg-amber-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold">
              {icon && <span>{icon}</span>}
              <span>{nama || "Nama Kategori"}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !nama.trim()}
              className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </div>

      {/* Emoji Picker */}
      {showPicker && (
        <EmojiPicker
          currentEmoji={icon}
          onSelect={(e) => { setIcon(e); setShowPicker(false); }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}

// ── Main: KelolaMenu ──────────────────────────────────────────────────────────
export default function KelolaMenu() {
  const { menuItems, setMenuItems, showToast } = useAdmin();

  const [categories,    setCategories]    = useState(defaultCategories);
  const [search,        setSearch]        = useState("");
  const [catFilter,     setCatFilter]     = useState("all");
  const [showForm,      setShowForm]      = useState(false);
  const [editItem,      setEditItem]      = useState(null);
  const [confirmDel,    setConfirmDel]    = useState(null);
  const [page,          setPage]          = useState(1);
  const [saving,        setSaving]        = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [showDetail,    setShowDetail]    = useState(null);

  // State untuk kelola kategori
  const [editKategori,   setEditKategori]  = useState(null);  // null = tutup, {} = tambah baru, obj = edit
  const [savingKat,      setSavingKat]     = useState(false);
  const [confirmDelKat,  setConfirmDelKat] = useState(null);
  const [deletingKat,    setDeletingKat]   = useState(false);
  const [manageKatMode,  setManageKatMode] = useState(false); // mode kelola kategori

  // ── Fetch kategori ───────────────────────────────────────────────────────
  const fetchKategori = async () => {
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`${API_URL}/api/kategori`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const list = data.data ?? data.kategori ?? data.categories ?? [];
      if (Array.isArray(list) && list.length > 0) setCategories(list);
    } catch (err) { console.error("Fetch kategori error:", err); }
  };

  useEffect(() => { fetchKategori(); }, []);

  // ── Fetch menu ───────────────────────────────────────────────────────────
  const fetchMenu = async () => {
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`${API_URL}/api/menu`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const items = data.data ?? data.menu ?? data.items ?? [];
        setMenuItems(items);
      }
    } catch (err) { console.error("Fetch menu error:", err); }
  };

  useEffect(() => { fetchMenu(); }, []);

  // ── Simpan Kategori (tambah / edit) ────────────────────────────────────
  const handleSaveKategori = async (kat) => {
    setSavingKat(true);
    try {
      const token  = localStorage.getItem("token");
      const isEdit = !!kat.id;

      const res = await fetch(
        isEdit ? `${API_URL}/api/kategori/${kat.id}` : `${API_URL}/api/kategori`,
        {
          method:  isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body:    JSON.stringify({ nama_kategori: kat.nama_kategori, icon: kat.icon }),
        }
      );

      const data = await res.json();
      if (!res.ok || data.success === false) {
        showToast(data.message ?? "Gagal menyimpan kategori", "error");
        return;
      }

      await fetchKategori();
      showToast(isEdit ? "Kategori diupdate!" : "Kategori ditambahkan!", "success");
      setEditKategori(null);

    } catch (err) {
      console.error("handleSaveKategori error:", err);
      showToast("Gagal terhubung ke server", "error");
    } finally {
      setSavingKat(false);
    }
  };

  // ── Hapus Kategori ──────────────────────────────────────────────────────
  const handleDelKategori = async (id) => {
    setDeletingKat(true);
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`${API_URL}/api/kategori/${id}`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        showToast(data.message ?? "Gagal menghapus kategori", "error");
        return;
      }
      setCategories(p => p.filter(c => c.id !== id));
      setConfirmDelKat(null);
      showToast("Kategori dihapus!", "success");
    } catch (err) {
      console.error("handleDelKategori error:", err);
      showToast("Gagal terhubung ke server", "error");
    } finally {
      setDeletingKat(false);
    }
  };

  // ── Update icon kategori langsung (quick-edit dari filter bar) ──────────
  const handleQuickIconUpdate = async (kat, newIcon) => {
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`${API_URL}/api/kategori/${kat.id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ ...kat, icon: newIcon }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        showToast(data.message ?? "Gagal update logo", "error");
        return;
      }
      setCategories(p => p.map(c => c.id === kat.id ? { ...c, icon: newIcon } : c));
      showToast("Logo kategori diupdate!", "success");
    } catch (err) {
      showToast("Gagal terhubung ke server", "error");
    }
  };

  // ── Filter & Pagination ──────────────────────────────────────────────────
  const filtered   = (menuItems ?? []).filter(m =>
    (catFilter === "all" || String(m.id_kategori) === catFilter || m.nama_kategori === catFilter) &&
    (m.nama_menu ?? "").toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged      = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ── Tambah / Edit Menu ───────────────────────────────────────────────────
  const handleSave = async (item) => {
    setSaving(true);
    try {
      const token  = localStorage.getItem("token");
      const isEdit = !!editItem;

      const res = await fetch(
        isEdit ? `${API_URL}/api/menu/${item.id}` : `${API_URL}/api/menu`,
        {
          method:  isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(item),
        }
      );
      const data = await res.json();
      if (!res.ok || data.success === false) {
        showToast(data.message ?? data.error ?? "Gagal menyimpan menu", "error");
        return;
      }
      await fetchMenu();
      showToast(isEdit ? "Menu diupdate!" : "Menu ditambahkan!", "success");
      setShowForm(false);
      setEditItem(null);
    } catch (err) {
      showToast("Gagal terhubung ke server", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Hapus Menu ───────────────────────────────────────────────────────────
  const handleDel = async (id) => {
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`${API_URL}/api/menu/${id}`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        showToast(data.message ?? "Gagal menghapus menu", "error");
        return;
      }
      setMenuItems(p => p.filter(m => m.id !== id));
      setConfirmDel(null);
      showToast("Menu dihapus!", "success");
    } catch (err) {
      showToast("Gagal terhubung ke server", "error");
    } finally {
      setDeleting(false);
    }
  };

  // ── Toggle Stok ──────────────────────────────────────────────────────────
  const toggleStock = async (id) => {
    const item    = menuItems.find(m => m.id === id);
    const updated = { ...item, status: !item.status };
    setMenuItems(p => p.map(m => m.id === id ? updated : m));
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`${API_URL}/api/menu/${id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        setMenuItems(p => p.map(m => m.id === id ? item : m));
        showToast(data.message ?? "Gagal update stok", "error");
        return;
      }
      showToast("Stok diupdate!", "success");
    } catch (err) {
      setMenuItems(p => p.map(m => m.id === id ? item : m));
      showToast("Gagal terhubung ke server", "error");
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-gray-900">Kelola Menu</h1>
          <p className="text-gray-400 text-sm">
            {(menuItems ?? []).length} item · {(menuItems ?? []).filter(m => !m.status).length} stok habis
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setManageKatMode(v => !v)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-bold text-sm border-2 transition-all ${manageKatMode ? "border-amber-500 bg-amber-50 text-amber-700" : "border-gray-200 bg-white text-gray-600 hover:border-amber-300"}`}
          >
            <Smile size={15}/> Kategori
          </button>
          <button
            onClick={() => { setEditItem(null); setShowForm(true); }}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl px-4 py-2.5 font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all text-sm"
          >
            <Plus size={16}/> Tambah Menu
          </button>
        </div>
      </div>

      {/* ── Panel Kelola Kategori ── */}
      {manageKatMode && (
        <div className="bg-white rounded-2xl border-2 border-amber-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 bg-amber-50 border-b border-amber-100">
            <div>
              <h2 className="font-black text-gray-900 text-sm">Kelola Kategori</h2>
              <p className="text-xs text-gray-400">Atur nama & logo setiap kategori</p>
            </div>
            <button
              onClick={() => setEditKategori({})}
              className="flex items-center gap-1.5 bg-amber-500 text-white rounded-xl px-3 py-2 text-xs font-bold hover:bg-amber-600 transition-all"
            >
              <Plus size={13}/> Tambah
            </button>
          </div>

          <div className="p-4 flex flex-wrap gap-3">
            {categories.map(kat => (
              <div
                key={kat.id}
                className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl pl-2 pr-3 py-2 group hover:border-amber-300 hover:bg-amber-50 transition-all"
              >
                {/* Logo / icon */}
                <button
                  onClick={() => setEditKategori(kat)}
                  title="Klik untuk ganti logo"
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-xl hover:border-amber-400 hover:scale-110 transition-all shadow-sm relative group/icon"
                >
                  {kat.icon
                    ? <span>{kat.icon}</span>
                    : <Smile size={16} className="text-gray-300"/>
                  }
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center opacity-0 group-hover/icon:opacity-100 transition-all shadow">
                    <Edit3 size={8} className="text-white"/>
                  </span>
                </button>

                {/* Nama */}
                <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                  {kat.nama_kategori ?? kat.name}
                </span>

                {/* Action buttons — muncul saat hover */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => setEditKategori(kat)}
                    className="w-6 h-6 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center text-blue-500 transition-all"
                  >
                    <Edit3 size={11}/>
                  </button>
                  <button
                    onClick={() => setConfirmDelKat(kat.id)}
                    className="w-6 h-6 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center text-red-400 transition-all"
                  >
                    <Trash2 size={11}/>
                  </button>
                </div>
              </div>
            ))}

            {categories.length === 0 && (
              <p className="text-sm text-gray-400 py-4 w-full text-center">Belum ada kategori. Tambah kategori dulu!</p>
            )}
          </div>
        </div>
      )}

      {/* ── Search + Category Filter ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari menu..."
            className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-amber-500 transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {/* Tombol Semua */}
          <button
            onClick={() => { setCatFilter("all"); setPage(1); }}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${catFilter === "all" ? "bg-amber-500 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            🍽️ Semua
          </button>

          {/* Tombol per kategori dengan logo */}
          {categories.map(c => {
            const val   = String(c?.id ?? c?.nama_kategori ?? c);
            const label = c?.nama_kategori ?? c?.name ?? c;
            const logo  = getCatLogo(c);
            return (
              <button
                key={val}
                onClick={() => { setCatFilter(val); setPage(1); }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${catFilter === val ? "bg-amber-500 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                <CatLogo logo={logo} size={18}/>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Foto</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Nama Menu</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Kategori</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Harga / Varian</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Stok</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.map(item => {
                // Ambil logo dari kategori yang cocok
                const katObj  = categories.find(c => String(c?.id) === String(item.id_kategori));
                const katLogo = getCatLogo(katObj);
                return (
                  <tr key={item.id} onClick={() => setShowDetail(item)} className="hover:bg-amber-50/30 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative">
                        {fixImgUrl(item.image_url)
                          ? <img
                              src={fixImgUrl(item.image_url)}
                              alt={item.nama_menu}
                              className="w-full h-full object-cover"
                              onError={e => {
                                e.currentTarget.replaceWith((() => {
                                  const d = document.createElement("div");
                                  d.className = "w-full h-full flex items-center justify-center";
                                  d.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
                                  return d;
                                })());
                              }}
                            />
                          : <div className="w-full h-full flex items-center justify-center">
                              <Image size={16} className="text-gray-300"/>
                            </div>
                        }
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate max-w-[150px] lg:max-w-none">{item.nama_menu}</p>
                        {item.badge && <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${getCatColor(item.id_kategori)}`}>
                        <CatLogo logo={katLogo} size={16}/>
                        {item.nama_kategori ?? katObj?.nama_kategori ?? item.id_kategori}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-gray-900">Rp{Number(item.harga ?? item.price ?? 0).toLocaleString("id-ID")}</span>
                      {item.variants && item.variants.length > 1 && (
                        <p className="text-[10px] text-blue-500 font-semibold mt-0.5">{item.variants.length} varian</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStock(item.id); }}
                        className={`w-12 h-6 rounded-full transition-all duration-300 relative ${item.status ? "bg-green-500" : "bg-gray-300"}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${item.status ? "left-[26px]" : "left-0.5"}`}/>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditItem(item); setShowForm(true); }}
                          className="w-8 h-8 bg-blue-50 hover:bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 transition-all"
                        >
                          <Edit3 size={14}/>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDel(item.id); }}
                          className="w-8 h-8 bg-red-50 hover:bg-red-100 rounded-xl flex items-center justify-center text-red-500 transition-all"
                        >
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paged.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">Tidak ada menu ditemukan</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">{filtered.length} item · hal {page}/{totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-all"><ChevronLeft size={14}/></button>
              {Array.from({length:totalPages},(_,i)=>i+1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all ${p===page?"bg-amber-500 text-white shadow-md":"border border-gray-200 hover:bg-gray-50"}`}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-all"><ChevronRight size={14}/></button>
            </div>
          </div>
        )}
      </div>

      {/* ── Menu Form ── */}
      {showForm && (
        <MenuForm
          item={editItem}
          categories={categories}
          setCategories={setCategories}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditItem(null); }}
          saving={saving}
        />
      )}

      {/* ── Detail Menu Modal ── */}
      {showDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={() => setShowDetail(null)}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h2 className="text-lg font-black text-gray-900 truncate pr-2">{showDetail.nama_menu}</h2>
              <button onClick={() => setShowDetail(null)} className="flex-shrink-0 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center text-gray-500 transition-all">
                <X size={15}/>
              </button>
            </div>
            <div className="relative w-full h-52 bg-gray-100">
              {fixImgUrl(showDetail.image_url)
                ? <img src={fixImgUrl(showDetail.image_url)} alt={showDetail.nama_menu} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = "none"; }}/>
                : <div className="w-full h-full flex items-center justify-center text-gray-300"><Image size={48}/></div>
              }
              <span className={`absolute bottom-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full shadow ${showDetail.status ? "bg-green-500 text-white" : "bg-gray-400 text-white"}`}>
                {showDetail.status ? "✓ Tersedia" : "✗ Habis"}
              </span>
              {showDetail.badge && (
                <span className="absolute bottom-3 right-3 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">{showDetail.badge}</span>
              )}
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${getCatColor(showDetail.id_kategori)}`}>
                  {(() => {
                    const dc = categories.find(c => String(c?.id) === String(showDetail.id_kategori));
                    return <><CatLogo logo={getCatLogo(dc)} size={16}/>{" "}</>;
                  })()}
                  {showDetail.nama_kategori ?? categories.find(c => String(c?.id) === String(showDetail.id_kategori))?.nama_kategori ?? showDetail.id_kategori}
                </span>
                <p className="text-xl font-black text-amber-600">Rp{Number(showDetail.harga ?? 0).toLocaleString("id-ID")}</p>
              </div>
              {showDetail.description
                ? <div className="bg-gray-50 rounded-2xl px-4 py-3"><p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Deskripsi</p><p className="text-sm text-gray-600 leading-relaxed">{showDetail.description}</p></div>
                : <div className="bg-gray-50 rounded-2xl px-4 py-3"><p className="text-sm text-gray-400 italic">Tidak ada deskripsi</p></div>
              }
              {showDetail.variants && showDetail.variants.length > 0 && showDetail.variants[0]?.label && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Varian</p>
                  <div className="flex flex-wrap gap-2">
                    {showDetail.variants.map((v, i) => (
                      <div key={i} className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-center">
                        <p className="text-xs font-semibold text-gray-700">{v.label}</p>
                        {v.harga && <p className="text-xs text-amber-600 font-bold mt-0.5">Rp{Number(v.harga).toLocaleString("id-ID")}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button onClick={() => { setEditItem(showDetail); setShowForm(true); setShowDetail(null); }} className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl py-2.5 font-semibold text-sm transition-all">
                  <Edit3 size={14}/> Edit Menu
                </button>
                <button onClick={() => { setConfirmDel(showDetail.id); setShowDetail(null); }} className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl py-2.5 font-semibold text-sm transition-all">
                  <Trash2 size={14}/> Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Kategori Modal ── */}
      {editKategori !== null && (
        <EditKategoriModal
          kategori={editKategori}
          onSave={handleSaveKategori}
          onClose={() => setEditKategori(null)}
          saving={savingKat}
        />
      )}

      {/* ── Konfirmasi hapus menu ── */}
      {confirmDel && (
        <ConfirmDialog
          msg="Yakin hapus menu ini?"
          onConfirm={() => handleDel(confirmDel)}
          onCancel={() => setConfirmDel(null)}
          loading={deleting}
        />
      )}

      {/* ── Konfirmasi hapus kategori ── */}
      {confirmDelKat && (
        <ConfirmDialog
          msg="Yakin hapus kategori ini? Menu yang menggunakan kategori ini tidak ikut terhapus."
          onConfirm={() => handleDelKategori(confirmDelKat)}
          onCancel={() => setConfirmDelKat(null)}
          loading={deletingKat}
        />
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}