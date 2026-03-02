import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  ChevronLeft, CheckCircle, Copy, Download, Share2,
  AlertCircle, Receipt, MapPin, Clock, QrCode,
  Loader2, Image
} from "lucide-react";

/* ─────────────────────────────────────────────
   Theme helpers
   ──────────────────────────────────────────── */
const BASE_URL = (import.meta.env.VITE_API_URL ?? "http://192.168.1.11:3000").replace(/\/$/, "");
const TOKEN_KEY = "astakira_token";
const tokenManager = { get: () => localStorage.getItem(TOKEN_KEY) ?? import.meta.env.VITE_API_TOKEN ?? "" };

function parseTheme(raw) {
  const DEF = { primary: "#f59e0b", secondary: "#ea580c", bg: "#f9fafb", text: "#111827" };
  if (!raw) return DEF;
  try {
    const p = typeof raw === "string" ? JSON.parse(raw) : raw;
    return { primary: p.primary ?? DEF.primary, secondary: p.secondary ?? DEF.secondary,
             bg: p.bg ?? DEF.bg, text: p.text ?? DEF.text };
  } catch { return DEF; }
}

function contrast(hex) {
  try {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return (0.299*r + 0.587*g + 0.114*b)/255 > 0.55 ? "#111827" : "#ffffff";
  } catch { return "#ffffff"; }
}

function ha(hex, a) {
  try {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  } catch { return hex; }
}

const THEME_CACHE_KEY = "astakira_theme";

function applyThemeVars(theme) {
  const onP = contrast(theme.primary);
  const vars = [
    `--p:${theme.primary}`, `--s:${theme.secondary}`, `--bg:${theme.bg}`, `--tx:${theme.text}`,
    `--on-p:${onP}`, `--p-20:${ha(theme.primary, 0.2)}`,
    `--bg-soft:${ha(theme.primary, 0.07)}`,
    `--grad:linear-gradient(135deg,${theme.primary},${theme.secondary})`,
  ].join(";");
  document.documentElement.setAttribute("style", vars);
}

