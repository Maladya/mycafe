import SideBar from "../../Layout/Layouts";
import { useState } from "react";
import {
  Coffee, ChevronRight, CreditCard, CheckCircle2, XCircle,
  Zap, Crown, Building2, Gift, Clock, Calendar, Wallet,
  Shield, ArrowRight, Star, TrendingDown, Info, Tag,
  Package, Receipt, BadgeCheck
} from "lucide-react";

const features = {
  gratis: [
    { label: "Kelola Menu & Meja",               ok: true },
    { label: "Metode Pembayaran Tunai & Nontunai", ok: true },
    { label: "QRIS, OVO, Dana, Gopay",             ok: true },
    { label: "Inventori Dasar",                    ok: true },
    { label: "Newsletter & Ide Bisnis",            ok: true },
    { label: "Kelola Promo",                       ok: false },
    { label: "Laporan Penjualan",                  ok: false },
    { label: "Multi Kasir",                        ok: false },
  ],
  reguler: [
    { label: "Kelola Menu & Meja",                ok: true },
    { label: "Metode Pembayaran Tunai & Nontunai",ok: true },
    { label: "QRIS, OVO, Dana, Gopay",            ok: true },
    { label: "Inventori Lengkap",                 ok: true },
    { label: "Newsletter & Ide Bisnis",           ok: true },
    { label: "Kelola Promo",                      ok: true },
    { label: "Laporan Penjualan",                 ok: true },
    { label: "Multi Kasir",                       ok: false },
  ],
};

const regulerPlans = [
  {
    id: "monthly", label: "1 Bulan", badge: null,
    price: "Rp 149.000", priceNum: 149000,
    sub: "per bulan", saving: null,
    validUntil: "12 Mar 2026",
  },
  {
    id: "yearly", label: "1 Tahun", badge: "Hemat 33%",
    price: "Rp 99.000", priceNum: 99000,
    sub: "per bulan · tagih tahunan", saving: "Rp 610.000",
    validUntil: "12 Feb 2027",
    bonus: "+1 Bulan Gratis",
  },
  {
    id: "business", label: "Bisnis", badge: "Terpopuler",
    price: "Rp 199.000", priceNum: 199000,
    sub: "per bulan · multi outlet", saving: null,
    validUntil: "12 Mar 2026",
    bonus: "Multi Kasir Included",
  },
];

