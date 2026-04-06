import { useState, useEffect, useRef, useCallback } from "react";

import {

  Coffee, Bell, Save, Upload, Image, Loader2, User, Lock,

  Eye, EyeOff, Palette, Check, Sliders, RotateCcw, X

} from "lucide-react";

import { useAdmin } from "../AdminPanel";



const API_URL = import.meta.env.VITE_API_URL ?? "http://202.74.74.203:3000";



const authHeaders = (json = true) => ({

  Authorization: `Bearer ${localStorage.getItem("token")}`,

  ...(json ? { "Content-Type": "application/json" } : {}),

});



const safeJson = async (res) => {

  const contentType = res.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {

    const text = await res.text();

    throw new Error(

      `Server mengembalikan ${res.status} bukan JSON. Cek: API_URL="${API_URL}". ` +

        text.slice(0, 200)

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



// ─── Helpers ─────────────────────────────────────────────────────────────────



const isBase64 = (str) => {

  if (!str) return false;

  if (str.startsWith("data:image/")) return true;

  return str.length > 200 && /^[A-Za-z0-9+/=]+$/.test(str.slice(0, 100));

};



const ensureDataUri = (str) => {

  if (!str) return str;

  if (str.startsWith("data:")) return str;

  if (isBase64(str)) return `data:image/jpeg;base64,${str}`;

  return str;

};



const compressImage = (dataUri, maxWidth = 400, quality = 0.75) =>

  new Promise((resolve, reject) => {

    const img = new window.Image();

    img.onload = () => {

      const canvas = document.createElement("canvas");

      let { width, height } = img;

      if (width > maxWidth) {

        height = Math.round((height * maxWidth) / width);

        width = maxWidth;

      }

      canvas.width = width;

      canvas.height = height;

      canvas.getContext("2d").drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL("image/jpeg", quality));

    };

    img.onerror = () => reject(new Error("Gagal memuat gambar untuk kompresi"));

    img.src = ensureDataUri(dataUri);

  });



const fixImgUrl = (url) => {

  if (!url?.trim()) return url;

  if (isBase64(url)) return ensureDataUri(url);

  try {

    const parsed = new URL(url);

    const base = new URL(API_URL);

    if (parsed.host !== base.host) {

      parsed.hostname = base.hostname;

      parsed.port = base.port;

      parsed.protocol = base.protocol;

    }

    return parsed.toString();

  } catch {

    return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;

  }

};



// ─── Tema ────────────────────────────────────────────────────────────────────



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

  root.style.setProperty("--user-primary", colors.primary);

  root.style.setProperty("--user-secondary", colors.secondary);

  root.style.setProperty("--user-bg", colors.bg);

  root.style.setProperty("--user-text", colors.text);

  localStorage.setItem("user_tema_colors", JSON.stringify(colors));

};



// ─── SaveButton ───────────────────────────────────────────────────────────────

function SaveButton({ onClick, saving, saved, label = "Simpan" }) {

  return (

    <button onClick={onClick} disabled={saving}

      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-60 ${

        saved

          ? "bg-green-500 text-white shadow"

          : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow hover:shadow-md hover:scale-[1.02]"

      }`}>

      {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}

      {saving ? "Menyimpan..." : saved ? "Tersimpan!" : label}

    </button>

  );

}



// ─── LogoPreview ──────────────────────────────────────────────────────────────

function LogoPreview({ logoPreview, uploadingLogo, onRemove }) {

  const [imgError, setImgError] = useState(false);

  useEffect(() => { setImgError(false); }, [logoPreview]);



  if (uploadingLogo) return <Loader2 size={20} className="text-amber-400 animate-spin" />;

  if (!logoPreview)  return <Image size={24} className="text-gray-300" />;

  if (imgError) {

    return (

      <>

        <div className="flex flex-col items-center gap-1">

          <Image size={20} className="text-red-300" />

          <span className="text-[9px] text-red-400 text-center leading-tight px-1">Gagal load</span>

        </div>

        <button onClick={onRemove}

          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">

          <X size={10} />

        </button>

      </>

    );

  }

  return (

    <>

      <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" onError={() => setImgError(true)} />

      <button onClick={onRemove}

        className="absolute inset-0 bg-black/50 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">

        Hapus

      </button>

    </>

  );

}



// ─── SectionHeader ────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle, iconClass, children }) {

  return (

    <div className="flex items-center justify-between mb-4">

      <div className="flex items-center gap-2">

        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconClass}`}>{icon}</div>

        <div>

          <h2 className="font-bold text-gray-900">{title}</h2>

          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}

        </div>

      </div>

      {children}

    </div>

  );

}



