import { useState, useRef, useEffect } from "react";
import { Search, ArrowLeft, X, TrendingUp, Clock, Star, Flame, Zap, Coffee } from "lucide-react";

// ── Menu Database ─────────────────────────────────────────────────────────────
const allMenuItems = [
  {
    id: 1, name: "Espresso Premium", price: 11000, category: "Kopi",
    description: "Arabika Flores medium-dark, aftertaste cokelat & karamel",
    image: "https://images.unsplash.com/photo-1545731939-9c302d5d27ed?w=400&auto=format",
    rating: 4.8, reviews: 128, badge: "Best Seller", hot: true,
  },
  {
    id: 2, name: "Caffe Latte", price: 15000, category: "Kopi",
    description: "Espresso arabika dengan microfoam susu lembut sempurna",
    image: "https://images.unsplash.com/photo-1763473821509-9a383b480844?w=400&auto=format",
    rating: 4.9, reviews: 215, badge: null, hot: true,
  },
  {
    id: 3, name: "Cappuccino", price: 14000, category: "Kopi",
    description: "Tradisi Italia, lapisan espresso & busa susu tebal",
    image: "https://images.unsplash.com/photo-1506188044630-210826194885?w=400&auto=format",
    rating: 4.7, reviews: 98, badge: null, hot: false,
  },
  {
    id: 6, name: "Americano", price: 12000, category: "Kopi",
    description: "Double shot espresso dengan air panas berkualitas tinggi",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format",
    rating: 4.6, reviews: 74, badge: null, hot: false,
  },
  {
    id: 4, name: "Tiramisu Delight", price: 18000, originalPrice: 25000, category: "Dessert",
    description: "Ladyfinger, mascarpone premium, dan cokelat bubuk berkualitas",
    image: "https://images.unsplash.com/photo-1766734974600-b6ea9a40a03a?w=400&auto=format",
    rating: 4.9, reviews: 167, badge: "Promo", hot: true,
  },
  {
    id: 5, name: "Chocolate Lava Cake", price: 20000, originalPrice: 28000, category: "Dessert",
    description: "Dipanggang fresh, lelehan cokelat 70% yang mengalir sempurna",
    image: "https://images.unsplash.com/photo-1766735007331-e720ca937c83?w=400&auto=format",
    rating: 5.0, reviews: 203, badge: "Promo", hot: true,
  },
  {
    id: 7, name: "Nasi Goreng Spesial", price: 22000, category: "Makanan",
    description: "Bumbu rempah pilihan, ayam suwir, telur mata sapi, acar segar",
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&auto=format",
    rating: 4.8, reviews: 312, badge: "Favorit", hot: false,
  },
  {
    id: 8, name: "Mie Goreng Jumbo", price: 20000, category: "Makanan",
    description: "Bumbu khas, sayuran segar, bakso, kerupuk renyah",
    image: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&auto=format",
    rating: 4.7, reviews: 198, badge: null, hot: false,
  },
  {
    id: 9, name: "Kentang Goreng Crispy", price: 15000, category: "Snack",
    description: "Krispy seasoning spesial, saus sambal & mayonaise",
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&auto=format",
    rating: 4.5, reviews: 156, badge: null, hot: false,
  },
  {
    id: 10, name: "Pisang Goreng Crispy", price: 12000, category: "Snack",
    description: "Pisang kepok, tepung renyah, saus karamel, keju parut",
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&auto=format",
    rating: 4.6, reviews: 89, badge: "Baru", hot: false,
  },
  {
    id: 11, name: "Es Teh Manis", price: 8000, category: "Minuman",
    description: "Teh pilihan diseduh segar, gula asli, es batu menyegarkan",
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&auto=format",
    rating: 4.4, reviews: 445, badge: null, hot: false,
  },
  {
    id: 12, name: "Jus Alpukat", price: 18000, category: "Minuman",
    description: "Alpukat segar, susu full cream, madu — kental menyehatkan",
    image: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&auto=format",
    rating: 4.8, reviews: 178, badge: "Favorit", hot: true,
  },
];

const recentSearches = ["Espresso", "Latte", "Tiramisu"];
const trendingSearches = ["Chocolate Lava Cake", "Nasi Goreng", "Caffe Latte"];

const categoryFilters = ["Semua", "Kopi", "Makanan", "Dessert", "Minuman", "Snack"];

