import { useState, useEffect, useRef } from "react";
import { Coffee, Bell, Save, Upload, Image, Loader2, User, Lock, Eye, EyeOff } from "lucide-react";
import { useAdmin } from "../AdminPanel";

const API_URL = import.meta.env.VITE_API_URL ?? "http://192.168.1.3:3000";

const authHeaders = (json = true) => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  ...(json ? { "Content-Type": "application/json" } : {}),
});

// ── Helper: pastikan response adalah JSON, bukan HTML error page ──────────────
const safeJson = async (res) => {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    console.error(
      `[safeJson] Bukan JSON (HTTP ${res.status}). Respons awal:\n`,
      text.slice(0, 500)
    );
    throw new Error(
      `Server mengembalikan ${res.status} bukan JSON. ` +
      `Kemungkinan endpoint tidak ditemukan atau server mati. ` +
      `Cek: API_URL="${API_URL}"`
    );
  }
  return res.json();
};

// ── Helper toast error terpusat ───────────────────────────────────────────────
const makeErrorHandler = (showToast) => (err, endpoint = "") => {
  if (err.message.includes("Tidak bisa terhubung")) {
    showToast(`Server tidak dapat dihubungi. Cek apakah backend aktif di ${API_URL}`, "error");
  } else if (err.message.includes("bukan JSON")) {
    showToast(`Endpoint ${endpoint} tidak ditemukan di server`, "error");
  } else if (err.message.includes("401") || err.message.includes("403")) {
    showToast("Sesi habis, silakan login ulang", "error");
  } else {
    showToast(`Error: ${err.message}`, "error");
  }
};

