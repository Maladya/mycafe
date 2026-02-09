import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function RingkasanPesananUSer() {
  const navigate = useNavigate();
  const [confirmNew, setConfirmNew] = useState(false);

  return (
    <div className="w-sm mx-auto min-h-screen bg-white border relative">

      {/* ===== HEADER (TIDAK BLUR) ===== */}
      <div className="flex items-center gap-3 p-4 border-b">
        <button onClick={() => navigate(-1)}>
          <ChevronLeft />
        </button>
        <h1 className="font-bold text-lg mx-auto">Ringkasan Pesanan</h1>
      </div>

      {/* ===== KONTEN (BISA BLUR) ===== */}
      <div className={`p-4 space-y-5 pb-6 transition ${confirmNew ? "blur-sm pointer-events-none" : ""}`}>

        {/* TIPE PEMESANAN */}
        <div className="bg-blue-50 border border-blue-300 rounded-xl px-4 py-3 flex justify-between items-center">
          <span className="text-sm text-gray-700">Tipe Pemesanan</span>
          <div className="flex items-center gap-2 font-semibold">
            Makan Ditempat
            <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              ✓
            </span>
          </div>
        </div>

        {/* NOMOR PESANAN */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-500">Nomor Pesanan</p>

          <div className="flex gap-2 justify-center">
            <span className="bg-gray-200 text-gray-400 px-4 py-2 rounded-lg font-semibold">
              APP1158
            </span>
            <span className="border px-4 py-2 rounded-lg font-bold tracking-wider">
              C7C0TP7N
            </span>
          </div>
        </div>

        {/* QR */}
        <div className="flex justify-center">
          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=C7C0TP7N"
            className="border p-2 rounded-xl"
            alt="QR"
          />
        </div>

        {/* ALERT */}
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-3 text-sm flex gap-2 items-start">
          ⚠️
          <p>
            Silahkan tunjukkan QR atau <b>8 digit nomor pesanan</b> ke staff kasir kami.
          </p>
        </div>

        {/* ITEM */}
        <div className="border rounded-2xl p-4 space-y-3">

          <div className="flex justify-between text-sm font-medium">
            <span>1x UDANG KEJU</span>
            <span>Rp11.000</span>
          </div>

          <hr />

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Subtotal (1 item)</span>
              <span>Rp11.000</span>
            </div>

            <div className="flex justify-between">
              <span>Pembulatan</span>
              <span>- Rp0,1</span>
            </div>

            <div className="flex justify-between">
              <span>Biaya lainnya</span>
              <span>Rp909,1</span>
            </div>
          </div>

          <hr />

          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span className="text-blue-600">Rp11.000</span>
          </div>
        </div>

        <button
          onClick={() => setConfirmNew(true)}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold"
        >
          Pesan Baru
        </button>
      </div>

      {/* ===== MODAL VALIDASI ===== */}
      {confirmNew && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 backdrop-blur-sm">

          <div className="bg-white rounded-t-3xl p-6 w-full max-w-sm text-center space-y-4 shadow-xl">

            <img
              src="https://illustrations.popsy.co/gray/question.svg"
              className="mx-auto h-40"
              alt="Konfirmasi"
            />

            <p className="font-medium text-gray-700">
              kamu yakin ingin memulai pesanan baru
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmNew(false)}
                className="flex-1 border border-blue-600 text-blue-600 rounded-xl py-2 font-semibold"
              >
                Batal
              </button>

              <button
                onClick={() => navigate("/")}
                className="flex-1 bg-blue-600 text-white rounded-xl py-2 font-semibold"
              >
                Pesanan Baru
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
