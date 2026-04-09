import { useState, useRef, useEffect } from "react";
import {
  QrCode, CreditCard, Banknote, Upload, AlertCircle, Save, Eye,
  Smartphone, Copy, CheckCheck, Info, Loader2
} from "lucide-react";
import { useAdmin } from "../adminContext";

const API_URL = import.meta.env.VITE_API_URL ?? "https://api.mycafe-order.net";

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
  { id: "tunai",         label: "Tunai",            desc: "Pembayaran langsung dengan uang tunai.",                                 icon: "cash",     enabled: true,  configurable: false },
  { id: "online",        label: "Online",           desc: "Pembayaran online (QRIS / E-Wallet / Kartu).",            icon: "online",   enabled: true,  configurable: true  },
  { id: "transfer_bank", label: "Transfer Bank",    desc: "Transfer ke rekening BCA, Mandiri, BNI, atau BRI.",                   icon: "transfer", enabled: false, configurable: true  },
  { id: "ewalet",        label: "E-Wallet Manual",  desc: "Tampilkan nomor GoPay / OVO / Dana untuk transfer manual.",            icon: "ewallet",  enabled: false, configurable: true  },
];

const initialQris     = { nama_merchant: "MYCAFE Cafe", nomor_merchant: "", qris_image: null, feeType: "none", feeValue: "" };
const initialTransfer = { accounts: [{ id: 1, nama_bank: "BCA", nomor_bank: "", nama_pemilik: "" }] };
const initialEwallet  = {
  gopay:  { nomor: "", atasNama: "" },
  ovo:    { nomor: "", atasNama: "" },
  dana:   { nomor: "", atasNama: "" },
  shopee: { nomor: "", atasNama: "" },
};

const ACTIVE_METHOD_IDS = ["tunai", "online"];

const TAB_CONFIG = {
  qris:          { endpoint: "/api/qris",          httpMethod: "POST" },
  transfer_bank: { endpoint: "/api/bank-transfer",  httpMethod: "POST" },
  ewalet:        { endpoint: "/api/ewallet_manual", httpMethod: "POST" },
};

const EWALLET_ENDPOINTS = ["/api/ewallet_manual", "/api/ewalet_manual", "/api/ewalet"];

function PayIcon({ type, size = 20 }) {
  if (type === "online")   return <CreditCard size={size} />;
  if (type === "qris")     return <QrCode size={size} />; // legacy (jika masih ada data lama)
  if (type === "transfer") return <CreditCard size={size} />;
  if (type === "ewallet")  return <Smartphone size={size} />;
  return <Banknote size={size} />;
}

