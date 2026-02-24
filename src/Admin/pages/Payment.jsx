import { useState, useRef } from "react";
import {
  QrCode, CreditCard, Banknote, Wallet, Upload, Check,
  ToggleLeft, ToggleRight, AlertCircle, Save, Eye, EyeOff,
  Smartphone, RefreshCw, Copy, CheckCheck, Info
} from "lucide-react";
import { useAdmin } from "../AdminPanel";

// ─── DATA AWAL ────────────────────────────────────────────────────────────────
const initialMethods = [
  {
    id: "cash",
    label: "Tunai",
    desc: "Pembayaran langsung dengan uang tunai.",
    icon: "cash",
    enabled: true,
    configurable: false,
  },
  {
    id: "qris",
    label: "QRIS",
    desc: "Scan QR untuk bayar via GoPay, OVO, Dana, ShopeePay, dll.",
    icon: "qris",
    enabled: true,
    configurable: true,
  },
  {
    id: "transfer",
    label: "Transfer Bank",
    desc: "Transfer ke rekening BCA, Mandiri, BNI, atau BRI.",
    icon: "transfer",
    enabled: false,
    configurable: true,
  },
  {
    id: "ewallet",
    label: "E-Wallet Manual",
    desc: "Tampilkan nomor GoPay / OVO / Dana untuk transfer manual.",
    icon: "ewallet",
    enabled: false,
    configurable: true,
  },
];

const initialQris = {
  merchantName: "ASTAKIRA Cafe",
  merchantId: "",
  nmid: "",
  qrImage: null, // base64
  feeType: "none",    // "none" | "percent" | "flat"
  feeValue: "",
};

const initialTransfer = {
  accounts: [
    { id: 1, bank: "BCA",    noRek: "", atasNama: "" },
    { id: 2, bank: "Mandiri",noRek: "", atasNama: "" },
  ],
};

const initialEwallet = {
  gopay: "",
  ovo:   "",
  dana:  "",
  shopee:"",
};

// ─── ICON MAP ─────────────────────────────────────────────────────────────────
function PayIcon({ type, size = 20 }) {
  if (type === "qris")     return <QrCode size={size} />;
  if (type === "transfer") return <CreditCard size={size} />;
  if (type === "ewallet")  return <Smartphone size={size} />;
  return <Banknote size={size} />;
}

const iconBg = {
  cash:     "bg-green-50 text-green-600 border-green-200",
  qris:     "bg-blue-50 text-blue-600 border-blue-200",
  transfer: "bg-purple-50 text-purple-600 border-purple-200",
  ewallet:  "bg-pink-50 text-pink-600 border-pink-200",
};