const badgeStyle = {
  "Best Seller": { bg: "bg-purple-500", text: "Best Seller" },
  "Promo":       { bg: "bg-red-500",    text: "Promo" },
  "Favorit":     { bg: "bg-amber-500",  text: "Favorit" },
  "Baru":        { bg: "bg-green-500",  text: "Baru" },
};

// ── Star Rating ───────────────────────────────────────────────────────────────
function Stars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star
          key={i}
          size={10}
          className={i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-600"}
        />
      ))}
    </div>
  );
}

// ── Menu Card ─────────────────────────────────────────────────────────────────
function MenuCard({ item, index, onAdd }) {
  const [added, setAdded] = useState(false);

  const handleAdd = (e) => {
    e.stopPropagation();
    setAdded(true);
    onAdd?.(item);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Image */}
      <div className="relative w-28 h-28 flex-shrink-0 overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />

        {/* Badge */}
        {item.badge && (
          <div className={`absolute top-2 left-2 ${badgeStyle[item.badge]?.bg} text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow`}>
            {badgeStyle[item.badge]?.text}
          </div>
        )}

        {/* Hot indicator */}
        {item.hot && (
          <div className="absolute bottom-2 left-2 flex items-center gap-0.5 bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5">
            <Flame size={9} className="text-orange-400" />
            <span className="text-[9px] text-orange-300 font-bold">Hot</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-1 mb-1">
            <p className="font-extrabold text-gray-900 text-sm leading-tight line-clamp-1">{item.name}</p>
            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-lg whitespace-nowrap flex-shrink-0">
              {item.category}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed mb-2">{item.description}</p>
          <div className="flex items-center gap-1.5">
            <Stars rating={item.rating} />
            <span className="text-[10px] font-bold text-gray-700">{item.rating}</span>
            <span className="text-[10px] text-gray-400">({item.reviews})</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="font-extrabold text-amber-600 text-base leading-none">
              Rp{item.price.toLocaleString()}
            </p>
            {item.originalPrice && (
              <p className="text-[10px] text-gray-400 line-through">Rp{item.originalPrice.toLocaleString()}</p>
            )}
          </div>
          <button
            onClick={handleAdd}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-300 ${
              added
                ? "bg-green-500 text-white scale-95 shadow-lg shadow-green-500/30"
                : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/30 hover:scale-105"
            }`}
          >
            {added ? "✓ Added!" : "+ Tambah"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main SearchPage ───────────────────────────────────────────────────────────
export default function SearchPage({ onBack }) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setTimeout(() => setShowSuggestions(false), 150);
  };

  const handleSuggestionClick = (term) => {
    setQuery(term);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const clearQuery = () => {
    setQuery("");
    setActiveCategory("Semua");
    inputRef.current?.focus();
  };

  // Filter logic
  const filtered = allMenuItems.filter(item => {
    const matchQuery = query === "" || item.name.toLowerCase().includes(query.toLowerCase()) || item.description.toLowerCase().includes(query.toLowerCase());
    const matchCat = activeCategory === "Semua" || item.category === activeCategory;
    return matchQuery && matchCat;
  });

  const hasQuery = query.length > 0;
  const showEmpty = hasQuery && filtered.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto">

      {/* ── STICKY HEADER ───────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 bg-white shadow-sm">

        {/* Search bar row */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          {/* Back button */}
          <button
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded-xl hover:bg-amber-100 hover:text-amber-700 transition-all" onClick={() => window.location.href = "/user"}>
            <ArrowLeft size={18} className="text-gray-700" />
          </button>

          {/* Input wrapper */}
          <div className={`flex-1 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border-2 transition-all duration-200 ${
            isFocused
              ? "border-amber-500 bg-amber-50/40 shadow-lg shadow-amber-500/10"
              : "border-gray-200 bg-gray-50"
          }`}>
            <Search size={17} className={`flex-shrink-0 transition-colors ${isFocused ? "text-amber-500" : "text-gray-400"}`} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Cari menu favorit kamu..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className="flex-1 bg-transparent outline-none text-sm font-semibold text-gray-900 placeholder-gray-400"
            />
            {query && (
              <button onClick={clearQuery} className="w-5 h-5 flex-shrink-0 flex items-center justify-center bg-gray-300 hover:bg-gray-400 rounded-full transition-all">
                <X size={12} className="text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && !hasQuery && (
          <div className="px-4 pb-4 border-t border-gray-100 animate-slideDown">
            {/* Recent */}
            <div className="mt-3 mb-4">
              <div className="flex items-center gap-2 mb-2.5">
                <Clock size={13} className="text-gray-400" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Pencarian Terakhir</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term, i) => (
                  <button
                    key={i}
                    onMouseDown={() => handleSuggestionClick(term)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-amber-100 hover:text-amber-700 text-gray-600 rounded-xl text-xs font-semibold transition-all"
                  >
                    <Clock size={10} className="opacity-50" />
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* Trending */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <TrendingUp size={13} className="text-amber-500" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Sedang Trending</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingSearches.map((term, i) => (
                  <button
                    key={i}
                    onMouseDown={() => handleSuggestionClick(term)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-amber-500/30 hover:scale-105 transition-all"
                  >
                    <Flame size={10} />
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Category filter pills */}
        {!showSuggestions && (
          <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
            {categoryFilters.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-extrabold border-2 transition-all ${
                  activeCategory === cat
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent shadow-md shadow-amber-500/25"
                    : "bg-white text-gray-500 border-gray-200 hover:border-amber-300 hover:text-amber-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────── */}
      <div className="px-4 py-4">

        {/* Result header */}
        {hasQuery ? (
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <Search size={14} className="text-amber-500" />
              <p className="text-sm font-bold text-gray-900">
                Hasil untuk <span className="text-amber-600">"{query}"</span>
              </p>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 ml-5">{filtered.length} menu ditemukan</p>
          </div>
        ) : (
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">
                {activeCategory === "Semua" ? "Semua Menu ✨" : `Menu ${activeCategory}`}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">{filtered.length} pilihan tersedia</p>
            </div>
            {/* Hot picks badge */}
            <div className="flex items-center gap-1 bg-orange-50 border border-orange-200 rounded-xl px-2.5 py-1.5">
              <Zap size={12} className="text-orange-500" />
              <span className="text-[10px] font-extrabold text-orange-600">
                {allMenuItems.filter(i => i.hot).length} HOT PICKS
              </span>
            </div>
          </div>
        )}

        {/* ── EMPTY STATE ──────────────────────────────────────────── */}
        {showEmpty ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center">
                <Coffee size={40} className="text-amber-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white">
                <Search size={16} className="text-gray-400" />
              </div>
            </div>
            <p className="font-extrabold text-gray-900 text-lg mb-1">Menu tidak ditemukan</p>
            <p className="text-sm text-gray-400 mb-6 max-w-xs">
              Coba kata kunci lain atau pilih dari kategori yang tersedia
            </p>
            <button
              onClick={clearQuery}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-amber-500/25 hover:scale-105 transition-all"
            >
              Lihat Semua Menu
            </button>
          </div>
        ) : (
          /* ── MENU GRID ─────────────────────────────────────────── */
          <div className="space-y-3 pb-24">
            {/* Hot picks highlight row — only when no search and category = Semua */}
            {!hasQuery && activeCategory === "Semua" && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <Flame size={13} className="text-white" />
                  </div>
                  <span className="font-extrabold text-gray-900 text-sm">🔥 Paling Banyak Dipesan</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  {allMenuItems.filter(i => i.hot).map((item) => (
                    <div key={item.id} className="flex-shrink-0 w-36 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
                      <div className="relative h-24 overflow-hidden">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                          <Star size={8} className="fill-amber-400 text-amber-400" />
                          <span className="text-white text-[9px] font-bold">{item.rating}</span>
                        </div>
                        {item.badge && (
                          <div className={`absolute top-1.5 right-1.5 ${badgeStyle[item.badge]?.bg} text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full`}>
                            {badgeStyle[item.badge]?.text}
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="font-bold text-gray-900 text-xs line-clamp-1">{item.name}</p>
                        <p className="text-amber-600 font-extrabold text-xs mt-0.5">Rp{item.price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mt-4 mb-4" />
                <p className="font-extrabold text-gray-900 text-sm mb-3">📋 Semua Menu</p>
              </div>
            )}

            {/* Main list */}
            {filtered.map((item, i) => (
              <MenuCard key={item.id} item={item} index={i} />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown { animation: slideDown 0.2s ease-out; }
        .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}