import SideBar from "../../Layout/Layouts";
import { useState } from "react";

const daysOfWeek = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];

const themeColors = [
  { id: "red", name: "Merah", color: "#ef4444" },
  { id: "blue", name: "Biru", color: "#3b82f6" },
  { id: "green", name: "Hijau", color: "#10b981" },
  { id: "purple", name: "Ungu", color: "#8b5cf6" },
  { id: "orange", name: "Oranye", color: "#f97316" },
];

export default function Setting() {
  const [cafeName, setCafeName] = useState("MyCafe");
  const [address, setAddress] = useState("Jl. Kopi No. 123, Jakarta");
  const [selectedTheme, setSelectedTheme] = useState("red");
  const [logo, setLogo] = useState(null);
  const [activePackage, setActivePackage] = useState("premium");
  const [operatingHours, setOperatingHours] = useState({
    Senin: { open: "08:00", close: "22:00", isOpen: true },
    Selasa: { open: "08:00", close: "22:00", isOpen: true },
    Rabu: { open: "08:00", close: "22:00", isOpen: true },
    Kamis: { open: "08:00", close: "22:00", isOpen: true },
    Jumat: { open: "08:00", close: "23:00", isOpen: true },
    Sabtu: { open: "08:00", close: "23:00", isOpen: true },
    Minggu: { open: "10:00", close: "22:00", isOpen: true },
  });

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogo(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOperatingHourChange = (day, field, value) => {
    setOperatingHours({
      ...operatingHours,
      [day]: {
        ...operatingHours[day],
        [field]: value,
      },
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* ===== SIDEBAR ===== */}
      <SideBar />
      <div className="flex-1 bg-gray-100 flex flex-col">
        <div className="h-12 bg-white sticky top-0 z-10 flex items-center justify-center border-b border-gray-200">
          <h1 className="text-lg font-bold text-primary">MyCafe ☕</h1>
        </div>
        <div className="flex-1 overflow-auto p-6">
          {/* ===== HEADER ===== */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold">Pengaturan</h2>
            <p className="text-gray-600">
              Kelola informasi dan preferensi kafe Anda
            </p>
          </div>

          {/* ===== TABS/SECTIONS ===== */}
          <div className="space-y-6">
            {/* ===== INFO KAFE ===== */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold mb-4">Informasi Kafe</h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Logo */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Logo Kafe
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed">
                      {logo ? (
                        <img
                          src={logo}
                          alt="Logo"
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs text-center">
                          Logo
                        </span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="file-input file-input-bordered file-input-sm"
                    />
                  </div>
                </div>

                {/* Nama Kafe */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nama Kafe
                  </label>
                  <input
                    type="text"
                    value={cafeName}
                    onChange={(e) => setCafeName(e.target.value)}
                    className="input input-bordered w-full"
                    placeholder="Masukkan nama kafe"
                  />
                </div>

                {/* Alamat */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Alamat
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="textarea textarea-bordered w-full"
                    placeholder="Masukkan alamat kafe"
                    rows="3"
                  ></textarea>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button className="btn btn-primary">Simpan</button>
                <button className="btn btn-ghost">Batal</button>
              </div>
            </div>

            {/* ===== JAM OPERASIONAL ===== */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold mb-4">Jam Operasional</h3>

              <div className="space-y-3">
                {daysOfWeek.map((day) => (
                  <div
                    key={day}
                    className="flex items-center gap-4 pb-3 border-b last:border-b-0"
                  >
                    <div className="w-20">
                      <p className="font-medium">{day}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        defaultChecked={operatingHours[day]?.isOpen}
                        onChange={(e) =>
                          handleOperatingHourChange(
                            day,
                            "isOpen",
                            e.target.checked,
                          )
                        }
                        className="checkbox"
                      />
                      <span className="text-sm">Buka</span>
                    </div>

                    {operatingHours[day]?.isOpen && (
                      <>
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={operatingHours[day]?.open}
                            onChange={(e) =>
                              handleOperatingHourChange(
                                day,
                                "open",
                                e.target.value,
                              )
                            }
                            className="input input-bordered input-sm w-24"
                          />
                          <span>–</span>
                          <input
                            type="time"
                            value={operatingHours[day]?.close}
                            onChange={(e) =>
                              handleOperatingHourChange(
                                day,
                                "close",
                                e.target.value,
                              )
                            }
                            className="input input-bordered input-sm w-24"
                          />
                        </div>
                      </>
                    )}

                    {!operatingHours[day]?.isOpen && (
                      <span className="text-sm text-gray-500">Libur</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <button className="btn btn-primary">Simpan</button>
                <button className="btn btn-ghost">Batal</button>
              </div>
            </div>

            {/* ===== TEMA WARNA ===== */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold mb-4">Tema Warna</h3>

              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {themeColors.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`p-4 rounded-lg border-2 transition ${
                      selectedTheme === theme.id
                        ? "border-gray-800 ring-2 ring-offset-2"
                        : "border-gray-200"
                    }`}
                  >
                    <div
                      className="w-full h-12 rounded-md mb-2"
                      style={{ backgroundColor: theme.color }}
                    ></div>
                    <p className="font-medium text-sm">{theme.name}</p>
                  </button>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <button className="btn btn-primary">Terapkan</button>
                <button className="btn btn-ghost">Batal</button>
              </div>
            </div>

            {/* ===== PAKET AKTIF ===== */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold mb-4">Paket Aktif</h3>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Basic */}
                <div
                  className={`border rounded-lg p-4 transition ${
                    activePackage === "basic"
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200"
                  }`}
                >
                  <h4 className="font-bold mb-2">Basic</h4>
                  <p className="text-sm text-gray-600 mb-3">Rp. 0 / bulan</p>
                  <ul className="text-sm space-y-1 mb-4">
                    <li>✓ Kelola Menu</li>
                    <li>✓ Kelola Meja</li>
                    <li>✗ Kelola Promo</li>
                    <li>✗ Laporan Penjualan</li>
                  </ul>
                  <button
                    onClick={() => setActivePackage("basic")}
                    className={`w-full py-2 rounded text-sm font-medium transition ${
                      activePackage === "basic"
                        ? "bg-red-500 text-white"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }`}
                  >
                    {activePackage === "basic" ? "Paket Aktif" : "Pilih"}
                  </button>
                </div>

                {/* Premium */}
                <div
                  className={`border rounded-lg p-4 transition ring-2 ring-red-500 ${
                    activePackage === "premium"
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold">Premium</h4>
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                      Direkomendasikan
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Rp. 199.000 / bulan
                  </p>
                  <ul className="text-sm space-y-1 mb-4">
                    <li>✓ Kelola Menu</li>
                    <li>✓ Kelola Meja</li>
                    <li>✓ Kelola Promo</li>
                    <li>✗ Laporan Penjualan</li>
                  </ul>
                  <button
                    onClick={() => setActivePackage("premium")}
                    className={`w-full py-2 rounded text-sm font-medium transition ${
                      activePackage === "premium"
                        ? "bg-red-500 text-white"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }`}
                  >
                    {activePackage === "premium" ? "Paket Aktif" : "Upgrade"}
                  </button>
                </div>

                {/* Enterprise */}
                <div
                  className={`border rounded-lg p-4 transition ${
                    activePackage === "enterprise"
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200"
                  }`}
                >
                  <h4 className="font-bold mb-2">Enterprise</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Rp. 499.000 / bulan
                  </p>
                  <ul className="text-sm space-y-1 mb-4">
                    <li>✓ Kelola Menu</li>
                    <li>✓ Kelola Meja</li>
                    <li>✓ Kelola Promo</li>
                    <li>✓ Laporan Penjualan</li>
                  </ul>
                  <button
                    onClick={() => setActivePackage("enterprise")}
                    className={`w-full py-2 rounded text-sm font-medium transition ${
                      activePackage === "enterprise"
                        ? "bg-red-500 text-white"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }`}
                  >
                    {activePackage === "enterprise" ? "Paket Aktif" : "Upgrade"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
