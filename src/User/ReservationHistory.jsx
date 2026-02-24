import { useState, useEffect } from "react";
import {
  Search, Menu, ChevronRight, ChevronDown, ShoppingBag, X,
  Star, Clock, MapPin, ArrowLeft, Heart, Share2, Plus, Minus,
  Flame, Leaf, Check, ChevronUp
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// ── Full menu database ────────────────────────────────────────────────────────
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
    isVegan: false,
    ingredients: ["Espresso Arabika", "Susu full cream", "Microfoam"],
    variants: [
      { label: "Hot", price: 15000 },
      { label: "Iced", price: 17000 },
    ],
    reviews: [
      { name: "Ayu P.", rating: 5, comment: "Susunya enak banget, smooth!", date: "1 hari lalu" },
      { name: "Budi H.", rating: 5, comment: "Favorit saya setiap pagi.", date: "3 hari lalu" },
      { name: "Citra M.", rating: 5, comment: "Worth it! Susu steamnya pas.", date: "1 minggu lalu" },
    ],
    related: [1, 3, 6],
  },
  3: {
    id: 3,
    name: "Cappuccino",
    tagline: "Tradisi Italia di setiap cangkir",
    description:
      "Cappuccino klasik kami terdiri dari espresso, steamed milk, dan busa susu tebal yang lembut. Dibuat dengan teknik tradisional Italia untuk menghasilkan lapisan sempurna yang memanjakan lidah.",
    price: 14000,
    rating: 4.7,
    totalReviews: 98,
    image: "https://images.unsplash.com/photo-1506188044630-210826194885",
    badge: null,
    category: "Coffee",
    volume: "180 ml",
    calories: 90,
    prepTime: "5–7 menit",
    isVegan: false,
    ingredients: ["Espresso", "Steamed milk", "Milk foam"],
    variants: [
      { label: "Hot", price: 14000 },
      { label: "Iced", price: 16000 },
    ],
    reviews: [
      { name: "Hana S.", rating: 5, comment: "Foam-nya sempurna!", date: "3 hari lalu" },
      { name: "Rizky A.", rating: 4, comment: "Enak, porsinya pas.", date: "1 minggu lalu" },
    ],
    related: [1, 2, 6],
  },
  6: {
    id: 6,
    name: "Americano",
    tagline: "Kesederhanaan yang penuh karakter",
    description:
      "Americano kami dibuat dari dua shot espresso arabika premium yang diencerkan dengan air panas berkualitas tinggi, menghasilkan kopi hitam yang kaya rasa namun lebih ringan dari espresso murni.",
    price: 12000,
    rating: 4.6,
    totalReviews: 74,
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd",
    badge: null,
    category: "Coffee",
    volume: "240 ml",
    calories: 10,
    prepTime: "3–5 menit",
    isVegan: true,
    ingredients: ["Double shot Espresso", "Air panas mineral"],
    variants: [
      { label: "Hot", price: 12000 },
      { label: "Iced", price: 14000 },
    ],
    
    related: [1, 2, 3],
  },
  4: {
    id: 4,
    name: "Tiramisu Delight",
    tagline: "Pengangkat semangat dari Italia",
    description:
      "Tiramisu klasik kami dibuat dari lapisan ladyfinger yang dicelup espresso, dipadukan dengan krim mascarpone premium, dan ditaburi cokelat bubuk berkualitas. Setiap gigitan menghadirkan sensasi manis-pahit yang harmonis.",
    price: 18000,
    originalPrice: 25000,
    discount: "28%",
    rating: 4.9,
    totalReviews: 167,
    image: "https://images.unsplash.com/photo-1766734974600-b6ea9a40a03a",
    badge: "Promo",
    category: "Dessert",
    volume: "1 porsi",
    calories: 380,
    prepTime: "5 menit",
    isVegan: false,
    ingredients: ["Mascarpone", "Ladyfinger", "Espresso", "Cokelat bubuk", "Telur"],
    variants: [
      { label: "Regular", price: 18000 },
      { label: "Large", price: 25000 },
    ],
    
    related: [5],
  },
  5: {
    id: 5,
    name: "Chocolate Lava Cake",
    tagline: "Magma cokelat yang tak terlupakan",
    description:
      "Chocolate Lava Cake kami dipanggang fresh setiap pesanan, menghasilkan kue cokelat hangat dengan lelehan cokelat cair yang mengalir sempurna saat dipotong. Disajikan dengan taburan gula halus dan cocoa powder.",
    price: 20000,
    originalPrice: 28000,
    discount: "29%",
    rating: 5.0,
    totalReviews: 203,
    image: "https://images.unsplash.com/photo-1766735007331-e720ca937c83",
    badge: "Promo",
    category: "Dessert",
    volume: "1 porsi",
    calories: 450,
    prepTime: "10–12 menit",
    isVegan: false,
    ingredients: ["Dark chocolate 70%", "Mentega", "Telur", "Gula", "Tepung"],
    variants: [
      { label: "Original", price: 20000 },
      { label: "+ Vanilla Ice Cream", price: 27000 },
    ],
    
    related: [4],
  },
};

