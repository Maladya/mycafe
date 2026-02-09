import SideBar from "../../Layout/Layouts";
import { useState } from "react";

const payments = [
  {
    id: "bni",
    name: "BNI Virtual Account",
    logo: "https://zonalogo.com/og/logo-bank-bni.png",
  },
  {
    id: "bri",
    name: "BRI Virtual Account",
    logo: "https://zonalogo.com/og/logo-bank-bri.png",
  },
  {
    id: "mandiri",
    name: "Mandiri Virtual Account",
    logo: "https://zonalogo.com/og/logo-bank-mandiri.png",
  },
  {
    id: "permata",
    name: "PermataBank Virtual Account",
    logo: "https://zonalogo.com/og/logo-bank-permata.png",
  },
  {
    id: "qris",
    name: "QRIS",
    logo: "https://cdn.isellercommerce.com/5d09154a498048e8aa9db882f88e4ea0/theme_content/logo-qris.png",
  },
  {
    id: "bca",
    name: "BCA Virtual Account",
    logo: "https://kilasjatim.com/wp-content/uploads/2024/01/BCA.png",
  },
];

export default function Pembayaran() {
  const [method, setMethod] = useState("");

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SideBar />

      <div className="flex-1 flex flex-col">
        {/* ===== HEADER ===== */}
        <div className="h-12 bg-white sticky top-0 z-10 flex items-center justify-center border-b">
          <h1 className="text-lg font-bold text-primary">MyCafe ☕</h1>
        </div>

        {/* ===== CONTENT ===== */}
        <div className="flex-1 p-6 flex flex-col">
          <h3 className="text-3xl font-bold mb-8">Pilih Pembayaran</h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ===== KIRI ===== */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
              <h2 className="font-bold mb-4">Transfer Bank</h2>

              {payments.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setMethod(item.id)}
                  className={`w-full flex items-center gap-4 border rounded-lg p-4 mb-3 text-left transition
                    ${
                      method === item.id
                        ? "border-red-500 bg-red-50"
                        : "hover:border-gray-400"
                    }`}
                >
                  <input
                    type="radio"
                    checked={method === item.id}
                    readOnly
                  />

                  <img
                    src={item.logo}
                    alt={item.name}
                    className="h-8 w-auto object-contain"
                  />

                  <span className="font-medium">{item.name}</span>
                </button>
              ))}
            </div>

            {/* ===== KANAN ===== */}
            <div className="bg-white rounded-lg shadow p-6 h-fit">
              <h2 className="font-bold mb-4">Ringkasan</h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Bundling Hemat Inventori</span>
                  <span>Rp.0</span>
                </div>

                <div className="flex justify-between">
                  <span>Deposit Dibutuhkan</span>
                  <span>Rp.200.000</span>
                </div>
              </div>

              <hr className="my-4" />

              <div className="flex justify-between font-bold text-sm">
                <span>Total Deposit</span>
                <span>Rp.200.000</span>
              </div>

              <hr className="my-4" />

              <div className="flex justify-between text-sm">
                <span>Saldo Anda</span>
                <span>Rp.0</span>
              </div>

              <div className="flex justify-between text-sm font-bold text-red-500">
                <span>Saldo Kurang</span>
                <span>Rp.200.000</span>
              </div>
            </div>
          </div>

          {/* ===== FOOTER (AMAN & RAPI) ===== */}
          <div className="mt-30 border-t bg-white px-6 py-4 flex justify-between items-center">
            <button
              className="px-6 py-2 border border-red-500 text-red-500 rounded"
              onClick={() => (window.location.href = "/admin/billing/billing")}
            >
              Batal
            </button>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs text-gray-500">Total Bayar</p>
                <p className="font-bold text-lg">Rp.200.000</p>
              </div>

              <button
                disabled={!method}
                className={`px-8 py-2 rounded text-white transition
                  ${
                    method
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
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
