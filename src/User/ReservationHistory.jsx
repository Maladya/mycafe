import { ArrowLeft } from "lucide-react";

export default function ReservationHistory() {
  return (
    <div className="max-w-sm mx-auto min-h-screen bg-white border">

      <div className="flex items-center gap-3 px-4 py-3 border-b shadow-sm">
        <ArrowLeft size={22} className="cursor-pointer" onClick={() => window.location = "/"}/>
        <h1 className="flex-1 text-center font-semibold -ml-6">Riwayat</h1>
      </div>

      <div className="flex justify-around py-3 text-sm">
        <span className="text-gray-400 cursor-pointer"onClick={() => window.location = "/orderhistory"}>Pesan</span>
        <span className="text-blue-500 font-semibold border-b-2 border-blue-500 pb-1 cursor-pointer"onClick={() => window.location = "/reservationhistory"}>
          Reservasi
        </span>
      </div>

      <div className="flex justify-center items-center h-[70vh]">
        <img
          src="https://cdn-icons-png.flaticon.com/512/2921/2921222.png"
          className="w-36 opacity-80"
        />
      </div>

    </div>
  );
}
