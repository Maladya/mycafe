import SideBar from "../../Layout/Layouts";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Tag, Hash, Layers, FileText, DollarSign, ImageOff, ChevronRight } from "lucide-react";

export default function DetailMenu() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

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
      setMenu(data.data);
    } catch (error) {
      console.error("Error fetching menu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchingItems();
  }, [id]);

  const formatHarga = (harga) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(harga);

  const getCategoryStyle = (kategori) => {
    switch (kategori) {
      case "Makanan":  return { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-400" };
      case "Minuman":  return { bg: "bg-blue-100",  text: "text-blue-700",  dot: "bg-blue-400"  };
      case "Dessert":  return { bg: "bg-pink-100",  text: "text-pink-700",  dot: "bg-pink-400"  };
      default:         return { bg: "bg-gray-100",  text: "text-gray-600",  dot: "bg-gray-400"  };
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SideBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 font-medium">Memuat data menu...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SideBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-lg">Menu tidak ditemukan.</p>
            <button onClick={() => navigate("/admin/menu/menu")} className="mt-4 btn btn-primary">
              Kembali ke Daftar Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  const cat = getCategoryStyle(menu.kategori?.name);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SideBar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="h-14 bg-white sticky top-0 z-20 flex items-center justify-between px-8 border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span>Admin</span>
            <ChevronRight className="w-3 h-3" />
            <span>Manage Menu</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-blue-600 font-bold">Detail Menu</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin/menu/menu")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </button>
            <button
              onClick={() => navigate(`/admin/menu/editmenu/${id}`)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white shadow-sm hover:shadow-md transition-all"
              style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}
            >
              <Edit className="w-4 h-4" />
              Edit Menu
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto w-full p-8 space-y-6">

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-5">

              {/* Image */}
              <div className="lg:col-span-2 relative min-h-72" style={{ background: "linear-gradient(135deg,#eff6ff,#dbeafe)" }}>
                {menu.foto && !imgError ? (
                  <img
                    src={menu.foto}
                    alt={menu.nama_menu}
                    className="w-full h-full object-cover min-h-72"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-full min-h-72 flex flex-col items-center justify-center text-blue-200 gap-3">
                    <ImageOff className="w-14 h-14" />
                    <p className="text-sm text-blue-300">Tidak ada gambar</p>
                  </div>
                )}
                {/* Category badge */}
                <div className="absolute top-4 left-4">
                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm ${cat.bg} ${cat.text}`}>
                    <span className={`w-2 h-2 rounded-full ${cat.dot}`} />
                    {menu.kategori?.name}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="lg:col-span-3 p-8 flex flex-col justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-1">{menu.nama_menu}</h2>
                  <p className="text-sm text-gray-400 mb-6">ID Menu: #{menu.id || id}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                    {/* Kode Menu */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Hash className="w-4 h-4 text-blue-500" />
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Kode Menu</p>
                      </div>
                      <p className="text-base font-bold text-gray-800">{menu.kode_menu || "-"}</p>
                    </div>

                    {/* Kategori */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Tag className="w-4 h-4 text-blue-500" />
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Kategori</p>
                      </div>
                      <p className="text-base font-bold text-gray-800">{menu.kategori?.name || "-"}</p>
                    </div>

                    {/* Harga */}
                    <div className="rounded-xl p-4 border sm:col-span-2" style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <DollarSign className="w-4 h-4 text-blue-600" />
                        <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide">Harga</p>
                      </div>
                      <p className="text-2xl font-extrabold text-blue-700">{formatHarga(menu.harga)}</p>
                    </div>
                  </div>

                  {/* Deskripsi */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Deskripsi</p>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {menu.deskripsi || <span className="text-gray-400 italic">Tidak ada deskripsi</span>}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sub Kategori */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg" style={{ background: "#eff6ff" }}>
                <Layers className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Sub Kategori</h3>
                <p className="text-sm text-gray-400">
                  {menu.sub_kategori?.length > 0
                    ? `${menu.sub_kategori.length} variasi tersedia`
                    : "Belum ada sub kategori"}
                </p>
              </div>
            </div>

            {menu.sub_kategori && menu.sub_kategori.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {menu.sub_kategori.map((sub, index) => (
                  <div
                    key={sub.id || index}
                    className="flex items-center gap-4 rounded-xl p-4 border transition-all hover:-translate-y-0.5 hover:shadow-sm"
                    style={{ background: "#f8faff", borderColor: "#e0e7ff" }}
                  >
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-blue-50 shadow-sm">
                      {sub.foto ? (
                        <img
                          src={sub.foto}
                          alt={sub.nama_menu}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-blue-200">
                          <ImageOff className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate text-sm">{sub.nama_menu}</p>
                      <p className="text-blue-600 font-bold text-sm mt-0.5">{formatHarga(sub.harga)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-300">
                <Layers className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm text-gray-400">Belum ada sub kategori untuk menu ini</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
