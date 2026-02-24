// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS & INITIAL DATA
// ─────────────────────────────────────────────────────────────────────────────

export const defaultCategories = ["coffee", "makanan", "dessert", "minuman", "snack"];

export const categoryColors = {
  coffee:  "bg-amber-100 text-amber-700",
  makanan: "bg-orange-100 text-orange-700",
  dessert: "bg-pink-100 text-pink-700",
  minuman: "bg-blue-100 text-blue-700",
  snack:   "bg-yellow-100 text-yellow-700",
};

export const getCatColor = (c) => categoryColors[c] || "bg-gray-100 text-gray-600";

export const badgeOptions = ["", "Best Seller", "Promo", "Favorit", "Baru"];

export const statusColors = {
  baru:    { bg:"bg-blue-100",  text:"text-blue-700",  dot:"bg-blue-500",  label:"Baru" },
  proses:  { bg:"bg-amber-100", text:"text-amber-700", dot:"bg-amber-500", label:"Diproses" },
  siap:    { bg:"bg-green-100", text:"text-green-700", dot:"bg-green-500", label:"Siap Antar" },
  selesai: { bg:"bg-gray-100",  text:"text-gray-600",  dot:"bg-gray-400",  label:"Selesai" },
};

export const statusFlow = { baru:"proses", proses:"siap", siap:"selesai" };

export const todayStr = new Date().toISOString().split("T")[0];

// ── Promo helpers ─────────────────────────────────────────────────────────────
export const isPromoActive = (p) => p.startDate <= todayStr && todayStr <= p.endDate;

export const getPromoStatus = (p) => {
  if (todayStr < p.startDate) return { label:"Belum Mulai", color:"bg-blue-100 text-blue-700",   icon:"⏳" };
  if (todayStr > p.endDate)   return { label:"Berakhir",    color:"bg-gray-100 text-gray-500",    icon:"✕" };
  return                               { label:"Aktif",       color:"bg-green-100 text-green-700", icon:"✓" };
};

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL DATA
// ─────────────────────────────────────────────────────────────────────────────

export const initialMenuItems = [
  { id:1, name:"Espresso Premium", tagline:"Jiwa sejati para penikmat kopi", description:"Arabika Flores dipanggang medium-dark.", category:"coffee", price:11000, stock:true, rating:4.8, totalReviews:128, sold:128, image:"https://images.unsplash.com/photo-1545731939-9c302d5d27ed?w=200&auto=format", badge:"Best Seller", variants:[{label:"Single Shot",price:11000},{label:"Double Shot",price:16000}], reviews:[], related:[] },
  { id:2, name:"Caffe Latte", tagline:"Kelembutan dalam setiap tegukan", description:"Espresso + microfoam susu segar.", category:"coffee", price:15000, stock:true, rating:4.9, totalReviews:215, sold:215, image:"https://images.unsplash.com/photo-1763473821509-9a383b480844?w=200&auto=format", badge:null, variants:[{label:"Hot",price:15000},{label:"Iced",price:17000}], reviews:[], related:[] },
  { id:3, name:"Cappuccino", tagline:"Tradisi Italia di setiap cangkir", description:"Espresso + steamed milk + milk foam.", category:"coffee", price:14000, stock:true, rating:4.7, totalReviews:98, sold:98, image:"https://images.unsplash.com/photo-1506188044630-210826194885?w=200&auto=format", badge:null, variants:[{label:"Hot",price:14000},{label:"Iced",price:16000}], reviews:[], related:[] },
  { id:4, name:"Tiramisu Delight", tagline:"Pengangkat semangat dari Italia", description:"Ladyfinger espresso + mascarpone.", category:"dessert", price:18000, stock:true, rating:4.9, totalReviews:167, sold:167, image:"https://images.unsplash.com/photo-1766734974600-b6ea9a40a03a?w=200&auto=format", badge:"Promo", variants:[{label:"Regular",price:18000},{label:"Large",price:25000}], reviews:[], related:[] },
  { id:5, name:"Chocolate Lava Cake", tagline:"Magma cokelat yang tak terlupakan", description:"Fresh-baked, cokelat cair di dalam.", category:"dessert", price:20000, stock:false, rating:5.0, totalReviews:203, sold:203, image:"https://images.unsplash.com/photo-1766735007331-e720ca937c83?w=200&auto=format", badge:"Promo", variants:[{label:"Original",price:20000},{label:"+Vanilla Ice Cream",price:27000}], reviews:[], related:[] },
  { id:6, name:"Nasi Goreng Spesial", tagline:"Cita rasa rumahan menggugah selera", description:"Bumbu rempah, ayam suwir, telur mata sapi.", category:"makanan", price:22000, stock:true, rating:4.8, totalReviews:312, sold:312, image:"https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=200&auto=format", badge:"Favorit", variants:[{label:"Regular",price:22000},{label:"Extra Ayam",price:28000}], reviews:[], related:[] },
  { id:7, name:"Es Teh Manis", tagline:"Segar menyegarkan", description:"Teh segar + gula asli + es batu.", category:"minuman", price:8000, stock:true, rating:4.4, totalReviews:445, sold:445, image:"https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&auto=format", badge:null, variants:[{label:"Regular",price:8000},{label:"Large",price:11000}], reviews:[], related:[] },
  { id:8, name:"Kentang Goreng Crispy", tagline:"Renyah di luar, lembut di dalam", description:"Seasoning spesial + saus sambal & mayo.", category:"snack", price:15000, stock:true, rating:4.5, totalReviews:156, sold:156, image:"https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=200&auto=format", badge:null, variants:[{label:"Regular",price:15000},{label:"Large",price:20000}], reviews:[], related:[] },
];

