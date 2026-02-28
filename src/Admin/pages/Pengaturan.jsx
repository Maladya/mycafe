import { useState, useEffect, useRef } from "react";
import {
  Coffee, Bell, Save, Upload, Image, Loader2, User, Lock,
  Eye, EyeOff, Palette, Check, Sliders, RotateCcw, X
} from "lucide-react";
import { useAdmin } from "../AdminPanel";

const API_URL = import.meta.env.VITE_API_URL ?? "http://192.168.1.2:3000";

const authHeaders = (json = true) => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  ...(json ? { "Content-Type": "application/json" } : {}),
});

const safeJson = async (res) => {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(
      `Server mengembalikan ${res.status} bukan JSON. Cek: API_URL="${API_URL}". ` + text.slice(0, 200)
    );
  }
  return res.json();
};

const makeErrorHandler = (showToast) => (err, endpoint = "") => {
  if (err.message.includes("Tidak bisa terhubung")) {
    showToast(`Server tidak dapat dihubungi di ${API_URL}`, "error");
  } else if (err.message.includes("bukan JSON")) {
    showToast(`Endpoint ${endpoint} tidak ditemukan di server`, "error");
  } else if (err.message.includes("401") || err.message.includes("403")) {
    showToast("Sesi habis, silakan login ulang", "error");
  } else {
    showToast(`Error: ${err.message}`, "error");
  }
};

const PRESET_TEMA = [
  { id: "amber",   nama: "Amber",   primary: "#f59e0b", secondary: "#f97316", bg: "#fffbeb", text: "#92400e" },
  { id: "rose",    nama: "Rose",    primary: "#f43f5e", secondary: "#ec4899", bg: "#fff1f2", text: "#9f1239" },
  { id: "emerald", nama: "Emerald", primary: "#10b981", secondary: "#059669", bg: "#ecfdf5", text: "#065f46" },
  { id: "sky",     nama: "Sky",     primary: "#0ea5e9", secondary: "#6366f1", bg: "#f0f9ff", text: "#0c4a6e" },
  { id: "violet",  nama: "Violet",  primary: "#7c3aed", secondary: "#a855f7", bg: "#f5f3ff", text: "#4c1d95" },
  { id: "slate",   nama: "Slate",   primary: "#475569", secondary: "#334155", bg: "#f8fafc", text: "#0f172a" },
];

const DEFAULT_COLORS = { primary: "#f59e0b", secondary: "#f97316", bg: "#fffbeb", text: "#92400e" };

export const applyTema = (colors) => {
  const root = document.documentElement;
  root.style.setProperty("--user-primary",   colors.primary);
  root.style.setProperty("--user-secondary", colors.secondary);
  root.style.setProperty("--user-bg",        colors.bg);
  root.style.setProperty("--user-text",      colors.text);
  localStorage.setItem("user_tema_colors", JSON.stringify(colors));
};

