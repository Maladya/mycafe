import SideBar from "../../Layout/Layouts";
import { useEffect, useState } from "react";
import { X, Coffee, ChevronRight, Plus, Upload, Layers, ImageOff, Save } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useParams } from "react-router-dom";

const inputClass = `
  w-full px-4 py-3 rounded-xl text-sm text-gray-800 border border-gray-200
  focus:outline-none focus:ring-2 focus:border-blue-400 transition-all bg-white
  placeholder-gray-300
`;

export default function EditMenu() {
  const id = useParams().id;

  const [namaMenu,         setNamaMenu]         = useState("");
  const [kodeMenu,         setKodeMenu]         = useState("");
  const [kategori,         setKategori]         = useState("");
  const [deskripsi,        setDeskripsi]        = useState("");
  const [harga,            setHarga]            = useState("");
  const [selectedFile,     setSelectedFile]     = useState(null);
  const [previewUrl,       setPreviewUrl]       = useState("");
  const [subOpen,          setSubOpen]          = useState(false);
  const [subKategoriNama,  setSubKategoriNama]  = useState("");
  const [subKategoriHarga, setSubKategoriHarga] = useState(0);
  const [subKategori,      setSubKategori]      = useState([]);
  const [subGambar,        setSubGambar]        = useState(null);
  const [subPreviewUrl,    setSubPreviewUrl]    = useState("");
  const [loading,          setLoading]          = useState(true);

  const fetchingItems = async () => {
    try {
      const response = await fetch(`http://192.168.1.13:3000/menus/${id}`, {
        method: "GET",
        headers: {
          authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      setNamaMenu(data.data.nama_menu);
      setKodeMenu(data.data.kode_menu);
      setKategori(data.data.kategori);
      setDeskripsi(data.data.deskripsi);
      setHarga(data.data.harga);
      setPreviewUrl(data.data.foto);
      setSubKategori(data.data.sub_kategori || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchingItems();
    console.log(id);
  }, [id]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSubGambar(file);
      const reader = new FileReader();
      reader.onloadend = () => setSubPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSimpanSubKategori = () => {
    const newSubKategori = {
      id: Date.now(),
      nama_menu: subKategoriNama,
      harga: subKategoriHarga,
      foto: subPreviewUrl,
    };
    setSubKategori([...subKategori, newSubKategori]);
    console.log("Simpan subkategori:", newSubKategori);
    setSubOpen(false);
    setSubKategoriNama("");
    setSubKategoriHarga(0);
    setSubGambar(null);
    setSubPreviewUrl("");
  };

  const handleHapusSubKategori = (id) =>
    setSubKategori(subKategori.filter((item) => item.id !== id));

  const handleUpdateMenu = async () => {
    if (!namaMenu || !kodeMenu || !kategori || !harga) {
      toast.error("Mohon lengkapi semua field required");
      return;
    }
    try {
      const response = await fetch(`http://192.168.1.13:3000/menus/${id}`, {
        method: "PUT",
        headers: {
          authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nama_menu: namaMenu,
          kode_menu: kodeMenu,
          kategori,
          deskripsi,
          harga,
          foto: previewUrl,
          sub_kategori: subKategori,
        }),
      });
      const data = await response.json();
      if (data.success === true) {
        toast.success("Menu berhasil diperbarui");
        console.log(`Data Yang Dikirim ${JSON.stringify({ nama_menu: namaMenu, kode_menu: kodeMenu, kategori, deskripsi, harga, foto: previewUrl, sub_kategori: subKategori })}`);
        console.log(`Response dari server: ${JSON.stringify(data)}`);
        setTimeout(() => { window.location.href = "/admin/menu/menu"; }, 1500);
      } else {
        toast.error(data.message || "Gagal memperbarui menu");
      }
    } catch (error) {
      console.error("Error updating menu:", error);
      toast.error("Terjadi kesalahan saat memperbarui menu");
    }
  };

  const formatHarga = (h) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(h);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SideBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 font-medium text-sm">Memuat data menu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Toaster position="top-center" reverseOrder={false} />
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
            <span>Manage Menu</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-blue-600 font-bold">Edit Menu</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">

          {/* ── Page Header ── */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-1">Manage Menu</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-gray-800">Edit Menu</h3>
              <p className="text-gray-400 text-sm mt-1">Perbarui informasi menu yang sudah ada</p>
            </div>
            {/* Nama menu badge */}
            {namaMenu && (
              <div
                className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
              >
                ✏️ {namaMenu}
              </div>
            )}
          </div>

          <div className="max-w-5xl mx-auto space-y-6">

            {/* ── Main Card ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-5">

                {/* Form Section */}
                <div className="lg:col-span-3 p-8 border-r border-gray-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#eff6ff" }}>
                      <span className="text-sm">📋</span>
                    </div>
                    <h2 className="text-base font-bold text-gray-800">Informasi Menu</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Nama Menu */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        Nama Menu <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={namaMenu}
                        onChange={(e) => setNamaMenu(e.target.value)}
                        className={inputClass}
                        placeholder="cth. Es Teh Manis"
                      />
                    </div>

                    {/* Kode Menu */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        Kode Menu <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={kodeMenu}
                        onChange={(e) => setKodeMenu(e.target.value)}
                        className={inputClass}
                        placeholder="cth. MNM-001"
                      />
                    </div>

                    {/* Kategori */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        Kategori <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={kategori}
                        onChange={(e) => setKategori(e.target.value)}
                        className={inputClass}
                        style={{ color: kategori ? "#1f2937" : "#d1d5db" }}
                      >
                        <option value="">Pilih Kategori</option>
                        <option value="Makanan">🍽️ Makanan</option>
                        <option value="Minuman">🥤 Minuman</option>
                        <option value="Dessert">🍰 Dessert</option>
                      </select>
                    </div>

                    {/* Harga */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        Harga (Rp) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        value={harga}
                        onChange={(e) => setHarga(e.target.value)}
                        className={inputClass}
                        placeholder="cth. 15000"
                      />
                      {harga && (
                        <p className="text-xs text-blue-500 font-medium">{formatHarga(harga)}</p>
                      )}
                    </div>
                  </div>

                  {/* Deskripsi */}
                  <div className="space-y-1.5 mt-5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Deskripsi</label>
                    <textarea
                      value={deskripsi}
                      onChange={(e) => setDeskripsi(e.target.value)}
                      className={`${inputClass} h-28 resize-none`}
                      placeholder="Tulis deskripsi singkat tentang menu ini..."
                    />
                  </div>
                </div>

                {/* Image Upload Section */}
                <div className="lg:col-span-2 p-8" style={{ background: "linear-gradient(160deg,#eff6ff,#f0f9ff)" }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(29,78,216,0.1)" }}>
                      <span className="text-sm">🖼️</span>
                    </div>
                    <h3 className="text-base font-bold text-gray-800">Foto Menu</h3>
                  </div>

                  {previewUrl ? (
                    <div className="relative group">
                      <img
                        src={previewUrl.startsWith("data:") ? previewUrl : previewUrl}
                        alt="Preview"
                        className="w-full h-56 object-cover rounded-2xl shadow-md"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                      <button
                        onClick={() => { setPreviewUrl(""); setSelectedFile(null); }}
                        className="absolute top-3 right-3 p-2 rounded-full text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                        style={{ background: "rgba(220,38,38,0.9)" }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      {/* Change photo button */}
                      <label
                        htmlFor="image-upload"
                        className="absolute bottom-3 left-1/2 -translate-x-1/2 cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white opacity-0 group-hover:opacity-100 transition-all"
                        style={{ background: "rgba(29,78,216,0.85)", backdropFilter: "blur(4px)" }}
                      >
                        <Upload className="w-3 h-3" />
                        Ganti Foto
                      </label>
                      <input type="file" onChange={handleFileChange} className="hidden" id="image-upload" accept="image/*" />
                    </div>
                  ) : (
                    <label htmlFor="image-upload" className="cursor-pointer block">
                      <input type="file" onChange={handleFileChange} className="hidden" id="image-upload" accept="image/*" />
                      <div
                        className="h-56 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all"
                        style={{ border: "2px dashed #bfdbfe", background: "rgba(255,255,255,0.6)" }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "#3b82f6"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "#bfdbfe"}
                      >
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "#eff6ff" }}>
                          <Upload className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-gray-600">Klik untuk upload foto</p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG hingga 10MB</p>
                        </div>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* ── Sub Kategori ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#eff6ff" }}>
                    <Layers className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-800">Sub Kategori</h3>
                    <p className="text-xs text-gray-400">
                      {subKategori.length > 0 ? `${subKategori.length} variasi` : "Opsional — tambahkan variasi menu"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSubOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#dbeafe"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#eff6ff"; }}
                >
                  <Plus className="w-4 h-4" />
                  Tambah Variasi
                </button>
              </div>

              {subKategori.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {subKategori.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center gap-3 p-4 rounded-xl border transition-all"
                      style={{ background: "#f8faff", borderColor: "#e0e7ff" }}
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "#eff6ff" }}>
                        {sub.foto ? (
                          <img
                            src={sub.foto.startsWith("data:") ? sub.foto : sub.foto}
                            alt={sub.nama_menu}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageOff className="w-4 h-4 text-blue-200" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">{sub.nama_menu}</p>
                        <p className="text-xs text-blue-600 font-bold mt-0.5">{formatHarga(sub.harga)}</p>
                      </div>
                      <button
                        onClick={() => handleHapusSubKategori(sub.id)}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="text-center py-10 rounded-xl"
                  style={{ background: "#f8faff", border: "1px dashed #e0e7ff" }}
                >
                  <Layers className="w-8 h-8 mx-auto mb-2 text-blue-100" />
                  <p className="text-sm text-gray-400">Belum ada variasi yang ditambahkan</p>
                </div>
              )}
            </div>

            {/* ── Action Buttons ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex gap-4">
                <button
                  onClick={() => (window.location.href = "/admin/menu/menu")}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-600 transition-all border border-gray-200 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleUpdateMenu}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all shadow-sm hover:shadow-md"
                  style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}
                >
                  <Save className="w-4 h-4" />
                  Simpan Perubahan
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Sub Kategori Modal ── */}
      {subOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

            {/* Modal Header */}
            <div className="px-6 py-5 flex items-center justify-between" style={{ background: "linear-gradient(90deg,#eff6ff,#f0f9ff)", borderBottom: "1px solid #e0e7ff" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(29,78,216,0.1)" }}>
                  <Plus className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-base font-bold text-gray-800">Tambah Variasi Menu</h3>
              </div>
              <button
                onClick={() => setSubOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Nama Variasi</label>
                <input
                  type="text"
                  value={subKategoriNama}
                  onChange={(e) => setSubKategoriNama(e.target.value)}
                  className={inputClass}
                  placeholder="cth. Ukuran Besar, Pedas, dll"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Harga (Rp)</label>
                <input
                  type="number"
                  value={subKategoriHarga}
                  onChange={(e) => setSubKategoriHarga(e.target.value)}
                  className={inputClass}
                  placeholder="cth. 5000"
                />
                {subKategoriHarga > 0 && (
                  <p className="text-xs text-blue-500 font-medium">{formatHarga(subKategoriHarga)}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Foto Variasi (Opsional)</label>
                <label htmlFor="sub-image-upload" className="cursor-pointer block">
                  <input type="file" onChange={handleSubFileChange} className="hidden" id="sub-image-upload" accept="image/*" />
                  {subPreviewUrl ? (
                    <img src={subPreviewUrl} alt="Preview" className="w-full h-32 object-cover rounded-xl shadow-sm" />
                  ) : (
                    <div
                      className="h-28 rounded-xl flex flex-col items-center justify-center gap-2 transition-all"
                      style={{ border: "2px dashed #bfdbfe", background: "#f8faff" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "#3b82f6"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "#bfdbfe"}
                    >
                      <Upload className="w-5 h-5 text-blue-300" />
                      <p className="text-xs text-gray-400 font-medium">Klik untuk upload foto</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setSubOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleSimpanSubKategori}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all"
                style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}
              >
                Simpan Variasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}