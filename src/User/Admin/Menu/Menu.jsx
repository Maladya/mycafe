import SideBar from "../../Layout/Layouts";
import { useEffect, useState } from "react";
import ConfirmModal from "../../components/ConfirmModal";
import {
  Eye, PencilLine, Trash2, Plus, Search,
  Coffee, ChevronRight, UtensilsCrossed
} from "lucide-react";
import { useMemo } from "react";


export default function Menu() {
  const [menuItems, setMenuItems] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Semua");

  const fetchMenuItems = async () => {
    try {
      const response = await fetch("http://192.168.1.13:3000/menus", {
        method: "GET",
        headers: {
          authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      console.log("Data menu dari server:", data.data);
      setMenuItems(data.data);
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  };

  useEffect(() => { fetchMenuItems(); }, []);

  useEffect(() => {
    if (!toastOpen) return;
    const t = setTimeout(() => setToastOpen(false), 2200);
    return () => clearTimeout(t);
  }, [toastOpen]);

  const openDelete = (id) => { setSelectedId(id); setConfirmOpen(true); };
  const handleEdit  = (id) => { window.location.href = `/admin/menu/editmenu/${id}`; };
  const handleView  = (id) => {
    console.log("View button clicked, ID:", id);
    console.log("Navigating to:", `/admin/menu/detailmenu/${id}`);
    window.location.href = `/admin/menu/detailmenu/${id}`;
  };

  const confirmDelete = async () => {
    if (selectedId == null) return;
    try {
      const response = await fetch(`http://192.168.1.13:3000/menus/${selectedId}`, {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      console.log("Delete response:", data);
      if (data.success === true) {
        setMenuItems((prev) => prev.filter((item) => item.id !== selectedId));
        setConfirmOpen(false);
        setSelectedId(null);
        setToastMessage("Menu berhasil dihapus");
        setToastOpen(true);
        setTimeout(() => { fetchMenuItems(); }, 500);
      } else {
        setToastMessage(data.message || "Gagal menghapus menu");
        setToastOpen(true);
      }
    } catch (error) {
      console.error("Error deleting menu:", error);
      setToastMessage("Terjadi kesalahan saat menghapus menu");
      setToastOpen(true);
    }
  };

  const formatHarga = (harga) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(harga);

  const getCategoryStyle = (kategori) => {
    switch (kategori) {
      case "Makanan": return { bg: "#fff7ed", text: "#c2410c", dot: "#fb923c", border: "#fed7aa" };
      case "Minuman": return { bg: "#eff6ff", text: "#1d4ed8", dot: "#60a5fa", border: "#bfdbfe" };
      case "Dessert": return { bg: "#fdf2f8", text: "#be185d", dot: "#f472b6", border: "#fbcfe8" };
      default:        return { bg: "#f9fafb", text: "#374151", dot: "#9ca3af", border: "#e5e7eb" };
    }
  };

const filters = useMemo(() => {
  return [
    "Semua",
    ...new Set(
      menuItems
        .map(item => item.kategori?.name)
        .filter(Boolean)
    )
  ];
}, [menuItems]);
  const filteredItems = menuItems.filter((item) => {
  const matchSearch =
    item.nama_menu?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.kategori?.name?.toLowerCase().includes(searchQuery.toLowerCase());

  const matchFilter =
    activeFilter === "Semua" ||
    item.kategori?.name === activeFilter;

  return matchSearch && matchFilter;
});

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SideBar />

      <div className="flex-1 flex flex-col min-w-0">

        {/* ── Top Bar ── */}
        <div className="h-14 bg-white sticky top-0 z-20 flex items-center justify-between px-8 border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 font-black text-lg tracking-tight text-blue-700">
            <Coffee className="w-5 h-5 text-blue-600" />
            <span>MyCafe</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span>Admin</span>
            <ChevronRight className="w-3 h-3" />
            <span>Manage Menu</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-blue-600 font-bold">Menu</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">

          {/* ── Toast ── */}
          {toastOpen && (
            <div className="fixed top-6 right-6 z-50">
              <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold ${
                toastMessage.includes("berhasil") ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
              }`}>
                <span>{toastMessage}</span>
              </div>
            </div>
          )}

          {/* ── Header ── */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-1">Manage Menu</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-gray-800">Daftar Menu</h3>
              <p className="text-gray-400 text-sm mt-1">{menuItems.length} item menu tersedia</p>
            </div>
            <button
              onClick={() => (window.location.href = "/admin/menu/tambahmenu")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all"
              style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}
            >
              <Plus className="w-4 h-4" />
              Tambah Menu
            </button>
          </div>

          {/* ── Controls ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama menu atau kategori..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-blue-400 transition-all"
                style={{ "--tw-ring-color": "rgba(59,130,246,0.2)" }}
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl p-1">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={
                    activeFilter === f
                      ? { background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", color: "#fff", boxShadow: "0 2px 6px rgba(29,78,216,0.3)" }
                      : { color: "#6b7280" }
                  }
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* ── Table ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr style={{ background: "linear-gradient(90deg,#eff6ff,#f8faff)", borderBottom: "1px solid #e0e7ff" }}>
                  {["Foto","Kategori","Nama Menu","Harga","Deskripsi","Aksi"].map((h, i) => (
                    <th
                      key={h}
                      className={`px-6 py-4 text-xs font-bold uppercase tracking-wider text-blue-400 ${i === 5 ? "text-center" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => { 
                    const cat = getCategoryStyle(item.kategori?.name);
                    return (
                      <tr
                        key={item.id}
                        className="group transition-colors"
                        style={{ borderBottom: "1px solid #f1f5f9" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f8faff"}
                        onMouseLeave={e => e.currentTarget.style.background = "white"}
                      >
                        {/* Foto */}
                        <td className="px-6 py-4">
                          <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm"
                               style={{ border: "1px solid #e0e7ff", background: "#eff6ff" }}>
                            <img
                              src={item.foto}
                              alt={item.nama_menu}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.parentElement.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#bfdbfe"><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'/></svg></div>`;
                              }}
                            />
                          </div>
                        </td>

                        {/* Kategori */}
                        <td className="px-6 py-4">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{ background: cat.bg, color: cat.text, border: `1px solid ${cat.border}` }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat.dot }} />
                            {item.kategori?.name}
                          </span>
                        </td>

                        {/* Nama */}
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-800 text-sm">{item.nama_menu}</p>
                        </td>

                        {/* Harga */}
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-blue-600">{formatHarga(item.harga)}</p>
                        </td>

                        {/* Deskripsi */}
                        <td className="px-6 py-4 max-w-xs">
                          <p className="text-sm text-gray-400 truncate">{item.deskripsi || "-"}</p>
                        </td>

                        {/* Aksi */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleView(item.id)}
                              title="Lihat Detail"
                              className="p-2 rounded-lg transition-all"
                              style={{ color: "#94a3b8" }}
                              onMouseEnter={e => { e.currentTarget.style.background="#eff6ff"; e.currentTarget.style.color="#1d4ed8"; }}
                              onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#94a3b8"; }}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(item.id)}
                              title="Edit Menu"
                              className="p-2 rounded-lg transition-all"
                              style={{ color: "#94a3b8" }}
                              onMouseEnter={e => { e.currentTarget.style.background="#fff7ed"; e.currentTarget.style.color="#c2410c"; }}
                              onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#94a3b8"; }}
                            >
                              <PencilLine className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDelete(item.id)}
                              title="Hapus Menu"
                              className="p-2 rounded-lg transition-all"
                              style={{ color: "#94a3b8" }}
                              onMouseEnter={e => { e.currentTarget.style.background="#fff1f2"; e.currentTarget.style.color="#be123c"; }}
                              onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#94a3b8"; }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="py-20 text-center">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#eff6ff" }}>
                        <UtensilsCrossed className="w-8 h-8 text-blue-200" />
                      </div>
                      <p className="text-gray-400 font-medium text-sm">
                        {searchQuery || activeFilter !== "Semua" ? "Tidak ada menu yang cocok" : "Belum ada data menu"}
                      </p>
                      {(searchQuery || activeFilter !== "Semua") && (
                        <button
                          onClick={() => { setSearchQuery(""); setActiveFilter("Semua"); }}
                          className="mt-3 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
                        >
                          Reset filter
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {filteredItems.length > 0 && (
              <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: "1px solid #f1f5f9" }}>
                <p className="text-xs text-gray-400">
                  Menampilkan{" "}
                  <span className="font-semibold text-gray-600">{filteredItems.length}</span>{" "}
                  dari{" "}
                  <span className="font-semibold text-gray-600">{menuItems.length}</span> menu
                </p>
                <div className="flex items-center gap-1">
                  {["«", "1", "2", "3", "»"].map((p) => (
                    <button
                      key={p}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border"
                      style={
                        p === "1"
                          ? { background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", color: "#fff", border: "none", boxShadow: "0 2px 6px rgba(29,78,216,0.3)" }
                          : { color: "#6b7280", borderColor: "#e5e7eb", background: "white" }
                      }
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Hapus Menu"
        message="Data menu yang dihapus tidak dapat dikembalikan."
        confirmText="Hapus"
        cancelText="Batal"
        onClose={() => { setConfirmOpen(false); setSelectedId(null); }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}