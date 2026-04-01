import { Menu, Bell, User } from "lucide-react";
import { useState, useEffect } from "react";

export default function SuperAdminHeader({ activePage, setSidebarOpen }) {
  const [superAdminUser, setSuperAdminUser] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("superadmin_user");
      if (stored) {
        setSuperAdminUser(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const pageLabels = {
    dashboard: "Dashboard",
    cafes: "Kelola Cafe",
    admins: "Admin Cafe",
    subscriptions: "Langganan",
    "subscription-transactions": "Transaksi Langganan",
    reports: "Laporan",
    analytics: "Analytics",
    settings: "Pengaturan",
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-9 h-9 flex items-center justify-center bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
          >
            <Menu size={18} className="text-gray-600" />
          </button>
          <div>
            <h2 className="font-bold text-gray-900 text-lg">{pageLabels[activePage] || "Dashboard"}</h2>
            <p className="text-xs text-gray-400">Super Admin Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative w-9 h-9 flex items-center justify-center bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">
            <Bell size={18} className="text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <div className="flex items-center gap-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl px-3 py-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <User size={14} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-gray-900 leading-none">
                {superAdminUser?.name || superAdminUser?.email || "Super Admin"}
              </p>
              <p className="text-[10px] text-purple-600">Administrator</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
