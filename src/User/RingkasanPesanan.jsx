import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  ChevronLeft, CheckCircle, Copy, Download, Share2,
  AlertCircle, Receipt, MapPin, Clock, QrCode,
  ArrowRight, Loader2
} from "lucide-react";

function generateOrderNumber() {
  return Math.random().toString(36).toUpperCase().slice(2, 10);
}

// ─── STATUS ───────────────────────────────────────────────────────────────────
// "waiting" → belum scan / belum bayar
// "processing" → loading sebentar (simulasi verifikasi)
// "success" → pembayaran terkonfirmasi

export default function RingkasanPesanan() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const cart       = state?.cart       || {};
  const items      = state?.items      || [];
  const note       = state?.note       || "";
  const itemNotes  = state?.itemNotes  || {};
  const subtotal   = state?.subtotal   || 0;
  const discount   = state?.discount   || 0;
  const total      = state?.total      || subtotal;
  const form       = state?.form       || {};
  const method     = state?.method     || "online"; // "kasir" | "online"

  const orderedItems = items.filter((i) => cart[i.id] > 0);
  const totalQty     = orderedItems.reduce((s, i) => s + (cart[i.id] || 0), 0);

  const [orderNumber] = useState(() => generateOrderNumber());
  const [status,      setStatus]      = useState("waiting");   // waiting | processing | success
  const [copied,      setCopied]      = useState(false);
  const [confirmNew,  setConfirmNew]  = useState(false);

  // Simulasi: polling QR scan setiap 3 detik
  // Di produksi, ganti dengan WebSocket / SSE dari backend
  useEffect(() => {
    if (status !== "waiting") return;

    // Untuk demo: setelah 8 detik otomatis pindah ke processing → success
    // Hapus ini dan ganti dengan real polling ke backend
    const timer = setTimeout(() => {
      triggerPaymentSuccess();
    }, 8000);

    return () => clearTimeout(timer);
  }, [status]);

  const triggerPaymentSuccess = () => {
    setStatus("processing");
    setTimeout(() => setStatus("success"), 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const link = document.createElement("a");
    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${orderNumber}`;
    link.download = `QR-${orderNumber}.png`;
    link.click();
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 relative">

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100">
        <div className="flex items-center px-4 py-3.5">
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
          >
            <ChevronLeft size={20} className="text-gray-700" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="font-extrabold text-base text-gray-900">Ringkasan Pesanan</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">Meja 1 · ASTAKIRA</p>
          </div>
          <div className="w-10" />
        </div>
      </div>

      <div className={`pb-8 transition-all duration-300 ${confirmNew ? "blur-sm pointer-events-none" : ""}`}>

        {/* ══════════════════════════════════════════════════════════════
            STATUS: WAITING — Menunggu scan QR / konfirmasi kasir
        ══════════════════════════════════════════════════════════════ */}
        {(status === "waiting" || status === "processing") && (
          <>
            {/* Banner */}
            <div className={`px-5 pt-8 pb-12 transition-all duration-500 ${
              method === "kasir"
                ? "bg-gradient-to-br from-blue-600 to-indigo-700"
                : "bg-gradient-to-br from-amber-500 to-orange-600"
            }`}>
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  {status === "processing" ? (
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl">
                      <Loader2 size={36} className="text-amber-500 animate-spin" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl">
                      {method === "kasir"
                        ? <MapPin size={36} className="text-blue-600" />
                        : <QrCode size={36} className="text-amber-500" />
                      }
                    </div>
                  )}
                </div>

                {status === "processing" ? (
                  <>
                    <h2 className="text-white text-xl font-extrabold mb-1">Memverifikasi...</h2>
                    <p className="text-white/80 text-sm">Sedang mengkonfirmasi pembayaranmu</p>
                  </>
                ) : method === "kasir" ? (
                  <>
                    <h2 className="text-white text-xl font-extrabold mb-1">Pergi ke Kasir</h2>
                    <p className="text-blue-100 text-sm">Tunjukkan kode atau QR di bawah ke staff kasir untuk konfirmasi</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-white text-xl font-extrabold mb-1">Scan QR untuk Bayar</h2>
                    <p className="text-amber-100 text-sm">Scan QR code di bawah menggunakan GoPay, OVO, Dana, atau ShopeePay</p>
                  </>
                )}

                <div className="flex items-center justify-center gap-2 mt-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1.5 w-fit mx-auto">
                  <Clock size={13} className="text-white/80" />
                  <span className="text-white text-xs font-semibold">Estimasi 10–20 menit</span>
                </div>
              </div>
            </div>

            <div className="px-4 -mt-6 space-y-4">

              {/* Kartu nomor & QR */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Tag lokasi */}
                <div className={`border-b px-4 py-2.5 flex items-center justify-between ${
                  method === "kasir" ? "bg-blue-50 border-blue-100" : "bg-amber-50 border-amber-100"
                }`}>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className={method === "kasir" ? "text-blue-600" : "text-amber-600"} />
                    <span className={`text-xs font-semibold ${method === "kasir" ? "text-blue-700" : "text-amber-700"}`}>
                      Makan di Tempat · Meja 1
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    method === "kasir"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {method === "kasir" ? "Bayar di Kasir" : "Bayar Online"}
                  </span>
                </div>

                <div className="p-5 text-center">
                  <p className="text-xs text-gray-400 font-semibold mb-3">Nomor Pesanan</p>
                  <div className={`rounded-2xl px-6 py-3 inline-block shadow-lg mb-3 ${
                    method === "kasir"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/30"
                      : "bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/30"
                  }`}>
                    <span className="text-white font-extrabold text-2xl tracking-[0.2em]">{orderNumber}</span>
                  </div>

                  <div className="flex gap-2 justify-center mt-3">
                    <button
                      onClick={handleCopy}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        copied
                          ? "bg-green-100 text-green-700 border border-green-300"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <Copy size={13} />
                      {copied ? "Tersalin!" : "Salin"}
                    </button>
                    <button
                      onClick={() => navigator.share?.({ text: `Nomor pesananku: ${orderNumber}` })}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                    >
                      <Share2 size={13} />
                      Bagikan
                    </button>
                  </div>
                </div>

                {/* QR */}
                <div className="px-5 pb-5">
                  <div className="bg-gray-50 rounded-2xl p-5 flex flex-col items-center border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 mb-3">
                      {method === "kasir" ? "Tunjukkan QR Code ke kasir" : "Scan untuk pembayaran QRIS"}
                    </p>
                    <div className="relative">
                      {["top-[-4px] left-[-4px] border-t-4 border-l-4 rounded-tl-xl",
                        "top-[-4px] right-[-4px] border-t-4 border-r-4 rounded-tr-xl",
                        "bottom-[-4px] left-[-4px] border-b-4 border-l-4 rounded-bl-xl",
                        "bottom-[-4px] right-[-4px] border-b-4 border-r-4 rounded-br-xl",
                      ].map((cls, i) => (
                        <div key={i} className={`absolute ${cls} w-5 h-5 border-amber-500`} />
                      ))}
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${orderNumber}`}
                        alt="QR Code"
                        className="w-44 h-44 bg-white p-3 rounded-2xl shadow-lg"
                      />
                    </div>
                    <button
                      onClick={handleDownloadQR}
                      className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-white border-2 border-gray-200 hover:border-amber-400 rounded-xl text-xs font-bold text-gray-700 transition-all"
                    >
                      <Download size={13} />
                      Download QR
                    </button>
                  </div>
                </div>
              </div>

              {/* Alert instruksi */}
              <div className={`border-2 rounded-2xl p-4 flex gap-3 ${
                method === "kasir"
                  ? "bg-blue-50 border-blue-300"
                  : "bg-amber-50 border-amber-300"
              }`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  method === "kasir" ? "bg-blue-400" : "bg-amber-400"
                }`}>
                  <AlertCircle size={18} className="text-white" />
                </div>
                <div>
                  <p className={`font-bold text-sm mb-0.5 ${method === "kasir" ? "text-blue-900" : "text-amber-900"}`}>
                    {method === "kasir" ? "Langkah selanjutnya" : "Cara Bayar"}
                  </p>
                  {method === "kasir" ? (
                    <ol className="text-xs text-blue-800 leading-relaxed space-y-0.5 list-decimal list-inside">
                      <li>Pergi ke meja kasir</li>
                      <li>Tunjukkan kode <strong>{orderNumber}</strong> atau QR di atas</li>
                      <li>Lakukan pembayaran di kasir</li>
                      <li>Tunggu pesananmu diantar ke meja</li>
                    </ol>
                  ) : (
                    <ol className="text-xs text-amber-800 leading-relaxed space-y-0.5 list-decimal list-inside">
                      <li>Buka GoPay / OVO / Dana / ShopeePay</li>
                      <li>Pilih menu "Scan QR" atau "Bayar"</li>
                      <li>Scan QR Code di atas</li>
                      <li>Konfirmasi pembayaran di aplikasi</li>
                    </ol>
                  )}
                </div>
              </div>

              {/* Detail pesanan ringkas */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <Receipt size={15} className="text-amber-600" />
                  <h3 className="font-bold text-sm text-gray-900">Detail Pesanan</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {orderedItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                      {item.image && (
                        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                          <img src={item.image + "?w=100&auto=format"} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm line-clamp-1">{item.name}</p>
                        {itemNotes[item.id] && (
                          <p className="text-[10px] text-amber-600">📝 {itemNotes[item.id]}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[10px] text-gray-400">{cart[item.id]}×</p>
                        <p className="text-sm font-bold text-gray-800">Rp{(cart[item.id] * item.price).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {note && (
                  <div className="px-4 pb-3">
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-xs text-amber-700">
                      📝 Catatan: {note}
                    </div>
                  </div>
                )}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal ({totalQty} item)</span>
                    <span className="font-semibold">Rp{subtotal.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Diskon Promo</span>
                      <span className="font-semibold text-green-600">-Rp{discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="h-px bg-gray-200" />
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">Total Pembayaran</span>
                    <span className="font-extrabold text-amber-600 text-lg">Rp{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Tombol simulasi (dev only) — hapus di produksi */}
              <button
                onClick={triggerPaymentSuccess}
                className="w-full border-2 border-dashed border-gray-300 text-gray-400 py-3 rounded-2xl text-xs font-semibold hover:border-amber-400 hover:text-amber-500 transition-all"
              >
                🧪 Simulasi: QR Sudah Di-scan
              </button>

            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════
            STATUS: SUCCESS — Pembayaran terkonfirmasi
        ══════════════════════════════════════════════════════════════ */}
        {status === "success" && (
          <>
            {/* Success banner */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-5 pt-8 pb-12">
              <div className="text-center">
                <div className="flex justify-center mb-4 relative">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl relative z-10">
                    <CheckCircle size={46} className="text-green-500" strokeWidth={2.5} />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full border-4 border-white/30 animate-ping" />
                  </div>
                </div>
                <h2 className="text-white text-2xl font-extrabold mb-1">Pesanan Berhasil! 🎉</h2>
                <p className="text-green-100 text-sm">Pembayaran terkonfirmasi · Pesananmu sedang dibuat</p>
                <div className="flex items-center justify-center gap-2 mt-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1.5 w-fit mx-auto">
                  <Clock size={13} className="text-green-100" />
                  <span className="text-white text-xs font-semibold">Estimasi 10–20 menit</span>
                </div>
              </div>
            </div>

            <div className="px-4 -mt-6 space-y-4">

              {/* Nomor pesanan */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-green-50 border-b border-green-100 px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-green-600" />
                    <span className="text-xs font-semibold text-green-700">Makan di Tempat · Meja 1</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                    ✓ Pembayaran Diterima
                  </span>
                </div>
                <div className="p-5 text-center">
                  <p className="text-xs text-gray-400 font-semibold mb-3">Nomor Pesanan</p>
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl px-6 py-3 inline-block shadow-lg shadow-green-500/30 mb-3">
                    <span className="text-white font-extrabold text-2xl tracking-[0.2em]">{orderNumber}</span>
                  </div>
                  <div className="flex gap-2 justify-center mt-3">
                    <button onClick={handleCopy} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${copied ? "bg-green-100 text-green-700 border border-green-300" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                      <Copy size={13} />
                      {copied ? "Tersalin!" : "Salin"}
                    </button>
                    <button onClick={() => navigator.share?.({ text: `Nomor pesananku: ${orderNumber}` })} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all">
                      <Share2 size={13} /> Bagikan
                    </button>
                  </div>
                </div>
              </div>

              {/* Detail pesanan */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <Receipt size={15} className="text-green-600" />
                  <h3 className="font-bold text-sm text-gray-900">Detail Pesanan</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {orderedItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                      {item.image && (
                        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                          <img src={item.image + "?w=100&auto=format"} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm line-clamp-1">{item.name}</p>
                        {itemNotes[item.id] && <p className="text-[10px] text-amber-600">📝 {itemNotes[item.id]}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[10px] text-gray-400">{cart[item.id]}×</p>
                        <p className="text-sm font-bold text-gray-800">Rp{(cart[item.id] * item.price).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {note && (
                  <div className="px-4 pb-3">
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-xs text-amber-700">
                      📝 Catatan: {note}
                    </div>
                  </div>
                )}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal ({totalQty} item)</span>
                    <span className="font-semibold">Rp{subtotal.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Diskon Promo</span>
                      <span className="font-semibold text-green-600">-Rp{discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Biaya layanan</span>
                    <span className="font-semibold text-green-600">Gratis</span>
                  </div>
                  <div className="h-px bg-gray-200" />
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">Total Pembayaran</span>
                    <span className="font-extrabold text-green-600 text-lg">Rp{total.toLocaleString()}</span>
                  </div>
                </div>
                {(form.nama || form.hp) && (
                  <div className="px-4 py-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 font-semibold mb-2">Info Pemesan</p>
                    {form.nama && <p className="text-sm font-semibold text-gray-700">{form.nama}</p>}
                    {form.hp   && <p className="text-xs text-gray-500">{form.hp}</p>}
                  </div>
                )}
              </div>

              {/* Tombol pesan lagi */}
              <button
                onClick={() => setConfirmNew(true)}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-amber-500/25 hover:scale-[1.02] hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Receipt size={18} />
                Buat Pesanan Baru
              </button>

              <p className="text-center text-xs text-gray-400 pb-4">
                Terima kasih sudah memesan di ASTAKIRA ☕
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── MODAL KONFIRMASI PESANAN BARU ── */}
      {confirmNew && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn px-4"
          onClick={() => setConfirmNew(false)}
        >
          <div
            className="bg-white rounded-[2rem] p-7 w-full max-w-sm text-center space-y-5 shadow-2xl animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center">
              <span className="text-5xl">🤔</span>
            </div>
            <div>
              <h3 className="font-bold text-xl text-gray-900 mb-1">Pesanan Baru?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Pesanan sebelumnya akan tetap diproses. Kamu yakin ingin membuat pesanan baru?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmNew(false)}
                className="flex-1 border-2 border-gray-200 text-gray-700 rounded-2xl py-3.5 font-bold hover:bg-gray-50 transition-all"
              >
                Batal
              </button>
              <button
                onClick={() => navigate("/")}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl py-3.5 font-bold shadow-lg transition-all"
              >
                Ya, Lanjut →
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn  { from { opacity: 0; }              to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; scale: 0.9; } to { opacity: 1; scale: 1; } }
        .animate-fadeIn  { animation: fadeIn  0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}