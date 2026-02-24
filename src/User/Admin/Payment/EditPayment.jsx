import SideBar from "../../Layout/Layouts";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import {
  Coffee, ChevronRight, PencilLine, CreditCard, Wallet, Building2,
  Tag, CheckCircle2, ArrowLeft, Save, RotateCcw, Hash,
  ShieldCheck, AlertCircle, Clock, QrCode
} from "lucide-react";

const TIPE_OPTIONS = [
  { value: "Transfer Bank", icon: Building2, color: "#1d4ed8", bg: "#eff6ff" },
  { value: "E-Wallet",      icon: Wallet,    color: "#059669", bg: "#ecfdf5" },
  { value: "Kartu Kredit",  icon: CreditCard,color: "#7c3aed", bg: "#f5f3ff" },
  { value: "QRIS",          icon: QrCode,    color: "#e11d48", bg: "#fff1f2" },
];

const STATUS_OPTIONS = [
  { value: "Berhasil", icon: CheckCircle2, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  { value: "Pending",  icon: Clock,        color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  { value: "Gagal",    icon: AlertCircle,  color: "#dc2626", bg: "#fff1f2", border: "#fecaca" },
];

// Simulasi data (ganti dengan fetch dari API/state global)
const paymentData = {
  1: { idTransaksi: "TRX001", tipe: "Transfer Bank", status: "Berhasil", aktif: true  },
  2: { idTransaksi: "TRX002", tipe: "E-Wallet",      status: "Pending",  aktif: true  },
  3: { idTransaksi: "TRX003", tipe: "Kartu Kredit",  status: "Gagal",    aktif: false },
  4: { idTransaksi: "TRX004", tipe: "Transfer Bank", status: "Berhasil", aktif: true  },
};

export default function EditPayment() {
  const navigate  = useNavigate();
  const { id }    = useParams();
  const existing  = paymentData[id] || paymentData[1];

  const [form, setForm] = useState({ ...existing });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => setForm({ ...existing });

  const selectedTipe   = TIPE_OPTIONS.find((t) => t.value === form.tipe);
  const selectedStatus = STATUS_OPTIONS.find((s) => s.value === form.status);

  const inputClass = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all placeholder-gray-300";
  const labelClass = "block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5";

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
            <span>Manage Payment</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-blue-600 font-bold">Edit Payment</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">

          {/* ── Page Header ── */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-1">Manage Payment</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-gray-800">Edit Payment</h3>
              <p className="text-gray-400 text-sm mt-1">
                Ubah data payment <span className="font-semibold text-gray-600">{form.idTransaksi}</span>
              </p>
            </div>
            <button
              onClick={() => navigate("/admin/payment/payment")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 shadow-sm hover:shadow-md hover:text-blue-600 hover:border-blue-300 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </button>
          </div>

          {/* ── Form Card ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Card Header */}
            <div className="px-8 py-5 flex items-center gap-3" style={{ background: "linear-gradient(90deg,#eff6ff,#f8faff)", borderBottom: "1px solid #e0e7ff" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
                <PencilLine className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">Edit Data Payment</p>
                <p className="text-xs text-gray-400">Perubahan akan diterapkan setelah disimpan</p>
              </div>
              {/* ID badge di pojok kanan */}
              <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-xl border border-blue-200" style={{ background: "#eff6ff" }}>
                <Hash className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs font-bold text-blue-700">{form.idTransaksi}</span>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* ── LEFT COLUMN ── */}
                <div className="flex flex-col gap-5">

                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Tag className="w-4 h-4 text-blue-400" />
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Identitas Transaksi</p>
                  </div>

                  {/* ID Transaksi */}
                  <div>
                    <label className={labelClass}>ID Transaksi <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#eff6ff" }}>
                        <Hash className="w-4 h-4 text-blue-500" />
                      </div>
                      <input
                        type="text"
                        name="idTransaksi"
                        value={form.idTransaksi}
                        onChange={handleChange}
                        placeholder="Contoh: TRX005"
                        className="w-full pl-14 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all placeholder-gray-300"
                      />
                    </div>
                  </div>

                  {/* Tipe Pembayaran */}
                  <div>
                    <label className={labelClass}>Tipe Pembayaran <span className="text-red-400">*</span></label>
                    <div className="grid grid-cols-2 gap-3">
                      {TIPE_OPTIONS.map((t) => {
                        const Icon = t.icon;
                        const active = form.tipe === t.value;
                        return (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => setForm((p) => ({ ...p, tipe: t.value }))}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all"
                            style={active
                              ? { borderColor: t.color, background: t.bg }
                              : { borderColor: "#e5e7eb", background: "#f9fafb" }}
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: active ? t.bg : "#f3f4f6", border: active ? `1px solid ${t.color}33` : "none" }}>
                              <Icon className="w-4 h-4" style={{ color: active ? t.color : "#9ca3af" }} />
                            </div>
                            <span className="text-xs font-semibold leading-tight" style={{ color: active ? t.color : "#6b7280" }}>
                              {t.value}
                            </span>
                            {active && <CheckCircle2 className="w-4 h-4 ml-auto shrink-0" style={{ color: t.color }} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ketersediaan toggle */}
                  <div>
                    <label className={labelClass}>Ketersediaan</label>
                    <div
                      className="flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all"
                      style={form.aktif
                        ? { background: "#f8faff", borderColor: "#e0e7ff" }
                        : { background: "#f9fafb", borderColor: "#f1f5f9" }}
                    >
                      <div>
                        <p className="text-sm font-bold text-gray-700">Aktifkan Metode Ini</p>
                        <p className="text-xs text-gray-400 mt-0.5">Tampilkan di halaman checkout pelanggan</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, aktif: !p.aktif }))}
                        className="relative w-11 h-6 rounded-full transition-all shrink-0"
                        style={{ background: form.aktif ? "linear-gradient(135deg,#1d4ed8,#3b82f6)" : "#d1d5db" }}
                      >
                        <div
                          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all"
                          style={{ left: form.aktif ? "calc(100% - 22px)" : "2px" }}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── RIGHT COLUMN ── */}
                <div className="flex flex-col gap-5">

                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Status Transaksi</p>
                  </div>

                  {/* Status Pembayaran */}
                  <div>
                    <label className={labelClass}>Status Pembayaran <span className="text-red-400">*</span></label>
                    <div className="flex flex-col gap-3">
                      {STATUS_OPTIONS.map((s) => {
                        const Icon = s.icon;
                        const active = form.status === s.value;
                        return (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => setForm((p) => ({ ...p, status: s.value }))}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left"
                            style={active
                              ? { borderColor: s.color, background: s.bg }
                              : { borderColor: "#e5e7eb", background: "#f9fafb" }}
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: active ? s.bg : "#f3f4f6", border: active ? `1px solid ${s.color}33` : "none" }}>
                              <Icon className="w-4 h-4" style={{ color: active ? s.color : "#9ca3af" }} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold" style={{ color: active ? s.color : "#374151" }}>{s.value}</p>
                              <p className="text-xs mt-0.5" style={{ color: active ? s.color + "99" : "#9ca3af" }}>
                                {s.value === "Berhasil" ? "Transaksi telah selesai & terverifikasi"
                                  : s.value === "Pending" ? "Menunggu konfirmasi pembayaran"
                                  : "Transaksi dibatalkan atau gagal"}
                              </p>
                            </div>
                            {active && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold shrink-0"
                                style={{ background: s.color + "20", color: s.color }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                                Aktif
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Preview Card — selalu tampil karena data sudah ada */}
                  <div className="rounded-xl p-4 border border-blue-100" style={{ background: "#eff6ff" }}>
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-3">Preview Perubahan</p>
                    <div className="flex items-center gap-3">
                      {selectedTipe ? (
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: selectedTipe.bg }}>
                          <selectedTipe.icon className="w-5 h-5" style={{ color: selectedTipe.color }} />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100">
                          <CreditCard className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 text-sm">{form.idTransaksi || "—"}</p>
                        <p className="text-xs text-gray-400">{form.tipe || "Tipe belum dipilih"}</p>
                      </div>
                      {selectedStatus && (
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: selectedStatus.bg, color: selectedStatus.color, border: `1px solid ${selectedStatus.border}` }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: selectedStatus.color }} />
                          {form.status}
                        </span>
                      )}
                    </div>
                    <div className="mt-3">
                      <span className="text-xs font-semibold" style={{ color: form.aktif ? "#16a34a" : "#9ca3af" }}>
                        {form.aktif ? "✓ Aktif" : "✗ Nonaktif"}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Divider */}
              <div className="my-8 border-t border-gray-100" />

              {/* Actions */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => navigate("/admin/payment/payment")}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 shadow-sm hover:shadow-md hover:text-blue-600 hover:border-blue-300 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-red-500 bg-white border border-red-200 shadow-sm hover:bg-red-50 hover:shadow-md transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all"
                    style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}
                  >
                    <Save className="w-4 h-4" />
                    Simpan Perubahan
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}