import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from "react-router-dom";

// ── Auth ──────────────────────────────────────────────────────────────────────
import LoginPage from "./Admin/LoginPage.jsx";
import Daftar    from "./daftar.jsx";

// ── SuperAdmin ────────────────────────────────────────────────────────────────
import SuperAdminLogin from "./SuperAdmin/LoginPage.jsx";
import SuperAdminLayout from "./SuperAdmin/SuperAdminLayout.jsx";
import SuperAdminDashboard from "./SuperAdmin/pages/Dashboard.jsx";
import ManageCafes from "./SuperAdmin/pages/ManageCafes.jsx";
import ManageAdmins from "./SuperAdmin/pages/Admins.jsx";
import Reports from "./SuperAdmin/pages/Reports.jsx";
import Analytics from "./SuperAdmin/pages/Analytics.jsx";
import SuperAdminSettings from "./SuperAdmin/pages/Settings.jsx";

// ── Admin Layout ──────────────────────────────────────────────────────────────
import AdminPanel from "./Admin/AdminPanel.jsx";

// ── Admin Pages ───────────────────────────────────────────────────────────────
import Dashboard    from "./Admin/pages/Dashboard.jsx";
import KelolaMenu   from "./Admin/pages/KelolaMenu.jsx";
import KelolaOrders from "./Admin/pages/KelolaOrders.jsx";
import KelolaMeja   from "./Admin/pages/KelolaMeja.jsx";
import KelolaPromo  from "./Admin/pages/KelolaPromo.jsx";
import Payment      from "./Admin/pages/Payment.jsx";
import Pengaturan   from "./Admin/pages/Pengaturan.jsx";
import Billing      from "./Admin/pages/KelolaBilling.jsx";
import Kasir        from "./Admin/pages/Kasir.jsx";
import KelolaKasir  from "./Admin/pages/KelolaKasir.jsx";
import KasirLayout  from "./Admin/KasirLayout.jsx";

// ── User ──────────────────────────────────────────────────────────────────────
import Home                 from "./User/Index.jsx";
import MenuPage             from "./User/Search.jsx";
import MenuDetail           from "./User/MenuDetail.jsx";
import PesananUser          from "./User/Pesanan.jsx";
import PembayaranUser       from "./User/Pembayaran.jsx";
import RingkasanPesananUser from "./User/RingkasanPesanan.jsx";

function ProtectedRoute() {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function KasirProtectedRoute() {
  const token = localStorage.getItem("kasir_token") || localStorage.getItem("token");
  const userStr = localStorage.getItem("kasir_user") || localStorage.getItem("user");
  
  if (!token) return <Navigate to="/login" replace />;
  
  try {
    const userData = JSON.parse(userStr || "{}");
    const role = userData?.role?.toLowerCase();
    
    // Only allow kasir, admin, or staff
    if (role !== "kasir" && role !== "admin" && role !== "staff") {
      return <Navigate to="/login" replace />;
    }
  } catch {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
}

function SuperAdminProtectedRoute() {
  const token = localStorage.getItem("superadmin_token");
  if (!token) return <Navigate to="/superadmin/login" replace />;
  return <Outlet />;
}

const navLabels = {
  dashboard:  "Dashboard",
  menu:       "Kelola Menu",
  orders:     "Pesanan",
  tables:     "Meja",
  promo:      "Promo",
  payment:    "Pembayaran",
  pengaturan: "Pengaturan",
  billing:    "Langganan",
};

const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },

  { path: "/user/table/:tableId", element: <Home /> },
  { path: "/login",  element: <LoginPage /> },
  { path: "/daftar", element: <Daftar /> },

  // ── SuperAdmin Routes ─────────────────────────────────────────────────────
  { path: "/superadmin/login", element: <SuperAdminLogin /> },
  {
    element: <SuperAdminProtectedRoute />,
    children: [
      {
        element: <SuperAdminLayout />,
        children: [
          { path: "/superadmin", element: <Navigate to="/superadmin/dashboard" replace /> },
          { path: "/superadmin/dashboard", element: <SuperAdminDashboard /> },
          { path: "/superadmin/cafes", element: <ManageCafes /> },
          { path: "/superadmin/admins", element: <ManageAdmins /> },
          { path: "/superadmin/reports", element: <Reports /> },
          { path: "/superadmin/analytics", element: <Analytics /> },
          { path: "/superadmin/settings", element: <SuperAdminSettings /> },
        ],
      },
    ],
  },

  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminPanel />,
        children: [
          { path: "/admin",            element: <Navigate to="/admin/dashboard" replace /> },
          { path: "/admin/dashboard",  element: <Dashboard /> },
          { path: "/admin/menu",       element: <KelolaMenu /> },
          { path: "/admin/orders",     element: <KelolaOrders /> },
          { path: "/admin/tables",     element: <KelolaMeja /> },
          { path: "/admin/promo",      element: <KelolaPromo /> },
          { path: "/admin/laporan",    element: <Navigate to="/admin/dashboard" replace /> },
          { path: "/admin/payment",    element: <Payment /> },
          { path: "/admin/pengaturan", element: <Pengaturan /> },
          { path: "/admin/billing",    element: <Billing /> },
          { path: "/admin/kasir-users", element: <KelolaKasir /> },
        ],
      },
      // Kasir route - protected and only for kasir role
      {
        element: <KasirProtectedRoute />,
        children: [
          { path: "/kasir", element: <Kasir /> },
          {
            element: <KasirLayout />,
            children: [
              {
                path: "/kasir/orders",
                element: (
                  <KelolaOrders
                    tokenKey="kasir_token"
                    endpointPath="/api/orders/admin"
                    statusMode="active"
                    allowMarkSelesai
                    pageTitle="Kelola Pesanan Kasir"
                    pageSubtitle="Pantau pesanan aktif dan selesaikan langsung dari terminal kasir"
                  />
                ),
              },
            ],
          },
        ],
      },
    ],
  },

  { path: "/user",             element: <Home /> },
  { path: "/search",           element: <MenuPage /> },
  { path: "/menu-detail",      element: <MenuDetail /> },
  { path: "/pesanan",          element: <PesananUser /> },
  { path: "/pembayaran",       element: <PembayaranUser /> },
  { path: "/ringkasanpesanan", element: <RingkasanPesananUser /> },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
