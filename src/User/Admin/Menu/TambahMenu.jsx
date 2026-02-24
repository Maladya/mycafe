import SideBar from "../../Layout/Layouts";
import { useEffect, useState } from "react";
import { X, Coffee, ChevronRight, Plus, Upload, Layers, ImageOff, Tag } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const inputClass = `
  w-full px-4 py-3 rounded-xl text-sm text-gray-800 border border-gray-200
  focus:outline-none focus:ring-2 focus:border-blue-400 transition-all bg-white
  placeholder-gray-300
`;

export default function TambahMenu() {
  const [namaMenu,       setNamaMenu]       = useState("");
  const [kodeMenu,       setKodeMenu]       = useState("");
  const [kategori,       setKategori]       = useState([]);
  const [deskripsi,      setDeskripsi]      = useState("");
  const [harga,          setHarga]          = useState("");
  const [selectedFile,   setSelectedFile]   = useState(null);
  const [previewUrl,     setPreviewUrl]     = useState("");
  const [subOpen,        setSubOpen]        = useState(false);
  const [subKategoriNama,  setSubKategoriNama]  = useState("");
  const [subKategoriHarga, setSubKategoriHarga] = useState(0);
  const [subKategori,    setSubKategori]    = useState([]);
  const [subGambar,      setSubGambar]      = useState(null);
  const [subPreviewUrl,  setSubPreviewUrl]  = useState("");
  
  // State untuk kategori
  const [kategoriOpen,   setKategoriOpen]   = useState(false);
  const [kategoriList,   setKategoriList]   = useState([]);
  const [namaKategoriBaru, setNamaKategoriBaru] = useState("");

 const handleKategoriBaru = async () => {
    try {
      const response = await fetch("http://192.168.1.13:3000/kategoris", {
        method: "POST",
        headers: {
          authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: namaKategoriBaru,
        }),
      });
      const data = await response.json();
      if (data.success === true) {
        toast.success("Kategori berhasil ditambahkan");
        setTimeout(() => { window.location.href = "/admin/menu/tambahmenu"; }, 1000);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const fetchKategoriItems = async () => {
    try {
      const response = await fetch("http://192.168.1.13:3000/kategoris", {
        method: "GET",
        headers: {
          authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      console.log("Data kategori dari server:", data.data);
      setKategoriList(data.data);
    } catch (error) {
      console.error("Error fetching kategori items:", error);
    }
  };

  const handleSubKategori = async () => {
    try {
      const response = await fetch("http://192.168.1.13:3000/sub=kategoris", {
        method: "POST",
        headers: {
          authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: namaSubKategoriBaru,
        }),
      });
      const data = await response.json();
      if (data.success === true) {
        toast.success("Kategori berhasil ditambahkan");
        setTimeout(() => { window.location.href = "/admin/menu/tambahmenu"; }, 1000);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
    }
  };
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

  useEffect(() => {
    fetchKategoriItems();
  }, []);

  const handleSimpanSubKategori = () => {
    const newSubKategori = {
      id: Date.now(),
      nama_menu: subKategoriNama,
      harga: subKategoriHarga,
      foto: subPreviewUrl,
    };
    setSubKategori([...subKategori, newSubKategori]);
    setSubOpen(false);
    setSubKategoriNama("");
    setSubKategoriHarga(0);
    setSubGambar(null);
    setSubPreviewUrl("");
  };

  const handleSimpanKategori = () => {

    
    const newKategori = {
      id: Date.now(),
      nama: namaKategoriBaru,
    };
    
    setKategoriList([...kategoriList, newKategori]);
    setKategori(namaKategoriBaru);
    setKategoriOpen(false);
    setNamaKategoriBaru("");
    toast.success("Kategori baru berhasil ditambahkan");
  };

  const handleHapusSubKategori = (id) => setSubKategori(subKategori.filter(item => item.id !== id));

  const handleTambahMenu = async () => {
    try {
      const response = await fetch("http://192.168.1.13:3000/menus", {
        method: "POST",
        headers: {
          authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nama_menu: namaMenu,
          kode_menu: kodeMenu,
          id_kategori: kategoriList.find(k => k.name === kategori)?.id || 0,
          deskripsi,
          sub_kategori: subKategori,
          harga,
          foto: previewUrl,
        }),
      });
      const data = await response.json();
      if (data.success === true) {
        toast.success("Menu berhasil ditambahkan");
        setTimeout(() => { window.location.href = "/admin/menu/menu"; }, 1000);
      } else {
        toast.error(data.message);
        console.log(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const formatHarga = (h) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(h);

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
            <span className="text-blue-600 font-bold">Tambah Menu</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">
          {/* ── Page Title ── */}
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-1">Manage Menu</p>
            <h3 className="text-3xl font-extrabold tracking-tight text-gray-800">Tambah Menu Baru</h3>
            <p className="text-gray-400 text-sm mt-1">Isi informasi menu yang ingin ditambahkan</p>
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
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Nama Menu</label>
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
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Kode Menu</label>
                      <input
                        type="text"
                        value={kodeMenu}
                        onChange={(e) => setKodeMenu(e.target.value)}
                        className={inputClass}
                        placeholder="cth. MNM-001"
                      />
                    </div>

                    {/* Kategori dengan Tombol Tambah */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Kategori</label>
                      <div className="flex gap-2">
                        <select
                          value={kategori}
                          onChange={(e) => setKategori(e.target.value)}
                          className={`${inputClass} flex-1`}
                          style={{ color: kategori ? "#1f2937" : "#d1d5db" }}
                        >
                          <option value="">Pilih Kategori</option>
                          {kategoriList.map((kat) => (
                            <option key={kat.id} value={kat.nama}>
                               {kat.nama || kat.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => setKategoriOpen(true)}
                          className="px-3 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 flex-shrink-0"
                          style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
                          onMouseEnter={e => { e.currentTarget.style.background="#dbeafe"; }}
                          onMouseLeave={e => { e.currentTarget.style.background="#eff6ff"; }}
                          title="Tambah Kategori Baru"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Harga */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Harga (Rp)</label>
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
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-56 object-cover rounded-2xl shadow-md"
                      />
                      <button
                        onClick={() => { setPreviewUrl(""); setSelectedFile(null); }}
                        className="absolute top-3 right-3 p-2 rounded-full text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                        style={{ background: "rgba(220,38,38,0.9)" }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="mt-3 text-center">
                        <p className="text-xs text-blue-500 font-medium">Foto berhasil dipilih ✓</p>
                      </div>
                    </div>
                  ) : (
                    <label htmlFor="image-upload" className="cursor-pointer block">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        id="image-upload"
                        accept="image/*"
                      />
                      <div
                        className="h-56 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all"
                        style={{
                          border: "2px dashed #bfdbfe",
                          background: "rgba(255,255,255,0.6)",
                        }}
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

            {/* ── Sub Kategori Section ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#eff6ff" }}>
                    <Layers className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-800">Sub Kategori</h3>
                    <p className="text-xs text-gray-400">
                      {subKategori.length > 0 ? `${subKategori.length} variasi ditambahkan` : "Opsional — tambahkan variasi menu"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSubOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
                  onMouseEnter={e => { e.currentTarget.style.background="#dbeafe"; }}
                  onMouseLeave={e => { e.currentTarget.style.background="#eff6ff"; }}
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
                          <img src={sub.foto} alt={sub.nama_menu} className="w-full h-full object-cover" />
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
                  onClick={handleTambahMenu}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all shadow-sm hover:shadow-md"
                  style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}
                >
                  Simpan Menu
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Modal Tambah Kategori ── */}
      {kategoriOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

            {/* Modal Header */}
            <div className="px-6 py-5 flex items-center justify-between" style={{ background: "linear-gradient(90deg,#eff6ff,#f0f9ff)", borderBottom: "1px solid #e0e7ff" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(29,78,216,0.1)" }}>
                  <Tag className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-base font-bold text-gray-800">Tambah Kategori Baru</h3>
              </div>
              <button
                onClick={() => setKategoriOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Nama Kategori</label>
                <input
                  type="text"
                  value={namaKategoriBaru}
                  onChange={(e) => setNamaKategoriBaru(e.target.value)}
                  className={inputClass}
                  placeholder="cth. Snack, Appetizer, dll"
                />
              </div>

              
            </div>

            {/* Modal Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setKategoriOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleKategoriBaru}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all"
                style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}
              >
                Simpan Kategori
              </button>
            </div>
          </div>
        </div>
      )}

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
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Harga Tambahan (Rp)</label>
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
                  <input
                    type="file"
                    onChange={handleSubFileChange}
                    className="hidden"
                    id="sub-image-upload"
                    accept="image/*"
                  />
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