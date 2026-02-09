import { useState } from "react";
import { 
  ArrowLeft, 
  User, 
  Receipt, 
  Globe, 
  Shield, 
  ChevronRight, 
  X 
} from "lucide-react";

export default function ProfilePage() {
  const [showLang, setShowLang] = useState(false);

  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen border relative">

      {/* HEADER */}
      <div className="flex items-center gap-3 px-4 py-3 border-b shadow-sm">
        <ArrowLeft 
          size={22} 
          onClick={() => window.location = "/"} 
          className="cursor-pointer"
        />
        <h1 className="font-semibold flex-1 text-center -ml-6">
          Profil
        </h1>
      </div>

      {/* LOGIN CARD */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center">
          <User className="text-gray-400" />
        </div>

        <div className="flex-1">
          <p className="font-semibold text-sm">Masuk sebagai tamu</p>
          <button className="bg-orange-500 text-white rounded-full px-4 py-1 text-xs mt-1 hover:bg-orange-600 transition">
            Masuk
          </button>
        </div>
      </div>

      {/* MENU LIST */}
      <div className="px-4 space-y-3">

        <div 
          className="flex items-center gap-3 p-3 rounded-xl shadow-sm border cursor-pointer hover:shadow-md transition"
          onClick={() => window.location = "/orderhistory"}
        >
          <Receipt size={18} />
          <p className="flex-1 text-sm font-medium">Riwayat Pesanan</p>
        </div>

        <div 
          onClick={() => setShowLang(true)}
          className="flex items-center gap-3 p-3 rounded-xl shadow-sm border cursor-pointer hover:shadow-md transition"
        >
          <Globe size={18} />
          <p className="flex-1 text-sm font-medium">Bahasa</p>
          <ChevronRight size={16} className="text-gray-400" />
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl shadow-sm border cursor-pointer hover:shadow-md transition">
          <Shield size={18} />
          <p className="flex-1 text-sm font-medium">Kebijakan Privasi</p>
        </div>

      </div>

      {/* MODAL BAHASA */}
      {showLang && (
        <div className="fixed inset-0 bg-black/30 flex items-end z-50 mx-auto max-w-sm">

          <div className="bg-white w-full rounded-t-2xl p-4 animate-slideUp">

            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-lg">Bahasa</h3>
              <X 
                size={20} 
                className="cursor-pointer"
                onClick={() => setShowLang(false)} 
              />
            </div>

            <div className="space-y-2">

              <div className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                🇮🇩 <span>Indonesia</span>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                🇬🇧 <span>English</span>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
