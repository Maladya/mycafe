import {
  LayoutDashboard, UtensilsCrossed, ClipboardList, Table2,
  Settings, LogOut, Tag, Coffee, X, Menu, Bell,
  CreditCard, Wallet, Users
} from "lucide-react";
import { useState, useEffect } from "react";
import { isPromoActive } from "../data/constants";

export function Sidebar({ activePage, setActivePage, sidebarOpen, setSidebarOpen, menuItems, orders, promoCodes, onLogout, cafeRaw }) {
  const navItems = [
    { id:"dashboard",  label:"Dashboard",   icon:<LayoutDashboard size={18}/> },
    { id:"menu",       label:"Kelola Menu", icon:<UtensilsCrossed size={18}/> },
    { id:"orders",     label:"Pesanan",     icon:<ClipboardList size={18}/>,   badge:(orders ?? []).filter(o=>o.status==="baru").length||null },
    { id:"kasir-users", label:"Kelola Kasir", icon:<Users size={18}/> },
    { id:"tables",     label:"Meja",        icon:<Table2 size={18}/> },
    { id:"promo",      label:"Promo",       icon:<Tag size={18}/>,             badge:(promoCodes ?? []).filter(p=>isPromoActive(p)).length||null },
    { id:"payment",    label:"Pembayaran",  icon:<Wallet size={18}/> },
    { id:"billing",    label:"Langganan",   icon:<CreditCard size={18}/> },
    { id:"pengaturan", label:"Pengaturan",  icon:<Settings size={18}/> },
  ];

  // Dynamic cafe info
  const cafeName = cafeRaw?.cafeNama || cafeRaw?.nama_cafe || "ASTAKIRA";
  const cafeLogo = cafeRaw?.logo_cafe || null;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3 border-b border-gray-800 flex-shrink-0">
        <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden">
          {cafeLogo ? (
            <img src={cafeLogo} alt={cafeName} className="w-full h-full object-cover" />
          ) : (
            <Coffee size={18} className="text-white"/>
          )}
        </div>
        <div>
          <p className="font-black text-white text-sm leading-none">{cafeName}</p>
          <p className="text-gray-500 text-[10px] mt-0.5">Admin Panel</p>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-gray-500 hover:text-white">
          <X size={18}/>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(nav => (
          <button
            key={nav.id}
            onClick={() => { setActivePage(nav.id); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group relative ${
              activePage === nav.id
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
          >
            <span className={activePage === nav.id ? "text-white" : "text-gray-500 group-hover:text-white"}>
              {nav.icon}
            </span>
            {nav.label}
            {nav.badge
              ? <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{nav.badge}</span>
              : activePage === nav.id
                ? <span className="ml-auto w-1.5 h-1.5 bg-white/60 rounded-full"/>
                : null
            }
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-gray-800 pt-4 space-y-1 flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5">
          
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:bg-red-900/50 hover:text-red-400 transition-all"
        >
          <LogOut size={16}/> Keluar
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: sticky full height */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 bg-gray-900 sticky top-0 h-screen self-start">
        {sidebarContent}
      </aside>

      {/* Mobile: overlay drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`lg:hidden fixed top-0 left-0 h-full w-64 z-40 bg-gray-900 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {sidebarContent}
      </aside>
    </>
  );
}

export function Header({ activePage, setSidebarOpen, orders, setActivePage, cafeRaw }) {
  const navLabels = {
    dashboard:  "Dashboard",
    menu:       "Kelola Menu",
    orders:     "Pesanan",
    "kasir-users": "Kelola Kasir",
    tables:     "Meja",
    promo:      "Promo",
    payment:    "Pembayaran",
    pengaturan: "Pengaturan",
    billing:    "Langganan",
  };

  const newOrders = (orders ?? []).filter(o => o.status === "baru").length;
  
  // Dynamic cafe info from database
  const cafeName = cafeRaw?.cafeNama || cafeRaw?.nama_cafe || "ASTAKIRA";
  const cafeAddress = cafeRaw?.cafeAlamat || cafeRaw?.alamat || "";
  const displaySubtitle = cafeAddress ? `${cafeName} · ${cafeAddress}` : cafeName;
  
  // Get actual user data from localStorage
  const [userData, setUserData] = useState({ username: "Admin", nama: "" });
  
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUserData({
          username: parsed.username || parsed.email || "Admin",
          nama: parsed.nama || parsed.nama_cafe || "",
        });
      }
    } catch {}
  }, []);
  
  const displayName = userData.nama || userData.username || "Admin";
  const avatarLetter = (displayName.charAt(0) || "A").toUpperCase();

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm flex-shrink-0">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-9 h-9 flex items-center justify-center bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
          >
            <Menu size={18} className="text-gray-700"/>
          </button>
          <div>
            <h2 className="font-bold text-gray-900 text-sm capitalize leading-none">
              {navLabels[activePage] || activePage}
            </h2>
            <p className="text-gray-400 text-[11px] mt-0.5 hidden sm:block">{displaySubtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {newOrders > 0 && (
            <button
              onClick={() => setActivePage("orders")}
              className="relative w-9 h-9 flex items-center justify-center bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-all"
            >
              <Bell size={16} className="text-amber-600"/>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {newOrders}
              </span>
            </button>
          )}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-[10px] font-black">{avatarLetter}</span>
            </div>
            <span className="text-xs font-semibold text-gray-700 hidden sm:block">{displayName}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
