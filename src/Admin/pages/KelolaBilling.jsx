import { useState } from "react";
import { Check, Zap, Shield, Crown, ChevronRight, CreditCard, Calendar, AlertCircle, ArrowRight } from "lucide-react";

// ─── DATA PAKET ───────────────────────────────────────────────────────────────
const plans = [
  {
    id: "starter",
    name: "Starter",
    icon: <Zap size={18} />,
    desc: "Cocok untuk kafe kecil yang baru mulai digital.",
    priceMonthly: 49000,
    priceYearly:  39000,
    color: "gray",
    accent: "#6b7280",
    features: [
      "1 outlet / lokasi",
      "Hingga 30 item menu",
      "Maksimal 5 meja",
      "Laporan harian",
      "Support via email",
    ],
    disabled: ["Multi-outlet", "Promo & kode diskon", "Ekspor laporan Excel", "Priority support"],
  },
  {
    id: "pro",
    name: "Pro",
    icon: <Shield size={18} />,
    desc: "Paling populer. Semua yang kamu butuhkan untuk berkembang.",
    priceMonthly: 129000,
    priceYearly:  99000,
    color: "amber",
    accent: "#f59e0b",
    popular: true,
    features: [
      "1 outlet / lokasi",
      "Menu tidak terbatas",
      "Meja tidak terbatas",
      "Promo & kode diskon",
      "Laporan harian & mingguan",
      "Ekspor laporan Excel",
      "Support via WhatsApp",
    ],
    disabled: ["Multi-outlet", "Priority support"],
  },
  {
    id: "business",
    name: "Business",
    icon: <Crown size={18} />,
    desc: "Untuk chain kafe atau bisnis F&B skala besar.",
    priceMonthly: 299000,
    priceYearly:  229000,
    color: "orange",
    accent: "#f97316",
    features: [
      "Hingga 5 outlet / lokasi",
      "Menu tidak terbatas",
      "Meja tidak terbatas",
      "Promo & kode diskon",
      "Laporan lengkap semua outlet",
      "Ekspor laporan Excel & PDF",
      "Multi-user admin",
      "Priority support 24/7",
    ],
    disabled: [],
  },
];

