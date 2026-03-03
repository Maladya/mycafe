import { useState, useRef, useEffect } from "react";
import {
  QrCode, CreditCard, Banknote, Upload, AlertCircle, Save, Eye,
  Smartphone, Copy, CheckCheck, Info, Loader2
} from "lucide-react";
import { useAdmin } from "../AdminPanel";

const API_URL = import.meta.env.VITE_API_URL ?? "http://192.168.1.9:3000";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ── Fix URL gambar: ganti IP salah & handle path relatif ──────────────────
const fixImgUrl = (url) => {
  if (!url?.trim()) return "";
  // Jika base64, langsung return
  if (url.startsWith("data:")) return url;
  try {
    const parsed = new URL(url);
    const base   = new URL(API_URL);
    if (parsed.host !== base.host) {
      parsed.host     = base.host;
      parsed.protocol = base.protocol;
    }
    return parsed.toString();
  } catch {
    // Path relatif → prefix API_URL
    return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  }
};

const initialMethods = [
  { id: "tunai",         label: "Tunai",           desc: "Pembayaran langsung dengan uang tunai.",                     icon: "cash",     enabled: true,  configurable: false },
  { id: "qris",          label: "QRIS",            desc: "Scan QR untuk bayar via GoPay, OVO, Dana, ShopeePay, dll.", icon: "qris",     enabled: true,  configurable: true  },
  { id: "transfer_bank", label: "Transfer Bank",   desc: "Transfer ke rekening BCA, Mandiri, BNI, atau BRI.",         icon: "transfer", enabled: false, configurable: true  },
  { id: "ewalet", label: "E-Wallet Manual", desc: "Tampilkan nomor GoPay / OVO / Dana untuk transfer manual.", icon: "ewallet",  enabled: false, configurable: true  },
];

const initialQris     = { nama_merchant: "ASTAKIRA Cafe", nomor_merchant: "", qris_image: null, feeType: "none", feeValue: "" };
const initialTransfer = { accounts: [{ id: 1, nama_bank: "BCA", nomor_bank: "", nama_pemilik: "" }] };
const initialEwallet  = {
  gopay:  { nomor: "", atasNama: "" },
  ovo:    { nomor: "", atasNama: "" },
  dana:   { nomor: "", atasNama: "" },
  shopee: { nomor: "", atasNama: "" },
};

const TAB_CONFIG = {
  qris:          { endpoint: "/api/qris",          httpMethod: "POST" },
  transfer_bank: { endpoint: "/api/bank-transfer",  httpMethod: "POST" },
  ewalet:        { endpoint: "/api/ewalet",         httpMethod: "POST" },
};

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

