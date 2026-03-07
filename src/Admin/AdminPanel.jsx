import { useState, useEffect, createContext, useContext, useMemo } from "react";

import { Outlet, useNavigate, useLocation } from "react-router-dom";



import { Toast } from "./components/SharedComponents";

import { Sidebar, Header } from "./components/Sidebar";



const API_URL = import.meta.env.VITE_API_URL ?? "http://192.168.1.13:3000";

const THEME_CACHE_KEY = "astakira_admin_theme";



// Theme utilities

function parseTheme(raw) {

  const DEF = { primary: "#f59e0b", secondary: "#ea580c", bg: "#f9fafb", text: "#111827" };

  if (!raw) return DEF;

  try {

    const p = typeof raw === "string" ? JSON.parse(raw) : raw;

    return { primary: p.primary ?? DEF.primary, secondary: p.secondary ?? DEF.secondary,

             bg: p.bg ?? DEF.bg, text: p.text ?? DEF.text };

  } catch { return DEF; }

}



function contrast(hex) {

  try {

    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);

    return (0.299*r + 0.587*g + 0.114*b)/255 > 0.55 ? "#111827" : "#ffffff";

  } catch { return "#ffffff"; }

}



function ha(hex, a) {

  try {

    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);

    return `rgba(${r},${g},${b},${a})`;

  } catch { return hex; }

}



function applyThemeVars(theme) {

  const onP = contrast(theme.primary);

  const vars = [

    `--p:${theme.primary}`, `--s:${theme.secondary}`, `--bg:${theme.bg}`, `--tx:${theme.text}`,

    `--on-p:${onP}`, `--p-20:${ha(theme.primary, 0.2)}`,

    `--bg-soft:${ha(theme.primary, 0.07)}`,

    `--grad:linear-gradient(135deg,${theme.primary},${theme.secondary})`,

  ].join(";");

  document.documentElement.setAttribute("style", vars);

}



// Inject tema dari cache SEBELUM render pertama

try {

  const cached = localStorage.getItem(THEME_CACHE_KEY);

  if (cached) applyThemeVars(JSON.parse(cached));

} catch {}



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

  const [cafeRaw,     setCafeRaw]     = useState(null);



  const getAuthHeader = () => ({

    "Content-Type": "application/json",

    Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,

  });



  // Fetch cafe settings for theme

  const fetchCafeSettings = async () => {

    try {

      const user = JSON.parse(localStorage.getItem("user") || "{}");

      const cafeId = user?.cafe_id ?? user?.id ?? "";

      if (!cafeId) return;

      

      const res = await fetch(`${API_URL}/api/pengaturan/user/${cafeId}`, { headers: getAuthHeader() });

      if (res.ok) {

        const data = await res.json();

        const cafe = data.data ?? data ?? null;

        setCafeRaw(cafe);

        if (cafe?.tema_colors) {

          const theme = parseTheme(cafe.tema_colors);

          applyThemeVars(theme);

          try { localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(theme)); } catch {}

        }

      }

    } catch (err) {

      console.error("Failed to fetch cafe settings:", err);

    }

  };



  useEffect(() => { fetchCafeSettings(); }, []);



  const fetchAll = async () => {

    setLoading(true);

    try {

      const [ordersRes, menuRes, tablesRes, promoRes] = await Promise.allSettled([
        fetch(`${API_URL}/api/orders`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/api/menu`,   { headers: getAuthHeader() }),
        fetch(`${API_URL}/api/tables`, { headers: getAuthHeader() }),
        fetch(`${API_URL}/api/promo`,  { headers: getAuthHeader() }),
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

      <div className="flex h-screen overflow-hidden font-sans" style={{ background: "var(--bg, #f9fafb)", color: "var(--tx, #111827)" }}>

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

