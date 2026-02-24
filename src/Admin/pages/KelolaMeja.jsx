import { useState } from "react";
import { Plus, Table2, Trash2, QrCode } from "lucide-react";
import { useAdmin } from "../AdminPanel";
import { QRModal } from "../components/QRModal";
import { ConfirmDialog } from "../components/SharedComponents";

const statusStyle = {
  available: { border:"border-green-200", dot:"bg-green-500", text:"text-green-700", label:"Tersedia", bg:"bg-green-50" },
  occupied:  { border:"border-amber-300", dot:"bg-amber-500", text:"text-amber-700", label:"Terisi",   bg:"bg-amber-50" },
};

export default function KelolaMeja() {
  const { tables, setTables, orders, showToast } = useAdmin();

  const [showAdd,    setShowAdd]    = useState(false);
  const [formCap,    setFormCap]    = useState(4);
  const [confirmDel, setConfirmDel] = useState(null);
  const [qrTable,    setQrTable]    = useState(null);

  const handleAdd = () => {
    const newId = (tables ?? []).length > 0 ? Math.max(...(tables ?? []).map(t => t.id)) + 1 : 1;
    setTables(prev => [...prev, { id:newId, status:"available", capacity:formCap, currentOrder:null }]);
    showToast(`Meja ${newId} ditambahkan!`, "success");
    setShowAdd(false); setFormCap(4);
  };

  const handleDel = (id) => {
    setTables(prev => prev.filter(t => t.id !== id));
    setConfirmDel(null);
    showToast(`Meja ${id} dihapus!`, "success");
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-gray-900">Kelola Meja</h1>
          <p className="text-gray-400 text-sm">
            {(tables ?? []).length} meja · {(tables ?? []).filter(t => t.status==="occupied").length} terisi
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl px-4 py-2.5 font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all text-sm"
        >
          <Plus size={16}/> Tambah Meja
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label:"Tersedia", count:(tables ?? []).filter(t=>t.status==="available").length, color:"from-green-500 to-emerald-600" },
          { label:"Terisi",   count:(tables ?? []).filter(t=>t.status==="occupied").length,  color:"from-amber-500 to-orange-500" },
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
          const s     = statusStyle[table.status] || statusStyle.available;
          const order = (orders ?? []).find(o => o.id === table.currentOrder);
          return (
            <div key={table.id} className={`bg-white rounded-2xl border-2 p-4 hover:shadow-md transition-all ${s.border}`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <span className="font-black text-gray-700 text-xl">{table.id}</span>
                </div>
                <div className={`w-2 h-2 rounded-full ${s.dot} ${table.status==="occupied"?"animate-pulse":""}`}/>
              </div>
              <p className={`text-xs font-bold ${s.text} mb-0.5`}>{s.label}</p>
              <p className="text-[10px] text-gray-400">👥 {table.capacity} orang</p>
              {order && <p className="text-[10px] text-amber-600 font-bold mt-0.5 truncate">{order.id}</p>}
              <div className="flex gap-1.5 mt-3">
                <button
                  onClick={() => setQrTable(table)}
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

      {/* Modal Tambah Meja */}
      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-5">Tambah Meja Baru</h2>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">Kapasitas Kursi</label>
            <div className="flex items-center justify-center gap-5 mb-2">
              <button onClick={() => setFormCap(c => Math.max(1, c-1))} className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center font-bold text-gray-700 hover:bg-gray-200 transition-all text-xl">−</button>
              <span className="text-4xl font-black text-gray-900 w-16 text-center">{formCap}</span>
              <button onClick={() => setFormCap(c => Math.min(12, c+1))} className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center font-bold text-amber-700 hover:bg-amber-200 transition-all text-xl">+</button>
            </div>
            <p className="text-xs text-center text-gray-400 mb-6">orang per meja</p>
            <div className="flex gap-3">
              <button onClick={() => { setShowAdd(false); setFormCap(4); }} className="flex-1 border-2 border-gray-200 text-gray-700 rounded-xl py-3 font-semibold hover:bg-gray-50 transition-all">Batal</button>
              <button onClick={handleAdd} className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl py-3 font-bold shadow-lg transition-all">Tambah Meja</button>
            </div>
          </div>
        </div>
      )}

      {qrTable    && <QRModal table={qrTable} onClose={() => setQrTable(null)}/>}
      {confirmDel && <ConfirmDialog msg={`Yakin hapus Meja ${confirmDel}?`} onConfirm={() => handleDel(confirmDel)} onCancel={() => setConfirmDel(null)}/>}
    </div>
  );
}