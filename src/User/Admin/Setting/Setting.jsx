import SideBar from "../../Layout/Layouts";
import { useState } from "react";
import {
  Coffee, ChevronRight, Store, Clock, Palette, Package,
  Upload, Save, X, Check, MapPin, Phone, Mail, Globe,
  Sun, Moon, CheckCircle2, XCircle, Crown, Zap, Building2,
  ChevronDown, Bell, Shield, LogOut, Camera, Trash2, User
} from "lucide-react";

const daysOfWeek = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

const themeColors = [
  { id: "blue",   name: "Biru Laut",  primary: "#1d4ed8", accent: "#3b82f6", preview: ["#1d4ed8","#3b82f6","#eff6ff"] },
  { id: "emerald",name: "Hijau Daun", primary: "#059669", accent: "#10b981", preview: ["#059669","#10b981","#ecfdf5"] },
  { id: "purple", name: "Ungu",       primary: "#7c3aed", accent: "#8b5cf6", preview: ["#7c3aed","#8b5cf6","#f5f3ff"] },
  { id: "rose",   name: "Merah Mawar",primary: "#e11d48", accent: "#f43f5e", preview: ["#e11d48","#f43f5e","#fff1f2"] },
  { id: "amber",  name: "Emas",       primary: "#b45309", accent: "#f59e0b", preview: ["#b45309","#f59e0b","#fffbeb"] },
];

const packages = [
  {
    id: "basic", name: "Basic", price: "Gratis", period: "selamanya",
    icon: Zap, color: "#6b7280",
    features: [
      { label: "Kelola Menu", ok: true },
      { label: "Kelola Meja", ok: true },
      { label: "Kelola Promo", ok: false },
      { label: "Laporan Penjualan", ok: false },
      { label: "Multi Kasir", ok: false },
    ],
  },
  {
    id: "premium", name: "Premium", price: "Rp 199.000", period: "per bulan",
    icon: Crown, color: "#1d4ed8", recommended: true,
    features: [
      { label: "Kelola Menu", ok: true },
      { label: "Kelola Meja", ok: true },
      { label: "Kelola Promo", ok: true },
      { label: "Laporan Penjualan", ok: false },
      { label: "Multi Kasir", ok: false },
    ],
  },
  {
    id: "enterprise", name: "Enterprise", price: "Rp 499.000", period: "per bulan",
    icon: Building2, color: "#7c3aed",
    features: [
      { label: "Kelola Menu", ok: true },
      { label: "Kelola Meja", ok: true },
      { label: "Kelola Promo", ok: true },
      { label: "Laporan Penjualan", ok: true },
      { label: "Multi Kasir", ok: true },
    ],
  },
];

const tabs = [
  { id: "profile", label: "Profile Admin",    icon: User },
  { id: "info",   label: "Info Kafe",       icon: Store },
  { id: "hours",  label: "Jam Operasional", icon: Clock },
  { id: "theme",  label: "Tema",            icon: Palette },
  { id: "package",label: "Paket",           icon: Package },
  { id: "notif",  label: "Notifikasi",      icon: Bell },
  { id: "account",label: "Keamanan",        icon: Shield },
];