function HomePreview({ colors, cafeName }) {
  const grad = `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`;
  return (
    <div className="rounded-2xl overflow-hidden border-2 border-gray-100 shadow-sm select-none bg-gray-50">
      <div className="bg-white px-3 py-2 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: grad }}>
            <span className="text-white font-black" style={{ fontSize: 9 }}>A</span>
          </div>
          <div>
            <div className="font-black text-gray-900" style={{ fontSize: 9 }}>{cafeName || "ASTAKIRA"}</div>
            <div className="text-gray-400" style={{ fontSize: 7 }}>📍 Tasikmalaya</div>
          </div>
        </div>
        <div className="flex gap-1">
          <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: `${colors.primary}20` }}>
            <span style={{ fontSize: 8 }}>🔍</span>
          </div>
          <div className="h-5 px-2 rounded-lg flex items-center gap-0.5" style={{ background: grad }}>
            <span className="text-white" style={{ fontSize: 7 }}>🛍 Riwayat</span>
          </div>
        </div>
      </div>
      <div className="h-12 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${colors.primary}50, ${colors.secondary}30)` }}>
        <div className="absolute inset-0 flex items-center justify-center text-2xl">☕</div>
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.25), transparent)" }}/>
      </div>
      <div className="px-3 pt-2 pb-1">
        <div className="rounded-xl py-1 text-center" style={{ background: grad }}>
          <span className="text-white font-bold" style={{ fontSize: 8 }}>🍽 Meja Nomor 1</span>
        </div>
      </div>
      <div className="px-3 pb-1">
        <div className="flex gap-1 py-1">
          {["Semua", "Kopi", "Snack"].map((cat, i) => (
            <div key={cat} className="px-2 py-0.5 rounded-full font-bold"
              style={i === 0
                ? { background: grad, color: "#fff", fontSize: 7 }
                : { background: "#fff", color: colors.primary, border: `1px solid ${colors.primary}40`, fontSize: 7 }}>
              {cat}
            </div>
          ))}
        </div>
      </div>
      <div className="px-3 flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-md flex items-center justify-center" style={{ background: grad }}>
            <span style={{ fontSize: 7 }}>☕</span>
          </div>
          <span className="font-bold text-gray-800" style={{ fontSize: 8 }}>Kopi</span>
        </div>
        <span style={{ color: colors.primary, fontSize: 7, fontWeight: 700 }}>Lihat Semua →</span>
      </div>
      <div className="px-3 flex gap-1.5 pb-2">
        {["Espresso", "Latte", "Cappuccino"].map((name, i) => (
          <div key={name} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100" style={{ width: 56 }}>
            <div className="h-9 flex items-center justify-center" style={{ background: `${colors.primary}15` }}>
              <span style={{ fontSize: 14 }}>☕</span>
            </div>
            <div className="p-1">
              <div className="font-bold text-gray-800 truncate" style={{ fontSize: 7 }}>{name}</div>
              <div className="font-black" style={{ color: colors.primary, fontSize: 7 }}>Rp{11 + i * 2}k</div>
              {i === 0 ? (
                <div className="flex items-center justify-between mt-0.5 rounded-lg px-1 py-0.5"
                  style={{ background: `${colors.primary}15`, border: `1px solid ${colors.primary}40` }}>
                  <span style={{ color: colors.primary, fontSize: 7, fontWeight: 700 }}>−</span>
                  <span style={{ color: colors.text, fontSize: 7, fontWeight: 700 }}>2</span>
                  <span style={{ color: colors.primary, fontSize: 7, fontWeight: 700 }}>+</span>
                </div>
              ) : (
                <div className="mt-0.5 rounded-lg text-center py-0.5 font-bold text-white" style={{ background: grad, fontSize: 6 }}>
                  + Tambah
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mx-2 mb-2 rounded-2xl px-3 py-2 flex items-center justify-between"
        style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-white/20">
            <span style={{ fontSize: 10 }}>🛍</span>
          </div>
          <div>
            <div className="text-white/80" style={{ fontSize: 7 }}>2 item dipilih</div>
            <div className="text-white font-black" style={{ fontSize: 9 }}>Rp26.000</div>
          </div>
        </div>
        <div className="bg-white rounded-xl px-2 py-1 font-bold" style={{ color: colors.primary, fontSize: 8 }}>
          Checkout →
        </div>
      </div>
    </div>
  );
}

function ColorRow({ label, colorKey, value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl border-2 border-gray-200 overflow-hidden cursor-pointer flex-shrink-0 shadow-sm relative">
        <input type="color" value={value} onChange={e => onChange(colorKey, e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
        <div className="w-full h-full" style={{ background: value }}/>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-600 truncate">{label}</p>
        <p className="text-[10px] text-gray-400 font-mono">{value}</p>
      </div>
      <input type="text" value={value}
        onChange={e => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && onChange(colorKey, e.target.value)}
        className="w-20 border-2 border-gray-200 rounded-lg px-2 py-1 text-xs font-mono outline-none focus:border-amber-500 transition-all flex-shrink-0"/>
    </div>
  );
}

// ─── Logo Preview Component ───────────────────────────────────────────────────
function LogoPreview({ logoPreview, uploadingLogo, onRemove }) {
  const [imgError, setImgError] = useState(false);

  // Reset error saat logo berubah
  useEffect(() => { setImgError(false); }, [logoPreview]);

  if (uploadingLogo) {
    return <Loader2 size={20} className="text-amber-400 animate-spin"/>;
  }

  // Tidak ada logo
  if (!logoPreview) {
    return <Image size={24} className="text-gray-300"/>;
  }

  // Ada logo tapi gagal load
  if (imgError) {
    return (
      <>
        <div className="flex flex-col items-center gap-1">
          <Image size={20} className="text-red-300"/>
          <span className="text-[9px] text-red-400 text-center leading-tight px-1">Gagal load</span>
        </div>
        <button
          onClick={onRemove}
          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          title="Hapus logo">
          <X size={10}/>
        </button>
      </>
    );
  }

  // Logo normal
  return (
    <>
      <img
        src={logoPreview}
        alt="Logo"
        className="w-full h-full object-cover"
        onError={() => setImgError(true)}
      />
      <button
        onClick={onRemove}
        className="absolute inset-0 bg-black/50 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
        Hapus
      </button>
    </>
  );
}

export default function Pengaturan() {
  const { showToast } = useAdmin();
  const handleError = makeErrorHandler(showToast);

  const [s, setS] = useState({
    cafeNama: "", cafeAlamat: "", logo_kafe: "", username: "", cafeEmail: "",
    notifOrder: true, notifLowStock: true, autoAccept: false,
  });

  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [logoPreview, setLogoPreview]     = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [urlInput, setUrlInput]           = useState("");
  const fileRef = useRef();

  const [pwd, setPwd]             = useState({ current: "", newPwd: "", confirm: "" });
  const [showPwd, setShowPwd]     = useState({ current: false, newPwd: false, confirm: false });
  const [savingPwd, setSavingPwd] = useState(false);

  const [colors, setColors]                 = useState({ ...DEFAULT_COLORS });
  const [activePresetId, setActivePresetId] = useState("amber");
  const [temaTab, setTemaTab]               = useState("preset");

  const set     = (k, v) => setS(p => ({ ...p, [k]: v }));
  const setPwd_ = (k, v) => setPwd(p => ({ ...p, [k]: v }));

  const fixImgUrl = (url) => {
    if (!url?.trim()) return url;
    // Kalau base64 (dengan atau tanpa prefix data:), kembalikan apa adanya
    if (url.startsWith("data:") || url.startsWith("/9j/") || url.startsWith("iVBOR") || url.length > 500) return url;
    try {
      const parsed = new URL(url);
      const base   = new URL(API_URL);
      if (parsed.host !== base.host) {
        parsed.host     = base.host;
        parsed.protocol = base.protocol;
      }
      return parsed.toString();
    } catch {
      return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
    }
  };

  // ─── Fetch settings ──────────────────────────────────────────────────────────
  const fetchSettings = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/pengaturan`, { headers: authHeaders() })
        .catch(err => { throw new Error(`Tidak bisa terhubung ke server: ${err.message}`); });
      const data = await safeJson(res);
      const d    = data.data ?? data.settings ?? data ?? {};

      setS(prev => ({
        ...prev,
        cafeNama:      d.nama_cafe  ?? prev.cafeNama,
        cafeAlamat:    d.alamat     ?? prev.cafeAlamat,
        logo_kafe:     d.logo_cafe  ?? prev.logo_kafe,
        username:      d.username   ?? prev.username,
        cafeEmail:     d.email      ?? prev.cafeEmail,
        notifOrder:    Boolean(d.notif_order     ?? prev.notifOrder),
        notifLowStock: Boolean(d.notif_low_stock ?? prev.notifLowStock),
        autoAccept:    Boolean(d.auto_accept     ?? prev.autoAccept),
      }));

      // ← PERBAIKAN: selalu update logoPreview dari response, hapus jika null/kosong
      if (d.logo_cafe) {
        setLogoPreview(fixImgUrl(d.logo_cafe));
        if (!d.logo_cafe.startsWith("data:")) setUrlInput(d.logo_cafe);
        else setUrlInput("");
      } else {
        setLogoPreview("");
        setUrlInput("");
      }

      if (d.tema_colors) {
        try {
          const tc    = typeof d.tema_colors === "string" ? JSON.parse(d.tema_colors) : d.tema_colors;
          setColors(tc);
          const match = PRESET_TEMA.find(p => p.primary === tc.primary && p.secondary === tc.secondary);
          setActivePresetId(match?.id ?? "custom");
        } catch {}
      }
    } catch (err) {
      handleError(err, "/api/pengaturan");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("user_tema_colors");
      if (saved) {
        const parsed = JSON.parse(saved);
        setColors(parsed);
        const match = PRESET_TEMA.find(p => p.primary === parsed.primary && p.secondary === parsed.secondary);
        setActivePresetId(match?.id ?? "custom");
      }
    } catch {}
    fetchSettings();
  }, []);

  useEffect(() => { applyTema(colors); }, [colors]);

  const handleColorChange   = (key, val) => { setColors(prev => ({ ...prev, [key]: val })); setActivePresetId("custom"); };
  const handleSelectPreset  = (preset)   => { setActivePresetId(preset.id); setColors({ primary: preset.primary, secondary: preset.secondary, bg: preset.bg, text: preset.text }); };
  const handleResetTema     = ()         => { handleSelectPreset(PRESET_TEMA[0]); setActivePresetId("amber"); setTemaTab("preset"); };

  const handleLogoUpload = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { showToast("File harus berupa gambar", "error"); return; }
    if (file.size > 5 * 1024 * 1024)    { showToast("Ukuran logo maksimal 5MB", "error"); return; }
    setUploadingLogo(true);
    const reader    = new FileReader();
    reader.onload   = (e) => {
      const base64 = e.target.result;
      set("logo_kafe", base64);
      setLogoPreview(base64);
      setUrlInput("");
      setUploadingLogo(false);
    };
    reader.onerror  = () => { showToast("Gagal membaca file", "error"); setUploadingLogo(false); };
    reader.readAsDataURL(file);
  };

  const handleUrlInput = (val) => {
    setUrlInput(val);
    if (val.trim()) {
      set("logo_kafe", val.trim());
      setLogoPreview(val.trim());
    }
  };

  const handleRemoveLogo = () => { set("logo_kafe", ""); setLogoPreview(""); setUrlInput(""); };

  const handleSavePwd = async () => {
    if (!pwd.current)               { showToast("Password lama wajib diisi", "error"); return; }
    if (!pwd.newPwd)                { showToast("Password baru wajib diisi", "error"); return; }
    if (pwd.newPwd.length < 6)      { showToast("Password baru minimal 6 karakter", "error"); return; }
    if (pwd.newPwd !== pwd.confirm) { showToast("Konfirmasi password tidak cocok", "error"); return; }
    setSavingPwd(true);
    try {
      const res  = await fetch(`${API_URL}/api/pengaturan/password`, {
        method: "PUT", headers: authHeaders(),
        body: JSON.stringify({ password_lama: pwd.current, password_baru: pwd.newPwd, konfirmasi: pwd.confirm }),
      }).catch(err => { throw new Error(`Tidak bisa terhubung ke server: ${err.message}`); });
      const data = await safeJson(res);
      if (!res.ok || data.success === false) { showToast(data.message ?? "Gagal mengganti password", "error"); return; }
      showToast("Password berhasil diganti!", "success");
      setPwd({ current: "", newPwd: "", confirm: "" });
    } catch (err) { handleError(err, "/api/pengaturan/password"); }
    finally { setSavingPwd(false); }
  };

  const handleSave = async () => {
    if (!s.cafeNama.trim()) { showToast("Nama kafe wajib diisi", "error"); return; }
    setSaving(true);
    try {
      const payload = {
        nama_cafe:       s.cafeNama,
        logo_cafe:       s.logo_kafe || null,
        alamat:          s.cafeAlamat,
        username:        s.username,
        email:           s.cafeEmail,
        notif_order:     s.notifOrder    ? 1 : 0,
        notif_low_stock: s.notifLowStock ? 1 : 0,
        auto_accept:     s.autoAccept    ? 1 : 0,
        tema_colors:     JSON.stringify(colors),
      };
      const res  = await fetch(`${API_URL}/api/pengaturan`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(payload),
      }).catch(err => { throw new Error(`Tidak bisa terhubung ke server: ${err.message}`); });
      const data = await safeJson(res);
      if (!res.ok || data.success === false) { showToast(data.message ?? "Gagal menyimpan pengaturan", "error"); return; }
      applyTema(colors);
      showToast("Pengaturan disimpan!", "success");
      // Fetch ulang agar semua data (termasuk logo) sinkron dari DB
      await fetchSettings(true);
    } catch (err) { handleError(err, "/api/pengaturan"); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 size={28} className="animate-spin mr-3"/> Memuat pengaturan...
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-xl lg:text-2xl font-black text-gray-900">Pengaturan</h1>
        <p className="text-gray-400 text-sm">Konfigurasi sistem ASTAKIRA</p>
      </div>

      {/* Informasi Kafe */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
            <Coffee size={16} className="text-white"/>
          </div>
          <h2 className="font-bold text-gray-900">Informasi Kafe</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Logo Kafe</label>
            <div className="flex items-center gap-4">
              {/* Preview Box — pakai komponen terpisah agar imgError terisolasi */}
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl border-2 border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden relative group">
                  <LogoPreview
                    logoPreview={logoPreview}
                    uploadingLogo={uploadingLogo}
                    onRemove={handleRemoveLogo}
                  />
                </div>
                  
              </div>
              <div className="flex-1 space-y-2">
                <div
                  onClick={() => !uploadingLogo && fileRef.current?.click()}
                  onDrop={e => { e.preventDefault(); handleLogoUpload(e.dataTransfer.files?.[0]); }}
                  onDragOver={e => e.preventDefault()}
                  className="border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-all">
                  <Upload size={16} className="text-gray-400 flex-shrink-0"/>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Klik atau drag & drop</p>
                    <p className="text-xs text-gray-400">PNG, JPG · Maks 5MB</p>
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => handleLogoUpload(e.target.files?.[0])}/>
                <input
                  value={urlInput}
                  onChange={e => handleUrlInput(e.target.value)}
                  placeholder="Atau masukkan URL logo..."
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500 transition-all text-gray-500"/>
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Nama Kafe *</label>
            <input value={s.cafeNama} onChange={e => set("cafeNama", e.target.value)} placeholder="ASTAKIRA"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all"/>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
              <span className="flex items-center gap-1"><User size={10}/> Username Admin</span>
            </label>
            <input value={s.username} onChange={e => set("username", e.target.value)} placeholder="admin"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all"/>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Email</label>
            <input value={s.cafeEmail} onChange={e => set("cafeEmail", e.target.value)} placeholder="admin@astakira.id" type="email"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all"/>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Alamat</label>
            <textarea value={s.cafeAlamat} onChange={e => set("cafeAlamat", e.target.value)} rows={2}
              placeholder="Jl. Ciakar No.12, Tasikmalaya"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all resize-none"/>
          </div>
        </div>
      </div>

      {/* Tema Warna */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
              <Palette size={16} className="text-white"/>
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Tema Halaman User</h2>
              <p className="text-xs text-gray-400">Ubah tampilan yang dilihat pelanggan</p>
            </div>
          </div>
          <button onClick={handleResetTema}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100">
            <RotateCcw size={12}/> Reset
          </button>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
          <button onClick={() => setTemaTab("preset")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${temaTab === "preset" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"}`}>
            <Palette size={12}/> Preset
          </button>
          <button onClick={() => setTemaTab("custom")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${temaTab === "custom" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"}`}>
            <Sliders size={12}/> Custom
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            {temaTab === "preset" ? (
              <>
                <p className="text-xs font-semibold text-gray-500 mb-2.5 uppercase tracking-wide">Pilih Tema</p>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_TEMA.map((preset) => {
                    const isActive = activePresetId === preset.id;
                    return (
                      <button key={preset.id} onClick={() => handleSelectPreset(preset)}
                        className={`relative p-3 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${isActive ? "border-gray-800 shadow-md" : "border-gray-100 hover:border-gray-300"}`}>
                        <div className="flex gap-1 mb-1.5">
                          <div className="h-4 rounded-full flex-1" style={{ background: preset.primary }}/>
                          <div className="h-4 rounded-full flex-1" style={{ background: preset.secondary }}/>
                          <div className="h-4 rounded-full flex-1 border border-gray-200" style={{ background: preset.bg }}/>
                        </div>
                        <p className="text-xs font-semibold text-gray-700">{preset.nama}</p>
                        {isActive && (
                          <div className="absolute top-2 right-2 w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center">
                            <Check size={9} className="text-white"/>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold text-gray-500 mb-2.5 uppercase tracking-wide">Custom Warna</p>
                <div className="space-y-3">
                  <ColorRow label="Warna Utama"      colorKey="primary"   value={colors.primary}   onChange={handleColorChange}/>
                  <ColorRow label="Warna Sekunder"   colorKey="secondary" value={colors.secondary} onChange={handleColorChange}/>
                  <ColorRow label="Warna Background" colorKey="bg"        value={colors.bg}        onChange={handleColorChange}/>
                  <ColorRow label="Warna Teks"       colorKey="text"      value={colors.text}      onChange={handleColorChange}/>
                </div>
                <div className="mt-3 rounded-xl overflow-hidden border border-gray-100">
                  <div className="h-7" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}/>
                  <div className="h-6 flex items-center px-3" style={{ background: colors.bg }}>
                    <span className="text-xs font-bold" style={{ color: colors.text }}>Teks Contoh</span>
                    <span className="ml-auto text-xs font-bold" style={{ color: colors.primary }}>Link →</span>
                  </div>
                </div>
              </>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2.5 uppercase tracking-wide">Preview Halaman User</p>
            <HomePreview colors={colors} cafeName={s.cafeNama}/>
            <p className="text-[10px] text-gray-400 text-center mt-1.5">Preview langsung saat warna berubah ✨</p>
          </div>
        </div>
      </div>

      {/* Ganti Password */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Lock size={16} className="text-white"/>
          </div>
          <h2 className="font-bold text-gray-900">Ganti Password</h2>
        </div>
        <div className="space-y-3">
          {[
            { k:"current", l:"Password Lama",            ph:"Masukkan password lama" },
            { k:"newPwd",  l:"Password Baru",            ph:"Minimal 6 karakter" },
            { k:"confirm", l:"Konfirmasi Password Baru", ph:"Ulangi password baru" },
          ].map(({ k, l, ph }) => (
            <div key={k}>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{l}</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                <input type={showPwd[k] ? "text" : "password"} value={pwd[k]} onChange={e => setPwd_(k, e.target.value)} placeholder={ph}
                  className={`w-full border-2 rounded-xl pl-9 pr-10 py-2.5 text-sm outline-none transition-all ${
                    k === "confirm" && pwd.confirm && pwd.newPwd !== pwd.confirm
                      ? "border-red-300 focus:border-red-500 bg-red-50"
                      : "border-gray-200 focus:border-blue-500"
                  }`}/>
                <button type="button" onClick={() => setShowPwd(p => ({ ...p, [k]: !p[k] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors">
                  {showPwd[k] ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
              </div>
              {k === "confirm" && pwd.confirm && pwd.newPwd !== pwd.confirm && (
                <p className="text-[11px] text-red-500 mt-1">Password tidak cocok</p>
              )}
            </div>
          ))}
        </div>
        <button onClick={handleSavePwd} disabled={savingPwd}
          className="mt-4 w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-bold shadow hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60">
          {savingPwd ? <Loader2 size={16} className="animate-spin"/> : <Lock size={16}/>}
          {savingPwd ? "Menyimpan..." : "Ganti Password"}
        </button>
      </div>

      {/* Notifikasi & Otomasi */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <Bell size={16} className="text-white"/>
          </div>
          <h2 className="font-bold text-gray-900">Notifikasi & Otomasi</h2>
        </div>
        <div className="space-y-3">
          {[
            { k:"notifOrder",    l:"Notifikasi pesanan masuk", sub:"Alert saat ada pesanan baru" },
            { k:"notifLowStock", l:"Notifikasi stok habis",    sub:"Alert ketika menu tidak tersedia" },
            { k:"autoAccept",    l:"Auto-terima pesanan",      sub:"Pesanan langsung masuk ke antrian proses" },
          ].map(({ k, l, sub }) => (
            <div key={k} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-semibold text-gray-900">{l}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
              <button onClick={() => set(k, !s[k])}
                className={`w-12 h-6 rounded-full transition-all duration-300 relative flex-shrink-0 ${s[k] ? "bg-amber-500" : "bg-gray-200"}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${s[k] ? "left-[26px]" : "left-0.5"}`}/>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Simpan */}
      <button onClick={handleSave} disabled={saving}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:scale-100">
        {saving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>}
        {saving ? "Menyimpan..." : "Simpan Semua Pengaturan"}
      </button>
    </div>
  );
}