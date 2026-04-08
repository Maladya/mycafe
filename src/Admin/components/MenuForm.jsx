import { useState, useRef, useEffect } from "react";
import {
  X, Image, Plus, Check, Trash2,
  Hash, Save, Upload, Loader2, Edit3, AlertCircle, Camera, ChevronDown, ChevronUp
} from "lucide-react";
import { Toast } from "./SharedComponents";

const API_URL = import.meta.env.VITE_API_URL ?? "https://www.mycafe-order.net";

const authHeaders = (json = true) => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
};

const fixImgUrl = (url) => {
  if (!url?.trim()) return "";
  if (url.startsWith("data:")) return url;
  if (url.startsWith("/")) return `${API_URL}${url}`;
  try {
    const parsed = new URL(url);
    const base   = new URL(API_URL);
    if (parsed.host !== base.host) return `${API_URL}${parsed.pathname}`;
    return parsed.toString();
  } catch {
    return `${API_URL}/${url}`;
  }
};

function useLogoUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState("");

  const upload = (file, onDone) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("File harus berupa gambar"); return; }
    if (file.size > 2 * 1024 * 1024)    { setError("Ukuran logo max 2MB"); return; }
    setError(""); setUploading(true);
    const reader = new FileReader();
    reader.onload  = (e) => { onDone(e.target.result); setUploading(false); };
    reader.onerror = ()  => { setError("Gagal membaca file"); setUploading(false); };
    reader.readAsDataURL(file);
  };

  return { upload, uploading, error, setError };
}

function LogoUploadButton({ logoUrl, onChange, size = "md" }) {
  const inputRef = useRef();
  const { upload, uploading, error, setError } = useLogoUpload();
  const fixedUrl = fixImgUrl(logoUrl);
  const dim = size === "sm" ? "w-9 h-9 text-[10px]" : "w-16 h-16 text-xs";

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`relative ${dim} rounded-xl overflow-hidden border-2 cursor-pointer group flex-shrink-0
          ${fixedUrl ? "border-amber-300" : "border-dashed border-gray-300 hover:border-amber-400 bg-gray-50"}`}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {fixedUrl ? (
          <>
            <img src={fixedUrl} alt="logo" className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display="none"; }}/>
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
              {uploading ? <Loader2 size={size==="sm"?10:14} className="text-white animate-spin"/> : <Camera size={size==="sm"?10:14} className="text-white"/>}
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {uploading ? <Loader2 size={size==="sm"?10:16} className="text-amber-500 animate-spin"/> : <Camera size={size==="sm"?10:16} className="text-gray-300"/>}
          </div>
        )}
      </div>
      {fixedUrl && (
        <button onClick={(e) => { e.stopPropagation(); onChange(""); setError(""); }}
          className="text-[9px] text-red-400 hover:text-red-600 font-semibold transition-all leading-none">
          Hapus
        </button>
      )}
      {error && <p className="text-[9px] text-red-500 text-center">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => upload(e.target.files?.[0], onChange)} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KOMPONEN: satu grup varian (nama + daftar pilihan)
