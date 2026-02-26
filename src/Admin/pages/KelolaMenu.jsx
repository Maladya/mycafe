import { useState, useEffect } from "react";
import { Plus, Search, Image, Edit3, Trash2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { defaultCategories, getCatColor } from "../data/constants";
import { useAdmin } from "../AdminPanel";
import MenuForm from "../components/MenuForm";
import { ConfirmDialog } from "../components/SharedComponents";

const API_URL = import.meta.env.VITE_API_URL ?? "http://192.168.1.3:3000";
const PER_PAGE = 6;

// Normalisasi URL gambar — ganti IP lama yang salah ke API_URL yang benar
const fixImgUrl = (url) => {
  if (!url?.trim()) return "";
  // Jika sudah URL penuh dengan host berbeda, ganti hostnya ke API_URL
  try {
    const parsed = new URL(url);
    const base   = new URL(API_URL);
    if (parsed.host !== base.host) {
      parsed.host     = base.host;
      parsed.protocol = base.protocol;
    }
    return parsed.toString();
  } catch {
    // Bukan URL absolut (mis. path relatif /asset/...) → prefix API_URL
    return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  }
};

export default function KelolaMenu() {
  const { menuItems, setMenuItems, showToast } = useAdmin();

  const [categories, setCategories] = useState(defaultCategories);
  const [search,     setSearch]     = useState("");
  const [catFilter,  setCatFilter]  = useState("all");
  const [showForm,   setShowForm]   = useState(false);
  const [editItem,   setEditItem]   = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [page,       setPage]       = useState(1);
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [showDetail, setShowDetail] = useState(null);

  // ── Fetch kategori untuk tombol filter ─────────────────────────────────
  useEffect(() => {
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
    fetchKategori();
  }, []);

  // ── Fetch menu dari API (bisa dipanggil ulang) ──────────────────────────
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
    } catch (err) {
      console.error("Fetch menu error:", err);
    }
  };

  useEffect(() => { fetchMenu(); }, []);

  // ── Filter & Pagination ──────────────────────────────────────────────────
  const filtered = (menuItems ?? []).filter(m =>
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
          headers: {
            "Content-Type": "application/json",
            Authorization:  `Bearer ${token}`,
          },
          body: JSON.stringify(item),
        }
      );

      const data = await res.json();
      console.log("Save menu response:", data); // bantu debug struktur response

      if (!res.ok || data.success === false) {
        showToast(data.message ?? data.error ?? "Gagal menyimpan menu", "error");
        return;
      }

      // Ambil item hasil simpan dari server (fallback ke item lokal)
      const savedItem = data.data ?? data.menu ?? data.item ?? item;

      // Fetch ulang dari API agar data tampil lengkap (dengan relasi kategori dll)
      await fetchMenu();
      showToast(isEdit ? "Menu diupdate!" : "Menu ditambahkan!", "success");

      setShowForm(false);
      setEditItem(null);

    } catch (err) {
      console.error("handleSave error:", err);
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
      console.error("handleDel error:", err);
      showToast("Gagal terhubung ke server", "error");
    } finally {
      setDeleting(false);
    }
  };

  // ── Toggle Stok ──────────────────────────────────────────────────────────
  const toggleStock = async (id) => {
    const item    = menuItems.find(m => m.id === id);
    const updated = { ...item, status: !item.status };

    // Optimistic update dulu
    setMenuItems(p => p.map(m => m.id === id ? updated : m));

    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`${API_URL}/api/menu/${id}`, {
        method:  "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify(updated),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        // Rollback kalau gagal
        setMenuItems(p => p.map(m => m.id === id ? item : m));
        showToast(data.message ?? "Gagal update stok", "error");
        return;
      }

      showToast("Stok diupdate!", "success");

    } catch (err) {
      // Rollback kalau error
      setMenuItems(p => p.map(m => m.id === id ? item : m));
      console.error("toggleStock error:", err);
      showToast("Gagal terhubung ke server", "error");
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-gray-900">Kelola Menu</h1>
          <p className="text-gray-400 text-sm">
            {(menuItems ?? []).length} item · {(menuItems ?? []).filter(m => !m.status).length} stok habis
          </p>
        </div>
        <button
          onClick={() => { setEditItem(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl px-4 py-2.5 font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all text-sm"
        >
          <Plus size={16}/> Tambah Menu
        </button>
      </div>

      {/* Search + Category Filter */}
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
          {["all", ...categories].map(c => {
            const val   = c === "all" ? "all" : String(c?.id ?? c?.nama_kategori ?? c);
            const label = c === "all" ? "Semua" : (c?.nama_kategori ?? c?.name ?? c);
            return (
              <button
                key={val}
                onClick={() => { setCatFilter(val); setPage(1); }}
                className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${catFilter===val?"bg-amber-500 text-white shadow-md":"bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
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
              {paged.map(item => (
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
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getCatColor(item.id_kategori)}`}>
                      {item.nama_kategori ?? categories.find(c => String(c?.id) === String(item.id_kategori))?.nama_kategori ?? item.id_kategori}
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
                      className={`w-12 h-6 rounded-full transition-all duration-300 relative ${item.status?"bg-green-500":"bg-gray-300"}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${item.status?"left-[26px]":"left-0.5"}`}/>
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
              ))}
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

            {/* ── Header: Tombol X kanan ── */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h2 className="text-lg font-black text-gray-900 truncate pr-2">{showDetail.nama_menu}</h2>
              <button
                onClick={() => setShowDetail(null)}
                className="flex-shrink-0 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center text-gray-500 transition-all"
              >
                <X size={15}/>
              </button>
            </div>

            {/* ── Foto ── */}
            <div className="relative w-full h-52 bg-gray-100 mx-0">
              {fixImgUrl(showDetail.image_url)
                ? <img
                    src={fixImgUrl(showDetail.image_url)}
                    alt={showDetail.nama_menu}
                    className="w-full h-full object-cover"
                    onError={e => { e.currentTarget.style.display = "none"; }}
                  />
                : <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Image size={48}/>
                  </div>
              }
              {/* Status stok — kiri bawah */}
              <span className={`absolute bottom-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full shadow ${showDetail.status ? "bg-green-500 text-white" : "bg-gray-400 text-white"}`}>
                {showDetail.status ? "✓ Tersedia" : "✗ Habis"}
              </span>
              {/* Badge — kanan bawah */}
              {showDetail.badge && (
                <span className="absolute bottom-3 right-3 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                  {showDetail.badge}
                </span>
              )}
            </div>

            {/* ── Konten ── */}
            <div className="p-5 space-y-4">

              {/* Kategori + Harga */}
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getCatColor(showDetail.id_kategori)}`}>
                  {showDetail.nama_kategori ?? categories.find(c => String(c?.id) === String(showDetail.id_kategori))?.nama_kategori ?? showDetail.id_kategori}
                </span>
                <p className="text-xl font-black text-amber-600">Rp{Number(showDetail.harga ?? 0).toLocaleString("id-ID")}</p>
              </div>

              {/* Deskripsi */}
              {showDetail.description ? (
                <div className="bg-gray-50 rounded-2xl px-4 py-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Deskripsi</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{showDetail.description}</p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-2xl px-4 py-3">
                  <p className="text-sm text-gray-400 italic">Tidak ada deskripsi</p>
                </div>
              )}

              {/* Varian */}
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

              {/* Tombol aksi */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setEditItem(showDetail); setShowForm(true); setShowDetail(null); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl py-2.5 font-semibold text-sm transition-all"
                >
                  <Edit3 size={14}/> Edit Menu
                </button>
                <button
                  onClick={() => { setConfirmDel(showDetail.id); setShowDetail(null); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl py-2.5 font-semibold text-sm transition-all"
                >
                  <Trash2 size={14}/> Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDel && (
        <ConfirmDialog
          msg="Yakin hapus menu ini?"
          onConfirm={() => handleDel(confirmDel)}
          onCancel={() => setConfirmDel(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}