const api = {
  get: async (path) => {
    const token = tokenManager.get();
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}/${path}`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
};

function generateOrderNumber() {
  return Math.random().toString(36).toUpperCase().slice(2, 10);
}

/* ─────────────────────────────────────────────
   Main Component
   ──────────────────────────────────────────── */
export default function RingkasanPesanan() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [searchParams] = useSearchParams();

  const CAFE_ID = state?.cafeId ?? searchParams.get("cafe_id") ?? "";
  const MEJA_ID = state?.mejaId ?? searchParams.get("table") ?? "1";

  const cart      = state?.cart      || {};
  const items     = state?.items     || [];
  const note      = state?.note      || "";
  const itemNotes = state?.itemNotes || {};
  const subtotal  = state?.subtotal  || 0;
  const discount  = state?.discount  || 0;
  const total     = state?.total     || subtotal;
  const form      = state?.form      || {};
  const method    = state?.method    || "online";

  const orderedItems = items.filter(i => (cart[i.id] || 0) > 0);
  const totalQty     = orderedItems.reduce((s, i) => s + (cart[i.id] || 0), 0);

  const [orderNumber] = useState(() => generateOrderNumber());
  const [status, setStatus]       = useState("waiting");
  const [copied, setCopied]       = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [cafeName, setCafeName]   = useState("ASTAKIRA");

  /* ── Muat tema ── */
  useEffect(() => {
    try {
      const cached = localStorage.getItem(THEME_CACHE_KEY);
      if (cached) applyThemeVars(JSON.parse(cached));
    } catch {}

    if (!CAFE_ID) return;
    api.get(`api/pengaturan/user/${CAFE_ID}`)
      .then(r => {
        const raw = r.data ?? r;
        const theme = parseTheme(raw?.tema_colors);
        applyThemeVars(theme);
        try { localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(theme)); } catch {}
        setCafeName(raw?.nama_cafe ?? raw?.nama ?? raw?.name ?? "ASTAKIRA");
      })
      .catch(() => {});
  }, [CAFE_ID]);

  /* ── Simulasi polling ── */
  useEffect(() => {
    if (status !== "waiting") return;
    const timer = setTimeout(() => triggerPaymentSuccess(), 8000);
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

  /* ── Shared: Detail pesanan card ── */
  const DetailCard = ({ accentColor }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <Receipt size={15} style={{ color: accentColor || "var(--p)" }} />
        <h3 className="font-bold text-sm text-gray-900">Detail Pesanan</h3>
      </div>
      <div className="divide-y divide-gray-50">
        {orderedItems.map(item => (
          <div key={item.id} className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0"
              style={{ background: "var(--bg-soft)" }}>
              {item.image_url || item.image
                ? <img src={item.image_url ?? item.image} alt={item.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center">
                    <Image size={14} style={{ color: "var(--p)", opacity: 0.4 }} />
                  </div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm line-clamp-1">{item.name}</p>
              {itemNotes[item.id] && (
                <p className="text-[10px]" style={{ color: "var(--p)" }}>📝 {itemNotes[item.id]}</p>
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
          <div className="rounded-xl px-3 py-2 text-xs border"
            style={{ background: "var(--bg-soft)", borderColor: "var(--p-20)", color: "var(--p)" }}>
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
          <span className="font-extrabold text-lg" style={{ color: accentColor || "var(--p)" }}>
            Rp{total.toLocaleString()}
          </span>
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
  );

  /* ── Shared: Nomor & QR card ── */
  const OrderNumberCard = ({ badgeText, badgeClass, tagStyle }) => (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-2.5 flex items-center justify-between border-b" style={tagStyle}>
        <div className="flex items-center gap-2">
          <MapPin size={14} style={{ color: "var(--p)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--p)" }}>
            Makan di Tempat · Meja {MEJA_ID}
          </span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>{badgeText}</span>
      </div>
      <div className="p-5 text-center">
        <p className="text-xs text-gray-400 font-semibold mb-3">Nomor Pesanan</p>
        <div className="rounded-2xl px-6 py-3 inline-block shadow-lg mb-3" style={{ background: "var(--grad)" }}>
          <span className="font-extrabold text-2xl tracking-[0.2em]" style={{ color: "var(--on-p)" }}>
            {orderNumber}
          </span>
        </div>
        <div className="flex gap-2 justify-center mt-3">
          <button onClick={handleCopy}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              copied ? "bg-green-100 text-green-700 border border-green-300" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}>
            <Copy size={13} />
            {copied ? "Tersalin!" : "Salin"}
          </button>
          <button onClick={() => navigator.share?.({ text: `Nomor pesananku: ${orderNumber}` })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all">
            <Share2 size={13} /> Bagikan
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
              <div key={i} className={`absolute ${cls} w-5 h-5`} style={{ borderColor: "var(--p)" }} />
            ))}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${orderNumber}`}
              alt="QR Code" className="w-44 h-44 bg-white p-3 rounded-2xl shadow-lg"
            />
          </div>
          <button onClick={handleDownloadQR}
            className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-white border-2 rounded-xl text-xs font-bold text-gray-700 transition-all hover:opacity-80"
            style={{ borderColor: "var(--p-20)" }}>
            <Download size={13} />
            Download QR
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen relative" style={{ background: "var(--bg)", color: "var(--tx)" }}>

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100">
        <div className="flex items-center px-4 py-3.5">
          <button onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:opacity-80 transition-all"
            style={{ background: "var(--bg-soft)" }}>
            <ChevronLeft size={20} style={{ color: "var(--p)" }} />
          </button>
          <div className="flex-1 text-center">
            <h1 className="font-extrabold text-base text-gray-900">Ringkasan Pesanan</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">Meja {MEJA_ID} · {cafeName}</p>
          </div>
          <div className="w-10" />
        </div>
      </div>

      <div className={`pb-8 transition-all duration-300 ${confirmNew ? "blur-sm pointer-events-none" : ""}`}>

        {/* ══════════════════════════════════════
            WAITING / PROCESSING
        ══════════════════════════════════════ */}
        {(status === "waiting" || status === "processing") && (
          <>
            {/* Banner — tetap pakai var(--grad) agar sesuai tema */}
            <div className="px-5 pt-8 pb-12" style={{ background: "var(--grad)" }}>
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  {status === "processing" ? (
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl">
                      <Loader2 size={36} className="animate-spin" style={{ color: "var(--p)" }} />
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl">
                      {method === "kasir"
                        ? <MapPin size={36} style={{ color: "var(--p)" }} />
                        : <QrCode size={36} style={{ color: "var(--p)" }} />
                      }
                    </div>
                  )}
                </div>

                {status === "processing" ? (
                  <>
                    <h2 className="text-xl font-extrabold mb-1" style={{ color: "var(--on-p)" }}>Memverifikasi...</h2>
                    <p className="text-sm" style={{ color: "var(--on-p)", opacity: 0.8 }}>Sedang mengkonfirmasi pembayaranmu</p>
                  </>
                ) : method === "kasir" ? (
                  <>
                    <h2 className="text-xl font-extrabold mb-1" style={{ color: "var(--on-p)" }}>Pergi ke Kasir</h2>
                    <p className="text-sm" style={{ color: "var(--on-p)", opacity: 0.8 }}>
                      Tunjukkan kode atau QR di bawah ke staff kasir untuk konfirmasi
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-extrabold mb-1" style={{ color: "var(--on-p)" }}>Scan QR untuk Bayar</h2>
                    <p className="text-sm" style={{ color: "var(--on-p)", opacity: 0.8 }}>
                      Scan QR code di bawah menggunakan GoPay, OVO, Dana, atau ShopeePay
                    </p>
                  </>
                )}

                <div className="flex items-center justify-center gap-2 mt-3 rounded-full px-4 py-1.5 w-fit mx-auto border"
                  style={{ background: "rgba(255,255,255,0.2)", borderColor: "rgba(255,255,255,0.3)" }}>
                  <Clock size={13} style={{ color: "var(--on-p)", opacity: 0.8 }} />
                  <span className="text-xs font-semibold" style={{ color: "var(--on-p)" }}>Estimasi 10–20 menit</span>
                </div>
              </div>
            </div>

            <div className="px-4 -mt-6 space-y-4">
              <OrderNumberCard
                badgeText={method === "kasir" ? "Bayar di Kasir" : "Bayar Online"}
                badgeClass=""
                tagStyle={{ background: "var(--bg-soft)", borderColor: "var(--p-20)" }}
              />

              {/* Instruksi */}
              <div className="rounded-2xl p-4 flex gap-3 border-2"
                style={{ background: "var(--bg-soft)", borderColor: "var(--p-20)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--p)" }}>
                  <AlertCircle size={18} style={{ color: "var(--on-p)" }} />
                </div>
                <div>
                  <p className="font-bold text-sm mb-0.5" style={{ color: "var(--p)" }}>
                    {method === "kasir" ? "Langkah selanjutnya" : "Cara Bayar"}
                  </p>
                  {method === "kasir" ? (
                    <ol className="text-xs text-gray-600 leading-relaxed space-y-0.5 list-decimal list-inside">
                      <li>Pergi ke meja kasir</li>
                      <li>Tunjukkan kode <strong>{orderNumber}</strong> atau QR di atas</li>
                      <li>Lakukan pembayaran di kasir</li>
                      <li>Tunggu pesananmu diantar ke meja</li>
                    </ol>
                  ) : (
                    <ol className="text-xs text-gray-600 leading-relaxed space-y-0.5 list-decimal list-inside">
                      <li>Buka GoPay / OVO / Dana / ShopeePay</li>
                      <li>Pilih menu "Scan QR" atau "Bayar"</li>
                      <li>Scan QR Code di atas</li>
                      <li>Konfirmasi pembayaran di aplikasi</li>
                    </ol>
                  )}
                </div>
              </div>

              <DetailCard />

              {/* Dev: simulasi */}
              <button onClick={triggerPaymentSuccess}
                className="w-full border-2 border-dashed border-gray-300 text-gray-400 py-3 rounded-2xl text-xs font-semibold hover:opacity-70 transition-all"
                style={{ ["--hover-border"]: "var(--p)" }}>
                🧪 Simulasi: QR Sudah Di-scan
              </button>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════
            SUCCESS
        ══════════════════════════════════════ */}
        {status === "success" && (
          <>
            {/* Success banner — tetap hijau karena universal */}
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
              {/* Nomor pesanan success — pakai tema brand */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-2.5 flex items-center justify-between border-b bg-green-50 border-green-100">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-green-600" />
                    <span className="text-xs font-semibold text-green-700">Makan di Tempat · Meja {MEJA_ID}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                    ✓ Pembayaran Diterima
                  </span>
                </div>
                <div className="p-5 text-center">
                  <p className="text-xs text-gray-400 font-semibold mb-3">Nomor Pesanan</p>
                  <div className="rounded-2xl px-6 py-3 inline-block shadow-lg shadow-green-500/30 mb-3"
                    style={{ background: "linear-gradient(135deg,#22c55e,#10b981)" }}>
                    <span className="text-white font-extrabold text-2xl tracking-[0.2em]">{orderNumber}</span>
                  </div>
                  <div className="flex gap-2 justify-center mt-3">
                    <button onClick={handleCopy}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        copied ? "bg-green-100 text-green-700 border border-green-300" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}>
                      <Copy size={13} /> {copied ? "Tersalin!" : "Salin"}
                    </button>
                    <button onClick={() => navigator.share?.({ text: `Nomor pesananku: ${orderNumber}` })}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all">
                      <Share2 size={13} /> Bagikan
                    </button>
                  </div>
                </div>
              </div>

              <DetailCard accentColor="#22c55e" />

              {/* Pesan lagi — pakai tema brand */}
              <button onClick={() => setConfirmNew(true)}
                className="w-full py-4 rounded-2xl font-bold shadow-lg hover:scale-[1.02] hover:shadow-xl transition-all flex items-center justify-center gap-2"
                style={{ background: "var(--grad)", color: "var(--on-p)" }}>
                <Receipt size={18} />
                Buat Pesanan Baru
              </button>

              <p className="text-center text-xs text-gray-400 pb-4">
                Terima kasih sudah memesan di {cafeName} ☕
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── MODAL PESANAN BARU ── */}
      {confirmNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fadeIn"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setConfirmNew(false)}>
          <div className="bg-white rounded-[2rem] p-7 w-full max-w-sm text-center space-y-5 shadow-2xl animate-scaleIn"
            onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center"
              style={{ background: "var(--bg-soft)" }}>
              <span className="text-5xl">🤔</span>
            </div>
            <div>
              <h3 className="font-bold text-xl text-gray-900 mb-1">Pesanan Baru?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Pesanan sebelumnya akan tetap diproses. Kamu yakin ingin membuat pesanan baru?
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmNew(false)}
                className="flex-1 border-2 border-gray-200 text-gray-700 rounded-2xl py-3.5 font-bold hover:bg-gray-50 transition-all">
                Batal
              </button>
              <button onClick={() => navigate(`/?table=${MEJA_ID}&cafe_id=${CAFE_ID}`)}
                className="flex-1 rounded-2xl py-3.5 font-bold shadow-lg transition-all"
                style={{ background: "var(--grad)", color: "var(--on-p)" }}>
                Ya, Lanjut →
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn  { from { opacity: 0; }             to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; scale: 0.9; } to { opacity: 1; scale: 1; } }
        .animate-fadeIn  { animation: fadeIn  0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s cubic-bezier(0.16,1,0.3,1); }
        .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}