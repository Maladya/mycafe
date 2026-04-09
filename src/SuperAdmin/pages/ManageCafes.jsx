import { useState, useEffect } from "react";
import { Plus, Eye, Edit, Trash2, CheckCircle, XCircle, Search } from "lucide-react";
import DataTable from "../components/DataTable";

const API_URL = import.meta.env.VITE_API_URL ?? "https://api.mycafe-order.net";
const UPLOADS_BASE_URL = (import.meta.env.VITE_UPLOADS_BASE_URL || `${API_URL}/uploads`).replace(/\/$/, "");

export default function ManageCafes() {
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCafe, setSelectedCafe] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchCafes();
  }, []);

  const fetchCafes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("superadmin_token");
      const res = await fetch(`${API_URL}/api/superadmin/cafes`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        // Robust array extraction to handle various backend shapes
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (Array.isArray(data?.data)) list = data.data;
        else if (Array.isArray(data?.cafes)) list = data.cafes;
        else if (Array.isArray(data?.data?.cafes)) list = data.data.cafes;
        else if (Array.isArray(data?.rows)) list = data.rows;
        else if (Array.isArray(data?.data?.rows)) list = data.data.rows;
        else if (Array.isArray(data?.cafe)) list = data.cafe; // singular key but array value
        // Single-object fallback
        else if (data?.cafe && typeof data.cafe === "object") list = [data.cafe];
        else if (data?.data?.cafe && typeof data.data.cafe === "object") list = [data.data.cafe];

        setCafes(list);
      } else {
        // Keep previous state but stop loading; optionally log for debugging
        console.warn("Fetch cafes failed:", res.status, res.statusText);
      }
    } catch (err) {
      console.error("Failed to fetch cafes:", err);
      showToast("Gagal memuat data cafe", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const resolveImage = (file) => {
    if (!file) return null;
    // Absolute URL
    if (/^https?:\/\//i.test(file)) return file;
    // Data URI (already base64 with mime)
    if (/^data:image\/[a-zA-Z]+;base64,/.test(file)) return file;
    // Likely raw base64 string (no prefix, long, only base64 charset, no path or dot)
    const str = String(file).trim();
    const looksBase64 = /^[A-Za-z0-9+/=\n\r]+$/.test(str) && str.length > 100 && !str.includes('/') && !str.includes('.');
    if (looksBase64) {
      const noWS = str.replace(/\s/g, '');
      // Heuristic content-type detection by base64 signature
      // JPEG starts with /9j/
      // PNG starts with iVBORw0KGgo
      // GIF starts with R0lGOD
      let mime = 'image/jpeg';
      if (noWS.startsWith('iVBORw0KGgo')) mime = 'image/png';
      else if (noWS.startsWith('R0lGOD')) mime = 'image/gif';
      else if (noWS.startsWith('/9j/')) mime = 'image/jpeg';
      return `data:${mime};base64,${noWS}`;
    }
    // Otherwise treat as filename under uploads base
    const cleanFile = str.replace(/^\//, "");
    return `${UPLOADS_BASE_URL}/${cleanFile}`;
  };

  const handleViewDetail = (cafe) => {
    setSelectedCafe(cafe);
    setShowModal(true);
  };

  const handleToggleStatus = async (cafe) => {
    try {
      const token = localStorage.getItem("superadmin_token");
      const newStatus = cafe.status === "active" ? "inactive" : "active";
      
      const res = await fetch(`${API_URL}/api/superadmin/cafes/${cafe.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        showToast(`Status cafe berhasil diubah menjadi ${newStatus}`, "success");
        fetchCafes();
      } else {
        showToast("Gagal mengubah status cafe", "error");
      }
    } catch (err) {
      console.error("Failed to toggle status:", err);
      showToast("Gagal mengubah status cafe", "error");
    }
  };

  const fmtDate = (raw) => {
    if (!raw) return "-";
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return String(raw);
      return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
    } catch { return String(raw); }
  };

  const subStatus = (row) => {
    const st = String(
      row.subscription_status ?? row.sub_status ?? row.langganan_status ?? ""
    ).toLowerCase();
    if (st === "active") return { label: "Aktif", cls: "bg-green-100 text-green-700" };
    if (st === "expired") return { label: "Kadaluarsa", cls: "bg-red-100 text-red-700" };
    if (st === "pending") return { label: "Pending", cls: "bg-yellow-100 text-yellow-700" };
    return { label: st || "Tidak ada", cls: "bg-gray-100 text-gray-600" };
  };

  const subPlan = (row) =>
    row.subscription_plan_name ?? row.plan_name ?? row.subscription_plan ?? row.paket ?? "Free";

  const subExpiry = (row) =>
    row.subscription_expires ?? row.active_until ?? row.expired_at ?? row.expiredAt ?? null;

  const columns = [
    {
      header: "ID",
      accessor: "id",
      render: (val) => (
        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-black font-mono">
          #{val ?? "-"}
        </span>
      ),
    },
    {
      header: "Nama Cafe",
      accessor: "nama_cafe",
      render: (val, row) => (
        <div className="flex items-center gap-3">
          {row.logo_cafe || row.logo_url ? (
            <img src={resolveImage(row.logo_url || row.logo_cafe)} alt={val} className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              {val?.charAt(0) || "C"}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{val || "Tidak ada nama"}</p>
            <p className="text-xs text-gray-500">{row.alamat || "-"}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Admin",
      accessor: "admin_email",
      render: (val, row) => (
        <div>
          <p className="font-medium text-gray-900">{row.admin_name || row.admin_username || "-"}</p>
          <p className="text-xs text-gray-500">{val || "-"}</p>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (val) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
            val === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {val === "active" ? <CheckCircle size={12} /> : <XCircle size={12} />}
          {val === "active" ? "Aktif" : "Nonaktif"}
        </span>
      ),
    },
    {
      header: "Langganan",
      accessor: "subscription_status",
      render: (val, row) => {
        const { label, cls } = subStatus(row);
        return (
          <div>
            <p className="text-sm font-semibold text-gray-900">{subPlan(row)}</p>
            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${cls}`}>{label}</span>
            {subExpiry(row) && (
              <p className="text-xs text-gray-500 mt-0.5">s/d {fmtDate(subExpiry(row))}</p>
            )}
          </div>
        );
      },
    },
    {
      header: "Aksi",
      accessor: "id",
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetail(row);
            }}
            className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all"
            title="Lihat Detail"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleStatus(row);
            }}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
              row.status === "active"
                ? "bg-red-100 text-red-600 hover:bg-red-200"
                : "bg-green-100 text-green-600 hover:bg-green-200"
            }`}
            title={row.status === "active" ? "Nonaktifkan" : "Aktifkan"}
          >
            {row.status === "active" ? <XCircle size={14} /> : <CheckCircle size={14} />}
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-semibold">Memuat data cafe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Kelola Cafe</h2>
          <p className="text-sm text-gray-500 mt-1">Manajemen semua cafe yang terdaftar</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={cafes}
        onRowClick={handleViewDetail}
        searchPlaceholder="Cari cafe..."
      />

      {/* Detail Modal */}
      {showModal && selectedCafe && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 text-white">
              <h3 className="text-xl font-bold">Detail Cafe</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                {selectedCafe.logo_cafe ? (
                  <img src={resolveImage(selectedCafe.logo_cafe)} alt={selectedCafe.nama_cafe} className="w-20 h-20 rounded-xl object-cover" />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
                    {selectedCafe.nama_cafe?.charAt(0) || "C"}
                  </div>
                )}
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{selectedCafe.nama_cafe}</h4>
                  <p className="text-sm text-gray-500">{selectedCafe.alamat || "-"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1">Cafe ID</p>
                  <p className="text-sm font-black font-mono text-gray-900">#{selectedCafe.id ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1">Status Cafe</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                    selectedCafe.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {selectedCafe.status === "active" ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {selectedCafe.status === "active" ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1">Email Admin</p>
                  <p className="text-sm text-gray-900">{selectedCafe.admin_email || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1">Username Admin</p>
                  <p className="text-sm text-gray-900">{selectedCafe.admin_name || selectedCafe.admin_username || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1">Paket Langganan</p>
                  <p className="text-sm font-bold text-gray-900">{subPlan(selectedCafe)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1">Status Langganan</p>
                  <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${subStatus(selectedCafe).cls}`}>
                    {subStatus(selectedCafe).label}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1">Berakhir</p>
                  <p className="text-sm text-gray-900">{fmtDate(subExpiry(selectedCafe))}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1">Tanggal Terdaftar</p>
                  <p className="text-sm text-gray-900">
                    {fmtDate(selectedCafe.created_at ?? selectedCafe.createdAt ?? selectedCafe.registered_at ?? null)}
                  </p>
                </div>
                {selectedCafe.no_telp && (
                  <div>
                    <p className="text-xs text-gray-500 font-semibold mb-1">No. Telp</p>
                    <p className="text-sm text-gray-900">{selectedCafe.no_telp}</p>
                  </div>
                )}
                {selectedCafe.alamat && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 font-semibold mb-1">Alamat</p>
                    <p className="text-sm text-gray-900">{selectedCafe.alamat}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Tutup
                </button>
                <button className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                  Edit Cafe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white font-semibold text-sm animate-slideInRight ${
            toast.type === "error" ? "bg-red-500" : toast.type === "success" ? "bg-green-500" : "bg-blue-500"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