// ─── KOMPONEN UTAMA ───────────────────────────────────────────────────────────
export default function Payment() {
  const { showToast } = useAdmin();

  const [methods,  setMethods]  = useState(initialMethods);
  const [qris,     setQris]     = useState(initialQris);
  const [transfer, setTransfer] = useState(initialTransfer);
  const [ewallet,  setEwallet]  = useState(initialEwallet);
  const [activeTab, setActiveTab] = useState("qris");
  const [copied,   setCopied]   = useState(false);
  const [preview,  setPreview]  = useState(false);

  const fileRef = useRef();

  // toggle metode aktif/nonaktif
  const toggleMethod = (id) => {
    setMethods(prev => prev.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
  };

  // upload gambar QR
  const handleQrUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast("Ukuran file maksimal 2MB", "error"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setQris(p => ({ ...p, qrImage: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const copyNmid = () => {
    if (!qris.nmid) return;
    navigator.clipboard.writeText(qris.nmid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    showToast("Pengaturan pembayaran disimpan!", "success");
  };

  const activeMethodIds = methods.filter(m => m.enabled).map(m => m.id);

  return (
    <div className="p-4 lg:p-8 space-y-6 min-h-full bg-gray-50">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Pembayaran</h1>
        <p className="text-gray-400 text-sm mt-1">Atur metode pembayaran yang tersedia di kasir.</p>
      </div>

      {/* ── Toggle Metode ── */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-sm">Metode Aktif</h2>
          <p className="text-xs text-gray-400 mt-0.5">Aktifkan metode yang ingin ditampilkan ke kasir.</p>
        </div>
        <div className="divide-y divide-gray-50">
          {methods.map((m) => (
            <div key={m.id} className="flex items-center gap-4 px-5 py-4">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${iconBg[m.icon]}`}>
                <PayIcon type={m.icon} size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{m.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{m.desc}</p>
              </div>
              {/* Toggle */}
              <button
                onClick={() => toggleMethod(m.id)}
                className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${m.enabled ? "bg-amber-500" : "bg-gray-200"}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${m.enabled ? "left-[22px]" : "left-0.5"}`} />
              </button>
              {/* Shortcut ke konfigurasi */}
              {m.configurable && m.enabled && (
                <button
                  onClick={() => setActiveTab(m.id)}
                  className="text-xs text-amber-600 font-semibold hover:underline flex-shrink-0"
                >
                  Atur →
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Konfigurasi Detail ── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {/* Tab */}
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {methods.filter(m => m.configurable).map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveTab(m.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold whitespace-nowrap transition-all border-b-2 ${
                activeTab === m.id
                  ? "border-amber-500 text-amber-600 bg-amber-50/50"
                  : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
            >
              <PayIcon type={m.icon} size={14} />
              {m.label}
              {!m.enabled && (
                <span className="text-[9px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full font-bold">nonaktif</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5 lg:p-6">

          {/* ── QRIS ── */}
          {activeTab === "qris" && (
            <div className="space-y-6">
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  Upload gambar QR code QRIS dari bank atau penyedia pembayaranmu. Gambar ini akan ditampilkan ke pelanggan saat checkout.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Kiri: Upload QR */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">
                      Gambar QR Code
                    </label>
                    {/* Drop zone */}
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-all group min-h-[180px]"
                    >
                      {qris.qrImage ? (
                        <div className="relative">
                          <img
                            src={qris.qrImage}
                            alt="QR Code"
                            className="w-36 h-36 object-contain rounded-xl border border-gray-200"
                          />
                          <button
                            onClick={(e) => { e.stopPropagation(); setQris(p => ({ ...p, qrImage: null })); }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow hover:bg-red-600 transition-all"
                          >✕</button>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-gray-100 group-hover:bg-amber-100 rounded-2xl flex items-center justify-center mb-3 transition-all">
                            <Upload size={20} className="text-gray-400 group-hover:text-amber-500 transition-all" />
                          </div>
                          <p className="text-sm font-semibold text-gray-600">Klik untuk upload QR</p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG · Maks 2MB</p>
                        </>
                      )}
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleQrUpload} />
                  </div>

                  {/* Preview toggle */}
                  {qris.qrImage && (
                    <button
                      onClick={() => setPreview(true)}
                      className="flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-all"
                    >
                      <Eye size={13} /> Lihat tampilan pelanggan
                    </button>
                  )}
                </div>

                {/* Kanan: Info Merchant */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Nama Merchant</label>
                    <input
                      value={qris.merchantName}
                      onChange={e => setQris(p => ({ ...p, merchantName: e.target.value }))}
                      placeholder="ASTAKIRA Cafe"
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">NMID (Nomor Merchant)</label>
                    <div className="relative">
                      <input
                        value={qris.nmid}
                        onChange={e => setQris(p => ({ ...p, nmid: e.target.value }))}
                        placeholder="ID101234567890123"
                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm outline-none focus:border-amber-500 transition-all font-mono"
                      />
                      <button onClick={copyNmid} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-500 transition-all">
                        {copied ? <CheckCheck size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Opsional. Tertera di sertifikat QRIS dari Bank Indonesia.</p>
                  </div>

                  {/* Biaya Transaksi */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Biaya Transaksi QRIS</label>
                    <div className="flex gap-2 mb-3">
                      {[
                        { val: "none",    label: "Tidak ada" },
                        { val: "percent", label: "Persen (%)" },
                        { val: "flat",    label: "Nominal (Rp)" },
                      ].map(opt => (
                        <button
                          key={opt.val}
                          onClick={() => setQris(p => ({ ...p, feeType: opt.val, feeValue: "" }))}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                            qris.feeType === opt.val
                              ? "border-amber-500 bg-amber-50 text-amber-700"
                              : "border-gray-200 text-gray-500 hover:border-gray-300"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {qris.feeType !== "none" && (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">
                          {qris.feeType === "percent" ? "%" : "Rp"}
                        </span>
                        <input
                          type="number"
                          value={qris.feeValue}
                          onChange={e => setQris(p => ({ ...p, feeValue: e.target.value }))}
                          placeholder={qris.feeType === "percent" ? "0.7" : "500"}
                          className="w-full border-2 border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all"
                        />
                      </div>
                    )}
                    {qris.feeType !== "none" && (
                      <p className="text-[10px] text-amber-600 mt-1.5 flex items-center gap-1">
                        <AlertCircle size={10} />
                        Biaya ini akan ditambahkan ke total tagihan pelanggan.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TRANSFER BANK ── */}
          {activeTab === "transfer" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-purple-50 border border-purple-200 rounded-xl p-4">
                <Info size={16} className="text-purple-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-purple-700 leading-relaxed">
                  Tambahkan rekening tujuan transfer. Pelanggan akan melihat info rekening ini saat memilih metode transfer.
                </p>
              </div>

              {transfer.accounts.map((acc, idx) => (
                <div key={acc.id} className="border border-gray-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Rekening {idx + 1}</p>
                    <button
                      onClick={() => setTransfer(p => ({ ...p, accounts: p.accounts.filter(a => a.id !== acc.id) }))}
                      className="text-[10px] text-red-400 hover:text-red-600 font-semibold"
                    >Hapus</button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Bank</label>
                      <select
                        value={acc.bank}
                        onChange={e => setTransfer(p => ({ ...p, accounts: p.accounts.map(a => a.id === acc.id ? { ...a, bank: e.target.value } : a) }))}
                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all bg-white"
                      >
                        {["BCA","Mandiri","BNI","BRI","BSI","CIMB","Permata"].map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">No. Rekening</label>
                      <input
                        value={acc.noRek}
                        onChange={e => setTransfer(p => ({ ...p, accounts: p.accounts.map(a => a.id === acc.id ? { ...a, noRek: e.target.value } : a) }))}
                        placeholder="1234567890"
                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Atas Nama</label>
                      <input
                        value={acc.atasNama}
                        onChange={e => setTransfer(p => ({ ...p, accounts: p.accounts.map(a => a.id === acc.id ? { ...a, atasNama: e.target.value } : a) }))}
                        placeholder="Nama Pemilik"
                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setTransfer(p => ({ ...p, accounts: [...p.accounts, { id: Date.now(), bank: "BCA", noRek: "", atasNama: "" }] }))}
                className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-3 text-xs font-bold text-gray-400 hover:border-amber-400 hover:text-amber-500 transition-all"
              >
                + Tambah Rekening
              </button>
            </div>
          )}

          {/* ── E-WALLET ── */}
          {activeTab === "ewallet" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-pink-50 border border-pink-200 rounded-xl p-4">
                <Info size={16} className="text-pink-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-pink-700 leading-relaxed">
                  Masukkan nomor HP yang terdaftar di masing-masing e-wallet. Pelanggan bisa transfer manual ke nomor ini.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: "gopay",  label: "GoPay",      color: "text-green-600",  placeholder: "08xxxxxxxxxx" },
                  { key: "ovo",    label: "OVO",        color: "text-purple-600", placeholder: "08xxxxxxxxxx" },
                  { key: "dana",   label: "DANA",       color: "text-blue-600",   placeholder: "08xxxxxxxxxx" },
                  { key: "shopee", label: "ShopeePay",  color: "text-orange-500", placeholder: "08xxxxxxxxxx" },
                ].map(({ key, label, color, placeholder }) => (
                  <div key={key}>
                    <label className={`text-xs font-bold uppercase tracking-wide mb-1.5 block ${color}`}>{label}</label>
                    <input
                      value={ewallet[key]}
                      onChange={e => setEwallet(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Tombol Simpan ── */}
      <button
        onClick={handleSave}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2 text-sm"
      >
        <Save size={18} /> Simpan Pengaturan Pembayaran
      </button>

      {/* ── Modal Preview QR ── */}
      {preview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl w-full max-w-xs shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 px-6 pt-6 pb-8 text-center">
              <p className="text-white/70 text-xs font-semibold mb-1">Scan untuk membayar</p>
              <p className="text-white font-black text-lg">{qris.merchantName || "Nama Merchant"}</p>
            </div>
            <div className="-mt-6 mx-auto w-fit bg-white rounded-2xl shadow-xl p-3 relative z-10 mb-4 border border-gray-100">
              <img src={qris.qrImage} alt="QRIS" className="w-48 h-48 object-contain" />
            </div>
            <div className="px-6 pb-6 text-center space-y-2">
              {qris.nmid && (
                <p className="text-xs text-gray-400 font-mono">NMID: {qris.nmid}</p>
              )}
              <p className="text-[10px] text-gray-400">Didukung oleh GoPay · OVO · Dana · ShopeePay · dan lainnya</p>
              <button
                onClick={() => setPreview(false)}
                className="mt-3 w-full border-2 border-gray-200 text-gray-700 rounded-xl py-2.5 font-semibold text-sm hover:bg-gray-50 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}