import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  ChevronLeft, Plus, Minus, Edit3, ShoppingBag,
  Receipt, AlertCircle, Trash2, X, Tag, Clock
} from "lucide-react";

export default function Pesanan() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [cart, setCart] = useState(state?.cart || {});
  const items = state?.items || [];

  const [openNote, setOpenNote] = useState(false);
  const [openItemNote, setOpenItemNote] = useState(null);
  const [note, setNote] = useState("");
  const [itemNotes, setItemNotes] = useState({});
  const [removing, setRemoving] = useState(null);

  const orderedItems = items.filter((i) => cart[i.id] > 0);

  const addItem = (id) =>
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));

  const removeItem = (id) => {
    if (cart[id] === 1) {
      setRemoving(id);
      setTimeout(() => {
        setCart((prev) => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });
        setRemoving(null);
      }, 300);
    } else {
      setCart((prev) => ({ ...prev, [id]: prev[id] - 1 }));
    }
  };

  const subtotal = orderedItems.reduce(
    (sum, i) => sum + (cart[i.id] || 0) * i.price,
    0
  );
  const totalQty = orderedItems.reduce((s, i) => s + (cart[i.id] || 0), 0);

  const handleProceedPayment = () => {
    navigate("/pembayaran", {
      state: { cart, items, note, itemNotes, subtotal },
    });
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 relative">

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3.5">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
          >
            <ChevronLeft size={20} className="text-gray-700" />
          </button>

          <div className="text-center">
            <h1 className="font-extrabold text-base text-gray-900">Pesanan Saya</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">Meja Nomor 1 · ASTAKIRA</p>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-3 py-2 rounded-xl hover:bg-amber-100 transition-all"
          >
            <Plus size={13} />
            Tambah
          </button>
        </div>
      </div>

      <div className="pb-36">

        {/* ── ORDER SUMMARY BANNER ── */}
        <div className="px-4 pt-4 mb-5">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl px-5 py-4 shadow-lg shadow-amber-500/20">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                  <ShoppingBag size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-white/70 text-xs font-medium">Total Pesanan</p>
                  <p className="font-extrabold text-xl">{totalQty} Item</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-xs font-medium">Subtotal</p>
                <p className="font-extrabold text-xl">Rp{subtotal.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── EMPTY STATE ── */}
        {orderedItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <p className="font-bold text-gray-700 text-lg mb-1">Keranjang Kosong</p>
            <p className="text-gray-400 text-sm mb-6">Yuk, pilih menu favoritmu!</p>
            <button
              onClick={() => navigate(-1)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-3 rounded-2xl font-bold shadow-lg"
            >
              Pilih Menu
            </button>
          </div>
        )}

        {/* ── ITEMS LIST ── */}
        {orderedItems.length > 0 && (
          <div className="px-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Receipt size={16} className="text-amber-600" />
              <h2 className="font-extrabold text-sm text-gray-900">Daftar Pesanan</h2>
              <span className="ml-auto text-xs text-gray-400">{orderedItems.length} menu</span>
            </div>

            <div className="space-y-3">
              {orderedItems.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 ${
                    removing === item.id ? "opacity-0 scale-95" : "opacity-100 scale-100"
                  }`}
                >
                  <div className="flex gap-3 p-3">
                    {/* Image */}
                    {item.image && (
                      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                        <img
                          src={item.image + "?w=200&auto=format"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 text-sm leading-tight line-clamp-1">
                            {item.name}
                          </p>
                          {item.category && (
                            <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wide mt-0.5">
                              {item.category}
                            </p>
                          )}
                          <p className="text-amber-600 font-extrabold text-sm mt-1">
                            Rp{item.price.toLocaleString()}
                          </p>
                        </div>
                        {/* Qty Control */}
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-2 py-1.5 flex-shrink-0">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold"
                          >
                            {cart[item.id] === 1 ? <Trash2 size={11} /> : <Minus size={11} />}
                          </button>
                          <span className="font-extrabold text-amber-800 text-sm w-5 text-center">
                            {cart[item.id]}
                          </span>
                          <button
                            onClick={() => addItem(item.id)}
                            className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold"
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                      </div>

                      {/* Item subtotal */}
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-400">
                          {cart[item.id]} × Rp{item.price.toLocaleString()}
                        </p>
                        <p className="text-xs font-bold text-gray-700">
                          = Rp{(cart[item.id] * item.price).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Item note */}
                  <button
                    onClick={() => setOpenItemNote(item.id)}
                    className={`w-full border-t px-3 py-2.5 text-xs flex items-center gap-2 transition-all ${
                      itemNotes[item.id]
                        ? "bg-amber-50 border-amber-100 text-amber-700"
                        : "bg-gray-50 border-gray-100 text-gray-400 hover:bg-amber-50 hover:text-amber-600"
                    }`}
                  >
                    <Edit3 size={12} />
                    <span className="line-clamp-1">
                      {itemNotes[item.id] || "Tambah catatan untuk item ini..."}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── GENERAL NOTE ── */}
        {orderedItems.length > 0 && (
          <div className="px-4 mb-5">
            <button
              onClick={() => setOpenNote(true)}
              className={`w-full rounded-2xl p-4 border-2 transition-all ${
                note
                  ? "bg-amber-50 border-amber-300"
                  : "bg-white border-dashed border-gray-300 hover:border-amber-400 hover:bg-amber-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Edit3 size={16} className="text-white" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm">Catatan Pesanan</p>
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {note || "Tambahkan catatan khusus untuk seluruh pesanan"}
                  </p>
                </div>
                <ChevronLeft className="text-gray-400 rotate-180 flex-shrink-0" size={18} />
              </div>
            </button>
          </div>
        )}

        {/* ── PAYMENT SUMMARY ── */}
        {orderedItems.length > 0 && (
          <div className="px-4 mb-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <div className="w-7 h-7 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <Receipt size={14} className="text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">Rincian Pembayaran</h3>
              </div>

              <div className="px-4 py-3 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal ({totalQty} item)</span>
                  <span className="font-semibold text-gray-900">Rp{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Biaya layanan</span>
                  <span className="font-semibold text-green-600">Gratis</span>
                </div>
                <div className="h-px bg-gray-100 my-1" />
                <div className="flex justify-between items-center bg-amber-50 rounded-xl px-3 py-2.5">
                  <span className="font-bold text-gray-900 text-sm">Total Pembayaran</span>
                  <span className="font-extrabold text-amber-600 text-lg">Rp{subtotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="px-4 pb-3">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-600">Harga sudah termasuk pajak dan biaya layanan</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── EST. TIME ── */}
        {orderedItems.length > 0 && (
          <div className="px-4">
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock size={16} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-orange-800 text-sm">Estimasi Waktu</p>
                <p className="text-xs text-orange-600">10–20 menit setelah pembayaran dikonfirmasi</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      {orderedItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-xl">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Total Pembayaran</p>
                <p className="font-extrabold text-2xl text-gray-900">Rp{subtotal.toLocaleString()}</p>
              </div>
              <button
                onClick={handleProceedPayment}
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-amber-500/30 hover:scale-105 hover:shadow-xl transition-all whitespace-nowrap"
              >
                Lanjut Bayar →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ITEM NOTE MODAL ── */}
      {openItemNote && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end z-50 animate-fadeIn"
          onClick={() => setOpenItemNote(null)}
        >
          <div
            className="bg-white w-full max-w-md mx-auto rounded-t-[2rem] p-6 space-y-4 animate-slideUp shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto" />
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg text-gray-900">
                Catatan: {items.find((i) => i.id === openItemNote)?.name}
              </h2>
              <button
                onClick={() => setOpenItemNote(null)}
                className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center"
              >
                <X size={18} className="text-gray-600" />
              </button>
            </div>
            <textarea
              value={itemNotes[openItemNote] || ""}
              onChange={(e) =>
                setItemNotes((prev) => ({ ...prev, [openItemNote]: e.target.value }))
              }
              placeholder="Contoh: Tidak pakai bawang, pedas sedikit..."
              className="w-full h-28 border-2 border-gray-200 rounded-2xl p-4 outline-none focus:border-amber-500 resize-none text-sm transition-all"
            />
            <button
              onClick={() => setOpenItemNote(null)}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3.5 rounded-2xl font-bold shadow-lg"
            >
              Simpan Catatan
            </button>
          </div>
        </div>
      )}

      {/* ── GENERAL NOTE MODAL ── */}
      {openNote && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end z-50 animate-fadeIn"
          onClick={() => setOpenNote(false)}
        >
          <div
            className="bg-white w-full max-w-md mx-auto rounded-t-[2rem] p-6 space-y-4 animate-slideUp shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto" />
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg text-gray-900">Catatan Pesanan</h2>
              <button
                onClick={() => setOpenNote(false)}
                className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center"
              >
                <X size={18} className="text-gray-600" />
              </button>
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              placeholder="Contoh: Tidak pakai es, gula sedikit, dll..."
              className="w-full h-32 border-2 border-gray-200 rounded-2xl p-4 outline-none focus:border-amber-500 resize-none text-sm transition-all"
            />
            <p className="text-xs text-gray-400 text-right">{note.length}/200 karakter</p>
            <button
              onClick={() => setOpenNote(false)}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3.5 rounded-2xl font-bold shadow-lg"
            >
              Simpan Catatan
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}