// ─── HomePreview ──────────────────────────────────────────────────────────────

function HomePreview({ colors, cafeName }) {

  const grad = `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`;

  return (

    <div className="rounded-2xl overflow-hidden border-2 border-gray-100 shadow-sm select-none bg-gray-50">

      <div className="bg-white px-3 py-2 flex items-center justify-between border-b border-gray-100">

        <div className="flex items-center gap-1.5">

          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: grad }}>

            <span className="text-white font-black" style={{ fontSize: 9 }}>A</span>

          </div>

          <div className="font-black text-gray-900" style={{ fontSize: 9 }}>{cafeName || "ASTAKIRA"}</div>

        </div>

        <div className="h-5 px-2 rounded-lg flex items-center" style={{ background: grad }}>

          <span className="text-white" style={{ fontSize: 7 }}>🛍 Riwayat</span>

        </div>

      </div>

      <div className="mx-2 my-2 rounded-2xl px-3 py-2 flex items-center justify-between"

        style={{ background: grad }}>

        <div>

          <div className="text-white/80" style={{ fontSize: 7 }}>2 item dipilih</div>

          <div className="text-white font-black" style={{ fontSize: 9 }}>Rp26.000</div>

        </div>

        <div className="bg-white rounded-xl px-2 py-1 font-bold" style={{ color: colors.primary, fontSize: 8 }}>

          Checkout →

        </div>

      </div>

    </div>

  );

}



// ─── ColorRow ─────────────────────────────────────────────────────────────────

function ColorRow({ label, colorKey, value, onChange }) {

  return (

    <div className="flex items-center gap-3">

      <div className="w-9 h-9 rounded-xl border-2 border-gray-200 overflow-hidden cursor-pointer flex-shrink-0 shadow-sm relative">

        <input type="color" value={value} onChange={e => onChange(colorKey, e.target.value)}

          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />

        <div className="w-full h-full" style={{ background: value }} />

      </div>

      <div className="flex-1 min-w-0">

        <p className="text-xs font-semibold text-gray-600 truncate">{label}</p>

        <p className="text-[10px] text-gray-400 font-mono">{value}</p>

      </div>

      <input type="text" value={value}

        onChange={e => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && onChange(colorKey, e.target.value)}

        className="w-20 border-2 border-gray-200 rounded-lg px-2 py-1 text-xs font-mono outline-none focus:border-amber-500 flex-shrink-0" />

    </div>

  );

}



// ─── Main Component ───────────────────────────────────────────────────────────

