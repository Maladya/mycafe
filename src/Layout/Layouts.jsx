import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Table2,
  Ticket,
  CreditCard,
  Receipt,
  Settings,
  LogOut,
  Coffee,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/admin/dashboard",       icon: LayoutDashboard },
  { label: "Menu",      path: "/admin/menu/menu",        icon: UtensilsCrossed },
  { label: "Table",     path: "/admin/table/table",      icon: Table2 },
  { label: "Promo",     path: "/admin/promo/promo",      icon: Ticket },
  { label: "Payment",   path: "/admin/payment/payment",  icon: CreditCard },
  { label: "Billing",   path: "/admin/billing/billing",  icon: Receipt },
  { label: "Setting",   path: "/admin/setting/setting",  icon: Settings },
];

export default function SideBar() {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/";
  };

  return (
    <aside
      className="w-64 min-h-screen flex flex-col shrink-0"
      style={{
        background: "linear-gradient(160deg, #1d4ed8 0%, #1e40af 60%, #1e3a8a 100%)",
        borderRight: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      {/* Brand */}
      <div
        className="px-6 py-6 flex items-center gap-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.15)" }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
          style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}
        >
          <Coffee className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white font-black text-base tracking-tight leading-none">MyCafe</p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>Admin Panel</p>
        </div>
      </div>

      {/* Profile - Now Clickable */}
      <button
        onClick={() => navigate("/admin/setting/setting")}
        className="px-4 py-4 mx-3 mt-4 rounded-2xl transition-all hover:scale-[1.02] cursor-pointer group"
        style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.18)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.12)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
        }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              className="w-10 h-10 rounded-xl object-cover transition-transform group-hover:scale-105"
              style={{ border: "2px solid rgba(255,255,255,0.35)" }}
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDMgKRG2DbqpXvwrc1CHCqHWoG2P1IoUysPA&s"
              alt="Admin"
            />
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
              style={{ background: "#4ade80", borderColor: "#1d4ed8" }}
            />
          </div>
          <div className="min-w-0 text-left">
            <p className="text-white text-sm font-semibold truncate leading-tight group-hover:text-blue-100 transition-colors">Admin</p>
            <p className="text-xs truncate mt-0.5 group-hover:text-blue-200 transition-colors" style={{ color: "rgba(255,255,255,0.55)" }}>mahesa@gmail.com</p>
          </div>
          <Settings className="w-4 h-4 ml-auto text-white opacity-0 group-hover:opacity-70 transition-opacity" />
        </div>
      </button>

      {/* Nav Label */}
      <p
        className="px-6 mt-6 mb-2 text-xs font-bold uppercase tracking-widest"
        style={{ color: "rgba(255,255,255,0.35)" }}
      >
        Navigasi
      </p>

      {/* Nav Items */}
      <nav className="flex-1 px-3 flex flex-col gap-0.5">
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive ? "text-white" : "text-blue-100 hover:text-white"
              }`
            }
            style={({ isActive }) =>
              isActive
                ? {
                    background: "rgba(255,255,255,0.18)",
                    border: "1px solid rgba(255,255,255,0.28)",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                  }
                : { background: "transparent", border: "1px solid transparent" }
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full"
                    style={{ background: "white" }}
                  />
                )}
                <Icon
                  className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110"
                  style={{ opacity: isActive ? 1 : 0.7 }}
                />
                <span className="truncate">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div
        className="px-3 pb-6 pt-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}
      >
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group"
          style={{ color: "rgba(255,255,255,0.6)", border: "1px solid transparent" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.12)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
            e.currentTarget.style.color = "white";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "transparent";
            e.currentTarget.style.color = "rgba(255,255,255,0.6)";
          }}
        >
          <LogOut className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}