// ─────────────────────────────────────────────────────────────────────────────
function VariantGroup({
  group,
  menuHarga,
  onUpdateNama,
  onToggleAktif,
  onAddPilihan,
  onUpdatePilihan,
  onDeletePilihan,
  onDeleteGroup,
  saving,
  deleting,
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`border-2 rounded-2xl overflow-hidden transition-all ${group.aktif ? "border-amber-300 bg-white" : "border-gray-200 bg-gray-50 opacity-60"}`}>
      {/* Header grup */}
      <div className={`flex items-center gap-2 px-4 py-3 ${group.aktif ? "bg-amber-50" : "bg-gray-100"}`}>

        {/* ── Checkbox aktif ── */}
        <button
          onClick={() => onToggleAktif(group.id)}
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
            group.aktif
              ? "bg-amber-500 border-amber-500"
              : "bg-white border-gray-300 hover:border-amber-400"
          }`}
          title={group.aktif ? "Nonaktifkan grup ini" : "Aktifkan grup ini"}
        >
          {group.aktif && <Check size={11} className="text-white"/>}
        </button>

        <div className="flex-1 flex items-center gap-2">
          <input
            value={group.namaVarian}
            onChange={e => onUpdateNama(group.id, e.target.value)}
            placeholder="Nama varian (mis. Ukuran, Suhu, Level Gula)"
            disabled={!group.aktif}
            className="flex-1 bg-transparent text-sm font-bold text-amber-800 outline-none placeholder-amber-300 border-b-2 border-transparent focus:border-amber-400 transition-all pb-0.5 disabled:text-gray-400 disabled:cursor-not-allowed"
          />
        </div>

        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${group.aktif ? "text-amber-500 bg-amber-100" : "text-gray-400 bg-gray-200"}`}>
          {group.pilihan.length} pilihan
        </span>
        <button
          onClick={() => setCollapsed(v => !v)}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-600 transition-all"
        >
          {collapsed ? <ChevronDown size={13}/> : <ChevronUp size={13}/>}
        </button>
        <button
          onClick={() => onDeleteGroup(group.id)}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-400 transition-all"
        >
          <Trash2 size={12}/>
        </button>
      </div>

      {!collapsed && group.aktif && (
        <div className="px-4 py-3 space-y-2">
          {/* List pilihan */}
          {group.pilihan.map((p, idx) => (
            <div key={p.id}
              className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
              {/* Nomor */}
              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                {idx + 1}
              </span>

              {/* Label pilihan */}
              <input
                value={p.label}
                onChange={e => onUpdatePilihan(group.id, p.id, "label", e.target.value)}
                placeholder="Label (mis. Small, Medium, Large)"
                className="flex-1 min-w-0 text-sm font-semibold text-gray-800 bg-transparent border-b-2 border-transparent focus:border-amber-400 outline-none transition-all placeholder-gray-300"
              />

              {/* Harga tambahan opsional */}
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <span className="text-[9px] text-gray-400 font-semibold text-center">Harga tambahan (opsional)</span>
                <div className="flex items-center gap-1 border-2 border-gray-200 rounded-xl px-2 py-1.5 bg-white focus-within:border-amber-400 transition-all w-36">
                  <span className="text-[10px] text-gray-400 font-semibold whitespace-nowrap">+Rp</span>
                  <input
                    type="number"
                    min="0"
                    value={p.hargaVariant}
                    onChange={e => onUpdatePilihan(group.id, p.id, "hargaVariant", e.target.value)}
                    placeholder="0"
                    className="flex-1 text-sm font-bold text-gray-800 bg-transparent outline-none w-0 min-w-0"
                  />
                </div>
                <span className="text-[9px] text-center font-semibold text-amber-500">
                  Harga tambahan saja
                </span>
              </div>

              {/* Hapus pilihan */}
              <button
                onClick={() => onDeletePilihan(group.id, p.id)}
                disabled={deleting === p.id}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-400 transition-all disabled:opacity-60 flex-shrink-0"
              >
                {deleting === p.id ? <Loader2 size={11} className="animate-spin"/> : <Trash2 size={11}/>}
              </button>
            </div>
          ))}

          {/* Tombol tambah pilihan — hanya satu tombol manual */}
          <button
            onClick={() => onAddPilihan(group.id)}
            className="w-full flex items-center justify-center gap-1.5 border-2 border-dashed border-amber-300 rounded-xl py-2.5 text-xs font-bold text-amber-600 hover:border-amber-500 hover:bg-amber-50 transition-all"
          >
            <Plus size={13}/> Tambah Pilihan
          </button>

          {group.pilihan.length === 0 && (
            <p className="text-center text-xs text-gray-400 py-1">
              Belum ada pilihan. Klik tombol di atas untuk menambah.
            </p>
          )}
        </div>
      )}

      {/* Hint kalau nonaktif */}
      {!group.aktif && !collapsed && (
        <div className="px-4 py-3 text-center">
          <p className="text-xs text-gray-400">Grup ini tidak aktif — centang untuk mengaktifkan</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MENU FORM MODAL
// ─────────────────────────────────────────────────────────────────────────────
export default function MenuForm({ item, onSave, onCancel }) {

  const [form, setForm] = useState(item ? { ...item } : {
    nama_menu: "", tagline: "", deskripsi: "",
    id_kategori: "",
    harga: "", status: true, image_url: "",
    rating: 0, totalReviews: 0, sold: 0,
    variant: [], reviews: [], related: [],
  });

  const [dragOver,   setDragOver]   = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [uploadErr,  setUploadErr]  = useState("");
  const [previewUrl, setPreviewUrl] = useState(item?.image_url ? fixImgUrl(item.image_url) : "");
  const fileRef = useRef();

  const [categories,   setCategories]   = useState([]);
  const [catLoading,   setCatLoading]   = useState(false);
  const [catErr,       setCatErr]       = useState("");
  const [catInput,     setCatInput]     = useState("");
  const [catLogoInput, setCatLogoInput] = useState("");
  const [showCatInput, setShowCatInput] = useState(false);
  const [editCatId,    setEditCatId]    = useState(null);
  const [editCatName,  setEditCatName]  = useState("");
  const [editCatLogo,  setEditCatLogo]  = useState("");
  const [catSaving,    setCatSaving]    = useState(false);

  // ── State varian ─────────────────────────────────────────────────────────
  const [variantGroups, setVariantGroups] = useState([]);
  const [varLoading,    setVarLoading]    = useState(false);
  const [varErr,        setVarErr]        = useState("");
  const [varSaving,     setVarSaving]     = useState(false);
  const [deletingVarId, setDeletingVarId] = useState(null);
  const [showVariantPopup, setShowVariantPopup] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const catId   = (c) => String(c?.id ?? c?.nama_kategori ?? c?.name ?? "unknown");
  const catName = (c) => String(c?.nama_kategori ?? c?.name ?? c?.id ?? "");
  const catLogo = (c) => fixImgUrl(c?.logo ?? c?.icon ?? "");
  const selectedCat = categories.find(c => catId(c) === form.id_kategori);

  // ── Fetch kategori ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetchCategories = async () => {
      setCatLoading(true); setCatErr("");
      try {
        const res  = await fetch(`${API_URL}/api/kategori`, { headers: authHeaders() });
        const data = await res.json();
        if (!res.ok) { setCatErr("Gagal memuat kategori"); return; }
        const list = data.data ?? data.categories ?? data.kategori ?? data ?? [];
        const arr  = Array.isArray(list) ? list : [];
        setCategories(arr);
        if (!item?.id_kategori && arr.length > 0) set("id_kategori", catId(arr[0]));
      } catch {
        setCatErr("Gagal terhubung ke server");
      } finally {
        setCatLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // ── Helper: build variantGroups dari array varian flat ────────────────────
  const buildGroupsFromFlat = (arr, menuHarga, activeIds = new Set(), menuId = null) => {
    const grouped = {};
    arr.forEach(v => {
      // API mengembalikan nama_grup
      const key = v.nama_group ?? v.nama_grup ?? v.nama_varian ?? v.group ?? "Varian";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(v);
    });
    
    // Cek localStorage untuk grup aktif yang tersimpan
    const savedActiveGroup = menuId ? localStorage.getItem(`active_variant_group_${menuId}`) : null;
    console.log(`[buildGroups] Menu ID: ${menuId}, savedActiveGroup from localStorage: "${savedActiveGroup}"`);
    
    let foundActive = false;
    return Object.entries(grouped).map(([namaVarian, items]) => {
      const hasActive = items.some(v => activeIds.has(String(v.id)));
      
      // Jika ada grup yang tersimpan di localStorage, gunakan itu
      // Jika tidak, default ke grup pertama yang memiliki varian untuk menu ini
      let aktif = false;
      if (hasActive && !foundActive) {
        if (savedActiveGroup) {
          // Gunakan grup dari localStorage jika cocok
          aktif = (namaVarian === savedActiveGroup);
        } else {
          // Default ke grup pertama
          aktif = true;
        }
        if (aktif) foundActive = true;
      }
      
      console.log(`[buildGroups] Grup "${namaVarian}": hasActive=${hasActive}, aktif=${aktif}`);
      
      return {
        id:         `grp_${namaVarian}_${Date.now()}_${Math.random().toString(36).slice(2,5)}`,
        namaVarian,
        aktif,
        pilihan:    items.map(v => ({
          id:           v.id,
          label:        v.label ?? "",
          hargaVariant: String(Number(v.harga_variant) || 0),
          isTemp:       false,
        })),
      };
    });
  };

  // ── Fetch semua varian dari DB → tampilkan sebagai grup ──────────────────
  useEffect(() => {
    const fetchVariants = async () => {
      setVarLoading(true);
      setVarErr("");
      try {
        // 1. Ambil semua varian dari DB
        const resAll  = await fetch(`${API_URL}/api/variant`, { headers: authHeaders() });
        const dataAll = await resAll.json();
        const listAll = dataAll.data ?? dataAll.variants ?? dataAll.varian ?? dataAll ?? [];
        const arrAll  = Array.isArray(listAll) ? listAll : [];

        // 2. Kalau edit menu, tandai varian yang sudah dimiliki menu
        let activeIds = new Set();
        if (item?.id) {
          try {
            const resOwn  = await fetch(`${API_URL}/api/variant?id_menu=${item.id}`, { headers: authHeaders() });
            const dataOwn = await resOwn.json();
            const listOwn = dataOwn.data ?? dataOwn.variants ?? dataOwn.varian ?? dataOwn ?? [];
            const arrOwn  = Array.isArray(listOwn) ? listOwn : [];
            activeIds = new Set(arrOwn.map(v => String(v.id)));
          } catch { /* silent */ }
        }

        // 3. Build semua grup, aktif = yang sudah dimiliki menu
        const groups = buildGroupsFromFlat(arrAll, item?.harga ?? 0, activeIds, item?.id);
        setVariantGroups(groups);
      } catch {
        setVarErr("Gagal memuat data varian");
      } finally {
        setVarLoading(false);
      }
    };
    fetchVariants();
  }, [item?.id]);

  // ── Upload gambar menu ────────────────────────────────────────────────────
  const uploadMenuImage = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setUploadErr("File harus berupa gambar"); return; }
    if (file.size > 5 * 1024 * 1024)    { setUploadErr("Ukuran gambar max 5MB"); return; }
    setUploadErr(""); setUploading(true);
    const reader = new FileReader();
    reader.onload  = (e) => { set("image_url", e.target.result); setPreviewUrl(e.target.result); setUploading(false); };
    reader.onerror = ()  => { setUploadErr("Gagal membaca file"); setUploading(false); };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    uploadMenuImage(e.dataTransfer.files?.[0]);
  };

  // ── Kategori CRUD ─────────────────────────────────────────────────────────
  const addCategory = async () => {
    const name = catInput.trim();
    if (!name) return;
    setCatSaving(true); setCatErr("");
    try {
      const res  = await fetch(`${API_URL}/api/kategori`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ nama_kategori: name, logo: catLogoInput }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) { setCatErr(data.message ?? "Gagal menambah kategori"); return; }
      const newCat = data.data ?? data.kategori ?? data.category ?? { nama_kategori: name, logo: catLogoInput };
      setCategories(p => [...p, newCat]);
      set("id_kategori", catId(newCat));
      setCatInput(""); setCatLogoInput(""); setShowCatInput(false);
    } catch { setCatErr("Gagal terhubung ke server"); }
    finally { setCatSaving(false); }
  };

  const saveEditCategory = async (c) => {
    const name = editCatName.trim();
    if (!name) return;
    setCatSaving(true); setCatErr("");
    try {
      const id  = catId(c);
      const res = await fetch(`${API_URL}/api/kategori/${id}`, {
        method: "PUT", headers: authHeaders(),
        body: JSON.stringify({ nama_kategori: name, logo: editCatLogo }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) { setCatErr(data.message ?? "Gagal mengedit kategori"); return; }
      setCategories(p => p.map(x => catId(x) === id ? { ...x, nama_kategori: name, logo: editCatLogo } : x));
      setEditCatId(null); setEditCatName(""); setEditCatLogo("");
    } catch { setCatErr("Gagal terhubung ke server"); }
    finally { setCatSaving(false); }
  };

  const deleteCategory = async (c) => {
    setCatErr("");
    try {
      const id  = catId(c);
      const res = await fetch(`${API_URL}/api/kategori/${id}`, { method: "DELETE", headers: authHeaders() });
      const data = await res.json();
      if (!res.ok || data.success === false) { setCatErr(data.message ?? "Gagal menghapus kategori"); return; }
      const remaining = categories.filter(x => catId(x) !== id);
      setCategories(remaining);
      if (form.id_kategori === id) set("id_kategori", remaining[0] ? catId(remaining[0]) : "");
    } catch { setCatErr("Gagal terhubung ke server"); }
  };

  const quickUpdateLogo = async (c, newLogo) => {
    const id = catId(c);
    setCategories(p => p.map(x => catId(x) === id ? { ...x, logo: newLogo } : x));
    try {
      const res = await fetch(`${API_URL}/api/kategori/${id}`, {
        method: "PUT", headers: authHeaders(),
        body: JSON.stringify({ nama_kategori: catName(c), logo: newLogo }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        setCategories(p => p.map(x => catId(x) === id ? c : x));
        setCatErr(data.message ?? "Gagal update logo");
      }
    } catch {
      setCategories(p => p.map(x => catId(x) === id ? c : x));
      setCatErr("Gagal terhubung ke server");
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CRUD VARIAN
  // ═══════════════════════════════════════════════════════════════════════════
  const genId = () => `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const addVariantGroup = () => {
    setVariantGroups(prev => [
      ...prev,
      { id: genId(), namaVarian: "", aktif: true, pilihan: [] },
    ]);
  };

  const toggleGroupAktif = (groupId) => {
    const group = variantGroups.find(g => g.id === groupId);
    const groupName = group?.namaVarian || "Unknown";
    const isActivating = !group?.aktif;
    
    if (isActivating) {
      console.log(`[toggleGroup] Mengganti varian: Grup "${groupName}" akan DIAKTIFKAN, grup lain akan DINONAKTIFKAN`);
      const currentActive = variantGroups.find(g => g.aktif);
      if (currentActive) {
        console.log(`[toggleGroup] Varian sebelumnya "${currentActive.namaVarian}" -> DINONAKTIFKAN`);
        console.log(`[toggleGroup] Varian baru "${groupName}" -> DIAKTIFKAN`);
      }
      // Simpan grup aktif ke localStorage
      const menuId = item?.id ?? form.id;
      if (menuId) {
        localStorage.setItem(`active_variant_group_${menuId}`, groupName);
        console.log(`[toggleGroup] Simpan ke localStorage: active_variant_group_${menuId} = "${groupName}"`);
      }
    } else {
      console.log(`[toggleGroup] Grup "${groupName}" akan DINONAKTIFKAN`);
    }
    
    setVariantGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, aktif: !g.aktif } : { ...g, aktif: false }
    ));
  };

  const updateGroupNama = (groupId, nama) => {
    setVariantGroups(prev => prev.map(g => g.id === groupId ? { ...g, namaVarian: nama } : g));
  };

  const deleteGroup = (groupId) => {
    setVariantGroups(prev => prev.filter(g => g.id !== groupId));
  };

  const addPilihan = (groupId) => {
    setVariantGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        pilihan: [
          ...g.pilihan,
          { id: genId(), label: "", hargaVariant: "", isTemp: true },
        ],
      };
    }));
  };

  const updatePilihan = (groupId, pilihanId, field, value) => {
    setVariantGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        pilihan: g.pilihan.map(p =>
          p.id !== pilihanId ? p : { ...p, [field]: value }
        ),
      };
    }));
  };

  const deletePilihan = async (groupId, pilihanId) => {
    const group   = variantGroups.find(g => g.id === groupId);
    const pilihan = group?.pilihan.find(p => p.id === pilihanId);

    // Pilihan sementara (belum di DB)
    if (!pilihan || pilihan.isTemp || String(pilihanId).startsWith("tmp_")) {
      setVariantGroups(prev => prev.map(g =>
        g.id === groupId ? { ...g, pilihan: g.pilihan.filter(p => p.id !== pilihanId) } : g
      ));
      return;
    }

    setDeletingVarId(pilihanId);
    try {
      const res  = await fetch(`${API_URL}/api/variant/${pilihanId}`, { method: "DELETE", headers: authHeaders() });
      const data = await res.json();
      if (!res.ok || data.success === false) { setVarErr(data.message ?? "Gagal menghapus pilihan"); return; }
      setVariantGroups(prev => prev.map(g =>
        g.id === groupId ? { ...g, pilihan: g.pilihan.filter(p => p.id !== pilihanId) } : g
      ));
    } catch { setVarErr("Gagal terhubung ke server"); }
    finally { setDeletingVarId(null); }
  };

  const ensureMenuSaved = async () => {
    const existingId = item?.id ?? form.id;
    if (existingId) return Number(existingId);  // selalu kembalikan integer
    if (!form.nama_menu?.trim()) { 
      onSave?.({ __error: "Nama menu wajib diisi", __type: "error" }); 
      return null; 
    }
    if (!form.harga) { 
      onSave?.({ __error: "Harga wajib diisi", __type: "error" }); 
      return null; 
    }
    if (!form.image_url?.trim()) { setUploadErr("Gambar wajib diisi"); return null; }

    try {
      const res  = await fetch(`${API_URL}/api/menu`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ ...form, harga: Number(form.harga), image_url: form.image_url.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) { setVarErr(data.message ?? "Gagal menyimpan menu"); return null; }
      const created = data.data ?? data.menu ?? data.item ?? data;
      const newId   = created?.id;
      if (!newId) { setVarErr("Menu tersimpan tapi ID tidak ditemukan."); return null; }
      setForm(p => ({ ...p, id: newId }));
      
      // Simpan grup aktif ke localStorage untuk menu baru
      const activeGroup = variantGroups.find(g => g.aktif);
      if (activeGroup) {
        localStorage.setItem(`active_variant_group_${newId}`, activeGroup.namaVarian);
        console.log(`[ensureMenuSaved] Menu baru ID:${newId} - Simpan varian aktif ke localStorage: "${activeGroup.namaVarian}"`);
      }
      
      return newId;
    } catch { setVarErr("Gagal terhubung ke server"); return null; }
  };

  // ── Simpan semua varian aktif ke backend ─────────────────────────────────
  const saveAllVariants = async () => {
    setVarSaving(true);
    setVarErr("");

    try {
      const menuId = await ensureMenuSaved();
      console.log("[saveVariants] menuId =", menuId, "| item?.id =", item?.id, "| form.id =", form.id);
      if (!menuId) { setVarSaving(false); return; }

      const errors = [];

      // Log grup yang aktif dan nonaktif saat simpan
      const activeGroups = variantGroups.filter(g => g.aktif);
      const inactiveGroups = variantGroups.filter(g => !g.aktif && g.namaVarian.trim());
      console.log(`[saveVariants] === MENYIMPAN VARIAN UNTUK MENU ID: ${menuId} ===`);
      console.log(`[saveVariants] Grup AKTIF (${activeGroups.length}):`, activeGroups.map(g => `"${g.namaVarian}" (${g.pilihan.length} pilihan)`));
      console.log(`[saveVariants] Grup NONAKTIF (${inactiveGroups.length}):`, inactiveGroups.map(g => `"${g.namaVarian}" (${g.pilihan.length} pilihan)`));

      for (const group of variantGroups) {
        // Lewati grup tanpa nama
        if (!group.namaVarian.trim()) continue;

        for (const p of group.pilihan) {
          if (!p.label.trim()) continue;

          const isNew = String(p.id).startsWith("tmp_") || p.isTemp;

          const payload = {
            label:        p.label.trim(),
            harga_variant: Number(p.hargaVariant) || 0,
            id_menu:      Number(menuId),
            nama_group:   group.namaVarian.trim(),
          };

          try {
            let res, rawText, data;
            if (isNew && group.aktif) {
              // Hanya buat varian baru kalau grupnya aktif
              console.log("[variant POST] payload ->", JSON.stringify(payload));
              res     = await fetch(`${API_URL}/api/variant`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify(payload),
              });
              rawText = await res.text();
              console.log("[variant POST] status:", res.status, "| body:", rawText);
              try { data = JSON.parse(rawText); } catch { data = { message: rawText }; }
            } else if (!isNew && group.aktif) {
              // Hanya update varian dari grup yang AKTIF
              const putBody = {
                label:         payload.label,
                harga_variant: payload.harga_variant,
                nama_group:    payload.nama_group,
                id_menu:       payload.id_menu
              };
              console.log(`[variant PUT] Grup "${group.namaVarian}" AKTIF -> update varian id:`, p.id, "label:", putBody.label);
              res     = await fetch(`${API_URL}/api/variant/${p.id}`, {
                method: "PUT",
                headers: authHeaders(),
                body: JSON.stringify(putBody),
              });
              rawText = await res.text();
              console.log("[variant PUT] status:", res.status, "| body:", rawText);
              try { data = JSON.parse(rawText); } catch { data = { message: rawText }; }
            } else if (!isNew && !group.aktif) {
              // Grup NONAKTIF - tidak perlu update, biarkan tetap terhubung ke menu
              console.log(`[variant SKIP] Grup "${group.namaVarian}" NONAKTIF - skip update varian id:`, p.id);
              continue; // Skip ke pilihan berikutnya
            }

            if (res && !res.ok || data && data.success === false) {
              errors.push(`"${p.label}": ${data?.message ?? "HTTP " + res?.status}`);
            }
          } catch (e) {
            console.error("[variant] network error:", e);
            errors.push(`"${p.label}": Gagal terhubung ke server`);
          }
        }
      }

      if (errors.length > 0) {
        setVarErr(`Beberapa pilihan gagal disimpan:\n${errors.join("\n")}`);
      } else {
        // Tandai semua pilihan sudah tersimpan
        setVariantGroups(prev => prev.map(g => ({
          ...g,
          pilihan: g.pilihan.map(p => ({ ...p, isTemp: false })),
        })));
        // Toast notification akan muncul di komponen parent (KelolaMenu)
      }
    } catch {
      setVarErr("Terjadi kesalahan tak terduga saat menyimpan varian.");
    } finally {
      setVarSaving(false);
    }
  };

  // ── Simpan menu utama ─────────────────────────────────────────────────────
  const handleSave = () => {
    if (!form.nama_menu.trim()) { 
      onSave?.({ __error: "Nama menu wajib diisi", __type: "error" }); 
      return; 
    }
    if (!form.harga) { 
      onSave?.({ __error: "Harga wajib diisi", __type: "error" }); 
      return; 
    }
    if (!form.image_url?.trim()) { setUploadErr("Gambar wajib diisi"); return; }

    const flatVariants = variantGroups
      .filter(g => g.aktif)
      .flatMap(g =>
        g.pilihan
          .filter(p => p.label.trim())
          .map(p => ({
            id:           p.isTemp ? undefined : p.id,
            label:        p.label,
            harga_variant: Number(p.hargaVariant) || 0,
            nama_group:   g.namaVarian,
          }))
      );

    // Simpan grup aktif ke localStorage sebelum kirim ke parent
    const activeGroup = variantGroups.find(g => g.aktif);
    if (activeGroup && (item?.id || form.id)) {
      const menuId = item?.id ?? form.id;
      localStorage.setItem(`active_variant_group_${menuId}`, activeGroup.namaVarian);
      console.log(`[handleSave] Simpan grup aktif ke localStorage: "${activeGroup.namaVarian}" untuk menu ID:${menuId}`);
    }

    onSave({
      ...form,
      harga:       Number(form.harga),
      id:          item?.id ?? form.id ?? undefined,
      id_kategori: form.id_kategori,
      image_url:   form.image_url.trim(),
      variants:    flatVariants,
    });
  };

  // ── Hitung ringkasan varian ───────────────────────────────────────────────
  const unsavedCount = variantGroups.flatMap(g => g.pilihan).filter(p => p.isTemp || String(p.id).startsWith("tmp_")).length;
  const totalPilihan = variantGroups.flatMap(g => g.pilihan).length;
  const displayImage = previewUrl || fixImgUrl(form.image_url);

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════
          POPUP 1 — INFO DASAR
      ══════════════════════════════════════════════════════════════════ */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
        <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center justify-between flex-shrink-0">
            <h2 className="font-bold text-white text-lg">{item ? "Edit Menu" : "Tambah Menu Baru"}</h2>
            <button onClick={onCancel} className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all">
              <X size={16}/>
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 p-6 space-y-4">

            {/* Upload Gambar */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Gambar Menu</label>
              <div
                onClick={() => !uploading && fileRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                className={`relative w-full h-36 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden
                  ${dragOver?"border-amber-500 bg-amber-50 scale-[1.01]":"border-gray-200 bg-gray-50 hover:border-amber-400 hover:bg-amber-50/50"}`}
              >
                {displayImage && !uploading && (
                  <>
                    <img src={displayImage} alt="preview" className="absolute inset-0 w-full h-full object-cover" onError={e => { e.currentTarget.style.display="none"; }}/>
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-all flex flex-col items-center justify-center gap-1">
                      <Upload size={20} className="text-white"/>
                      <p className="text-white text-xs font-semibold">Ganti Gambar</p>
                    </div>
                  </>
                )}
                {uploading && (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={28} className="text-amber-500 animate-spin"/>
                    <p className="text-xs text-amber-600 font-semibold">Memproses gambar...</p>
                  </div>
                )}
                {!displayImage && !uploading && (
                  <div className="flex flex-col items-center gap-2 pointer-events-none">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dragOver?"bg-amber-100":"bg-gray-100"}`}>
                      {dragOver?<Upload size={20} className="text-amber-500"/>:<Image size={20} className="text-gray-300"/>}
                    </div>
                    <p className="text-sm font-semibold text-gray-500">{dragOver?"Lepas untuk upload":"Klik atau drag & drop"}</p>
                    <p className="text-xs text-gray-400">PNG, JPG, WEBP · Maks 5MB</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => uploadMenuImage(e.target.files?.[0])}/>
              {uploadErr && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><X size={11}/>{uploadErr}</p>}
            </div>

            {/* Nama */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Nama Menu *</label>
              <input value={form.nama_menu} onChange={e => set("nama_menu", e.target.value)}
                placeholder="Nama menu"
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all"/>
            </div>

            {/* Deskripsi */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Deskripsi</label>
              <textarea value={form.deskripsi} onChange={e => set("deskripsi", e.target.value)}
                rows={3} placeholder="Deskripsi lengkap..."
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all resize-none"/>
            </div>

            {/* Kategori */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Kategori *</label>
                <button onClick={() => { setShowCatInput(v => !v); setEditCatId(null); setCatErr(""); }}
                  className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5 hover:text-amber-700 transition-all">
                  <Plus size={10}/> Tambah Kategori
                </button>
              </div>

              {catErr && (
                <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-2">
                  <AlertCircle size={12} className="text-red-400 flex-shrink-0"/>
                  <p className="text-xs text-red-500">{catErr}</p>
                </div>
              )}

              {catLoading ? (
                <div className="flex items-center gap-2 border-2 border-gray-200 rounded-xl px-3 py-2.5">
                  <Loader2 size={14} className="text-amber-500 animate-spin"/>
                  <span className="text-sm text-gray-400">Memuat kategori...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-amber-200 bg-gray-50 flex-shrink-0 flex items-center justify-center">
                    {selectedCat && catLogo(selectedCat)
                      ? <img src={catLogo(selectedCat)} alt="logo" className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display="none"; }}/>
                      : <Image size={14} className="text-gray-300"/>
                    }
                  </div>
                  <select value={form.id_kategori} onChange={e => set("id_kategori", e.target.value)}
                    className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all bg-white">
                    {categories.length === 0 && <option value="">— Belum ada kategori —</option>}
                    {categories.map(c => <option key={catId(c)} value={catId(c)}>{catName(c)}</option>)}
                  </select>
                </div>
              )}

              {showCatInput && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                  <p className="text-xs font-bold text-amber-700">Tambah Kategori Baru</p>
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <LogoUploadButton logoUrl={catLogoInput} onChange={setCatLogoInput} size="md"/>
                      <span className="text-[9px] text-gray-400 font-semibold text-center">Logo<br/>Kategori</span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <input value={catInput} onChange={e => setCatInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addCategory()}
                        placeholder="Nama kategori baru..."
                        className="w-full border-2 border-amber-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-500 transition-all bg-white" autoFocus/>
                      <div className="flex gap-2">
                        <button onClick={addCategory} disabled={catSaving || !catInput.trim()}
                          className="flex-1 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-all disabled:opacity-60 flex items-center justify-center gap-1">
                          {catSaving ? <Loader2 size={12} className="animate-spin"/> : <Check size={12}/>} Simpan
                        </button>
                        <button onClick={() => { setShowCatInput(false); setCatInput(""); setCatLogoInput(""); setCatErr(""); }}
                          className="px-3 py-2 bg-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-300 transition-all">
                          <X size={12}/>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {categories.length > 0 && !catLoading && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Kelola Kategori</p>
                  {categories.map(c => (
                    <div key={catId(c)} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                      {editCatId === catId(c) ? (
                        <div className="flex-1 flex items-center gap-2">
                          <LogoUploadButton logoUrl={editCatLogo} onChange={setEditCatLogo} size="sm"/>
                          <input value={editCatName} onChange={e => setEditCatName(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && saveEditCategory(c)} autoFocus
                            className="flex-1 border-2 border-amber-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-amber-500 transition-all"/>
                          <button onClick={() => saveEditCategory(c)} disabled={catSaving}
                            className="w-7 h-7 bg-amber-500 text-white rounded-lg flex items-center justify-center hover:bg-amber-600 transition-all disabled:opacity-60 flex-shrink-0">
                            {catSaving ? <Loader2 size={10} className="animate-spin"/> : <Check size={10}/>}
                          </button>
                          <button onClick={() => { setEditCatId(null); setEditCatName(""); setEditCatLogo(""); setCatErr(""); }}
                            className="w-7 h-7 bg-gray-200 text-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-all flex-shrink-0">
                            <X size={10}/>
                          </button>
                        </div>
                      ) : (
                        <>
                          <LogoUploadButton logoUrl={catLogo(c)} onChange={(newLogo) => quickUpdateLogo(c, newLogo)} size="sm"/>
                          <span className="flex-1 text-xs font-semibold text-gray-700 capitalize">{catName(c)}</span>
                          <button onClick={() => { setEditCatId(catId(c)); setEditCatName(catName(c)); setEditCatLogo(catLogo(c)); setShowCatInput(false); setCatErr(""); }}
                            className="w-6 h-6 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center text-blue-500 transition-all">
                            <Edit3 size={10}/>
                          </button>
                          <button onClick={() => deleteCategory(c)}
                            className="w-6 h-6 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center text-red-400 transition-all">
                            <Trash2 size={10}/>
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Harga */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Harga (Rp) *</label>
              <input type="number" value={form.harga} onChange={e => set("harga", e.target.value)}
                placeholder="15000"
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all"/>
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Status Stok</label>
              <button onClick={() => set("status", !form.status)}
                className={`w-full flex items-center justify-center gap-2 border-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${form.status?"border-green-500 bg-green-50 text-green-700":"border-red-300 bg-red-50 text-red-600"}`}>
                {form.status ? <><Check size={14}/> Tersedia</> : <><X size={14}/> Habis</>}
              </button>
            </div>

            {/* Tombol buka popup varian */}
            <button
              onClick={() => setShowVariantPopup(true)}
              className="w-full flex items-center justify-between border-2 border-dashed border-amber-300 rounded-2xl px-4 py-3.5 hover:border-amber-500 hover:bg-amber-50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-all">
                  <Hash size={16} className="text-amber-600"/>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-800">Atur Varian Menu</p>
                  <p className="text-[11px] text-gray-400">
                    {totalPilihan > 0
                      ? `${variantGroups.length} grup · ${totalPilihan} pilihan${unsavedCount > 0 ? ` · ${unsavedCount} belum disimpan` : ""}`
                      : "Belum ada varian — klik untuk menambah"
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {totalPilihan > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {totalPilihan}
                  </span>
                )}
                {unsavedCount > 0 && (
                  <span className="bg-orange-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unsavedCount} baru
                  </span>
                )}
                <Plus size={16} className="text-amber-500 group-hover:text-amber-600"/>
              </div>
            </button>

          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-3 flex gap-3 border-t border-gray-100 flex-shrink-0">
            <button onClick={onCancel} className="flex-1 border-2 border-gray-200 text-gray-700 rounded-xl py-3 font-semibold hover:bg-gray-50 transition-all">
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={uploading || catSaving || varSaving}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl py-3 font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait"
            >
              <Save size={16}/> Simpan Menu
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          POPUP 2 — VARIAN
      ══════════════════════════════════════════════════════════════════ */}
      {showVariantPopup && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => setShowVariantPopup(false)}
                className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all"
              >
                <X size={16}/>
              </button>
              <div className="flex-1">
                <h2 className="font-bold text-white text-base">Varian Menu</h2>
                <p className="text-white/70 text-[11px] mt-0.5 truncate">{form.nama_menu || "Menu baru"}</p>
              </div>
              {totalPilihan > 0 && (
                <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {totalPilihan} pilihan
                </span>
              )}
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-5 space-y-4">

              <p className="text-[11px] text-gray-500 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 leading-relaxed">
                💡<strong>Centang</strong> grup yang ingin diaktifkan untuk menu ini. Atau buat grup baru dengan tombol di bawah.
              </p>

              {varErr && (
                <div className="flex items-start gap-1.5 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  <AlertCircle size={12} className="text-red-400 flex-shrink-0 mt-0.5"/>
                  <p className="text-xs text-red-500 whitespace-pre-line">{varErr}</p>
                </div>
              )}

              {varLoading ? (
                <div className="flex items-center justify-center gap-2 py-10">
                  <Loader2 size={20} className="text-amber-500 animate-spin"/>
                  <span className="text-sm text-gray-400">Memuat varian...</span>
                </div>
              ) : (
                <>
                  {variantGroups.map(group => (
                    <VariantGroup
                      key={group.id}
                      group={group}
                      menuHarga={Number(form.harga) || 0}
                      onUpdateNama={updateGroupNama}
                      onToggleAktif={toggleGroupAktif}
                      onAddPilihan={addPilihan}
                      onUpdatePilihan={updatePilihan}
                      onDeletePilihan={deletePilihan}
                      onDeleteGroup={deleteGroup}
                      saving={varSaving}
                      deleting={deletingVarId}
                    />
                  ))}

                  {variantGroups.length === 0 && (
                    <div className="text-center py-10">
                      <Hash size={40} className="mx-auto mb-3 text-gray-200"/>
                      <p className="text-sm font-semibold text-gray-500">Belum ada grup varian</p>
                      <p className="text-xs mt-1 text-gray-400">Klik "+ Tambah Grup Varian" untuk membuat baru.</p>
                    </div>
                  )}

                  <button
                    onClick={addVariantGroup}
                    className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-amber-400 rounded-2xl py-3 text-sm font-bold text-amber-600 hover:border-amber-500 hover:bg-amber-50 transition-all"
                  >
                    <Plus size={15}/> Tambah Grup Varian
                  </button>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 pt-3 flex gap-3 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={() => setShowVariantPopup(false)}
                className="flex-1 border-2 border-gray-200 text-gray-700 rounded-xl py-3 font-semibold hover:bg-gray-50 transition-all"
              >
                Tutup
              </button>
              <button
                onClick={async () => { await saveAllVariants(); if (!varErr) setShowVariantPopup(false); }}
                disabled={varSaving || variantGroups.length === 0}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl py-3 font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait"
              >
                {varSaving
                  ? <><Loader2 size={15} className="animate-spin"/> Menyimpan...</>
                  : <><Save size={15}/> Simpan Varian</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}