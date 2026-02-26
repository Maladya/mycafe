import { useState, useEffect } from "react";
import { Plus, Tag, Edit3, Trash2, Gift, Save, X, CalendarCheck, CalendarX, Calendar, Loader2 } from "lucide-react";
import { todayStr, isPromoActive, getPromoStatus } from "../data/constants";
import { useAdmin } from "../AdminPanel";
import { ConfirmDialog } from "../components/SharedComponents";

// FIX: IP diperbaiki dari .13 ke .3
const API_URL = import.meta.env.VITE_API_URL ?? "http://192.168.1.3:3000";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const emptyForm = {
  code: "", discountType: "persen", discountValue: "",
  minOrder: "", startDate: todayStr, endDate: "",
};

export default function KelolaPromo() {
  const { showToast } = useAdmin();

  const [promos,     setPromos]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editPromo,  setEditPromo]  = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [form,       setForm]       = useState(emptyForm);

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // FIX: toDate dipindah ke atas agar bisa dipakai di openEdit
  // Potong ISO date jadi YYYY-MM-DD
  const toDate = (v) => v ? String(v).slice(0, 10) : "";

  // ── Fetch semua promo ────────────────────────────────────────────────────
  const fetchPromos = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/promo`, { headers: authHeaders() });
      const data = await res.json();
      console.log("Fetch promo:", data);
      setPromos(data.data ?? data.promos ?? data ?? []);
    } catch (err) {
      console.error("Fetch promo error:", err);
      showToast("Gagal memuat data promo", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPromos(); }, []);

  // ── Buka form ────────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm(emptyForm);
    setEditPromo(null);
    setShowForm(true);
  };

  const openEdit = (p) => {
    console.log("Edit promo data:", p);
    setForm({
      code:          p.kode_promo    ?? p.code          ?? p.kode          ?? "",
      discountType:  (() => { const t = p.tipe_diskon ?? p.discountType ?? p.discount_type; return (t === 0 || t === "0" || t === "persen" || t === "percent") ? "persen" : "nominal"; })(),
      discountValue: p.nilai         ?? p.discountValue ?? p.discount_value ?? "",
      minOrder:      p.minimum_order ?? p.minOrder      ?? p.min_order      ?? "",
      startDate:     toDate(p.mulai_date    ?? p.startDate  ?? p.start_date) || todayStr,
      endDate:       toDate(p.berakhir_date ?? p.endDate    ?? p.end_date)   || "",
    });
    setEditPromo(p);
    setShowForm(true);
  };

  // ── Simpan (tambah / edit) ───────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.code.trim() || !form.discountValue || !form.endDate) {
      if (!form.code.trim())    showToast("Kode promo wajib diisi!", "error");
      else if (!form.discountValue) showToast("Nilai diskon wajib diisi!", "error");
      else if (!form.endDate)       showToast("Tanggal berakhir wajib diisi!", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        kode_promo:    form.code.toUpperCase(),
        tipe_diskon:   form.discountType === "persen" ? 0 : 1,
        nilai:         Number(form.discountValue),
        minimum_order: Number(form.minOrder || 0),
        mulai_date:    form.startDate,
        berakhir_date: form.endDate,
      };

      const isEdit = !!editPromo;
      const res = await fetch(
        isEdit ? `${API_URL}/api/promo/${editPromo.id}` : `${API_URL}/api/promo`,
        { method: isEdit ? "PUT" : "POST", headers: authHeaders(), body: JSON.stringify(payload) }
      );
      const data = await res.json();
      console.log("Save promo response:", data);

      if (!res.ok || data.success === false) {
        showToast(data.message ?? "Gagal menyimpan promo", "error");
        return;
      }

      await fetchPromos();
      showToast(isEdit ? "Promo diupdate!" : "Promo ditambahkan!", "success");
      setShowForm(false);
    } catch (err) {
      console.error("Save promo error:", err);
      showToast("Gagal terhubung ke server", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Hapus ────────────────────────────────────────────────────────────────
  const handleDel = async (id) => {
    setDeleting(true);
    try {
      const res  = await fetch(`${API_URL}/api/promo/${id}`, {
        method: "DELETE", headers: authHeaders(),
      });
      const data = await res.json();

      if (!res.ok || data.success === false) {
        showToast(data.message ?? "Gagal menghapus promo", "error");
        return;
      }

      await fetchPromos();
      showToast("Promo dihapus!", "success");
    } catch (err) {
      console.error("Delete promo error:", err);
      showToast("Gagal terhubung ke server", "error");
    } finally {
      setDeleting(false);
      setConfirmDel(null);
    }
  };

  // ── Helper ───────────────────────────────────────────────────────────────
  const isPersen = (p) => {
    const t = p.tipe_diskon ?? p.discountType ?? p.discount_type;
    return t === 0 || t === "0" || t === "persen" || t === "percent";
  };

  const getDiscount = (p) => {
    const value = p.nilai ?? p.discountValue ?? p.discount_value;
    if (!value) return "-";
    return isPersen(p) ? `${value}%` : `Rp${Number(value).toLocaleString("id-ID")}`;
  };

  const getCode      = (p) => p.kode_promo    ?? p.code      ?? p.kode      ?? "-";
  const getMinOrder  = (p) => Number(p.minimum_order ?? p.minOrder ?? p.min_order ?? 0) || 0;
  const getStartDate = (p) => toDate(p.mulai_date    ?? p.startDate  ?? p.start_date) || "-";
  const getEndDate   = (p) => toDate(p.berakhir_date ?? p.endDate    ?? p.end_date)   || "-";

  const normPromo = (p) => ({
    ...p,
    code:          getCode(p),
    discountType:  isPersen(p) ? "persen" : "nominal",
    discountValue: p.nilai         ?? p.discountValue ?? p.discount_value,
    minOrder:      getMinOrder(p),
    startDate:     getStartDate(p),
    endDate:       getEndDate(p),
    discount:      getDiscount(p),
    used:          p.used ?? 0,
  });

  const activeCount = promos.filter(p => isPromoActive(normPromo(p))).length;

  const formPreview = () => {
    if (!form.startDate || !form.endDate) return null;
    if (form.startDate <= todayStr && todayStr <= form.endDate)
      return { cls:"bg-green-50 border-green-200", iconCls:"text-green-600", msg:"✓ Promo akan langsung aktif saat disimpan" };
    if (todayStr < form.startDate)
      return { cls:"bg-blue-50 border-blue-200", iconCls:"text-blue-500", msg:`⏳ Akan aktif mulai ${form.startDate}` };
    return { cls:"bg-gray-50 border-gray-200", iconCls:"text-gray-400", msg:"✕ Tanggal berakhir sudah lewat" };
  };
  const preview = formPreview();

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-gray-900">Kelola Promo</h1>
          <p className="text-gray-400 text-sm">
            {activeCount} aktif · {promos.reduce((s, p) => s + (p.used ?? 0), 0)} total penggunaan
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl px-4 py-2.5 font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all text-sm"
        >
          <Plus size={16}/> Tambah Promo
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-start gap-3">
        <CalendarCheck size={18} className="text-purple-500 flex-shrink-0 mt-0.5"/>
        <div>
          <p className="font-semibold text-purple-900 text-sm">Promo otomatis aktif/nonaktif sesuai tanggal</p>
          <p className="text-purple-600 text-xs mt-0.5">Hari ini: <span className="font-bold">{todayStr}</span></p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 size={32} className="animate-spin mr-3"/> Memuat promo...
        </div>
      )}

      {/* Grid promo */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {promos.map(raw => {
            const promo  = normPromo(raw);
            const status = getPromoStatus(promo);
            const active = isPromoActive(promo);
            return (
              <div key={promo.id} className={`bg-white rounded-2xl border-2 shadow-sm p-4 transition-all ${active ? "border-purple-200" : "border-gray-100 opacity-70"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${active ? "bg-gradient-to-br from-purple-500 to-pink-500" : "bg-gray-200"}`}>
                      <Tag size={16} className={active ? "text-white" : "text-gray-400"}/>
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-sm font-mono tracking-wide">{promo.code}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${status.color}`}>{status.icon} {status.label}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-purple-600 text-xl leading-none">{promo.discount}</p>
                    <p className="text-[10px] text-gray-400">diskon</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-2.5 mb-3 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <CalendarCheck size={11} className="text-green-500"/>
                    <span>Mulai: <span className="font-semibold text-gray-700">{promo.startDate}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <CalendarX size={11} className="text-red-400"/>
                    <span>Berakhir: <span className="font-semibold text-gray-700">{promo.endDate}</span></span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400 mb-3">
                  <span>Min. Rp{(promo.minOrder ?? 0).toLocaleString("id-ID")}</span>
                  <span>{promo.used}× digunakan</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(raw)} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 rounded-xl text-xs font-bold transition-all">
                    <Edit3 size={12}/> Edit
                  </button>
                  <button onClick={() => setConfirmDel(promo.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-500 rounded-xl text-xs font-bold transition-all">
                    <Trash2 size={12}/> Hapus
                  </button>
                </div>
              </div>
            );
          })}
          {promos.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-400">
              <Gift size={40} className="mx-auto mb-3 opacity-30"/>
              <p className="font-semibold">Belum ada kode promo</p>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 flex items-center justify-between">
              <h2 className="font-bold text-white text-lg">{editPromo ? "Edit Kode Promo" : "Tambah Kode Promo"}</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white"><X size={16}/></button>
            </div>
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Kode Promo <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.code}
                  onChange={e => setF("code", e.target.value.toUpperCase())}
                  placeholder="ASTAKIRA10"
                  className={`w-full border-2 rounded-xl px-3 py-2.5 text-sm font-mono font-bold outline-none transition-all ${
                    !form.code.trim() ? "border-red-300 focus:border-red-500 bg-red-50" : "border-gray-200 focus:border-purple-500"
                  }`}
                />
                {!form.code.trim() && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium">Kode promo wajib diisi</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Tipe Diskon</label>
                  <select value={form.discountType} onChange={e => setF("discountType", e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500 transition-all bg-white">
                    <option value="persen">Persen (%)</option>
                    <option value="nominal">Nominal (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Nilai *</label>
                  <input type="number" value={form.discountValue} onChange={e => setF("discountValue", e.target.value)} placeholder={form.discountType === "persen" ? "10" : "5000"} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500 transition-all"/>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Minimum Order (Rp)</label>
                <input type="number" value={form.minOrder} onChange={e => setF("minOrder", e.target.value)} placeholder="20000" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500 transition-all"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    <span className="flex items-center gap-1"><CalendarCheck size={11} className="text-green-500"/> Mulai *</span>
                  </label>
                  <input type="date" value={form.startDate} onChange={e => setF("startDate", e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500 transition-all"/>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    <span className="flex items-center gap-1"><CalendarX size={11} className="text-red-400"/> Berakhir *</span>
                  </label>
                  <input type="date" value={form.endDate} onChange={e => setF("endDate", e.target.value)} min={form.startDate} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500 transition-all"/>
                </div>
              </div>
              {preview && (
                <div className={`rounded-xl px-3 py-2.5 flex items-center gap-2 border ${preview.cls}`}>
                  <Calendar size={14} className={preview.iconCls}/>
                  <p className="text-xs font-semibold">{preview.msg}</p>
                </div>
              )}
            </div>
            <div className="px-6 pb-6 pt-3 flex gap-3 border-t border-gray-100">
              <button onClick={() => setShowForm(false)} className="flex-1 border-2 border-gray-200 text-gray-700 rounded-xl py-3 font-semibold hover:bg-gray-50 transition-all">Batal</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl py-3 font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                {saving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDel && (
        <ConfirmDialog
          msg="Yakin hapus kode promo ini?"
          loading={deleting}
          onConfirm={() => handleDel(confirmDel)}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}