export const initialOrders = [
  { id:"ORD-001", meja:1, waktu:"08:32", items:[{name:"Caffe Latte",qty:2,price:15000},{name:"Tiramisu Delight",qty:1,price:18000}], total:48000, status:"baru",    nama:"Budi S.",  note:"Tolong susunya dikurangi", itemNotes:{"Caffe Latte":"Iced saja"} },
  { id:"ORD-002", meja:3, waktu:"08:45", items:[{name:"Espresso Premium",qty:1,price:11000},{name:"Kentang Goreng Crispy",qty:1,price:15000}], total:26000, status:"proses",  nama:"Siti R.",  note:"", itemNotes:{} },
  { id:"ORD-003", meja:5, waktu:"09:01", items:[{name:"Nasi Goreng Spesial",qty:2,price:22000},{name:"Es Teh Manis",qty:2,price:8000}], total:60000, status:"siap",    nama:"Deni K.",  note:"Tidak pakai pedas", itemNotes:{"Nasi Goreng Spesial":"Tanpa bawang"} },
  { id:"ORD-004", meja:2, waktu:"09:15", items:[{name:"Espresso Premium",qty:1,price:11000}], total:11000, status:"selesai", nama:"Rina M.",  note:"", itemNotes:{} },
  { id:"ORD-005", meja:7, waktu:"09:22", items:[{name:"Chocolate Lava Cake",qty:2,price:20000}], total:40000, status:"baru",    nama:"Hasan P.", note:"Tambah lilin ulang tahun", itemNotes:{} },
];

export const initialTables = Array.from({length:8},(_,i)=>({
  id: i+1,
  status: [1,3,5].includes(i+1) ? "occupied" : "available",
  capacity: i<3?2:i<6?4:6,
  currentOrder: [1,3,5].includes(i+1) ? `ORD-00${[1,3,5].indexOf(i+1)+1}` : null,
}));

export const initialPromoCodes = [
  { id:1, code:"ASTAKIRA10", discountType:"percent", discountValue:10, discount:"10%",       description:"Diskon 10% untuk semua menu",          minOrder:20000, startDate:"2026-01-01", endDate:"2026-12-31", used:42 },
  { id:2, code:"NEWUSER",    discountType:"flat",    discountValue:5000, discount:"Rp5.000", description:"Diskon Rp5.000 untuk pelanggan baru",    minOrder:15000, startDate:"2026-02-01", endDate:"2026-03-31", used:18 },
  { id:3, code:"KOPI20",     discountType:"percent", discountValue:20, discount:"20%",       description:"Diskon 20% khusus menu kopi",            minOrder:10000, startDate:"2026-02-20", endDate:"2026-02-28", used:31 },
];
