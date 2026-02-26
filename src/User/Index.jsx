import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, ShoppingBag, ArrowLeft, Heart, Share2, Plus, Minus,
  Star, Clock, MapPin, Flame, Leaf, Check, ExternalLink, RotateCcw
} from "lucide-react";

// ── Full menu database ────────────────────────────────────────────────────────
const menuDatabase = {
  1: {
    id: 1, name: "Espresso Premium", tagline: "Jiwa sejati para penikmat kopi",
    description: "Espresso kami diseduh dari biji arabika pilihan pegunungan Flores yang dipanggang medium-dark, menghasilkan rasa bold penuh karakter dengan aftertaste cokelat dan karamel.",
    price: 11000, rating: 4.8, totalReviews: 128,
    image: "https://images.unsplash.com/photo-1545731939-9c302d5d27ed",
    badge: "Best Seller", category: "coffee", volume: "60 ml", calories: 5, prepTime: "3–5 menit", isVegan: true,
    ingredients: ["Arabika Flores", "Air mineral 93°C"],
    variants: [
      { label: "Single Shot", price: 11000, image: "https://images.unsplash.com/photo-1545731939-9c302d5d27ed?w=600&auto=format" },
      { label: "Double Shot", price: 16000, image: "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=600&auto=format" },
    ],
    reviews: [{ name: "Rina K.", rating: 5, comment: "Pahitnya pas!", date: "2 hari lalu" }],
    related: [2, 3, 6],
  },
  2: {
    id: 2, name: "Caffe Latte", tagline: "Kelembutan dalam setiap tegukan",
    description: "Caffe Latte kami menggabungkan satu shot espresso arabika dengan susu segar yang disteam hingga menghasilkan microfoam lembut sempurna.",
    price: 15000, rating: 4.9, totalReviews: 215,
    image: "https://images.unsplash.com/photo-1763473821509-9a383b480844",
    badge: null, category: "coffee", volume: "250 ml", calories: 120, prepTime: "5–7 menit", isVegan: false,
    ingredients: ["Espresso Arabika", "Susu full cream", "Microfoam"],
    variants: [
      { label: "Hot", price: 15000, image: "https://images.unsplash.com/photo-1763473821509-9a383b480844?w=600&auto=format" },
      { label: "Iced", price: 17000, image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&auto=format" },
    ],
    related: [1, 3, 6],
  },
  3: {
    id: 3, name: "Cappuccino", tagline: "Tradisi Italia di setiap cangkir",
    description: "Cappuccino klasik kami terdiri dari espresso, steamed milk, dan busa susu tebal yang lembut.",
    price: 14000, rating: 4.7, totalReviews: 98,
    image: "https://images.unsplash.com/photo-1506188044630-210826194885",
    badge: null, category: "coffee", volume: "180 ml", calories: 90, prepTime: "5–7 menit", isVegan: false,
    ingredients: ["Espresso", "Steamed milk", "Milk foam"],
    variants: [
      { label: "Hot", price: 14000, image: "https://images.unsplash.com/photo-1506188044630-210826194885?w=600&auto=format" },
      { label: "Iced", price: 16000, image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&auto=format" },
    ],
    related: [1, 2, 6],
  },
  6: {
    id: 6, name: "Americano", tagline: "Kesederhanaan yang penuh karakter",
    description: "Americano kami dibuat dari dua shot espresso arabika premium yang diencerkan dengan air panas berkualitas tinggi.",
    price: 12000, rating: 4.6, totalReviews: 74,
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd",
    badge: null, category: "coffee", volume: "240 ml", calories: 10, prepTime: "3–5 menit", isVegan: true,
    ingredients: ["Double shot Espresso", "Air panas mineral"],
    variants: [
      { label: "Hot", price: 12000, image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format" },
      { label: "Iced", price: 14000, image: "https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&auto=format" },
    ],
    related: [1, 2, 3],
  },
  4: {
    id: 4, name: "Tiramisu Delight", tagline: "Pengangkat semangat dari Italia",
    description: "Tiramisu klasik kami dibuat dari lapisan ladyfinger yang dicelup espresso, dipadukan dengan krim mascarpone premium.",
    price: 18000, originalPrice: 25000, discount: "28%", rating: 4.9, totalReviews: 167,
    image: "https://images.unsplash.com/photo-1766734974600-b6ea9a40a03a",
    badge: "Promo", category: "dessert", volume: "1 porsi", calories: 380, prepTime: "5 menit", isVegan: false,
    ingredients: ["Mascarpone", "Ladyfinger", "Espresso", "Cokelat bubuk", "Telur"],
    variants: [
      { label: "Regular", price: 18000, image: "https://images.unsplash.com/photo-1766734974600-b6ea9a40a03a?w=600&auto=format" },
      { label: "Large", price: 25000, image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&auto=format" },
    ],
    related: [5],
  },
  5: {
    id: 5, name: "Chocolate Lava Cake", tagline: "Magma cokelat yang tak terlupakan",
    description: "Chocolate Lava Cake kami dipanggang fresh setiap pesanan, menghasilkan kue cokelat hangat dengan lelehan cokelat cair.",
    price: 20000, originalPrice: 28000, discount: "29%", rating: 5.0, totalReviews: 203,
    image: "https://images.unsplash.com/photo-1766735007331-e720ca937c83",
    badge: "Promo", category: "dessert", volume: "1 porsi", calories: 450, prepTime: "10–12 menit", isVegan: false,
    ingredients: ["Dark chocolate 70%", "Mentega", "Telur", "Gula", "Tepung"],
    variants: [
      { label: "Original", price: 20000, image: "https://images.unsplash.com/photo-1766735007331-e720ca937c83?w=600&auto=format" },
      { label: "+ Vanilla Ice Cream", price: 27000, image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&auto=format" },
    ],
    related: [4],
  },
  7: {
    id: 7, name: "Nasi Goreng Spesial", tagline: "Cita rasa rumahan yang menggugah selera",
    description: "Nasi goreng dengan bumbu rempah pilihan, disajikan dengan ayam suwir, telur mata sapi, dan acar segar.",
    price: 22000, rating: 4.8, totalReviews: 312,
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b",
    badge: "Favorit", category: "makanan", volume: "1 porsi", calories: 520, prepTime: "10–15 menit", isVegan: false,
    ingredients: ["Nasi", "Ayam suwir", "Telur", "Bumbu rempah", "Kecap manis"],
    variants: [
      { label: "Regular", price: 22000, image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format" },
      { label: "Extra Ayam", price: 28000, image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format" },
    ],
    related: [8],
  },
  8: {
    id: 8, name: "Mie Goreng Jumbo", tagline: "Porsi besar, rasa luar biasa",
    description: "Mie goreng dengan bumbu khas yang kaya rasa, dilengkapi sayuran segar, bakso, dan kerupuk renyah.",
    price: 20000, rating: 4.7, totalReviews: 198,
    image: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d",
    badge: null, category: "makanan", volume: "1 porsi", calories: 480, prepTime: "8–12 menit", isVegan: false,
    ingredients: ["Mie telur", "Bakso", "Sayuran", "Bumbu khas", "Kerupuk"],
    variants: [
      { label: "Regular", price: 20000, image: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&auto=format" },
      { label: "Jumbo", price: 26000, image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&auto=format" },
    ],
    related: [7],
  },
  9: {
    id: 9, name: "Kentang Goreng Crispy", tagline: "Renyah di luar, lembut di dalam",
    description: "Kentang goreng dengan lapisan krispy seasoning spesial, disajikan hangat dengan saus sambal dan mayonaise.",
    price: 15000, rating: 4.5, totalReviews: 156,
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877",
    badge: null, category: "snack", volume: "1 porsi", calories: 350, prepTime: "5–8 menit", isVegan: true,
    ingredients: ["Kentang", "Minyak", "Seasoning spesial"],
    variants: [
      { label: "Regular", price: 15000, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format" },
      { label: "Large", price: 20000, image: "https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=600&auto=format" },
    ],
    related: [10],
  },
  10: {
    id: 10, name: "Pisang Goreng Crispy", tagline: "Camilan klasik sentuhan modern",
    description: "Pisang kepok pilihan digoreng dengan tepung renyah, disajikan dengan saus karamel dan keju parut.",
    price: 12000, rating: 4.6, totalReviews: 89,
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9",
    badge: "Baru", category: "snack", volume: "5 pcs", calories: 280, prepTime: "5–7 menit", isVegan: true,
    ingredients: ["Pisang kepok", "Tepung crispy", "Keju", "Saus karamel"],
    variants: [
      { label: "Original", price: 12000, image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&auto=format" },
      { label: "+ Keju", price: 15000, image: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format" },
    ],
    related: [9],
  },
  11: {
    id: 11, name: "Es Teh Manis", tagline: "Segar menyegarkan di setiap tegukan",
    description: "Teh pilihan yang diseduh segar dengan gula asli, disajikan dingin dengan es batu yang menyegarkan.",
    price: 8000, rating: 4.4, totalReviews: 445,
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc",
    badge: null, category: "minuman", volume: "350 ml", calories: 80, prepTime: "2–3 menit", isVegan: true,
    ingredients: ["Teh pilihan", "Gula asli", "Es batu"],
    variants: [
      { label: "Manis", price: 8000, image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format" },
      { label: "Tawar", price: 7000, image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&auto=format" },
    ],
    related: [12],
  },
  12: {
    id: 12, name: "Jus Alpukat", tagline: "Creamy dan menyehatkan",
    description: "Jus alpukat segar dengan susu full cream dan sedikit madu, menciptakan minuman kental yang menyehatkan.",
    price: 18000, rating: 4.8, totalReviews: 178,
    image: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4",
    badge: "Favorit", category: "minuman", volume: "300 ml", calories: 220, prepTime: "3–5 menit", isVegan: false,
    ingredients: ["Alpukat segar", "Susu full cream", "Madu", "Es batu"],
    variants: [
      { label: "Regular", price: 18000, image: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=600&auto=format" },
      { label: "Large", price: 24000, image: "https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=600&auto=format" },
    ],
    related: [11],
  },
};

// ── Category sections ─────────────────────────────────────────────────────────
const categorySections = [
  { id: "coffee",  label: "Kopi",    icon: "☕", color: "from-amber-600 to-amber-800",  items: [1, 2, 3, 6] },
  { id: "makanan", label: "Makanan", icon: "🍱", color: "from-orange-500 to-red-500",   items: [7, 8] },
  { id: "dessert", label: "Dessert", icon: "🍰", color: "from-pink-400 to-rose-500",    items: [4, 5] },
  { id: "minuman", label: "Minuman", icon: "🥤", color: "from-blue-400 to-cyan-500",    items: [11, 12] },
  { id: "snack",   label: "Snack",   icon: "🍿", color: "from-yellow-400 to-amber-500", items: [9, 10] },
];

const categories = [
  { id: "all", label: "Semua", icon: "🍽️", color: "from-amber-500 to-orange-500" },
  ...categorySections,
];

// ── Helper: build cart object from order items ────────────────────────────────
// Tries to match order item name to menuDatabase by name
function buildCartFromOrder(orderItems) {
  const newCart = {};
  const allItems = Object.values(menuDatabase);

  orderItems.forEach((orderItem) => {
    // Find matching menu item by name
    const found = allItems.find(
      (m) => m.name.toLowerCase() === orderItem.name.toLowerCase()
    );
    if (found) {
      newCart[found.id] = (newCart[found.id] || 0) + orderItem.qty;
    }
  });

  return newCart;
}

// ── Mock riwayat data ─────────────────────────────────────────────────────────
const mockRiwayat = [
  {
    id: "ORD-001", status: "sedang", meja: 1, waktu: "Baru saja", estimasi: "10–15 menit",
    items: [
      { name: "Caffe Latte", variant: "Hot", qty: 2, price: 15000, image: "https://images.unsplash.com/photo-1763473821509-9a383b480844?w=200&auto=format" },
      { name: "Tiramisu Delight", variant: "Regular", qty: 1, price: 18000, image: "https://images.unsplash.com/photo-1766734974600-b6ea9a40a03a?w=200&auto=format" },
    ],
  },
  {
    id: "ORD-002", status: "sedang", meja: 1, waktu: "5 menit lalu", estimasi: "5–8 menit",
    items: [
      { name: "Espresso Premium", variant: "Single Shot", qty: 1, price: 11000, image: "https://images.unsplash.com/photo-1545731939-9c302d5d27ed?w=200&auto=format" },
    ],
  },
  {
    id: "ORD-003", status: "selesai", meja: 1, waktu: "Kemarin, 14:30",
    items: [
      { name: "Americano", variant: "Iced", qty: 1, price: 14000, image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&auto=format" },
      { name: "Chocolate Lava Cake", variant: "Original", qty: 2, price: 20000, image: "https://images.unsplash.com/photo-1766735007331-e720ca937c83?w=200&auto=format" },
    ],
  },
  {
    id: "ORD-004", status: "selesai", meja: 1, waktu: "2 hari lalu, 10:15",
    items: [
      { name: "Nasi Goreng Spesial", variant: "Extra Ayam", qty: 2, price: 28000, image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=200&auto=format" },
      { name: "Jus Alpukat", variant: "Large", qty: 2, price: 24000, image: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=200&auto=format" },
    ],
  },
];

// ── MenuDetail Bottom Sheet ───────────────────────────────────────────────────
function MenuDetailSheet({ item, onClose, onAddToCart, onOpenItem }) {
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const currentPrice = item.variants?.[selectedVariant]?.price ?? item.price;
  const totalPrice = currentPrice * qty;
  const relatedItems = Object.values(menuDatabase).filter((m) => item.related?.includes(m.id));

  const variantImages = item.variants?.map((v) => v.image || (item.image + "?w=600&auto=format")) ?? [item.image + "?w=600&auto=format"];
  const heroImage = variantImages[selectedVariant] ?? item.image + "?w=600&auto=format";

  const handleAdd = () => {
    setAddedToCart(true);
    onAddToCart(item.id, qty, currentPrice);
    setTimeout(() => { setAddedToCart(false); onClose(); }, 1200);
  };

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
        <div className="overflow-y-auto" style={{ maxHeight: "92vh", paddingBottom: "160px" }}>
          {/* Hero image */}
          <div className="relative h-72 flex-shrink-0">
            <img src={heroImage} alt={item.name} className="w-full h-full object-cover transition-all duration-500" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30" />
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
              <button onClick={onClose} className="w-11 h-11 flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl shadow-xl hover:bg-white/30 transition-all">
                <ArrowLeft size={20} className="text-white" />
              </button>
              <div className="flex gap-3">
                <button onClick={() => setIsWishlisted(!isWishlisted)} className="w-11 h-11 flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl shadow-xl hover:bg-white/30 transition-all">
                  <Heart size={18} className={isWishlisted ? "fill-red-400 text-red-400" : "text-white"} />
                </button>
                <button className="w-11 h-11 flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl shadow-xl hover:bg-white/30 transition-all">
                  <Share2 size={18} className="text-white" />
                </button>
              </div>
            </div>
            {item.badge && (
              <div className="absolute top-20 left-4 z-10">
                <span className={`text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg ${item.badge === "Promo" ? "bg-gradient-to-r from-red-500 to-pink-500" : "bg-gradient-to-r from-purple-500 to-pink-500"}`}>
                  {item.badge === "Promo" && item.discount ? `-${item.discount}` : item.badge}
                </span>
              </div>
            )}
            {/* Variant thumbnails */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
              {variantImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedVariant(i)}
                  className={`relative w-14 h-14 rounded-2xl overflow-hidden transition-all duration-200 ${
                    selectedVariant === i
                      ? "scale-110 shadow-xl ring-2 ring-amber-400 ring-offset-1"
                      : "opacity-65 hover:opacity-90"
                  }`}
                  style={{ borderWidth: selectedVariant === i ? 3 : 2, borderColor: selectedVariant === i ? "#fbbf24" : "rgba(255,255,255,0.5)", borderStyle: "solid" }}
                >
                  <img src={img} alt={item.variants?.[i]?.label ?? ""} className="w-full h-full object-cover" />
                  <div className={`absolute inset-x-0 bottom-0 text-center text-[8px] font-bold leading-tight py-0.5 ${selectedVariant === i ? "bg-amber-500 text-white" : "bg-black/50 text-white/80"}`}>
                    {item.variants?.[i]?.label?.split(" ")[0]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-5 pt-5">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">{item.category}</p>
            <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">{item.name}</h1>
            <p className="text-sm text-gray-400 mt-1 italic mb-4">{item.tagline}</p>

            <div className="flex gap-2 mb-5 flex-wrap">
              <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-xl px-3 py-1.5">
                <Clock size={13} className="text-orange-500" /><span className="text-xs font-semibold text-orange-700">{item.prepTime}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl px-3 py-1.5">
                <Flame size={13} className="text-red-500" /><span className="text-xs font-semibold text-red-700">{item.calories} kal</span>
              </div>
              {item.isVegan && (
                <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-xl px-3 py-1.5">
                  <Leaf size={13} className="text-green-500" /><span className="text-xs font-semibold text-green-700">Vegan</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5">
                <span className="text-xs font-semibold text-blue-700">🥤 {item.volume}</span>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-5" />
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-5" />

            {/* Variants */}
            {item.variants?.length > 0 && (
              <div className="mb-6">
                <h2 className="text-base font-bold text-gray-900 mb-3">Pilih Varian</h2>
                <div className="flex gap-3">
                  {item.variants.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedVariant(i)}
                      className={`flex-1 rounded-2xl font-bold text-sm border-2 transition-all overflow-hidden ${
                        selectedVariant === i ? "border-amber-500 shadow-lg scale-105" : "border-gray-200 hover:border-amber-400"
                      }`}
                    >
                      <div className="relative h-20 overflow-hidden">
                        <img src={variantImages[i]} alt={v.label} className="w-full h-full object-cover" />
                        <div className={`absolute inset-0 ${selectedVariant === i ? "bg-amber-500/20" : "bg-black/20"}`} />
                        {selectedVariant === i && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shadow">
                            <Check size={11} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className={`px-3 py-2 text-center ${selectedVariant === i ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-white"}`}>
                        <div className={`font-bold text-sm ${selectedVariant === i ? "text-white" : "text-gray-700"}`}>{v.label}</div>
                        <div className={`text-xs mt-0.5 font-semibold ${selectedVariant === i ? "text-white/80" : "text-amber-600"}`}>Rp{v.price.toLocaleString()}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                        onClick={() => onOpenItem(rel)}
                        className="flex-shrink-0 w-36 bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer"
                      >
                        <div className="h-24 overflow-hidden">
                          <img src={rel.image + "?w=300&auto=format"} alt={rel.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-3">
                          <p className="font-bold text-gray-900 text-xs line-clamp-1">{rel.name}</p>
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

        {/* Bottom action bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Total Harga</p>
              <p className="text-2xl font-extrabold text-gray-900">Rp{totalPrice.toLocaleString()}</p>
              {item.originalPrice && <p className="text-xs text-gray-400 line-through">Rp{item.originalPrice.toLocaleString()}</p>}
            </div>
            <div className="flex items-center gap-3 bg-amber-50 border-2 border-amber-200 rounded-2xl px-3 py-2">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-sm hover:bg-amber-100 transition-all">
                <Minus size={16} className="text-amber-700" />
              </button>
              <span className="font-extrabold text-gray-900 text-lg w-6 text-center">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-sm hover:shadow-md transition-all">
                <Plus size={16} className="text-white" />
              </button>
            </div>
          </div>
          <button
            onClick={handleAdd}
            className={`w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-3 ${
              addedToCart
                ? "bg-green-500 text-white shadow-lg"
                : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:scale-[1.02]"
            }`}
          >
            {addedToCart ? <><Check size={20} /> Ditambahkan!</> : <><ShoppingBag size={20} /> Tambah ke Pesanan</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Menu Card ─────────────────────────────────────────────────────────────────
function MenuCard({ item, qty, onAdd, onRemove, onClick }) {
  const badgeColor = {
    "Promo": "bg-gradient-to-r from-red-500 to-pink-500",
    "Favorit": "bg-gradient-to-r from-amber-500 to-orange-500",
    "Baru": "bg-gradient-to-r from-green-500 to-emerald-500",
    "Best Seller": "bg-gradient-to-r from-purple-500 to-pink-500",
  };
  return (
    <div
      className="flex-shrink-0 w-44 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
      onClick={onClick}
    >
      <div className="relative h-32 overflow-hidden">
        <img src={item.image + "?w=400&auto=format"} alt={item.name} className="w-full h-full object-cover" />
        {item.badge && (
          <div className={`absolute top-2 left-2 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow ${badgeColor[item.badge] || "bg-gray-500"}`}>
            {item.badge === "Promo" && item.discount ? `-${item.discount}` : item.badge}
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-bold text-gray-900 text-sm line-clamp-1">{item.name}</p>
        <div className="flex items-baseline gap-1.5 mt-1">
          <p className="text-amber-600 font-extrabold text-sm">Rp{item.price.toLocaleString()}</p>
          {item.originalPrice && <p className="text-gray-400 text-[10px] line-through">Rp{item.originalPrice.toLocaleString()}</p>}
        </div>
        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
          {qty === 0 ? (
            <button onClick={onAdd} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold py-1.5 rounded-xl hover:shadow-md hover:scale-105 transition-all">
              + Tambah
            </button>
          ) : (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-2 py-1">
              <button onClick={onRemove} className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">−</button>
              <span className="font-bold text-amber-800 text-xs">{qty}</span>
              <button onClick={onAdd} className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">+</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Riwayat Pesanan Sheet ─────────────────────────────────────────────────────
function RiwayatPesananSheet({ onClose, onNavigateToPesanan, onReorder }) {
  const [activeTab, setActiveTab] = useState("sedang");
  const sedangOrders = mockRiwayat.filter(o => o.status === "sedang");
  const selesaiOrders = mockRiwayat.filter(o => o.status === "selesai");
  const displayed = activeTab === "sedang" ? sedangOrders : selesaiOrders;
  const getTotal = (items) => items.reduce((s, i) => s + i.price * i.qty, 0);

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
        style={{ maxHeight: "88vh" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-1" />

        <div className="flex items-center justify-between px-5 pt-3 pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">Riwayat Pesanan</h2>
            <p className="text-xs text-gray-400 mt-0.5">Meja Nomor 1 · ASTAKIRA</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">
            <span className="text-gray-600 font-bold text-xl leading-none">×</span>
          </button>
        </div>

        <div className="px-5 mb-4">
          <div className="flex bg-gray-100 rounded-2xl p-1">
            <button
              onClick={() => setActiveTab("sedang")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "sedang" ? "bg-white text-amber-700 shadow-sm" : "text-gray-500"}`}
            >
              <span className={`w-2 h-2 rounded-full ${activeTab === "sedang" ? "bg-amber-500 animate-pulse" : "bg-gray-400"}`} />
              Sedang Diproses
              {sedangOrders.length > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{sedangOrders.length}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("selesai")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "selesai" ? "bg-white text-gray-700 shadow-sm" : "text-gray-500"}`}
            >
              <Check size={13} className={activeTab === "selesai" ? "text-green-500" : "text-gray-400"} />
              Sudah Selesai
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-5 pb-8 scrollbar-hide" style={{ maxHeight: "calc(88vh - 185px)" }}>
          {displayed.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🛍️</div>
              <p className="text-gray-500 font-semibold">Belum ada pesanan</p>
              <p className="text-gray-400 text-sm mt-1">
                {activeTab === "sedang" ? "Tidak ada pesanan yang sedang diproses" : "Belum ada pesanan yang selesai"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayed.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Order Header */}
                  <div className={`px-4 py-3 flex items-center justify-between ${order.status === "sedang" ? "bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100" : "bg-gray-50 border-b border-gray-100"}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${order.status === "sedang" ? "bg-amber-500" : "bg-green-500"}`}>
                        {order.status === "sedang" ? <Clock size={14} className="text-white" /> : <Check size={14} className="text-white" />}
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-gray-700">{order.id}</p>
                        <p className="text-[10px] text-gray-400">{order.waktu}</p>
                      </div>
                    </div>
                    <div>
                      {order.status === "sedang" ? (
                        <div className="flex items-center gap-1.5 bg-amber-100 border border-amber-200 rounded-full px-2.5 py-1">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                          <span className="text-[10px] font-bold text-amber-700">Est. {order.estimasi}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 bg-green-100 border border-green-200 rounded-full px-2.5 py-1">
                          <Check size={10} className="text-green-600" />
                          <span className="text-[10px] font-bold text-green-700">Selesai</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="px-4 py-3 space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm line-clamp-1">{item.name}</p>
                          <p className="text-xs text-gray-400">{item.variant} · {item.qty}×</p>
                        </div>
                        <p className="text-amber-600 font-extrabold text-sm flex-shrink-0">
                          Rp{(item.price * item.qty).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer */}
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-500">{order.items.reduce((s, i) => s + i.qty, 0)} item</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">Total:</p>
                      <p className="font-extrabold text-gray-900 text-sm">Rp{getTotal(order.items).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* ── ACTION BUTTONS ── */}

                  {/* Sedang Diproses → Tombol Lihat Detail Pesanan */}
                  {order.status === "sedang" && (
                    <div className="px-4 pb-4 pt-1">
                      <button
                        onClick={() => {
                          // Build cart from this order's items
                          const orderCart = buildCartFromOrder(order.items);
                          const cartItems = Object.values(menuDatabase).filter(m => orderCart[m.id]);
                          onClose();
                          onNavigateToPesanan({ cart: orderCart, items: cartItems, orderId: order.id });
                        }}
                        className="w-full py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <ExternalLink size={15} />
                        Lihat Detail Pesanan
                      </button>
                    </div>
                  )}

                  {/* Sudah Selesai → Tombol Pesan Lagi */}
                  {order.status === "selesai" && (
                    <div className="px-4 pb-4 pt-1">
                      <button
                        onClick={() => {
                          // Rebuild exact cart from completed order and go to checkout
                          const reorderCart = buildCartFromOrder(order.items);
                          const reorderItems = Object.values(menuDatabase).filter(m => reorderCart[m.id]);
                          onClose();
                          onReorder({ cart: reorderCart, items: reorderItems });
                        }}
                        className="w-full py-3 border-2 border-amber-400 text-amber-700 font-bold text-sm rounded-2xl hover:bg-amber-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                      >
                        <RotateCcw size={15} />
                        🔄 Pesan Lagi
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Lihat Semua Popup ─────────────────────────────────────────────────────────
function LihatSemuaPopup({ section, cart, onAdd, onRemove, onItemClick, onClose }) {
  const sectionItems = section.items.map(id => menuDatabase[id]).filter(Boolean);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const badgeColor = {
    "Promo": "bg-gradient-to-r from-red-500 to-pink-500",
    "Favorit": "bg-gradient-to-r from-amber-500 to-orange-500",
    "Baru": "bg-gradient-to-r from-green-500 to-emerald-500",
    "Best Seller": "bg-gradient-to-r from-purple-500 to-pink-500",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end animate-fadeIn"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-md mx-auto rounded-t-[2rem] animate-slideUp overflow-hidden"
        style={{ maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-sm`}>
              <span className="text-lg leading-none">{section.icon}</span>
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">{section.label}</h2>
              <p className="text-xs text-gray-400">{sectionItems.length} menu tersedia</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">
            <span className="text-gray-600 font-bold text-xl leading-none">×</span>
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4 scrollbar-hide" style={{ maxHeight: "calc(85vh - 80px)" }}>
          <div className="grid grid-cols-2 gap-3">
            {sectionItems.map((item) => {
              const qty = cart[item.id] || 0;
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
                  onClick={() => { onItemClick(item); onClose(); }}
                >
                  <div className="relative h-32 overflow-hidden">
                    <img src={item.image + "?w=400&auto=format"} alt={item.name} className="w-full h-full object-cover" />
                    {item.badge && (
                      <div className={`absolute top-2 left-2 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow ${badgeColor[item.badge] || "bg-gray-500"}`}>
                        {item.badge === "Promo" && item.discount ? `-${item.discount}` : item.badge}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-gray-900 text-sm line-clamp-1">{item.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.tagline}</p>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <p className="text-amber-600 font-extrabold text-sm">Rp{item.price.toLocaleString()}</p>
                      {item.originalPrice && <p className="text-gray-400 text-[10px] line-through">Rp{item.originalPrice.toLocaleString()}</p>}
                    </div>
                    <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                      {qty === 0 ? (
                        <button onClick={() => onAdd(item.id)} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold py-1.5 rounded-xl hover:shadow-md hover:scale-105 transition-all">
                          + Tambah
                        </button>
                      ) : (
                        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-2 py-1">
                          <button onClick={() => onRemove(item.id)} className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">−</button>
                          <span className="font-bold text-amber-800 text-xs">{qty}</span>
                          <button onClick={() => onAdd(item.id)} className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">+</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Home Component ───────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);
  const [lihatSemuaSection, setLihatSemuaSection] = useState(null);
  const [showRiwayat, setShowRiwayat] = useState(false);
  const [cart, setCart] = useState({});

  const sectionRefs = useRef({});

  // ── Cart helpers ────────────────────────────────────────────────────────────
  const addItem = (id) => setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const removeItem = (id) => setCart((prev) => {
    const updated = { ...prev };
    if (updated[id] > 1) updated[id]--;
    else delete updated[id];
    return updated;
  });

  const handleSheetAdd = (id, qty) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + qty }));
  };

  const allItems = Object.values(menuDatabase);
  const totalQty = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = allItems.reduce((sum, item) => sum + (cart[item.id] || 0) * item.price, 0);
  const cartItems = allItems.filter((item) => (cart[item.id] || 0) > 0);

  // ── Navigate to Pesanan (checkout) ─────────────────────────────────────────
  const handleCheckout = () => {
    navigate("/pesanan", { state: { cart, items: cartItems } });
  };

  // ── Navigate to Pesanan from Riwayat "Lihat Detail" (sedang) ──────────────
  const handleNavigateToPesanan = ({ cart: orderCart, items: orderItems, orderId }) => {
    navigate("/pesanan", {
      state: {
        cart: orderCart,
        items: orderItems,
        fromRiwayat: true,
        orderId,
      },
    });
  };

  // ── Reorder from Riwayat "Pesan Lagi" (selesai) ───────────────────────────
  // Merges reorder cart with current cart then navigates to checkout
  const handleReorder = ({ cart: reorderCart, items: reorderItems }) => {
    // Merge reorder items into current cart
    const mergedCart = { ...cart };
    Object.entries(reorderCart).forEach(([id, qty]) => {
      mergedCart[id] = (mergedCart[id] || 0) + qty;
    });

    // Update local cart state so floating checkout also reflects it
    setCart(mergedCart);

    const mergedItems = Object.values(menuDatabase).filter(m => mergedCart[m.id]);
    navigate("/pesanan", {
      state: {
        cart: mergedCart,
        items: mergedItems,
        isReorder: true,
      },
    });
  };

  // ── Category scroll ─────────────────────────────────────────────────────────
  const handleCategoryClick = (catId) => {
    setActiveCategory(catId);
    if (catId === "all") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = sectionRefs.current[catId];
    if (el) {
      const OFFSET = 172;
      const y = el.getBoundingClientRect().top + window.scrollY - OFFSET;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const handleOpenRelatedItem = (item) => {
    setSelectedItem(item);
  };

  return (
    <div className="relative min-h-screen bg-gray-50">

      {/* ── NAVBAR ── */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-extrabold text-lg">A</span>
              </div>
              <div>
                <p className="font-extrabold text-sm text-gray-900 leading-none">ASTAKIRA</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin size={10} className="text-amber-500" />
                  <p className="text-xs text-gray-400">Ciakar, Tasikmalaya</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/search")}
                className="w-9 h-9 flex items-center justify-center bg-amber-50 rounded-xl hover:bg-amber-100 transition-all"
              >
                <Search size={17} className="text-amber-700" />
              </button>
              <button
                onClick={() => setShowRiwayat(true)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl px-3 h-9 shadow-md hover:shadow-lg transition-all relative"
              >
                <ShoppingBag size={15} className="text-white" />
                <span className="text-white text-xs font-bold">Riwayat</span>
                {mockRiwayat.filter(o => o.status === "sedang").length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-[9px] font-bold">{mockRiwayat.filter(o => o.status === "sedang").length}</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto">

        {/* ── HERO IMAGE ── */}
        <div className="relative h-44 overflow-hidden">
          <img src="https://images.unsplash.com/photo-1765894711260-9d881459ddb4?w=800&auto=format" alt="Hero" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        {/* ── MEJA BANNER ── */}
        <div className="px-4 pt-4 mb-5">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl px-5 py-3.5 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <div className="flex items-center gap-3">
              <p className="text-white font-bold text-base">Meja Nomor 1</p>
            </div>
          </div>
        </div>

        {/* ── CATEGORY BAR (sticky) ── */}
        <div className="sticky top-16 z-30 bg-gray-50 pb-3 pt-2">
          <div className="px-4 mb-2">
            <h2 className="text-base font-bold text-gray-900">Pilihan Kuliner Favoritmu</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide px-4 pt-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className="flex-shrink-0 flex flex-col items-center gap-1.5"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow transition-all duration-200 ${
                  activeCategory === cat.id
                    ? `bg-gradient-to-br ${cat.color} scale-110 shadow-lg ring-2 ring-amber-400 ring-offset-2`
                    : "bg-white border-2 border-gray-100"
                }`}>
                  <span className="text-xl">{cat.icon}</span>
                </div>
                <span className={`text-[11px] font-semibold whitespace-nowrap ${activeCategory === cat.id ? "text-amber-600" : "text-gray-500"}`}>
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── MENU SECTIONS ── */}
        <div className="pb-36 mt-2">
          {categorySections.map((section) => {
            const sectionItems = section.items.map(id => menuDatabase[id]).filter(Boolean);
            return (
              <div
                key={section.id}
                id={`section-${section.id}`}
                ref={(el) => { sectionRefs.current[section.id] = el; }}
                className="mb-8"
              >
                <div className="px-4 flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-sm`}>
                      <span className="text-base leading-none">{section.icon}</span>
                    </div>
                    <h2 className="text-base font-bold text-gray-900">{section.label}</h2>
                  </div>
                  <button
                    onClick={() => setLihatSemuaSection(section)}
                    className="text-xs text-amber-600 font-semibold hover:text-amber-700 transition-colors"
                  >
                    Lihat Semua →
                  </button>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-4">
                  {sectionItems.map((item) => (
                    <MenuCard
                      key={item.id}
                      item={item}
                      qty={cart[item.id] || 0}
                      onAdd={() => addItem(item.id)}
                      onRemove={() => removeItem(item.id)}
                      onClick={() => setSelectedItem(item)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── FLOATING CHECKOUT ── */}
        {totalQty > 0 && !selectedItem && (
          <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6">
            <div className="max-w-md mx-auto">
              <button
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 rounded-3xl p-5 shadow-2xl border border-amber-400/50 hover:scale-[1.01] transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 relative">
                      <ShoppingBag className="text-white" size={20} />
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">{totalQty}</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-white/80 text-xs font-medium mb-0.5">{totalQty} Item dipilih</p>
                      <p className="text-white text-xl font-bold">Rp{totalPrice.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="bg-white text-amber-700 px-6 py-3 rounded-2xl font-bold shadow-xl whitespace-nowrap">
                    Checkout →
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── RIWAYAT SHEET ── */}
      {showRiwayat && (
        <RiwayatPesananSheet
          onClose={() => setShowRiwayat(false)}
          onNavigateToPesanan={handleNavigateToPesanan}
          onReorder={handleReorder}
        />
      )}

      {/* ── LIHAT SEMUA POPUP ── */}
      {lihatSemuaSection && (
        <LihatSemuaPopup
          section={lihatSemuaSection}
          cart={cart}
          onAdd={addItem}
          onRemove={removeItem}
          onItemClick={setSelectedItem}
          onClose={() => setLihatSemuaSection(null)}
        />
      )}

      {/* ── MENU DETAIL SHEET ── */}
      {selectedItem && (
        <MenuDetailSheet
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToCart={handleSheetAdd}
          onOpenItem={(item) => setSelectedItem(item)}
        />
      )}

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}