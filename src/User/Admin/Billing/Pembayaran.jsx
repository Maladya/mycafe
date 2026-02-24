import SideBar from "../../Layout/Layouts";
import { useState } from "react";
import {
  Coffee, ChevronRight, CreditCard, CheckCircle2,
  Shield, ArrowRight, XCircle, Receipt, Wallet,
  Building2, QrCode, ArrowLeft, Lock, Info
} from "lucide-react";

const paymentGroups = [
  {
    group: "Virtual Account",
    icon: Building2,
    items: [
      { id: "bni",     name: "BNI Virtual Account",      short: "BNI",     color: "#ef8c00", bg: "#fff8ed" },
      { id: "bri",     name: "BRI Virtual Account",      short: "BRI",     color: "#004b93", bg: "#eff4ff" },
      { id: "bca",     name: "BCA Virtual Account",      short: "BCA",     color: "#006cb5", bg: "#eff7ff" },
      { id: "mandiri", name: "Mandiri Virtual Account",  short: "MANDIRI", color: "#003f7f", bg: "#eff4ff" },
      { id: "permata", name: "PermataBank Virtual Account", short: "PERMATA", color: "#ef3025", bg: "#fff1f1" },
    ],
  },
  {
    group: "Pembayaran Digital",
    icon: QrCode,
    items: [
      { id: "qris", name: "QRIS", short: "QRIS", color: "#e11d48", bg: "#fff1f2" },
    ],
  },
];

const summary = {
  bundling: 0,
  deposit: 200000,
  saldo: 0,
};

