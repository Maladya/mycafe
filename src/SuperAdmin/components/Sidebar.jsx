import { LayoutDashboard, Store, FileText, Users, Settings, LogOut, TrendingUp, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function SuperAdminSidebar({ activePage, setActivePage, onLogout, sidebarOpen, setSidebarOpen }) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "cafes", label: "Kelola Cafe", icon: <Store size={18} /> },
    { id: "admins", label: "Admin Cafe", icon: <Users size={18} /> },
    { id: "reports", label: "Laporan", icon: <FileText size={18} /> },
    { id: "analytics", label: "Analytics", icon: <TrendingUp size={18} /> },
    { id: "settings", label: "Pengaturan", icon: <Settings size={18} /> },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <p className="font-black text-white text-sm leading-none">SUPER ADMIN</p>
            <p className="text-purple-300 text-[10px] mt-0.5">Management Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((nav) => (
          <button
            key={nav.id}
            onClick={() => {
              setActivePage(nav.id);
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group ${
              activePage === nav.id
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                : "text-gray-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className={activePage === nav.id ? "text-white" : "text-gray-400 group-hover:text-purple-400"}>
              {nav.icon}
            </span>
            {nav.label}
            {activePage === nav.id && (
              <span className="ml-auto w-1.5 h-1.5 bg-white/60 rounded-full" />
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-white/10 pt-4">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-all"
        >
          <LogOut size={16} /> Keluar
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 sticky top-0 h-screen self-start">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <motion.aside
            className="lg:hidden fixed top-0 left-0 h-full w-64 z-40"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {sidebarContent}
          </motion.aside>
        </>
      )}
    </>
  );
}
