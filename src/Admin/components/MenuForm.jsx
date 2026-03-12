import { useState, useRef, useEffect } from "react";
import {
  X, Image, Plus, Check, Trash2, FileText,
  Hash, Save, Upload, Loader2, Edit3, AlertCircle, Camera
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://192.168.1.2:3000";

const authHeaders = (json = true) => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
};

// ── Fix URL gambar ─────────────────────────────────────────────────────────────
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

// ── Upload logo kategori → base64 ─────────────────────────────────────────────
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

// ── Logo Upload Preview Button ─────────────────────────────────────────────────
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
        title="Klik untuk upload logo"
      >
        {fixedUrl ? (
          <>
            <img src={fixedUrl} alt="logo" className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display="none"; }}/>
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
              {uploading
                ? <Loader2 size={size==="sm"?10:14} className="text-white animate-spin"/>
                : <Camera size={size==="sm"?10:14} className="text-white"/>
              }
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {uploading
              ? <Loader2 size={size==="sm"?10:16} className="text-amber-500 animate-spin"/>
              : <Camera size={size==="sm"?10:16} className="text-gray-300"/>
            }
          </div>
        )}
      </div>
      {fixedUrl && (
        <button
          onClick={(e) => { e.stopPropagation(); onChange(""); setError(""); }}
          className="text-[9px] text-red-400 hover:text-red-600 font-semibold transition-all leading-none"
        >
          Hapus
        </button>
      )}
      {error && <p className="text-[9px] text-red-500 text-center">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => upload(e.target.files?.[0], onChange)}
      />
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

  const [tab, setTab] = useState("basic");

  // Upload gambar menu
  const [dragOver,   setDragOver]   = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [uploadErr,  setUploadErr]  = useState("");
  const [previewUrl, setPreviewUrl] = useState(item?.image_url ? fixImgUrl(item.image_url) : "");
  const fileRef = useRef();

  // Kategori
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

  // ── Varian state ──────────────────────────────────────────────────────────
  const [variants,      setVariants]      = useState([]);
  const [varLoading,    setVarLoading]    = useState(false);
  const [varErr,        setVarErr]        = useState("");
  const [newVarLabel,   setNewVarLabel]   = useState("");
  const [newVarPrice,   setNewVarPrice]   = useState("");
  const [varSaving,     setVarSaving]     = useState(false);
  const [editVarId,     setEditVarId]     = useState(null);
  const [editVarLabel,  setEditVarLabel]  = useState("");
  const [editVarPrice,  setEditVarPrice]  = useState("");
  const [deletingVarId, setDeletingVarId] = useState(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const getSelectedCategoryName = () => {
    const selectedCategory = categories.find(c => catId(c) === form.id_kategori);
    return selectedCategory?.nama_kategori || selectedCategory?.name || form.id_kategori || "";
  };
  const catId   = (c) => String(c?.id ?? c?.nama_kategori ?? c?.name ?? "unknown");
  const catName = (c) => String(c?.nama_kategori ?? c?.name ?? c?.id ?? "");
  const catLogo = (c) => {
    const raw = c?.logo ?? c?.icon ?? "";
    return fixImgUrl(raw);
  };

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

  // ── Fetch varian dari database (hanya saat edit menu) ──────────────────
  useEffect(() => {
    if (!item?.id) {
      // Menu baru — tidak perlu fetch, mulai kosong
      setVariants([]);
      return;
    }
    const fetchVariants = async () => {
      setVarLoading(true); setVarErr("");
      try {
        const res  = await fetch(`${API_URL}/api/variant?id_menu=${item.id}`, { headers: authHeaders() });
        const data = await res.json();
        if (!res.ok) { setVarErr("Gagal memuat varian"); return; }
        const list = data.data ?? data.variants ?? data.varian ?? data ?? [];
        const arr = Array.isArray(list) ? list : [];
        setVariants(arr.map(v => ({
          ...v,
          id_kategori: v?.id_kategori ?? item?.id_kategori ?? "",
        })));
      } catch {
        setVarErr("Gagal terhubung ke server");
      } finally {
        setVarLoading(false);
      }
    };
    fetchVariants();
  }, [item?.id]);

  // Upload gambar menu → base64
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

  // ── Tambah kategori ───────────────────────────────────────────────────────
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

  // ── Edit kategori ─────────────────────────────────────────────────────────
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

  // ── Hapus kategori ────────────────────────────────────────────────────────
  const deleteCategory = async (c) => {
    setCatErr("");
    try {
      const id  = catId(c);
      const res = await fetch(`${API_URL}/api/kategori/${id}`, {
        method: "DELETE", headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) { setCatErr(data.message ?? "Gagal menghapus kategori"); return; }
      const remaining = categories.filter(x => catId(x) !== id);
      setCategories(remaining);
      if (form.id_kategori === id) set("id_kategori", remaining[0] ? catId(remaining[0]) : "");
    } catch { setCatErr("Gagal terhubung ke server"); }
  };

  // ── Quick update logo kategori ────────────────────────────────────────────
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

  // ════════════════════════════════════════════════════════════════════════════
  // CRUD VARIAN
  // ════════════════════════════════════════════════════════════════════════════

  const getVariantsByCategory = () => {
    const current = String(form.id_kategori ?? "");
    if (!current) return variants;
    return variants.filter(v => String(v?.id_kategori ?? current) === current);
  };

  useEffect(() => {
    setEditVarId(null);
    setEditVarLabel("");
    setEditVarPrice("");
    setVarErr("");
  }, [form.id_kategori]);

  useEffect(() => {
    if (!editVarId) return;
    const visible = getVariantsByCategory().some(v => String(v?.id) === String(editVarId));
    if (!visible) {
      setEditVarId(null);
      setEditVarLabel("");
      setEditVarPrice("");
    }
  }, [editVarId, variants, form.id_kategori]);

  // ── Tambah varian ─────────────────────────────────────────────────────────
  const addVariant = async () => {
    const label = newVarLabel.trim();
    const harga = Number(newVarPrice);
    if (!label || !harga) return;

    setVarSaving(true); setVarErr("");
    try {
      const menuId = await ensureMenuSaved();
      if (!menuId) return;

      const res = await fetch(`${API_URL}/api/variant`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ label, harga, id_menu: menuId, id_kategori: form.id_kategori }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) { setVarErr(data.message ?? "Gagal menambah varian"); return; }

      const newVar = data.data ?? data.varian ?? data.variant ?? { label, harga, id_kategori: form.id_kategori };
      setVariants(p => [...p, newVar]);
      setNewVarLabel(""); setNewVarPrice("");
    } catch { setVarErr("Gagal terhubung ke server"); }
    finally { setVarSaving(false); }
  };

  // ── Mulai edit varian ─────────────────────────────────────────────────────
  const startEditVariant = (v) => {
    setEditVarId(v.id);
    setEditVarLabel(v.label);
    setEditVarPrice(String(v.harga));
    setVarErr("");
  };

  // ── Simpan edit varian ────────────────────────────────────────────────────
  const saveEditVariant = async (v) => {
    const label = editVarLabel.trim();
    const harga = Number(editVarPrice);
    if (!label || !harga) return;

    setVarSaving(true); setVarErr("");
    try {
      // Varian sementara (menu baru belum disimpan)
      if (v.isTemp) {
        setVariants(p => p.map(x => x.id === v.id ? { ...x, label, harga, id_kategori: (x.id_kategori ?? form.id_kategori) } : x));
        setEditVarId(null); setEditVarLabel(""); setEditVarPrice("");
        return;
      }

      const res = await fetch(`${API_URL}/api/variant/${v.id}`, {
        method: "PUT", headers: authHeaders(),
        body: JSON.stringify({ label, harga, id_kategori: (v.id_kategori ?? form.id_kategori) }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) { setVarErr(data.message ?? "Gagal mengedit varian"); return; }

      setVariants(p => p.map(x => x.id === v.id ? { ...x, label, harga, id_kategori: (x.id_kategori ?? form.id_kategori) } : x));
      setEditVarId(null); setEditVarLabel(""); setEditVarPrice("");
    } catch { setVarErr("Gagal terhubung ke server"); }
    finally { setVarSaving(false); }
  };

  // ── Hapus varian ──────────────────────────────────────────────────────────
  const deleteVariant = async (v) => {
    setDeletingVarId(v.id);
    setVarErr("");
    try {
      // Varian sementara (menu baru belum disimpan)
      if (v.isTemp) {
        setVariants(p => p.filter(x => x.id !== v.id));
        return;
      }

      const res = await fetch(`${API_URL}/api/variant/${v.id}`, {
        method: "DELETE", headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) { setVarErr(data.message ?? "Gagal menghapus varian"); return; }

      setVariants(p => p.filter(x => x.id !== v.id));
    } catch { setVarErr("Gagal terhubung ke server"); }
    finally { setDeletingVarId(null); }
  };

  const ensureMenuSaved = async () => {
    if (item?.id || form.id) return item?.id ?? form.id;

    if (!form.nama_menu?.trim()) {
      setVarErr("Nama menu wajib diisi sebelum menambah varian.");
      return null;
    }
    if (!form.harga) {
      setVarErr("Harga menu wajib diisi sebelum menambah varian.");
      return null;
    }
    if (!form.image_url?.trim()) {
      setVarErr("Gambar/URL menu wajib diisi sebelum menambah varian.");
      return null;
    }
    if (!form.id_kategori) {
      setVarErr("Kategori wajib dipilih sebelum menambah varian.");
      return null;
    }

    try {
      const res = await fetch(`${API_URL}/api/menu`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          ...form,
          harga: Number(form.harga),
          id_kategori: form.id_kategori,
          image_url: form.image_url?.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        setVarErr(data.message ?? data.error ?? "Gagal menyimpan menu sebelum menambah varian");
        return null;
      }

      const created = data.data ?? data.menu ?? data.item ?? data;
      const newId = created?.id;
      if (!newId) {
        setVarErr("Menu tersimpan tapi ID menu tidak ditemukan.");
        return null;
      }
      setForm(p => ({ ...p, id: newId }));
      return newId;
    } catch {
      setVarErr("Gagal terhubung ke server");
      return null;
    }
  };

  // ── Simpan menu utama ─────────────────────────────────────────────────────
  const handleSave = () => {
    if (!form.nama_menu.trim()) { alert("Nama menu wajib diisi"); return; }
    if (!form.harga)            { alert("Harga wajib diisi"); return; }
    if (!form.image_url?.trim()) { setUploadErr("Gambar wajib diisi"); return; }

    // Sertakan variants (termasuk yang temp) agar parent bisa simpan sekaligus
    onSave({
      ...form,
      harga:       Number(form.harga),
      id:          item?.id ?? form.id ?? undefined,
      id_kategori: form.id_kategori,
      image_url:   form.image_url.trim(),
      variants:    variants.map(({ isTemp, ...v }) => v), // hapus flag isTemp
    });
  };

  const tabs = [
    { id: "basic",    label: "Info Dasar", icon: <FileText size={13}/> },
    { id: "variants", label: "Varian",     icon: <Hash size={13}/> },
  ];

  const displayImage = previewUrl || fixImgUrl(form.image_url);
  const selectedCat  = categories.find(c => catId(c) === form.id_kategori);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="font-bold text-white text-lg">{item ? "Edit Menu" : "Tambah Menu Baru"}</h2>
          <button onClick={onCancel} className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all">
            <X size={16}/>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50 flex-shrink-0">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all ${tab===t.id?"border-b-2 border-amber-500 text-amber-600 bg-white":"text-gray-500 hover:text-gray-700"}`}
            >
              {t.icon}{t.label}
              {t.id === "variants" && getVariantsByCategory().length > 0 && (
                <span className="ml-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {getVariantsByCategory().length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">

          {/* ════════ TAB: INFO DASAR ════════ */}
          {tab === "basic" && (
            <>
              {/* Upload Gambar Menu */}
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
                {!uploading && (
                  <div className="mt-2">
                    <p className="text-[10px] text-gray-400 mb-1">Atau masukkan URL gambar manual:</p>
                    <input
                      value={form.image_url}
                      onChange={e => { set("image_url", e.target.value); setPreviewUrl(e.target.value); setUploadErr(""); }}
                      placeholder="https://..."
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-500 transition-all"
                    />
                  </div>
                )}
              </div>

              {/* Nama */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Nama Menu *</label>
                <input
                  value={form.nama_menu}
                  onChange={e => set("nama_menu", e.target.value)}
                  placeholder="Nama menu"
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all"
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Deskripsi</label>
                <textarea
                  value={form.deskripsi}
                  onChange={e => set("deskripsi", e.target.value)}
                  rows={3}
                  placeholder="Deskripsi lengkap..."
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all resize-none"
                />
              </div>

              {/* KATEGORI */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Kategori *</label>
                  <button
                    onClick={() => { setShowCatInput(v => !v); setEditCatId(null); setCatErr(""); }}
                    className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5 hover:text-amber-700 transition-all"
                  >
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
                    <select
                      value={form.id_kategori}
                      onChange={e => set("id_kategori", e.target.value)}
                      className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all bg-white"
                    >
                      {categories.length === 0 && <option value="">— Belum ada kategori —</option>}
                      {categories.map(c => (
                        <option key={catId(c)} value={catId(c)}>{catName(c)}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Form tambah kategori baru */}
                {showCatInput && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                    <p className="text-xs font-bold text-amber-700">Tambah Kategori Baru</p>
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center gap-1">
                        <LogoUploadButton logoUrl={catLogoInput} onChange={setCatLogoInput} size="md"/>
                        <span className="text-[9px] text-gray-400 font-semibold text-center">Logo<br/>Kategori</span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          value={catInput}
                          onChange={e => setCatInput(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && addCategory()}
                          placeholder="Nama kategori baru..."
                          className="w-full border-2 border-amber-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-500 transition-all bg-white"
                          autoFocus
                        />
                        <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-1.5 border border-amber-200">
                          <span className="text-[10px] text-gray-400">Preview:</span>
                          {catLogoInput
                            ? <img src={catLogoInput} alt="logo" className="w-5 h-5 rounded-md object-cover"/>
                            : <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center"><Image size={10} className="text-gray-300"/></div>
                          }
                          <span className="text-xs font-semibold text-gray-700">{catInput || "Nama Kategori"}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={addCategory}
                            disabled={catSaving || !catInput.trim()}
                            className="flex-1 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-all disabled:opacity-60 flex items-center justify-center gap-1"
                          >
                            {catSaving ? <Loader2 size={12} className="animate-spin"/> : <Check size={12}/>}
                            Simpan
                          </button>
                          <button
                            onClick={() => { setShowCatInput(false); setCatInput(""); setCatLogoInput(""); setCatErr(""); }}
                            className="px-3 py-2 bg-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-300 transition-all"
                          >
                            <X size={12}/>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* List kelola kategori */}
                {categories.length > 0 && !catLoading && (
                  <div className="mt-3 space-y-1.5">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Kelola Kategori</p>
                    {categories.map(c => (
                      <div key={catId(c)} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                        {editCatId === catId(c) ? (
                          <div className="flex-1 flex items-center gap-2">
                            <LogoUploadButton logoUrl={editCatLogo} onChange={setEditCatLogo} size="sm"/>
                            <input
                              value={editCatName}
                              onChange={e => setEditCatName(e.target.value)}
                              onKeyDown={e => e.key === "Enter" && saveEditCategory(c)}
                              autoFocus
                              className="flex-1 border-2 border-amber-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-amber-500 transition-all"
                            />
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
                <input
                  type="number"
                  value={form.harga}
                  onChange={e => set("harga", e.target.value)}
                  placeholder="15000"
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all"
                />
              </div>

              {/* Stok */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Status Stok</label>
                <button
                  onClick={() => set("status", !form.status)}
                  className={`w-full flex items-center justify-center gap-2 border-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${form.status?"border-green-500 bg-green-50 text-green-700":"border-red-300 bg-red-50 text-red-600"}`}
                >
                  {form.status ? <><Check size={14}/> Tersedia</> : <><X size={14}/> Habis</>}
                </button>
              </div>
            </>
          )}

          {/* ════════ TAB: VARIAN ════════ */}
          {tab === "variants" && (
            <div className="space-y-4">

              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <p className="text-xs font-bold text-amber-700">Kategori: {getSelectedCategoryName() || "-"}</p>
                <p className="text-[10px] text-amber-600">{getVariantsByCategory().length} varian</p>
              </div>

              <p className="text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                💡 Varian ditampilkan di halaman detail user (mis. Hot/Iced, Single/Double).
                {!item?.id && " Varian akan disimpan ke database setelah menu disimpan."}
              </p>

              {/* Error varian */}
              {varErr && (
                <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  <AlertCircle size={12} className="text-red-400 flex-shrink-0"/>
                  <p className="text-xs text-red-500">{varErr}</p>
                </div>
              )}

              {/* Loading varian */}
              {varLoading ? (
                <div className="flex items-center justify-center gap-2 py-8">
                  <Loader2 size={20} className="text-amber-500 animate-spin"/>
                  <span className="text-sm text-gray-400">Memuat varian...</span>
                </div>
              ) : (
                <>
                  {/* ── List varian ── */}
                  <div className="space-y-2">
                    {getVariantsByCategory().map((v) => (
                      <div key={v.id} className="bg-gray-50 rounded-xl p-3">
                        {editVarId === v.id ? (
                          /* Mode edit */
                          <div className="flex items-center gap-2">
                            <input
                              value={editVarLabel}
                              onChange={e => setEditVarLabel(e.target.value)}
                              onKeyDown={e => e.key === "Enter" && saveEditVariant(v)}
                              placeholder="Label varian"
                              autoFocus
                              className="flex-1 border-2 border-amber-300 rounded-lg px-2 py-2 text-sm outline-none focus:border-amber-500 transition-all"
                            />
                            <div className="flex items-center gap-1 w-32">
                              <span className="text-xs text-gray-400 flex-shrink-0">Rp</span>
                              <input
                                type="number"
                                value={editVarPrice}
                                onChange={e => setEditVarPrice(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && saveEditVariant(v)}
                                placeholder="Harga"
                                className="flex-1 border-2 border-amber-300 rounded-lg px-2 py-2 text-sm outline-none focus:border-amber-500 transition-all"
                              />
                            </div>
                            <button
                              onClick={() => saveEditVariant(v)}
                              disabled={varSaving}
                              className="w-8 h-8 bg-amber-500 text-white rounded-lg flex items-center justify-center hover:bg-amber-600 transition-all disabled:opacity-60 flex-shrink-0"
                            >
                              {varSaving ? <Loader2 size={12} className="animate-spin"/> : <Check size={12}/>}
                            </button>
                            <button
                              onClick={() => { setEditVarId(null); setEditVarLabel(""); setEditVarPrice(""); setVarErr(""); }}
                              className="w-8 h-8 bg-gray-200 text-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-all flex-shrink-0"
                            >
                              <X size={12}/>
                            </button>
                          </div>
                        ) : (
                          /* Mode tampil */
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-800">{v.label}</p>
                              <p className="text-xs text-amber-600 font-bold">Rp{Number(v.harga).toLocaleString("id-ID")}</p>
                            </div>
                            {v.isTemp && (
                              <span className="text-[9px] bg-yellow-100 text-yellow-700 font-bold px-1.5 py-0.5 rounded-full border border-yellow-200">
                                belum tersimpan
                              </span>
                            )}
                            <button
                              onClick={() => startEditVariant(v)}
                              className="w-7 h-7 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center text-blue-500 transition-all flex-shrink-0"
                            >
                              <Edit3 size={11}/>
                            </button>
                            <button
                              onClick={() => deleteVariant(v)}
                              disabled={deletingVarId === v.id}
                              className="w-7 h-7 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center text-red-400 transition-all disabled:opacity-60 flex-shrink-0"
                            >
                              {deletingVarId === v.id
                                ? <Loader2 size={11} className="animate-spin"/>
                                : <Trash2 size={11}/>
                              }
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* ── Form tambah varian baru ── */}
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                    <p className="text-xs font-bold text-amber-700">Tambah Varian Baru</p>
                    <div className="flex gap-2">
                      <input
                        value={newVarLabel}
                        onChange={e => setNewVarLabel(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addVariant()}
                        placeholder="Label (mis. Hot, Iced)"
                        className="flex-1 border-2 border-amber-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all bg-white"
                      />
                      <div className="flex items-center gap-1 border-2 border-amber-300 rounded-xl px-3 bg-white focus-within:border-amber-500 transition-all">
                        <span className="text-xs text-gray-400 flex-shrink-0">Rp</span>
                        <input
                          type="number"
                          value={newVarPrice}
                          onChange={e => setNewVarPrice(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && addVariant()}
                          placeholder="Harga"
                          className="w-24 py-2.5 text-sm outline-none bg-transparent"
                        />
                      </div>
                      <button
                        onClick={addVariant}
                        disabled={varSaving || !newVarLabel.trim() || !newVarPrice}
                        className="px-4 py-2 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all disabled:opacity-60 flex items-center gap-1.5"
                      >
                        {varSaving ? <Loader2 size={14} className="animate-spin"/> : <Plus size={14}/>}
                        <span className="text-xs">Tambah</span>
                      </button>
                    </div>
                  </div>

                  {/* Empty state */}
                  {getVariantsByCategory().length === 0 && (
                    <div className="text-center py-6 text-gray-400">
                      <Hash size={32} className="mx-auto mb-2 opacity-30"/>
                      <p className="text-sm">Belum ada varian untuk kategori {getSelectedCategoryName() || "ini"}.</p>
                      <p className="text-xs mt-1">Tambah varian di atas.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
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
  );
}