export default function Payment() {
  const { showToast } = useAdmin();

  const [methods,   setMethods]   = useState(initialMethods);
  const [qris,      setQris]      = useState(initialQris);
  const [transfer,  setTransfer]  = useState(initialTransfer);
  const [ewallet,   setEwallet]   = useState(initialEwallet);
  const [selectedEwalletKey, setSelectedEwalletKey] = useState("gopay");
  const [activeTab, setActiveTab] = useState("qris");
  const [copied,    setCopied]    = useState(false);
  const [preview,   setPreview]   = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  // FIX: pisahkan state preview lokal dari URL tersimpan
  const [qrPreviewUrl, setQrPreviewUrl] = useState("");

  const fileRef = useRef();

  // ── Fetch semua data pembayaran ──────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);

      const safeFetch = async (url) => {
        try {
          const r = await fetch(url, { headers: authHeaders() });
          if (!r.ok) { console.warn(`${url} → ${r.status}`); return null; }
          return await r.json();
        } catch (e) {
          console.warn(`${url} fetch error:`, e);
          return null;
        }
      };

      const [dQris, dTransfer, dEwallet] = await Promise.all([
        safeFetch(`${API_URL}/api/qris`),
        safeFetch(`${API_URL}/api/bank-transfer`),
        safeFetch(`${API_URL}/api/ewalet`),
      ]);

      console.log("QRIS data:",     dQris);
      console.log("Transfer data:", dTransfer);
      console.log("Ewallet data:",  dEwallet);

      if (dQris) {
        const qRaw = dQris.data ?? dQris;
        const q = Array.isArray(qRaw) ? qRaw[0] : qRaw;
        if (q && typeof q === "object") {
          // FIX: normalisasi URL gambar dari API saat fetch
          const rawImg = q.qris_image ?? q.qrImage ?? null;
          const fixedImg = rawImg ? fixImgUrl(rawImg) : null;

          setQris(p => ({
            ...p,
            merchantName: q.nama_merchant ?? q.merchantName ?? p.merchantName,
            nmid:         q.nomor_merchant ?? q.nmid ?? p.nmid,
            qrImage:      fixedImg ?? p.qrImage,
            feeType:      q.fee_type ?? q.feeType ?? p.feeType,
            feeValue:     q.fee_value ?? q.feeValue ?? p.feeValue,
          }));

          // Set preview URL sekalian
          if (fixedImg) setQrPreviewUrl(fixedImg);
        }
      }

      if (dTransfer) {
        const t = dTransfer.data ?? dTransfer;
        const accounts = Array.isArray(t) ? t : (Array.isArray(t?.accounts) ? t.accounts : []);
        if (accounts.length > 0) {
          setTransfer({
            accounts: accounts.map((a, i) => ({
              id:           a.id       ?? i + 1,
              nama_bank:    a.nama_bank ?? a.bank ?? "BCA",
              nomor_bank:   a.nomor_bank ?? a.no_rekening ?? a.nomor_rekening ?? "",
              nama_pemilik: a.nama_pemilik ?? a.atas_nama ?? "",
            })),
          });
        }
      }

      if (dEwallet) {
        const eRaw = dEwallet.data ?? dEwallet;

        const applyWallet = (key, wallet) => {
          if (!key) return;
          const rawKey    = String(key).toLowerCase().trim();
          const compactKey = rawKey.replace(/[\s_-]+/g, "");
          const k = (
            compactKey === "shopeepay" ? "shopee" :
            compactKey === "go" || compactKey === "gopay" || compactKey === "gopayid" ? "gopay" :
            compactKey
          );
          if (!["gopay", "ovo", "dana", "shopee"].includes(k)) return;
          const nextNomor = wallet?.nomor ?? wallet?.nomor_wallet ?? wallet?.nomor_ewallet ?? wallet?.no_hp ?? "";
          const nextAtasNama = (
            wallet?.atasNama ?? wallet?.atas_nama ?? wallet?.atasnama ?? wallet?.nama_pemilik ??
            wallet?.nama_pemilik_wallet ?? wallet?.nama_pemilik_ewallet ?? wallet?.owner ?? wallet?.nama ?? ""
          );

          setEwallet(prev => {
            const existing = prev?.[k] ?? {};
            return {
              ...prev,
              [k]: {
                nomor:    nextNomor    ? String(nextNomor)    : (existing.nomor    ?? ""),
                atasNama: nextAtasNama ? String(nextAtasNama) : (existing.atasNama ?? ""),
              },
            };
          });
        };

        if (Array.isArray(eRaw)) {
          eRaw.forEach((row) => applyWallet(row?.nama_wallet ?? row?.wallet ?? row?.jenis_wallet, row));
        } else if (eRaw && typeof eRaw === "object") {
          const e = eRaw;
          if (e.nama_wallet || e.wallet || e.jenis_wallet) {
            applyWallet(e.nama_wallet ?? e.wallet ?? e.jenis_wallet, e);
          } else {
            applyWallet("gopay",  { nomor: e.gopay_nomor  ?? e.gopay?.nomor,  atasNama: e.gopay_nama  ?? e.gopay?.atasNama });
            applyWallet("ovo",    { nomor: e.ovo_nomor    ?? e.ovo?.nomor,    atasNama: e.ovo_nama    ?? e.ovo?.atasNama });
            applyWallet("dana",   { nomor: e.dana_nomor   ?? e.dana?.nomor,   atasNama: e.dana_nama   ?? e.dana?.atasNama });
            applyWallet("shopee", { nomor: e.shopee_nomor ?? e.shopee?.nomor, atasNama: e.shopee_nama ?? e.shopee?.atasNama });
          }
        }
      }

      const dMethods = await safeFetch(`${API_URL}/api/pembayaran`);
      console.log("Methods data:", dMethods);
      if (dMethods) {
        const m = dMethods.data ?? dMethods;
        const methodArr = Array.isArray(m) ? m : (Array.isArray(m?.metode) ? m.metode : null);
        if (methodArr) {
          setMethods(prev => prev.map(mt => {
            const found = methodArr.find(x => x.id === mt.id || x.name === mt.id);
            return found ? { ...mt, enabled: Boolean(found.status ?? found.enabled ?? found.aktif ?? mt.enabled) } : mt;
          }));
        } else if (m && typeof m === "object") {
          setMethods(prev => prev.map(mt => {
            const val = m[mt.id];
            return val !== undefined ? { ...mt, enabled: Boolean(val) } : mt;
          }));
        }
      }

      setLoading(false);
    };

    fetchAll();
  }, []);

  // ── Simpan per tab ───────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    const cfg = TAB_CONFIG[activeTab];
    if (!cfg) { setSaving(false); return; }

    let payload = {};
    if (activeTab === "qris") {
      payload = {
        nama_merchant:  qris.merchantName,
        nomor_merchant: qris.nmid,
        qris_image:     qris.qrImage,
        fee_type:       qris.feeType,
        fee_value:      qris.feeValue ? Number(qris.feeValue) : null,
      };
    } else if (activeTab === "transfer_bank") {
      payload = {
        accounts: transfer.accounts.map(a => ({
          id:           a.id,
          nama_bank:    a.nama_bank,
          nomor_bank:   a.nomor_bank,
          nama_pemilik: a.nama_pemilik,
        })),
      };
    } else if (activeTab === "ewalet") {
      const nomor = ewallet[selectedEwalletKey]?.nomor ?? "";
      if (!nomor) {
        showToast("Nomor e-wallet wajib diisi", "error");
        setSaving(false);
        return;
      }
      payload = {
        nama_wallet:  selectedEwalletKey.toUpperCase(),
        nomor_wallet: nomor,
        nomor,
        atas_nama:    ewallet[selectedEwalletKey]?.atasNama ?? "",
        nama_pemilik: ewallet[selectedEwalletKey]?.atasNama ?? "",
      };
    }

    try {
      const res  = await fetch(`${API_URL}${cfg.endpoint}`, {
        method:  cfg.httpMethod,
        headers: authHeaders(),
        body:    JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type") ?? "";
      const isJson = contentType.includes("application/json");
      const raw  = await res.text();
      const data = isJson ? (raw ? JSON.parse(raw) : null) : null;
      console.log("Save pembayaran HTTP status:", res.status);
      console.log("Save pembayaran response:", data ?? raw);

      if (!res.ok || data?.success === false) {
        const msg = data?.message
          ?? (res.status === 404 ? `Endpoint tidak ditemukan: ${cfg.endpoint}` : `Gagal menyimpan (HTTP ${res.status})`);
        showToast(msg, "error");
        return;
      }

      showToast("Pengaturan pembayaran disimpan!", "success");
    } catch (err) {
      console.error("Save pembayaran error:", err);
      showToast("Gagal terhubung ke server", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle metode aktif/nonaktif ─────────────────────────────────────────
  const toggleMethod = async (id) => {
    const current    = methods.find(m => m.id === id);
    const newEnabled = !current.enabled;
    setMethods(prev => prev.map(m => m.id === id ? { ...m, enabled: newEnabled } : m));
    try {
      const res  = await fetch(`${API_URL}/api/pembayaran/${id}`, {
        method:  "PUT",
        headers: authHeaders(),
        body:    JSON.stringify({ status_method: newEnabled ? 1 : 0 }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        setMethods(prev => prev.map(m => m.id === id ? { ...m, enabled: current.enabled } : m));
        showToast(data.message ?? "Gagal update metode", "error");
      } else {
        showToast(`${current.label} ${newEnabled ? "diaktifkan" : "dinonaktifkan"}`, "success");
      }
    } catch (err) {
      setMethods(prev => prev.map(m => m.id === id ? { ...m, enabled: current.enabled } : m));
      console.error("Toggle metode error:", err);
      showToast("Gagal terhubung ke server", "error");
    }
  };

  const setEwalletField = (key, field, value) => setEwallet(p => ({ ...p, [key]: { ...p[key], [field]: value } }));

  // FIX: upload QR — base64 untuk preview, simpan ke state
  const handleQrUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { showToast("File harus berupa gambar", "error"); return; }
    if (file.size > 2 * 1024 * 1024)    { showToast("Ukuran file maksimal 2MB", "error"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setQris(p => ({ ...p, qrImage: base64 }));
      setQrPreviewUrl(base64); // preview langsung
    };
    reader.onerror = () => showToast("Gagal membaca file gambar", "error");
    reader.readAsDataURL(file);
  };

  const copyNmid = () => {
    if (!qris.nmid) return;
    navigator.clipboard.writeText(qris.nmid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Gambar yang ditampilkan: preview lokal > URL tersimpan
  const displayQrImg = qrPreviewUrl || fixImgUrl(qris.qrImage);

  return (
    <div className="p-4 lg:p-8 space-y-6 min-h-full bg-gray-50">

      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Pembayaran</h1>
        <p className="text-gray-400 text-sm mt-1">Atur metode pembayaran yang tersedia di kasir.</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 size={28} className="animate-spin mr-3"/> Memuat data pembayaran...
        </div>
      )}

      {!loading && (<>

      {/* Toggle Metode */}
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
              <button onClick={() => toggleMethod(m.id)} className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${m.enabled ? "bg-amber-500" : "bg-gray-200"}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${m.enabled ? "left-[22px]" : "left-0.5"}`} />
              </button>
              {m.configurable && m.enabled && (
                <button onClick={() => setActiveTab(m.id)} className="text-xs text-amber-600 font-semibold hover:underline flex-shrink-0">Atur →</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Konfigurasi Detail */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {methods.filter(m => m.configurable).map((m) => (
            <button key={m.id} onClick={() => setActiveTab(m.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold whitespace-nowrap transition-all border-b-2 ${activeTab === m.id ? "border-amber-500 text-amber-600 bg-amber-50/50" : "border-transparent text-gray-400 hover:text-gray-700"}`}
            >
              <PayIcon type={m.icon} size={14} />
              {m.label}
              {!m.enabled && <span className="text-[9px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full font-bold">nonaktif</span>}
            </button>
          ))}
        </div>

        <div className="p-5 lg:p-6">

          {/* QRIS */}
          {activeTab === "qris" && (
            <div className="space-y-6">
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed">Upload gambar QR code QRIS dari bank atau penyedia pembayaranmu.</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Gambar QR Code</label>
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-all group min-h-[180px]"
                    >
                      {/* FIX: pakai displayQrImg + onError fallback */}
                      {displayQrImg ? (
                        <div className="relative">
                          <img
                            src={displayQrImg}
                            alt="QR"
                            className="w-36 h-36 object-contain rounded-xl border border-gray-200"
                            onError={e => {
                              e.currentTarget.style.display = "none";
                              e.currentTarget.nextElementSibling.style.display = "flex";
                            }}
                          />
                          {/* Fallback jika gambar error */}
                          <div
                            className="w-36 h-36 items-center justify-center bg-gray-100 rounded-xl border border-gray-200 flex-col gap-2"
                            style={{ display: "none" }}
                          >
                            <QrCode size={32} className="text-gray-300"/>
                            <p className="text-[10px] text-gray-400">Gambar tidak dapat dimuat</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setQris(p => ({ ...p, qrImage: null }));
                              setQrPreviewUrl("");
                            }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow hover:bg-red-600 transition-all"
                          >
                            ✕
                          </button>
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
                  {displayQrImg && (
                    <button onClick={() => setPreview(true)} className="flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-all">
                      <Eye size={13} /> Lihat tampilan pelanggan
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Nama Merchant</label>
                    <input value={qris.merchantName ?? ""} onChange={e => setQris(p => ({ ...p, merchantName: e.target.value }))} placeholder="ASTAKIRA Cafe" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">NMID (Nomor Merchant)</label>
                    <div className="relative">
                      <input value={qris.nmid ?? ""} onChange={e => setQris(p => ({ ...p, nmid: e.target.value }))} placeholder="ID101234567890123" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm outline-none focus:border-amber-500 transition-all font-mono" />
                      <button onClick={copyNmid} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-500 transition-all">
                        {copied ? <CheckCheck size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Opsional. Tertera di sertifikat QRIS dari Bank Indonesia.</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Biaya Transaksi QRIS</label>
                    <div className="flex gap-2 mb-3">
                      {[{ val:"none", label:"Tidak ada" }, { val:"percent", label:"Persen (%)" }, { val:"flat", label:"Nominal (Rp)" }].map(opt => (
                        <button key={opt.val} onClick={() => setQris(p => ({ ...p, feeType: opt.val, feeValue: "" }))}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${qris.feeType === opt.val ? "border-amber-500 bg-amber-50 text-amber-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {qris.feeType !== "none" && (
                      <>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">{qris.feeType === "percent" ? "%" : "Rp"}</span>
                          <input type="number" value={qris.feeValue ?? ""} onChange={e => setQris(p => ({ ...p, feeValue: e.target.value }))} placeholder={qris.feeType === "percent" ? "0.7" : "500"} className="w-full border-2 border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all" />
                        </div>
                        <p className="text-[10px] text-amber-600 mt-1.5 flex items-center gap-1"><AlertCircle size={10} /> Biaya ini akan ditambahkan ke total tagihan pelanggan.</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transfer Bank */}
          {activeTab === "transfer_bank" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-purple-50 border border-purple-200 rounded-xl p-4">
                <Info size={16} className="text-purple-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-purple-700 leading-relaxed">Tambahkan rekening tujuan transfer. Pelanggan akan melihat info ini saat memilih metode transfer.</p>
              </div>
              {transfer.accounts.map((acc, idx) => (
                <div key={acc.id} className="border border-gray-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Rekening {idx + 1}</p>
                    <button onClick={() => setTransfer(p => ({ ...p, accounts: p.accounts.filter(a => a.id !== acc.id) }))} className="text-[10px] text-red-400 hover:text-red-600 font-semibold">Hapus</button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Bank</label>
                      <select value={acc.nama_bank} onChange={e => setTransfer(p => ({ ...p, accounts: p.accounts.map(a => a.id === acc.id ? { ...a, nama_bank: e.target.value } : a) }))} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all bg-white">
                        {["BCA","Mandiri","BNI","BRI","BSI","CIMB","Permata"].map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">No. Rekening</label>
                      <input value={acc.nomor_bank} onChange={e => setTransfer(p => ({ ...p, accounts: p.accounts.map(a => a.id === acc.id ? { ...a, nomor_bank: e.target.value } : a) }))} placeholder="1234567890" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all font-mono" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Atas Nama</label>
                      <input value={acc.nama_pemilik} onChange={e => setTransfer(p => ({ ...p, accounts: p.accounts.map(a => a.id === acc.id ? { ...a, nama_pemilik: e.target.value } : a) }))} placeholder="Nama Pemilik" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all" />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => setTransfer(p => ({ ...p, accounts: [...p.accounts, { id: Date.now(), nama_bank: "BCA", nomor_bank: "", nama_pemilik: "" }]}))} className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-3 text-xs font-bold text-gray-400 hover:border-amber-400 hover:text-amber-500 transition-all">
                + Tambah Rekening
              </button>
            </div>
          )}

          {/* E-Wallet */}
          {activeTab === "ewalet" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-pink-50 border border-pink-200 rounded-xl p-4">
                <Info size={16} className="text-pink-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-pink-700 leading-relaxed">Masukkan nomor HP dan atas nama yang terdaftar di masing-masing e-wallet.</p>
              </div>
              <div className="border border-gray-200 rounded-2xl p-4 space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Jenis E-Wallet</label>
                  <select value={selectedEwalletKey} onChange={(e) => setSelectedEwalletKey(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all bg-white">
                    <option value="gopay">GoPay</option>
                    <option value="ovo">OVO</option>
                    <option value="dana">DANA</option>
                    <option value="shopee">ShopeePay</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Nomor HP</label>
                  <input value={ewallet[selectedEwalletKey]?.nomor ?? ""} onChange={(e) => setEwalletField(selectedEwalletKey, "nomor", e.target.value)} placeholder="08xxxxxxxxxx" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all font-mono" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Atas Nama</label>
                  <input value={ewallet[selectedEwalletKey]?.atasNama ?? ""} onChange={(e) => setEwalletField(selectedEwalletKey, "atasNama", e.target.value)} placeholder="Nama Pemilik" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tombol Simpan */}
      <button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:scale-100">
        {saving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>}
        {saving ? "Menyimpan..." : "Simpan Pengaturan Pembayaran"}
      </button>

      </>)}

      {/* Modal Preview QR */}
      {preview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl w-full max-w-xs shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 px-6 pt-6 pb-8 text-center">
              <p className="text-white/70 text-xs font-semibold mb-1">Scan untuk membayar</p>
              <p className="text-white font-black text-lg">{qris.merchantName || "Nama Merchant"}</p>
            </div>
            <div className="-mt-6 mx-auto w-fit bg-white rounded-2xl shadow-xl p-3 relative z-10 mb-4 border border-gray-100">
              {/* FIX: pakai displayQrImg + onError di modal preview */}
              <img
                src={displayQrImg}
                alt="QRIS"
                className="w-48 h-48 object-contain"
                onError={e => { e.currentTarget.style.display = "none"; }}
              />
            </div>
            <div className="px-6 pb-6 text-center space-y-2">
              {qris.nmid && <p className="text-xs text-gray-400 font-mono">NMID: {qris.nmid}</p>}
              <p className="text-[10px] text-gray-400">Didukung oleh GoPay · OVO · Dana · ShopeePay · dan lainnya</p>
              <button onClick={() => setPreview(false)} className="mt-3 w-full border-2 border-gray-200 text-gray-700 rounded-xl py-2.5 font-semibold text-sm hover:bg-gray-50 transition-all">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