export default function Pembayaran() {
  const [method, setMethod] = useState("");

  const total = summary.deposit + summary.bundling;
  const kurang = total - summary.saldo;

  const fmt = (n) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(n);

  // Find selected item
  const selectedItem = paymentGroups
    .flatMap((g) => g.items)
    .find((i) => i.id === method);

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
            <span>Billing</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-blue-600 font-bold">Pembayaran</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8 pb-32">

          {/* ── Page Header ── */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-1">Billing</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-gray-800">Pilih Metode Pembayaran</h3>
              <p className="text-gray-400 text-sm mt-1">Pilih salah satu metode untuk menyelesaikan transaksi</p>
            </div>
            <button
              onClick={() => (window.location.href = "/admin/billing/billing")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 shadow-sm hover:shadow-md hover:text-blue-600 hover:border-blue-300 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </button>
          </div>

          {/* ── Step indicator ── */}
          <div className="flex items-center gap-3 mb-8">
            {[
              { n: 1, label: "Pilih Paket",      done: true  },
              { n: 2, label: "Pilih Pembayaran", done: false },
              { n: 3, label: "Konfirmasi",        done: false },
            ].map((step, i) => (
              <div key={step.n} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={step.done
                      ? { background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", color: "#fff" }
                      : i === 1
                        ? { background: "#eff6ff", color: "#1d4ed8", border: "2px solid #3b82f6" }
                        : { background: "#f1f5f9", color: "#9ca3af" }}
                  >
                    {step.done ? <CheckCircle2 className="w-4 h-4" /> : step.n}
                  </div>
                  <span className="text-xs font-semibold" style={{ color: i === 1 ? "#1d4ed8" : i === 0 ? "#374151" : "#9ca3af" }}>
                    {step.label}
                  </span>
                </div>
                {i < 2 && <ChevronRight className="w-3.5 h-3.5 text-gray-300" />}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── LEFT — Payment Methods ── */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              {paymentGroups.map(({ group, icon: Icon, items }) => (
                <div key={group} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Card header */}
                  <div className="px-8 py-5 flex items-center gap-3" style={{ background: "linear-gradient(90deg,#eff6ff,#f8faff)", borderBottom: "1px solid #e0e7ff" }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="font-bold text-gray-800 text-sm">{group}</p>
                  </div>

                  <div className="p-5 flex flex-col gap-3">
                    {items.map((item) => {
                      const active = method === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setMethod(item.id)}
                          className="w-full flex items-center gap-4 rounded-2xl p-4 text-left transition-all hover:shadow-md"
                          style={active
                            ? { background: "#eff6ff", border: "2px solid #3b82f6", boxShadow: "0 0 0 4px rgba(59,130,246,0.08)" }
                            : { background: "#f9fafb", border: "2px solid #f1f5f9" }}
                        >
                          {/* Logo placeholder / colored badge */}
                          <div
                            className="w-14 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-xs tracking-tight"
                            style={{ background: active ? item.bg : "#f1f5f9", color: active ? item.color : "#9ca3af", border: `1px solid ${active ? item.color + "33" : "transparent"}` }}
                          >
                            {item.short}
                          </div>

                          <div className="flex-1">
                            <p className="text-sm font-bold" style={{ color: active ? "#1d4ed8" : "#374151" }}>
                              {item.name}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: active ? "#3b82f6" : "#9ca3af" }}>
                              {item.id === "qris" ? "Scan & bayar dari semua e-wallet" : "Nomor VA dikirim setelah konfirmasi"}
                            </p>
                          </div>

                          {/* Radio dot */}
                          <div
                            className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                            style={active ? { borderColor: "#3b82f6", background: "#3b82f6" } : { borderColor: "#d1d5db" }}
                          >
                            {active && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Security note */}
              <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                <Lock className="w-4 h-4 text-blue-400 shrink-0" />
                <p className="text-xs text-gray-400">
                  Transaksi Anda dilindungi enkripsi <span className="font-semibold text-gray-500">SSL 256-bit</span>. Data pembayaran tidak disimpan di server kami.
                </p>
              </div>
            </div>

            {/* ── RIGHT — Summary ── */}
            <div className="flex flex-col gap-4">

              {/* Selected method preview */}
              {selectedItem ? (
                <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4" style={{ background: "#eff6ff", borderBottom: "1px solid #e0e7ff" }}>
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Metode Dipilih</p>
                  </div>
                  <div className="px-6 py-4 flex items-center gap-3">
                    <div
                      className="w-12 h-9 rounded-lg flex items-center justify-center font-black text-xs"
                      style={{ background: selectedItem.bg, color: selectedItem.color }}
                    >
                      {selectedItem.short}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{selectedItem.name}</p>
                      <p className="text-xs text-gray-400">
                        {selectedItem.id === "qris" ? "Scan & bayar" : "Virtual Account"}
                      </p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <Info className="w-4 h-4 text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-700 font-medium">Pilih metode pembayaran terlebih dahulu</p>
                </div>
              )}

              {/* Summary card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 flex items-center gap-2" style={{ background: "linear-gradient(90deg,#eff6ff,#f8faff)", borderBottom: "1px solid #e0e7ff" }}>
                  <Receipt className="w-4 h-4 text-blue-400" />
                  <p className="font-bold text-gray-800 text-sm">Ringkasan Pembayaran</p>
                </div>

                <div className="p-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Bundling Inventori</span>
                      <span className="font-semibold text-gray-800">{fmt(summary.bundling)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Deposit Dibutuhkan</span>
                      <span className="font-semibold text-gray-800">{fmt(summary.deposit)}</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 my-4" />

                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-gray-700">Total Deposit</span>
                    <span className="text-gray-800">{fmt(total)}</span>
                  </div>

                  <div className="border-t border-gray-100 my-4" />

                  <div className="space-y-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Saldo Anda</span>
                      <span className="font-semibold text-gray-800">{fmt(summary.saldo)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-gray-700">Saldo Kurang</span>
                      <span className="text-red-500">{fmt(kurang)}</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 mt-4 pt-4">
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: "linear-gradient(135deg,#eff6ff,#f0f9ff)" }}>
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-bold text-blue-600">Total Bayar</span>
                      </div>
                      <span className="text-lg font-extrabold text-blue-700">{fmt(kurang)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shield */}
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200">
                <Shield className="w-4 h-4 text-blue-400 shrink-0" />
                <p className="text-xs text-gray-400">Pembayaran aman & terverifikasi</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sticky Footer ── */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] px-8 py-4 flex items-center justify-between z-30">
          <button
            onClick={() => (window.location.href = "/admin/billing/billing")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-red-500 bg-white border border-red-200 hover:bg-red-50 transition-all"
          >
            <XCircle className="w-4 h-4" />
            Batal
          </button>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Bayar</p>
              <p className="text-xl font-extrabold text-gray-800">{fmt(kurang)}</p>
            </div>
            <button
              disabled={!method}
              className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold text-white shadow-md transition-all"
              style={method
                ? { background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", boxShadow: "0 4px 14px rgba(29,78,216,0.35)" }
                : { background: "#d1d5db", cursor: "not-allowed" }}
            >
              {method ? (
                <>Bayar Sekarang <ArrowRight className="w-4 h-4" /></>
              ) : (
                <>Pilih Metode Dulu <CreditCard className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}