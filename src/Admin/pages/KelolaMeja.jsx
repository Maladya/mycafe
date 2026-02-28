import { useState, useEffect } from "react";
import { Plus, Table2, Trash2, QrCode, Loader2 } from "lucide-react";
import { useAdmin } from "../AdminPanel";
import { QRModal } from "../components/QRModal";
import { ConfirmDialog } from "../components/SharedComponents";

const API_URL = import.meta.env.VITE_API_URL ?? "http://192.168.1.2:3000";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const statusStyle = {
  true:  { border:"border-green-200", dot:"bg-green-500", text:"text-green-700", label:"Tersedia", bg:"bg-green-50" },
  false: { border:"border-amber-300", dot:"bg-amber-500", text:"text-amber-700", label:"Terisi",   bg:"bg-amber-50" },
};

export default function KelolaMeja() {
  const { tables, setTables, orders, showToast } = useAdmin();

  const [confirmDel, setConfirmDel] = useState(null);
  const [qrTable,    setQrTable]    = useState(null);
  const [adding,     setAdding]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);

  // Fetch meja dari API
  const fetchTables = async () => {
    try {
      const res  = await fetch(`${API_URL}/api/tables`, { headers: authHeaders() });
      const data = await res.json();
      console.log("Fetch tables:", data);
      setTables(data.data ?? data.tables ?? data ?? []);
    } catch (err) {
      console.error("Fetch tables error:", err);
      showToast("Gagal memuat data meja", "error");
    }
  };

  useEffect(() => { fetchTables(); }, []);

  // Tambah meja otomatis — no_meja auto increment
  const handleAdd = async () => {
    setAdding(true);
    try {
      // FIX: +1 bukan +2, dan meja pertama mulai dari 1 bukan 2
      const nextNo = (tables ?? []).length > 0
        ? Math.max(...(tables ?? []).map(t => Number(t.nomor_meja ?? t.id ?? 0))) + 1
        : 1;

      const res  = await fetch(`${API_URL}/api/tables`, {
        method:  "POST",
        headers: authHeaders(),
        body:    JSON.stringify({ nomor_meja: nextNo, status: true }),
      });
      const data = await res.json();
      console.log("Add table response:", data);

      if (!res.ok || data.success === false) {
        showToast(data.message ?? "Gagal menambah meja", "error");
        return;
      }

      await fetchTables();
      showToast(`Meja ${nextNo} berhasil ditambahkan!`, "success");
    } catch (err) {
      console.error("Add table error:", err);
      showToast("Gagal terhubung ke server", "error");
    } finally {
      setAdding(false);
    }
  };

  // Hapus meja
  const handleDel = async (id) => {
    setDeleting(true);
    try {
      const res  = await fetch(`${API_URL}/api/tables/${id}`, {
        method:  "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();

      if (!res.ok || data.success === false) {
        showToast(data.message ?? "Gagal menghapus meja", "error");
        return;
      }

      await fetchTables();
      showToast("Meja berhasil dihapus!", "success");
    } catch (err) {
      console.error("Delete table error:", err);
      showToast("Gagal terhubung ke server", "error");
    } finally {
      setDeleting(false);
      setConfirmDel(null);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-gray-900">Kelola Meja</h1>
          <p className="text-gray-400 text-sm">
            {(tables ?? []).length} meja ·{" "}
            {(tables ?? []).filter(t => t.status === false).length} terisi
          </p>
        </div>
        <button
          onClick={handleAdd}
          disabled={adding}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl px-4 py-2.5 font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all text-sm disabled:opacity-60 disabled:scale-100"
        >
          {adding ? <Loader2 size={16} className="animate-spin"/> : <Plus size={16}/>}
          {adding ? "Menambahkan..." : "Tambah Meja"}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label:"Tersedia", count:(tables ?? []).filter(t => t.status === true).length,  color:"from-green-500 to-emerald-600" },
          { label:"Terisi",   count:(tables ?? []).filter(t => t.status === false).length, color:"from-amber-500 to-orange-500"  },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
            <div className={`w-10 h-10 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md`}>
              <Table2 size={18} className="text-white"/>
            </div>
            <p className="text-2xl font-black text-gray-900">{s.count}</p>
            <p className="text-xs text-gray-400 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {(tables ?? []).map(table => {
          const statusKey = String(table.status);
          const s         = statusStyle[statusKey] || statusStyle["true"];
          const order     = (orders ?? []).find(o => o.id === table.currentOrder);
          const noMeja    = table.nomor_meja ?? table.id;

          return (
            <div key={table.id} className={`bg-white rounded-2xl border-2 p-4 hover:shadow-md transition-all ${s.border}`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <span className="font-black text-gray-700 text-xl">{noMeja}</span>
                </div>
                <div className={`w-2 h-2 rounded-full ${s.dot} ${table.status === false ? "animate-pulse" : ""}`}/>
              </div>
              <p className={`text-xs font-bold ${s.text} mb-0.5`}>{s.label}</p>
              <p className="text-[10px] text-gray-400">🪑 Meja {noMeja}</p>
              {order && <p className="text-[10px] text-amber-600 font-bold mt-0.5 truncate">{order.id}</p>}
              <div className="flex gap-1.5 mt-3">
                <button
                  onClick={() => setQrTable({ ...table, nomor_meja: table.nomor_meja ?? table.id })}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-lg text-[10px] font-bold transition-all"
                >
                  <QrCode size={11}/> QR
                </button>
                <button
                  onClick={() => setConfirmDel(table.id)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg text-[10px] font-bold transition-all"
                >
                  <Trash2 size={11}/> Hapus
                </button>
              </div>
            </div>
          );
        })}
        {(tables ?? []).length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400">
            <Table2 size={40} className="mx-auto mb-3 opacity-30"/>
            <p className="font-semibold">Belum ada meja</p>
            <p className="text-xs mt-1">Klik Tambah Meja untuk memulai</p>
          </div>
        )}
      </div>

      {qrTable    && <QRModal table={qrTable} onClose={() => setQrTable(null)}/>}
      {confirmDel && (
        <ConfirmDialog
          msg={`Yakin hapus Meja ${confirmDel}?`}
          loading={deleting}
          onConfirm={() => handleDel(confirmDel)}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}
