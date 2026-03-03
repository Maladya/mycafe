import { useState, useEffect, createContext, useContext } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

import { Toast } from "./components/SharedComponents";
import { Sidebar, Header } from "./components/Sidebar";

const API_URL = import.meta.env.VITE_API_URL ?? "http://192.168.1.9:3000";

export const AdminContext = createContext(null);
export const useAdmin = () => useContext(AdminContext);

export default function AdminPanel() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast,       setToast]       = useState(null);
  const [orders,      setOrders]      = useState([]);
  const [menuItems,   setMenuItems]   = useState([]);
  const [tables,      setTables]      = useState([]);
  const [promoCodes,  setPromoCodes]  = useState([]);
  const [loading,     setLoading]     = useState(true);

  const getAuthHeader = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
  });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [ordersRes, menuRes, tablesRes, promoRes] = await Promise.allSettled([
        fetch(`${API_URL}/orders`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/api/menu`,   { headers: getAuthHeader() }),
        fetch(`${API_URL}/meja`,   { headers: getAuthHeader() }),
        fetch(`${API_URL}/promo`,  { headers: getAuthHeader() }),
      ]);

      const parse = async (res) => {
        if (res.status === "fulfilled" && res.value.ok) {
          const d = await res.value.json();
          return d.data ?? d ?? [];
        }
        if (res.status === "fulfilled" && res.value.status === 401) handleLogout();
        return [];
      };

      setOrders(    await parse(ordersRes));
      setMenuItems( await parse(menuRes));
      setTables(    await parse(tablesRes));
      setPromoCodes(await parse(promoRes));
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []); // eslint-disable-line

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = () => {
    ["token", "refresh_token", "user", "cafe"].forEach(k => localStorage.removeItem(k));
    navigate("/login", { replace: true });
  };

  const activePageKey = location.pathname.replace("/admin/", "") || "dashboard";

  return (
    <AdminContext.Provider value={{
      orders,     setOrders,
      menuItems,  setMenuItems,
      tables,     setTables,
      promoCodes, setPromoCodes,
      loading,
      showToast,
      fetchAll,
      apiUrl:     API_URL,
      authHeader: getAuthHeader(),
    }}>
      <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
        <Sidebar
          activePage={activePageKey}
          setActivePage={(page) => { navigate(`/admin/${page}`); setSidebarOpen(false); }}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          menuItems={menuItems}
          orders={orders}
          promoCodes={promoCodes}
          onLogout={handleLogout}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header
            activePage={activePageKey}
            setSidebarOpen={setSidebarOpen}
            orders={orders}
            setActivePage={(page) => navigate(`/admin/${page}`)}
          />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>

        {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .animate-slideInRight { animation: slideInRight 0.3s cubic-bezier(0.16,1,0.3,1); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </AdminContext.Provider>
  );
}
