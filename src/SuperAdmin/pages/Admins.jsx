import { useState, useEffect } from "react";
import { Mail, Calendar } from "lucide-react";
import DataTable from "../components/DataTable";

const API_URL = import.meta.env.VITE_API_URL ?? "https://www.mycafe-order.net/";

export default function ManageAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("superadmin_token");
      const res = await fetch(`${API_URL}/api/superadmin/admins`, {
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
        else if (Array.isArray(data?.admins)) list = data.admins;
        else if (Array.isArray(data?.data?.admins)) list = data.data.admins;
        else if (Array.isArray(data?.rows)) list = data.rows;
        else if (Array.isArray(data?.data?.rows)) list = data.data.rows;

        setAdmins(list);
      } else {
        console.warn("Fetch admins failed:", res.status, res.statusText);
      }
    } catch (err) {
      console.error("Failed to fetch admins:", err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: "Cafe ID",
      accessor: "cafe_id",
      render: (val, row) => {
        const id = val ?? row.cafeId ?? row?.cafe?.id ?? row?.cafe_id ?? null;
        return (
          <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">
            {id ?? "-"}
          </span>
        );
      },
    },
    {
      header: "Admin",
      accessor: "name",
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            {val?.charAt(0)?.toUpperCase() || "A"}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{val || row.username || "Tidak ada nama"}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Mail size={10} />
              {row.email || "-"}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Role",
      accessor: "role",
      render: (val) => (
        <span className="inline-flex px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold">
          {val || "Admin"}
        </span>
      ),
    },
    {
      header: "Terdaftar",
      accessor: "created_at",
      render: (val) => (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Calendar size={12} />
          {val ? new Date(val).toLocaleDateString("id-ID") : "-"}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (val) => (
        <span
          className={`inline-flex px-2 py-1 rounded-lg text-xs font-bold ${
            val === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
          }`}
        >
          {val === "active" ? "Aktif" : "Nonaktif"}
        </span>
      ),
    },
  ];

  // Pastikan selalu bekerja dengan array aman agar tidak error saat API belum mengembalikan list
  const adminsList = Array.isArray(admins) ? admins : [];

  // Helper untuk mengambil cafe_id dari berbagai kemungkinan bentuk field
  const getCafeId = (row) => row?.cafe_id ?? row?.cafeId ?? row?.cafe?.id ?? null;

  // Urutkan berdasarkan cafe_id (naik), data tanpa cafe_id diletakkan di akhir
  const adminsSorted = [...adminsList].sort((a, b) => {
    const aId = getCafeId(a);
    const bId = getCafeId(b);
    if (aId == null && bId == null) return 0;
    if (aId == null) return 1;
    if (bId == null) return -1;
    return Number(aId) - Number(bId);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-semibold">Memuat data admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Admin Cafe</h2>
          <p className="text-sm text-gray-500 mt-1">Daftar semua admin yang mengelola cafe</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm text-gray-500 font-semibold mb-1">Total Admin</p>
          <p className="text-2xl font-black text-gray-900">{adminsList.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm text-gray-500 font-semibold mb-1">Admin Aktif</p>
          <p className="text-2xl font-black text-green-600">
            {adminsList.filter((a) => a.status === "active").length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm text-gray-500 font-semibold mb-1">Cafe Terkelola</p>
          <p className="text-2xl font-black text-purple-600">
            {new Set(adminsList.map((a) => getCafeId(a)).filter((v) => v != null)).size}
          </p>
        </div>
      </div>

      <DataTable columns={columns} data={adminsSorted} searchPlaceholder="Cari admin..." />
    </div>
  );
}
