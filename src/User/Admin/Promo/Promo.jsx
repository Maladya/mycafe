import SideBar from "../../Layout/Layouts";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../../components/ConfirmModal";
import {
  Coffee, ChevronRight, Plus, Search, Eye, PencilLine, Trash2,
  Tag, CheckCircle2, XCircle, Calendar, Percent, UtensilsCrossed
} from "lucide-react";

export default function Promo() {
  const navigate = useNavigate();

  const [promos, setPromos] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Semua");

  const handleFetchPromos = async () => {
    try {
      const response = await fetch("http://192.168.1.2:3000/promos", {
        method: "GET",
        headers: {
          authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.success) setPromos(data.data);
    } catch (error) {
      console.error("Error fetching promos:", error);
    }
  };

  useEffect(() => { handleFetchPromos(); }, []);

  useEffect(() => {
    if (!toastOpen) return;
    const t = setTimeout(() => setToastOpen(false), 2200);
    return () => clearTimeout(t);
  }, [toastOpen]);

  const openDelete = (e, id) => {
    e.stopPropagation();
    setSelectedId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedId == null) return;
    try {
      const response = await fetch(`http://192.168.1.2:3000/promos/${selectedId}`, {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.success) {
        setPromos((prev) => prev.filter((p) => p.id !== selectedId));
        setConfirmOpen(false);
        setSelectedId(null);
        setToastMessage("Promo berhasil dihapus");
        setToastOpen(true);
      }
    } catch (error) {
      console.error("Error deleting promo:", error);
      setToastMessage("Gagal menghapus promo");
      setToastOpen(true);
    }
  };

  const getUniqueCategories = (menus) => {
    if (!menus || !Array.isArray(menus)) return [];
    return [...new Set(menus.map((m) => m.kategori?.name).filter(Boolean))];
  };

  const getCategoryStyle = (kategori) => {
    switch (kategori) {
      case "Makanan": return { bg: "#fff7ed", text: "#c2410c", dot: "#fb923c", border: "#fed7aa" };
      case "Minuman": return { bg: "#eff6ff", text: "#1d4ed8", dot: "#60a5fa", border: "#bfdbfe" };
      case "Dessert": return { bg: "#fdf2f8", text: "#be185d", dot: "#f472b6", border: "#fbcfe8" };
      default: return { bg: "#f9fafb", text: "#374151", dot: "#9ca3af", border: "#e5e7eb" };
    }
  };

  // Normalisasi status ke Title Case agar konsisten terlepas dari format di DB
  const normalizeStatus = (status) => {
    if (!status) return "";
    const s = status.toLowerCase();
    if (s === "aktif") return "Aktif";
    if (s === "nonaktif") return "Nonaktif";
    if (s === "expired") return "Expired";
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const getStatusStyle = (status) => {
    switch (normalizeStatus(status)) {
      case "Aktif":
        return { badge: { background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }, dot: "#22c55e" };
      case "Nonaktif":
        return { badge: { background: "#f9fafb", color: "#6b7280", border: "1px solid #e5e7eb" }, dot: "#9ca3af" };
      case "Expired":
        return { badge: { background: "#fff1f2", color: "#dc2626", border: "1px solid #fecaca" }, dot: "#ef4444" };
      default:
        return { badge: { background: "#f9fafb", color: "#6b7280", border: "1px solid #e5e7eb" }, dot: "#9ca3af" };
    }
  };

  const filters = [
    "Semua",
    ...new Set(promos.flatMap((p) => p.menus?.map((m) => m.kategori?.name).filter(Boolean) || [])),
  ];

  const filteredPromos = promos.filter((p) => {
    const matchSearch =
      p.kode_promo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.menus?.some((m) => m.nama_menu?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchFilter =
      activeFilter === "Semua" ||
      p.menus?.some((m) => m.kategori?.name === activeFilter);
    return matchSearch && matchFilter;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(dateString));
  };

  const aktifCount   = promos.filter((p) => normalizeStatus(p.status) === "Aktif").length;
  const nonaktifCount = promos.filter((p) => normalizeStatus(p.status) === "Nonaktif").length;
  const expiredCount = promos.filter((p) => normalizeStatus(p.status) === "Expired").length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SideBar />
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Bar */}
        <div className="h-14 bg-white sticky top-0 z-20 flex items-center justify-between px-8 border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 font-black text-lg tracking-tight text-blue-700">
            <Coffee className="w-5 h-5 text-blue-600" />
            <span>MyCafe</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span>Admin</span>
            <ChevronRight className="w-3 h-3" />
            <span>Manage Promo</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-blue-600 font-bold">Promo</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">

          {/* Toast */}
          {toastOpen && (
            <div className="fixed top-6 right-6 z-50">
              <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold ${toastMessage.includes("berhasil") ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
                <CheckCircle2 className="w-4 h-4" />
                <span>{toastMessage}</span>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-1">Manage Promo</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-gray-800">Daftar Promo</h3>
              <p className="text-gray-400 text-sm mt-1">{promos.length} promo terdaftar</p>
            </div>
            <button onClick={() => navigate("/admin/promo/tambahpromo")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all"
              style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
              <Plus className="w-4 h-4" />
              Tambah Promo
            </button>
          </div>

          {/* Stat Cards — 4 cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "#eff6ff" }}>
                <Tag className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-800">{promos.length}</p>
                <p className="text-xs text-gray-400 font-medium">Total Promo</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "#f0fdf4" }}>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-800">{aktifCount}</p>
                <p className="text-xs text-gray-400 font-medium">Promo Aktif</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "#f9fafb" }}>
                <XCircle className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-800">{nonaktifCount}</p>
                <p className="text-xs text-gray-400 font-medium">Promo Nonaktif</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "#fff1f2" }}>
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-800">{expiredCount}</p>
                <p className="text-xs text-gray-400 font-medium">Promo Expired</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kode promo atau nama menu..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-blue-400 transition-all" />
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl p-1">
              {filters.map((f) => (
                <button key={f} onClick={() => setActiveFilter(f)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
                  style={activeFilter === f
                    ? { background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", color: "#fff", boxShadow: "0 2px 6px rgba(29,78,216,0.3)" }
                    : { color: "#6b7280" }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: "linear-gradient(90deg,#eff6ff,#f8faff)", borderBottom: "1px solid #e0e7ff" }}>
                    {["No", "Kode Promo", "Kategori", "Jumlah Menu", "Berlaku Sampai", "Diskon", "Status", "Aksi"].map((h, i) => (
                      <th key={h} className={`px-6 py-4 text-xs font-bold uppercase tracking-wider text-blue-400 ${i === 7 ? "text-center" : "text-left"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPromos.length > 0 ? (
                    filteredPromos.map((promo, index) => {
                      const uniqueCategories = getUniqueCategories(promo.menus);
                      const menuCount = promo.menus?.length || 0;
                      const statusStyle = getStatusStyle(promo.status);
                      const statusLabel = normalizeStatus(promo.status);

                      return (
                        <tr key={promo.id} onClick={() => navigate(`/admin/promo/detailpromo/${promo.id}`)}
                          className="transition-colors hover:bg-blue-50 cursor-pointer"
                          style={{ borderBottom: "1px solid #f1f5f9" }}>

                          <td className="px-6 py-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-blue-600" style={{ background: "#eff6ff" }}>
                              {index + 1}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#fef3c7" }}>
                                <Tag className="w-4 h-4 text-yellow-600" />
                              </div>
                              <p className="font-bold text-gray-800 text-sm">{promo.kode_promo || "-"}</p>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1.5">
                              {uniqueCategories.length > 0 ? uniqueCategories.map((kategori, idx) => {
                                const cat = getCategoryStyle(kategori);
                                return (
                                  <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                                    style={{ background: cat.bg, color: cat.text, border: `1px solid ${cat.border}` }}>
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat.dot }} />
                                    {kategori}
                                  </span>
                                );
                              }) : <span className="text-xs text-gray-400">-</span>}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#eff6ff" }}>
                                <UtensilsCrossed className="w-3.5 h-3.5 text-blue-400" />
                              </div>
                              <span className="text-sm font-semibold text-gray-700">{menuCount} item</span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              <span>{formatDate(promo.berlaku_sampai)}</span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg" style={{ background: "#fef3c7" }}>
                              <Percent className="w-3 h-3 text-yellow-700" />
                              <span className="text-sm font-bold text-yellow-700">{promo.diskon_persen || 0}%</span>
                            </div>
                          </td>

                          {/* Status — normalized, proper case, correct color */}
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                              style={statusStyle.badge}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusStyle.dot }} />
                              {statusLabel}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/promo/detailpromo/${promo.id}`); }}
                                className="p-2 rounded-lg transition-all text-gray-400 hover:bg-blue-50 hover:text-blue-600">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/promo/editpromo/${promo.id}`); }}
                                className="p-2 rounded-lg transition-all text-gray-400 hover:bg-orange-50 hover:text-orange-600">
                                <PencilLine className="w-4 h-4" />
                              </button>
                              <button onClick={(e) => openDelete(e, promo.id)}
                                className="p-2 rounded-lg transition-all text-gray-400 hover:bg-red-50 hover:text-red-600">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="py-20 text-center">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#eff6ff" }}>
                          <UtensilsCrossed className="w-8 h-8 text-blue-200" />
                        </div>
                        <p className="text-gray-400 font-medium text-sm">
                          {searchQuery || activeFilter !== "Semua" ? "Tidak ada promo yang cocok" : "Belum ada data promo"}
                        </p>
                        {(searchQuery || activeFilter !== "Semua") && (
                          <button onClick={() => { setSearchQuery(""); setActiveFilter("Semua"); }}
                            className="mt-3 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">
                            Reset filter
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredPromos.length > 0 && (
              <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: "1px solid #f1f5f9" }}>
                <p className="text-xs text-gray-400">
                  Menampilkan <span className="font-semibold text-gray-600">{filteredPromos.length}</span> dari{" "}
                  <span className="font-semibold text-gray-600">{promos.length}</span> promo
                  {" · "}<span className="text-blue-400 font-medium">Klik baris untuk melihat detail</span>
                </p>
                <div className="flex items-center gap-1">
                  {["«", "1", "2", "3", "»"].map((p) => (
                    <button key={p} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border"
                      style={p === "1"
                        ? { background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", color: "#fff", border: "none", boxShadow: "0 2px 6px rgba(29,78,216,0.3)" }
                        : { color: "#6b7280", borderColor: "#e5e7eb", background: "white" }}>
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
        title="Hapus Promo"
        message="Data promo yang dihapus tidak dapat dikembalikan."
        confirmText="Hapus"
        cancelText="Batal"
        onClose={() => { setConfirmOpen(false); setSelectedId(null); }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
