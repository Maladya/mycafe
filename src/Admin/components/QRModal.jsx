import { X, QrCode, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://192.168.1.11:3000";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ─────────────────────────────────────────────────────────────────────────────
// QR CODE MODAL — ambil QR dari backend
// ─────────────────────────────────────────────────────────────────────────────
export function QRModal({ table, onClose }) {
  const [qrSrc,   setQrSrc]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  // FIX: prioritaskan nomor_meja, fallback ke no_meja, lalu id
  const noMeja = table.nomor_meja ?? table.no_meja ?? table.id;

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError("");

      // Kalau qr_code sudah ada di data meja, langsung pakai
      if (table.qr_code) {
        if (table.qr_code.startsWith("data:image") || table.qr_code.startsWith("/9j") || table.qr_code.startsWith("iVBOR")) {
          setQrSrc(
            table.qr_code.startsWith("data:image")
              ? table.qr_code
              : `data:image/png;base64,${table.qr_code}`
          );
        } else {
          setQrSrc(table.qr_code);
        }
        setLoading(false);
        return;
      }

      // Kalau tidak ada, fetch dari API pakai id tabel
      try {
        const res  = await fetch(`${API_URL}/api/tables/${table.id}/qr`, { headers: authHeaders() });
        const data = await res.json();
        console.log("QR response:", data);

        const qr = data.qr_code ?? data.qr ?? data.data?.qr_code ?? data.data?.qr;
        if (!qr) { setError("QR code tidak ditemukan"); return; }

        setQrSrc(
          qr.startsWith("data:image") ? qr : `data:image/png;base64,${qr}`
        );
      } catch (err) {
        console.error("QR fetch error:", err);
        setError("Gagal memuat QR code");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [table]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl w-full max-w-xs shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white text-lg">QR Meja {noMeja}</h2>
            <p className="text-white/70 text-xs">Scan untuk pemesanan</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all"
          >
            <X size={16}/>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center gap-4">
          <div className="w-48 h-48 bg-white border-4 border-amber-200 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg">
            {loading && <Loader2 size={32} className="text-amber-400 animate-spin"/>}
            {error   && <p className="text-xs text-red-500 text-center px-3">{error}</p>}
            {qrSrc && !loading && (
              <img src={qrSrc} alt={`QR Meja ${noMeja}`} className="w-full h-full object-contain"/>
            )}
          </div>

          <div className="text-center">
            <p className="font-bold text-gray-900 text-lg">Meja {noMeja}</p>
          </div>

          <p className="text-xs text-gray-500 text-center bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            Scan QR ini untuk langsung ke halaman pemesanan Meja {noMeja}
          </p>

          <button
            onClick={() => window.print()}
            disabled={!qrSrc}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl py-3 font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <QrCode size={16}/> Cetak QR
          </button>
        </div>
      </div>
    </div>
  );
}
