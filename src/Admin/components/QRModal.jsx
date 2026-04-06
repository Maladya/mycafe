import { X, QrCode, Loader2, RefreshCw, Download, Printer } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAdmin } from "../AdminPanel";
import qrisLogo from "../../assets/qris.png";

const PUBLIC_URL = (import.meta.env.VITE_PUBLIC_URL ?? window.location.origin).replace(/\/$/, "");
const API_BASE   = (import.meta.env.VITE_API_URL ?? "https://www.mycafe-order.net/").replace(/\/$/, "");

const fixLogoUrl = (url) => {
  if (!url?.trim()) return "";
  if (url.startsWith("data:")) return url;
  if (url.startsWith("/")) return `${API_BASE}${url}`;
  if (url.startsWith("http")) return url;
  return `${API_BASE}/${url}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// QR CODE MODAL — ambil & regenerasi QR dari backend
// ─────────────────────────────────────────────────────────────────────────────
export function QRModal({ table, onClose }) {
  const { cafeRaw } = useAdmin() ?? {};

  const [qrSrc,        setQrSrc]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const imgRef = useRef(null);

  const noMeja   = table.nomor_meja ?? table.no_meja ?? table.id;
  const cafeId   = table.cafe_id ?? table.cafeId ?? table.cafe ?? "";
  const cafeName = cafeRaw?.nama_cafe ?? cafeRaw?.cafeNama ?? "Cafe";
  const cafeAddr = cafeRaw?.alamat ?? cafeRaw?.cafeAlamat ?? "";
  const cafeLogoRaw = cafeRaw?.logo_cafe ?? "";
  const cafeLogo = fixLogoUrl(cafeLogoRaw);

  const userUrl = cafeId
    ? `${PUBLIC_URL}/user?table=${encodeURIComponent(noMeja)}&cafe_id=${encodeURIComponent(cafeId)}`
    : `${PUBLIC_URL}/user?table=${encodeURIComponent(noMeja)}`;

  const buildQrImageUrl = (nonce = "") => {
    const data = encodeURIComponent(userUrl);
    const n    = nonce ? `&nonce=${encodeURIComponent(nonce)}` : "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=12&data=${data}${n}`;
  };

  useEffect(() => {
    setLoading(true);
    setError("");
    const src = buildQrImageUrl(String(Date.now()));
    const img = new Image();
    img.onload  = () => { setQrSrc(src); setLoading(false); };
    img.onerror = () => { setError("Gagal memuat QR code. Periksa koneksi internet."); setLoading(false); };
    img.src = src;
  }, [userUrl]); // eslint-disable-line

  const handleRegenerate = () => {
    setRegenerating(true);
    setError("");
    const src = buildQrImageUrl(String(Date.now()));
    const img = new Image();
    img.onload  = () => { setQrSrc(src); setRegenerating(false); };
    img.onerror = () => { setError("Gagal membuat QR baru."); setRegenerating(false); };
    img.src = src;
  };

  const handleDownload = async () => {
    if (!qrSrc) return;
    try {
      const res  = await fetch(qrSrc);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `QR-Meja-${noMeja}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(qrSrc, "_blank");
    }
  };

  /* ── Print template ── */
  const handlePrint = () => {
    if (!qrSrc) return;

    const initial = cafeName ? cafeName.charAt(0).toUpperCase() : "C";

    const logoHtml = cafeLogo
      ? `<img src="${cafeLogo}" alt="logo" style="width:56px;height:56px;object-fit:cover;border-radius:14px;border:2.5px solid rgba(255,255,255,0.5);flex-shrink:0;" crossorigin="anonymous" />`
      : `<div style="width:56px;height:56px;border-radius:14px;border:2.5px solid rgba(255,255,255,0.35);background:rgba(255,255,255,0.18);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;color:#fff;flex-shrink:0;">${initial}</div>`;

    const win = window.open("", "_blank", "width=500,height=740");
    if (!win) return;

    win.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>QR Meja ${noMeja} — ${cafeName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #fafafa;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 28px 20px;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }

    .card {
      width: 340px;
      background: #ffffff;
      border-radius: 28px;
      overflow: hidden;
      box-shadow: 0 32px 80px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.04);
    }

    /* ─── Header ─── */
    .header {
      background: linear-gradient(145deg, #f59e0b 0%, #ea580c 55%, #dc2626 100%);
      padding: 22px 22px 20px;
      position: relative;
      overflow: hidden;
    }
    .meja-badge {
      position: absolute;
      top: 14px;
      right: 16px;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(0,0,0,0.22);
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 14px;
      padding: 6px 12px 5px;
      min-width: 48px;
    }
    .meja-badge-label {
      font-size: 7.5px;
      font-weight: 800;
      letter-spacing: 0.16em;
      color: rgba(255,255,255,0.6);
      text-transform: uppercase;
      line-height: 1;
      margin-bottom: 2px;
    }
    .meja-badge-num {
      font-size: 30px;
      font-weight: 900;
      color: #ffffff;
      line-height: 1;
      letter-spacing: -1.5px;
      text-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    .header::before {
      content: '';
      position: absolute; inset: 0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='30' cy='30' r='28' fill='none' stroke='rgba(255,255,255,0.06)' stroke-width='1.5'/%3E%3C/svg%3E") repeat;
      background-size: 60px 60px;
    }
    .header-inner {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .header-text {}
    .header-eyebrow {
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: 0.18em;
      color: rgba(255,255,255,0.65);
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    .header-title {
      font-size: 24px;
      font-weight: 900;
      color: #ffffff;
      line-height: 1;
      letter-spacing: -0.4px;
    }
    .header-cafe {
      margin-top: 6px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: rgba(0,0,0,0.18);
      border-radius: 999px;
      padding: 3px 10px 3px 8px;
      font-size: 10.5px;
      font-weight: 700;
      color: rgba(255,255,255,0.9);
      letter-spacing: 0.05em;
    }
    .header-cafe::before {
      content: '';
      display: inline-block;
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #fde68a;
      flex-shrink: 0;
    }

    /* ─── QR Body ─── */
    .body {
      padding: 24px 22px 20px;
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .qr-wrap {
      flex-shrink: 0;
      padding: 10px;
      background: #fff;
      border-radius: 18px;
      border: 1.5px solid #f3f4f6;
      box-shadow: 0 4px 20px rgba(245,158,11,0.12), 0 0 0 4px rgba(245,158,11,0.06);
    }
    .qr-wrap img {
      width: 150px;
      height: 150px;
      display: block;
      border-radius: 8px;
    }

    .scan-hint {
      flex: 1;
    }
    .scan-hint-title {
      font-size: 11px;
      font-weight: 800;
      color: #6b7280;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    .scan-step {
      display: flex;
      align-items: flex-start;
      gap: 9px;
      margin-bottom: 9px;
    }
    .scan-step:last-child { margin-bottom: 0; }
    .scan-dot {
      width: 22px;
      height: 22px;
      border-radius: 7px;
      background: linear-gradient(135deg, #f59e0b, #ea580c);
      color: #fff;
      font-size: 10px;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .scan-step-text {
      font-size: 11px;
      font-weight: 600;
      color: #374151;
      line-height: 1.4;
    }

    /* ─── Divider ─── */
    .divider {
      height: 1px;
      margin: 0 22px;
      background: linear-gradient(to right, transparent, #f3f4f6 20%, #f3f4f6 80%, transparent);
    }

    /* ─── Payment methods ─── */
    .payment-section {
      padding: 18px 22px 20px;
    }
    .payment-title {
      font-size: 9.5px;
      font-weight: 800;
      letter-spacing: 0.16em;
      color: #9ca3af;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .payment-grid {
      display: flex;
      align-items: center;
      gap: 18px;
    }
    .pay-icon {
      font-size: 38px;
      line-height: 1;
    }

    /* ─── Footer ─── */
    .footer {
      background: #111827;
      padding: 12px 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .footer-brand {
      font-size: 9px;
      font-weight: 700;
      color: rgba(255,255,255,0.35);
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }
    .footer-dot {
      width: 4px; height: 4px;
      border-radius: 50%;
      background: #f59e0b;
    }
    .footer-tag {
      font-size: 9px;
      font-weight: 700;
      color: rgba(255,255,255,0.35);
      letter-spacing: 0.1em;
    }

    @media print {
      body { background: #fff; padding: 0; min-height: unset; }
      .card { box-shadow: none; border-radius: 0; width: 100%; max-width: 340px; margin: 0 auto; }
    }
  </style>
</head>
<body>
  <div class="card">

    <!-- Header -->
    <div class="header">
      <div class="meja-badge">
        <span class="meja-badge-label">Meja</span>
        <span class="meja-badge-num">${noMeja}</span>
      </div>
      <div class="header-inner">
        ${logoHtml}
        <div class="header-text">
          <p class="header-eyebrow">Scan &amp; Order</p>
          <h1 class="header-title">Pesan di Sini</h1>
          <span class="header-cafe">${cafeName}</span>
        </div>
      </div>
    </div>

    <!-- QR + Cara scan -->
    <div class="body">
      <div class="qr-wrap">
        <img src="${qrSrc}" alt="QR Meja ${noMeja}" crossorigin="anonymous" />
      </div>
      <div class="scan-hint">
        <p class="scan-hint-title">Cara pesan</p>
        <div class="scan-step">
          <div class="scan-dot">1</div>
          <p class="scan-step-text">Buka Kamera atau Google Lens</p>
        </div>
        <div class="scan-step">
          <div class="scan-dot">2</div>
          <p class="scan-step-text">Scan QR code di samping</p>
        </div>
        <div class="scan-step">
          <div class="scan-dot">3</div>
          <p class="scan-step-text">Pilih menu &amp; konfirmasi</p>
        </div>
        <div class="scan-step">
          <div class="scan-dot">4</div>
          <p class="scan-step-text">Bayar sesuai metode yang tersedia</p>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Payment methods -->
    <div class="payment-section">
      <p class="payment-title">Metode Pembayaran</p>
      <div class="payment-grid">
        <span class="pay-icon">💵</span>
        <img src="${qrisLogo}" alt="QRIS" style="height:38px;object-fit:contain;" />
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <span class="footer-brand">ASTAKIRA POS</span>
      <div class="footer-dot"></div>
      <span class="footer-tag">Scan &amp; Order System</span>
    </div>

  </div>

  <script>
    const imgs = document.querySelectorAll('img');
    let loaded = 0;
    const total = imgs.length;
    const tryPrint = () => {
      loaded++;
      if (loaded >= total) setTimeout(() => { window.print(); window.close(); }, 500);
    };
    if (total === 0) { setTimeout(() => { window.print(); window.close(); }, 400); }
    imgs.forEach(img => {
      if (img.complete) { tryPrint(); }
      else { img.onload = tryPrint; img.onerror = tryPrint; }
    });
  </script>
</body>
</html>`);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">

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

          {/* QR Preview */}
          <div className="w-52 h-52 bg-white border-4 border-amber-200 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg">
            {loading && <Loader2 size={32} className="text-amber-400 animate-spin" />}
            {error && !loading && <p className="text-xs text-red-500 text-center px-3">{error}</p>}
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

          {/* Label + cafe info preview */}
          <div className="text-center">
            <p className="font-black text-gray-900 text-lg">Meja {noMeja}</p>
            <p className="text-xs text-gray-400 mt-0.5">{cafeName}</p>
          </div>

          {/* Info */}
          <p className="text-xs text-gray-500 text-center bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 leading-relaxed">
            Template print akan menyertakan <strong>logo, nama cafe</strong>, QR code, dan instruksi scan.
          </p>

          {/* Cetak dengan template */}
          <button
            onClick={handlePrint}
            disabled={!qrSrc || loading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl py-3 font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Printer size={16} /> Cetak Template QR
          </button>

          {/* Download & Regenerasi */}
          <div className="w-full grid grid-cols-2 gap-2">
            <button
              onClick={handleDownload}
              disabled={!qrSrc || loading}
              className="bg-white border-2 border-amber-200 text-amber-700 rounded-xl py-2.5 font-bold hover:bg-amber-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
            >
              <Download size={14} /> Unduh QR
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