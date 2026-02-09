import { ArrowLeft, MapPin, Phone, Navigation } from "lucide-react";

export default function InfoOutlet() {
  const days = [
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
    "Minggu",
  ];

  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen border">

      {/* HEADER */}
      <div className="flex items-center gap-3 px-4 py-3 border-b shadow-sm">
        <ArrowLeft size={22} onClick={() => window.location = "/"} className="cursor-pointer"/>
        <h1 className="font-semibold flex-1 text-center -ml-6">
          Info Outlet
        </h1>
      </div>

      {/* OUTLET INFO */}
      <div className="p-4 space-y-3">

        <h2 className="font-bold text-sm">
          Kopi Kenangan Tasikmalaya - JB Lanud
        </h2>

        <div className="flex gap-2 text-xs text-gray-500">
          <MapPin size={14} />
          <p>
            Jl. Yudanegara No.25, Yudanegara, Kec. Cihideung, 
            Kot. Tasikmalaya, Jawa Barat 46124, Indonesia
          </p>
        </div>

        <div className="flex gap-2">

          <button className="flex-1 flex items-center justify-center gap-1 border rounded-lg py-2 text-sm">
            <Phone size={14} /> Hubungi Outlet
          </button>

          <button className="flex-1 flex items-center justify-center gap-1 border rounded-lg py-2 text-sm">
            <Navigation size={14} /> Kunjungi Outlet
          </button>

        </div>
      </div>

      {/* JAM OPERASIONAL */}
      <div className="px-4 pt-2">

        <h3 className="font-semibold text-sm mb-2">
          Jam Operasional
        </h3>

        <div className="space-y-2 text-sm">
          {days.map(day => (
            <div
              key={day}
              className="flex justify-between items-center border-b py-2 text-gray-500"
            >
              <span className="uppercase text-xs tracking-wide">
                {day}
              </span>
              <span className="text-xs">Buka 24 jam</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
