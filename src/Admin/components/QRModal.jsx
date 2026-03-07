import { X, QrCode, Loader2, RefreshCw, Download } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const PUBLIC_URL = (import.meta.env.VITE_PUBLIC_URL ?? window.location.origin).replace(/\/$/, "");

// ─────────────────────────────────────────────────────────────────────────────
// QR CODE MODAL — ambil & regenerasi QR dari backend
// ─────────────────────────────────────────────────────────────────────────────
export function QRModal({ table, onClose }) {
  const [qrSrc,        setQrSrc]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const imgRef = useRef(null);

  // Prioritaskan nomor_meja, fallback ke no_meja, lalu id
  const noMeja = table.nomor_meja ?? table.no_meja ?? table.id;
  const cafeId = table.cafe_id ?? table.cafeId ?? table.cafe ?? "";

  // URL yang akan di-encode ke dalam QR
  const userUrl = cafeId 
    ? `${PUBLIC_URL}/user?table=${encodeURIComponent(noMeja)}&cafe_id=${encodeURIComponent(cafeId)}`
    : `${PUBLIC_URL}/user?table=${encodeURIComponent(noMeja)}`;
  
  const buildQrImageUrl = (nonce = "") => {
    const data = encodeURIComponent(userUrl);
    const n    = nonce ? `&nonce=${encodeURIComponent(nonce)}` : "";
    // size=400x400 agar resolusi cukup untuk cetak
    return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=10&data=${data}${n}`;
  };

  // Generate QR saat komponen mount atau table berubah
  useEffect(() => {
    setLoading(true);
    setError("");
    const src = buildQrImageUrl(String(Date.now()));
    const img = new Image();
    img.onload  = () => { setQrSrc(src); setLoading(false); };
    img.onerror = () => { setError("Gagal memuat QR code. Periksa koneksi internet."); setLoading(false); };
    img.src = src;
  }, [userUrl]);

  /* ── Regenerasi QR Code ── */
  const handleRegenerate = () => {
    setRegenerating(true);
    setError("");
    const src = buildQrImageUrl(String(Date.now()));
    const img = new Image();
    img.onload  = () => { setQrSrc(src); setRegenerating(false); };
    img.onerror = () => { setError("Gagal membuat QR baru."); setRegenerating(false); };
    img.src = src;
  };

  /* ── Download QR sebagai PNG ── */
  const handleDownload = async () => {
    if (!qrSrc) return;
    try {
      const res    = await fetch(qrSrc);
      const blob   = await res.blob();
      const url    = URL.createObjectURL(blob);
      const a      = document.createElement("a");
      a.href       = url;
      a.download   = `QR-Meja-${noMeja}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: buka di tab baru
      window.open(qrSrc, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl w-full max-w-xs shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white text-lg">QR Meja {noMeja}</h2>
            <p className="text-white/70 text-xs">Scan untuk pemesanan</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-6 flex flex-col items-center gap-4">

          {/* QR Image */}
          <div className="w-52 h-52 bg-white border-4 border-amber-200 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg">
            {loading && (
              <Loader2 size={32} className="text-amber-400 animate-spin" />
            )}
            {error && !loading && (
              <p className="text-xs text-red-500 text-center px-3">{error}</p>
            )}
            {qrSrc && !loading && (
              <img
                ref={imgRef}
                src={qrSrc}
                alt={`QR Meja ${noMeja}`}
                className="w-full h-full object-contain p-1"
                crossOrigin="anonymous"
              />
            )}
          </div>

          {/* Label */}
          <div className="text-center">
            <p className="font-bold text-gray-900 text-lg">Meja {noMeja}</p>
          </div>

          {/* Info */}
          <p className="text-xs text-gray-500 text-center bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            Scan QR ini untuk langsung ke halaman pemesanan Meja {noMeja}
          </p>

          {/* Cetak */}
          <button
            onClick={() => window.print()}
            disabled={!qrSrc || loading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl py-3 font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <QrCode size={16} /> Cetak QR
          </button>

          {/* Download & Regenerasi — 2 kolom */}
          <div className="w-full grid grid-cols-2 gap-2">
            <button
              onClick={handleDownload}
              disabled={!qrSrc || loading}
              className="bg-white border-2 border-amber-200 text-amber-700 rounded-xl py-2.5 font-bold hover:bg-amber-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
            >
              <Download size={14} /> Unduh
            </button>

            <button
              onClick={handleRegenerate}
              disabled={regenerating || loading}
              className="bg-white border-2 border-amber-200 text-amber-700 rounded-xl py-2.5 font-bold hover:bg-amber-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
            >
              {regenerating ? (
                <><Loader2 size={14} className="animate-spin" /> Proses...</>
              ) : (
                <><RefreshCw size={14} /> Regenerasi</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}