export default function Pengaturan() {
  const { showToast } = useAdmin();
  const handleError = makeErrorHandler(showToast);

  const [s, setS] = useState({
    cafeNama:     "",   // table: cafe      kolom: nama_cafe
    cafeAlamat:   "",   // table: cafe      kolom: alamat
    logo_kafe:    "",   // table: cafe      kolom: logo_cafe
    username:     "",   // table: admins    kolom: username
    cafeEmail:    "",   // table: admins    kolom: email
    notifOrder:     true,
    notifLowStock:  true,
    autoAccept:     false,
  });

  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [logoPreview,   setLogoPreview]   = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileRef = useRef();

  // ── State ganti password ──────────────────────────────────────────────────
  const [pwd,       setPwd]       = useState({ current: "", newPwd: "", confirm: "" });
  const [showPwd,   setShowPwd]   = useState({ current: false, newPwd: false, confirm: false });
  const [savingPwd, setSavingPwd] = useState(false);

  const set     = (k, v) => setS(p => ({ ...p, [k]: v }));
  const setPwd_ = (k, v) => setPwd(p => ({ ...p, [k]: v }));

  // ── Fix URL gambar (handle IP lama) ──────────────────────────────────────
  const fixImgUrl = (url) => {
    if (!url?.trim() || url.startsWith("data:")) return url;
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

  // ── Fetch pengaturan dari API ─────────────────────────────────────────────
  // Backend harus mengembalikan gabungan tabel cafe + admins, contoh:
  // {
  //   "nama_cafe": "...",   "logo_cafe": "...",  "alamat": "...",   ← dari table cafe
  //   "username": "...",    "email": "..."                          ← dari table admins
  // }
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/pengaturan`, {
          headers: authHeaders(),
        }).catch((err) => {
          throw new Error(`Tidak bisa terhubung ke server: ${err.message}`);
        });

        const data = await safeJson(res);
        console.log("Fetch pengaturan:", data);

        // Ambil dari data.data / data.settings / root langsung
        const d = data.data ?? data.settings ?? data ?? {};

        setS(prev => ({
          ...prev,
          // ── table: cafe ──────────────────────────────────────
          cafeNama:     d.nama_cafe  ?? prev.cafeNama,
          cafeAlamat:   d.alamat     ?? prev.cafeAlamat,
          logo_kafe:    d.logo_cafe  ?? prev.logo_kafe,
          // ── table: admins ────────────────────────────────────
          username:     d.username   ?? prev.username,
          cafeEmail:    d.email      ?? prev.cafeEmail,
          // ── variats / pengaturan lain ─────────────────────────
          notifOrder:    Boolean(d.notif_order     ?? prev.notifOrder),
          notifLowStock: Boolean(d.notif_low_stock ?? prev.notifLowStock),
          autoAccept:    Boolean(d.auto_accept     ?? prev.autoAccept),
        }));

        if (d.logo_cafe) setLogoPreview(fixImgUrl(d.logo_cafe));

      } catch (err) {
        console.error("Fetch pengaturan error:", err);
        handleError(err, "/api/pengaturan");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // ── Upload logo (base64) ──────────────────────────────────────────────────
  const handleLogoUpload = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { showToast("File harus berupa gambar", "error"); return; }
    if (file.size > 2 * 1024 * 1024)    { showToast("Ukuran logo maksimal 2MB", "error"); return; }

    setUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      set("logo_kafe", base64);
      setLogoPreview(base64);
      setUploadingLogo(false);
    };
    reader.onerror = () => { showToast("Gagal membaca file", "error"); setUploadingLogo(false); };
    reader.readAsDataURL(file);
  };

  // ── Ganti password (table: admins, kolom: password) ───────────────────────
  const handleSavePwd = async () => {
    if (!pwd.current)               { showToast("Password lama wajib diisi", "error"); return; }
    if (!pwd.newPwd)                { showToast("Password baru wajib diisi", "error"); return; }
    if (pwd.newPwd.length < 6)      { showToast("Password baru minimal 6 karakter", "error"); return; }
    if (pwd.newPwd !== pwd.confirm) { showToast("Konfirmasi password tidak cocok", "error"); return; }

    setSavingPwd(true);
    try {
      const res = await fetch(`${API_URL}/api/pengaturan/password`, {
        method:  "PUT",
        headers: authHeaders(),
        body:    JSON.stringify({
          password_lama: pwd.current,   // kolom: password (lama, untuk verifikasi)
          password_baru: pwd.newPwd,    // kolom: password (baru)
          konfirmasi:    pwd.confirm,
        }),
      }).catch((err) => {
        throw new Error(`Tidak bisa terhubung ke server: ${err.message}`);
      });

      const data = await safeJson(res);
      console.log("Save password response:", data);

      if (!res.ok || data.success === false) {
        showToast(data.message ?? "Gagal mengganti password", "error");
        return;
      }

      showToast("Password berhasil diganti!", "success");
      setPwd({ current: "", newPwd: "", confirm: "" });
    } catch (err) {
      console.error("Save password error:", err);
      handleError(err, "/api/pengaturan/password");
    } finally {
      setSavingPwd(false);
    }
  };

  // ── Simpan ke API ─────────────────────────────────────────────────────────
  // Backend harus UPDATE dua tabel sekaligus:
  //   UPDATE cafe SET nama_cafe=?, logo_cafe=?, alamat=?
  //   UPDATE admins SET username=?, email=? WHERE id=?
  const handleSave = async () => {
    if (!s.cafeNama.trim()) { showToast("Nama kafe wajib diisi", "error"); return; }

    setSaving(true);
    try {
      const payload = {
        // ── table: cafe ──────────────────────────────────────
        nama_cafe:       s.cafeNama,
        logo_cafe:       s.logo_kafe  ?? null,
        alamat:          s.cafeAlamat,
        // ── table: admins ────────────────────────────────────
        username:        s.username,
        email:           s.cafeEmail,
        // ── variats / pengaturan lain ─────────────────────────
        notif_order:     s.notifOrder    ? 1 : 0,
        notif_low_stock: s.notifLowStock ? 1 : 0,
        auto_accept:     s.autoAccept    ? 1 : 0,
      };

      const res = await fetch(`${API_URL}/api/pengaturan`, {
        method:  "POST",
        headers: authHeaders(),
        body:    JSON.stringify(payload),
      }).catch((err) => {
        throw new Error(`Tidak bisa terhubung ke server: ${err.message}`);
      });

      const data = await safeJson(res);
      console.log("Save pengaturan response:", data);

      if (!res.ok || data.success === false) {
        showToast(data.message ?? "Gagal menyimpan pengaturan", "error");
        return;
      }

      showToast("Pengaturan disimpan!", "success");
    } catch (err) {
      console.error("Save pengaturan error:", err);
      handleError(err, "/api/pengaturan");
    } finally {
      setSaving(false);
    }
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

          {/* Logo Kafe — kolom: cafe.logo_cafe */}
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Logo Kafe</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl border-2 border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                {uploadingLogo ? (
                  <Loader2 size={20} className="text-amber-400 animate-spin"/>
                ) : logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="w-full h-full object-cover"
                    onError={e => { e.currentTarget.style.display = "none"; }}
                  />
                ) : (
                  <Image size={24} className="text-gray-300"/>
                )}
              </div>
              <div className="flex-1">
                <div
                  onClick={() => !uploadingLogo && fileRef.current?.click()}
                  onDrop={e => { e.preventDefault(); handleLogoUpload(e.dataTransfer.files?.[0]); }}
                  onDragOver={e => e.preventDefault()}
                  className="border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-all"
                >
                  <Upload size={16} className="text-gray-400 flex-shrink-0"/>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Klik atau drag & drop</p>
                    <p className="text-xs text-gray-400">PNG, JPG · Maks 2MB</p>
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleLogoUpload(e.target.files?.[0])}/>
                <input
                  value={s.logo_kafe?.startsWith("data:") ? "" : (s.logo_kafe ?? "")}
                  onChange={e => { set("logo_kafe", e.target.value); setLogoPreview(e.target.value); }}
                  placeholder="Atau masukkan URL logo..."
                  className="mt-2 w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500 transition-all text-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Nama Kafe — kolom: cafe.nama_cafe */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Nama Kafe *</label>
            <input
              value={s.cafeNama}
              onChange={e => set("cafeNama", e.target.value)}
              placeholder="ASTAKIRA"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all"
            />
          </div>

          {/* Username — kolom: admins.username */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
              <span className="flex items-center gap-1"><User size={10}/> Username Admin</span>
            </label>
            <input
              value={s.username}
              onChange={e => set("username", e.target.value)}
              placeholder="admin"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all"
            />
          </div>

          {/* Email — kolom: admins.email */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Email</label>
            <input
              value={s.cafeEmail}
              onChange={e => set("cafeEmail", e.target.value)}
              placeholder="admin@astakira.id"
              type="email"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all"
            />
          </div>

          {/* Alamat — kolom: cafe.alamat */}
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Alamat</label>
            <textarea
              value={s.cafeAlamat}
              onChange={e => set("cafeAlamat", e.target.value)}
              rows={2}
              placeholder="Jl. Ciakar No.12, Tasikmalaya"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all resize-none"
            />
          </div>

        </div>
      </div>

      {/* Ganti Password — kolom: admins.password */}
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
                <input
                  type={showPwd[k] ? "text" : "password"}
                  value={pwd[k]}
                  onChange={e => setPwd_(k, e.target.value)}
                  placeholder={ph}
                  className={`w-full border-2 rounded-xl pl-9 pr-10 py-2.5 text-sm outline-none transition-all ${
                    k === "confirm" && pwd.confirm && pwd.newPwd !== pwd.confirm
                      ? "border-red-300 focus:border-red-500 bg-red-50"
                      : "border-gray-200 focus:border-blue-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => ({ ...p, [k]: !p[k] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                >
                  {showPwd[k] ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
              </div>
              {k === "confirm" && pwd.confirm && pwd.newPwd !== pwd.confirm && (
                <p className="text-[11px] text-red-500 mt-1">Password tidak cocok</p>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={handleSavePwd}
          disabled={savingPwd}
          className="mt-4 w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-bold shadow hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60"
        >
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
              <button
                onClick={() => set(k, !s[k])}
                className={`w-12 h-6 rounded-full transition-all duration-300 relative flex-shrink-0 ${s[k] ? "bg-amber-500" : "bg-gray-200"}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${s[k] ? "left-[26px]" : "left-0.5"}`}/>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Simpan */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:scale-100"
      >
        {saving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>}
        {saving ? "Menyimpan..." : "Simpan Semua Pengaturan"}
      </button>
    </div>
  );
}