import { useState } from "react";
import { ArrowLeft, Star, ShoppingBag, Heart, Share2, Plus, Minus, Clock, Flame, Leaf, ChevronDown, ChevronUp, Check } from "lucide-react";

// Simulated useNavigate & useLocation for standalone preview
// Replace with: import { useNavigate, useLocation } from "react-router-dom";
const useNavigate = () => (path, opts) => console.log("Navigate to:", path, opts);
const useLocation = () => ({
  state: {
    item: {
      id: 2,
      name: "Caffe Latte",
      description: "Perpaduan sempurna espresso & susu",
      price: 15000,
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1763473821509-9a383b480844",
      badge: null,
    },
    cart: {},
    allItems: [],
  },
});

// ── Sample full menu data (in real app, fetch by ID) ──────────────────────────
const menuDatabase = {
  1: {
    id: 1,
    name: "Espresso Premium",
    tagline: "Jiwa sejati para penikmat kopi",
    description:
      "Espresso kami diseduh dari biji arabika pilihan pegunungan Flores yang dipanggang medium-dark, menghasilkan rasa bold penuh karakter dengan aftertaste cokelat dan karamel. Setiap shot diextrak 25–30 detik pada suhu ideal 93°C.",
    price: 11000,
    rating: 4.8,
    totalReviews: 128,
    image: "https://images.unsplash.com/photo-1545731939-9c302d5d27ed",
    badge: "Best Seller",
    category: "Coffee",
    volume: "60 ml",
    calories: 5,
    prepTime: "3–5 menit",
    isHot: true,
    isVegan: true,
    ingredients: ["Arabika Flores", "Air mineral 93°C"],
    variants: [
      { label: "Single Shot", price: 11000 },
      { label: "Double Shot", price: 16000 },
    ],
    reviews: [
      { name: "Rina K.", rating: 5, comment: "Pahitnya pas, aroma mantap!", date: "2 hari lalu" },
      { name: "Dimas F.", rating: 5, comment: "Terbaik se-Tasikmalaya!", date: "5 hari lalu" },
      { name: "Sari W.", rating: 4, comment: "Enak, tapi agak pekat buatku.", date: "1 minggu lalu" },
    ],
    related: [2, 3, 6],
  },
  2: {
    id: 2,
    name: "Caffe Latte",
    tagline: "Kelembutan dalam setiap tegukan",
    description:
      "Caffe Latte kami menggabungkan satu shot espresso arabika dengan susu segar yang disteam hingga menghasilkan microfoam lembut sempurna. Rasio espresso:susu yang kami gunakan adalah 1:4, menciptakan keseimbangan antara kekuatan kopi dan kreminess susu.",
    price: 15000,
    rating: 4.9,
    totalReviews: 215,
    image: "https://images.unsplash.com/photo-1763473821509-9a383b480844",
    badge: null,
    category: "Coffee",
    volume: "250 ml",
    calories: 120,
    prepTime: "5–7 menit",
    isHot: true,
    isVegan: false,
    ingredients: ["Espresso Arabika", "Susu segar full cream", "Microfoam"],
    variants: [
      { label: "Hot", price: 15000 },
      { label: "Iced", price: 17000 },
    ],
    reviews: [
      { name: "Ayu P.", rating: 5, comment: "Suesunya enak banget, smooth!", date: "1 hari lalu" },
      { name: "Budi H.", rating: 5, comment: "Favorit saya setiap pagi.", date: "3 hari lalu" },
      { name: "Citra M.", rating: 5, comment: "Worth it! Susu steamnya pas.", date: "1 minggu lalu" },
    ],
    related: [1, 3, 6],
  },
};

// Fallback item if not found in DB
const fallbackItem = {
  id: 0,
  name: "Menu",
  tagline: "Kelezatan terbaik untukmu",
  description: "Deskripsi produk belum tersedia.",
  price: 0,
  rating: 5.0,
  totalReviews: 0,
  image: "https://images.unsplash.com/photo-1545731939-9c302d5d27ed",
  badge: null,
  category: "Coffee",
  volume: "-",
  calories: 0,
  prepTime: "-",
  isHot: true,
  isVegan: false,
  ingredients: [],
  variants: [],
  reviews: [],
  related: [],
};

