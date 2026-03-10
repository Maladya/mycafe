import { useState, useEffect, createContext, useContext } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { QrCode, LogOut, User, Clock, Bell } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://192.168.1.14:3000";

export const KasirContext = createContext(null);
export const useKasir = () => useContext(KasirContext);

/* ────────────────────────────────────────────────────────────────────────────
   KASIR LAYOUT — Layout terpisah untuk terminal kasir
   ──────────────────────────────────────────────────────────────────────────── */
export default function KasirLayout() {
  const navigate = useNavigate();
  const [kasirUser, setKasirUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  // Load kasir user data
  useEffect(() => {
    const token = localStorage.getItem("kasir_token");
    const userStr = localStorage.getItem("kasir_user");
    
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      if (userStr) {
        setKasirUser(JSON.parse(userStr));
      }
    } catch {
      localStorage.removeItem("kasir_token");
      localStorage.removeItem("kasir_user");
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // Fetch pending orders count
  useEffect(() => {
    const fetchPending = async () => {
      try {
        const token = localStorage.getItem("kasir_token");
        const res = await fetch(`${API_URL}/api/orders?status=baru,pending`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const orders = data.data ?? data.orders ?? data ?? [];
        setPendingCount(orders.filter(o => o.payment_method === "kasir").length);
      } catch {
        // Silent fail
      }
    };

    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem("kasir_token");
    localStorage.removeItem("kasir_user");
    navigate("/login", { replace: true });
  };

  const getAuthHeader = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("kasir_token") ?? ""}`,
  });

  return (
    <KasirContext.Provider value={{
      kasirUser,
      showToast,
      getAuthHeader,
      apiUrl: API_URL,
      pendingCount,
    }}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header Kasir */}
        <header className="bg-gradient-to-r from-gray-800 to-gray-900 text-white sticky top-0 z-20 shadow-lg">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <QrCode size={20} className="text-white" />
              </div>
              <div>
                <h1 className="font-black text-lg leading-none">TERMINAL KASIR</h1>
                <p className="text-gray-400 text-[10px]">ASTAKIRA POS</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Pending Badge */}
              {pendingCount > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-500/20 px-3 py-1.5 rounded-lg">
                  <Bell size={14} className="text-amber-400" />
                  <span className="text-amber-400 text-xs font-bold">{pendingCount} tunggu</span>
                </div>
              )}

              {/* User Info */}
              <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1.5">
                <div className="w-7 h-7 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <User size={14} className="text-white" />
                </div>
                <span className="text-sm font-semibold hidden sm:block">
                  {kasirUser?.nama || kasirUser?.username || "Kasir"}
                </span>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-9 h-9 bg-red-500/20 hover:bg-red-500/30 rounded-xl flex items-center justify-center text-red-400 transition-all"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>

        {/* Footer Status Bar */}
        <footer className="bg-gray-800 text-gray-400 px-4 py-2 text-[10px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Terminal Aktif • {new Date().toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" })}</span>
          </div>
          <span>Shift: {new Date().toLocaleDateString("id-ID")}</span>
        </footer>

        {/* Toast */}
        {toast && (
          <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white font-semibold text-sm animate-slideInRight ${
            toast.type === "error" ? "bg-red-500" : 
            toast.type === "success" ? "bg-green-500" : "bg-amber-500"
          }`}>
            {toast.msg}
          </div>
        )}

        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
          .animate-slideInRight { animation: slideInRight 0.3s cubic-bezier(0.16,1,0.3,1); }
        `}</style>
      </div>
    </KasirContext.Provider>
  );
}
