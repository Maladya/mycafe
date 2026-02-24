import { Bell, Check, X, AlertCircle } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// TOAST NOTIFICATION
// ─────────────────────────────────────────────────────────────────────────────
export function Toast({ msg, type, onDone }) {
  return (
    <div className={`fixed top-4 right-4 z-[200] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-sm font-semibold animate-slideInRight ${type==="success"?"bg-green-500 text-white":type==="error"?"bg-red-500 text-white":"bg-gray-900 text-white"}`}>
      {type==="success"?<Check size={16}/>:type==="error"?<X size={16}/>:<Bell size={16}/>}
      {msg}
      <button onClick={onDone}><X size={14}/></button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM DIALOG
// ─────────────────────────────────────────────────────────────────────────────
export function ConfirmDialog({ msg, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
          <AlertCircle size={24} className="text-red-500"/>
        </div>
        <h3 className="font-bold text-gray-900 text-lg mb-2">Konfirmasi</h3>
        <p className="text-gray-500 text-sm mb-6">{msg}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border-2 border-gray-200 text-gray-700 rounded-xl py-2.5 font-semibold hover:bg-gray-50 transition-all"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 text-white rounded-xl py-2.5 font-semibold hover:bg-red-600 transition-all"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