export default function Setting() {
  const [activeTab, setActiveTab]     = useState("profile");
  const [cafeName, setCafeName]       = useState("MyCafe");
  const [address, setAddress]         = useState("Jl. Kopi No. 123, Jakarta");
  const [phone, setPhone]             = useState("+62 812 3456 7890");
  const [email, setEmail]             = useState("hello@mycafe.id");
  const [website, setWebsite]         = useState("www.mycafe.id");
  const [selectedTheme, setSelectedTheme] = useState("blue");
  const [logo, setLogo]               = useState(null);
  const [activePackage, setActivePackage] = useState("premium");
  const [toastMsg, setToastMsg]       = useState("");
  const [toastOpen, setToastOpen]     = useState(false);

  // Profile Admin State
  const [adminName, setAdminName]     = useState("Admin");
  const [adminEmail, setAdminEmail]   = useState("mahesa@gmail.com");
  const [adminPhone, setAdminPhone]   = useState("+62 812 3456 7890");
  const [adminPhoto, setAdminPhoto]   = useState("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDMgKRG2DbqpXvwrc1CHCqHWoG2P1IoUysPA&s");
  const [adminRole, setAdminRole]     = useState("Super Admin");

  const [notif, setNotif] = useState({
    orderBaru: true, promoExpired: true, laporanHarian: false, updateSistem: true,
  });

  const [operatingHours, setOperatingHours] = useState({
    Senin:   { open: "08:00", close: "22:00", isOpen: true },
    Selasa:  { open: "08:00", close: "22:00", isOpen: true },
    Rabu:    { open: "08:00", close: "22:00", isOpen: true },
    Kamis:   { open: "08:00", close: "22:00", isOpen: true },
    Jumat:   { open: "08:00", close: "23:00", isOpen: true },
    Sabtu:   { open: "08:00", close: "23:00", isOpen: true },
    Minggu:  { open: "10:00", close: "22:00", isOpen: false },
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 2200);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setLogo(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAdminPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setAdminPhoto(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleHourChange = (day, field, value) =>
    setOperatingHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));

  const currentTheme = themeColors.find((t) => t.id === selectedTheme);
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
            <span className="text-blue-600 font-bold">Pengaturan</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">

          {/* Toast */}
          {toastOpen && (
            <div className="fixed top-6 right-6 z-50">
              <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold bg-emerald-500 text-white">
                <CheckCircle2 className="w-4 h-4" />
                <span>{toastMsg}</span>
              </div>
            </div>
          )}

          {/* ── Page Header ── */}
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-1">Admin</p>
            <h3 className="text-3xl font-extrabold tracking-tight text-gray-800">Pengaturan</h3>
            <p className="text-gray-400 text-sm mt-1">Kelola informasi dan preferensi kafe Anda</p>
          </div>

          <div className="flex gap-6">

            {/* ── Sidebar Tabs ── */}
            <div className="w-56 shrink-0">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 sticky top-22">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mb-0.5"
                      style={active
                        ? { background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", color: "#fff", boxShadow: "0 2px 8px rgba(29,78,216,0.25)" }
                        : { color: "#6b7280" }}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{tab.label}</span>
                      {active && <ChevronRight className="w-3 h-3 ml-auto" />}
                    </button>
                  );
                })}

                {/* Divider */}
                <div className="my-2 border-t border-gray-100" />
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-50 transition-all">
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            {/* ── Content ── */}
            <div className="flex-1 min-w-0">

              {/* ════ PROFILE ADMIN ════ */}
              {activeTab === "profile" && (
                <div className="space-y-6">
                  {/* Profile Card */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-8 py-5 flex items-center gap-3" style={{ background: "linear-gradient(90deg,#eff6ff,#f8faff)", borderBottom: "1px solid #e0e7ff" }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">Profile Admin</p>
                        <p className="text-xs text-gray-400">Kelola informasi akun admin</p>
                      </div>
                    </div>

                    <div className="p-8">
                      {/* Photo Upload */}
                      <div className="flex items-center gap-6 mb-8 p-5 rounded-2xl border border-dashed border-gray-200 bg-gray-50">
                        <div className="relative shrink-0">
                          <div className="w-24 h-24 rounded-2xl border-2 border-gray-200 bg-white flex items-center justify-center overflow-hidden shadow-sm">
                            {adminPhoto
                              ? <img src={adminPhoto} alt="Admin" className="w-full h-full object-cover" />
                              : <User className="w-10 h-10 text-blue-300" />
                            }
                          </div>
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="font-bold text-gray-700 text-sm mb-1">Foto Profile</p>
                          <p className="text-xs text-gray-400 mb-3">PNG, JPG maks. 2MB. Rekomendasi 200×200px</p>
                          <label className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 cursor-pointer hover:bg-blue-100 transition-all w-fit">
                            <Camera className="w-4 h-4" />
                            Unggah Foto
                            <input type="file" accept="image/*" onChange={handleAdminPhotoUpload} className="hidden" />
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <div>
                          <label className={labelClass}>Nama Lengkap <span className="text-red-400">*</span></label>
                          <input type="text" value={adminName} onChange={(e) => setAdminName(e.target.value)} className={inputClass} placeholder="Nama lengkap admin" />
                        </div>
                        <div>
                          <label className={labelClass}>Role / Jabatan</label>
                          <select value={adminRole} onChange={(e) => setAdminRole(e.target.value)} className={inputClass}>
                            <option value="Super Admin">Super Admin</option>
                            <option value="Admin">Admin</option>
                            <option value="Kasir">Kasir</option>
                            <option value="Manajer">Manajer</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Email <span className="text-red-400">*</span></label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all placeholder-gray-300" placeholder="email@admin.com" />
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>Nomor Telepon</label>
                          <div className="relative">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="text" value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all placeholder-gray-300" placeholder="+62..." />
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-end gap-3">
                        <button onClick={() => {}} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition-all">
                          <X className="w-4 h-4" /> Batal
                        </button>
                        <button onClick={() => showToast("Profile admin berhasil disimpan")} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all" style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
                          <Save className="w-4 h-4" /> Simpan Profile
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ════ INFO KAFE ════ */}
              {activeTab === "info" && (
                <div className="space-y-6">
                  {/* Logo + Nama */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-8 py-5 flex items-center gap-3" style={{ background: "linear-gradient(90deg,#eff6ff,#f8faff)", borderBottom: "1px solid #e0e7ff" }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
                        <Store className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">Profil Kafe</p>
                        <p className="text-xs text-gray-400">Logo, nama, dan kontak kafe</p>
                      </div>
                    </div>

                    <div className="p-8">
                      {/* Logo Upload */}
                      <div className="flex items-center gap-6 mb-8 p-5 rounded-2xl border border-dashed border-gray-200 bg-gray-50">
                        <div className="relative shrink-0">
                          <div className="w-24 h-24 rounded-2xl border-2 border-gray-200 bg-white flex items-center justify-center overflow-hidden shadow-sm">
                            {logo
                              ? <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                              : <Coffee className="w-10 h-10 text-blue-300" />
                            }
                          </div>
                          {logo && (
                            <button
                              onClick={() => setLogo(null)}
                              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-700 text-sm mb-1">Logo Kafe</p>
                          <p className="text-xs text-gray-400 mb-3">PNG, JPG, SVG maks. 2MB. Rekomendasi 200×200px</p>
                          <label className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 cursor-pointer hover:bg-blue-100 transition-all w-fit">
                            <Camera className="w-4 h-4" />
                            Unggah Logo
                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <div>
                          <label className={labelClass}>Nama Kafe <span className="text-red-400">*</span></label>
                          <input type="text" value={cafeName} onChange={(e) => setCafeName(e.target.value)} className={inputClass} placeholder="Nama kafe Anda" />
                        </div>
                        <div>
                          <label className={labelClass}>Nomor Telepon</label>
                          <div className="relative">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all placeholder-gray-300" placeholder="+62..." />
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>Email</label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all placeholder-gray-300" placeholder="email@kafe.id" />
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>Website</label>
                          <div className="relative">
                            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all placeholder-gray-300" placeholder="www.kafe.id" />
                          </div>
                        </div>
                        <div className="lg:col-span-2">
                          <label className={labelClass}>Alamat Lengkap <span className="text-red-400">*</span></label>
                          <div className="relative">
                            <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all placeholder-gray-300 resize-none" placeholder="Jl. ..." />
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-end gap-3">
                        <button onClick={() => {}} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition-all">
                          <X className="w-4 h-4" /> Batal
                        </button>
                        <button onClick={() => showToast("Informasi kafe berhasil disimpan")} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all" style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
                          <Save className="w-4 h-4" /> Simpan
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ════ JAM OPERASIONAL ════ */}
              {activeTab === "hours" && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-8 py-5 flex items-center gap-3" style={{ background: "linear-gradient(90deg,#eff6ff,#f8faff)", borderBottom: "1px solid #e0e7ff" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">Jam Operasional</p>
                      <p className="text-xs text-gray-400">Atur waktu buka dan tutup setiap hari</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-bold text-emerald-600">
                        {Object.values(operatingHours).filter(d => d.isOpen).length} hari buka
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="space-y-2">
                      {daysOfWeek.map((day, i) => {
                        const isWeekend = day === "Sabtu" || day === "Minggu";
                        return (
                          <div key={day} className="flex items-center gap-4 px-5 py-4 rounded-2xl transition-all" style={{ background: operatingHours[day]?.isOpen ? "#f8faff" : "#f9fafb", border: `1px solid ${operatingHours[day]?.isOpen ? "#e0e7ff" : "#f1f5f9"}` }}>
                            {/* Day name */}
                            <div className="w-20 shrink-0">
                              <p className="text-sm font-bold text-gray-700">{day}</p>
                              {isWeekend && <p className="text-xs text-blue-400">Weekend</p>}
                            </div>

                            {/* Toggle */}
                            <button
                              onClick={() => handleHourChange(day, "isOpen", !operatingHours[day]?.isOpen)}
                              className="relative w-11 h-6 rounded-full transition-all shrink-0"
                              style={{ background: operatingHours[day]?.isOpen ? "linear-gradient(135deg,#1d4ed8,#3b82f6)" : "#d1d5db" }}
                            >
                              <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all" style={{ left: operatingHours[day]?.isOpen ? "calc(100% - 22px)" : "2px" }} />
                            </button>

                            <span className="text-xs font-semibold w-8 shrink-0" style={{ color: operatingHours[day]?.isOpen ? "#1d4ed8" : "#9ca3af" }}>
                              {operatingHours[day]?.isOpen ? "Buka" : "Tutup"}
                            </span>

                            {operatingHours[day]?.isOpen ? (
                              <div className="flex items-center gap-3 flex-1">
                                <div className="flex items-center gap-2">
                                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                                  <input type="time" value={operatingHours[day]?.open} onChange={(e) => handleHourChange(day, "open", e.target.value)} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all" />
                                </div>
                                <span className="text-gray-300 font-bold">—</span>
                                <div className="flex items-center gap-2">
                                  <Moon className="w-3.5 h-3.5 text-blue-400" />
                                  <input type="time" value={operatingHours[day]?.close} onChange={(e) => handleHourChange(day, "close", e.target.value)} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all" />
                                </div>
                                <span className="ml-2 text-xs text-gray-400">
                                  ({Math.abs(parseInt(operatingHours[day]?.close) - parseInt(operatingHours[day]?.open))} jam)
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 italic">Libur</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-3">
                      <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition-all">
                        <X className="w-4 h-4" /> Batal
                      </button>
                      <button onClick={() => showToast("Jam operasional berhasil disimpan")} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all" style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
                        <Save className="w-4 h-4" /> Simpan
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ════ TEMA WARNA ════ */}
              {activeTab === "theme" && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-8 py-5 flex items-center gap-3" style={{ background: "linear-gradient(90deg,#eff6ff,#f8faff)", borderBottom: "1px solid #e0e7ff" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
                      <Palette className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">Tema Warna</p>
                      <p className="text-xs text-gray-400">Pilih warna utama tampilan aplikasi</p>
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                      {themeColors.map((theme) => {
                        const active = selectedTheme === theme.id;
                        return (
                          <button
                            key={theme.id}
                            onClick={() => setSelectedTheme(theme.id)}
                            className="relative p-4 rounded-2xl border-2 text-left transition-all hover:shadow-md"
                            style={active ? { borderColor: theme.primary, boxShadow: `0 0 0 4px ${theme.preview[2]}` } : { borderColor: "#e5e7eb" }}
                          >
                            {active && (
                              <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: theme.primary }}>
                                <Check className="w-3.5 h-3.5 text-white" />
                              </div>
                            )}
                            {/* Color blocks */}
                            <div className="flex gap-2 mb-4">
                              <div className="h-12 flex-1 rounded-xl" style={{ background: theme.primary }} />
                              <div className="h-12 w-12 rounded-xl" style={{ background: theme.accent }} />
                              <div className="h-12 w-12 rounded-xl border border-gray-100" style={{ background: theme.preview[2] }} />
                            </div>
                            <p className="font-bold text-gray-800 text-sm">{theme.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{theme.primary}</p>
                          </button>
                        );
                      })}
                    </div>

                    {/* Live preview */}
                    <div className="rounded-2xl overflow-hidden border border-gray-200">
                      <div className="px-5 py-3 flex items-center justify-between" style={{ background: currentTheme.primary }}>
                        <div className="flex items-center gap-2">
                          <Coffee className="w-4 h-4 text-white" />
                          <span className="font-bold text-white text-sm">{cafeName || "MyCafe"}</span>
                        </div>
                        <span className="text-xs text-white opacity-70">Preview Tema</span>
                      </div>
                      <div className="p-5" style={{ background: currentTheme.preview[2] }}>
                        <div className="flex gap-3">
                          {["Dashboard","Menu","Promo"].map((item, i) => (
                            <div key={item} className="px-4 py-2 rounded-xl text-xs font-bold" style={i === 0 ? { background: currentTheme.primary, color: "#fff" } : { background: "white", color: currentTheme.primary, border: `1px solid ${currentTheme.accent}` }}>
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-3">
                      <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition-all">
                        <X className="w-4 h-4" /> Batal
                      </button>
                      <button onClick={() => showToast("Tema berhasil diterapkan")} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all" style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
                        <Palette className="w-4 h-4" /> Terapkan Tema
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ════ PAKET AKTIF ════ */}
              {activeTab === "package" && (
                <div className="space-y-6">
                  {/* Current package banner */}
                  <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-blue-200 font-semibold uppercase tracking-wider">Paket Anda Saat Ini</p>
                      <p className="text-xl font-extrabold text-white">Premium</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-blue-200">Berlaku hingga</p>
                      <p className="text-sm font-bold text-white">31 Des 2025</p>
                    </div>
                  </div>

                  {/* Package cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {packages.map((pkg) => {
                      const Icon = pkg.icon;
                      const active = activePackage === pkg.id;
                      return (
                        <div key={pkg.id} className="bg-white rounded-2xl border-2 overflow-hidden transition-all hover:shadow-md" style={{ borderColor: active ? pkg.color : "#e5e7eb" }}>
                          {pkg.recommended && (
                            <div className="py-1.5 text-center text-xs font-bold text-white" style={{ background: pkg.color }}>
                              ⭐ Direkomendasikan
                            </div>
                          )}
                          <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${pkg.color}15` }}>
                                <Icon className="w-5 h-5" style={{ color: pkg.color }} />
                              </div>
                              <div>
                                <p className="font-extrabold text-gray-800">{pkg.name}</p>
                                <p className="text-xs text-gray-400">{pkg.period}</p>
                              </div>
                            </div>
                            <p className="text-2xl font-extrabold text-gray-800 mb-1">{pkg.price}</p>
                            <div className="my-4 border-t border-gray-100" />
                            <ul className="space-y-2.5 mb-6">
                              {pkg.features.map((f) => (
                                <li key={f.label} className="flex items-center gap-2.5">
                                  {f.ok
                                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    : <XCircle className="w-4 h-4 text-gray-300 shrink-0" />}
                                  <span className="text-sm" style={{ color: f.ok ? "#374151" : "#9ca3af" }}>{f.label}</span>
                                </li>
                              ))}
                            </ul>
                            <button
                              onClick={() => { setActivePackage(pkg.id); showToast(`Paket ${pkg.name} dipilih`); }}
                              className="w-full py-2.5 rounded-xl text-sm font-bold transition-all"
                              style={active
                                ? { background: pkg.color, color: "#fff", boxShadow: `0 4px 12px ${pkg.color}40` }
                                : { background: "#f9fafb", color: "#6b7280", border: "1px solid #e5e7eb" }}
                            >
                              {active ? "✓ Paket Aktif" : pkg.id === "basic" ? "Pilih" : "Upgrade"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ════ NOTIFIKASI ════ */}
              {activeTab === "notif" && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-8 py-5 flex items-center gap-3" style={{ background: "linear-gradient(90deg,#eff6ff,#f8faff)", borderBottom: "1px solid #e0e7ff" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">Preferensi Notifikasi</p>
                      <p className="text-xs text-gray-400">Atur notifikasi yang ingin Anda terima</p>
                    </div>
                  </div>
                  <div className="p-8 space-y-4">
                    {[
                      { key: "orderBaru",     label: "Order Baru",           desc: "Notifikasi saat ada pesanan masuk" },
                      { key: "promoExpired",  label: "Promo Akan Berakhir",  desc: "Pengingat H-3 sebelum promo habis" },
                      { key: "laporanHarian", label: "Laporan Harian",       desc: "Ringkasan penjualan setiap malam" },
                      { key: "updateSistem",  label: "Update Sistem",        desc: "Informasi pembaruan aplikasi" },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 rounded-2xl" style={{ background: notif[item.key] ? "#f8faff" : "#f9fafb", border: `1px solid ${notif[item.key] ? "#e0e7ff" : "#f1f5f9"}` }}>
                        <div>
                          <p className="text-sm font-bold text-gray-700">{item.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                        </div>
                        <button
                          onClick={() => setNotif((p) => ({ ...p, [item.key]: !p[item.key] }))}
                          className="relative w-11 h-6 rounded-full transition-all shrink-0"
                          style={{ background: notif[item.key] ? "linear-gradient(135deg,#1d4ed8,#3b82f6)" : "#d1d5db" }}
                        >
                          <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all" style={{ left: notif[item.key] ? "calc(100% - 22px)" : "2px" }} />
                        </button>
                      </div>
                    ))}
                    <div className="mt-6 flex items-center justify-end gap-3">
                      <button onClick={() => showToast("Preferensi notifikasi disimpan")} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all" style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
                        <Save className="w-4 h-4" /> Simpan
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ════ KEAMANAN ════ */}
              {activeTab === "account" && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-8 py-5 flex items-center gap-3" style={{ background: "linear-gradient(90deg,#eff6ff,#f8faff)", borderBottom: "1px solid #e0e7ff" }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">Keamanan Akun</p>
                        <p className="text-xs text-gray-400">Ubah password dan pengaturan keamanan</p>
                      </div>
                    </div>
                    <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-5">
                      <div>
                        <label className={labelClass}>Password Lama</label>
                        <input type="password" className={inputClass} placeholder="••••••••" />
                      </div>
                      <div />
                      <div>
                        <label className={labelClass}>Password Baru</label>
                        <input type="password" className={inputClass} placeholder="••••••••" />
                      </div>
                      <div>
                        <label className={labelClass}>Konfirmasi Password</label>
                        <input type="password" className={inputClass} placeholder="••••••••" />
                      </div>
                      <div className="lg:col-span-2 flex items-center justify-end gap-3 pt-2">
                        <button onClick={() => showToast("Password berhasil diubah")} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all" style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
                          <Save className="w-4 h-4" /> Ubah Password
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Danger zone */}
                  <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
                    <div className="px-8 py-5" style={{ borderBottom: "1px solid #fee2e2", background: "#fff5f5" }}>
                      <p className="font-bold text-red-600 text-sm">Zona Berbahaya</p>
                      <p className="text-xs text-red-400">Tindakan ini tidak dapat dibatalkan</p>
                    </div>
                    <div className="p-8 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-700">Hapus Akun</p>
                        <p className="text-xs text-gray-400 mt-0.5">Semua data kafe akan dihapus permanen</p>
                      </div>
                      <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-red-500 bg-white border border-red-200 hover:bg-red-50 transition-all">
                        <Trash2 className="w-4 h-4" /> Hapus Akun
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