const iconBg = {
  cash:     "bg-green-50 text-green-600 border-green-200",
  online:   "bg-blue-50 text-blue-600 border-blue-200",
  qris:     "bg-blue-50 text-blue-600 border-blue-200", // legacy support
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

  // Prevent repeated auto-enabling
  const autoEnabledRef = useRef(false);

  // ── Fetch semua data pembayaran ──────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);

      const safeFetch = async (url) => {
        try {
          const r = await fetch(url, { headers: authHeaders() });
          if (!r.ok) {
            // 404 pada konfigurasi opsional (mis. e-wallet manual) dianggap "belum ada data"
            if (r.status === 404) return null;
            console.warn(`${url} → ${r.status}`);
            return null;
          }
          return await r.json();
        } catch (e) {
          console.warn(`${url} fetch error:`, e);
          return null;
        }
      };

      const safeFetchFirst = async (paths) => {
        for (const p of paths) {
          const data = await safeFetch(`${API_URL}${p}`);
          if (data) return data;
        }
        return null;
      };

      const [dQris, dTransfer] = await Promise.all([
        safeFetch(`${API_URL}/api/qris`),
        safeFetch(`${API_URL}/api/bank-transfer`),
      ]);

      console.log("QRIS data:",     dQris);
      console.log("Transfer data:", dTransfer);

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

      const dMethods = await safeFetch(`${API_URL}/api/pembayaran`);
      console.log("Methods data:", dMethods);
      if (dMethods) {
        const m = dMethods.data ?? dMethods;
        const methodArr = Array.isArray(m) ? m : (Array.isArray(m?.metode) ? m.metode : null);
        if (methodArr) {
          setMethods(prev => prev.map(mt => {
            const found = methodArr.find(x =>
              x.id === mt.id ||
              x.name === mt.id ||
              x.metode === mt.id ||
              x.method === mt.id ||
              x.nama_method === mt.id ||
              x.nama === mt.id
            );

            if (!found) return mt;

            const backendId = found.id ?? found.payment_id ?? found.metode_id;
            const enabledVal = (
              found.status_method ??
              found.statusMethod ??
              found.status ??
              found.enabled ??
              found.aktif
            );

            return {
              ...mt,
              backendId,
              enabled: Boolean(enabledVal ?? mt.enabled),
            };
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

  // ── Default: pastikan metode utama aktif (Tunai & Online) ───────────────
  useEffect(() => {
    if (loading) return;
    if (autoEnabledRef.current) return;

    const flagKey = "MYCAFE_auto_enable_payments_v1";
    let already = false;
    try {
      already = localStorage.getItem(flagKey) === "1";
    } catch {
      already = false;
    }
    if (already) {
      autoEnabledRef.current = true;
      return;
    }

    const targets = methods.filter((m) => ACTIVE_METHOD_IDS.includes(m.id));
    const anyDisabled = targets.some((m) => !m.enabled);
    if (!anyDisabled) {
      autoEnabledRef.current = true;
      try { localStorage.setItem(flagKey, "1"); } catch {}
      return;
    }

    autoEnabledRef.current = true;

    // Optimistic: set ON locally
    setMethods((prev) =>
      prev.map((m) => (ACTIVE_METHOD_IDS.includes(m.id) ? { ...m, enabled: true } : m))
    );

    // Persist once (best-effort)
    (async () => {
      for (const m of targets) {
        if (m.enabled) continue;
        const endpointId = m.backendId ?? m.id;
        try {
          await fetch(`${API_URL}/api/pembayaran/${endpointId}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ status_method: true }),
          });
        } catch {
          // ignore
        }
      }
      try { localStorage.setItem(flagKey, "1"); } catch {}
    })();
  }, [loading, methods]);

  // ── Fetch e-wallet hanya saat tab E-Wallet dibuka (hindari 404 saat load awal) ──
  useEffect(() => {
    if (activeTab !== "ewalet") return;

    const fetchEwallet = async () => {
      const safeFetch = async (url) => {
        try {
          const r = await fetch(url, { headers: authHeaders() });
          if (!r.ok) return null;
          return await r.json();
        } catch {
          return null;
        }
      };

      const safeFetchFirst = async (paths) => {
        for (const p of paths) {
          const data = await safeFetch(`${API_URL}${p}`);
          if (data) return data;
        }
        return null;
      };

      const dEwallet = await safeFetchFirst(EWALLET_ENDPOINTS);
      if (!dEwallet) return;

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
    };

    fetchEwallet();
  }, [activeTab]);

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
      const endpoints = activeTab === "ewalet" ? EWALLET_ENDPOINTS : [cfg.endpoint];

      let res = null;
      let raw = "";
      let data = null;

      const methodsToTry = activeTab === "ewalet" ? ["POST", "PUT"] : [cfg.httpMethod];

      outer: for (const ep of endpoints) {
        for (const m of methodsToTry) {
          res  = await fetch(`${API_URL}${ep}`, {
            method:  m,
            headers: authHeaders(),
            body:    JSON.stringify(payload),
          });

          const contentType = res.headers.get("content-type") ?? "";
          const isJson = contentType.includes("application/json");
          raw  = await res.text();
          data = isJson ? (raw ? JSON.parse(raw) : null) : null;

          if (res.ok && data?.success !== false) break outer;
        }
      }
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
    if (!current) return;
    const newEnabled = !current.enabled;
    
    // Optimistic update
    setMethods(prev => prev.map(m => m.id === id ? { ...m, enabled: newEnabled } : m));
    
    try {
      const endpointId = current.backendId ?? id;
      // Fix: gunakan PUT /api/pembayaran/:id dengan format yang benar
      const res  = await fetch(`${API_URL}/api/pembayaran/${endpointId}`, {
        method:  "PUT",
        headers: authHeaders(),
        body:    JSON.stringify({ 
          status_method: newEnabled 
        }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        // Rollback jika gagal
        setMethods(prev => prev.map(m => m.id === id ? { ...m, enabled: current.enabled } : m));
        showToast(data.message ?? "Gagal update metode", "error");
      } else {
        showToast(`${current.label} ${newEnabled ? "diaktifkan" : "dinonaktifkan"}`, "success");
      }
    } catch (err) {
      // Rollback jika error
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
  const visibleMethods = methods.filter(m => ACTIVE_METHOD_IDS.includes(m.id));

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
          {visibleMethods.map((m) => (
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
            </div>
          ))}
        </div>
      </div>

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
