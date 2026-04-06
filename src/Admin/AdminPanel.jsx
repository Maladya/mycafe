import { useState, useEffect, createContext, useContext, useMemo } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { LogOut, X, Shield } from "lucide-react";

import { Toast } from "./components/SharedComponents";
import { Sidebar, Header } from "./components/Sidebar";
import MaintenanceBanner from "../components/MaintenanceBanner";

const API_URL = import.meta.env.VITE_API_URL ?? "https://www.mycafe-order.net/";
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

/* ── Logout Confirmation Modal ───────────────────────────────────── */
function LogoutModal({ visible, onConfirm, onCancel }) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(5px)",
        animation: "fadeIn 0.2s ease forwards",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "rgba(22,22,32,0.98)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "20px",
          padding: "32px 28px",
          width: "300px",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          animation: "popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Icon */}
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "rgba(239,68,68,0.15)",
            border: "1px solid rgba(239,68,68,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <LogOut size={24} color="#ef4444" />
        </div>

        <h3 style={{ color: "white", fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>
          Keluar dari Akun?
        </h3>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", lineHeight: 1.6, marginBottom: "24px" }}>
          Anda akan keluar dari sesi ini dan diarahkan ke halaman login.
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.7)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={e => e.target.style.background = "rgba(255,255,255,0.1)"}
            onMouseLeave={e => e.target.style.background = "rgba(255,255,255,0.06)"}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              color: "white",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(239,68,68,0.3)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={e => e.target.style.opacity = "0.88"}
            onMouseLeave={e => e.target.style.opacity = "1"}
          >
            Ya, Keluar
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes popIn {
          0%   { transform: scale(0.88) translateY(8px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────── */
export default function AdminPanel() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [toast,         setToast]         = useState(null);
  const [orders,        setOrders]        = useState([]);
  const [menuItems,     setMenuItems]     = useState([]);
  const [tables,        setTables]        = useState([]);
  const [promoCodes,    setPromoCodes]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [cafeRaw,       setCafeRaw]       = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const [subscriptionActive, setSubscriptionActive] = useState(true);
  const [subscriptionGate, setSubscriptionGate] = useState({
    reason: "",
    status: "",
    active_until: null,
    message: "",
  });

  const getAuthHeader = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
  });

  const isSubActive = (me) => {
    const st = String(me?.status ?? "").toLowerCase();
    return st === "active" || Boolean(me?.is_active ?? me?.isActive);
  };

  const checkSubscription = async () => {
    try {
      const res = await fetch(`${API_URL}/api/subscriptions/me`, { headers: getAuthHeader() });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const reason = data?.reason || data?.code || "";
        const status = data?.status || "";
        const activeUntil = data?.active_until ?? data?.activeUntil ?? null;
        const message = data?.message || "";

        if (res.status === 402 || reason === "subscription_required") {
          setSubscriptionGate({ reason: "subscription_required", status, active_until: activeUntil, message });
          setSubscriptionActive(false);
          setSubscriptionChecked(true);
          return;
        }

        // Kalau endpoint belum tersedia/ada masalah, jangan memblokir UI total
        setSubscriptionGate({ reason: "", status: "", active_until: null, message: "" });
        setSubscriptionActive(true);
        setSubscriptionChecked(true);
        return;
      }

      const me = data?.data ?? data;
      const ok = isSubActive(me);
      setSubscriptionGate({
        reason: ok ? "" : "subscription_required",
        status: String(me?.status ?? "") || (ok ? "active" : "inactive"),
        active_until: me?.active_until ?? me?.activeUntil ?? me?.expired_at ?? me?.expiredAt ?? null,
        message: "",
      });
      setSubscriptionActive(ok);
      setSubscriptionChecked(true);
    } catch {
      setSubscriptionActive(true);
      setSubscriptionChecked(true);
    }
  };

  useEffect(() => {
    checkSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Gating: jika langganan belum aktif, paksa ke halaman billing
    if (!subscriptionChecked) return;
    if (subscriptionActive) return;

    const path = location.pathname || "";
    if (!path.startsWith("/admin")) return;
    if (path === "/admin/billing") return;

    navigate("/admin/billing", { replace: true });
  }, [subscriptionChecked, subscriptionActive, location.pathname, navigate]);

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
        if (res.status === "fulfilled" && res.value.status === 401) doLogout();
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

  // Actual logout (called after confirm)
  const doLogout = () => {
    ["token", "refresh_token", "user", "cafe"].forEach(k => localStorage.removeItem(k));
    navigate("/login", { replace: true });
  };

  const formatActiveUntil = (raw) => {
    if (!raw) return "-";
    try {
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return String(raw);
      return d.toLocaleString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return String(raw);
    }
  };

  // Show modal instead of logging out directly
  const handleLogout = () => setShowLogoutModal(true);

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
      cafeRaw,
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
          cafeRaw={cafeRaw}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header
            activePage={activePageKey}
            setSidebarOpen={setSidebarOpen}
            orders={orders}
            setActivePage={(page) => navigate(`/admin/${page}`)}
            cafeRaw={cafeRaw}
          />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>

        {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
        <MaintenanceBanner />
      </div>

      {subscriptionChecked && !subscriptionActive && location.pathname !== "/admin/billing" && (
        <div
          className="fixed inset-0 z-[9998] flex flex-col items-center justify-center p-6"
          style={{ background: "rgba(10,10,20,0.92)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="bg-gray-900 border border-amber-500/30 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
            style={{ boxShadow: "0 0 60px rgba(245,158,11,0.12)" }}
          >
            <div className="w-20 h-20 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-5">
              <Shield size={36} className="text-amber-400" />
            </div>
            <h2 className="text-white text-2xl font-black mb-2 tracking-tight">
              Langganan Diperlukan
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              Akses Admin dikunci karena langganan cafe kamu tidak aktif atau sudah berakhir.
            </p>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left mb-6">
              <p className="text-[11px] text-gray-400 font-semibold">Status</p>
              <p className="text-sm text-white font-bold">
                {subscriptionGate.status ? String(subscriptionGate.status).toUpperCase() : "TIDAK AKTIF"}
              </p>
              <p className="text-[11px] text-gray-400 font-semibold mt-3">Aktif sampai</p>
              <p className="text-sm text-white font-bold">{formatActiveUntil(subscriptionGate.active_until)}</p>
              {subscriptionGate.message ? (
                <p className="text-[11px] text-amber-300 font-semibold mt-3">{subscriptionGate.message}</p>
              ) : null}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/admin/billing", { replace: true })}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl py-3 font-black shadow-lg hover:shadow-xl transition-all"
              >
                Bayar Langganan
              </button>
              <button
                onClick={doLogout}
                className="flex-1 border-2 border-white/10 text-gray-200 rounded-xl py-3 font-semibold hover:bg-white/5 transition-all"
              >
                Logout
              </button>
            </div>
            <p className="text-gray-500 text-[11px] mt-5">
              Jika pembayaran sudah dilakukan, buka halaman Langganan lalu klik “Cek Status Pembayaran”.
            </p>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <LogoutModal
        visible={showLogoutModal}
        onConfirm={doLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

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