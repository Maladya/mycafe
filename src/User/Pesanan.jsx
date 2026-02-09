import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ChevronLeft, X } from "lucide-react";

export default function Pesanan() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [cart, setCart] = useState(state?.cart || {});
  const items = state?.items || [];

  const [openNote, setOpenNote] = useState(false);
  const [note, setNote] = useState("");

  const orderedItems = items.filter(i => cart[i.id]);

  const addItem = id => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeItem = id => {
    setCart(prev => {
      const copy = { ...prev };
      if (copy[id] > 1) copy[id]--;
      else delete copy[id];
      return copy;
    });
  };

  const subtotal = orderedItems.reduce(
    (sum, i) => sum + cart[i.id] * i.price,
    0
  );

  return (
    <div className="w-sm mx-auto min-h-screen bg-white border relative">

      {/* HEADER */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}>
            <ChevronLeft />
          </button>
          <h1 className="font-bold text-lg">Pesanan</h1>
        </div>

        <button
          onClick={() => navigate("/")}
          className="text-blue-600 text-sm font-semibold"
        >
          Ubah
        </button>
      </div>

      <div className="p-4 space-y-4 pb-28">

        {/* ITEM TITLE */}
        <div className="flex justify-between items-center">
          <p className="font-semibold">Item yang dipesan ({orderedItems.length})</p>

          <button
            onClick={() => navigate(-1)}
            className="border px-3 py-1 rounded-lg text-sm text-blue-600"
          >
            + Tambah item
          </button>
        </div>

        {/* ITEM LIST */}
        {orderedItems.map(item => (
          <div key={item.id} className="border rounded-xl p-3 space-y-2">

            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-gray-500">
                  Rp{item.price.toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-3 border rounded-lg px-3 py-1">
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-lg font-bold"
                >
                  −
                </button>
                <span>{cart[item.id]}</span>
                <button
                  onClick={() => addItem(item.id)}
                  className="text-lg font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-400">
              Belum menambahkan catatan
            </p>
          </div>
        ))}

        {/* ADD NOTE */}
        <button
          onClick={() => setOpenNote(true)}
          className="flex items-center gap-2 text-blue-600 font-medium"
        >
          📝 Tambah catatan lainnya
        </button>

        {/* PAYMENT */}
        <div className="border rounded-2xl p-4 space-y-2">
          <h3 className="font-semibold">Rincian Pembayaran</h3>

          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>Rp{subtotal.toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Pembulatan</span>
            <span>Rp0</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Biaya lainnya</span>
            <span>Rp0</span>
          </div>

          <hr />

          <div className="flex justify-between font-bold text-blue-600">
            <span>Total</span>
            <span>Rp{subtotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="fixed bottom-0 w-sm mx-auto bg-white border-t p-4 flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">Total Pembayaran</p>
          <p className="font-bold">
            Rp{subtotal.toLocaleString()}
          </p>
        </div>

        <button className="bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold" onClick={window.location.href= "/pembayaran"}>
          Lanjut Pembayaran
        </button>
      </div>

      {/* NOTE MODAL */}
      {openNote && (
        <div className="fixed inset-0 bg-black/40 flex items-end z-50">
          <div className="bg-white w-full rounded-t-3xl p-6 space-y-4">

            <div className="flex justify-between items-center">
              <h2 className="font-bold">Catatan Lainnya</h2>
              <button onClick={() => setOpenNote(false)}>
                <X />
              </button>
            </div>

            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Tambahkan catatan lain di sini"
              className="w-full h-32 border rounded-xl p-3 outline-none"
            />

            <button
              onClick={() => setOpenNote(false)}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold"
            >
              Tambah
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
