import SideBar from "../../Layout/Layouts";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../../components/ConfirmModal";
import {
  Coffee, ChevronRight, Plus, Search, PencilLine, Trash2,
  CheckCircle2, CreditCard, Wallet, Building2, Tag,
  TrendingUp, XCircle, Filter
} from "lucide-react";

const METHOD_META = {
  "Transfer Bank": { icon: Building2, color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  "E-Wallet":      { icon: Wallet,    color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  "Kartu Kredit":  { icon: CreditCard,color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
};

export default function Payment() {
  const navigate = useNavigate();

  const [payments, setPayments] = useState([
    { id: 1, no: 1, nama: "TRX001", status: "Transfer Bank",  aktif: true  },
    { id: 2, no: 2, nama: "TRX002", status: "E-Wallet",       aktif: true  },
    { id: 3, no: 3, nama: "TRX003", status: "Kartu Kredit",   aktif: false },
    { id: 4, no: 4, nama: "TRX004", status: "Transfer Bank",  aktif: true  },
  ]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedId,  setSelectedId]  = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastOpen,   setToastOpen]   = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Semua");

  useEffect(() => {
    if (!toastOpen) return;
    const t = setTimeout(() => setToastOpen(false), 2200);
    return () => clearTimeout(t);
  }, [toastOpen]);

  const openDelete = (id) => { setSelectedId(id); setConfirmOpen(true); };

  const confirmDelete = () => {
    if (selectedId == null) return;
    setPayments((prev) => prev.filter((p) => p.id !== selectedId));
    setConfirmOpen(false);
    setSelectedId(null);
    setToastMessage("Payment berhasil dihapus");
    setToastOpen(true);
  };

  const filters = ["Semua", "Transfer Bank", "E-Wallet", "Kartu Kredit"];

  const filtered = payments.filter((p) => {
    const matchSearch = p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.status.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = activeFilter === "Semua" || p.status === activeFilter;
    return matchSearch && matchFilter;
  });

  const countByType = (type) => payments.filter((p) => p.status === type).length;

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
            <span>Manage Payment</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-blue-600 font-bold">Payment</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">

          {/* Toast */}
          {toastOpen && (
            <div className="fixed top-6 right-6 z-50">
              <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold bg-emerald-500 text-white">
                <CheckCircle2 className="w-4 h-4" />
                <span>{toastMessage}</span>
              </div>
            </div>
          )}

          {/* ── Page Header ── */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-1">Manage Payment</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-gray-800">Daftar Payment</h3>
              <p className="text-gray-400 text-sm mt-1">{payments.length} metode pembayaran terdaftar</p>
            </div>
            <button
              onClick={() => navigate("/admin/payment/tambahpayment")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all"
              style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}
            >
              <Plus className="w-4 h-4" />
              Tambah Payment
            </button>
          </div>

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "#eff6ff" }}>
                <Tag className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-800">{payments.length}</p>
                <p className="text-xs text-gray-400 font-medium">Total Payment</p>
              </div>
            </div>
            {Object.entries(METHOD_META).map(([type, meta]) => {
              const Icon = meta.icon;
              return (
                <div key={type} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: meta.bg }}>
                    <Icon className="w-5 h-5" style={{ color: meta.color }} />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-gray-800">{countByType(type)}</p>
                    <p className="text-xs text-gray-400 font-medium">{type}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Controls ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau tipe payment..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-blue-400 transition-all"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl p-1">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={activeFilter === f
                    ? { background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", color: "#fff", boxShadow: "0 2px 6px rgba(29,78,216,0.3)" }
                    : { color: "#6b7280" }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* ── Table ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: "linear-gradient(90deg,#eff6ff,#f8faff)", borderBottom: "1px solid #e0e7ff" }}>
                    {["No", "Nama Payment", "Tipe", "Status", "Aksi"].map((h, i) => (
                      <th
                        key={h}
                        className={`px-6 py-4 text-xs font-bold uppercase tracking-wider text-blue-400 ${i === 4 ? "text-center" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? (
                    filtered.map((payment) => {
                      const meta = METHOD_META[payment.status] || METHOD_META["Transfer Bank"];
                      const Icon = meta.icon;
                      return (
                        <tr key={payment.id} className="transition-colors hover:bg-gray-50" style={{ borderBottom: "1px solid #f1f5f9" }}>
                          {/* No */}
                          <td className="px-6 py-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-blue-600" style={{ background: "#eff6ff" }}>
                              {payment.no}
                            </div>
                          </td>

                          {/* Nama */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: meta.bg }}>
                                <Icon className="w-5 h-5" style={{ color: meta.color }} />
                              </div>
                              <p className="font-semibold text-gray-800 text-sm">{payment.nama}</p>
                            </div>
                          </td>

                          {/* Tipe */}
                          <td className="px-6 py-4">
                            <span
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                              style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
                            >
                              <Icon className="w-3 h-3" />
                              {payment.status}
                            </span>
                          </td>

                          {/* Status aktif */}
                          <td className="px-6 py-4">
                            <span
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                              style={payment.aktif
                                ? { background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }
                                : { background: "#fff1f2", color: "#dc2626", border: "1px solid #fecaca" }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: payment.aktif ? "#22c55e" : "#ef4444" }} />
                              {payment.aktif ? "Aktif" : "Nonaktif"}
                            </span>
                          </td>

                          {/* Aksi */}
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => navigate(`/admin/payment/editpayment/${payment.id}`)}
                                title="Edit Payment"
                                className="p-2 rounded-lg transition-all text-gray-400 hover:bg-orange-50 hover:text-orange-600"
                              >
                                <PencilLine className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openDelete(payment.id)}
                                title="Hapus Payment"
                                className="p-2 rounded-lg transition-all text-gray-400 hover:bg-red-50 hover:text-red-600"
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
                      <td colSpan="5" className="py-20 text-center">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#eff6ff" }}>
                          <CreditCard className="w-8 h-8 text-blue-200" />
                        </div>
                        <p className="text-gray-400 font-medium text-sm">
                          {searchQuery || activeFilter !== "Semua" ? "Tidak ada payment yang cocok" : "Belum ada data payment"}
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
            </div>

            {/* Footer pagination */}
            {filtered.length > 0 && (
              <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: "1px solid #f1f5f9" }}>
                <p className="text-xs text-gray-400">
                  Menampilkan <span className="font-semibold text-gray-600">{filtered.length}</span> dari <span className="font-semibold text-gray-600">{payments.length}</span> payment
                </p>
                <div className="flex items-center gap-1">
                  {["«", "1", "2", "3", "»"].map((p) => (
                    <button
                      key={p}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border"
                      style={p === "1"
                        ? { background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", color: "#fff", border: "none", boxShadow: "0 2px 6px rgba(29,78,216,0.3)" }
                        : { color: "#6b7280", borderColor: "#e5e7eb", background: "white" }}
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
        title="Hapus Payment"
        message="Data payment yang dihapus tidak dapat dikembalikan."
        confirmText="Hapus"
        cancelText="Batal"
        onClose={() => { setConfirmOpen(false); setSelectedId(null); }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}