import SideBar from "../../Layout/Layouts";
import { useState } from "react";

export default function Billing() {
  const [active, setActive] = useState("gratis");

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* ===== SIDEBAR ===== */}
      <SideBar />

      <div className="flex-1 flex flex-col">
        {/* ===== HEADER ===== */}
        <div className="h-12 bg-white sticky top-0 z-10 flex items-center justify-center border-b">
          <h1 className="text-lg font-bold text-primary">MyCafe ☕</h1>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <h3 className="text-3xl font-bold mb-6">Pilih Periode Langganan</h3>

          {/* ===== TAB ===== */}
          <div className="inline-flex bg-white shadow rounded-lg p-2 gap-2 mb-10">
            <button
              onClick={() => setActive("gratis")}
              className={`px-8 py-2 rounded ${
                active === "gratis"
                  ? "bg-gradient-to-r from-blue-500 to-blue-900 text-white"
                  : "bg-white"
              }`}
            >
              Gratis
            </button>
            <button
              onClick={() => setActive("reguler")}
              className={`px-8 py-2 rounded ${
                active === "reguler"
                  ? "bg-gradient-to-r from-blue-500 to-blue-900 text-white"
                  : "bg-white"
              }`}
            >
              Reguler
            </button>
          </div>

          {/* ================= GRATIS ================= */}
          {active === "gratis" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ===== KIRI ===== */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                {/* CARD BIAYA */}
                <div className="rounded-lg shadow bg-gradient-to-b from-blue-500 to-blue-900 text-white p-8">
                  <h1 className="text-xl font-bold mb-2">
                    Tanpa Biaya Bulanan!
                  </h1>
                  <p className="text-sm mb-6">
                    Transaksi tanpa ribet dengan ragam metode pembayaran
                  </p>

                  <button className="bg-white text-black px-6 py-3 rounded w-full max-w-md">
                    Segera aktifkan dengan deposit Rp200.000
                  </button>

                  <p className="text-xs mt-4 opacity-80">
                    *Rp.500 / transaksi dari pelanggan{" "}
                    <span className="underline cursor-pointer">
                      Pelajari selengkapnya
                    </span>
                  </p>

                  <div className="mt-6 w-full p-4 bg-black rounded-lg">
                    <p className="text-xs">
                      Gratis Standee dan isi ulang kertas tanpa printer
                    </p>
                  </div>
                </div>

                {/* CARD FITUR */}
                <div className="rounded-lg shadow bg-white p-8">
                  <h2 className="text-lg font-bold mb-4">Fitur untuk Anda</h2>

                  <ul className="space-y-3 text-sm">
                    <li className="flex gap-2 items-center">
                      <input type="checkbox" checked readOnly />
                      Inventori
                    </li>
                    <li className="flex gap-2 items-center">
                      <input type="checkbox" checked readOnly />
                      Newsletter untuk ide bisnis Anda
                    </li>
                    <li className="flex gap-2 items-center">
                      <input type="checkbox" checked readOnly />
                      Metode Pembayaran Online (OVO, Dana, QRIS, Gopay)
                    </li>
                    <li className="flex gap-2 items-center">
                      <input type="checkbox" checked readOnly />
                      Metode pembayaran tunai & nontunai
                    </li>
                  </ul>

                  <p className="text-primary text-sm mt-4 cursor-pointer">
                    Selengkapnya
                  </p>
                </div>
              </div>

              {/* ===== KANAN ===== */}
              <div className="rounded-lg shadow bg-white p-8">
                <h2 className="text-lg font-bold mb-4">Informasi Langganan</h2>

                <div className="text-sm mb-4">
                  <p>Paket Langganan</p>
                  <p className="font-semibold">Gratis</p>
                  <p className="text-gray-500 text-xs">Selamanya</p>
                </div>

                <hr className="my-4" />

                <h3 className="font-bold text-sm mb-2">Ringkasan</h3>

                <div className="flex justify-between text-sm">
                  <span>Deposit Dibutuhkan</span>
                  <span>Rp200.000</span>
                </div>

                <div className="flex justify-between text-sm mt-2">
                  <span>Saldo Anda</span>
                  <span>Rp0</span>
                </div>

                <div className="flex justify-between text-sm font-bold mt-2">
                  <span>Saldo kurang</span>
                  <span>Rp200.000</span>
                </div>

                <hr className="my-4" />

                <div className="flex gap-2 text-sm">
                  <input type="checkbox" />
                  <span>
                    Saya telah menyetujui{" "}
                    <span className="text-primary underline cursor-pointer">
                      Syarat & Ketentuan
                    </span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ================= REGULER ================= */}
          {active === "reguler" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ===== KIRI ===== */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                {/* PILIH PAKET */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg shadow bg-gradient-to-b from-blue-500 to-blue-900 text-white p-6">
                    <p className="text-sm opacity-80">1 Tahun</p>
                    <h1 className="text-xl font-bold">Rp.99.000</h1>
                    <p className="text-xs opacity-80">Per Bulan</p>
                  </div>

                  <div className="rounded-lg shadow bg-white p-6 border">
                    <p className="text-sm text-blue-600">1 Bulan</p>
                    <h1 className="text-xl font-bold text-blue-600">
                      Rp.99.000.000
                    </h1>
                  </div>
                </div>

                {/* PAKET BISNIS */}
                <div className="rounded-lg shadow bg-gradient-to-b from-blue-600 to-blue-900 text-white p-8 text-center">
                  <p className="text-sm opacity-80">Bisnis</p>
                  <h1 className="text-2xl font-bold">Rp.99.000.000.000.000</h1>
                  <p className="text-xs opacity-80">Per Bulan</p>
                </div>

                {/* FITUR */}
                <div className="rounded-lg shadow bg-white p-8">
                  <h2 className="text-lg font-bold mb-4">Fitur untuk Anda</h2>

                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2">
                      <input type="checkbox" checked readOnly />
                      Inventori
                    </li>
                    <li className="flex items-center gap-2">
                      <input type="checkbox" checked readOnly />
                      Newsletter untuk ide bisnis Anda
                    </li>
                    <li className="flex items-center gap-2">
                      <input type="checkbox" checked readOnly />
                      Metode Pembayaran Online (OVO, Dana, QRIS, Gopay)
                    </li>
                  </ul>

                  <p className="text-primary text-sm mt-4 cursor-pointer">
                    Selengkapnya
                  </p>
                </div>
              </div>

              {/* ===== KANAN ===== */}
              <div className="rounded-lg shadow bg-white p-8">
                <h2 className="text-lg font-bold mb-4">Informasi Langganan</h2>

                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Paket Langganan</span>
                    <span className="font-semibold">1 Tahun</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bonus Periode</span>
                    <span className="text-green-600 font-semibold">
                      1 Bulan
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Berlaku Hingga</span>
                    <span>21 Maret 2027</span>
                  </div>
                </div>

                <div className="bg-green-100 text-green-700 text-sm p-2 rounded mt-4">
                  Anda hemat Rp.610.000
                </div>

                <hr className="my-4" />

                <h3 className="font-bold text-sm mb-2">Ringkasan</h3>

                <div className="flex justify-between text-sm">
                  <span>Harga Langganan</span>
                  <span className="text-green-600">Rp.1.190.000</span>
                </div>

                <div className="flex justify-between text-sm mt-2">
                  <span>Bundling Hemat Inventori</span>
                  <span className="text-green-600">Rp.600.000</span>
                </div>

                <div className="flex justify-between text-sm font-bold mt-3">
                  <span>Total Harga</span>
                  <span>Rp.1.790.000</span>
                </div>

                <hr className="my-4" />

                <div className="flex justify-between text-sm">
                  <span>Saldo Anda</span>
                  <span>Rp.0</span>
                </div>

                <div className="flex justify-between text-sm font-bold mt-2">
                  <span>Saldo Kurang</span>
                  <span>Rp.1.790.000</span>
                </div>

                <p className="text-xs text-gray-500 mt-4">
                  Saldo Anda akan tertahan sementara waktu selama proses
                  verifikasi pembayaran.
                </p>
              </div>
            </div>
          )}
          <div className="bottom-0 left-0 w-full bg-white border-t px-6 mt-10 py-4 flex justify-between items-center z-20">
            <button className="px-6 py-2 border border-red-500 text-red-500 rounded">
              Batal
            </button>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs text-gray-500">Total Deposit</p>
                <p className="font-bold text-lg">
                  {active === "gratis" ? "Rp200.000" : "Rp1.790.000"}
                </p>
              </div>

              <button
                className="px-8 py-2 bg-red-500 text-white rounded"
                onClick={() =>
                  (window.location.href = "/admin/billing/pembayaran")
                }
              >
                Proses
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
