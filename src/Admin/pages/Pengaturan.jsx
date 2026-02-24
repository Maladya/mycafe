import { useState } from "react";
import { Coffee, Clock, Bell, Save } from "lucide-react";
import { useAdmin } from "../AdminPanel";

export default function Pengaturan() {
  const { showToast } = useAdmin();

  const [s, setS] = useState({
    cafeNama:"ASTAKIRA",
    cafeAlamat:"Jl. Ciakar No.12, Tasikmalaya",
    cafePhone:"0812-3456-7890",
    cafeEmail:"admin@astakira.id",
    jamBuka:"07:00",
    jamTutup:"22:00",
    kapasitas:48,
    pajak:0,
    notifOrder:true,
    notifLowStock:true,
    autoAccept:false,
    prepEst:"10–20 menit",
  });

  const set = (k, v) => setS(p => ({ ...p, [k]: v }));

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
          {[
            { k:"cafeNama",  l:"Nama Kafe" },
            { k:"cafePhone", l:"Telepon" },
            { k:"cafeEmail", l:"Email" },
          ].map(({ k, l }) => (
            <div key={k}>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{l}</label>
              <input value={s[k]} onChange={e => set(k, e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all"/>
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Alamat</label>
            <textarea value={s.cafeAlamat} onChange={e => set("cafeAlamat", e.target.value)} rows={2} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all resize-none"/>
          </div>
        </div>
      </div>

      {/* Jam Operasional */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Clock size={16} className="text-white"/>
          </div>
          <h2 className="font-bold text-gray-900">Jam Operasional</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Jam Buka</label>
            <input type="time" value={s.jamBuka} onChange={e => set("jamBuka", e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all"/>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Jam Tutup</label>
            <input type="time" value={s.jamTutup} onChange={e => set("jamTutup", e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all"/>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Kapasitas (kursi)</label>
            <input type="number" value={s.kapasitas} onChange={e => set("kapasitas", e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all"/>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Pajak (%)</label>
            <input type="number" value={s.pajak} onChange={e => set("pajak", e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all"/>
          </div>
        </div>
        <div className="mt-4">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Estimasi Waktu</label>
          <input value={s.prepEst} onChange={e => set("prepEst", e.target.value)} placeholder="10–20 menit" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all"/>
        </div>
      </div>

      {/* Notifikasi */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <Bell size={16} className="text-white"/>
          </div>
          <h2 className="font-bold text-gray-900">Notifikasi & Otomasi</h2>
        </div>
        <div className="space-y-3">
          {[
            { k:"notifOrder",    l:"Notifikasi pesanan masuk",  sub:"Alert saat ada pesanan baru" },
            { k:"notifLowStock", l:"Notifikasi stok habis",     sub:"Alert ketika menu tidak tersedia" },
            { k:"autoAccept",    l:"Auto-terima pesanan",       sub:"Pesanan langsung masuk ke antrian proses" },
          ].map(({ k, l, sub }) => (
            <div key={k} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-semibold text-gray-900">{l}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
              <button onClick={() => set(k, !s[k])} className={`w-12 h-6 rounded-full transition-all duration-300 relative flex-shrink-0 ${s[k]?"bg-amber-500":"bg-gray-200"}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${s[k]?"left-[26px]":"left-0.5"}`}/>
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => showToast("Pengaturan disimpan!", "success")}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2 text-sm"
      >
        <Save size={18}/> Simpan Semua Pengaturan
      </button>
    </div>
  );
}