const allMenuItems = [
  { id: 1, name: "Espresso Premium", price: 11000, rating: 4.8, image: "https://images.unsplash.com/photo-1545731939-9c302d5d27ed", badge: "Best Seller" },
  { id: 2, name: "Caffe Latte", price: 15000, rating: 4.9, image: "https://images.unsplash.com/photo-1763473821509-9a383b480844", badge: null },
  { id: 3, name: "Cappuccino", price: 14000, rating: 4.7, image: "https://images.unsplash.com/photo-1506188044630-210826194885", badge: null },
  { id: 6, name: "Americano", price: 12000, rating: 4.6, image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd", badge: null },
];

export default function MenuDetail() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get item from navigation state
  const passedItem = location?.state?.item;
  const passedCart = location?.state?.cart || {};

  // Merge passed item with full DB data
  const dbItem = menuDatabase[passedItem?.id] || fallbackItem;
  const item = { ...dbItem, ...(passedItem ? { price: passedItem.price, image: passedItem.image } : {}) };

  // ── State ──────────────────────────────────────────────────────────────────
  const [qty, setQty] = useState((passedCart[item.id] || 0) > 0 ? passedCart[item.id] : 1);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const currentPrice = item.variants?.[selectedVariant]?.price ?? item.price;
  const totalPrice = currentPrice * qty;

  const handleAddToCart = () => {
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
    // In real app: navigate("/pesanan", { state: { ... } });
  };

  const displayedReviews = showAllReviews ? item.reviews : item.reviews.slice(0, 2);
  const relatedItems = allMenuItems.filter((m) => item.related?.includes(m.id));

  // Extra images for gallery (use same image with different params for demo)
  const galleryImages = [
    item.image + "?w=600&auto=format",
    item.image + "?w=600&auto=format&sat=-50",
    item.image + "?w=600&auto=format&brightness=110",
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-50/30">
      <div className="max-w-md mx-auto">

        {/* ── Hero Image Section ─────────────────────────────────────── */}
        <div className="relative h-80 overflow-hidden">
          <img
            src={galleryImages[activeImage]}
            alt={item.name}
            className="w-full h-full object-cover transition-all duration-500"
          />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/30" />

          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-12 z-10">
            <button
              onClick={() => navigate(-1)}
              className="w-11 h-11 flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl shadow-xl hover:bg-white/30 transition-all"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className="w-11 h-11 flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl shadow-xl hover:bg-white/30 transition-all"
              >
                <Heart
                  size={18}
                  className={isWishlisted ? "fill-red-400 text-red-400" : "text-white"}
                />
              </button>
              <button className="w-11 h-11 flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl shadow-xl hover:bg-white/30 transition-all">
                <Share2 size={18} className="text-white" />
              </button>
            </div>
          </div>

          {/* Badge */}
          {item.badge && (
            <div className="absolute top-14 left-5 mt-2 z-10">
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                {item.badge}
              </span>
            </div>
          )}

          {/* Thumbnail Strip */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
            {galleryImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                  activeImage === i
                    ? "border-amber-400 scale-110 shadow-lg"
                    : "border-white/50 opacity-70"
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* ── Main Content Card ──────────────────────────────────────── */}
        <div className="relative -mt-5 bg-white rounded-t-[2rem] pb-40 shadow-xl">

          {/* Pill handle */}
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-4 mb-6" />

          <div className="px-5">

            {/* ── Title & Rating ──────────────────────────────────────── */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 pr-4">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">
                  {item.category}
                </p>
                <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
                  {item.name}
                </h1>
                <p className="text-sm text-gray-400 mt-1 italic">{item.tagline}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-2xl px-3 py-2">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span className="font-extrabold text-gray-900 text-sm">{item.rating}</span>
                </div>
                <p className="text-xs text-gray-400">{item.totalReviews} ulasan</p>
              </div>
            </div>

            {/* ── Quick Info Pills ─────────────────────────────────────── */}
            <div className="flex gap-2 mt-4 mb-5 flex-wrap">
              <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-xl px-3 py-1.5">
                <Clock size={13} className="text-orange-500" />
                <span className="text-xs font-semibold text-orange-700">{item.prepTime}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl px-3 py-1.5">
                <Flame size={13} className="text-red-500" />
                <span className="text-xs font-semibold text-red-700">{item.calories} kal</span>
              </div>
              {item.isVegan && (
                <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-xl px-3 py-1.5">
                  <Leaf size={13} className="text-green-500" />
                  <span className="text-xs font-semibold text-green-700">Vegan</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5">
                <span className="text-xs font-semibold text-blue-700">🥤 {item.volume}</span>
              </div>
            </div>

            {/* ── Divider ─────────────────────────────────────────────── */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-5" />

            {/* ── Description ─────────────────────────────────────────── */}
            <div className="mb-6">
              <h2 className="text-base font-bold text-gray-900 mb-2">Tentang Menu</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
            </div>

            {/* ── Ingredients ─────────────────────────────────────────── */}
            {item.ingredients?.length > 0 && (
              <div className="mb-6">
                <h2 className="text-base font-bold text-gray-900 mb-3">Bahan Utama</h2>
                <div className="flex flex-wrap gap-2">
                  {item.ingredients.map((ing, i) => (
                    <span
                      key={i}
                      className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-800 text-xs font-semibold px-4 py-2 rounded-full"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Divider ─────────────────────────────────────────────── */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-5" />

            {/* ── Variant Selector ─────────────────────────────────────── */}
            {item.variants?.length > 0 && (
              <div className="mb-6">
                <h2 className="text-base font-bold text-gray-900 mb-3">Pilih Varian</h2>
                <div className="flex gap-3">
                  {item.variants.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedVariant(i)}
                      className={`flex-1 py-3 rounded-2xl font-bold text-sm border-2 transition-all ${
                        selectedVariant === i
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-500 shadow-lg shadow-amber-500/30 scale-105"
                          : "bg-white text-gray-700 border-gray-200 hover:border-amber-400"
                      }`}
                    >
                      <div>{v.label}</div>
                      <div className={`text-xs mt-0.5 ${selectedVariant === i ? "text-white/80" : "text-amber-600"}`}>
                        Rp{v.price.toLocaleString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Divider ─────────────────────────────────────────────── */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-5" />

            {/* ── Reviews ─────────────────────────────────────────────── */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900">Ulasan Pelanggan</h2>
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  <span className="font-extrabold text-gray-900 text-sm">{item.rating}</span>
                  <span className="text-xs text-gray-400">({item.totalReviews})</span>
                </div>
              </div>

              <div className="space-y-3">
                {displayedReviews.map((rev, i) => (
                  <div
                    key={i}
                    className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                          <span className="text-white font-bold text-sm">{rev.name[0]}</span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{rev.name}</p>
                          <p className="text-xs text-gray-400">{rev.date}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, s) => (
                          <Star
                            key={s}
                            size={11}
                            className={s < rev.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>

              {item.reviews?.length > 2 && (
                <button
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-amber-300 rounded-2xl text-amber-700 font-semibold text-sm hover:bg-amber-50 transition-all"
                >
                  {showAllReviews ? (
                    <><ChevronUp size={16} /> Sembunyikan</>
                  ) : (
                    <><ChevronDown size={16} /> Lihat {item.reviews.length - 2} ulasan lagi</>
                  )}
                </button>
              )}
            </div>

            {/* ── Related Items ─────────────────────────────────────────── */}
            {relatedItems.length > 0 && (
              <>
                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-5" />
                <div className="mb-6">
                  <h2 className="text-base font-bold text-gray-900 mb-4">Menu Lainnya</h2>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {relatedItems.map((rel) => (
                      <div
                        key={rel.id}
                        className="flex-shrink-0 w-36 bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer"
                        onClick={() => navigate(`/menu/${rel.id}`, { state: { item: rel } })}
                      >
                        <div className="relative h-24 overflow-hidden">
                          <img src={rel.image} alt={rel.name} className="w-full h-full object-cover" />
                          {rel.badge && (
                            <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {rel.badge}
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="font-bold text-gray-900 text-xs line-clamp-1">{rel.name}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star size={10} className="fill-amber-400 text-amber-400" />
                            <span className="text-[10px] text-gray-500">{rel.rating}</span>
                          </div>
                          <p className="text-amber-600 font-bold text-xs mt-1">
                            Rp{rel.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

          </div>
        </div>

        {/* ── Fixed Bottom Bar ─────────────────────────────────────────── */}
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="max-w-md mx-auto px-4 pb-6">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-4">

              {/* Price Row */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Total Harga</p>
                  <p className="text-2xl font-extrabold text-gray-900">
                    Rp{totalPrice.toLocaleString()}
                  </p>
                </div>

                {/* Quantity Control */}
                <div className="flex items-center gap-3 bg-amber-50 border-2 border-amber-200 rounded-2xl px-3 py-2">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-sm hover:bg-amber-100 transition-all"
                  >
                    <Minus size={16} className="text-amber-700" />
                  </button>
                  <span className="font-extrabold text-gray-900 text-lg w-6 text-center">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-sm hover:shadow-md transition-all"
                  >
                    <Plus size={16} className="text-white" />
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                className={`w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-3 ${
                  addedToCart
                    ? "bg-green-500 text-white shadow-lg shadow-green-500/30"
                    : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 hover:shadow-xl hover:scale-[1.02]"
                }`}
              >
                {addedToCart ? (
                  <>
                    <Check size={20} />
                    Ditambahkan ke Pesanan!
                  </>
                ) : (
                  <>
                    <ShoppingBag size={20} />
                    Tambah ke Pesanan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}