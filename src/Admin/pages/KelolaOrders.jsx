import { useState } from "react";
import { ClipboardList, MessageSquare, Check } from "lucide-react";

/* ─── Dummy Data ─────────────────────────────────────────────────────────── */
const dummyOrders = [
  {
    id: "ORD-001",
    meja: 3,
    status: "proses",
    waktu: "10:24",
    nama: "Budi Santoso",
    total: 43000,
    note: "Tidak pakai es untuk semua minuman",
    itemNotes: { "Caffe Latte": "Gula sedikit" },
    items: [
      { name: "Caffe Latte",         qty: 2, price: 15000 },
      { name: "Espresso Premium",    qty: 1, price: 11000 },
      { name: "Tiramisu Delight",    qty: 1, price: 2000  },
    ],
  },
  {
    id: "ORD-002",
    meja: 7,
    status: "proses",
    waktu: "10:31",
    nama: "Rina Kurnia",
    total: 34000,
    note: "",
    itemNotes: {},
    items: [
      { name: "Cappuccino",          qty: 1, price: 14000 },
      { name: "Chocolate Lava Cake", qty: 1, price: 20000 },
    ],
  },
  {
    id: "ORD-003",
    meja: 1,
    status: "proses",
    waktu: "10:45",
    nama: "Dimas Fauzi",
    total: 30000,
    note: "Pedas sedikit untuk snack-nya",
    itemNotes: { "Americano": "Double shot" },
    items: [
      { name: "Americano",           qty: 1, price: 12000 },
      { name: "Tiramisu Delight",    qty: 1, price: 18000 },
    ],
  },
  {
    id: "ORD-004",
    meja: 5,
    status: "selesai",
    waktu: "09:55",
    nama: "Sari Wulandari",
    total: 30000,
    note: "",
    itemNotes: {},
    items: [
      { name: "Caffe Latte",         qty: 2, price: 15000 },
    ],
  },
  {
    id: "ORD-005",
    meja: 2,
    status: "selesai",
    waktu: "09:40",
    nama: "Agus Salim",
    total: 58000,
    note: "",
    itemNotes: { "Cappuccino": "Tanpa foam" },
    items: [
      { name: "Cappuccino",          qty: 2, price: 14000 },
      { name: "Chocolate Lava Cake", qty: 1, price: 20000 },
      { name: "Espresso Premium",    qty: 1, price: 11000 },
    ],
  },
  {
    id: "ORD-006",
    meja: 9,
    status: "proses",
    waktu: "10:52",
    nama: "Hana Safitri",
    total: 20000,
    note: "Tolong lebih hangat dari biasanya",
    itemNotes: {},
    items: [
      { name: "Chocolate Lava Cake", qty: 1, price: 20000 },
    ],
  },
];

/* ─── Status Config ──────────────────────────────────────────────────────── */
const statusConfig = {
  proses:  { dot: "bg-amber-400", label: "Diproses", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  selesai: { dot: "bg-green-500", label: "Selesai",  bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
};

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function KelolaOrders() {
  const [orders, setOrders] = useState(dummyOrders);
  const [filter, setFilter] = useState("all");

  const validOrders = orders.filter(o => o.status === "proses" || o.status === "selesai");
  const filtered    = filter === "all" ? validOrders : validOrders.filter(o => o.status === filter);

  const markSelesai = (id) => {
    setOrders(prev => prev.map(o => (o.id !== id ? o : { ...o, status: "selesai" })));
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-gray-900">Kelola Pesanan</h1>
          <p className="text-gray-400 text-sm">
            {validOrders.filter(o => o.status === "proses").length} pesanan diproses
          </p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-amber-700">Live</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { k: "all",     l: "Semua" },
          { k: "proses",  l: "Diproses" },
          { k: "selesai", l: "Selesai" },
        ].map(({ k, l }) => {
          const count = k === "all" ? validOrders.length : validOrders.filter(o => o.status === k).length;
          const s = statusConfig[k];
          return (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                filter === k
                  ? "bg-gray-900 text-white shadow-md"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {k !== "all" && <div className={`w-1.5 h-1.5 rounded-full ${s?.dot}`} />}
              {l}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                filter === k ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Order Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map(order => {
          const s         = statusConfig[order.status] ?? statusConfig.proses;
          const hasNotes  = order.note || (order.itemNotes && Object.keys(order.itemNotes).length > 0);
          const isSelesai = order.status === "selesai";
          const itemList  = (order.items ?? []).filter(i => (i.qty ?? 1) > 0);

          return (
            <div
              key={order.id}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-all ${s.border}`}
            >
              {/* Card Header */}
              <div className={`px-4 py-3 flex items-center justify-between border-b ${s.bg}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${s.dot} ${!isSelesai ? "animate-pulse" : ""}`} />
                  <span className="font-bold text-gray-900 text-sm">{order.id}</span>
                  <span className="text-xs text-gray-500">Meja {order.meja}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {hasNotes && (
                    <div className="w-5 h-5 bg-orange-400 rounded-md flex items-center justify-center">
                      <MessageSquare size={11} className="text-white" />
                    </div>
                  )}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text} border border-current/20`}>
                    {s.label}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="px-4 py-3">
                <p className="text-xs text-gray-400 mb-2">
                  {order.waktu ?? order.created_at} · {order.nama ?? order.nama_pelanggan}
                </p>
                <div className="space-y-1.5">
                  {itemList.map((item, i) => (
                    <div key={i} className="flex justify-between items-start">
                      <div className="min-w-0">
                        <span className="text-sm text-gray-700">{item.qty}× {item.name ?? item.nama}</span>
                        {order.itemNotes?.[item.name] && (
                          <p className="text-[10px] text-orange-500 font-medium mt-0.5">
                            📝 {order.itemNotes[item.name]}
                          </p>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-gray-500 flex-shrink-0 ml-2">
                        Rp{((item.qty ?? 1) * (item.price ?? item.harga ?? 0)).toLocaleString("id-ID")}
                      </span>
                    </div>
                  ))}
                </div>

                {order.note && (
                  <div className="mt-2.5 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 flex items-start gap-2">
                    <MessageSquare size={12} className="text-orange-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-orange-700 font-medium">{order.note}</p>
                  </div>
                )}

                <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {itemList.reduce((s, i) => s + (i.qty ?? 1), 0)} item
                  </span>
                  <span className="font-extrabold text-gray-900 text-sm">
                    Rp{(order.total ?? 0).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Action */}
              <div className="px-4 pb-3">
                {!isSelesai ? (
                  <button
                    onClick={() => markSelesai(order.id)}
                    className="w-full py-2.5 rounded-xl font-bold text-sm bg-green-500 hover:bg-green-600 text-white transition-all active:scale-95"
                  >
                    ✓ Tandai Selesai
                  </button>
                ) : (
                  <div className="w-full py-2 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center gap-2">
                    <Check size={14} className="text-green-500" />
                    <span className="text-xs font-semibold text-gray-500">Pesanan Selesai</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400">
            <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Tidak ada pesanan</p>
          </div>
        )}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}