const currentPlan = {
  id: "pro",
  billing: "monthly",
  nextBilling: "24 Maret 2025",
  amount: 129000,
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (n) => `Rp${n.toLocaleString("id-ID")}`;

// ─── KOMPONEN ─────────────────────────────────────────────────────────────────
export default function Billing() {
  const [billing, setBilling] = useState("monthly"); // "monthly" | "yearly"
  const [selected, setSelected] = useState(currentPlan.id);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);

  const handleChoose = (planId) => {
    if (planId === currentPlan.id) return;
    setPendingPlan(planId);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setSelected(pendingPlan);
    setShowConfirm(false);
    setPendingPlan(null);
  };

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gray-50 font-sans">

      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Langganan</h1>
        <p className="text-gray-400 text-sm mt-1">Kelola paket dan pembayaran ASTAKIRA kamu.</p>
      </div>

      {/* ── Status Langganan Aktif ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield size={20} className="text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-gray-900 text-sm">Paket Pro</p>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">AKTIF</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
              <Calendar size={11} />
              Penagihan berikutnya: <span className="font-semibold text-gray-600">{currentPlan.nextBilling}</span>
              &nbsp;·&nbsp;
              <CreditCard size={11} />
              {fmt(currentPlan.amount)} / bulan
            </p>
          </div>
        </div>
        <button className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-800 border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-gray-50 transition-all flex-shrink-0">
          <CreditCard size={14} /> Kelola Pembayaran
        </button>
      </div>

      {/* ── Toggle Billing ── */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-gray-900">Pilih Paket</h2>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {["monthly", "yearly"].map((b) => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                billing === b ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {b === "monthly" ? "Bulanan" : "Tahunan"}
              {b === "yearly" && (
                <span className="ml-1.5 text-[9px] font-bold bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full">
                  Hemat 23%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Kartu Paket ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {plans.map((plan) => {
          const price   = billing === "monthly" ? plan.priceMonthly : plan.priceYearly;
          const isActive = currentPlan.id === plan.id;
          const isSel    = selected === plan.id;

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border-2 p-6 transition-all flex flex-col ${
                plan.popular
                  ? "border-amber-400 shadow-lg shadow-amber-100"
                  : isSel
                  ? "border-gray-300"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              {/* Badge populer */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full tracking-wide shadow">
                    PALING POPULER
                  </span>
                </div>
              )}

              {/* Icon + Nama */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${plan.accent}15`, color: plan.accent }}
                >
                  {plan.icon}
                </div>
                <div>
                  <p className="font-black text-gray-900 text-sm">{plan.name}</p>
                  <p className="text-[10px] text-gray-400 leading-snug">{plan.desc}</p>
                </div>
              </div>

              {/* Harga */}
              <div className="mb-5">
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-black text-gray-900">{fmt(price)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  per bulan{billing === "yearly" && ", ditagih tahunan"}
                </p>
                {billing === "yearly" && (
                  <p className="text-[10px] text-green-600 font-semibold mt-1">
                    Hemat {fmt((plan.priceMonthly - plan.priceYearly) * 12)} / tahun
                  </p>
                )}
              </div>

              {/* Fitur */}
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                    <Check size={13} className="flex-shrink-0 mt-0.5" style={{ color: plan.accent }} />
                    {f}
                  </li>
                ))}
                {plan.disabled.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-300 line-through">
                    <Check size={13} className="flex-shrink-0 mt-0.5 text-gray-200" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Tombol */}
              {isActive ? (
                <div className="w-full py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-center text-xs font-bold text-gray-400">
                  Paket Saat Ini
                </div>
              ) : (
                <button
                  onClick={() => handleChoose(plan.id)}
                  className="w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  style={{
                    background: plan.popular ? plan.accent : "transparent",
                    color: plan.popular ? "#fff" : plan.accent,
                    border: `2px solid ${plan.accent}`,
                  }}
                >
                  Pilih {plan.name} <ChevronRight size={13} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Riwayat Tagihan ── */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-sm">Riwayat Tagihan</h2>
          <button className="text-xs text-amber-600 font-semibold hover:underline flex items-center gap-1">
            Lihat Semua <ArrowRight size={12} />
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { date: "24 Feb 2025", desc: "Paket Pro — Bulanan", amount: 129000, status: "Lunas" },
            { date: "24 Jan 2025", desc: "Paket Pro — Bulanan", amount: 129000, status: "Lunas" },
            { date: "24 Des 2024", desc: "Paket Pro — Bulanan", amount: 129000, status: "Lunas" },
          ].map((inv, i) => (
            <div key={i} className="px-6 py-3.5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">{inv.desc}</p>
                <p className="text-xs text-gray-400 mt-0.5">{inv.date}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-gray-900">{fmt(inv.amount)}</span>
                <span className="text-[10px] font-bold bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded-full">
                  {inv.status}
                </span>
                <button className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-all">
                  Unduh
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Catatan ── */}
      <div className="mt-5 flex items-start gap-2 text-xs text-gray-400">
        <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
        <p>Pembatalan atau downgrade berlaku di akhir periode penagihan. Upgrade berlaku langsung dengan perhitungan prorata.</p>
      </div>

      {/* ── Modal Konfirmasi ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6">
            <h3 className="font-black text-gray-900 text-lg mb-1">Ganti Paket?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Kamu akan beralih ke paket{" "}
              <span className="font-bold text-gray-800">
                {plans.find((p) => p.id === pendingPlan)?.name}
              </span>
              . Perubahan berlaku di periode berikutnya.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 border-2 border-gray-200 text-gray-700 rounded-xl py-3 font-semibold text-sm hover:bg-gray-50 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 bg-amber-500 text-white rounded-xl py-3 font-bold text-sm hover:bg-amber-600 transition-all shadow-lg"
              >
                Ya, Ganti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
