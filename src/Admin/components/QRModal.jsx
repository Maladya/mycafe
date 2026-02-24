import { X, QrCode } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// QR CODE MODAL
// ─────────────────────────────────────────────────────────────────────────────
export function QRModal({ table, onClose }) {
  const url = `https://astakira.id/user?meja=${table.id}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl w-full max-w-xs shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white text-lg">QR Meja {table.id}</h2>
            <p className="text-white/70 text-xs">Kapasitas {table.capacity} orang</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white"
          >
            <X size={16}/>
          </button>
        </div>
        <div className="p-6 flex flex-col items-center gap-4">
          <div className="w-48 h-48 bg-white border-4 border-amber-200 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg">
            <img src={qrSrc} alt={`QR Meja ${table.id}`} className="w-full h-full object-contain"/>
          </div>
          <div className="text-center">
            <p className="font-bold text-gray-900 text-lg">Meja {table.id}</p>
            <p className="text-xs text-gray-400 mt-0.5 font-mono break-all">{url}</p>
          </div>
          <p className="text-xs text-gray-500 text-center bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            Scan QR ini untuk langsung ke halaman pemesanan Meja {table.id}
          </p>
          <button
            onClick={() => window.print()}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl py-3 font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <QrCode size={16}/> Cetak QR
          </button>
        </div>
      </div>
    </div>
  );
}
