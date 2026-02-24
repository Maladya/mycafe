import SideBar from "../../Layout/Layouts";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Coffee, ChevronRight, PencilLine, Tag, CheckCircle2,
  Calendar, Percent, RotateCcw, Save, ArrowLeft,
  Search, X
} from "lucide-react";

export default function EditPromo() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    kode_promo: "",
    status: "Aktif",
    id_menus: [],
    berlaku_sampai: "",
    diskon_persen: "",
  });

  const [menuItems, setMenuItems] = useState([]);
  const [isMenuDropdownOpen, setIsMenuDropdownOpen] = useState(false);
  const [menuSearchQuery, setMenuSearchQuery] = useState("");
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [loadingPromo, setLoadingPromo] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [toastOpen, setToastOpen] = useState(false);

  const fetchPromoData = async () => {
    setLoadingPromo(true);
    try {
      const response = await fetch(`http://192.168.1.13:3000/promos/${id}`, {
        method: "GET",
        headers: {
          authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.success) {
        const promo = data.data;
        setForm({
          kode_promo: promo.kode_promo || "",
          status: promo.status || "Aktif",
          id_menus: promo.menus?.map(m => m.id) || [],
          berlaku_sampai: promo.berlaku_sampai ? promo.berlaku_sampai.split('T')[0] : "",
          diskon_persen: promo.diskon_persen || "",
        });
      }
    } catch (error) {
      console.error("Error fetching promo:", error);
      setToastMessage("Gagal memuat data promo");
      setToastOpen(true);
    } finally {
      setLoadingPromo(false);
    }
  };

  const fetchMenuItems = async () => {
    setLoadingMenus(true);
    try {
      const response = await fetch("http://192.168.1.13:3000/menus", {
        method: "GET",
        headers: {
          authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.success) setMenuItems(data.data);
    } catch (error) {
      console.error("Error fetching menu items:", error);
    } finally {
      setLoadingMenus(false);
    }
  };

  useEffect(() => {
    fetchPromoData();
    fetchMenuItems();
  }, [id]);

  useEffect(() => {
    if (!toastOpen) return;
    const t = setTimeout(() => setToastOpen(false), 2200);
    return () => clearTimeout(t);
  }, [toastOpen]);

  const handlePromoUpdate = async () => {
    try {
      const response = await fetch(`http://192.168.1.13:3000/promos/${id}`, {
        method: "PUT",
        headers: {
          authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (data.success) {
        setToastMessage("Promo berhasil diperbarui");
        setToastOpen(true);
        setTimeout(() => navigate("/admin/promo"), 1500);
      } else {
        setToastMessage(data.message || "Gagal memperbarui promo");
        setToastOpen(true);
      }
    } catch (error) {
      console.error("Error updating promo:", error);
      setToastMessage("Terjadi kesalahan saat memperbarui promo");
      setToastOpen(true);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleMenuSelection = (menuId) => {
    setForm((prev) => {
      const isSelected = prev.id_menus.includes(menuId);
      return {
        ...prev,
        id_menus: isSelected
          ? prev.id_menus.filter(id => id !== menuId)
          : [...prev.id_menus, menuId]
      };
    });
  };

  const removeMenu = (menuId) => {
    setForm((prev) => ({ ...prev, id_menus: prev.id_menus.filter(id => id !== menuId) }));
  };

  const getSelectedMenus = () => menuItems.filter(item => form.id_menus.includes(item.id));

  const calculateDiscountedPrice = (originalPrice, discountPercent) => {
    if (!originalPrice || !discountPercent) return 0;
    return Math.round(originalPrice * (1 - discountPercent / 100));
  };

  const getTotalOriginalPrice = () =>
    getSelectedMenus().reduce((total, menu) => total + (menu.harga || 0), 0);

  const getTotalDiscountedPrice = () => {
    const discountPercent = parseFloat(form.diskon_persen) || 0;
    return getSelectedMenus().reduce((total, menu) =>
      total + calculateDiscountedPrice(menu.harga, discountPercent), 0);
  };

  const filteredMenuItems = menuItems.filter(item =>
    item.nama_menu?.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
    item.kategori?.name?.toLowerCase().includes(menuSearchQuery.toLowerCase())
  );

  const formatCurrency = (val) => {
    const num = parseFloat(val);
    if (!val || isNaN(num)) return "";
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
  };

  const getCategoryStyle = (kategori) => {
    switch (kategori) {
      case "Makanan": return { bg: "#fff7ed", text: "#c2410c", dot: "#fb923c" };
      case "Minuman": return { bg: "#eff6ff", text: "#1d4ed8", dot: "#60a5fa" };
      case "Dessert": return { bg: "#fdf2f8", text: "#be185d", dot: "#f472b6" };
      default: return { bg: "#f9fafb", text: "#374151", dot: "#9ca3af" };
    }
  };

  const labelClass = "block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5";

  if (loadingPromo) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SideBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Memuat data promo...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SideBar />
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Bar */}
        <div className="h-14 bg-white sticky top-0 z-20 flex items-center justify-between px-8 border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 font-black text-lg tracking-tight text-blue-700">
            <Coffee className="w-5 h-5 text-blue-600" />
            <span>MyCafe</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span>Admin</span>
            <ChevronRight className="w-3 h-3" />
            <span>Manage Promo</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-blue-600 font-bold">Edit Promo</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">

          {/* Toast */}
          {toastOpen && (
            <div className="fixed top-6 right-6 z-50">
              <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold ${toastMessage.includes("berhasil") ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
                <CheckCircle2 className="w-4 h-4" />
                <span>{toastMessage}</span>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-1">Manage Promo</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-gray-800">Edit Promo</h3>
              <p className="text-gray-400 text-sm mt-1">Ubah data promo <span className="font-semibold text-gray-600">{form.kode_promo}</span></p>
            </div>
            <button onClick={() => navigate("/admin/promo")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 shadow-sm hover:shadow-md hover:text-blue-600 hover:border-blue-300 transition-all">
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </button>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Card Header */}
            <div className="px-8 py-5 flex items-center gap-3" style={{ background: "linear-gradient(90deg,#eff6ff,#f8faff)", borderBottom: "1px solid #e0e7ff" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
                <PencilLine className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">Edit Data Promo</p>
                <p className="text-xs text-gray-400">Perubahan akan diterapkan setelah disimpan</p>
              </div>
              <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-xl border border-yellow-200" style={{ background: "#fef3c7" }}>
                <Tag className="w-3.5 h-3.5 text-yellow-600" />
                <span className="text-xs font-bold text-yellow-700">{form.kode_promo}</span>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* ── LEFT COLUMN ── */}
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Tag className="w-4 h-4 text-blue-400" />
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Identitas Promo</p>
                  </div>

                  {/* ── 1. Berlaku untuk Menu (PALING ATAS) ── */}
                  <div>
                    <label className={labelClass}>Berlaku untuk Menu <span className="text-red-400">*</span></label>

                    {getSelectedMenus().length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {getSelectedMenus().map((menu) => {
                          const cat = getCategoryStyle(menu.kategori?.name);
                          return (
                            <div key={menu.id} className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg border"
                              style={{ background: cat.bg, borderColor: cat.text + "40" }}>
                              <span className="text-xs font-semibold" style={{ color: cat.text }}>{menu.nama_menu}</span>
                              <button type="button" onClick={() => removeMenu(menu.id)} className="p-0.5 rounded hover:bg-white/50 transition-colors">
                                <X className="w-3 h-3" style={{ color: cat.text }} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <button type="button" onClick={() => setIsMenuDropdownOpen(!isMenuDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all">
                      <span className={form.id_menus.length > 0 ? "text-gray-800" : "text-gray-400"}>
                        {form.id_menus.length > 0 ? `${form.id_menus.length} menu dipilih` : "Pilih menu..."}
                      </span>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isMenuDropdownOpen ? "rotate-90" : ""}`} />
                    </button>

                    {isMenuDropdownOpen && (
                      <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                        <div className="p-3 border-b border-gray-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="text" value={menuSearchQuery} onChange={(e) => setMenuSearchQuery(e.target.value)}
                              placeholder="Cari menu..."
                              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all" />
                          </div>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {loadingMenus ? (
                            <div className="p-8 text-center text-sm text-gray-400">Memuat data menu...</div>
                          ) : filteredMenuItems.length > 0 ? (
                            filteredMenuItems.map((menu) => {
                              const cat = getCategoryStyle(menu.kategori?.name);
                              const isSelected = form.id_menus.includes(menu.id);
                              return (
                                <button key={menu.id} type="button" onClick={() => toggleMenuSelection(menu.id)}
                                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                                  <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0"
                                    style={{ borderColor: isSelected ? "#3b82f6" : "#e5e7eb", background: isSelected ? "#3b82f6" : "white" }}>
                                    {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                                  </div>
                                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ border: "1px solid #e5e7eb" }}>
                                    <img src={menu.foto} alt={menu.nama_menu} className="w-full h-full object-cover"
                                      onError={(e) => { e.target.style.display = "none"; e.target.parentElement.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f3f4f6;color:#9ca3af"><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'/></svg></div>`; }} />
                                  </div>
                                  <div className="flex-1 text-left">
                                    <p className="font-semibold text-sm text-gray-800">{menu.nama_menu}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold"
                                        style={{ background: cat.bg, color: cat.text }}>
                                        <span className="w-1 h-1 rounded-full" style={{ background: cat.dot }} />
                                        {menu.kategori?.name}
                                      </span>
                                      <span className="text-xs font-bold text-blue-600">{formatCurrency(menu.harga)}</span>
                                    </div>
                                  </div>
                                </button>
                              );
                            })
                          ) : (
                            <div className="p-8 text-center text-sm text-gray-400">Tidak ada menu ditemukan</div>
                          )}
                        </div>
                        <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-xs text-gray-500">{form.id_menus.length} menu dipilih</span>
                          <button type="button" onClick={() => setIsMenuDropdownOpen(false)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                            style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
                            Selesai
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── 2. Kode Promo ── */}
                  <div>
                    <label className={labelClass}>Kode Promo <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#fef3c7" }}>
                        <Tag className="w-4 h-4 text-yellow-600" />
                      </div>
                      <input type="text" name="kode_promo" value={form.kode_promo} onChange={handleChange}
                        placeholder="Contoh: PROMO001"
                        className="w-full pl-14 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all placeholder-gray-300" />
                    </div>
                  </div>

                  {/* ── 3. Status (Aktif / Nonaktif) ── */}
                  <div>
                    <label className={labelClass}>Status Promo <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                        <CheckCircle2 className="w-4 h-4 text-gray-400" />
                      </div>
                      <select name="status" value={form.status} onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all appearance-none cursor-pointer">
                        <option value="Aktif">Aktif</option>
                        <option value="Nonaktif">Nonaktif</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronRight className="w-4 h-4 text-gray-300 rotate-90" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                        style={form.status === "Aktif"
                          ? { background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }
                          : { background: "#f9fafb", color: "#6b7280", border: "1px solid #e5e7eb" }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: form.status === "Aktif" ? "#22c55e" : "#9ca3af" }} />
                        Preview: {form.status}
                      </span>
                    </div>
                  </div>

                  {/* ── 4. Berlaku Sampai ── */}
                  <div>
                    <label className={labelClass}>Berlaku Sampai <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                      </div>
                      <input type="date" name="berlaku_sampai" value={form.berlaku_sampai} onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all" />
                    </div>
                  </div>

                  {/* ── 5. Persentase Diskon ── */}
                  <div>
                    <label className={labelClass}>Persentase Diskon (%) <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#fef3c7" }}>
                        <Percent className="w-4 h-4 text-yellow-600" />
                      </div>
                      <input type="number" name="diskon_persen" value={form.diskon_persen} onChange={handleChange}
                        placeholder="Contoh: 20" min="1" max="100"
                        className="w-full pl-14 pr-16 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all placeholder-gray-300" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">%</span>
                    </div>
                    {form.diskon_persen && (
                      <div className="mt-2">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg" style={{ background: "#fef3c7" }}>
                          <Percent className="w-3 h-3 text-yellow-700" />
                          <span className="text-sm font-bold text-yellow-700">{form.diskon_persen}%</span>
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* ── RIGHT COLUMN ── */}
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Percent className="w-4 h-4 text-blue-400" />
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Detail Harga & Diskon</p>
                  </div>

                  {getSelectedMenus().length > 0 && (
                    <div>
                      <label className={labelClass}>Harga Menu yang Dipilih</label>
                      <div className="space-y-3">
                        {getSelectedMenus().map((menu) => {
                          const originalPrice = menu.harga || 0;
                          const discountPercent = parseFloat(form.diskon_persen) || 0;
                          const discountedPrice = calculateDiscountedPrice(originalPrice, discountPercent);
                          return (
                            <div key={menu.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold text-gray-700">{menu.nama_menu}</p>
                                {discountPercent > 0 && (
                                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg" style={{ background: "#fef3c7" }}>
                                    <Percent className="w-2.5 h-2.5 text-yellow-700" />
                                    <span className="text-xs font-bold text-yellow-700">{discountPercent}%</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs text-gray-400">Harga Asli</p>
                                  <p className="text-sm font-bold text-gray-500 line-through">{formatCurrency(originalPrice)}</p>
                                </div>
                                {discountPercent > 0 && (
                                  <>
                                    <ChevronRight className="w-4 h-4 text-gray-300" />
                                    <div>
                                      <p className="text-xs text-gray-400">Harga Diskon</p>
                                      <p className="text-sm font-bold text-emerald-600">{formatCurrency(discountedPrice)}</p>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {getSelectedMenus().length > 0 && (
                    <div>
                      <label className={labelClass}>Total Harga</label>
                      <div className="p-4 rounded-xl border-2 border-blue-200" style={{ background: "#eff6ff" }}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Total Harga Asli</p>
                            <p className="text-lg font-bold text-gray-600 line-through">{formatCurrency(getTotalOriginalPrice())}</p>
                          </div>
                          {form.diskon_persen && (
                            <>
                              <ChevronRight className="w-5 h-5 text-blue-300" />
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Total Setelah Diskon</p>
                                <p className="text-lg font-bold text-emerald-600">{formatCurrency(getTotalDiscountedPrice())}</p>
                              </div>
                            </>
                          )}
                        </div>
                        {form.diskon_persen && (
                          <div className="pt-3 border-t border-blue-200">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">Total Penghematan</span>
                              <span className="font-bold text-emerald-600">{formatCurrency(getTotalOriginalPrice() - getTotalDiscountedPrice())}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(form.kode_promo || form.diskon_persen || form.id_menus.length > 0) && (
                    <div className="rounded-xl p-4 border border-blue-100" style={{ background: "#eff6ff" }}>
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-3">Preview Perubahan</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#fef3c7" }}>
                          <Tag className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-800 text-sm">{form.kode_promo || "—"}</p>
                          <p className="text-xs text-gray-400">{form.id_menus.length > 0 ? `${form.id_menus.length} menu dipilih` : "Belum ada menu"}</p>
                        </div>
                        {form.diskon_persen && (
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg" style={{ background: "#fef3c7" }}>
                            <Percent className="w-3 h-3 text-yellow-700" />
                            <span className="text-sm font-bold text-yellow-700">{form.diskon_persen}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

              </div>

              <div className="my-8 border-t border-gray-100" />

              <div className="flex items-center justify-between">
                <button type="button" onClick={() => navigate("/admin/promo")}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 shadow-sm hover:shadow-md hover:text-blue-600 hover:border-blue-300 transition-all">
                  <ArrowLeft className="w-4 h-4" />
                  Kembali
                </button>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={fetchPromoData}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-red-500 bg-white border border-red-200 shadow-sm hover:bg-red-50 hover:shadow-md transition-all">
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                  <button type="button" onClick={handlePromoUpdate}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all"
                    style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
                    <Save className="w-4 h-4" />
                    Simpan Perubahan
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}