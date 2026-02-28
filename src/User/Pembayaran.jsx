import { ChevronLeft, CreditCard, Wallet, Check, Gift, Info, X, Tag } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

// ── Inline PromoCode Modal ────────────────────────────────────────────────────
const promoCodes = [
  { code: "ASTAKIRA10", discount: "10%", description: "Diskon 10% untuk semua menu", minOrder: 20000 },
  { code: "NEWUSER", discount: "Rp5.000", description: "Diskon Rp5.000 untuk pelanggan baru", minOrder: 15000 },
  { code: "KOPI20", discount: "20%", description: "Diskon 20% khusus menu kopi", minOrder: 10000 },
];

function PromoCodeModal({ onClose, onApply, subtotal }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const handleApply = (codeObj) => {
    if (codeObj.minOrder && subtotal < codeObj.minOrder) {
      setError(`Minimum pesanan Rp${codeObj.minOrder.toLocaleString()} untuk kode ini`);
      setSuccess(null);
      return;
    }
    setSuccess(codeObj);
    setError("");
    setTimeout(() => {
      onApply(codeObj);
      onClose();
    }, 800);
  };

  const handleManualApply = () => {
    const found = promoCodes.find((p) => p.code === input.toUpperCase().trim());
    if (!found) { setError("Kode promo tidak valid"); return; }
    handleApply(found);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md mx-auto rounded-t-[2rem] p-5 animate-slideUp shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-bold text-lg text-gray-900">Kode Promo</h2>
          <button onClick={onClose} className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
            <X size={18} className="text-gray-600" />
          </button>
        </div>

        {/* Manual input */}
        <div className="flex gap-2 mb-5">
          <input
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(""); }}
            placeholder="Masukkan kode promo"
            className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold uppercase outline-none focus:border-amber-500 transition-all"
          />
          <button
            onClick={handleManualApply}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 rounded-xl font-bold text-sm shadow-md"
          >
            Pakai
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-500 font-semibold mb-3 flex items-center gap-1">
            <Info size={12} /> {error}
          </p>
        )}

        <p className="text-xs text-gray-400 font-semibold mb-3 uppercase tracking-wide">Promo Tersedia</p>
        <div className="space-y-2 pb-4">
          {promoCodes.map((p) => (
            <button
              key={p.code}
              onClick={() => handleApply(p)}
              className={`w-full border-2 rounded-2xl p-4 flex items-center justify-between text-left transition-all ${
                success?.code === p.code
                  ? "border-green-500 bg-green-50"
                  : "border-dashed border-amber-300 hover:border-amber-500 hover:bg-amber-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Tag size={16} className="text-white" />
                </div>
                <div>
                  <p className="font-extrabold text-amber-700 text-sm">{p.code}</p>
                  <p className="text-xs text-gray-500">{p.description}</p>
                </div>
              </div>
              <div className={`text-sm font-extrabold px-3 py-1 rounded-xl ${
                success?.code === p.code ? "bg-green-500 text-white" : "bg-amber-100 text-amber-700"
              }`}>
                {success?.code === p.code ? <Check size={16} /> : p.discount}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Pembayaran ────────────────────────────────────────────────────────────
export default function Pembayaran() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const cart = state?.cart || {};
  const items = state?.items || [];
  const note = state?.note || "";
  const itemNotes = state?.itemNotes || {};
  const subtotal = state?.subtotal || 0;

  const orderedItems = items.filter((i) => cart[i.id] > 0);
  const totalQty = orderedItems.reduce((s, i) => s + (cart[i.id] || 0), 0);

  const [method, setMethod] = useState("online");
  const [confirmKasir, setConfirmKasir] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(null);

  const [form, setForm] = useState({ nama: "", hp: "", email: "", meja: "1" });

  const calculateDiscount = () => {
    if (!appliedPromo) return 0;
    if (appliedPromo.discount.includes("%")) {
      return Math.round(subtotal * parseInt(appliedPromo.discount) / 100);
    }
    return parseInt(appliedPromo.discount.replace(/\D/g, ""));
  };
  const discount = calculateDiscount();
  const total = subtotal - discount;

  const handleBayar = () => {
    if (method === "kasir") {
      setConfirmKasir(true);
    } else {
      navigate("/ringkasanpesanan", {
        state: { cart, items, note, itemNotes, subtotal, discount, total, form, method },
      });
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 relative">

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100">
        <div className="flex items-center px-4 py-3.5">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
          >
            <ChevronLeft size={20} className="text-gray-700" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="font-extrabold text-base text-gray-900">Pembayaran</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">{totalQty} item · Meja 1</p>
          </div>
          <div className="w-10" />
        </div>
      </div>

      <div className={`pb-32 transition-all duration-300 ${confirmKasir ? "blur-sm pointer-events-none" : ""}`}>

        {/* ── ORDER QUICK SUMMARY ── */}
        <div className="px-4 pt-4 mb-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">1</span>
                </div>
                <p className="font-bold text-sm text-gray-900">Ringkasan Pesanan</p>
              </div>
              <button
                onClick={() => navigate(-1)}
                className="text-xs text-amber-600 font-semibold"
              >
                Ubah
              </button>
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
                      <p className="text-[10px] text-amber-600 line-clamp-1">📝 {itemNotes[item.id]}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">{cart[item.id]}×</p>
                    <p className="text-sm font-bold text-amber-600">Rp{(cart[item.id] * item.price).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
            {note && (
              <div className="mx-4 mb-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-start gap-2">
                <span className="text-[10px] text-amber-700">📝 Catatan: {note}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── INFORMASI PEMESAN ── */}
        <div className="px-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">2</span>
            </div>
            <h2 className="font-bold text-sm text-gray-900">Informasi Pemesan</h2>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            {[
              { key: "nama", label: "Nama Lengkap", placeholder: "Masukkan nama lengkap", type: "text" },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{label}</label>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all"
                />
              </div>
            ))}

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Nomor Meja</label>
              <div className="relative">
                <input
                  disabled
                  value="Meja 1"
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 font-semibold cursor-not-allowed"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <Check size={13} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── METODE PEMBAYARAN ── */}
        <div className="px-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">3</span>
            </div>
            <h2 className="font-bold text-sm text-gray-900">Metode Pembayaran</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "online", icon: <CreditCard size={22} />, label: "Online", sub: "QRIS / E-Wallet" },
              { id: "kasir", icon: <Wallet size={22} />, label: "Di Kasir", sub: "Bayar langsung" },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`relative rounded-2xl p-4 border-2 transition-all ${
                  method === m.id
                    ? "border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 shadow-md shadow-amber-500/15"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex flex-col items-center gap-2.5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    method === m.id ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-md" : "bg-gray-100"
                  }`}>
                    <span className={method === m.id ? "text-white" : "text-gray-500"}>{m.icon}</span>
                  </div>
                  <div className="text-center">
                    <p className={`font-bold text-sm ${method === m.id ? "text-amber-700" : "text-gray-900"}`}>{m.label}</p>
                    <p className="text-[10px] text-gray-400">{m.sub}</p>
                  </div>
                </div>
                {method === m.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow">
                    <Check size={11} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Online detail */}
          {method === "online" && (
            <div className="mt-3 bg-white border-2 border-amber-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <span className="text-xl">📱</span>
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900">QRIS</p>
                  <p className="text-xs text-gray-400">Scan QR Code untuk bayar</p>
                </div>
              </div>
              <div className="w-5 h-5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                <Check size={11} className="text-white" />
              </div>
            </div>
          )}

          {/* Kasir info */}
          {method === "kasir" && (
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
              <span className="text-2xl flex-shrink-0">🧾</span>
              <div>
                <p className="font-bold text-sm text-blue-800 mb-0.5">Bayar di Kasir</p>
                <p className="text-xs text-blue-600 leading-relaxed">
                  Setelah konfirmasi, tunjukkan kode pesanan ke staff kasir kami.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── PROMO ── */}
        <div className="px-4 mb-5">
          <button
            onClick={() => setShowPromo(true)}
            className={`w-full rounded-2xl p-4 border-2 flex items-center justify-between transition-all ${
              appliedPromo
                ? "border-green-500 bg-green-50"
                : "border-dashed border-amber-300 bg-white hover:border-amber-500 hover:bg-amber-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                appliedPromo ? "bg-green-500" : "bg-gradient-to-br from-amber-500 to-orange-500"
              }`}>
                {appliedPromo ? <Check size={18} className="text-white" /> : <Gift size={18} className="text-white" />}
              </div>
              <div className="text-left">
                {appliedPromo ? (
                  <>
                    <p className="font-bold text-green-700 text-sm">{appliedPromo.code}</p>
                    <p className="text-xs text-green-600">Hemat {appliedPromo.discount}!</p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-gray-900 text-sm">Punya Kode Promo?</p>
                    <p className="text-xs text-gray-400">Ketuk untuk gunakan diskon</p>
                  </>
                )}
              </div>
            </div>
            <ChevronLeft size={18} className="text-gray-400 rotate-180" />
          </button>
        </div>

        {/* ── RINCIAN HARGA ── */}
        <div className="px-4 mb-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal ({totalQty} item)</span>
              <span className="font-semibold text-gray-900">Rp{subtotal.toLocaleString()}</span>
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
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between items-center bg-amber-50 rounded-xl px-3 py-2.5">
              <span className="font-bold text-gray-900 text-sm">Total Pembayaran</span>
              <span className="font-extrabold text-amber-600 text-lg">Rp{total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-xl">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              {discount > 0 && (
                <p className="text-xs text-gray-400 line-through">Rp{subtotal.toLocaleString()}</p>
              )}
              <p className="text-xs text-gray-400 mb-0.5">Total Pembayaran</p>
              <p className="font-extrabold text-2xl text-gray-900">Rp{total.toLocaleString()}</p>
            </div>
            <button
              onClick={handleBayar}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-amber-500/30 hover:scale-105 hover:shadow-xl transition-all whitespace-nowrap"
            >
              Bayar Sekarang →
            </button>
          </div>
        </div>
      </div>

      {/* ── KASIR CONFIRMATION MODAL ── */}
      {confirmKasir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn px-4">
          <div className="bg-white rounded-[2rem] p-7 w-full max-w-sm text-center space-y-5 shadow-2xl animate-scaleIn">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-100 to-orange-100 rounded-3xl flex items-center justify-center">
              <span className="text-5xl">🧾</span>
            </div>
            <div>
              <h3 className="font-bold text-xl text-gray-900 mb-1">Konfirmasi Pesanan</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Pastikan semua pesanan sudah benar sebelum melanjutkan ke kasir
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total item</span>
                <span className="font-semibold">{totalQty} item</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total bayar</span>
                <span className="font-extrabold text-amber-700 text-base">Rp{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Metode</span>
                <span className="font-semibold">Bayar di Kasir</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmKasir(false)}
                className="flex-1 border-2 border-gray-200 text-gray-700 rounded-2xl py-3.5 font-bold hover:bg-gray-50 transition-all"
              >
                Cek Lagi
              </button>
              <button
                onClick={() =>
                  navigate("/ringkasanpesanan", {
                    state: { cart, items, note, itemNotes, subtotal, discount, total, form, method },
                  })
                }
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl py-3.5 font-bold shadow-lg transition-all"
              >
                Lanjutkan →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PROMO MODAL ── */}
      {showPromo && (
        <PromoCodeModal
          onClose={() => setShowPromo(false)}
          onApply={setAppliedPromo}
          subtotal={subtotal}
        />
      )}

      <style jsx>{`
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}
