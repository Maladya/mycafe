import { useState, useEffect, createContext, useContext } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import SuperAdminSidebar from "./components/Sidebar";
import SuperAdminHeader from "./components/Header";
import Toast from "./components/Toast";

const API_URL = import.meta.env.VITE_API_URL ?? "https://www.mycafe-order.net";

export const SuperAdminContext = createContext(null);
export const useSuperAdmin = () => useContext(SuperAdminContext);

export default function SuperAdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("superadmin_token");
    if (!token) {
      navigate("/superadmin/login", { replace: true });
    }
  }, [navigate]);

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem("superadmin_token");
    localStorage.removeItem("superadmin_user");
    navigate("/superadmin/login", { replace: true });
  };

  const getAuthHeader = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("superadmin_token") || ""}`,
  });

  const activePage = location.pathname.split("/").pop() || "dashboard";

  return (
    <SuperAdminContext.Provider
      value={{
        showToast,
        loading,
        setLoading,
        apiUrl: API_URL,
        authHeader: getAuthHeader(),
      }}
    >
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <SuperAdminSidebar
          activePage={activePage}
          setActivePage={(page) => navigate(`/superadmin/${page}`)}
          onLogout={handleLogout}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <SuperAdminHeader activePage={activePage} setSidebarOpen={setSidebarOpen} />
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
      `}</style>
    </SuperAdminContext.Provider>
  );
}
