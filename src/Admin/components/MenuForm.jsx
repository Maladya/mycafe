import { useState, useRef, useEffect } from "react";
import {
  X, Image, Plus, Check, Trash2, FileText,
  Hash, Save, Upload, Loader2, Edit3, AlertCircle
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://192.168.1.2:3000";

// ─────────────────────────────────────────────────────────────────────────────
// Helper headers
// ─────────────────────────────────────────────────────────────────────────────
const authHeaders = (json = true) => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// MENU FORM MODAL — 2 tab: Info Dasar + Varian
// ─────────────────────────────────────────────────────────────────────────────
export default function MenuForm({ item, onSave, onCancel }) {

  // ── Form utama ──────────────────────────────────────────────────────────
  const [form, setForm] = useState(item ? { ...item } : {
    nama_menu: "", tagline: "", deskripsi: "",
    id_kategori: "",
    harga: "", status: true, image_url: "",
    rating: 0, totalReviews: 0, sold: 0,
    variants: [], reviews: [], related: [],
  });

  const [tab,         setTab]         = useState("basic");
  const [newVarLabel, setNewVarLabel] = useState("");
  const [newVarPrice, setNewVarPrice] = useState("");

  // ── Upload gambar ───────────────────────────────────────────────────────
  const [dragOver,     setDragOver]     = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [uploadErr,    setUploadErr]    = useState("");
  const [previewUrl,   setPreviewUrl]   = useState(item?.image_url ?? "");
  const fileRef = useRef();

  // ── Kategori ────────────────────────────────────────────────────────────
  const [categories,   setCategories]   = useState([]);
  const [catLoading,   setCatLoading]   = useState(false);
  const [catErr,       setCatErr]       = useState("");
  const [catInput,     setCatInput]     = useState("");
  const [showCatInput, setShowCatInput] = useState(false);
  const [editCatId,    setEditCatId]    = useState(null);
  const [editCatName,  setEditCatName]  = useState("");
  const [catSaving,    setCatSaving]    = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Helper: ambil id & name dari object atau string kategori
  const catId   = (c) => String(c?.id ?? c?.nama_kategori ?? c?.name ?? "unknown");
  const catName = (c) => String(c?.nama_kategori ?? c?.name ?? c?.id ?? "");

  // ── Fetch kategori saat buka form ───────────────────────────────────────
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

        // Set default hanya jika tambah baru dan belum ada id_kategori
        if (!item?.id_kategori && arr.length > 0) set("id_kategori", catId(arr[0]));
      } catch {
        setCatErr("Gagal terhubung ke server");
      } finally {
        setCatLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // ── Upload gambar → base64 (tidak butuh endpoint /api/upload) ────────────
  const uploadImage = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadErr("File harus berupa gambar (JPG, PNG, dll)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadErr("Ukuran gambar maksimal 5MB");
      return;
    }

    setUploadErr(""); setUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result; // "data:image/jpeg;base64,..."
      set("image_url", base64);
      setPreviewUrl(base64);
      setUploading(false);
    };
    reader.onerror = () => {
      setUploadErr("Gagal membaca file");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    uploadImage(e.dataTransfer.files?.[0]);
  };

  // ── Tambah kategori ─────────────────────────────────────────────────────
  const addCategory = async () => {
    const name = catInput.trim();
    if (!name) return;
    setCatSaving(true); setCatErr("");
    try {
      const res  = await fetch(`${API_URL}/api/kategori`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ nama_kategori: name }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) { setCatErr(data.message ?? "Gagal menambah kategori"); return; }

      const newCat = data.data ?? data.kategori ?? data.category ?? { nama_kategori: name };
      setCategories(p => [...p, newCat]);
      set("id_kategori", catId(newCat));
      setCatInput(""); setShowCatInput(false);
    } catch { setCatErr("Gagal terhubung ke server"); }
    finally { setCatSaving(false); }
  };

  // ── Edit kategori ───────────────────────────────────────────────────────
  const saveEditCategory = async (c) => {
    const name = editCatName.trim();
    if (!name) return;
    setCatSaving(true); setCatErr("");
    try {
      const id  = catId(c);
      const res = await fetch(`${API_URL}/api/kategori/${id}`, {
        method: "PUT", headers: authHeaders(),
        body: JSON.stringify({ nama_kategori: name }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) { setCatErr(data.message ?? "Gagal mengedit kategori"); return; }

      setCategories(p => p.map(x => catId(x) === id ? { ...x, nama_kategori: name } : x));
      setEditCatId(null); setEditCatName("");
    } catch { setCatErr("Gagal terhubung ke server"); }
    finally { setCatSaving(false); }
  };

  // ── Hapus kategori ──────────────────────────────────────────────────────
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

  // ── Simpan ──────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!form.nama_menu.trim()) { alert("Nama menu wajib diisi"); return; }
    if (!form.harga)            { alert("Harga wajib diisi"); return; }
    // FIX: saat edit, image_url sudah ada dari data lama — tidak perlu wajib upload ulang
    if (!form.image_url?.trim()) { setUploadErr("Gambar wajib diisi"); return; }

    const payload = {
      ...form,
      harga:       Number(form.harga),
      id:          item?.id || undefined,
      id_kategori: form.id_kategori,
      image_url:   form.image_url.trim(),
    };
    console.log("Payload dikirim:", payload);
    onSave(payload);
  };

  const tabs = [
    { id: "basic",    label: "Info Dasar", icon: <FileText size={13}/> },
    { id: "variants", label: "Varian",     icon: <Hash size={13}/> },
  ];

  // URL gambar yang ditampilkan: preview lokal atau URL dari form
  const displayImage = previewUrl || form.image_url;

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
            >{t.icon}{t.label}</button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">

          {tab === "basic" && (
            <>
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
                      <img
                        src={displayImage}
                        alt="preview"
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={e => { e.currentTarget.style.display = "none"; }}
                      />
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
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => uploadImage(e.target.files?.[0])}
                />
                {uploadErr && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <X size={11}/>{uploadErr}
                  </p>
                )}
                {/* Input URL manual — hanya tampil saat tidak uploading */}
                {!uploading && (
                  <div className="mt-2">
                    <p className="text-[10px] text-gray-400 mb-1">Atau masukkan URL gambar manual:</p>
                    <input
                      value={form.image_url}
                      onChange={e => {
                        set("image_url", e.target.value);
                        setPreviewUrl(e.target.value);
                        setUploadErr("");
                      }}
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

              {/* ── Kategori ── */}
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
                  <select
                    value={form.id_kategori}
                    onChange={e => set("id_kategori", e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all bg-white"
                  >
                    {categories.length === 0 && <option value="">— Belum ada kategori —</option>}
                    {categories.map(c => (
                      <option key={catId(c)} value={catId(c)}>{catName(c)}</option>
                    ))}
                  </select>
                )}

                {showCatInput && (
                  <div className="mt-2 flex gap-1.5">
                    <input
                      value={catInput}
                      onChange={e => setCatInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addCategory()}
                      placeholder="nama kategori baru..."
                      className="flex-1 border-2 border-amber-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-amber-500 transition-all"
                      autoFocus
                    />
                    <button onClick={addCategory} disabled={catSaving} className="px-2 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all disabled:opacity-60">
                      {catSaving ? <Loader2 size={12} className="animate-spin"/> : <Check size={12}/>}
                    </button>
                    <button onClick={() => { setShowCatInput(false); setCatInput(""); setCatErr(""); }} className="px-2 py-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-all">
                      <X size={12}/>
                    </button>
                  </div>
                )}

                {categories.length > 0 && !catLoading && (
                  <div className="mt-3 space-y-1.5">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Kelola Kategori</p>
                    {categories.map(c => (
                      <div key={catId(c)} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                        {editCatId === catId(c) ? (
                          <>
                            <input
                              value={editCatName}
                              onChange={e => setEditCatName(e.target.value)}
                              onKeyDown={e => e.key === "Enter" && saveEditCategory(c)}
                              autoFocus
                              className="flex-1 border-2 border-amber-300 rounded-lg px-2 py-1 text-xs outline-none focus:border-amber-500 transition-all"
                            />
                            <button onClick={() => saveEditCategory(c)} disabled={catSaving} className="w-6 h-6 bg-amber-500 text-white rounded-lg flex items-center justify-center hover:bg-amber-600 transition-all disabled:opacity-60">
                              {catSaving ? <Loader2 size={10} className="animate-spin"/> : <Check size={10}/>}
                            </button>
                            <button onClick={() => { setEditCatId(null); setEditCatName(""); setCatErr(""); }} className="w-6 h-6 bg-gray-200 text-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-all">
                              <X size={10}/>
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-xs font-semibold text-gray-700 capitalize">{catName(c)}</span>
                            <button
                              onClick={() => { setEditCatId(catId(c)); setEditCatName(catName(c)); setShowCatInput(false); setCatErr(""); }}
                              className="w-6 h-6 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center text-blue-500 transition-all"
                            >
                              <Edit3 size={10}/>
                            </button>
                            <button onClick={() => deleteCategory(c)} className="w-6 h-6 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center text-red-400 transition-all">
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

          {/* ── TAB: VARIAN ── */}
          {tab === "variants" && (
            <>
              <p className="text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                💡 Varian ditampilkan di halaman detail user (mis. Hot/Iced, Single/Double). Harga dasar diambil dari varian pertama.
              </p>
              <div className="space-y-2">
                {(form.variants || []).map((v, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <input
                        value={v.label}
                        onChange={e => {
                          const u = [...form.variants];
                          u[i] = { ...u[i], label: e.target.value };
                          set("variants", u);
                        }}
                        placeholder="Label (mis. Hot)"
                        className="border-2 border-gray-200 rounded-lg px-2 py-2 text-sm outline-none focus:border-amber-500 transition-all"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400 flex-shrink-0">Rp</span>
                        {/* FIX: pakai "harga" bukan "price" agar konsisten dengan KelolaMenu */}
                        <input
                          type="number"
                          value={v.harga}
                          onChange={e => {
                            const u = [...form.variants];
                            u[i] = { ...u[i], harga: e.target.value };
                            set("variants", u);
                          }}
                          placeholder="Harga"
                          className="flex-1 border-2 border-gray-200 rounded-lg px-2 py-2 text-sm outline-none focus:border-amber-500 transition-all"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => set("variants", form.variants.filter((_, idx) => idx !== i))}
                      className="w-8 h-8 bg-red-100 hover:bg-red-200 rounded-lg flex items-center justify-center text-red-500 transition-all flex-shrink-0"
                    >
                      <Trash2 size={14}/>
                    </button>
                  </div>
                ))}
              </div>

              {/* Tambah varian baru */}
              <div className="flex gap-2 pt-1">
                <input
                  value={newVarLabel}
                  onChange={e => setNewVarLabel(e.target.value)}
                  placeholder="Label varian"
                  className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all"
                />
                <input
                  type="number"
                  value={newVarPrice}
                  onChange={e => setNewVarPrice(e.target.value)}
                  placeholder="Harga"
                  className="w-28 border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all"
                />
                <button
                  onClick={() => {
                    if (newVarLabel.trim() && newVarPrice) {
                      // FIX: simpan sebagai "harga" bukan "price"
                      set("variants", [...(form.variants || []), { label: newVarLabel.trim(), harga: Number(newVarPrice) }]);
                      setNewVarLabel(""); setNewVarPrice("");
                    }
                  }}
                  className="px-3 py-2 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all"
                >
                  <Plus size={16}/>
                </button>
              </div>

              {(!form.variants || form.variants.length === 0) && (
                <div className="text-center py-8 text-gray-400">
                  <Hash size={32} className="mx-auto mb-2 opacity-30"/>
                  <p className="text-sm">Belum ada varian. Tambah di atas.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-3 flex gap-3 border-t border-gray-100 flex-shrink-0">
          <button onClick={onCancel} className="flex-1 border-2 border-gray-200 text-gray-700 rounded-xl py-3 font-semibold hover:bg-gray-50 transition-all">
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={uploading || catSaving}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl py-3 font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait"
          >
            <Save size={16}/> Simpan Menu
          </button>
        </div>
      </div>
    </div>
  );
}
