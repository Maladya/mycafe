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

// ── Admin Layout ──────────────────────────────────────────────────────────────
import AdminPanel from "./Admin/AdminPanel.jsx";

// ── Admin Pages ───────────────────────────────────────────────────────────────
import Dashboard    from "./Admin/pages/Dashboard.jsx";
import KelolaMenu   from "./Admin/pages/KelolaMenu.jsx";
import KelolaOrders from "./Admin/pages/KelolaOrders.jsx";
import KelolaMeja   from "./Admin/pages/KelolaMeja.jsx";
import KelolaPromo  from "./Admin/pages/KelolaPromo.jsx";
import Laporan      from "./Admin/pages/Laporan.jsx";
import Payment      from "./Admin/pages/Payment.jsx";
import Pengaturan   from "./Admin/pages/Pengaturan.jsx";
import Billing      from "./Admin/pages/KelolaBilling.jsx";

// ── User ──────────────────────────────────────────────────────────────────────
import Home                 from "./User/Index.jsx";
import MenuPage             from "./User/Search.jsx";
import MenuDetail           from "./User/MenuDetail.jsx";
import PesananUser          from "./User/Pesanan.jsx";
import PembayaranUser       from "./User/Pembayaran.jsx";
import RingkasanPesananUser from "./User/RingkasanPesanan.jsx";

function ProtectedRoute() {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/user" replace />;
  return <Outlet />;
}

const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/user" replace /> },

  { path: "/user/table/:tableId", element: <Home /> },
  { path: "/login",  element: <LoginPage /> },
  { path: "/daftar", element: <Daftar /> },

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
          { path: "/admin/laporan",    element: <Laporan /> },
          { path: "/admin/payment",    element: <Payment /> },
          { path: "/admin/pengaturan", element: <Pengaturan /> },
          { path: "/admin/billing",    element: <Billing /> },
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