export default function Billing() {
  const [activeTab,    setActiveTab]    = useState("gratis");
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [agreed,       setAgreed]       = useState(false);

  const plan = regulerPlans.find(p => p.id === selectedPlan);

  const summaryGratis = { deposit: 200000, saldo: 0 };
  const summaryReguler = {
    harga: plan?.priceNum * (selectedPlan === "yearly" ? 12 : 1) || 0,
    bundle: selectedPlan === "yearly" ? 600000 : 0,
    saldo: 0,
  };
  const totalReguler = summaryReguler.harga + summaryReguler.bundle;

  const fmt = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  const labelClass = "block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SideBar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Top Bar ── */}
        <div className="h-14 bg-white sticky top-0 z-20 flex items-center justify-between px-8 border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 font-black text-lg tracking-tight text-blue-700">
            <Coffee className="w-5 h-5 text-blue-600" />
            <span>MyCafe</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span>Admin</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-blue-600 font-bold">Billing</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8 pb-32">

          {/* ── Page Header ── */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-1">Langganan</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-gray-800">Pilih Paket Langganan</h3>
              <p className="text-gray-400 text-sm mt-1">Pilih paket yang sesuai kebutuhan kafe Anda</p>
            </div>
            {/* Current plan badge */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50">
              <BadgeCheck className="w-4 h-4 text-emerald-500" />
              <div>
                <p className="text-xs text-emerald-600 font-medium">Paket Saat Ini</p>
                <p className="text-sm font-extrabold text-emerald-700">Gratis</p>
              </div>
            </div>
          </div>

          {/* ── Tab Toggle ── */}
          <div className="inline-flex bg-white border border-gray-200 rounded-2xl p-1.5 gap-1.5 mb-8 shadow-sm">
            {[
              { id: "gratis",  label: "Gratis",  icon: Zap },
              { id: "reguler", label: "Reguler", icon: Crown },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={activeTab === id
                  ? { background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", color: "#fff", boxShadow: "0 2px 8px rgba(29,78,216,0.3)" }
                  : { color: "#6b7280" }}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* ══════════ GRATIS ══════════ */}
          {activeTab === "gratis" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* LEFT */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                {/* Hero card */}
                <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: "linear-gradient(135deg,#1d4ed8,#1e40af,#1d4ed8)" }}>
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 mb-3">
                          <Zap className="w-3.5 h-3.5 text-white" />
                          <span className="text-xs font-bold text-white">Paket Gratis</span>
                        </div>
                        <h2 className="text-2xl font-extrabold text-white">Tanpa Biaya Bulanan!</h2>
                        <p className="text-blue-200 text-sm mt-1">Transaksi tanpa ribet dengan berbagai metode pembayaran</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-black text-white">Rp 0</p>
                        <p className="text-blue-200 text-xs">per bulan</p>
                      </div>
                    </div>

                    <button className="flex items-center justify-center gap-2 w-full max-w-sm bg-white text-blue-700 font-bold text-sm px-6 py-3 rounded-xl hover:bg-blue-50 transition-all shadow-md">
                      <Wallet className="w-4 h-4" />
                      Aktifkan dengan Deposit Rp 200.000
                    </button>

                    <p className="text-xs text-blue-200 mt-3 opacity-80">
                      * Rp 500 / transaksi dari pelanggan ·{" "}
                      <span className="underline cursor-pointer hover:text-white transition-colors">Pelajari selengkapnya</span>
                    </p>
                  </div>

                  {/* Bottom banner */}
                  <div className="px-8 py-4 flex items-center gap-3" style={{ background: "rgba(0,0,0,0.25)" }}>
                    <Gift className="w-4 h-4 text-blue-200 shrink-0" />
                    <p className="text-xs text-blue-100 font-medium">Gratis Standee & isi ulang kertas tanpa printer untuk setiap akun baru</p>
                  </div>
                </div>

                {/* Feature card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-8 py-5 flex items-center gap-3" style={{ background: "linear-gradient(90deg,#eff6ff,#f8faff)", borderBottom: "1px solid #e0e7ff" }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <p className="font-bold text-gray-800 text-sm">Fitur yang Tersedia</p>
                  </div>
                  <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {features.gratis.map((f) => (
                      <div key={f.label} className="flex items-center gap-2.5">
                        {f.ok
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          : <XCircle className="w-4 h-4 text-gray-300 shrink-0" />}
                        <span className="text-sm" style={{ color: f.ok ? "#374151" : "#9ca3af" }}>{f.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT — Summary */}
              <div className="flex flex-col gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-5" style={{ background: "linear-gradient(90deg,#eff6ff,#f8faff)", borderBottom: "1px solid #e0e7ff" }}>
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-blue-400" />
                      <p className="font-bold text-gray-800 text-sm">Ringkasan</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="mb-4">
                      <p className={labelClass}>Paket Langganan</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Zap className="w-4 h-4 text-blue-400" />
                        <p className="font-bold text-gray-800">Gratis</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">Selamanya</p>
                    </div>

                    <div className="border-t border-gray-100 my-4" />

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Deposit Dibutuhkan</span>
                        <span className="font-semibold text-gray-800">{fmt(summaryGratis.deposit)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Saldo Anda</span>
                        <span className="font-semibold text-gray-800">{fmt(summaryGratis.saldo)}</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 my-4" />

                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-gray-700">Saldo Kurang</span>
                      <span className="text-red-500">{fmt(summaryGratis.deposit - summaryGratis.saldo)}</span>
                    </div>

                    <div className="border-t border-gray-100 my-4" />

                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <button
                        onClick={() => setAgreed(!agreed)}
                        className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all"
                        style={agreed ? { background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", borderColor: "#1d4ed8" } : { borderColor: "#d1d5db" }}
                      >
                        {agreed && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </button>
                      <span className="text-xs text-gray-500">
                        Saya telah menyetujui{" "}
                        <span className="text-blue-500 underline cursor-pointer">Syarat & Ketentuan</span>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Info tip */}
                <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-amber-50 border border-amber-200">
                  <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">Deposit akan tersimpan sebagai saldo untuk menutupi biaya transaksi.</p>
                </div>
              </div>
            </div>
          )}

          {/* ══════════ REGULER ══════════ */}
          {activeTab === "reguler" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* LEFT */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                {/* Plan cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {regulerPlans.map((p) => {
                    const active = selectedPlan === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPlan(p.id)}
                        className="relative text-left p-5 rounded-2xl border-2 transition-all hover:shadow-md"
                        style={active
                          ? { background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", borderColor: "transparent", boxShadow: "0 4px 20px rgba(29,78,216,0.35)" }
                          : { background: "#fff", borderColor: "#e5e7eb" }}
                      >
                        {p.badge && (
                          <span className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: active ? "#fff3" : "linear-gradient(135deg,#1d4ed8,#3b82f6)", color: active ? "#fff" : "#fff" }}>
                            {p.badge}
                          </span>
                        )}
                        <p className="text-xs font-semibold mb-1" style={{ color: active ? "rgba(255,255,255,0.7)" : "#9ca3af" }}>{p.label}</p>
                        <p className="text-xl font-extrabold" style={{ color: active ? "#fff" : "#1f2937" }}>{p.price}</p>
                        <p className="text-xs mt-0.5" style={{ color: active ? "rgba(255,255,255,0.6)" : "#9ca3af" }}>{p.sub}</p>
                        {p.bonus && (
                          <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: active ? "rgba(255,255,255,0.2)" : "#eff6ff" }}>
                            <Star className="w-3 h-3" style={{ color: active ? "#fff" : "#3b82f6" }} />
                            <span className="text-xs font-bold" style={{ color: active ? "#fff" : "#1d4ed8" }}>{p.bonus}</span>
                          </div>
                        )}
                        {p.saving && (
                          <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: active ? "rgba(255,255,255,0.2)" : "#f0fdf4" }}>
                            <TrendingDown className="w-3 h-3" style={{ color: active ? "#fff" : "#16a34a" }} />
                            <span className="text-xs font-bold" style={{ color: active ? "#fff" : "#16a34a" }}>Hemat {p.saving}</span>
                          </div>
                        )}
                        {active && (
                          <div className="absolute top-3 right-3">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selected plan details */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-8 py-5 flex items-center gap-3" style={{ background: "linear-gradient(90deg,#eff6ff,#f8faff)", borderBottom: "1px solid #e0e7ff" }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <p className="font-bold text-gray-800 text-sm">Detail Paket — {plan?.label}</p>
                    <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-100">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-xs font-bold text-blue-600">Berlaku s/d {plan?.validUntil}</span>
                    </div>
                  </div>
                  <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {features.reguler.map((f) => (
                      <div key={f.label} className="flex items-center gap-2.5">
                        {f.ok
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          : <XCircle className="w-4 h-4 text-gray-300 shrink-0" />}
                        <span className="text-sm" style={{ color: f.ok ? "#374151" : "#9ca3af" }}>{f.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT — Summary */}
              <div className="flex flex-col gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-5" style={{ background: "linear-gradient(90deg,#eff6ff,#f8faff)", borderBottom: "1px solid #e0e7ff" }}>
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-blue-400" />
                      <p className="font-bold text-gray-800 text-sm">Ringkasan Tagihan</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="mb-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Paket</span>
                        <span className="font-bold text-gray-800">{plan?.label}</span>
                      </div>
                      {selectedPlan === "yearly" && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Bonus Periode</span>
                          <span className="font-bold text-emerald-600">+1 Bulan Gratis</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Berlaku Hingga</span>
                        <span className="font-semibold text-gray-800">{plan?.validUntil}</span>
                      </div>
                    </div>

                    {selectedPlan === "yearly" && (
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 mb-4">
                        <TrendingDown className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-xs font-bold text-emerald-600">Anda hemat {plan?.saving} dibanding bulanan!</span>
                      </div>
                    )}

                    <div className="border-t border-gray-100 my-4" />
                    <p className={labelClass}>Rincian Biaya</p>

                    <div className="space-y-2.5 mt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Harga Langganan</span>
                        <span className="font-semibold text-gray-800">{fmt(summaryReguler.harga)}</span>
                      </div>
                      {summaryReguler.bundle > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Bundling Inventori</span>
                          <span className="font-semibold text-emerald-600">+{fmt(summaryReguler.bundle)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-100">
                        <span className="text-gray-700">Total Harga</span>
                        <span className="text-gray-800">{fmt(totalReguler)}</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 my-4" />

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Saldo Anda</span>
                        <span className="font-semibold text-gray-800">{fmt(summaryReguler.saldo)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-gray-700">Saldo Kurang</span>
                        <span className="text-red-500">{fmt(totalReguler - summaryReguler.saldo)}</span>
                      </div>
                    </div>

                    <div className="mt-4 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200">
                      <p className="text-xs text-gray-400">Saldo Anda akan tertahan sementara selama proses verifikasi pembayaran.</p>
                    </div>

                    <div className="border-t border-gray-100 my-4" />

                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <button
                        onClick={() => setAgreed(!agreed)}
                        className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all"
                        style={agreed ? { background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", borderColor: "#1d4ed8" } : { borderColor: "#d1d5db" }}
                      >
                        {agreed && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </button>
                      <span className="text-xs text-gray-500">
                        Saya telah menyetujui{" "}
                        <span className="text-blue-500 underline cursor-pointer">Syarat & Ketentuan</span>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Security badge */}
                <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200">
                  <Shield className="w-4 h-4 text-blue-400 shrink-0" />
                  <p className="text-xs text-gray-500">Pembayaran Anda dilindungi dengan enkripsi SSL 256-bit</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Sticky Footer Bar ── */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] px-8 py-4 flex items-center justify-between z-30">
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-red-500 bg-white border border-red-200 hover:bg-red-50 transition-all">
            <XCircle className="w-4 h-4" />
            Batal
          </button>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Tagihan</p>
              <p className="text-xl font-extrabold text-gray-800">
                {activeTab === "gratis" ? fmt(200000) : fmt(totalReguler)}
              </p>
            </div>
            <button
              onClick={() => (window.location.href = "/admin/billing/pembayaran")}
              className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg transition-all"
              style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}
            >
              Proses Pembayaran
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