export default function Pengaturan() {

  const { showToast } = useAdmin();

  const handleError = makeErrorHandler(showToast);



  const [s, setS] = useState({

    cafeNama: "", cafeAlamat: "", logo_cafe: "", username: "", cafeEmail: "",

    notifOrder: true, notifLowStock: true, autoAccept: false,

    pajakPersen: "",

  });



  const [loading, setLoading]             = useState(true);

  const [logoPreview, setLogoPreview]     = useState("");

  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [urlInput, setUrlInput]           = useState("");

  const fileRef = useRef();



  const [pwd, setPwd]         = useState({ current: "", newPwd: "", confirm: "" });

  const [showPwd, setShowPwd] = useState({ current: false, newPwd: false, confirm: false });



  const [colors, setColors]                 = useState({ ...DEFAULT_COLORS });

  const [activePresetId, setActivePresetId] = useState("amber");

  const [temaTab, setTemaTab]               = useState("preset");



  const [sec, setSec] = useState({

    info:  { saving: false, saved: false },

    tema:  { saving: false, saved: false },

    pwd:   { saving: false, saved: false },

    notif: { saving: false, saved: false },

    pajak: { saving: false, saved: false },

  });



  const setSecState = useCallback((key, patch) =>

    setSec(prev => ({ ...prev, [key]: { ...prev[key], ...patch } })), []);



  const flashSaved = useCallback((key) => {

    setSecState(key, { saved: true });

    setTimeout(() => setSecState(key, { saved: false }), 2500);

  }, [setSecState]);



  const set     = useCallback((k, v) => setS(p => ({ ...p, [k]: v })), []);

  const setPwd_ = (k, v) => setPwd(p => ({ ...p, [k]: v }));



  // ── Core POST ─────────────────────────────────────────────────────────────

  const postSettings = useCallback(async (partialPayload) => {

    const payload = {

      nama_cafe:       s.cafeNama.trim(),

      alamat:          s.cafeAlamat.trim(),

      username:        s.username.trim(),

      email:           s.cafeEmail.trim(),

      logo_cafe:       s.logo_cafe || null,

      notif_order:     s.notifOrder    ? 1 : 0,

      notif_low_stock: s.notifLowStock ? 1 : 0,

      auto_accept:     s.autoAccept    ? 1 : 0,

      tema_colors:     JSON.stringify(colors),

      ...partialPayload,

    };

    const res = await fetch(`${API_URL}/api/pengaturan`, {

      method: "POST", headers: authHeaders(), body: JSON.stringify(payload),

    }).catch(err => { throw new Error(`Tidak bisa terhubung ke server: ${err.message}`); });



    if (res.status === 204) return { ok: true, data: null };

    const data = await safeJson(res);

    if (!res.ok || data.success === false) throw new Error(data.message ?? `HTTP ${res.status}`);

    return { ok: true, data };

  }, [s, colors]);



  // ── Fetch settings ────────────────────────────────────────────────────────

  const skipLogoFetchRef = useRef(false);



  const fetchPajakAdmin = useCallback(async () => {

    const res = await fetch(`${API_URL}/api/pajak/admin`, { headers: authHeaders() })

      .catch(err => { throw new Error(`Tidak bisa terhubung ke server: ${err.message}`); });

    const data = await safeJson(res);

    if (!res.ok) throw new Error(data.message ?? `HTTP ${res.status}`);

    const raw = data.data ?? data.pajak ?? data ?? {};

    const d = Array.isArray(raw) ? (raw[0] ?? {}) : raw;

    const val =

      (typeof d === "number" ? d : null)

      ?? (typeof d?.pajak === "number" ? d.pajak : null)

      ?? (typeof d?.pajak === "string" ? Number(d.pajak) : null)

      ?? (typeof d?.pajak_persen === "number" ? d.pajak_persen : null)

      ?? (typeof d?.pajak_persen === "string" ? Number(d.pajak_persen) : null)

      ?? (typeof d?.pajak_persen === "string" ? Number(String(d.pajak_persen).replace(/%/g, "")) : null)

      ?? null;

    if (val === null || Number.isNaN(val)) return;

    setS(prev => ({ ...prev, pajakPersen: String(val) }));

  }, []);



  const fetchSettings = useCallback(async (silent = false) => {

    if (!silent) setLoading(true);

    try {

      const res  = await fetch(`${API_URL}/api/pengaturan`, { headers: authHeaders() })

        .catch(err => { throw new Error(`Tidak bisa terhubung ke server: ${err.message}`); });

      const data = await safeJson(res);

      if (!res.ok) throw new Error(data.message ?? `HTTP ${res.status}`);



      const d = data.data ?? data.settings ?? data ?? {};



      if (d.logo_cafe) {

        if (skipLogoFetchRef.current) {

          skipLogoFetchRef.current = false;

          setS(prev => ({

            ...prev,

            cafeNama:      d.nama_cafe  ?? prev.cafeNama,

            cafeAlamat:    d.alamat     ?? prev.cafeAlamat,

            username:      d.username   ?? prev.username,

            cafeEmail:     d.email      ?? prev.cafeEmail,

            notifOrder:    Boolean(d.notif_order     ?? prev.notifOrder),

            notifLowStock: Boolean(d.notif_low_stock ?? prev.notifLowStock),

            autoAccept:    Boolean(d.auto_accept     ?? prev.autoAccept),

            pajakPersen:   String((d.pajak ?? prev.pajakPersen) ?? ""),

          }));

        } else {

          const fixed = fixImgUrl(d.logo_cafe);

          setS(prev => ({

            ...prev,

            cafeNama:      d.nama_cafe  ?? prev.cafeNama,

            cafeAlamat:    d.alamat     ?? prev.cafeAlamat,

            logo_cafe:     d.logo_cafe,

            username:      d.username   ?? prev.username,

            cafeEmail:     d.email      ?? prev.cafeEmail,

            notifOrder:    Boolean(d.notif_order     ?? prev.notifOrder),

            notifLowStock: Boolean(d.notif_low_stock ?? prev.notifLowStock),

            autoAccept:    Boolean(d.auto_accept     ?? prev.autoAccept),

          }));

          setLogoPreview(fixed);

          setUrlInput(isBase64(d.logo_cafe) ? "" : d.logo_cafe);

        }

      } else {

        setS(prev => ({

          ...prev,

          cafeNama:      d.nama_cafe  ?? prev.cafeNama,

          cafeAlamat:    d.alamat     ?? prev.cafeAlamat,

          logo_cafe:     null,

          username:      d.username   ?? prev.username,

          cafeEmail:     d.email      ?? prev.cafeEmail,

          notifOrder:    Boolean(d.notif_order     ?? prev.notifOrder),

          notifLowStock: Boolean(d.notif_low_stock ?? prev.notifLowStock),

          autoAccept:    Boolean(d.auto_accept     ?? prev.autoAccept),

          pajakPersen:   String((d.pajak ?? prev.pajakPersen) ?? ""),

        }));

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

      try { await fetchPajakAdmin(); } catch (err) { console.log("[PAJAK] GET /api/pajak/admin error:", err); }

    } catch (err) {

      handleError(err, "/api/pengaturan");

    } finally {

      if (!silent) setLoading(false);

    }

  }, []);



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



  // ── Logo handlers ─────────────────────────────────────────────────────────

  const handleLogoUpload = async (file) => {

    if (!file) return;

    if (!file.type.startsWith("image/")) { showToast("File harus berupa gambar", "error"); return; }

    if (file.size > 5 * 1024 * 1024)    { showToast("Ukuran logo maksimal 5MB", "error"); return; }



    setUploadingLogo(true);

    try {

      const raw = await new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload  = e => resolve(e.target.result);

        reader.onerror = () => reject(new Error("Gagal membaca file"));

        reader.readAsDataURL(file);

      });



      const compressed = await compressImage(raw, 400, 0.75);

      set("logo_cafe", compressed);

      setLogoPreview(compressed);

      setUrlInput("");

    } catch (err) {

      showToast(`Gagal memproses gambar: ${err.message}`, "error");

    } finally {

      setUploadingLogo(false);

      if (fileRef.current) fileRef.current.value = "";

    }

  };



  const handleUrlInput = (val) => {

    setUrlInput(val);

    const trimmed = val.trim();

    if (trimmed) {

      set("logo_cafe", trimmed);

      setLogoPreview(fixImgUrl(trimmed));

    } else {

      set("logo_cafe", "");

    }

  };



  const handleRemoveLogo = () => {

    set("logo_cafe", "");

    setLogoPreview("");

    setUrlInput("");

  };



  // ── Tema handlers ─────────────────────────────────────────────────────────

  const handleColorChange  = (key, val) => { setColors(prev => ({ ...prev, [key]: val })); setActivePresetId("custom"); };

  const handleSelectPreset = (preset)   => { setActivePresetId(preset.id); setColors({ primary: preset.primary, secondary: preset.secondary, bg: preset.bg, text: preset.text }); };

  const handleResetTema    = ()         => { handleSelectPreset(PRESET_TEMA[0]); setActivePresetId("amber"); setTemaTab("preset"); };



  // ── Save Info ─────────────────────────────────────────────────────────────

  const handleSaveInfo = async () => {

    if (!s.cafeNama.trim()) { showToast("Nama kafe wajib diisi", "error"); return; }



    const partialPayload = {

      nama_cafe:  s.cafeNama.trim(),

      alamat:     s.cafeAlamat.trim(),

      username:   s.username.trim(),

      email:      s.cafeEmail.trim(),

      logo_cafe:  s.logo_cafe || null,

    };



    setSecState("info", { saving: true });

    try {

      const { ok } = await postSettings(partialPayload);

      if (!ok) throw new Error("Response tidak ok");

      flashSaved("info");

      showToast("Informasi kafe disimpan!", "success");

      skipLogoFetchRef.current = true;

      await fetchSettings(true);

    } catch (err) {

      handleError(err, "/api/pengaturan");

    } finally {

      setSecState("info", { saving: false });

    }

  };



  // ── Save Tema ─────────────────────────────────────────────────────────────

  const handleSaveTema = async () => {

    setSecState("tema", { saving: true });

    try {

      await postSettings({ tema_colors: JSON.stringify(colors) });

      applyTema(colors);

      flashSaved("tema");

      showToast("Tema warna disimpan!", "success");

    } catch (err) { handleError(err, "/api/pengaturan"); }

    finally       { setSecState("tema", { saving: false }); }

  };



  // ── Save Password ─────────────────────────────────────────────────────────

  const handleSavePwd = async () => {

    if (!pwd.current)               { showToast("Password lama wajib diisi", "error"); return; }

    if (!pwd.newPwd)                { showToast("Password baru wajib diisi", "error"); return; }

    if (pwd.newPwd.length < 6)      { showToast("Password baru minimal 6 karakter", "error"); return; }

    if (pwd.newPwd !== pwd.confirm) { showToast("Konfirmasi password tidak cocok", "error"); return; }

    setSecState("pwd", { saving: true });

    try {

      const res  = await fetch(`${API_URL}/api/pengaturan/password`, {

        method: "PUT", headers: authHeaders(),

        body: JSON.stringify({ password_lama: pwd.current, password_baru: pwd.newPwd, konfirmasi: pwd.confirm }),

      }).catch(err => { throw new Error(`Tidak bisa terhubung ke server: ${err.message}`); });

      const data = await safeJson(res);

      if (!res.ok || data.success === false) { showToast(data.message ?? "Gagal mengganti password", "error"); return; }

      flashSaved("pwd");

      showToast("Password berhasil diganti!", "success");

      setPwd({ current: "", newPwd: "", confirm: "" });

    } catch (err) { handleError(err, "/api/pengaturan/password"); }

    finally       { setSecState("pwd", { saving: false }); }

  };



  // ── Save Notif ────────────────────────────────────────────────────────────

  const handleSaveNotif = async () => {

    setSecState("notif", { saving: true });

    try {

      await postSettings({

        notif_order:     s.notifOrder    ? 1 : 0,

        notif_low_stock: s.notifLowStock ? 1 : 0,

        auto_accept:     s.autoAccept    ? 1 : 0,

      });

      flashSaved("notif");

      showToast("Pengaturan notifikasi disimpan!", "success");

    } catch (err) { handleError(err, "/api/pengaturan"); }

    finally       { setSecState("notif", { saving: false }); }

  };



  const handleSavePajak = async () => {

    const n = Number(s.pajakPersen);

    if (s.pajakPersen === "" || Number.isNaN(n)) {

      showToast("Persen pajak wajib diisi", "error");

      return;

    }

    if (n < 0 || n > 100) {

      showToast("Persen pajak harus 0 - 100", "error");

      return;

    }

    setSecState("pajak", { saving: true });

    try {

      const payload = {

        pajak: n,

      };

      console.log("[PAJAK] PUT /api/pajak/admin payload:", payload);

      const res = await fetch(`${API_URL}/api/pajak/admin`, {

        method: "PUT",

        headers: authHeaders(),

        body: JSON.stringify(payload),

      }).catch(err => { throw new Error(`Tidak bisa terhubung ke server: ${err.message}`); });

      const data = res.status === 204 ? { success: true } : await safeJson(res);

      console.log("[PAJAK] response:", { status: res.status, data });

      if (!res.ok || data.success === false) throw new Error(data.message ?? `HTTP ${res.status}`);

      flashSaved("pajak");

      showToast("Pengaturan pajak disimpan!", "success");

      await fetchSettings(true);

    } catch (err) { handleError(err, "/api/pajak/admin"); }

    finally       { setSecState("pajak", { saving: false }); }

  };



  if (loading) {

    return (

      <div className="flex items-center justify-center py-24 text-gray-400">

        <Loader2 size={28} className="animate-spin mr-3" /> Memuat pengaturan...

      </div>

    );

  }



  return (

    <div className="p-4 lg:p-6 space-y-5">

      <div>

        <h1 className="text-xl lg:text-2xl font-black text-gray-900">Pengaturan</h1>

        <p className="text-gray-400 text-sm">Konfigurasi sistem ASTAKIRA</p>

      </div>



      {/* ── 1. Informasi Kafe ──────────────────────────────────────────────── */}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

        <SectionHeader

          icon={<Coffee size={16} className="text-white" />}

          iconClass="bg-gradient-to-br from-amber-500 to-orange-500"

          title="Informasi Kafe"

        >

          <SaveButton onClick={handleSaveInfo} saving={sec.info.saving} saved={sec.info.saved} label="Simpan Info" />

        </SectionHeader>



        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Logo */}

          <div className="sm:col-span-2">

            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Logo Kafe</label>



            <div className="flex items-center gap-4">

              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">

                <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden relative group transition-colors hover:border-amber-300">

                  <LogoPreview logoPreview={logoPreview} uploadingLogo={uploadingLogo} onRemove={handleRemoveLogo} />

                </div>

                {logoPreview && !uploadingLogo && (

                  <button onClick={handleRemoveLogo}

                    className="text-[10px] text-red-400 hover:text-red-600 font-semibold transition-colors flex items-center gap-0.5">

                    <X size={10} /> Hapus

                  </button>

                )}

              </div>

              <div className="flex-1 space-y-2">

                <div

                  onClick={() => !uploadingLogo && fileRef.current?.click()}

                  onDrop={e => { e.preventDefault(); handleLogoUpload(e.dataTransfer.files?.[0]); }}

                  onDragOver={e => e.preventDefault()}

                  className="border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-all">

                  <Upload size={16} className="text-gray-400 flex-shrink-0" />

                  <div>

                    <p className="text-sm font-semibold text-gray-600">Klik atau drag & drop</p>

                    <p className="text-xs text-gray-400">PNG, JPG · Maks 5MB · Auto-kompres</p>

                  </div>

                </div>

                <input ref={fileRef} type="file" accept="image/*" className="hidden"

                  onChange={e => handleLogoUpload(e.target.files?.[0])} />

              </div>

            </div>

          </div>



          <div>

            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Nama Kafe *</label>

            <input value={s.cafeNama} onChange={e => set("cafeNama", e.target.value)} placeholder="ASTAKIRA"

              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all" />

          </div>



          <div>

            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">

              <span className="flex items-center gap-1"><User size={10} /> Username Admin</span>

            </label>

            <input value={s.username} onChange={e => set("username", e.target.value)} placeholder="admin"

              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all" />

          </div>



          <div>

            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Email</label>

            <input value={s.cafeEmail} onChange={e => set("cafeEmail", e.target.value)}

              placeholder="admin@astakira.id" type="email"

              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all" />

          </div>



          <div className="sm:col-span-2">

            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Alamat</label>

            <textarea value={s.cafeAlamat} onChange={e => set("cafeAlamat", e.target.value)} rows={2}

              placeholder="Jl. Ciakar No.12, Tasikmalaya"

              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all resize-none" />

          </div>

        </div>

      </div>



      {/* ── 2. Tema Warna ──────────────────────────────────────────────────── */}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

        <SectionHeader

          icon={<Palette size={16} className="text-white" />}

          iconClass="bg-gradient-to-br from-purple-500 to-violet-600"

          title="Tema Halaman User"

          subtitle="Ubah tampilan yang dilihat pelanggan"

        >

          <div className="flex items-center gap-2">

            <button onClick={handleResetTema}

              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100">

              <RotateCcw size={12} /> Reset

            </button>

            <SaveButton onClick={handleSaveTema} saving={sec.tema.saving} saved={sec.tema.saved} label="Simpan Tema" />

          </div>

        </SectionHeader>



        <div className="flex bg-gray-100 rounded-xl p-1 mb-4">

          <button onClick={() => setTemaTab("preset")}

            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${temaTab === "preset" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"}`}>

            <Palette size={12} /> Preset

          </button>

          <button onClick={() => setTemaTab("custom")}

            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${temaTab === "custom" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"}`}>

            <Sliders size={12} /> Custom

          </button>

        </div>



        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div>

            {temaTab === "preset" ? (

              <div className="grid grid-cols-2 gap-2">

                {PRESET_TEMA.map((preset) => {

                  const isActive = activePresetId === preset.id;

                  return (

                    <button key={preset.id} onClick={() => handleSelectPreset(preset)}

                      className={`relative p-3 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${isActive ? "border-gray-800 shadow-md" : "border-gray-100 hover:border-gray-300"}`}>

                      <div className="flex gap-1 mb-1.5">

                        <div className="h-4 rounded-full flex-1" style={{ background: preset.primary }} />

                        <div className="h-4 rounded-full flex-1" style={{ background: preset.secondary }} />

                        <div className="h-4 rounded-full flex-1 border border-gray-200" style={{ background: preset.bg }} />

                      </div>

                      <p className="text-xs font-semibold text-gray-700">{preset.nama}</p>

                      {isActive && (

                        <div className="absolute top-2 right-2 w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center">

                          <Check size={9} className="text-white" />

                        </div>

                      )}

                    </button>

                  );

                })}

              </div>

            ) : (

              <div className="space-y-3">

                <ColorRow label="Warna Utama"      colorKey="primary"   value={colors.primary}   onChange={handleColorChange} />

                <ColorRow label="Warna Sekunder"   colorKey="secondary" value={colors.secondary} onChange={handleColorChange} />

                <ColorRow label="Warna Background" colorKey="bg"        value={colors.bg}        onChange={handleColorChange} />

                <ColorRow label="Warna Teks"       colorKey="text"      value={colors.text}      onChange={handleColorChange} />

              </div>

            )}

          </div>

          <div>

            <p className="text-xs font-semibold text-gray-500 mb-2.5 uppercase tracking-wide">Preview</p>

            <HomePreview colors={colors} cafeName={s.cafeNama} />

          </div>

        </div>

      </div>

{/* ── 4. Notifikasi & Otomasi ────────────────────────────────────────── */}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

        <SectionHeader

          icon={<Sliders size={16} className="text-white" />}

          iconClass="bg-gradient-to-br from-gray-700 to-gray-900"

          title="Pajak"

          subtitle="Atur persentase pajak untuk transaksi"

        >

          <SaveButton onClick={handleSavePajak} saving={sec.pajak.saving} saved={sec.pajak.saved} label="Simpan Pajak" />

        </SectionHeader>



        <div className="space-y-4">

          <div>

            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Pajak (%)</label>

            <input

              type="number"

              min={0}

              max={100}

              step={0.1}

              value={s.pajakPersen}

              onChange={(e) => set("pajakPersen", e.target.value)}

              placeholder="10"

              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all"

            />

            <p className="text-[11px] text-gray-400 mt-1">Contoh: 10 = 10% pajak</p>

          </div>

        </div>

      </div>

      {/* ── 3. Ganti Password ──────────────────────────────────────────────── */}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

        <SectionHeader

          icon={<Lock size={16} className="text-white" />}

          iconClass="bg-gradient-to-br from-blue-500 to-indigo-600"

          title="Ganti Password"

        >

          <SaveButton onClick={handleSavePwd} saving={sec.pwd.saving} saved={sec.pwd.saved} label="Ganti Password" />

        </SectionHeader>



        <div className="space-y-3">

          {[

            { k: "current", l: "Password Lama",            ph: "Masukkan password lama" },

            { k: "newPwd",  l: "Password Baru",            ph: "Minimal 6 karakter" },

            { k: "confirm", l: "Konfirmasi Password Baru", ph: "Ulangi password baru" },

          ].map(({ k, l, ph }) => (

            <div key={k}>

              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{l}</label>

              <div className="relative">

                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />

                <input type={showPwd[k] ? "text" : "password"} value={pwd[k]}

                  onChange={e => setPwd_(k, e.target.value)} placeholder={ph}

                  className={`w-full border-2 rounded-xl pl-9 pr-10 py-2.5 text-sm outline-none transition-all ${

                    k === "confirm" && pwd.confirm && pwd.newPwd !== pwd.confirm

                      ? "border-red-300 focus:border-red-500 bg-red-50"

                      : "border-gray-200 focus:border-blue-500"

                  }`} />

                <button type="button" onClick={() => setShowPwd(p => ({ ...p, [k]: !p[k] }))}

                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500">

                  {showPwd[k] ? <EyeOff size={14} /> : <Eye size={14} />}

                </button>

              </div>

              {k === "confirm" && pwd.confirm && pwd.newPwd !== pwd.confirm && (

                <p className="text-[11px] text-red-500 mt-1">Password tidak cocok</p>

              )}

            </div>

          ))}

        </div>

      </div>



      


      

    </div>

  );

}