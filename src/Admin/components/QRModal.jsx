import { X, QrCode, Loader2, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

const PUBLIC_URL = (import.meta.env.VITE_PUBLIC_URL ?? window.location.origin).replace(/\/$/, "");

// ─────────────────────────────────────────────────────────────────────────────
// QR CODE MODAL — ambil & regenerasi QR dari backend
// ─────────────────────────────────────────────────────────────────────────────
export function QRModal({ table, onClose }) {
  const [qrSrc,   setQrSrc]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [regenerating, setRegenerating] = useState(false);

  // FIX: prioritaskan nomor_meja, fallback ke no_meja, lalu id
  const noMeja = table.nomor_meja ?? table.no_meja ?? table.id;

  const cafeId = table.cafe_id ?? table.cafeId ?? "";
  const userUrl = `${PUBLIC_URL}/user?table=${encodeURIComponent(noMeja)}${cafeId ? `&cafe_id=${encodeURIComponent(cafeId)}` : ""}`;
  const buildQrImageUrl = (nonce = "") => {
    const data = encodeURIComponent(userUrl);
    const n = nonce ? `&nonce=${encodeURIComponent(nonce)}` : "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${data}${n}`;
  };

  useEffect(() => {
    setLoading(true);
    setError("");
    setQrSrc(buildQrImageUrl(String(Date.now())));
    setLoading(false);
  }, [userUrl]);

  /* ── Regenerasi QR Code ── */
  const handleRegenerate = async () => {
    setRegenerating(true);
    setError("");

    try {
      setQrSrc(buildQrImageUrl(String(Date.now())));
    } catch (err) {
      console.error("QR regenerate error:", err);
      setError(err.message ?? "Gagal terhubung ke server. Periksa koneksi atau endpoint API.");
    } finally {
      setRegenerating(false);
    }
  };

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
            disabled={!qrSrc || regenerating}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl py-3 font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <QrCode size={16}/> Cetak QR
          </button>

          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="w-full bg-white border-2 border-amber-200 text-amber-700 rounded-xl py-2.5 font-bold hover:bg-amber-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {regenerating ? (
              <><Loader2 size={14} className="animate-spin"/> Membuat...</>
            ) : (
              <><RefreshCw size={14}/> Regenerasi QR</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
