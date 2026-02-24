import SideBar from "../../Layout/Layouts";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Coffee, ChevronRight, Tag, CheckCircle2, XCircle,
  Calendar, Percent, TrendingDown, PencilLine, ArrowLeft,
  Utensils, Coffee as DrinkIcon, Loader2, UtensilsCrossed, IceCream
} from "lucide-react";

export default function DetailPromo() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [promo, setPromo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPromo = async () => {
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
          setPromo(data.data);
        } else {
          setError("Data promo tidak ditemukan.");
        }
      } catch (err) {
        console.error("Error fetching promo:", err);
        setError("Gagal memuat data promo.");
      } finally {
        setLoading(false);
      }
    };

    fetchPromo();
  }, [id]);

  const formatCurrency = (amount) => {
    const num = parseFloat(amount);
    if (!amount || isNaN(num)) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(dateString));
  };

  const getMenuPrice = (menu) => menu.harga || menu.price || menu.harga_menu || 0;

  const calculateTotalOriginalPrice = (menus) => {
    if (!menus || !Array.isArray(menus) || menus.length === 0) return 0;
    return menus.reduce((total, menu) => total + parseFloat(getMenuPrice(menu)), 0);
  };

  const calculateTotalDiscountedPrice = (menus, discountPercent) => {
    if (!menus || !Array.isArray(menus) || menus.length === 0) return 0;
    const totalOriginal = calculateTotalOriginalPrice(menus);
    const discount = parseFloat(discountPercent) || 0;
    return Math.round(totalOriginal * (1 - discount / 100));
  };

  const getUniqueCategories = (menus) => {
    if (!menus || !Array.isArray(menus)) return [];
    return [...new Set(menus.map((m) => m.kategori?.name).filter(Boolean))];
  };

  const getCategoryStyle = (kategori) => {
    switch (kategori) {
      case "Makanan": return { bg: "#fff7ed", text: "#c2410c", dot: "#fb923c", border: "#fed7aa" };
      case "Minuman": return { bg: "#eff6ff", text: "#1d4ed8", dot: "#60a5fa", border: "#bfdbfe" };
      case "Dessert": return { bg: "#fdf2f8", text: "#be185d", dot: "#f472b6", border: "#fbcfe8" };
      default: return { bg: "#f9fafb", text: "#374151", dot: "#9ca3af", border: "#e5e7eb" };
    }
  };

  const getCategoryIcon = (kategori) => {
    switch (kategori) {
      case "Makanan": return <Utensils className="w-3.5 h-3.5" />;
      case "Minuman": return <DrinkIcon className="w-3.5 h-3.5" />;
      case "Dessert": return <IceCream className="w-3.5 h-3.5" />;
      default: return <UtensilsCrossed className="w-3.5 h-3.5" />;
    }
  };

  const DetailRow = ({ label, value, children }) => (
    <div className="flex items-start gap-4 py-3.5" style={{ borderBottom: "1px solid #f1f5f9" }}>
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 w-40 shrink-0 mt-0.5">{label}</p>
      <p className="text-xs text-gray-300 mt-0.5">:</p>
      {children ?? <p className="text-sm font-semibold text-gray-700">{value}</p>}
    </div>
  );

  // ── Loading State ──
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SideBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            <p className="text-sm font-medium">Memuat data promo...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error / Not Found State ──
  if (error || !promo) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SideBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-gray-400">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "#eff6ff" }}>
              <UtensilsCrossed className="w-8 h-8 text-blue-200" />
            </div>
            <p className="text-sm font-medium">{error || "Data tidak ditemukan"}</p>
            <button
              onClick={() => navigate("/admin/promo")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 shadow-sm hover:text-blue-600 hover:border-blue-300 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Daftar Promo
            </button>
          </div>
        </div>
      </div>
    );
  }

  const uniqueCategories = getUniqueCategories(promo.menus);
  const totalOriginalPrice = calculateTotalOriginalPrice(promo.menus);
  const totalDiscountedPrice = calculateTotalDiscountedPrice(promo.menus, promo.diskon_persen);
  const savings = totalOriginalPrice - totalDiscountedPrice;

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
            <span className="text-blue-600 font-bold">Detail Promo</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">

          {/* Header */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-1">Manage Promo</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-gray-800">Detail Promo</h3>
              <p className="text-gray-400 text-sm mt-1">
                Informasi lengkap promo{" "}
                <span className="font-semibold text-gray-600">{promo.kode_promo}</span>
              </p>
            </div>
            <button
              onClick={() => navigate("/admin/promo")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 shadow-sm hover:shadow-md hover:text-blue-600 hover:border-blue-300 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── LEFT: Hero Card ── */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full">
                {/* Gradient header */}
                <div className="px-6 py-8 flex flex-col items-center text-center" style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(255,255,255,0.15)" }}>
                    <Tag className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-2xl font-extrabold text-white tracking-tight">{promo.kode_promo}</p>

                  {/* Kategori badges */}
                  <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                    {uniqueCategories.length > 0 ? (
                      uniqueCategories.map((kategori, idx) => {
                        const cat = getCategoryStyle(kategori);
                        return (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}
                          >
                            {getCategoryIcon(kategori)}
                            {kategori}
                          </span>
                        );
                      })
                    ) : (
                      <p className="text-blue-200 text-sm">-</p>
                    )}
                  </div>

                  {/* Status badge */}
                  <div className="mt-4">
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                      style={
                        promo.status === "Aktif"
                          ? { background: "rgba(240,253,244,0.9)", color: "#16a34a", border: "1px solid #bbf7d0" }
                          : { background: "rgba(255,241,242,0.9)", color: "#dc2626", border: "1px solid #fecaca" }
                      }
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: promo.status === "Aktif" ? "#22c55e" : "#ef4444" }}
                      />
                      {promo.status}
                    </span>
                  </div>
                </div>

                {/* Stat mini cards */}
                <div className="p-5 grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3 p-3.5 rounded-xl" style={{ background: "#fef3c7" }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(202,138,4,0.15)" }}>
                      <Percent className="w-4 h-4 text-yellow-700" />
                    </div>
                    <div>
                      <p className="text-xs text-yellow-700 font-medium">Diskon</p>
                      <p className="text-xl font-extrabold text-yellow-800">{promo.diskon_persen || 0}%</p>
                    </div>
                  </div>

                  {savings > 0 && (
                    <div className="flex items-center gap-3 p-3.5 rounded-xl" style={{ background: "#f0fdf4" }}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(22,163,74,0.15)" }}>
                        <TrendingDown className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div>
                        <p className="text-xs text-emerald-700 font-medium">Hemat</p>
                        <p className="text-base font-extrabold text-emerald-800">{formatCurrency(savings)}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3.5 rounded-xl" style={{ background: "#eff6ff" }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(29,78,216,0.1)" }}>
                      <Calendar className="w-4 h-4 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-700 font-medium">Berlaku sampai</p>
                      <p className="text-sm font-bold text-blue-800">{formatDate(promo.berlaku_sampai)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Detail Info ── */}
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* Info Card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div
                  className="px-8 py-5 flex items-center gap-3"
                  style={{ background: "linear-gradient(90deg,#eff6ff,#f8faff)", borderBottom: "1px solid #e0e7ff" }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
                    <Tag className="w-4 h-4 text-white" />
                  </div>
                  <p className="font-bold text-gray-800 text-sm">Informasi Promo</p>
                </div>

                <div className="px-8 py-2">
                  <DetailRow label="Kode Promo" value={promo.kode_promo || "-"} />

                  <DetailRow label="Status">
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                      style={
                        promo.status === "Aktif"
                          ? { background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }
                          : { background: "#fff1f2", color: "#dc2626", border: "1px solid #fecaca" }
                      }
                    >
                      {promo.status === "Aktif"
                        ? <CheckCircle2 className="w-3.5 h-3.5" />
                        : <XCircle className="w-3.5 h-3.5" />}
                      {promo.status}
                    </span>
                  </DetailRow>

                  <DetailRow label="Kategori">
                    <div className="flex flex-wrap gap-1.5">
                      {uniqueCategories.length > 0 ? (
                        uniqueCategories.map((kategori, idx) => {
                          const cat = getCategoryStyle(kategori);
                          return (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{ background: cat.bg, color: cat.text, border: `1px solid ${cat.border}` }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat.dot }} />
                              {kategori}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </div>
                  </DetailRow>

                  <DetailRow label="Berlaku Sampai">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-700">{formatDate(promo.berlaku_sampai)}</span>
                    </div>
                  </DetailRow>
                </div>
              </div>

              {/* Menu Card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div
                  className="px-8 py-5 flex items-center gap-3"
                  style={{ background: "linear-gradient(90deg,#eff6ff,#f8faff)", borderBottom: "1px solid #e0e7ff" }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
                    <Utensils className="w-4 h-4 text-white" />
                  </div>
                  <p className="font-bold text-gray-800 text-sm">
                    Daftar Menu{" "}
                    <span className="text-gray-400 font-normal">({promo.menus?.length || 0} item)</span>
                  </p>
                </div>

                <div className="px-8 py-5">
                  {promo.menus && promo.menus.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {promo.menus.map((menu, idx) => {
                        const menuPrice = getMenuPrice(menu);
                        const kategoriName = menu.kategori?.name;
                        const cat = getCategoryStyle(kategoriName);
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-4 p-3.5 rounded-xl"
                            style={{ background: "#f8faff", border: "1px solid #e0e7ff" }}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                style={{ background: cat.bg, color: cat.text }}
                              >
                                {getCategoryIcon(kategoriName)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-800">
                                  {menu.nama_menu || menu.name || `Menu ${idx + 1}`}
                                </p>
                                {kategoriName && (
                                  <p className="text-xs text-gray-400 mt-0.5">{kategoriName}</p>
                                )}
                              </div>
                            </div>
                            <span className="text-sm font-bold text-blue-600 whitespace-nowrap">
                              {formatCurrency(menuPrice)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">Tidak ada menu</p>
                  )}
                </div>
              </div>

              {/* Harga Card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div
                  className="px-8 py-5 flex items-center gap-3"
                  style={{ background: "linear-gradient(90deg,#eff6ff,#f8faff)", borderBottom: "1px solid #e0e7ff" }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}>
                    <Percent className="w-4 h-4 text-white" />
                  </div>
                  <p className="font-bold text-gray-800 text-sm">Detail Harga</p>
                </div>

                <div className="px-8 py-2">
                  <DetailRow label="Total Harga Awal">
                    <span className="text-sm font-semibold text-gray-500 line-through">
                      {formatCurrency(totalOriginalPrice)}
                    </span>
                  </DetailRow>

                  <DetailRow label="Diskon">
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg" style={{ background: "#fef3c7" }}>
                      <Percent className="w-3 h-3 text-yellow-700" />
                      <span className="text-sm font-bold text-yellow-700">{promo.diskon_persen || 0}%</span>
                    </div>
                  </DetailRow>

                  <DetailRow label="Total Harga Diskon">
                    {totalDiscountedPrice > 0 && (promo.diskon_persen || 0) > 0 ? (
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-emerald-500" />
                        <span className="text-base font-extrabold text-emerald-600">
                          {formatCurrency(totalDiscountedPrice)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-base font-extrabold text-gray-700">
                        {formatCurrency(totalOriginalPrice)}
                      </span>
                    )}
                  </DetailRow>

                  {savings > 0 && (
                    <DetailRow label="Total Hemat">
                      <span className="text-sm font-bold text-blue-600">{formatCurrency(savings)}</span>
                    </DetailRow>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigate("/admin/promo")}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 shadow-sm hover:shadow-md hover:text-blue-600 hover:border-blue-300 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali
                </button>
                <button
                  onClick={() => navigate(`/admin/promo/editpromo/${promo.id}`)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all"
                  style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)" }}
                >
                  <PencilLine className="w-4 h-4" />
                  Edit Promo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}