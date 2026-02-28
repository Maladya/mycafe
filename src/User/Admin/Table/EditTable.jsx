import SideBar from "../../Layout/Layouts";
import { useState, useEffect } from "react";
import { Coffee, ChevronRight, Table2, Hash } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

const inputClass = `
  w-full px-4 py-3 rounded-xl text-sm text-gray-800 border border-gray-200
  focus:outline-none focus:ring-2 focus:border-blue-400 transition-all bg-white
  placeholder-gray-300
`;

export default function EditTable() {
  const navigate = useNavigate();
  const { id } = useParams(); // Ambil ID dari URL jika ada
  
  const [nomorMeja, setNomorMeja] = useState("");
  const [status, setStatus] = useState("Kosong");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // TODO: Fetch data meja berdasarkan ID
    const fetchTableData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await fetch(
          
          `http://192.168.1.2:3000/tables/${id}`,
          {
            method: "GET",
            headers: {
              authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          }
        );
        const data = await response.json();
        
        if (data.success) {
          setNomorMeja(data.data.nomor_meja);
          setStatus(data.data.status);
        }
      } catch (error) {
        console.error(error);
        toast.error("Gagal memuat data meja");
      } finally {
        setLoading(false);
      }
    };

    fetchTableData();
  }, [id]);

  const validateForm = () => {
    if (!nomorMeja.trim()) {
      toast.error("Nomor meja wajib diisi");
      return false;
    }
    return true;
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;

    try {
      const response = await fetch(
        `http://192.168.1.2:3000/tables/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({
            nomor_meja: nomorMeja,
            status: status,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Meja berhasil diperbarui");
        setTimeout(() => navigate("/admin/table/table"), 1000);
      } else {
        toast.error(data.message || "Gagal memperbarui meja");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat memperbarui meja");
    }
  };

  const handleReset = () => {
    // Reset ke data awal (re-fetch)
    if (id) {
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SideBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 font-medium">Memuat data meja...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Toaster position="top-center" reverseOrder={false} />
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
            <span className="text-blue-600 font-bold">Edit Table</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">
          {/* ── Page Title ── */}
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-1">
              Manage Table
            </p>
            <h3 className="text-3xl font-extrabold tracking-tight text-gray-800">
              Edit Meja
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              Perbarui informasi meja yang sudah ada
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {/* ── Main Card ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div
                className="px-6 py-5 flex items-center gap-3"
                style={{
                  background: "linear-gradient(90deg,#eff6ff,#f0f9ff)",
                  borderBottom: "1px solid #e0e7ff",
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(29,78,216,0.1)" }}
                >
                  <Table2 className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="text-base font-bold text-gray-800">
                  Informasi Meja
                </h2>
              </div>

              <div className="p-8 space-y-6">
                {/* Nomor Meja */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Nomor Meja <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input
                      type="text"
                      value={nomorMeja}
                      onChange={(e) => setNomorMeja(e.target.value)}
                      className={`${inputClass} pl-10`}
                      placeholder="Contoh: Meja 1, A1, VIP-01"
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Gunakan format yang mudah dikenali pelanggan
                  </p>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Status Meja
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setStatus("kosong")}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${
                        status === "kosong"
                          ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                          : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          background:
                            status === "Kosong" ? "#22c55e" : "#d1d5db",
                        }}
                      />
                      Kosong
                    </button>
                    <button
                      onClick={() => setStatus("terisi")}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${
                        status === "terisi"
                          ? "bg-orange-50 border-orange-300 text-orange-700"
                          : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          background:
                            status === "Terisi" ? "#f97316" : "#d1d5db",
                        }}
                      />
                      Terisi
                    </button>
                  </div>
                </div>

                {/* Preview Card */}
                <div
                  className="p-5 rounded-xl border"
                  style={{
                    background: "#f8faff",
                    borderColor: "#e0e7ff",
                  }}
                >
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                    Preview Meja
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        background:
                          status === "Kosong" ? "#f0fdf4" : "#fff7ed",
                      }}
                    >
                      <Table2
                        className="w-5 h-5"
                        style={{
                          color: status === "Kosong" ? "#16a34a" : "#ea580c",
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">
                        {nomorMeja || "Nomor Meja"}
                      </p>
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold mt-1"
                        style={
                          status === "Kosong"
                            ? {
                                background: "#f0fdf4",
                                color: "#16a34a",
                                border: "1px solid #bbf7d0",
                              }
                            : {
                                background: "#fff7ed",
                                color: "#ea580c",
                                border: "1px solid #fed7aa",
                              }
                        }
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            background:
                              status === "Kosong" ? "#22c55e" : "#f97316",
                          }}
                        />
                        {status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Action Buttons ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex gap-3">
                <button
                  onClick={() => navigate("/admin/table/table")}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-600 transition-all border border-gray-200 hover:bg-gray-50"
                >
                  Kembali
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-red-600 transition-all border border-red-200 hover:bg-red-50"
                >
                  Reset
                </button>
                <button
                  onClick={handleUpdate}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all shadow-sm hover:shadow-md"
                  style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}
                >
                  Update Meja
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
