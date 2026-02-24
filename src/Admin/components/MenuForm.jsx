import { useState } from "react";
import {
  X, Image, Plus, Check, Trash2, FileText,
  Hash, Save
} from "lucide-react";
import { badgeOptions } from "../data/constants";

// ─────────────────────────────────────────────────────────────────────────────
// MENU FORM MODAL — 2 tab: Info Dasar + Varian
// ─────────────────────────────────────────────────────────────────────────────
export default function MenuForm({ item, categories, setCategories, onSave, onCancel }) {
  const [form, setForm] = useState(item ? { ...item } : {
    name:"", tagline:"", description:"",
    category: categories[0] || "coffee",
    price:"", stock:true, badge:"", image:"",
    rating:0, totalReviews:0, sold:0,
    variants:[{ label:"", price:"" }], reviews:[], related:[],
  });

  const [tab,          setTab]          = useState("basic");
  const [newVarLabel,  setNewVarLabel]  = useState("");
  const [newVarPrice,  setNewVarPrice]  = useState("");
  const [catInput,     setCatInput]     = useState("");
  const [showCatInput, setShowCatInput] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addCategory = () => {
    const t = catInput.trim().toLowerCase();
    if (t && !categories.includes(t)) {
      setCategories(prev => [...prev, t]);
      set("category", t);
    }
    setCatInput(""); setShowCatInput(false);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.price) return;
    onSave({ ...form, price: Number(form.price), id: item?.id || Date.now() });
  };

  const tabs = [
    { id:"basic",    label:"Info Dasar", icon:<FileText size={13}/> },
    { id:"variants", label:"Varian",     icon:<Hash size={13}/> },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="font-bold text-white text-lg">{item ? "Edit Menu" : "Tambah Menu Baru"}</h2>
          <button onClick={onCancel} className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all">
            <X size={16}/>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50 flex-shrink-0">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all ${tab===t.id?"border-b-2 border-amber-500 text-amber-600 bg-white":"text-gray-500 hover:text-gray-700"}`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">

          {/* ── TAB: INFO DASAR ── */}
          {tab === "basic" && (
            <>
              {/* Image preview + URL */}
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 flex-shrink-0 bg-gray-50 flex items-center justify-center">
                  {form.image
                    ? <img src={form.image} alt="" className="w-full h-full object-cover"/>
                    : <Image size={24} className="text-gray-300"/>
                  }
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">URL Gambar</label>
                  <input
                    value={form.image}
                    onChange={e => set("image", e.target.value)}
                    placeholder="https://..."
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* Nama */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Nama Menu *</label>
                <input
                  value={form.name}
                  onChange={e => set("name", e.target.value)}
                  placeholder="Nama menu"
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all"
                />
              </div>


              {/* Deskripsi */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Deskripsi</label>
                <textarea
                  value={form.description}
                  onChange={e => set("description", e.target.value)}
                  rows={3}
                  placeholder="Deskripsi lengkap..."
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all resize-none"
                />
              </div>

              {/* Kategori + Harga */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Kategori *</label>
                    <button
                      onClick={() => setShowCatInput(v => !v)}
                      className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5 hover:text-amber-700 transition-all"
                    >
                      <Plus size={10}/> Baru
                    </button>
                  </div>
                  <select
                    value={form.category}
                    onChange={e => set("category", e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all bg-white"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                  {/* Add new category inline */}
                  {showCatInput && (
                    <div className="mt-2 flex gap-1.5">
                      <input
                        value={catInput}
                        onChange={e => setCatInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addCategory()}
                        placeholder="nama kategori..."
                        className="flex-1 border-2 border-amber-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-amber-500 transition-all"
                      />
                      <button onClick={addCategory}                                 className="px-2 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all"><Check size={12}/></button>
                      <button onClick={() => { setShowCatInput(false); setCatInput(""); }} className="px-2 py-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-all"><X size={12}/></button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Harga (Rp) *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => set("price", e.target.value)}
                    placeholder="15000"
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* Badge + Stok */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Badge</label>
                  <select
                    value={form.badge || ""}
                    onChange={e => set("badge", e.target.value || null)}
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all bg-white"
                  >
                    {badgeOptions.map(b => <option key={b} value={b}>{b || "— Tidak Ada —"}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Status Stok</label>
                  <button
                    onClick={() => set("stock", !form.stock)}
                    className={`w-full flex items-center justify-center gap-2 border-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${form.stock?"border-green-500 bg-green-50 text-green-700":"border-red-300 bg-red-50 text-red-600"}`}
                  >
                    {form.stock ? <><Check size={14}/> Tersedia</> : <><X size={14}/> Habis</>}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── TAB: VARIAN ── */}
          {tab === "variants" && (
            <>
              <p className="text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                💡 Varian ditampilkan di halaman detail user (mis. Hot/Iced, Single/Double). Harga dasar diambil dari varian pertama.
              </p>
              <div className="space-y-2">
                {(form.variants || []).map((v, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <input
                        value={v.label}
                        onChange={e => { const u=[...form.variants]; u[i]={...u[i],label:e.target.value}; set("variants",u); }}
                        placeholder="Label (mis. Hot)"
                        className="border-2 border-gray-200 rounded-lg px-2 py-2 text-sm outline-none focus:border-amber-500 transition-all"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400 flex-shrink-0">Rp</span>
                        <input
                          type="number"
                          value={v.price}
                          onChange={e => { const u=[...form.variants]; u[i]={...u[i],price:e.target.value}; set("variants",u); }}
                          placeholder="Harga"
                          className="flex-1 border-2 border-gray-200 rounded-lg px-2 py-2 text-sm outline-none focus:border-amber-500 transition-all"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => set("variants", form.variants.filter((_, idx) => idx !== i))}
                      className="w-8 h-8 bg-red-100 hover:bg-red-200 rounded-lg flex items-center justify-center text-red-500 transition-all flex-shrink-0"
                    >
                      <Trash2 size={14}/>
                    </button>
                  </div>
                ))}
              </div>

              {/* Add variant row */}
              <div className="flex gap-2 pt-1">
                <input
                  value={newVarLabel}
                  onChange={e => setNewVarLabel(e.target.value)}
                  placeholder="Label varian"
                  className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all"
                />
                <input
                  type="number"
                  value={newVarPrice}
                  onChange={e => setNewVarPrice(e.target.value)}
                  placeholder="Harga"
                  className="w-28 border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500 transition-all"
                />
                <button
                  onClick={() => {
                    if (newVarLabel.trim() && newVarPrice) {
                      set("variants", [...(form.variants||[]), { label:newVarLabel.trim(), price:Number(newVarPrice) }]);
                      setNewVarLabel(""); setNewVarPrice("");
                    }
                  }}
                  className="px-3 py-2 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all"
                >
                  <Plus size={16}/>
                </button>
              </div>

              {(!form.variants || form.variants.length === 0) && (
                <div className="text-center py-8 text-gray-400">
                  <Hash size={32} className="mx-auto mb-2 opacity-30"/>
                  <p className="text-sm">Belum ada varian. Tambah di atas.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-3 flex gap-3 border-t border-gray-100 flex-shrink-0">
          <button onClick={onCancel}    className="flex-1 border-2 border-gray-200 text-gray-700 rounded-xl py-3 font-semibold hover:bg-gray-50 transition-all">Batal</button>
          <button onClick={handleSave}  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl py-3 font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
            <Save size={16}/> Simpan Menu
          </button>
        </div>
      </div>
    </div>
  );
}
