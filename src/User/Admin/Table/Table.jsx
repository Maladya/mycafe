import SideBar from "../../Layout/Layouts";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../../components/ConfirmModal";
import {
  Coffee, ChevronRight, Plus, Search,
  Eye, PencilLine, Trash2, Table2, CheckCircle2, XCircle, QrCode
} from "lucide-react";

export default function Table() {
  const navigate = useNavigate();
  
  const [tables, setTables] = useState([]);
  const [stats, setStats] = useState({});   

  const [confirmOpen,  setConfirmOpen]  = useState(false);
  const [selectedId,   setSelectedId]   = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastOpen,    setToastOpen]    = useState(false);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [activeFilter, setActiveFilter] = useState("Semua");

  useEffect(() => {
    if (!toastOpen) return;
    const t = setTimeout(() => setToastOpen(false), 2200);
    return () => clearTimeout(t);
  }, [toastOpen]);

  const fetchTables = async () => {
    try {
      const response = await fetch(`http://192.168.1.2:3000/tables`, {
        headers: {
          authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      const data = await response.json();
      setTables(data.data);
    } catch (error) {
      console.error("Error fetching tables:", error);
    }
  };

  const getStatus = async () => {
    try {
      const response = await fetch(`http://192.168.1.2:3000/tables?status=${activeFilter}`, {
        headers: {
          authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      const data = await response.json();
      setTables(data.data);
    } catch (error) {
      console.error("Error fetching status:", error);
    }
  }


    const getStat = async () => {
     try{
       const response = await fetch(`http://192.168.1.2:3000/tables/stats`, {
        headers: {
          authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      const data = await response.json();
      setStats(data.data)
    }
     catch (error) {
      console.error("Error fetching stats:", error);
    }
  }

  useEffect(() => {
    fetchTables();
    getStat();
  }, []);


  useEffect(() => {
    getStatus();
  }, [activeFilter]);

  const openDelete = (id) => { setSelectedId(id); setConfirmOpen(true); };

  const confirmDelete = async () => {
    if (selectedId == null) return;
    try {
      const response = await fetch(`http://192.168.1.2:3000/tables/${selectedId}`, {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setTables((prev) => prev.filter((table) => table.id !== selectedId));
      }
    } catch (error) {
      console.error("Error deleting table:", error);
    }
    setConfirmOpen(false);
    setSelectedId(null);
    setToastMessage("Meja berhasil dihapus");
    setToastOpen(true);
  };

  const filters = ["Semua", "Kosong", "Terisi"];

  const filteredTables = tables.length > 0 ?  tables.filter((t) => {
    const matchSearch = t.nomor_meja.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = activeFilter === "Semua" || t.status === activeFilter;
    return matchSearch && matchFilter;
  }) : [];
  

  const kosongCount = filteredTables.filter(t => t.status === "kosong").length;
  const terisiCount = filteredTables.filter(t => t.status === "terisi").length;


  useEffect(() => {
    console.log(filteredTables);
  }, [filteredTables]);

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
            <span>Manage Table</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-blue-600 font-bold">Table</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">

          {/* ── Toast ── */}
          {toastOpen && (
            <div className="fixed top-6 right-6 z-50">
              <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold bg-emerald-500 text-white">
                <CheckCircle2 className="w-4 h-4" />
                <span>{toastMessage}</span>
              </div>
            </div>
          )}

          {/* ── Header ── */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-1">Manage Table</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-gray-800">Daftar Meja</h3>
              <p className="text-gray-400 text-sm mt-1">{stats.total} meja terdaftar</p>
            </div>
            <button
              onClick={() => navigate("/admin/table/tambahtable")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all"
              style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}
            >
              <Plus className="w-4 h-4" />
              Tambah Meja
            </button>
          </div>

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* Total */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "#eff6ff" }}>
                <Table2 className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-800">{stats.total || 0}</p>
                <p className="text-xs text-gray-400 font-medium">Total Meja</p>
              </div>
            </div>
            {/* Kosong */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "#f0fdf4" }}>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-800">{stats.kosong || 0}</p>
                <p className="text-xs text-gray-400 font-medium">Meja Kosong</p>
              </div>
            </div>
            {/* Terisi */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "#fff7ed" }}>
                <XCircle className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-800">{stats.terisi || 0}</p>
                <p className="text-xs text-gray-400 font-medium">Meja Terisi</p>
              </div>
            </div>
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
                placeholder="Cari nomor meja..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-blue-400 transition-all"
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
                  {["No", "Nomor Meja", "Status", "Aksi"].map((h, i) => (
                    <th
                      key={h}
                      className={`px-6 py-4 text-xs font-bold uppercase tracking-wider text-blue-400 ${i === 3 ? "text-center" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredTables.length > 0 ? (
                  filteredTables.map((table,i) => (
                    <tr
                      key={table.id}
                      className="transition-colors hover:bg-gray-50"
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                    >
                      {/* No */}
                      <td className="px-6 py-4">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-blue-600"
                          style={{ background: "#eff6ff" }}
                        >
                          {i + 1}
                        </div>
                      </td>

                      {/* Nomor Meja */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: table.status === "Kosong" ? "#f0fdf4" : "#fff7ed" }}
                          >
                            <Table2
                              className="w-4 h-4"
                              style={{ color: table.status === "Kosong" ? "#16a34a" : "#ea580c" }}
                            />
                          </div>
                          <p className="font-semibold text-gray-800 text-sm">{table.nomor_meja}</p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                          style={
                            table.status === "Kosong"
                              ? { background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }
                              : { background: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa" }
                          }
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: table.status === "Kosong" ? "#22c55e" : "#f97316" }}
                          />
                          {table.status}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          {/* QR Code Button */}
                          <button
                            onClick={() => navigate(`/admin/table/cetakqr/${table.id}`)}
                            title="Cetak QR Code"
                            className="p-2 rounded-lg transition-all text-gray-400 hover:bg-purple-50 hover:text-purple-600"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          
                          
                          
                          {/* Edit Button */}
                          <button
                            onClick={() => navigate(`/admin/table/edittable/${table.id}`)}
                            title="Edit Meja"
                            className="p-2 rounded-lg transition-all text-gray-400 hover:bg-orange-50 hover:text-orange-600"
                          >
                            <PencilLine className="w-4 h-4" />
                          </button>
                          
                          {/* Delete Button */}
                          <button
                            onClick={() => openDelete(table.id)}
                            title="Hapus Meja"
                            className="p-2 rounded-lg transition-all text-gray-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-20 text-center">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#eff6ff" }}>
                        <Table2 className="w-8 h-8 text-blue-200" />
                      </div>
                      <p className="text-gray-400 font-medium text-sm">
                        {searchQuery || activeFilter !== "Semua" ? "Tidak ada meja yang cocok" : "Belum ada data meja"}
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
            {filteredTables.length > 0 && (
              <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: "1px solid #f1f5f9" }}>
                <p className="text-xs text-gray-400">
                  Menampilkan{" "}
                  <span className="font-semibold text-gray-600">{filteredTables.length}</span>{" "}
                  dari{" "}
                  <span className="font-semibold text-gray-600">{tables.length}</span> meja
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
        title="Hapus Meja"
        message="Data meja yang dihapus tidak dapat dikembalikan."
        confirmText="Hapus"
        cancelText="Batal"
        onClose={() => { setConfirmOpen(false); setSelectedId(null); }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
