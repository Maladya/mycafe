import { useState } from "react";
import { Plus, Search, Image, Edit3, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { defaultCategories, getCatColor } from "../data/constants";
import { useAdmin } from "../AdminPanel";
import MenuForm from "../components/MenuForm";
import { ConfirmDialog } from "../components/SharedComponents";

const PER_PAGE = 6;

export default function KelolaMenu() {
  const { menuItems, setMenuItems, showToast } = useAdmin();

  const [categories, setCategories] = useState(defaultCategories);
  const [search,     setSearch]     = useState("");
  const [catFilter,  setCatFilter]  = useState("all");
  const [showForm,   setShowForm]   = useState(false);
  const [editItem,   setEditItem]   = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [page,       setPage]       = useState(1);

  const handleTambahMenu = async () => {
    try {
      const response = await fetch("http://192.168.1.13:3000/menus", {
        method: "POST",
        headers: {
          authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nama_menu: namaMenu,
          kode_menu: kodeMenu,
          id_kategori: kategoriList.find(k => k.name === kategori)?.id || 0,
          deskripsi,
          sub_kategori: subKategori,
          harga,
          foto: previewUrl,
        }),
      });
      const data = await response.json();
      if (data.success === true) {
        toast.success("Menu berhasil ditambahkan");
        setTimeout(() => { window.location.href = "/admin/menu/menu"; }, 1000);
      } else {
        toast.error(data.message);
        console.log(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const filtered = (menuItems ?? []).filter(m =>
    (catFilter === "all" || m.category === catFilter) &&
    (m.name ?? "").toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged      = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSave = (item) => {
    if (editItem) {
      setMenuItems(p => p.map(m => m.id === item.id ? item : m));
      showToast("Menu diupdate!", "success");
    } else {
      setMenuItems(p => [...p, item]);
      showToast("Menu ditambahkan!", "success");
    }
    setShowForm(false); setEditItem(null);
  };

  const handleDel = (id) => {
    setMenuItems(p => p.filter(m => m.id !== id));
    setConfirmDel(null);
    showToast("Menu dihapus!", "success");
  };

  const toggleStock = (id) => {
    setMenuItems(p => p.map(m => m.id === id ? { ...m, stock: !m.stock } : m));
    showToast("Stok diupdate!", "success");
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-gray-900">Kelola Menu</h1>
          <p className="text-gray-400 text-sm">
            {(menuItems ?? []).length} item · {(menuItems ?? []).filter(m => !m.stock).length} stok habis
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
          {["all", ...categories].map(c => (
            <button
              key={c}
              onClick={() => { setCatFilter(c); setPage(1); }}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${catFilter===c?"bg-amber-500 text-white shadow-md":"bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {c === "all" ? "Semua" : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Menu</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Kategori</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Harga / Varian</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Stok</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.map(item => (
                <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                        {item.image
                          ? <img src={item.image} alt={item.name} className="w-full h-full object-cover"/>
                          : <div className="w-full h-full flex items-center justify-center"><Image size={16} className="text-gray-300"/></div>
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate max-w-[130px] lg:max-w-none">{item.name}</p>
                        {item.badge   && <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getCatColor(item.category)}`}>{item.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-gray-900">Rp{Number(item.price ?? item.harga ?? 0).toLocaleString("id-ID")}</span>
                    {item.variants && item.variants.length > 1 && (
                      <p className="text-[10px] text-blue-500 font-semibold mt-0.5">{item.variants.length} varian</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleStock(item.id)}
                      className={`w-12 h-6 rounded-full transition-all duration-300 relative ${item.stock?"bg-green-500":"bg-gray-300"}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${item.stock?"left-[26px]":"left-0.5"}`}/>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => { setEditItem(item); setShowForm(true); }}
                        className="w-8 h-8 bg-blue-50 hover:bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 transition-all"
                      >
                        <Edit3 size={14}/>
                      </button>
                      <button
                        onClick={() => setConfirmDel(item.id)}
                        className="w-8 h-8 bg-red-50 hover:bg-red-100 rounded-xl flex items-center justify-center text-red-500 transition-all"
                      >
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400 text-sm">Tidak ada menu ditemukan</td></tr>
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
        />
      )}
      {confirmDel && (
        <ConfirmDialog
          msg="Yakin hapus menu ini?"
          onConfirm={() => handleDel(confirmDel)}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}