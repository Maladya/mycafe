import { ChevronLeft, Gift, Check, X, Tag, Sparkles } from "lucide-react";
import { useState } from "react";

export default function PromoCode({ onClose, onApply }) {
  const [promoCode, setPromoCode] = useState("");
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState("");

  // Daftar promo yang tersedia (contoh)
  const availablePromos = [
    {
      code: "WELCOME10",
      discount: "10%",
      description: "Diskon 10% untuk pelanggan baru",
      minTransaction: 50000,
    },
    {
      code: "HEMAT5K",
      discount: "Rp5.000",
      description: "Potongan Rp5.000 untuk semua menu",
      minTransaction: 20000,
    },
    {
      code: "MAKAN2",
      discount: "20%",
      description: "Diskon 20% untuk 2 item atau lebih",
      minTransaction: 30000,
    },
  ];

  const handleApply = () => {
    setError("");
    
    if (!promoCode.trim()) {
      setError("Masukkan kode promo terlebih dahulu");
      return;
    }

    // Validasi kode promo
    const validPromo = availablePromos.find(
      (p) => p.code.toLowerCase() === promoCode.toLowerCase()
    );

    if (validPromo) {
      setApplied(true);
      setTimeout(() => {
        if (onApply) onApply(validPromo);
      }, 800);
    } else {
      setError("Kode promo tidak valid");
    }
  };

  const handleSelectPromo = (code) => {
    setPromoCode(code);
    setError("");
    setApplied(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-t-[2rem] w-full max-w-md max-h-[90vh] overflow-hidden animate-slideUp">
        {/* HEADER */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Gift size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-900">Kode Promo</h2>
              <p className="text-xs text-gray-500">Dapatkan diskon spesial</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
          >
            <X size={20} className="text-gray-700" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="overflow-y-auto px-6 py-6 space-y-6 pb-8" style={{ maxHeight: "calc(90vh - 80px)" }}>
          {/* INPUT PROMO */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-3 block">
              Masukkan Kode Promo
            </label>
            <div className="relative">
              <input
                placeholder="Contoh: WELCOME10"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase());
                  setError("");
                  setApplied(false);
                }}
                className={`w-full border-2 rounded-2xl px-4 py-4 pr-12 font-semibold uppercase focus:ring-4 outline-none transition-all ${
                  error
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                    : applied
                    ? "border-green-300 focus:border-green-500 focus:ring-green-500/10 bg-green-50"
                    : "border-gray-200 focus:border-amber-500 focus:ring-amber-500/10"
                }`}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {applied ? (
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center animate-scaleIn">
                    <Check size={16} className="text-white" />
                  </div>
                ) : (
                  <Tag size={20} className="text-gray-400" />
                )}
              </div>
            </div>

            {error && (
              <div className="mt-3 flex items-center gap-2 text-red-600 animate-fadeIn">
                <X size={14} />
                <p className="text-xs font-semibold">{error}</p>
              </div>
            )}

            {applied && (
              <div className="mt-3 flex items-center gap-2 text-green-600 animate-fadeIn">
                <Check size={14} />
                <p className="text-xs font-semibold">Kode promo berhasil diterapkan!</p>
              </div>
            )}

            <button
              onClick={handleApply}
              disabled={applied}
              className={`w-full mt-4 rounded-2xl py-4 font-bold transition-all ${
                applied
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-xl hover:shadow-amber-500/30 hover:scale-[1.02]"
              }`}
            >
              {applied ? "Promo Diterapkan" : "Gunakan Kode"}
            </button>
          </div>

          {/* DIVIDER */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs font-semibold text-gray-400">ATAU PILIH PROMO</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* PROMO LIST */}
          <div className="space-y-3">
            {availablePromos.map((promo, index) => (
              <button
                key={index}
                onClick={() => handleSelectPromo(promo.code)}
                className={`w-full bg-gradient-to-br from-white to-amber-50/30 rounded-2xl p-4 border-2 transition-all hover:scale-[1.02] ${
                  promoCode === promo.code
                    ? "border-amber-500 shadow-lg shadow-amber-500/20"
                    : "border-gray-200 hover:border-amber-300"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Sparkles size={24} className="text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-left">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="bg-amber-100 px-3 py-1 rounded-lg">
                        <p className="font-bold text-sm text-amber-700">{promo.code}</p>
                      </div>
                      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 rounded-lg">
                        <p className="font-bold text-sm text-white">{promo.discount}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 font-semibold mb-1">
                      {promo.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      Min. transaksi Rp{promo.minTransaction.toLocaleString("id-ID")}
                    </p>
                  </div>

                  {/* Checkbox */}
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      promoCode === promo.code
                        ? "bg-gradient-to-br from-amber-500 to-orange-500 border-amber-500"
                        : "border-gray-300"
                    }`}
                  >
                    {promoCode === promo.code && <Check size={14} className="text-white" />}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* INFO */}
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Gift size={16} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-blue-900 mb-1">
                  Tips Menggunakan Promo
                </p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Satu akun hanya bisa menggunakan satu kode promo per transaksi</li>
                  <li>• Pastikan memenuhi minimum transaksi</li>
                  <li>• Promo tidak dapat digabungkan dengan promo lainnya</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}