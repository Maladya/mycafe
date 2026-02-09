import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

import kasirImg from "./../assets/kasir.svg";

export default function Pembayaran() {
  const navigate = useNavigate();


  const [method, setMethod] = useState("online");
  const [qris, setQris] = useState(true);
  const [confirmKasir, setConfirmKasir] = useState(false);

  const [form, setForm] = useState({
    nama: "",
    hp: "",
    email: "",
    meja: "1",
  });

  return (
    <div className="w-sm mx-auto min-h-screen bg-white border relative">

      {/* HEADER */}
      <div className="flex items-center gap-3 p-4 border-b">
        <button onClick={() => navigate(-1)}>
          <ChevronLeft />
        </button>
        <h1 className="font-bold text-lg mx-auto">Pembayaran</h1>
      </div>

      {/* CONTENT */}
      <div
        className={`p-4 space-y-5 pb-28 ${
          confirmKasir ? "blur-sm pointer-events-none" : ""
        }`}
      >

        {/* INFO PEMESAN */}
        <div>
          <h2 className="font-semibold mb-3">Informasi Pemesan</h2>

          <div className="space-y-3">
            <input
              placeholder="Nama Lengkap"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"
            />

            <input
              placeholder="Nomor Ponsel"
              value={form.hp}
              onChange={(e) => setForm({ ...form, hp: e.target.value })}
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"
            />

            <input
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"
            />

            <input
              disabled
              value={`Meja ${form.meja}`}
              className="w-full bg-gray-100 border rounded-xl px-4 py-3 text-gray-500"
            />
          </div>
        </div>

        {/* METODE PEMBAYARAN */}
        <div>
          <h2 className="font-semibold mb-3">Metode Pembayaran</h2>

          <div className="flex gap-3">
            <button
              onClick={() => setMethod("online")}
              className={`flex-1 border rounded-xl p-3 font-semibold ${
                method === "online"
                  ? "border-blue-600 bg-blue-50 text-blue-600"
                  : "border-gray-300"
              }`}
            >
              💳 Pembayaran Online
            </button>

            <button
              onClick={() => setMethod("kasir")}
              className={`flex-1 border rounded-xl p-3 font-semibold ${
                method === "kasir"
                  ? "border-blue-600 bg-blue-50 text-blue-600"
                  : "border-gray-300"
              }`}
            >
              🧾 Bayar di Kasir
            </button>
          </div>
        </div>

        {/* QRIS */}
        {method === "online" && (
          <div>
            <h2 className="font-semibold mb-3">Selesaikan Pembayaran</h2>

            <button
              onClick={() => setQris(!qris)}
              className="w-full border rounded-xl p-4 flex justify-between items-center"
            >
              <span>📱 QRIS</span>
              <div
                className={`w-5 h-5 rounded-full border-2 ${
                  qris ? "bg-blue-600 border-blue-600" : "border-gray-400"
                }`}
              />
            </button>
          </div>
        )}

        {/* KASIR INFO */}
        {method === "kasir" && (
          <div className="border rounded-2xl p-6 text-center space-y-4 mt-4">
            <img src={kasirImg} className="mx-auto h-32" />
            <p className="text-gray-600">
              Klik <b>“Bayar”</b> lalu tunjukkan QR ke kasir.
            </p>
          </div>
        )}

        {/* PROMO */}
        <button className="flex justify-between items-center text-blue-600 font-medium">
          ➕ Tambah Promo atau Voucher
          <span>›</span>
        </button>
      </div>

      {/* FOOTER */}
      <div className="fixed bottom-0 w-sm mx-auto bg-white border-t p-4 flex justify-between">

        <div>
          <p className="text-sm text-gray-500">Total Pembayaran</p>
          <p className="font-bold text-lg">Rp11.000</p>
        </div>

        <button
          onClick={() => {
            if (method === "kasir") setConfirmKasir(true);
            else alert("Proses pembayaran online");
          }}
          className="bg-blue-600 text-white px-8 py-2 rounded-xl font-semibold"
        >
          Bayar
        </button>
      </div>

      {/* MODAL KONFIRMASI KASIR */}
      {method === "kasir" && confirmKasir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">

          <div className="bg-white rounded-2xl p-6 w-[85%] max-w-sm text-center space-y-5 shadow-xl">

            <img src={kasirImg} className="mx-auto h-36" />

            <p className="font-medium text-gray-800">
              Proses pembayaran sekarang?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmKasir(false)}
                className="flex-1 border border-blue-600 text-blue-600 rounded-xl py-2 font-semibold"
              >
                Cek Lagi
              </button>

              <button
  onClick={() => navigate("/ringkasanpesanan")}
  className="flex-1 bg-blue-600 text-white rounded-xl py-2 font-semibold"
>
  Bayar Sekarang
</button>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