// ── MenuDetail Bottom Sheet Component ────────────────────────────────────────
function MenuDetailSheet({ item, onClose, onAddToCart, cart }) {
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const currentPrice = item.variants?.[selectedVariant]?.price ?? item.price;
  const totalPrice = currentPrice * qty;

  const relatedItems = Object.values(menuDatabase).filter((m) =>
    item.related?.includes(m.id)
  );
  const displayedReviews = showAllReviews ? item.reviews : item.reviews?.slice(0, 2);

  const galleryImages = [
    item.image + "?w=600&auto=format",
    item.image + "?w=600&auto=format&sat=-40",
    item.image + "?w=600&auto=format&brightness=115",
  ];

  const handleAdd = () => {
    setAddedToCart(true);
    onAddToCart(item.id, qty, selectedVariant);
    setTimeout(() => {
      setAddedToCart(false);
      onClose();
    }, 1200);
  };

  // Prevent body scroll while sheet is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end animate-fadeIn"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-md mx-auto rounded-t-[2rem] animate-slideUp overflow-hidden"
        style={{ maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scrollable inner */}
        <div className="overflow-y-auto" style={{ maxHeight: "92vh", paddingBottom: "160px" }}>

          {/* ── Hero Image ──────────────────────────────────────────── */}
          <div className="relative h-72 flex-shrink-0">
            <img
              src={galleryImages[activeImage]}
              alt={item.name}
              className="w-full h-full object-cover transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30" />

            {/* Top controls */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
              <button
                onClick={onClose}
                className="w-11 h-11 flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl shadow-xl hover:bg-white/30 transition-all"
              >
                <ArrowLeft size={20} className="text-white" />
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className="w-11 h-11 flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl shadow-xl hover:bg-white/30 transition-all"
                >
                  <Heart size={18} className={isWishlisted ? "fill-red-400 text-red-400" : "text-white"} />
                </button>
                <button className="w-11 h-11 flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl shadow-xl hover:bg-white/30 transition-all">
                  <Share2 size={18} className="text-white" />
                </button>
              </div>
            </div>

            {/* Badge */}
            {item.badge && (
              <div className="absolute top-20 left-4 z-10">
                <span className={`text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg ${item.badge === "Promo" ? "bg-gradient-to-r from-red-500 to-pink-500" : "bg-gradient-to-r from-purple-500 to-pink-500"}`}>
                  {item.badge === "Promo" && item.discount ? `-${item.discount}` : item.badge}
                </span>
              </div>
            )}

            {/* Gallery thumbnails */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
              {galleryImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                    activeImage === i ? "border-amber-400 scale-110 shadow-lg" : "border-white/50 opacity-70"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* ── Content ─────────────────────────────────────────────── */}
          <div className="px-5 pt-5">

            {/* Title */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 pr-4">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">{item.category}</p>
                <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">{item.name}</h1>
                <p className="text-sm text-gray-400 mt-1 italic">{item.tagline}</p>
              </div>
              
            </div>

            {/* Quick info pills */}
            <div className="flex gap-2 mt-1 mb-5 flex-wrap">
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

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-5" />

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-base font-bold text-gray-900 mb-2">Tentang Menu</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
            </div>

            {/* Ingredients */}
            {item.ingredients?.length > 0 && (
              <div className="mb-6">
                <h2 className="text-base font-bold text-gray-900 mb-3">Bahan Utama</h2>
                <div className="flex flex-wrap gap-2">
                  {item.ingredients.map((ing, i) => (
                    <span key={i} className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-800 text-xs font-semibold px-4 py-2 rounded-full">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-5" />

            {/* Variant selector */}
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

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-5" />

            

            {/* Related items */}
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
                        onClick={() => {
                          onClose();
                          setTimeout(() => onClose(rel), 300);
                        }}
                      >
                        <div className="relative h-24 overflow-hidden">
                          <img src={rel.image} alt={rel.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-3">
                          <p className="font-bold text-gray-900 text-xs line-clamp-1">{rel.name}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star size={10} className="fill-amber-400 text-amber-400" />
                            <span className="text-[10px] text-gray-500">{rel.rating}</span>
                          </div>
                          <p className="text-amber-600 font-bold text-xs mt-1">Rp{rel.price.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Fixed bottom bar inside sheet ────────────────────────── */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Total Harga</p>
              <p className="text-2xl font-extrabold text-gray-900">
                Rp{totalPrice.toLocaleString()}
              </p>
              {item.originalPrice && (
                <p className="text-xs text-gray-400 line-through">Rp{item.originalPrice.toLocaleString()}</p>
              )}
            </div>
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

          <button
            onClick={handleAdd}
            className={`w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-3 ${
              addedToCart
                ? "bg-green-500 text-white shadow-lg shadow-green-500/30 scale-98"
                : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 hover:shadow-xl hover:scale-[1.02]"
            }`}
          >
            {addedToCart ? (
              <><Check size={20} /> Ditambahkan ke Pesanan!</>
            ) : (
              <><ShoppingBag size={20} /> Tambah ke Pesanan</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Home Component ───────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("promo");
  const [selectedDropdown, setSelectedDropdown] = useState("Semua Kategori");
  const [openCategory, setOpenCategory] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Menu Detail sheet state
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const offsetPosition = el.getBoundingClientRect().top + window.pageYOffset - 100;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  const menuItems = [
    { id: 1, name: "Espresso Premium", description: "Kopi hitam pekat dengan aroma khas", price: 11000, rating: 4.8, image: "https://images.unsplash.com/photo-1545731939-9c302d5d27ed", badge: "Best Seller" },
    { id: 2, name: "Caffe Latte", description: "Perpaduan sempurna espresso & susu", price: 15000, rating: 4.9, image: "https://images.unsplash.com/photo-1763473821509-9a383b480844" },
    { id: 3, name: "Cappuccino", description: "Espresso dengan busa susu lembut", price: 14000, rating: 4.7, image: "https://images.unsplash.com/photo-1506188044630-210826194885" },
    { id: 6, name: "Americano", description: "Espresso dengan air panas", price: 12000, rating: 4.6, image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd" },
  ];

  const promoItems = [
    { id: 4, name: "Tiramisu Delight", description: "Dessert klasik Italia yang memukau", price: 18000, originalPrice: 25000, discount: "28%", image: "https://images.unsplash.com/photo-1766734974600-b6ea9a40a03a", badge: "Promo" },
    { id: 5, name: "Chocolate Lava Cake", description: "Kue cokelat dengan lelehan lava", price: 20000, originalPrice: 28000, discount: "29%", image: "https://images.unsplash.com/photo-1766735007331-e720ca937c83", badge: "Promo" },
  ];

  const [cart, setCart] = useState({});

  const addItem = (id) => setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const removeItem = (id) => setCart((prev) => {
    const updated = { ...prev };
    if (updated[id] > 1) updated[id]--;
    else delete updated[id];
    return updated;
  });

  // Called from sheet — adds qty of selected variant
  const handleSheetAdd = (id, qty) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + qty }));
  };

  // Open detail sheet — enrich with full DB data
  const openDetail = (item) => {
    const full = menuDatabase[item.id];
    setSelectedItem(full ? { ...full, ...item, ...full } : item);
  };

  const allItems = [...menuItems, ...promoItems];
  const totalQty = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = allItems.reduce((sum, item) => sum + (cart[item.id] || 0) * item.price, 0);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-50/30">

      {/* ── Floating Header on scroll ─────────────────────────────── */}
      {scrolled && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl shadow-lg animate-slideDown">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900">ASTAKIRA</p>
                <p className="text-xs text-gray-500">Meja #1</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigate("/search")} className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-amber-100 hover:text-amber-700 transition-all">
                <Search size={16} />
              </button>
              <button onClick={() => navigate("/dropdown")} className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-amber-100 hover:text-amber-700 transition-all">
                <Menu size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto">

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden">
          <div className="relative h-72">
            <img src="https://images.unsplash.com/photo-1765894711260-9d881459ddb4" alt="Hero" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
            </div>

            <div className="absolute top-6 right-6 flex gap-3 z-10">
              <button onClick={() => navigate("/search")} className="w-11 h-11 flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl shadow-xl hover:bg-white/30 hover:scale-105 transition-all">
                <Search size={18} className="text-white" />
              </button>
              <button onClick={() => navigate("/dropdown")} className="w-11 h-11 flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl shadow-xl hover:bg-white/30 hover:scale-105 transition-all">
                <Menu size={18} className="text-white" />
              </button>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 pb-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="px-3 py-1 bg-amber-500 rounded-full"><span className="text-white text-xs font-bold">OPEN</span></div>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="relative -mt-32 mx-4 mb-6 z-20 space-y-3">
            {/* Outlet Card */}
            <div className="bg-white rounded-3xl p-5 shadow-2xl border border-gray-100">
              <div className="flex items-center justify-between" onClick={() => navigate("/outlet")}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <MapPin size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-medium mb-1">Outlet</p>
                    <p className="text-gray-900 text-lg font-bold">ASTAKIRA</p>
                    <p className="text-gray-400 text-xs mt-0.5">Ciakar • Tasikmalaya</p>
                    <div className="flex items-center gap-1.5 text-green-600 text-xs font-semibold mt-1.5">
                      <Clock size={12} />
                      <span>08:00 - 17:00</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="text-gray-300" size={24} />
              </div>
            </div>

            {/* Table card - smaller */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 shadow-xl border border-amber-400/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                    <span className="text-white text-xl font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-white/80 text-xs font-medium mb-0.5">Nomor Meja</p>
                    <p className="text-white text-base font-bold">Meja Nomor 1</p>
                  </div>
                </div>
                <ChevronRight className="text-white/60" size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Content ──────────────────────────────────────────── */}
        <div className="px-4 pb-32">

          {/* Category Pills */}
          <div className="sticky top-0 bg-gradient-to-b from-white via-white to-transparent pt-4 pb-6 -mx-4 px-4 z-30 mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setOpenCategory(true)}
                className="flex items-center gap-2 bg-white border-2 border-gray-200 rounded-2xl px-5 py-3 text-sm font-semibold whitespace-nowrap hover:border-amber-500 hover:bg-amber-50 transition-all shadow-sm"
              >
                {selectedDropdown}
                <ChevronDown size={16} className="text-gray-600" />
              </button>
              {[
                { id: "recommendation", label: "⭐ Rekomendasi", section: "recommendation" },
                { id: "coffee", label: "☕ Coffee", section: "coffee" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`rounded-2xl px-5 py-3 text-sm font-semibold transition-all whitespace-nowrap shadow-sm ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 scale-105"
                      : "bg-white text-gray-700 border-2 border-gray-200 hover:border-amber-500 hover:text-amber-700"
                  }`}
                  onClick={() => { setActiveTab(tab.id); scrollToSection(tab.section); }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

         

          {/* ── Recommendation Section - HORIZONTAL SCROLL ────────────────────────────────── */}
          <section id="recommendation" className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Menu Favorit</h2>
                <p className="text-sm text-gray-500">Pilihan terbaik pelanggan</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Star className="text-white fill-white" size={20} />
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
              {menuItems.map((item, index) => {
                const qty = cart[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className="group flex-shrink-0 w-64 bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-2 border-transparent hover:border-amber-400 cursor-pointer"
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => openDetail(item)}
                  >
                    <div className="relative h-40 overflow-hidden">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      {item.badge && (
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          {item.badge}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{item.name}</h3>
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{item.description}</p>
                      <p className="text-lg font-bold text-amber-600 mb-3">Rp{item.price.toLocaleString()}</p>
                      {qty === 0 ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); addItem(item.id); }}
                          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl py-2.5 font-bold hover:shadow-lg hover:shadow-amber-500/30 hover:scale-105 transition-all"
                        >
                          + Tambah
                        </button>
                      ) : (
                        <div
                          className="flex items-center justify-between bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl px-3 py-2 shadow-lg"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button onClick={() => removeItem(item.id)} className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-white font-bold hover:bg-white/30 transition-all">−</button>
                          <span className="font-bold text-white">{qty}</span>
                          <button onClick={() => addItem(item.id)} className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-white font-bold hover:bg-white/30 transition-all">+</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Coffee Coming Soon ────────────────────────────────────── */}
          <section id="coffee" className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Coffee Menu</h2>
                <p className="text-sm text-gray-500">Segera hadir...</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-700 to-orange-700 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">☕</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-dashed border-amber-300 rounded-3xl p-8 text-center">
              <div className="text-6xl mb-4">☕</div>
              <p className="text-gray-600 font-medium">Menu kopi sedang disiapkan</p>
              <p className="text-sm text-gray-500 mt-2">Tunggu kejutan spesial kami!</p>
            </div>
          </section>
        </div>

        {/* ── Floating Checkout ─────────────────────────────────────── */}
        {totalQty > 0 && !selectedItem && (
          <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6">
            <div className="max-w-md mx-auto">
              <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-3xl p-5 shadow-2xl border border-amber-400/50 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                      <ShoppingBag className="text-white" size={20} />
                    </div>
                    <div>
                      <p className="text-white/80 text-xs font-medium mb-1">{totalQty} Item</p>
                      <p className="text-white text-xl font-bold">Rp{totalPrice.toLocaleString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/pesanan", { state: { cart, items: allItems } })}
                    className="bg-white text-amber-700 px-8 py-4 rounded-2xl font-bold hover:bg-amber-50 transition-all shadow-xl hover:scale-105 whitespace-nowrap"
                  >
                    Checkout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Category Bottom Sheet ─────────────────────────────────── */}
        {openCategory && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end z-50 animate-fadeIn" onClick={() => setOpenCategory(false)}>
            <div className="bg-white w-full max-w-md mx-auto rounded-t-[2rem] p-6 animate-slideUp shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-2xl text-gray-900">Pilih Kategori</h2>
                <button onClick={() => setOpenCategory(false)} className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-all">
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Semua Kategori", icon: "🍽️", color: "from-amber-500 to-orange-500" },
                  { label: "Minuman", icon: "🥤", color: "from-blue-500 to-cyan-500" },
                  { label: "Makanan", icon: "🍔", color: "from-green-500 to-emerald-500" },
                  { label: "Snack", icon: "🍿", color: "from-purple-500 to-pink-500" },
                ].map((category, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setSelectedDropdown(category.label); setOpenCategory(false); }}
                    className={`w-full bg-gradient-to-r ${category.color} text-white py-4 px-6 rounded-2xl font-bold hover:shadow-xl transition-all flex items-center justify-between group`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <span>{category.label}</span>
                    </span>
                    <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Menu Detail Bottom Sheet ──────────────────────────────── */}
      {selectedItem && (
        <MenuDetailSheet
          item={selectedItem}
          cart={cart}
          onClose={() => setSelectedItem(null)}
          onAddToCart={handleSheetAdd}
        />
      )}

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-slideDown { animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}